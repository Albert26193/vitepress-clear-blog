// import * as path from 'path'
import type { AnalyzerConfig } from '../../../types'

const defaultConfig: AnalyzerConfig = {
  docsDir: 'docs',
  excludeDirs: ['node_modules', '.git', 'dist'],
  includeFiles: ['.md'],
  excludeFiles: [],
  // maxSearchDepth: 5,
  ignoreCase: true,
  resolutionModes: ['repoRoot', 'absolutePath', 'relativeToCurrentFile']
}

/**
 * Merges analyzer defaults with user overrides while preserving default arrays unless explicitly replaced.
 *
 * @param userConfig - Optional configuration supplied by plugin consumers.
 * @returns Analyzer configuration used by parsers and path resolution.
 */
export const createConfig = (
  userConfig?: Partial<AnalyzerConfig>
): AnalyzerConfig => {
  const config = {
    ...defaultConfig,
    ...userConfig,
    // Ensure arrays are properly overridden
    excludeDirs: userConfig?.excludeDirs ?? defaultConfig.excludeDirs,
    includeFiles: userConfig?.includeFiles ?? defaultConfig.includeFiles,
    excludeFiles: userConfig?.excludeFiles ?? defaultConfig.excludeFiles,
    resolutionModes:
      userConfig?.resolutionModes ?? defaultConfig.resolutionModes
  }

  return config
}
