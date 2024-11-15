import mathjax3 from 'markdown-it-mathjax3'
import path from 'path'
import UnoCSS from 'unocss/vite'
import svgLoader from 'vite-svg-loader'
import { defineConfig } from 'vitepress'

import { generateThemePlugin } from './plugins/preBuild'
import { customElements } from './theme/config/constant'
import { head } from './theme/config/head'
import { nav } from './theme/config/nav'
import { BlogConfig } from './theme/types'
import { getPosts } from './theme/utils/serverUtils'
import { parsedConfigToml } from './theme/utils/serverUtils'

// TODO: config.toml: [theme] -> brandColor
const pageSize = 10
const postArcticles = await getPosts(pageSize)

// console.log(parsedConfigToml)

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
  title: parsedConfigToml.meta.title,
  base: '/',
  srcDir: './docs',
  cacheDir: './node_modules/vitepress_cache',
  rewrites: {},
  description: 'vitepress,blog,blog-theme',
  ignoreDeadLinks: true,
  themeConfig: {
    // sidebar: generateSidebar(vitepressSidebarOptions),
    posts: postArcticles,
    website: '',
    search: {
      provider: 'local'
    },
    nav,
    outline: [2, 3],
    outlineTitle: 'Table of Contents',
    socialLinks: [
      { icon: 'github', link: 'https://github.com/airene/vitepress-blog-pure' }
    ]
  } as BlogConfig,
  srcExclude: ['README.md'], // exclude the README.md , needn't to compiler
  vite: {
    server: { port: 5000 },
    plugins: [UnoCSS(), svgLoader(), generateThemePlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '/.vitepress/theme'),
        '@docs': path.resolve(__dirname, '/docs')
      }
    }
  }
})
