import wikilinks from 'markdown-it-wikilinks'
import { defineConfig } from 'vitepress'
import {
  getThemeConfig,
  mermaidPlugin,
  taskListsPlugin
} from 'vitepress-clear-blog/node'
import { calloutPlugin } from 'vitepress-plugin-callout'

import { head, metaData } from './custom/head'
import { nav } from './custom/nav'
import { sidebar } from './custom/sidebar'

// WikiLinks configuration - link to docs site
const wikilinksOptions = {
  baseURL: '/',
  htmlAttributes: {
    class: 'clear-wikilink'
  }
}

const blogTheme = await getThemeConfig()

export default defineConfig({
  extends: blogTheme.clearBlogConfig,
  markdown: {
    config: (md) => {
      md.use(wikilinks(wikilinksOptions))
      md.use(mermaidPlugin)
      md.use(calloutPlugin)
      md.use(taskListsPlugin)
    },
    theme: {
      light: 'github-light',
      dark: 'ayu-dark'
    }
  },
  vite: blogTheme.vite as object,
  title: metaData.title,
  description: metaData.description,
  base: '/',
  srcDir: './docs',
  head,
  themeConfig: {
    sidebar,
    search: {
      provider: 'local'
    },
    nav,
    outline: [2, 3],
    outlineTitle: 'Table of Contents',
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/Albert26193/vitepress-clear-blog'
      }
    ]
  },
  srcExclude: ['README.md'],
  ignoreDeadLinks: true
})
