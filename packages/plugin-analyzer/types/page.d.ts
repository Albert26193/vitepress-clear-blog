export interface PageLink {
  absolutePath: string
  text: string
  relativePath: string
  fullUrl: string
  type: 'markdown' | 'html' | 'wiki'
  raw: string
}

export interface Page {
  absolutePath: string
  relativePath: string
  metadata: PageMetadata
}

export interface PageMetadata {
  outgoingLinks: PageLink[]
  backLinks: PageLink[]
  wordCount: number
  firstHeading: string
  lastUpdated: number
}

export interface SiteMetadata {
  [key: string]: PageMetadata
}

export interface SitePages {
  [absolutePath: string]: Page
}
