import footnotePlugin from 'markdown-it-footnote'
import markdownItHashtag from 'markdown-it-hashtag'
import mathjax3 from 'markdown-it-mathjax3'
import wikilinks from 'markdown-it-wikilinks'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vitepress'
import { vitePressAnalyzerPlugin } from 'vitepress-plugin-analyzer'
import { generateThemePlugin } from 'vitepress-plugin-config'

import { customElements } from './custom/constant'
import { head } from './custom/head'
import { nav } from './custom/nav'
import { getFooterRefTag, getHashtag, getThemeConfig } from './theme/utils'

const wikilinksOptions = {
  baseURL: 'http://10.177.73.149:5000',
  htmlAttributes: {
    class: 'clear-wikilink'
    // rel: 'nofollow'
  }
}

const analyzerOptions = {
  docsDir: './docs',
  excludeDirs: ['node_modules', '.git', 'dist'],
  includeFiles: ['.md'],
  excludeFiles: ['README.md'],
  ignoreCase: true
}

const blogTheme = await getThemeConfig()
export default defineConfig({
  extends: blogTheme.blog,
  markdown: {
    config: (md) => {
      md.use(mathjax3)
      md.use(wikilinks(wikilinksOptions))
      md.use(footnotePlugin)
      md.use(markdownItHashtag)

      getFooterRefTag(md)
      getHashtag(md)
    },
    theme: {
      light: 'github-light',
      dark: 'ayu-dark'
    }
  },
  vue: {
    template: {
      compilerOptions: {
        isCustomElement: (tag) => customElements.includes(tag)
      }
    }
  },
  // vite: blogTheme.vite,
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler' // or "modern"
        }
      }
    },
    plugins: [
      vitePressAnalyzerPlugin(analyzerOptions),
      // generateThemePlugin(),
      UnoCSS()
      //RssPlugin(RSS)
    ]
  },
  // title: '55555555',
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
    search: {
      provider: 'local'
    },
    nav,
    outline: [2, 3],
    outlineTitle: 'Table of Contents',
    socialLinks: [{ icon: 'github', link: 'https://github.com' }]
  },
  srcExclude: ['README.md'], // exclude the README.md , needn't to compiler
  ignoreDeadLinks: true
})
