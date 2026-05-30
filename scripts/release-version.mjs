#!/usr/bin/env node
import { join, relative } from 'node:path'

import {
  assertBetaVersion,
  discoverPublishablePackages,
  packageSetErrors,
  readJson,
  repoRoot,
  scaffoldTemplatePackagePath,
  writeJson
} from './release-utils.mjs'

const version = process.argv[2]

try {
  assertBetaVersion(version)

  const packages = await discoverPublishablePackages()
  const packageErrors = packageSetErrors(packages)
  if (packageErrors.length > 0) {
    console.error('Release version update failed:')
    for (const error of packageErrors) console.error(`  - ${error}`)
    process.exit(1)
  }

  const rootManifestPath = join(repoRoot, 'package.json')
  const rootManifest = readJson(rootManifestPath)
  rootManifest.version = version
  writeJson(rootManifestPath, rootManifest)
  console.log(`✓ ${relative(repoRoot, rootManifestPath)} -> ${version}`)

  for (const pkg of packages) {
    const manifest = readJson(pkg.manifestPath)
    manifest.version = version
    writeJson(pkg.manifestPath, manifest)
    console.log(`✓ ${relative(repoRoot, pkg.manifestPath)} -> ${version}`)
  }

  const templateManifest = readJson(scaffoldTemplatePackagePath)
  templateManifest.dependencies = {
    ...(templateManifest.dependencies || {}),
    'vitepress-theme-link': version
  }
  writeJson(scaffoldTemplatePackagePath, templateManifest)
  console.log(
    `✓ ${relative(repoRoot, scaffoldTemplatePackagePath)} dependency vitepress-theme-link -> ${version}`
  )
} catch (error) {
  console.error(`Release version update failed: ${error.message}`)
  process.exit(1)
}
