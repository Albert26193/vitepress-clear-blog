import type { AnalyzerConfig, AnalyzerLogLevel } from '../../../types'

const normalizeLogLevel = (
  level: string | undefined
): AnalyzerLogLevel | undefined => {
  if (
    level === 'silent' ||
    level === 'error' ||
    level === 'warn' ||
    level === 'info' ||
    level === 'debug'
  ) {
    return level
  }
}

const defaultConfig: AnalyzerConfig = {
  docsDir: 'docs',
  excludeDirs: ['node_modules', '.git', 'dist'],
  includeFiles: ['.md'],
  excludeFiles: [],
  // maxSearchDepth: 5,
  ignoreCase: true,
  resolutionModes: ['repoRoot', 'absolutePath', 'relativeToCurrentFile'],
  diagnostics: [],
  logLevel:
    normalizeLogLevel(process.env.VITEPRESS_ANALYZER_LOG_LEVEL) ??
    normalizeLogLevel(process.env.ANALYZER_LOG_LEVEL) ??
    (process.env.NODE_ENV === 'development' ? 'debug' : 'warn')
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
