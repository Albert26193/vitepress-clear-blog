#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const packagesRoot = join(repoRoot, 'packages')

export const publishOrder = Object.freeze([
  'vitepress-plugin-analyzer',
  'vitepress-plugin-callouts',
  'vitepress-plugin-codeblock-fold',
  'vitepress-plugin-config',
  'vitepress-plugin-details-block',
  'vitepress-plugin-hashtag',
  'vitepress-plugin-image-dimension',
  'vitepress-plugin-shortlink',
  'vitepress-theme-link',
  'create-vitepress-theme-link'
])

export const expectedPublishablePackageNames = Object.freeze([...publishOrder])
export const scaffoldTemplatePackagePath = join(
  repoRoot,
  'packages/create-vitepress-theme-link/public/template/package.json'
)
export const builtScaffoldTemplatePackagePath = join(
  repoRoot,
  'packages/create-vitepress-theme-link/dist/template/package.json'
)

const packageOrder = new Map(publishOrder.map((name, index) => [name, index]))

export function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function jsonIndentFor(path) {
  if (!existsSync(path)) return 2

  const content = readFileSync(path, 'utf8')
  const match = content.match(/\n( +)"/)
  return match?.[1] || 2
}

export function writeJson(path, value) {
  writeFileSync(path, JSON.stringify(value, null, jsonIndentFor(path)) + '\n')
}

export async function discoverPublishablePackages() {
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

  return packages.sort((a, b) => {
    const aOrder = packageOrder.get(a.manifest.name) ?? Number.MAX_SAFE_INTEGER
    const bOrder = packageOrder.get(b.manifest.name) ?? Number.MAX_SAFE_INTEGER
    return aOrder - bOrder || a.manifest.name.localeCompare(b.manifest.name)
  })
}

export function packageSetErrors(packages) {
  const names = packages.map((pkg) => pkg.manifest.name)
  const missing = expectedPublishablePackageNames.filter(
    (name) => !names.includes(name)
  )
  const unexpected = names.filter((name) => !packageOrder.has(name))
  const duplicates = names.filter(
    (name, index) => names.indexOf(name) !== index
  )
  const errors = []

  if (missing.length > 0) {
    errors.push(`Missing publishable package(s): ${missing.join(', ')}`)
  }

  if (unexpected.length > 0) {
    errors.push(`Unexpected publishable package(s): ${unexpected.join(', ')}`)
  }

  if (duplicates.length > 0) {
    errors.push(
      `Duplicate publishable package(s): ${[...new Set(duplicates)].join(', ')}`
    )
  }

  return errors
}

export function betaVersionError(version) {
  if (typeof version !== 'string' || version.length === 0) {
    return 'A beta version is required.'
  }

  if (!/^0\.1\.0-beta\.(0|[1-9]\d*)$/.test(version)) {
    return `Version must match 0.1.0-beta.<number>; received ${version}.`
  }

  return null
}

export function assertBetaVersion(version) {
  const error = betaVersionError(version)
  if (error) throw new Error(error)
  return version
}

export function parsePnpmPackJson(output) {
  const trimmed = output.trim()
  const jsonStart = trimmed.lastIndexOf('\n{')
  const jsonText = jsonStart >= 0 ? trimmed.slice(jsonStart + 1) : trimmed
  const parsed = JSON.parse(jsonText)
  return Array.isArray(parsed) ? parsed[0] : parsed
}
