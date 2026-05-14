export type ResolutionMode =
  | 'repoRoot'
  | 'absolutePath'
  | 'relativeToCurrentFile'
  | 'obsidianShortest'

export interface AnalyzerConfig {
  docsDir: string
  excludeDirs: string[]
  includeFiles: string[]
  excludeFiles: string[]
  ignoreCase: boolean
  resolutionModes: ResolutionMode[]
  filenameIndex?: Map<string, string[]>
  diagnostics: string[]
}
