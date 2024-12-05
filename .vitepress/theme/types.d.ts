import { DefaultTheme } from 'vitepress'
import { PageData } from 'vitepress'

type Article = {
  regularPath: string
  frontMatter: PostFrontMatter
}

export type PostFrontMatter = PageData['frontmatter']

export type Post = {
  frontMatter: PostFrontMatter
  regularPath: string
}

export type BlogConfig = DefaultTheme.Config & {
  posts: Post[]
  website: string
}
