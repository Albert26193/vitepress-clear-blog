import { defineConfig as defineThemeConfig } from '@blog/theme'
import mathjax3 from 'markdown-it-mathjax3'
import wikilinks from 'markdown-it-wikilinks'
import * as path from 'path'
import UnoCSS from 'unocss/vite'
import { markdownAnalyzerPlugin } from 'vitepress-plugin-analyzer'
import { generateThemePlugin } from 'vitepress-plugin-config'
// .vitepress/config.js
import { withMermaid } from 'vitepress-plugin-mermaid'
import { RSSOptions, RssPlugin } from 'vitepress-plugin-rss'
import { generateSidebar } from 'vitepress-sidebar'

import { customElements } from './custom/constant'
// import { withSidebar } from 'vitepress-sidebar'
import { head } from './custom/head'
import { nav } from './custom/nav'

// import { getPosts, getRootPath, getSrcPath } from '@blog/theme/src/utils/serverUtils'
// import { parsedConfigToml } from '@blog/theme/src/utils/serverUtils'

// Load TOML config at build time

// TODO: config.toml: [theme] -> brandColor
const pageSize = 10
// const postArticles = await getPosts(pageSize)
// const rootPath = getRootPath()
// const srcPath = getSrcPath('.vitepress')

// const RSS: RSSOptions = {
//   title: parsedConfigToml.meta.title || '222222222',
//   baseUrl: 'http://10.177.73.149:5000',
//   copyright: 'Copyright 111111111'
// }

// TODO: temp test options here
const wikilinksOptions = {
  baseURL: 'http://10.177.73.149:5000',
  htmlAttributes: {
    class: 'clear-wikilink'
    // rel: 'nofollow'
  }
}

const sidebarGenerated = generateSidebar([
  {
    documentRootPath: '/docs',
    scanStartPath: 'collections/life',
    resolvePath: '/collections/life/',
    collapsed: true
  },
  {
    documentRootPath: '/docs',
    scanStartPath: 'collections/cs',
    resolvePath: '/collections/cs/',
    collapsed: true
  },
  {
    documentRootPath: '/docs',
    scanStartPath: 'collections',
    resolvePath: '/collections/',
    collapseDepth: 2
    // debugPrint: true
  }
])

//default options
export default defineThemeConfig({
  // Your site-specific config here
  mermaid: {},
  mermaidPlugin: {
    class: 'clear-blog-mermaid'
  },
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
  // title: parsedConfigToml.meta.title,
  title: 'demo',
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
    socialLinks: [{ icon: 'github', link: 'https://github.com' }]
    // TODO: use 'usefunc' to get the meta data and post articles
    // posts: postArticles,
    // meta: parsedConfigToml.meta
  } as any,
  srcExclude: ['README.md'], // exclude the README.md , needn't to compiler
  vite: {
    server: { port: 5000 },
    plugins: [
      // {
      //   name: 'path-resolver-debug',
      //   configResolved(config) {
      //     console.log('\nVite Resolved Config:')
      //     console.log('__dirname:', __dirname)
      //     console.log('root:', config.root)
      //     console.log('base:', config.base)
      //     console.log(
      //       'resolved alias:',
      //       JSON.stringify(config.resolve.alias, null, 2)
      //     )
      //   }
      // },
      markdownAnalyzerPlugin(),
      UnoCSS()
      // generateThemePlugin(),
      // RssPlugin(RSS),
    ],
    resolve: {
      alias: [
        {
          find: '@blog/theme',
          replacement: path.resolve(__dirname, '../../theme/src/index')
        },
        {
          find: '@',
          replacement: path.resolve(__dirname, '../../theme/src')
        }
      ]
    }
  }
})
