#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join, resolve } from 'node:path'

import {
  betaVersionError,
  discoverPublishablePackages,
  packageSetErrors,
  parsePnpmPackJson,
  repoRoot
} from './release-utils.mjs'

function parseArgs(argv) {
  const options = {
    publish: false,
    skipRegistry: false
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === '--') {
      continue
    } else if (arg === '--version') {
      options.version = argv[index + 1]
      index += 1
    } else if (arg === '--publish') {
      options.publish = true
    } else if (arg === '--confirm') {
      options.confirm = argv[index + 1]
      index += 1
    } else if (arg === '--registry') {
      options.registry = argv[index + 1]
      index += 1
    } else if (arg === '--otp') {
      options.otp = argv[index + 1]
      index += 1
    } else if (arg === '--skip-registry') {
      options.skipRegistry = true
    } else {
      options.unknown ||= []
      options.unknown.push(arg)
    }
  }

  return options
}

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: options.cwd || repoRoot,
    encoding: 'utf8',
    stdio: options.inherit ? 'inherit' : 'pipe',
    env: { ...process.env, ...options.env }
  })
}

function outputOf(result) {
  return [result.stdout, result.stderr].filter(Boolean).join('').trim()
}

function npmRegistryArgs(options) {
  return options.registry ? ['--registry', options.registry] : []
}

function npmOtpArgs(options) {
  return options.otp ? ['--otp', options.otp] : []
}

function checkRegistryAvailability(pkg, version, options) {
  if (options.skipRegistry) return null

  const result = run('npm', [
    'view',
    `${pkg.manifest.name}@${version}`,
    'version',
    '--silent',
    ...npmRegistryArgs(options)
  ])
  if (result.status === 0 && result.stdout.trim() === version) {
    return `${pkg.manifest.name}@${version} already exists on npm`
  }

  const output = outputOf(result)
  if (
    result.status !== 0 &&
    output &&
    !/E404|404 Not Found|No match found/i.test(output)
  ) {
    return `Unable to verify npm availability for ${pkg.manifest.name}@${version}: ${output}`
  }

  return null
}

function packPackage(pkg, tarballDir) {
  const result = run('pnpm', [
    '--dir',
    pkg.dir,
    'pack',
    '--pack-destination',
    tarballDir,
    '--json'
  ])
  if (result.status !== 0) {
    return {
      error: `pnpm pack failed for ${pkg.manifest.name}:\n${outputOf(result)}`
    }
  }

  try {
    const pack = parsePnpmPackJson(result.stdout)
    const tarballPath = join(tarballDir, basename(pack.filename))
    if (!existsSync(tarballPath)) {
      return {
        error: `Expected tarball not found for ${pkg.manifest.name}: ${tarballPath}`
      }
    }

    return { tarballPath }
  } catch (error) {
    return {
      error: `Unable to parse pnpm pack output for ${pkg.manifest.name}: ${error.message}\n${result.stdout}`
    }
  }
}

function publishTarball(tarballPath, options) {
  const args = [
    'publish',
    tarballPath,
    '--tag',
    'beta',
    '--access',
    'public',
    ...npmRegistryArgs(options),
    ...npmOtpArgs(options)
  ]

  if (options.publish) {
    args.push('--provenance')
  } else {
    args.push('--dry-run')
  }

  return run('npm', args, { inherit: true })
}

const options = parseArgs(process.argv.slice(2))
const errors = []

if (options.unknown?.length) {
  errors.push(`Unknown argument(s): ${options.unknown.join(', ')}`)
}

const versionError = betaVersionError(options.version)
if (versionError) errors.push(versionError)

if (options.publish) {
  const expectedConfirm = `publish-${options.version}-to-npm-beta`
  if (options.confirm !== expectedConfirm) {
    errors.push(`Real publish requires --confirm ${expectedConfirm}`)
  }

  if (options.skipRegistry) {
    errors.push('Real publish cannot use --skip-registry')
  }
}

const packages = await discoverPublishablePackages()
errors.push(...packageSetErrors(packages))

if (options.version) {
  for (const pkg of packages) {
    if (pkg.manifest.version !== options.version) {
      errors.push(
        `${pkg.manifest.name}: version is ${pkg.manifest.version}; expected ${options.version}`
      )
    }

    if (pkg.manifest.publishConfig?.access !== 'public') {
      errors.push(`${pkg.manifest.name}: publishConfig.access must be public`)
    }

    if (pkg.manifest.publishConfig?.tag === 'latest') {
      errors.push(`${pkg.manifest.name}: publishConfig.tag must not be latest`)
    }
  }
}

if (errors.length > 0) {
  console.error('Release publish failed before publishing:')
  for (const error of errors) console.error(`  - ${error}`)
  process.exit(1)
}

const mode = options.publish ? 'real publish' : 'dry-run'
const tempRoot = mkdtempSync(join(tmpdir(), 'vitepress-theme-link-release-'))
const tarballDir = join(tempRoot, 'tarballs')
const completed = []

try {
  mkdirSync(tarballDir, { recursive: true })

  console.log(`Starting npm beta ${mode} for ${options.version}.`)
  console.log('Publishing tarballs with --tag beta and --access public.')

  for (const pkg of packages) {
    const availabilityError = checkRegistryAvailability(
      pkg,
      options.version,
      options
    )
    if (availabilityError) throw new Error(availabilityError)

    const packed = packPackage(pkg, tarballDir)
    if (packed.error) throw new Error(packed.error)

    console.log(
      `\n${options.publish ? 'Publishing' : 'Dry-running'} ${pkg.manifest.name}@${options.version} from ${resolve(packed.tarballPath)}`
    )
    const publishResult = publishTarball(packed.tarballPath, options)
    if (publishResult.status !== 0) {
      throw new Error(
        `npm publish failed for ${pkg.manifest.name}@${options.version}`
      )
    }

    completed.push(pkg.manifest.name)
  }

  console.log(`\nNpm beta ${mode} completed for ${options.version}.`)
  console.log(`Completed packages: ${completed.join(', ')}`)
} catch (error) {
  console.error(`\nNpm beta ${mode} failed: ${error.message}`)
  if (completed.length > 0) {
    console.error(`Completed before failure: ${completed.join(', ')}`)
    console.error(
      'Do not unpublish automatically. Fix the issue, then rerun; already-published versions will need manual recovery planning.'
    )
  }
  process.exitCode = 1
} finally {
  rmSync(tempRoot, { recursive: true, force: true })
}
