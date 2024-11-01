import mathjax3 from 'markdown-it-mathjax3'
import UnoCSS from 'unocss/vite'

import { defineConfig } from 'vitepress'
import { customElements } from './theme/config/constant'
import { head } from './theme/config/head'
import { nav } from './theme/config/nav'
import { getPosts } from './theme/serverUtils'
import { BlogConfig } from './theme/types'

//每页的文章数量
const pageSize = 10

declare module 'vitepress' {
  interface ThemeConfig {
    themeConfig: BlogConfig | ThemeConfig
  }
}

const postArcticles = await getPosts(pageSize)

export default defineConfig({
  markdown: {
    config: (md) => {
      md.use(mathjax3)
    }
  },
  head,
  vue: {
    template: {
      compilerOptions: {
        isCustomElement: (tag) => customElements.includes(tag)
      }
    }
  },
  title: 'VitePress Pure',
  base: '/',
  srcDir: './src',
  cacheDir: './node_modules/vitepress_cache',
  rewrites: {},
  description: 'vitepress,blog,blog-theme',
  ignoreDeadLinks: true,
  themeConfig: {
    posts: postArcticles,
    website: 'https://github.com/airene/vitepress-blog-pure',
    search: {
      provider: 'local'
    },
    nav,
    outline: [2, 3],
    outlineTitle: 'Table of Contents',
    socialLinks: [{ icon: 'github', link: 'https://github.com/airene/vitepress-blog-pure' }]
  } as BlogConfig,
  srcExclude: ['README.md'], // exclude the README.md , needn't to compiler
  vite: {
    //build: { minify: false }
    server: { port: 5000 },
    plugins: [UnoCSS()]
  }
})
