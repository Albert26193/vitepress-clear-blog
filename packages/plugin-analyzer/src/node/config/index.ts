// import * as path from 'path'
import type { AnalyzerConfig } from '../../../types'

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
