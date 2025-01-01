export interface PageLink {
  text: string
  relativePath: string
  fullUrl: string
  type: 'markdown' | 'html' | 'wiki'
  raw: string
}

export interface PageMetadata {
  outgoingLinks: PageLink[]
  backLinks: PageLink[]
  wordCount: number
  rawContent: string
  headings: string[]
  lastUpdated: number
}

export interface SiteMetadata {
  [key: string]: PageMetadata
}
