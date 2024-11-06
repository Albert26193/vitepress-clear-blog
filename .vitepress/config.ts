import mathjax3 from 'markdown-it-mathjax3'
import UnoCSS from 'unocss/vite'
import fse from 'fs-extra'
import path from 'path'
import { parse } from 'smol-toml'
import { defineConfig } from 'vitepress'
import { customElements } from './theme/config/constant'
import { head } from './theme/config/head'
import { nav } from './theme/config/nav'
import { getPosts } from './theme/serverUtils'
import { BlogConfig } from './theme/types'
import svgLoader from 'vite-svg-loader'
import { generateSidebar } from 'vitepress-sidebar'

// const vitepressSidebarOptions = {
//   /* Options... */
//   documentRootPath: 'docs',
//   scanStartPath: 'collections',
//   resolvePath: 'docs/collections'
// }

const pageSize = 10
const postArcticles = await getPosts(pageSize)

const parsedConfigToml = parse(
  await fse.readFile(
    path.resolve(path.resolve(__dirname, '..'), '.vitepress/theme/config/config.toml'),
    'utf-8'
  )
)
console.log(parsedConfigToml)

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
    plugins: [UnoCSS(), svgLoader()]
  }
})
