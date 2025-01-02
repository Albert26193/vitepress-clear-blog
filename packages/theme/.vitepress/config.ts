import mathjax3 from 'markdown-it-mathjax3'
import wikilinks from 'markdown-it-wikilinks'
import * as path from 'path'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vitepress'
// .vitepress/config.js
import { generateSidebar } from 'vitepress-sidebar'

import { getRootPath, getSrcPath } from '../src/utils/serverUtils'

// Load TOML config at build time

const rootPath = getRootPath()
const srcPath = getSrcPath('src')

// Debug path resolution
console.log('Path Resolution Debug:')
console.log('__dirname:', __dirname)
console.log('rootPath:', rootPath)
console.log('srcPath:', srcPath)
console.log('@alias:', path.resolve(__dirname, '../src'))
console.log('~alias:', rootPath)

// TODO: config.toml: [theme] -> brandColor

// TODO: temp test options here
const wikilinksOptions = {
  baseURL: 'http://10.177.73.149:5000',
  htmlAttributes: {
    class: 'clear-wikilink'
    // rel: 'nofollow'
  }
}

//default options
// TODO: reorganize the config
export default defineConfig({
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
  vue: {
    template: {
      compilerOptions: {
        // isCustomElement: (tag) => customElements.includes(tag)
      }
    }
  },
  base: '/',
  srcDir: './docs',
  cacheDir: './node_modules/vitepress_cache',
  rewrites: {},
  description: 'vitepress,blog,blog-theme',
  ignoreDeadLinks: true,
  themeConfig: {
    search: {
      provider: 'local'
    },
    outline: [2, 3],
    outlineTitle: 'On this page',
    socialLinks: [{ icon: 'github', link: 'https://github.com' }]
    // TODO: use 'usefunc' to get the meta data and post articles
  },
  srcExclude: ['README.md'], // exclude the README.md , needn't to compiler
  vite: {
    server: { port: 5000 },
    plugins: [
      UnoCSS(),
      {
        name: 'path-resolver-debug',
        configResolved(config) {
          console.log('\nVite Resolved Config:')
          console.log('root:', config.root)
          console.log('base:', config.base)
          console.log('resolved alias:', config.resolve.alias)
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '../src'),
        '~': rootPath
      }
    }
  }
})
