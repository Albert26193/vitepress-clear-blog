export {
  buildFilenameIndex,
  getDocsRoot,
  normalizeLink,
  resolveInternalLink,
  resolveLinkMultiMode
} from './utils/path'
export type { ResolvedInternalLink } from './utils/path'

export { createConfig } from './config'
export { calculateWords } from './utils/wordCount'

// Export types
export type {
  AnalyzerConfig,
  ClientAPI,
  PageLink,
  PageMetadata,
  ResolutionMode,
  SiteMetadata
} from '../../types'

export { generateVirtualModuleContent } from './virtual'

export { VIRTUAL_MODULE_ID, RESOLVED_VIRTUAL_MODULE_ID } from './virtual'

export { vitePressAnalyzerPlugin } from '../plugin'
