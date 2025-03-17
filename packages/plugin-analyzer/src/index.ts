export { calculateWords } from './parsers/wordCount'

// Export types
export type { PageLink, PageMetadata, SiteMetadata } from './types'

export { generateVirtualModuleContent } from './virtual/analysis'

export {
  VIRTUAL_MODULE_ID,
  RESOLVED_VIRTUAL_MODULE_ID
} from './virtual/analysis'

export { vitePressAnalyzerPlugin } from './plugin'
