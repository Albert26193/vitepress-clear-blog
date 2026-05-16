import { DefaultTheme } from 'vitepress'

// import type { PageData } from 'vitepress'

/**
 * Frontmatter fields used to render post listings and article metadata consistently.
 */
export interface PostFrontMatter {
  author?: string
  date: string
  title: string
  tags: string[]
  description: string
}

/**
 * Content-loader payload kept for integrations that need raw VitePress post data.
 */
export interface PostData {
  url: string
  frontmatter: PostFrontMatter
  // You might want to add other properties like excerpt, src, html if you enable them in createContentLoader
}

/**
 * Normalized post shape consumed by theme components and list utilities.
 */
export interface Post {
  frontMatter: PostFrontMatter
  regularPath: string
  rawContent?: string
  html?: string
}

/**
 * Clear Blog theme configuration layered on top of VitePress defaults.
 */
export interface BlogConfig extends DefaultTheme.Config {
  posts: Post[]
  website: string
  icpNumber?: string
  themeLink?: string
  homepage?: {
    title?: string
    description?: string
  }
  pageSize?: number
  defaultViewMode?: 'card' | 'list'
  timelineSortDirection?: 'desc' | 'asc'
  dateFormat?: string
}

/**
 * Internal link record used to connect Markdown, HTML, and wiki-style references.
 */
export interface PageLink {
  text: string
  relativePath: string
  fullUrl: string
  type: 'wiki' | 'markdown' | 'html'
  raw: string
}

/**
 * Analyzer metadata used by navigation, previews, and graph visualizations.
 */
export interface PageMetadata {
  outgoingLinks: PageLink[]
  backLinks: PageLink[]
  wordCount: number
  firstHeading: string
  lastUpdated: number
}

/**
 * Whole-site analyzer metadata keyed by normalized page path.
 */
export interface SiteMetadata {
  [key: string]: PageMetadata
}

/**
 * D3 node model enriched with page metadata for graph navigation.
 */
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

/**
 * D3 link model that preserves the source link kind for styling and filtering.
 */
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

/**
 * Graph data passed to D3 components after analyzer metadata is transformed.
 */
export interface D3Data {
  nodes: D3Node[]
  links: D3Link[]
}

/**
 * Shared graph controls used by page-level and site-level D3 components.
 */
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

/**
 * Describes one selectable icon option for compact toggle controls.
 */
export interface IconOption {
  value: string
  iconClass: string
  tooltip?: string
  disabled?: boolean
}

/**
 * Supported size presets for shared icon-toggle controls.
 */
export type ButtonSize = 'sm' | 'md' | 'lg'

/**
 * Supported layout directions for shared icon-toggle controls.
 */
export type ButtonLayout = 'horizontal' | 'vertical'

// declare module 'virtual:vitepress-analyzer' {
//   export const globalMdMetadata: SiteMetadata
// }
