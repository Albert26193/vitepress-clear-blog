#!/usr/bin/env node
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'

const repoRoot = resolve(dirname(new URL(import.meta.url).pathname), '..')
const packagesRoot = join(repoRoot, 'packages')
const exportConditions = new Set(['types', 'import', 'require', 'default', 'node', 'browser', 'development', 'production'])

const suspiciousPatterns = [
  /^node_modules\//,
  /(^|\/)\.env(?:\.|$)/,
  /(^|\/)coverage\//,
  /(^|\/)test-results\//,
  /(^|\/)playwright-report\//,
  /(^|\/)\.turbo\//,
  /(^|\/)\.vitepress\/(cache|dist|temp)\//,
  /(^|\/)\.DS_Store$/,
  /\.log$/,
  /(^|\/)pnpm-lock\.yaml$/,
  /(^|\/)(__tests__|__mocks__)\//,
  /(^|\/)(test|tests|e2e)\//,
  /\.(test|spec)\.[cm]?[jt]sx?$/
]

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function parsePnpmPackJson(output) {
  const trimmed = output.trim()
  const jsonStart = trimmed.lastIndexOf('\n{')
  const jsonText = jsonStart >= 0 ? trimmed.slice(jsonStart + 1) : trimmed
  const parsed = JSON.parse(jsonText)
  return Array.isArray(parsed) ? parsed[0] : parsed
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

    packages.push({ dir, manifest, manifestPath })
  }

  return packages.sort((a, b) => a.manifest.name.localeCompare(b.manifest.name))
}

function normalizePackagePath(value) {
  return value.replace(/^\.\//, '').replace(/^package\//, '')
}

function addTarget(targets, field, value) {
  if (typeof value !== 'string') return
  if (!value || value.startsWith('#')) return
  targets.push({ field, path: normalizePackagePath(value) })
}

function collectExportTargets(exportsField, prefix = 'exports', targets = []) {
  if (typeof exportsField === 'string') {
    addTarget(targets, prefix, exportsField)
    return targets
  }

  if (!exportsField || typeof exportsField !== 'object') return targets

  for (const [key, value] of Object.entries(exportsField)) {
    const nextPrefix = exportConditions.has(key) ? `${prefix}.${key}` : `${prefix}[${key}]`
    collectExportTargets(value, nextPrefix, targets)
  }

  return targets
}

function collectTypesVersionsTargets(typesVersions, targets) {
  if (!typesVersions || typeof typesVersions !== 'object') return

  for (const [versionRange, mappings] of Object.entries(typesVersions)) {
    if (!mappings || typeof mappings !== 'object') continue
    for (const [pattern, values] of Object.entries(mappings)) {
      const list = Array.isArray(values) ? values : [values]
      for (const value of list) {
        addTarget(targets, `typesVersions[${versionRange}][${pattern}]`, value)
      }
    }
  }
}

function collectTargets(manifest) {
  const targets = []
  collectExportTargets(manifest.exports, 'exports', targets)
  addTarget(targets, 'main', manifest.main)
  addTarget(targets, 'module', manifest.module)
  addTarget(targets, 'types', manifest.types)

  if (typeof manifest.bin === 'string') {
    addTarget(targets, 'bin', manifest.bin)
  } else if (manifest.bin && typeof manifest.bin === 'object') {
    for (const [name, value] of Object.entries(manifest.bin)) {
      addTarget(targets, `bin[${name}]`, value)
    }
  }

  collectTypesVersionsTargets(manifest.typesVersions, targets)

  const seen = new Set()
  return targets.filter((target) => {
    const key = `${target.field}:${target.path}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function runPackDryRun(packageDir) {
  const result = spawnSync('pnpm', ['--dir', packageDir, 'pack', '--dry-run', '--json'], {
    cwd: repoRoot,
    encoding: 'utf8'
  })

  if (result.status !== 0) {
    throw new Error(`pnpm pack --dry-run failed:\n${result.stdout}${result.stderr}`)
  }

  try {
    const pack = parsePnpmPackJson(result.stdout)
    return new Set((pack.files || []).map((file) => normalizePackagePath(file.path)))
  } catch (error) {
    throw new Error(`Unable to parse pnpm pack --dry-run --json output: ${error.message}\n${result.stdout}`)
  }
}

function packAndReadManifest(packageDir, tmpRoot) {
  const result = spawnSync('pnpm', ['--dir', packageDir, 'pack', '--pack-destination', tmpRoot, '--json'], {
    cwd: repoRoot,
    encoding: 'utf8'
  })

  if (result.status !== 0) {
    throw new Error(`pnpm pack failed:\n${result.stdout}${result.stderr}`)
  }

  const pack = parsePnpmPackJson(result.stdout)
  const tarball = resolve(packageDir, pack.filename)
  const tarballPath = existsSync(tarball) ? tarball : join(tmpRoot, basename(pack.filename))
  const manifestText = execFileSync('tar', ['-xOf', tarballPath, 'package/package.json'], {
    cwd: repoRoot,
    encoding: 'utf8'
  })

  return JSON.parse(manifestText)
}

function findSuspiciousFiles(files) {
  return [...files].filter((file) => suspiciousPatterns.some((pattern) => pattern.test(file)))
}

function findWorkspaceSpecs(value, path = [], found = []) {
  if (!value || typeof value !== 'object') return found

  for (const [key, child] of Object.entries(value)) {
    if (typeof child === 'string' && child.startsWith('workspace:')) {
      found.push(`${path.concat(key).join('.')}: ${child}`)
    } else if (child && typeof child === 'object') {
      findWorkspaceSpecs(child, path.concat(key), found)
    }
  }

  return found
}

function validatePackage(pkg, tmpRoot) {
  const errors = []
  const targets = collectTargets(pkg.manifest)
  let files
  let packedManifest

  try {
    files = runPackDryRun(pkg.dir)
  } catch (error) {
    errors.push(error.message)
    return { errors, targetCount: targets.length, fileCount: 0 }
  }

  for (const target of targets) {
    if (!files.has(target.path)) {
      errors.push(`${target.field} points to ${target.path}, but it is not included in the packed files`)
    }
  }

  for (const file of findSuspiciousFiles(files)) {
    errors.push(`Suspicious file included in package: ${file}`)
  }

  try {
    packedManifest = packAndReadManifest(pkg.dir, tmpRoot)
  } catch (error) {
    errors.push(error.message)
  }

  if (packedManifest) {
    const workspaceSpecs = findWorkspaceSpecs({
      dependencies: packedManifest.dependencies,
      devDependencies: packedManifest.devDependencies,
      peerDependencies: packedManifest.peerDependencies,
      optionalDependencies: packedManifest.optionalDependencies
    })

    for (const spec of workspaceSpecs) {
      errors.push(`Workspace protocol was not rewritten in packed manifest: ${spec}`)
    }
  }

  return { errors, targetCount: targets.length, fileCount: files.size }
}

const packages = await discoverPackages()
if (packages.length === 0) {
  console.error('No publishable packages found under packages/*.')
  process.exit(1)
}

const tmpRoot = mkdtempSync(join(tmpdir(), 'vitepress-theme-link-packages-'))
const failures = []

try {
  console.log(`Validating ${packages.length} publishable packages...`)

  for (const pkg of packages) {
    const result = validatePackage(pkg, tmpRoot)
    const rel = relative(repoRoot, pkg.dir)

    if (result.errors.length > 0) {
      failures.push({ name: pkg.manifest.name, rel, errors: result.errors })
      console.log(`✗ ${pkg.manifest.name} (${rel}) — ${result.errors.length} issue(s)`)
    } else {
      console.log(`✓ ${pkg.manifest.name} (${rel}) — ${result.fileCount} files, ${result.targetCount} targets`)
    }
  }
} finally {
  rmSync(tmpRoot, { recursive: true, force: true })
}

if (failures.length > 0) {
  console.error('\nPackage validation failed:')
  for (const failure of failures) {
    console.error(`\n${failure.name} (${failure.rel})`)
    for (const error of failure.errors) {
      console.error(`  - ${error}`)
    }
  }
  process.exit(1)
}

console.log('\nPackage validation passed.')
