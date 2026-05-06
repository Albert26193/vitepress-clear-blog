import { DefaultTheme } from 'vitepress'

// import type { PageData } from 'vitepress'

export interface PostFrontMatter {
  author?: string
  date: string
  title: string
  tags: string[]
  description: string
}

export interface PostData {
  url: string
  frontmatter: PostFrontMatter
  // You might want to add other properties like excerpt, src, html if you enable them in createContentLoader
}

export interface Post {
  frontMatter: PostFrontMatter
  regularPath: string
  rawContent?: string
  html?: string
}

export interface BlogConfig extends DefaultTheme.Config {
  posts: Post[]
  website: string
  icpNumber?: string
  themeLink?: string
}

export interface PageLink {
  text: string
  relativePath: string
  fullUrl: string
  type: 'wiki' | 'markdown' | 'html'
  raw: string
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

export interface D3Node extends d3.SimulationNodeDatum {
  id: string | number
  inDegree: number
  outDegree: number
  name: string
  relativePath: string
  fullUrl: string
  type: 'page' | 'wiki' | 'markdown' | 'html'
  color?: string
  x?: number
  y?: number
  group?: number
}

export interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  source: string | number | D3Node
  target: string | number | D3Node
  type: 'wiki' | 'markdown' | 'html'
  color?: string
  x1?: number
  y1?: number
  x2?: number
  y2?: number
}

export interface D3Data {
  nodes: D3Node[]
  links: D3Link[]
}

export interface D3ForceConfig {
  nodes: D3Node[]
  links: D3Link[]
  width?: number
  height?: number
  diameter?: number
  textSize?: number
  circleColor?: string
  textColor?: string
  linkDistance?: number
  linkStrength?: number
  linkColor?: string
  chargeStrength?: number
}

export interface IconOption {
  value: string
  iconClass: string
  tooltip?: string
  disabled?: boolean
}

export type ButtonSize = 'sm' | 'md' | 'lg'
export type ButtonLayout = 'horizontal' | 'vertical'

// declare module 'virtual:vitepress-analyzer' {
//   export const globalMdMetadata: SiteMetadata
// }
