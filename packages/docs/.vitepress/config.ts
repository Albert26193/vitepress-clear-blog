import footnotePlugin from 'markdown-it-footnote'
// @ts-expect-error - markdown-it-hashtag has no type declarations
import markdownItHashtag from 'markdown-it-hashtag'
import mathjax3 from 'markdown-it-mathjax3'
// @ts-expect-error - markdown-it-wikilinks has no type declarations
import wikilinks from 'markdown-it-wikilinks'
import { defineConfig } from 'vitepress'
import { getThemeConfig } from 'vitepress-clear-blog/node'
import {
  getFooterRefTag,
  getHashtag,
  mermaidPlugin
} from 'vitepress-clear-blog/node'
import { calloutPlugin } from 'vitepress-plugin-callout'

import { customElements } from './custom/constant'
import { head } from './custom/head'
import { nav } from './custom/nav'

const wikilinksOptions = {
  baseURL: 'http://10.177.73.149:5000',
  htmlAttributes: {
    class: 'clear-wikilink'
    // rel: 'nofollow'
  }
}

const analyzerOptions = {
  docsDir: './docs',
  excludeDirs: ['node_modules', '.git', 'dist'],
  includeFiles: ['.md'],
  excludeFiles: ['README.md'],
  ignoreCase: true
}

const blogTheme = await getThemeConfig()

export default defineConfig({
  extends: blogTheme.clearBlogConfig,
  markdown: {
    config: (md) => {
      md.use(mathjax3)
      md.use(wikilinks(wikilinksOptions))
      md.use(footnotePlugin)
      md.use(markdownItHashtag)
      md.use(mermaidPlugin)
      md.use(calloutPlugin)
      getFooterRefTag(md)
      getHashtag(md)
    },
    theme: {
      light: 'github-light',
      dark: 'ayu-dark'
    }
  },
  vue: {
    template: {
      compilerOptions: {
        isCustomElement: (tag) => customElements.includes(tag)
      }
    }
  },
  vite: blogTheme.vite as object,
  title: '55555555',
  base: '/',
  srcDir: './docs',
  head,
  themeConfig: {
    sidebar: [
      {
        text: '',
        items: []
      }
    ],
    search: {
      provider: 'local'
    },
    nav,
    outline: [2, 3],
    outlineTitle: 'Table of Contents',
    socialLinks: [{ icon: 'github', link: 'https://github.com' }]
  },
  srcExclude: ['README.md'], // exclude the README.md , needn't to compiler
  ignoreDeadLinks: true
})
