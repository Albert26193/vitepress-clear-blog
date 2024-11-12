import fse from 'fs-extra'
import mathjax3 from 'markdown-it-mathjax3'
import path from 'path'
import { parse } from 'smol-toml'
import UnoCSS from 'unocss/vite'
import svgLoader from 'vite-svg-loader'
import { defineConfig } from 'vitepress'

import { customElements } from './theme/config/constant'
import { head } from './theme/config/head'
import { nav } from './theme/config/nav'
import { getPosts } from './theme/serverUtils'
import { BlogConfig } from './theme/types'

// const vitepressSidebarOptions = {
//   /* Options... */
//   documentRootPath: 'docs',
//   scanStartPath: 'collections',
//   resolvePath: 'docs/collections'
// }

const parsedConfigToml = parse(
  await fse.readFile(
    path.resolve(path.resolve(__dirname, '..'), '.vitepress/theme/config/config.toml'),
    'utf-8'
  )
)
const pageSize = 10
const postArcticles = await getPosts(pageSize)

console.log(parsedConfigToml)

const tomlTheme = parsedConfigToml.theme as { brandColor?: string } | undefined
const brandColor = tomlTheme?.brandColor || '#ae1f7c'

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
  title: parsedConfigToml.title as string,
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
    socialLinks: [{ icon: 'github', link: 'https://github.com/airene/vitepress-blog-pure' }]
  } as BlogConfig,
  srcExclude: ['README.md'], // exclude the README.md , needn't to compiler
  vite: {
    //build: { minify: false }
    server: { port: 5000 },
    plugins: [UnoCSS(), svgLoader()],
    define: {
      'process.env': {
        VITE_BRAND_COLOR: JSON.stringify(brandColor)
      }
    }
  }
})
