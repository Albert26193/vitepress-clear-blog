#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { relative } from 'node:path'

import {
  betaVersionError,
  builtScaffoldTemplatePackagePath,
  discoverPublishablePackages,
  packageSetErrors,
  readJson,
  repoRoot,
  scaffoldTemplatePackagePath
} from './release-utils.mjs'

const requiredFields = [
  'description',
  'author',
  'license',
  'homepage',
  'repository',
  'bugs',
  'keywords',
  'engines',
  'files'
]

function parseArgs(argv) {
  const options = {
    requireBuild: false,
    requireMaster: false,
    requireClean: false,
    skipRegistry: false
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === '--') {
      continue
    } else if (arg === '--version') {
      options.version = argv[index + 1]
      index += 1
    } else if (arg === '--require-build') {
      options.requireBuild = true
    } else if (arg === '--require-master') {
      options.requireMaster = true
    } else if (arg === '--require-clean') {
      options.requireClean = true
    } else if (arg === '--skip-registry') {
      options.skipRegistry = true
    } else {
      options.unknown ||= []
      options.unknown.push(arg)
    }
  }

  return options
}

function run(command, args) {
  return spawnSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: 'pipe'
  })
}

function outputOf(result) {
  return [result.stdout, result.stderr].filter(Boolean).join('').trim()
}

function missingMetadata(manifest) {
  return requiredFields.filter((field) => {
    const value = manifest[field]
    if (Array.isArray(value)) return value.length === 0
    return value === undefined || value === null || value === ''
  })
}

function packageValidationErrors(pkg, expectedVersion) {
  const errors = []
  const { manifest } = pkg

  if (manifest.version !== expectedVersion) {
    errors.push(`version is ${manifest.version}; expected ${expectedVersion}`)
  }

  if (manifest.private === true) {
    errors.push('private must not be true')
  }

  if (manifest.publishConfig?.access !== 'public') {
    errors.push('publishConfig.access must be public')
  }

  if (manifest.publishConfig?.tag === 'latest') {
    errors.push('publishConfig.tag must not be latest')
  } else if (
    manifest.publishConfig?.tag &&
    manifest.publishConfig.tag !== 'beta'
  ) {
    errors.push(
      `publishConfig.tag must be beta or omitted; received ${manifest.publishConfig.tag}`
    )
  }

  const missing = missingMetadata(manifest)
  if (missing.length > 0) {
    errors.push(`missing metadata field(s): ${missing.join(', ')}`)
  }

  return errors
}

function templateDependencyErrors(path, expectedVersion, label) {
  if (!existsSync(path)) {
    return [`${label} does not exist: ${relative(repoRoot, path)}`]
  }

  const manifest = readJson(path)
  const actual = manifest.dependencies?.['vitepress-theme-link']
  if (actual !== expectedVersion) {
    return [
      `${label} depends on vitepress-theme-link ${actual || '<missing>'}; expected ${expectedVersion}`
    ]
  }

  return []
}

function branchErrors() {
  const result = run('git', ['branch', '--show-current'])
  if (result.status !== 0)
    return [`Unable to read current branch: ${outputOf(result)}`]

  const branch = result.stdout.trim()
  return branch === 'master'
    ? []
    : [`Current branch must be master; received ${branch || '<detached>'}`]
}

function cleanErrors() {
  const unstaged = run('git', ['diff', '--exit-code', '--quiet'])
  const staged = run('git', ['diff', '--cached', '--exit-code', '--quiet'])
  const errors = []

  if (unstaged.status !== 0)
    errors.push('Working tree has unstaged tracked changes')
  if (staged.status !== 0) errors.push('Working tree has staged changes')

  return errors
}

function registryErrors(packages, version) {
  const errors = []
  const alreadyPublished = []

  for (const pkg of packages) {
    const result = run('npm', [
      'view',
      `${pkg.manifest.name}@${version}`,
      'version',
      '--silent'
    ])
    if (result.status === 0 && result.stdout.trim() === version) {
      // Already on npm — the signature of a resumable run that is finishing a
      // partially-published release. Not an error: publish skips these.
      alreadyPublished.push(`${pkg.manifest.name}@${version}`)
      continue
    }

    const output = outputOf(result)
    if (
      result.status !== 0 &&
      output &&
      !/E404|404 Not Found|No match found/i.test(output)
    ) {
      errors.push(
        `Unable to verify npm availability for ${pkg.manifest.name}@${version}: ${output}`
      )
    }
  }

  if (alreadyPublished.length > 0) {
    console.log(
      `Already published (will be skipped on publish): ${alreadyPublished.join(', ')}`
    )
  }

  return errors
}

const options = parseArgs(process.argv.slice(2))
const errors = []

if (options.unknown?.length) {
  errors.push(`Unknown argument(s): ${options.unknown.join(', ')}`)
}

const versionError = betaVersionError(options.version)
if (versionError) errors.push(versionError)

const packages = await discoverPublishablePackages()
errors.push(...packageSetErrors(packages))

if (options.version) {
  for (const pkg of packages) {
    const packageErrors = packageValidationErrors(pkg, options.version)
    for (const error of packageErrors) {
      errors.push(`${pkg.manifest.name}: ${error}`)
    }
  }

  errors.push(
    ...templateDependencyErrors(
      scaffoldTemplatePackagePath,
      options.version,
      'Source scaffold template'
    )
  )

  if (options.requireBuild) {
    errors.push(
      ...templateDependencyErrors(
        builtScaffoldTemplatePackagePath,
        options.version,
        'Built scaffold template'
      )
    )
  }

  if (!options.skipRegistry) {
    errors.push(...registryErrors(packages, options.version))
  }
}

if (options.requireMaster) errors.push(...branchErrors())
if (options.requireClean) errors.push(...cleanErrors())

if (errors.length > 0) {
  console.error('Release check failed:')
  for (const error of errors) console.error(`  - ${error}`)
  process.exit(1)
}

console.log(`Release check passed for ${options.version}.`)
