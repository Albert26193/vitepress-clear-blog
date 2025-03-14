export interface AnalyzerConfig {
  // Required directories
  docsDir: string
  blogDir: string

  // File and directory filters
  excludeDirs: string[]
  includeFiles: string[]
  excludeFiles: string[]

  // Search configuration
  maxSearchDepth: number
  ignoreCase: boolean
}

const defaultConfig: AnalyzerConfig = {
  docsDir: 'docs',
  blogDir: 'blog',
  excludeDirs: ['node_modules', '.git', 'dist'],
  includeFiles: ['.md'],
  excludeFiles: [],
  maxSearchDepth: 5,
  ignoreCase: true
}

export const createConfig = (
  userConfig?: Partial<AnalyzerConfig>
): AnalyzerConfig => {
  if (!userConfig) {
    return { ...defaultConfig }
  }

  // Merge user config with default config
  return {
    ...defaultConfig,
    ...userConfig,
    // Ensure arrays are properly overridden
    excludeDirs: userConfig.excludeDirs || defaultConfig.excludeDirs,
    includeFiles: userConfig.includeFiles || defaultConfig.includeFiles,
    excludeFiles: userConfig.excludeFiles || defaultConfig.excludeFiles
  }
}
