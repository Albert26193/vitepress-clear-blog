import { markdownAnalyzerPlugin } from '@blog/plugin-analyzer'
import { generateThemePlugin } from '@blog/plugin-config'
import mathjax3 from 'markdown-it-mathjax3'
import wikilinks from 'markdown-it-wikilinks'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vitepress'
// .vitepress/config.js
import { withMermaid } from 'vitepress-plugin-mermaid'
import { RSSOptions, RssPlugin } from 'vitepress-plugin-rss'
import { generateSidebar } from 'vitepress-sidebar'
// import { withSidebar } from 'vitepress-sidebar'

import { head } from './custom/head'
import { nav } from './custom/nav'
import { customElements } from './custom/constant'
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
// TODO: reorganize the config
export default defineConfig(
  withMermaid({
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
      socialLinks: [{ icon: 'github', link: 'https://github.com' }],
      // TODO: use 'usefunc' to get the meta data and post articles
      // posts: postArticles,
      // meta: parsedConfigToml.meta
    } as any,
    srcExclude: ['README.md'], // exclude the README.md , needn't to compiler
    vite: {
      server: { port: 5000 },
      plugins: [
        // UnoCSS(),
        // generateThemePlugin(),
        // RssPlugin(RSS),
        // markdownAnalyzerPlugin()
      ],
      resolve: {
        // alias: {
        //   '@': srcPath,
        //   '~': rootPath
        // }
      }
    }
  })
)
