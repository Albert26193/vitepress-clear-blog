import footnotePlugin from 'markdown-it-footnote'
import mathjax3 from 'markdown-it-mathjax3'
import wikilinks from 'markdown-it-wikilinks'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vitepress'
import { markdownAnalyzerPlugin } from 'vitepress-plugin-analyzer'
import { generateThemePlugin } from 'vitepress-plugin-config'

import { customElements } from './custom/constant'
import { head } from './custom/head'
import { nav } from './custom/nav'
import { getFooterRefTag, getPosts } from './theme/utils'

const postArticles = await getPosts(10)

// TODO: temp test options here
const wikilinksOptions = {
  baseURL: 'http://10.177.73.149:5000',
  htmlAttributes: {
    class: 'clear-wikilink'
    // rel: 'nofollow'
  }
}

export default defineConfig({
  router: {
    prefetchLinks: true
  },
  markdown: {
    config: (md) => {
      md.use(mathjax3)
      md.use(wikilinks(wikilinksOptions))
      md.use(footnotePlugin)

      getFooterRefTag(md)
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
  vite: {
    server: { port: 4000 },
    plugins: [
      markdownAnalyzerPlugin(),
      // generateThemePlugin(),
      UnoCSS()
      //RssPlugin(RSS)
    ]
  },
  title: 'DDDDDDDocs',
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
    website: '',
    search: {
      provider: 'local'
    },
    nav,
    outline: [2, 3],
    outlineTitle: 'Table of Contents',
    socialLinks: [{ icon: 'github', link: 'https://github.com' }],
    // TODO: use 'usefunc' to get the meta data and post articles
    posts: postArticles,
    meta: {}
  } as any,
  srcExclude: ['README.md'], // exclude the README.md , needn't to compiler
  ignoreDeadLinks: true
})
