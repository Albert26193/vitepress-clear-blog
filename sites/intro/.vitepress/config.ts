import { defineConfig } from 'vitepress'
import { createBlog } from 'vitepress-theme-link/node'

import { head, metaData } from './custom/head'
import { nav } from './custom/nav'
import { sidebar } from './custom/sidebar'

// createBlog() wires up the theme-native markdown pipeline (wikilink, mermaid,
// callout, task lists, footnote, hashtag, mathjax, image-dimension) driven by
// config.toml, so the site no longer registers markdown-it plugins by hand.
const blogConfig = await createBlog()

export default defineConfig({
  ...blogConfig,
  // intro keeps its own meta/head/nav/sidebar instead of the blog defaults.
  title: metaData.title,
  description: metaData.description,
  head,
  themeConfig: {
    ...(blogConfig.themeConfig as Record<string, unknown>),
    sidebar,
    nav,
    search: {
      provider: 'local'
    },
    outline: [2, 3],
    outlineTitle: 'Table of Contents',
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/Albert26193/vitepress-theme-link'
      }
    ]
  }
})
