import { ResultAsync, ok, okAsync } from 'neverthrow'
import { existsSync, statSync } from 'node:fs'
import {
  basename,
  dirname,
  extname,
  isAbsolute,
  join,
  normalize,
  resolve
} from 'node:path'

import type { AnalyzerConfig, ResolutionMode } from '../../../types'
import { type AnalyzerError, safeReaddir } from './safeIO'

/**
 * Get the absolute path to the docs root directory.
 */
const getDocsRoot = (config: AnalyzerConfig): string => {
  return resolve(process.cwd(), config.docsDir)
}

/**
 * Normalize a link by removing the anchor part.
 */
const normalizeLink = (link: string): string => link.split('#')[0]

/**
 * Check if a file exists at the given absolute path.
 * Supports both with and without .md extension.
 */
const linkedFileExists = (absolutePath: string): boolean => {
  if (existsSync(absolutePath) && statSync(absolutePath).isFile()) return true
  if (!absolutePath.endsWith('.md')) {
    const markdownPath = `${absolutePath}.md`
    return existsSync(markdownPath) && statSync(markdownPath).isFile()
  }
  return false
}

/**
 * Get the path relative to the project root (docs directory).
 */
const getProjectRelativePath = (
  relativePath: string,
  currentFile: string,
  docsRoot?: string
): string => {
  const pathWithoutAnchor = normalizeLink(relativePath)

  if (isAbsolute(pathWithoutAnchor) && docsRoot) {
    const rel = normalize(pathWithoutAnchor).replace(/\\/g, '/')
    const root = normalize(docsRoot).replace(/\\/g, '/')
    if (rel.startsWith(root + '/')) {
      return rel.substring(root.length + 1).replace(/\.md$/, '')
    }
  }

  if (pathWithoutAnchor.startsWith('/')) {
    return pathWithoutAnchor.substring(1).replace(/\.md$/, '')
  }

  const currentDir = dirname(currentFile)

  let fullPath = join(currentDir, pathWithoutAnchor)
  fullPath = normalize(fullPath).replace(/\\/g, '/')

  return fullPath.replace(/\.md$/, '').replace(/^\//, '')
}

// ── Mode-specific resolvers ───────────────────────────────────────

const resolveRepoRoot = (
  linkPath: string,
  config: AnalyzerConfig,
  _currentFile: string
): string | null => {
  const clean = linkPath.startsWith('/') ? linkPath.substring(1) : linkPath
  const abs = resolve(getDocsRoot(config), clean)
  return linkedFileExists(abs) ? abs : null
}

const resolveByAbsolutePath = (
  linkPath: string,
  _config: AnalyzerConfig,
  _currentFile: string
): string | null => {
  if (!isAbsolute(linkPath)) return null
  return linkedFileExists(linkPath) ? linkPath : null
}

const resolveRelativeToCurrentFile = (
  linkPath: string,
  config: AnalyzerConfig,
  currentFile: string
): string | null => {
  if (linkPath.startsWith('/')) return null
  const currentFileAbs = resolve(getDocsRoot(config), currentFile)
  const abs = resolve(dirname(currentFileAbs), linkPath)
  return linkedFileExists(abs) ? abs : null
}

const resolveObsidianShortest = (
  linkPath: string,
  config: AnalyzerConfig,
  _currentFile: string
): string | null => {
  if (!config.filenameIndex || config.filenameIndex.size === 0) return null

  const targetName = basename(linkPath, extname(linkPath))
  const lookupKey = config.ignoreCase ? targetName.toLowerCase() : targetName

  const candidates = config.filenameIndex.get(lookupKey)

  if (!candidates || candidates.length === 0) return null

  if (candidates.length === 1) {
    const match = candidates[0]
    return linkPath.endsWith('.md') ? match : match.replace(/\.md$/, '')
  }

  const list = candidates.map((c) => `  - ${c}`).join('\n')
  config.diagnostics.push(
    `Ambiguous short link "${linkPath}" matches ${candidates.length} files:\n${list}`
  )

  return null
}

const MODE_RESOLVERS: Record<
  ResolutionMode,
  (link: string, cfg: AnalyzerConfig, file: string) => string | null
> = {
  repoRoot: resolveRepoRoot,
  absolutePath: resolveByAbsolutePath,
  relativeToCurrentFile: resolveRelativeToCurrentFile,
  obsidianShortest: resolveObsidianShortest
}

const resolveLinkMultiMode = (
  linkPath: string,
  config: AnalyzerConfig,
  currentFile: string
): string | null => {
  for (const mode of config.resolutionModes) {
    const resolver = MODE_RESOLVERS[mode]
    if (!resolver) continue
    const result = resolver(linkPath, config, currentFile)
    if (result) return result
  }
  return null
}

const resolveAbsolutePath = (
  config: AnalyzerConfig,
  relativePath: string,
  currentFile: string
): string => {
  const normalizedPath = normalizeLink(relativePath)

  const resolved = resolveLinkMultiMode(normalizedPath, config, currentFile)
  if (resolved) return resolved

  const clean = normalizedPath.startsWith('/')
    ? normalizedPath.substring(1)
    : normalizedPath
  return resolve(getDocsRoot(config), clean)
}

/**
 * Recursively build a filename index used by obsidianShortest path resolution.
 *
 * Read errors on individual directories are absorbed; the index will simply
 * be missing entries for those subtrees.
 */
export const buildFilenameIndex = (
  dirPath: string,
  config: AnalyzerConfig
): ResultAsync<Map<string, string[]>, AnalyzerError> => {
  const index = new Map<string, string[]>()

  const walk = (currentDir: string): ResultAsync<void, AnalyzerError> => {
    return safeReaddir(currentDir).andThen((entries) => {
      const tasks = entries.map((entry): ResultAsync<void, AnalyzerError> => {
        if (config.excludeDirs.includes(entry.name)) {
          return okAsync(undefined)
        }

        const fullPath = resolve(currentDir, entry.name)

        if (entry.isDirectory()) {
          return walk(fullPath)
        }

        if (entry.name.endsWith('.md')) {
          if (config.excludeFiles.some((p) => entry.name.includes(p))) {
            return okAsync(undefined)
          }

          const key = basename(entry.name, extname(entry.name))
          const normalizedKey = config.ignoreCase ? key.toLowerCase() : key

          const existing = index.get(normalizedKey) || []
          existing.push(fullPath)
          index.set(normalizedKey, existing)
        }

        return okAsync(undefined)
      })

      return ResultAsync.combine(tasks).map(() => undefined)
    })
  }

  return walk(dirPath)
    .map(() => index)
    .orElse((error) => {
      config.diagnostics.push(`[${error.type}] ${error.path}: ${error.message}`)
      // Return empty index so obsidianShortest degrades gracefully
      return ok(index)
    })
}

/**
 * Emit a diagnostic when the filename index is empty and obsidianShortest is
 * among the configured resolution modes.
 */
export const diagnoseIndexWarning = (config: AnalyzerConfig): void => {
  if (
    config.filenameIndex &&
    config.filenameIndex.size === 0 &&
    config.resolutionModes.includes('obsidianShortest')
  ) {
    config.diagnostics.push(
      'Filename index is empty — obsidianShortest resolution will not match any links'
    )
  }
}

export {
  normalizeLink,
  getDocsRoot,
  getProjectRelativePath,
  resolveAbsolutePath,
  resolveLinkMultiMode
}
