import { dirname, join, normalize, resolve } from 'node:path'

import type { AnalyzerConfig } from '../../../types'

/**
 * Get the absolute path to the docs root directory
 * This function assumes it's being called in the context of a VitePress site
 * where config.docsDir is relative to the current working directory
 *
 * @param config - The analyzer configuration
 * @returns The absolute path to the docs root directory
 */
const getDocsRoot = (config: AnalyzerConfig): string => {
  return resolve(process.cwd(), config.docsDir)
}

/**
 * Normalize a link by removing the anchor part
 *
 * @param link - The link to normalize
 * @returns The normalized link
 */
const normalizeLink = (link: string): string => link.split('#')[0]

/**
 * Get the path relative to the project root (docs directory).
 * This function converts any path (absolute or relative) to a path relative to the project root.
 * Example:
 *  - Project root: /path/to/docs
 *  - Current file: /path/to/docs/posts/post1.md
 *  - Input link: ../pages/about.md
 *  - Output: pages/about
 *
 * @param relativePath - The input path (can be absolute or relative)
 * @param currentFile - The current file path relative to project root
 * @returns The path relative to project root, without extension
 */
const getProjectRelativePath = (
  relativePath: string,
  currentFile: string
): string => {
  // Remove anchor part and normalize the path
  const pathWithoutAnchor = normalizeLink(relativePath)

  // If it's an absolute path (starts with /), just remove the leading slash
  if (pathWithoutAnchor.startsWith('/')) {
    return pathWithoutAnchor.substring(1).replace(/\.md$/, '')
  }

  // For relative paths, resolve against current file's location
  const currentDir = dirname(currentFile)

  // Join paths to get the full path relative to the current directory
  let fullPath = join(currentDir, pathWithoutAnchor)

  // Normalize the path to remove .. segments, but keep it relative
  // We don't want to use path.resolve here as it would create an absolute path
  fullPath = normalize(fullPath).replace(/\\/g, '/')

  // Make sure the path doesn't start with a slash and remove .md extension
  return fullPath
    .replace(/\.md$/, '') // Remove .md extension
    .replace(/^\//, '') // Remove leading slash if exists
}

/**
 * Resolve the absolute path in the file system.
 * This function converts any path to its absolute location on disk.
 *
 * @param config - The analyzer configuration
 * @param relativePath - The input path (can be absolute or relative)
 * @param currentFile - The current file path relative to project root
 * @returns The absolute path in the file system
 */
const resolveAbsolutePath = (
  config: AnalyzerConfig,
  relativePath: string,
  currentFile: string
): string => {
  const currentFileAbsolutePath = resolve(getDocsRoot(config), currentFile)
  // console.log('currentFileAbsolutePath', currentFileAbsolutePath)
  // If it's an absolute path (starts with /), resolve from docs root
  const normalizedPath = normalizeLink(relativePath)
  if (normalizedPath.startsWith('/')) {
    return resolve(getDocsRoot(config), normalizedPath.substring(1))
  }

  // For relative paths, resolve from current file's directory
  return resolve(dirname(currentFileAbsolutePath), normalizedPath)
}

export {
  normalizeLink,
  getDocsRoot,
  getProjectRelativePath,
  resolveAbsolutePath
}
