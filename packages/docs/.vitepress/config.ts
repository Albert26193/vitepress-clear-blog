import mathjax3 from 'markdown-it-mathjax3'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vitepress'
import { markdownAnalyzerPlugin } from 'vitepress-plugin-analyzer'
import { generateThemePlugin } from 'vitepress-plugin-config'

import { customElements } from './custom/constant'
import { head } from './custom/head'
import { nav } from './custom/nav'
import { getPosts } from './theme/utils'

const postArticles = await getPosts(12)

export default defineConfig({
  markdown: {
    config(md) {
      md.use(mathjax3)
    },
    math: true
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
      //generateThemePlugin()
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
    outlineTitle: 'On this page',
    socialLinks: [{ icon: 'github', link: 'https://github.com' }],
    // TODO: use 'usefunc' to get the meta data and post articles
    posts: postArticles,
    meta: {}
  } as any,
  srcExclude: ['README.md'], // exclude the README.md , needn't to compiler
  ignoreDeadLinks: true
})
