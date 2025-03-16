// import * as path from 'path'

export interface AnalyzerConfig {
  /**
   * Required directories
   */
  // Directory containing documentation files, relative to current working directory
  docsDir: string
  /**
   * File and directory filters
   */
  // Directories to exclude from analysis
  excludeDirs: string[]
  // File extensions to include in analysis
  includeFiles: string[]
  // Files to exclude from analysis
  excludeFiles: string[]

  /**
   * Search configuration
   */
  // Maximum depth for directory traversal
  // maxSearchDepth: number
  // Whether to ignore case in file paths
  ignoreCase: boolean
}

const defaultConfig: AnalyzerConfig = {
  docsDir: 'docs',
  excludeDirs: ['node_modules', '.git', 'dist'],
  includeFiles: ['.md'],
  excludeFiles: [],
  // maxSearchDepth: 5,
  ignoreCase: true
}

/**
 * Create a configuration object for the analyzer
 *
 * @param userConfig - Optional user configuration to override defaults
 * @returns The merged configuration object
 */
export const createConfig = (
  userConfig?: Partial<AnalyzerConfig>
): AnalyzerConfig => {
  const config = {
    ...defaultConfig,
    ...userConfig,
    // Ensure arrays are properly overridden
    excludeDirs: userConfig?.excludeDirs || defaultConfig.excludeDirs,
    includeFiles: userConfig?.includeFiles || defaultConfig.includeFiles,
    excludeFiles: userConfig?.excludeFiles || defaultConfig.excludeFiles
  }

  return config
}
