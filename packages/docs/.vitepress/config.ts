import { defineConfig as defineThemeConfig } from '@blog/theme/node'
import mathjax3 from 'markdown-it-mathjax3'

import { customElements } from './custom/constant'
import { head } from './custom/head'

// import { nav } from './custom/nav'

export default defineThemeConfig({
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
  title: 'demo',
  base: '/',
  head,
  // themeConfig: {
  //   nav,
  //   socialLinks: [{ icon: 'github', link: 'https://github.com' }]
  // } as any,
  srcExclude: ['README.md'], // exclude the README.md , needn't to compiler
  ignoreDeadLinks: true
})
