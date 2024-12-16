import { DefaultTheme } from 'vitepress'
import type { PageData } from 'vitepress'

export interface PostFrontMatter {
  author?: string
  date: string
  title: string
  tags: string[]
  description: string
  // Include any other frontmatter fields you need
}

export interface Post {
  frontMatter: PostFrontMatter
  regularPath: string
}

export interface BlogConfig extends DefaultTheme.Config {
  posts: Post[]
  website: string
}

export interface PageLink {
  text: string
  path: string
  type: 'wiki' | 'markdown' | 'html'
  raw: string
}

export interface MarkdownMetadata {
  wordCount: number // markdown word count
  innerLinks: PageLink[] // inner links
  rawContent: string // raw content
  headings: Array<{
    // heading structure
    level: number
    text: string
    slug: string
  }>
  lastUpdated: number // last updated time
}

export interface SiteMetadata {
  [key: string]: MarkdownMetadata
}

export interface D3Node extends d3.SimulationNodeDatum {
  id: string | number
  inDegree: number
  outDegree: number
  name?: string
  text?: string
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
}

declare module 'virtual:markdown-metadata' {
  export const globalMdMetadata: SiteMetadata
}