import mathjax3 from 'markdown-it-mathjax3'
import wikilinks from 'markdown-it-wikilinks'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vitepress'
import { RSSOptions, RssPlugin } from 'vitepress-plugin-rss'

import { head } from './custom/head'
import { nav } from './custom/nav'
import { markdownAnalyzerPlugin } from './plugins/analyze'
import { generateThemePlugin } from './plugins/preBuild'
import { customElements } from './theme/config/constant'
import { getPosts, getRootPath, getSrcPath } from './theme/utils/serverUtils'
import { parsedConfigToml } from './theme/utils/serverUtils'

// Load TOML config at build time

// TODO: config.toml: [theme] -> brandColor
const pageSize = 10
const postArticles = await getPosts(pageSize)
const rootPath = getRootPath()
const srcPath = getSrcPath('.vitepress')

const RSS: RSSOptions = {
  title: parsedConfigToml.meta.title || '222222222',
  baseUrl: 'http://10.177.73.149:5000',
  copyright: 'Copyright 111111111'
}

const wikilinksOptions = {
  baseURL: 'http://10.177.73.149:5000'
}

//default options
export default defineConfig({
  markdown: {
    config: (md) => {
      md.use(mathjax3)
      md.use(wikilinks(wikilinksOptions))
    },
    theme: {
      light: 'github-light',
      dark: 'ayu-dark'
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
  title: parsedConfigToml.meta.title,
  base: '/',
  srcDir: './docs',
  cacheDir: './node_modules/vitepress_cache',
  rewrites: {},
  description: 'vitepress,blog,blog-theme',
  ignoreDeadLinks: true,
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
    meta: parsedConfigToml.meta
  } as any,
  srcExclude: ['README.md'], // exclude the README.md , needn't to compiler
  vite: {
    server: { port: 5000 },
    plugins: [
      UnoCSS(),
      generateThemePlugin(),
      RssPlugin(RSS),
      markdownAnalyzerPlugin()
    ],
    resolve: {
      alias: {
        '@': srcPath,
        '~': rootPath
      }
    }
  }
})
