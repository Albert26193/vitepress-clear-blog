import footnotePlugin from 'markdown-it-footnote'
import mathjax3 from 'markdown-it-mathjax3'
// @ts-expect-error - markdown-it-wikilinks has no type declarations
import wikilinks from 'markdown-it-wikilinks'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from 'smol-toml'
import { defineConfig } from 'vitepress'
import { getThemeConfig } from 'vitepress-clear-blog/node'
import { getFooterRefTag, mermaidPlugin } from 'vitepress-clear-blog/node'
import { calloutPlugin } from 'vitepress-plugin-callout'
import { hashtagPlugin } from 'vitepress-plugin-hashtag'

import { customElements } from './custom/constant'
import { head } from './custom/head'
import { nav } from './custom/nav'

const tomlPath = resolve(import.meta.dirname, 'custom/config.toml')
let siteTitle = 'Blog'
try {
  const raw = readFileSync(tomlPath, 'utf-8')
  const parsed = parse(raw) as Record<string, unknown>
  const meta = (parsed.meta as Record<string, string>) || {}
  siteTitle = meta.title || 'Blog'
} catch {
  // fall back to default title if config.toml is missing
}

const wikilinksOptions = {
  baseURL: '/',
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
const base = process.env.VITEPRESS_BASE || '/'

export default defineConfig({
  extends: blogTheme.clearBlogConfig,
  markdown: {
    config: (md) => {
      md.use(mathjax3)
      md.use(wikilinks(wikilinksOptions))
      md.use(footnotePlugin)
      md.use(hashtagPlugin)
      md.use(mermaidPlugin)
      md.use(calloutPlugin)
      getFooterRefTag(md)
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
  vite: blogTheme.vite as object,
  title: siteTitle,
  base,
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
