#!/usr/bin/env node
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const repoRoot = resolve(dirname(new URL(import.meta.url).pathname), '..')
const packagesRoot = join(repoRoot, 'packages')
const keepTemp = process.argv.includes('--keep')

const requiredTemplateDevDeps = ['@iconify-json/carbon', 'sass', 'unocss']
const knownFailurePatterns = [
  /Cannot find module/i,
  /does not provide an export named/i,
  /Package subpath .* is not defined by "exports"/i,
  /Preprocessor dependency .* not found/i,
  /Config file not found/i,
  /failed to load icon/i,
  /Failed to resolve extends base type/i,
  /\bERR_MODULE_NOT_FOUND\b/i,
  /\bERR_PACKAGE_PATH_NOT_EXPORTED\b/i
]

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function writeJson(path, value) {
  writeFileSync(path, JSON.stringify(value, null, 2) + '\n')
}

function parsePnpmPackJson(output) {
  const trimmed = output.trim()
  const jsonStart = trimmed.lastIndexOf('\n{')
  const jsonText = jsonStart >= 0 ? trimmed.slice(jsonStart + 1) : trimmed
  const parsed = JSON.parse(jsonText)
  return Array.isArray(parsed) ? parsed[0] : parsed
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || repoRoot,
    encoding: 'utf8',
    stdio: options.capture ? 'pipe' : 'inherit',
    env: { ...process.env, ...options.env }
  })

  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join('')
    throw new Error(`${command} ${args.join(' ')} failed${options.cwd ? ` in ${options.cwd}` : ''}\n${output}`)
  }

  if (options.stdoutOnly) return result.stdout
  return [result.stdout, result.stderr].filter(Boolean).join('')
}

async function discoverPackages() {
  const entries = await readdir(packagesRoot, { withFileTypes: true })
  const packages = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const dir = join(packagesRoot, entry.name)
    const manifestPath = join(dir, 'package.json')
    if (!existsSync(manifestPath)) continue

    const manifest = readJson(manifestPath)
    if (manifest.publishConfig?.access !== 'public') continue

    packages.push({ dir, manifest })
  }

  return packages.sort((a, b) => a.manifest.name.localeCompare(b.manifest.name))
}

function packPackage(pkg, tarballDir) {
  const output = run('pnpm', ['--dir', pkg.dir, 'pack', '--pack-destination', tarballDir, '--json'], {
    capture: true,
    stdoutOnly: true
  })
  const pack = parsePnpmPackJson(output)
  const tarballPath = join(tarballDir, basename(pack.filename))

  if (!existsSync(tarballPath)) {
    throw new Error(`Expected tarball not found for ${pkg.manifest.name}: ${tarballPath}`)
  }

  return tarballPath
}

function tarballSpec(path) {
  return `file:${path}`
}

function assertTemplateDeps(consumerManifest) {
  const devDeps = consumerManifest.devDependencies || {}
  const missing = requiredTemplateDevDeps.filter((name) => !devDeps[name])
  if (missing.length > 0) {
    throw new Error(
      `Scaffold template is missing required devDependencies: ${missing.join(', ')}. ` +
        'Do not patch these in the validator; fix packages/create-vitepress-theme-link/public/template/package.json.'
    )
  }
}

function assertNoKnownFailure(output) {
  const matches = knownFailurePatterns.filter((pattern) => pattern.test(output))
  if (matches.length > 0) {
    throw new Error(
      `Consumer build output matched known package-regression pattern(s): ${matches.map(String).join(', ')}\n\n` +
        output
    )
  }
}

const packages = await discoverPackages()
const packageByName = new Map(packages.map((pkg) => [pkg.manifest.name, pkg]))
const requiredPackages = [
  'create-vitepress-theme-link',
  'vitepress-theme-link',
  'vitepress-plugin-analyzer',
  'vitepress-plugin-callouts',
  'vitepress-plugin-codeblock-fold',
  'vitepress-plugin-config',
  'vitepress-plugin-details-block',
  'vitepress-plugin-hashtag',
  'vitepress-plugin-image-dimension'
]

for (const name of requiredPackages) {
  if (!packageByName.has(name)) {
    throw new Error(`Required publishable package not found: ${name}`)
  }
}

const tempRoot = mkdtempSync(join(tmpdir(), 'vitepress-theme-link-consumer-'))
const tarballDir = join(tempRoot, 'tarballs')
const consumerParent = join(tempRoot, 'consumer')

try {
  run('mkdir', ['-p', tarballDir, consumerParent])

  console.log(`Packing ${packages.length} publishable packages into ${tarballDir}...`)
  const tarballs = new Map()
  for (const pkg of packages) {
    const tarball = packPackage(pkg, tarballDir)
    tarballs.set(pkg.manifest.name, tarball)
    console.log(`✓ ${pkg.manifest.name} -> ${relative(tempRoot, tarball)}`)
  }

  const createPackage = packageByName.get('create-vitepress-theme-link')
  const cliPath = join(createPackage.dir, 'dist/index.js')
  if (!existsSync(cliPath)) {
    throw new Error(`Scaffold CLI build output is missing: ${cliPath}. Run pnpm build first.`)
  }

  console.log('Scaffolding fresh consumer project...')
  run('node', [cliPath, 'consumer-app'], { cwd: consumerParent })

  const consumerDir = join(consumerParent, 'consumer-app')
  const consumerManifestPath = join(consumerDir, 'package.json')
  const consumerManifest = readJson(consumerManifestPath)
  assertTemplateDeps(consumerManifest)

  consumerManifest.dependencies = {
    ...(consumerManifest.dependencies || {}),
    'vitepress-theme-link': tarballSpec(tarballs.get('vitepress-theme-link'))
  }

  const overrides = {}

  for (const [name, tarball] of tarballs) {
    if (name === 'create-vitepress-theme-link' || name === 'vitepress-theme-link') continue
    overrides[name] = tarballSpec(tarball)
  }

  writeJson(consumerManifestPath, consumerManifest)
  writeFileSync(
    join(consumerDir, 'pnpm-workspace.yaml'),
    `packages:\n  - .\n\nallowBuilds:\n  '@parcel/watcher': true\n  esbuild: true\n  sharp: true\n\noverrides:\n${Object.entries(overrides)
      .map(([name, spec]) => `  ${name}: ${spec}`)
      .join('\n')}\n`
  )

  console.log('Installing fresh consumer dependencies...')
  run('pnpm', ['install'], { cwd: consumerDir })

  console.log('Building fresh consumer project from packed artifacts...')
  const buildOutput = run('pnpm', ['build'], { cwd: consumerDir, capture: true })
  process.stdout.write(buildOutput)
  assertNoKnownFailure(buildOutput)

  console.log('\nConsumer package validation passed.')
  console.log(`Temp workspace: ${tempRoot}${keepTemp ? '' : ' (removed)'}`)
} catch (error) {
  console.error('\nConsumer package validation failed.')
  console.error(error.message)
  console.error(`Temp workspace kept for debugging: ${tempRoot}`)
  process.exitCode = 1
} finally {
  if (!keepTemp && process.exitCode !== 1) {
    rmSync(tempRoot, { recursive: true, force: true })
  }
}
