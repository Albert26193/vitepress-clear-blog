import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
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
  if (existsSync(absolutePath)) return true
  if (!absolutePath.endsWith('.md')) return existsSync(absolutePath + '.md')
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

  // Filesystem absolute path under docsRoot: make it relative to docs root
  if (isAbsolute(pathWithoutAnchor) && docsRoot) {
    const rel = normalize(pathWithoutAnchor).replace(/\\/g, '/')
    const root = normalize(docsRoot).replace(/\\/g, '/')
    if (rel.startsWith(root + '/')) {
      return rel.substring(root.length + 1).replace(/\.md$/, '')
    }
    // Absolute path NOT under docsRoot — treat as repo-root-relative
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

/**
 * Resolve the link as relative to the docs root.
 * `/blog/post` or `blog/post` → `{docsRoot}/blog/post.md`
 */
const resolveRepoRoot = (
  linkPath: string,
  config: AnalyzerConfig,
  _currentFile: string
): string | null => {
  const clean = linkPath.startsWith('/') ? linkPath.substring(1) : linkPath
  const abs = resolve(getDocsRoot(config), clean)
  return linkedFileExists(abs) ? abs : null
}

/**
 * Resolve the link as a filesystem absolute path.
 * `/abs/path/to/file.md` → checks if that literal file exists.
 */
const resolveByAbsolutePath = (
  linkPath: string,
  _config: AnalyzerConfig,
  _currentFile: string
): string | null => {
  if (!isAbsolute(linkPath)) return null
  return linkedFileExists(linkPath) ? linkPath : null
}

/**
 * Resolve the link relative to the current file's directory.
 * `../sibling.md` from `docs/blog/post.md` → `docs/sibling.md`
 */
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

/**
 * Recursively build a filename index mapping basenames (without extension)
 * to all absolute paths that share that basename.
 */
const buildFilenameIndex = async (
  dirPath: string,
  config: AnalyzerConfig
): Promise<Map<string, string[]>> => {
  const index = new Map<string, string[]>()

  const walk = async (currentDir: string): Promise<void> => {
    const entries = await readdir(currentDir, { withFileTypes: true })

    const tasks = entries.map(async (entry) => {
      if (config.excludeDirs.includes(entry.name)) return

      const fullPath = resolve(currentDir, entry.name)

      if (entry.isDirectory()) {
        await walk(fullPath)
      } else if (entry.name.endsWith('.md')) {
        if (config.excludeFiles.some((p) => entry.name.includes(p))) return

        const key = basename(entry.name, extname(entry.name))
        const normalizedKey = config.ignoreCase ? key.toLowerCase() : key

        const existing = index.get(normalizedKey) || []
        existing.push(fullPath)
        index.set(normalizedKey, existing)
      }
    })

    await Promise.all(tasks)
  }

  await walk(dirPath)
  return index
}

/**
 * Obsidian-style shortest-path resolution.
 *
 * Searches the filename index for the link's basename. Unique matches resolve
 * directly; ambiguous matches (same basename in multiple directories) produce
 * diagnostic warnings and return null.
 */
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
    // Preserve .md extension only when the link explicitly includes it
    const match = candidates[0]
    return linkPath.endsWith('.md') ? match : match.replace(/\.md$/, '')
  }

  // Ambiguous: report diagnostic
  if (config.diagnostics) {
    const list = candidates.map((c) => `  - ${c}`).join('\n')
    config.diagnostics.push(
      `Ambiguous short link "${linkPath}" matches ${candidates.length} files:\n${list}`
    )
  }

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

/**
 * Try each resolution mode in priority order; return the first match.
 * Returns null when no mode can resolve the link.
 */
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

/**
 * Resolve the absolute path in the file system using configured resolution modes.
 *
 * Maintains backward compatibility: when config has no resolutionModes it falls
 * back to the legacy behavior (link with leading `/` → repo root, otherwise relative).
 */
const resolveAbsolutePath = (
  config: AnalyzerConfig,
  relativePath: string,
  currentFile: string
): string => {
  const normalizedPath = normalizeLink(relativePath)

  const resolved = resolveLinkMultiMode(normalizedPath, config, currentFile)
  if (resolved) return resolved

  // Fallback: return the repoRoot attempt even if the file doesn't exist
  // (legacy callers may need the path regardless of existence)
  const clean = normalizedPath.startsWith('/')
    ? normalizedPath.substring(1)
    : normalizedPath
  return resolve(getDocsRoot(config), clean)
}

export {
  normalizeLink,
  getDocsRoot,
  getProjectRelativePath,
  resolveAbsolutePath,
  resolveLinkMultiMode,
  buildFilenameIndex
}
