import { DefaultTheme } from 'vitepress'

// export interface Post {
//   title: string
//   date: string
//   excerpt: string
//   link: string
//   tags?: string[]
//   categories?: string[]
// }

export interface PostFrontMatter {
  title: string
  date: string
  tags?: string[]
  categories?: string[]
  excerpt?: string
  description?: string
  author?: string
  draft?: boolean
  [key: string]: string | string[] | boolean | undefined
}

export interface Post {
  frontMatter: PostFrontMatter
  regularPath: string
}

export interface BlogConfig extends DefaultTheme.Config {
  posts: Post[]
  website: string
}
