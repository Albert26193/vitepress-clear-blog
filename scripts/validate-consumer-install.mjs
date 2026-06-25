#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { spawn, spawnSync } from 'node:child_process'

import { chromium } from '@playwright/test'

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

function packDirectory(dir, tarballDir, name) {
  const output = run('pnpm', ['--dir', dir, 'pack', '--pack-destination', tarballDir, '--json'], {
    capture: true,
    stdoutOnly: true
  })
  const pack = parsePnpmPackJson(output)
  const tarballPath = join(tarballDir, basename(pack.filename))

  if (!existsSync(tarballPath)) {
    throw new Error(`Expected tarball not found for ${name}: ${tarballPath}`)
  }

  return tarballPath
}

function packPackage(pkg, tarballDir) {
  return packDirectory(pkg.dir, tarballDir, pkg.manifest.name)
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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Load each route in a headless browser and assert the Vue app actually mounts.
 * A dev server can serve HTTP 200 with a clean dependency-optimization log yet
 * still white-screen: the theme ships client code as source from node_modules,
 * where Vite does NOT rewrite bare CJS imports to optimized deps. A CJS-only
 * import (e.g. `dayjs/plugin/customParseFormat`, `lodash/debounce`) then throws
 * "does not provide an export named 'default'" at module-eval time, aborting
 * client mount. The dev-log scan cannot see that browser-side failure, so this
 * renders the page and checks `#app` has children and no uncaught page errors.
 */
async function assertRoutesMount(baseUrl, routes) {
  let browser
  try {
    browser = await chromium.launch()
  } catch (error) {
    throw new Error(
      'Could not launch headless Chromium for the dev mount check. ' +
        'Install it before running validate:consumer (e.g. `pnpm exec playwright install chromium`).\n\n' +
        error.message
    )
  }
  try {
    for (const route of routes) {
      const page = await browser.newPage()
      const pageErrors = []
      page.on('pageerror', (error) => pageErrors.push(error.message))
      try {
        await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle', timeout: 30000 })
      } catch (error) {
        pageErrors.push(`navigation: ${error.message}`)
      }
      // Give client JS time to evaluate and mount (or throw).
      await page.waitForTimeout(4000)
      const childCount = await page.evaluate(
        () => document.querySelector('#app')?.childElementCount ?? -1
      )
      await page.close()

      if (pageErrors.length > 0 || childCount <= 0) {
        throw new Error(
          `Consumer dev server white-screened on ${route} (app #app childCount=${childCount}). ` +
            'A theme client module likely failed to evaluate in the browser ' +
            '(commonly a CJS-only dependency with no ESM default export).\n\n' +
            (pageErrors.join('\n---\n') || '(no uncaught page error captured)')
        )
      }
    }
  } finally {
    await browser.close()
  }
}

/**
 * Start `vitepress dev` in the consumer project and exercise it the way a
 * browser would. The theme ships its client as source and imports build-time
 * virtual modules (virtual:uno.css, virtual:vitepress-analyzer), a `?url` asset
 * (heti), and VitePress content loaders. A fresh `pnpm build` can succeed (SSR
 * path) while `pnpm dev` fails, because Vite's dep optimizer cannot resolve
 * those theme imports unless the scaffold marks the theme noExternal.
 *
 * Two independent checks run here because they catch different failure modes:
 * (1) the dev server LOG after dep optimization — a broken scaffold logs
 * `error while updating dependencies` / `Could not resolve "virtual:uno.css"`;
 * (2) a real browser mount check — see assertRoutesMount, which catches the
 * white-screen class the log scan is blind to.
 */
async function validateDevServer(consumerDir) {
  const port = 5390
  const baseUrl = `http://localhost:${port}`
  console.log('Starting consumer dev server for runtime validation...')

  const devProcess = spawn(
    join(consumerDir, 'node_modules/.bin/vitepress'),
    ['dev', '--port', String(port)],
    { cwd: consumerDir, stdio: ['ignore', 'pipe', 'pipe'] }
  )

  let devOutput = ''
  devProcess.stdout.on('data', (chunk) => (devOutput += chunk))
  devProcess.stderr.on('data', (chunk) => (devOutput += chunk))

  const assertNoDevError = () => {
    const devErrorPatterns = [
      /error while updating dependencies/i,
      /Could not resolve ["']virtual:/i,
      /Could not read from file:.*\?url/i,
      /Failed to resolve import/i,
      /\[plugin:.*\] .*Could not resolve/i
    ]
    const hit = devErrorPatterns.find((pattern) => pattern.test(devOutput))
    if (hit) {
      throw new Error(
        `Consumer dev server failed to resolve theme client modules (matched ${hit}). ` +
          'The scaffold likely no longer marks vitepress-theme-link as noExternal.\n\n' +
          devOutput
      )
    }
  }

  try {
    // Wait for the dev server to accept requests (up to ~60s).
    let ready = false
    for (let attempt = 0; attempt < 30; attempt += 1) {
      await sleep(2000)
      if (devProcess.exitCode !== null) {
        throw new Error(`Dev server exited early (code ${devProcess.exitCode}).\n\n${devOutput}`)
      }
      try {
        const response = await fetch(`${baseUrl}/`)
        if (response.status === 200) {
          ready = true
          break
        }
      } catch {
        // server not up yet, keep polling
      }
    }

    if (!ready) {
      throw new Error(`Dev server did not become ready in time.\n\n${devOutput}`)
    }

    // Hit several routes to force Vite's dependency optimizer to scan and bundle
    // the theme's client entry — this is what surfaces the virtual-module /
    // ?url resolution failures into the dev log.
    const routes = ['/', '/example.html', '/about.html', '/timeline.html', '/tags.html']
    for (const route of routes) {
      try {
        await fetch(`${baseUrl}${route}`)
      } catch {
        // a 500/connection error here is captured via the dev log scan below
      }
    }

    // Give the optimizer time to run and log any failure, then assert.
    await sleep(8000)
    assertNoDevError()
    console.log('Consumer dev server resolved theme client modules cleanly.')

    // Render the routes in a real browser and assert the app mounts — this
    // catches white screens that the dev-log scan cannot see.
    await assertRoutesMount(baseUrl, ['/', '/example.html', '/about.html'])
    console.log('Consumer dev server mounted the Vue app in a browser cleanly.')
  } finally {
    devProcess.kill('SIGKILL')
  }
}

function prepareThemePackageWithLocalDependencies(pkg, patchedPackagesDir, tarballs) {
  const patchedDir = join(patchedPackagesDir, pkg.manifest.name)
  rmSync(patchedDir, { recursive: true, force: true })
  cpSync(pkg.dir, patchedDir, {
    recursive: true,
    filter: (source) => !source.includes('/node_modules')
  })

  const manifestPath = join(patchedDir, 'package.json')
  const manifest = readJson(manifestPath)
  const dependencies = { ...(manifest.dependencies || {}) }

  for (const name of localTarballDependencies) {
    if (!dependencies[name]) continue

    const tarball = tarballs.get(name)
    if (!tarball) {
      throw new Error(`Cannot patch ${pkg.manifest.name} dependency ${name}: local tarball has not been packed.`)
    }

    dependencies[name] = tarballSpec(tarball)
  }

  manifest.dependencies = dependencies
  writeJson(manifestPath, manifest)

  return patchedDir
}

const localTarballDependencies = [
  'vitepress-plugin-analyzer',
  'vitepress-plugin-callouts',
  'vitepress-plugin-codeblock-fold',
  'vitepress-plugin-config',
  'vitepress-plugin-details-block',
  'vitepress-plugin-hashtag',
  'vitepress-plugin-image-dimension'
]

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
const patchedPackagesDir = join(tempRoot, 'patched-packages')
const consumerParent = join(tempRoot, 'consumer')

try {
  mkdirSync(tarballDir, { recursive: true })
  mkdirSync(patchedPackagesDir, { recursive: true })
  mkdirSync(consumerParent, { recursive: true })

  console.log(`Packing ${packages.length} publishable packages into ${tarballDir}...`)
  const tarballs = new Map()
  for (const pkg of packages) {
    if (pkg.manifest.name === 'vitepress-theme-link') continue

    const tarball = packPackage(pkg, tarballDir)
    tarballs.set(pkg.manifest.name, tarball)
    console.log(`✓ ${pkg.manifest.name} -> ${relative(tempRoot, tarball)}`)
  }

  const themePackage = packageByName.get('vitepress-theme-link')
  const patchedThemeDir = prepareThemePackageWithLocalDependencies(themePackage, patchedPackagesDir, tarballs)
  const themeTarball = packDirectory(patchedThemeDir, tarballDir, themePackage.manifest.name)
  tarballs.set(themePackage.manifest.name, themeTarball)
  console.log(`✓ ${themePackage.manifest.name} -> ${relative(tempRoot, themeTarball)}`)

  const createPackage = packageByName.get('create-vitepress-theme-link')
  const cliPath = join(createPackage.dir, 'dist/index.js')
  if (!existsSync(cliPath)) {
    throw new Error(`Scaffold CLI build output is missing: ${cliPath}. Run pnpm build first.`)
  }

  console.log('Scaffolding fresh consumer project...')
  run('node', [cliPath, 'consumer-app'], { cwd: consumerParent })

  const consumerDir = join(consumerParent, 'consumer-app')
  const consumerManifestPath = join(consumerDir, 'package.json')
  const consumerWorkspacePath = join(consumerDir, 'pnpm-workspace.yaml')
  const consumerManifest = readJson(consumerManifestPath)
  assertTemplateDeps(consumerManifest)

  // The scaffold must ship a pnpm-workspace.yaml with an allowBuilds allowlist:
  // VitePress pulls in native build-script deps (esbuild, sharp, @parcel/watcher)
  // and pnpm 11 fails a fresh install with ERR_PNPM_IGNORED_BUILDS without it.
  if (!existsSync(consumerWorkspacePath)) {
    throw new Error(
      'Scaffold template must include pnpm-workspace.yaml with an allowBuilds allowlist so a fresh consumer install does not fail with ERR_PNPM_IGNORED_BUILDS.'
    )
  }

  consumerManifest.dependencies = {
    ...(consumerManifest.dependencies || {}),
    'vitepress-theme-link': tarballSpec(tarballs.get('vitepress-theme-link'))
  }

  writeJson(consumerManifestPath, consumerManifest)

  // Install exactly like an end user: no --dangerouslyAllowAllBuilds bypass, so
  // this exercises the template's own allowBuilds allowlist. If the allowlist is
  // wrong or missing, the install fails here instead of silently passing.
  console.log('Installing fresh consumer dependencies...')
  run('pnpm', ['install'], { cwd: consumerDir })

  console.log('Building fresh consumer project from packed artifacts...')
  const buildOutput = run('pnpm', ['build'], { cwd: consumerDir, capture: true })
  process.stdout.write(buildOutput)
  assertNoKnownFailure(buildOutput)

  // A passing build only exercises the SSR path. Dev is a separate pipeline that
  // can fail to resolve the theme's source-distributed client modules, so probe
  // it explicitly.
  await validateDevServer(consumerDir)

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
