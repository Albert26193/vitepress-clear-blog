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
  type: 'wiki' | 'markdown'
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

declare module 'virtual:markdown-metadata' {
  export const globalMdMetadata: SiteMetadata
}
