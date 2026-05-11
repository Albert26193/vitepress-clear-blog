import footnotePlugin from 'markdown-it-footnote'
// @ts-expect-error - markdown-it-hashtag has no type declarations
import markdownItHashtag from 'markdown-it-hashtag'
import mathjax3 from 'markdown-it-mathjax3'
import wikilinks from 'markdown-it-wikilinks'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from 'smol-toml'
import { presetIcons, presetUno, transformerDirectives } from 'unocss'
import UnoCSS from 'unocss/vite'
import { vitePressAnalyzerPlugin } from 'vitepress-plugin-analyzer'
import { calloutPlugin } from 'vitepress-plugin-callout'
import { generateThemePlugin } from 'vitepress-plugin-config'
import type { ConfigToml } from 'vitepress-plugin-config'
import llmstxt from 'vitepress-plugin-llms'
import { type RSSOptions, RssPlugin } from 'vitepress-plugin-rss'

import { getFooterRefTag, getHashtag, mermaidPlugin } from './mdEnhance'

const assignedConfigPath = '.vitepress/custom/config.toml'

const readConfig = (configPath?: string): ConfigToml | null => {
  const path = resolve(process.cwd(), configPath || assignedConfigPath)
  try {
    const raw = readFileSync(path, 'utf-8')
    return parse(raw) as unknown as ConfigToml
  } catch {
    return null
  }
}

/**
 * Creates the default Clear Blog VitePress config fragment with core plugins wired in.
 *
 * @param cfg - Clear Blog options to merge into the generated config.
 * @returns VitePress config fragment used by consuming docs sites.
 */
const getThemeConfig = async (
  cfg: Record<string, unknown> = {}
): Promise<Record<string, unknown>> => {
  const toml = readConfig()
  const meta = toml?.meta || {}

  const RSS: RSSOptions = {
    title: meta.title || 'Blog',
    description: meta.description || '',
    baseUrl: meta.siteUrl || '',
    copyright: meta.author ? `Copyright ${meta.author}` : '',
    author: meta.author ? { name: meta.author } : { name: 'Blogger' }
  }

  const rssValid = /^https?:\/\/.+/.test(RSS.baseUrl)

  return {
    clearBlogConfig: {
      title: 'TTTTTTTitle',
      ...cfg
    },
    vite: {
      css: {
        preprocessorOptions: {
          scss: {
            api: 'modern'
          }
        }
      },
      server: { port: 4000, watch: { usePolling: true } },
      optimizeDeps: {
        exclude: ['gzip-size']
      },
      plugins: [
        vitePressAnalyzerPlugin(),
        llmstxt(),
        generateThemePlugin(),
        UnoCSS({
          transformers: [transformerDirectives()],
          presets: [
            presetUno(),
            presetIcons({
              warn: true,
              prefix: ['i-'],
              extraProperties: { display: 'inline-block' }
            })
          ],
          rules: [
            [/^slide-enter-(\d+)$/, ([_, n]) => ({ '--enter-stage': n })]
          ],
          shortcuts: [
            [
              'card-hover',
              'transition duration-200 ease-in-out dark:hover:border-blue hover:border-blue border'
            ],
            [
              'title-font',
              'text-left text-blue font-600 text-2xl my-4 text-shadow'
            ],
            ['title-btn', 'my-4 mb-[150px] flex flex-row justify-start'],
            [
              'common-border',
              'inline-flex mr-4 rounded px-4 py-2 font-bold focus:outline-none focus-visible:ring hover:cursor-default transition duration-100 animate-shadow text-gray-800 dark:text-gray-100'
            ],
            ['card-border', 'rounded-md z-50 hover:cursor-default'],
            [
              'tag',
              'rounded-full px-2 py-1 text-xs border border-solid border-gray-600 text-gray-900 cursor-pointer hover:border-[var(--vp-c-brand)] hover:text-[var(--vp-c-brand)] dark:border-gray-300/90 dark:text-gray-300/90'
            ],
            [
              'tag-active',
              'tag border-[var(--vp-c-brand)] bg-[var(--vp-c-brand)] text-white'
            ],
            ['custom-page-layout', 'w-full h-full mx-auto']
          ]
        }),
        ...(rssValid ? [RssPlugin(RSS)] : [])
      ]
    }
  }
}

/**
 * Creates a complete VitePress user config from config.toml. This is the
 * primary public API for consumers — it reads the TOML file and wires up
 * markdown plugins, Vite plugins, head metadata, and theme config so that
 * the consumer's config.ts is minimal.
 *
 * @returns VitePress user config object suitable for `defineConfig()`.
 */
const createBlog = async (): Promise<Record<string, unknown>> => {
  const toml = readConfig()
  const meta = toml?.meta || {}
  const mdConf = toml?.markdown || {}
  const navLabels = toml?.nav || {}

  const base = await getThemeConfig()

  const nav: { text: string; link: string }[] = [
    { text: navLabels.home || 'Home', link: '/' },
    { text: navLabels.tags || 'Tags', link: '/tags' },
    { text: navLabels.timeline || 'Timeline', link: '/timeline' },
    { text: navLabels.pages || 'Pages', link: '/pages' },
    { text: navLabels.about || 'About', link: '/about' }
  ]

  const head: [string, Record<string, string>][] = [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'author', content: meta.author || 'Blogger' }],
    ['meta', { name: 'keywords', content: meta.keywords || '' }],
    ['meta', { name: 'HandheldFriendly', content: 'True' }],
    ['meta', { name: 'MobileOptimized', content: '320' }],
    [
      'meta',
      { name: 'theme-color', content: meta['theme-color'] || '#1934e9' }
    ],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:locale', content: meta.locale || 'zh_CN' }],
    ['meta', { property: 'og:title', content: meta.title || 'Blog' }],
    ['meta', { property: 'og:description', content: meta.description || '' }],
    ['meta', { property: 'og:site', content: meta.siteUrl || '' }],
    ['meta', { property: 'og:site_name', content: meta.title || 'Blog' }]
  ]

  const markdown = {
    theme: { light: 'github-light', dark: 'ayu-dark' },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    config: (md: any) => {
      if (mdConf.mathjax !== false) md.use(mathjax3)
      if (mdConf.wikilinks !== false) {
        md.use(
          wikilinks({
            baseURL: '/',
            htmlAttributes: { class: 'clear-wikilink' }
          })
        )
      }
      if (mdConf.footnote !== false) md.use(footnotePlugin)
      if (mdConf.hashtag !== false) md.use(markdownItHashtag)
      if (mdConf.mermaid !== false) md.use(mermaidPlugin)
      if (mdConf.callout !== false) md.use(calloutPlugin)
      getFooterRefTag(md)
      getHashtag(md)
    }
  }

  return {
    extends: base.clearBlogConfig,
    base: process.env.VITEPRESS_BASE || '/',
    srcDir: './docs',
    srcExclude: ['README.md'],
    ignoreDeadLinks: true,
    title: meta.title || 'Blog',
    description: meta.description || '',
    head,
    markdown,
    vite: base.vite,
    themeConfig: { nav }
  }
}

export {
  createBlog,
  getFooterRefTag,
  getHashtag,
  getThemeConfig,
  mermaidPlugin
}
