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
