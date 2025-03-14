export interface PageLink {
  absolutePath: string
  text: string
  relativePath: string
  fullUrl: string
  type: 'markdown' | 'html' | 'wiki'
  raw: string
}

export interface Page {
  absolutePath: string // 文档的绝对路径
  relativePath: string // 相对于站点根目录的路径
  metadata: PageMetadata // 页面元数据
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
