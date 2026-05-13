import footnotePlugin from 'markdown-it-footnote'
import mathjax3 from 'markdown-it-mathjax3'
import wikilinks from 'markdown-it-wikilinks'
import { presetIcons, presetUno, transformerDirectives } from 'unocss'
import UnoCSS from 'unocss/vite'
import {
  type ResolutionMode,
  vitePressAnalyzerPlugin
} from 'vitepress-plugin-analyzer'
import { calloutPlugin } from 'vitepress-plugin-callout'
import {
  DEFAULT_BLOG,
  DEFAULT_META,
  DEFAULT_NAV_LABELS,
  DEFAULT_PAGE_SIZE,
  DEFAULT_TIMELINE,
  generateThemePlugin,
  loadConfig
} from 'vitepress-plugin-config'
import { hashtagPlugin } from 'vitepress-plugin-hashtag'
import llmstxt from 'vitepress-plugin-llms'
import { type RSSOptions, RssPlugin } from 'vitepress-plugin-rss'

import { getFooterRefTag, mermaidPlugin } from './mdEnhance'

/**
 * Creates the default Clear Blog VitePress config fragment with core plugins wired in.
 *
 * @param cfg - Clear Blog options to merge into the generated config.
 * @returns VitePress config fragment used by consuming docs sites.
 */
const getThemeConfig = async (
  cfg: Record<string, unknown> = {}
): Promise<Record<string, unknown>> => {
  const toml = loadConfig()
  const meta = toml?.meta || {}

  const RSS: RSSOptions = {
    title: meta.title || 'Blog',
    description: meta.description || '',
    baseUrl: meta.siteUrl || '',
    copyright: meta.author ? `Copyright ${meta.author}` : '',
    author: meta.author ? { name: meta.author } : { name: DEFAULT_META.author }
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
        vitePressAnalyzerPlugin({
          ...(toml?.links?.resolutionModes?.length
            ? {
                resolutionModes: toml.links.resolutionModes as ResolutionMode[]
              }
            : {})
        }),
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
  const toml = loadConfig()
  const meta = toml?.meta || {}
  const page = toml?.page || {}
  const mdConf = toml?.markdown || {}
  const navLabels = toml?.nav || {}
  const blog = toml?.blog || {}
  const timeline = toml?.timeline || {}

  const base = await getThemeConfig()

  const nav: { text: string; link: string }[] = [
    { text: navLabels.home || DEFAULT_NAV_LABELS.home, link: '/' },
    { text: navLabels.tags || DEFAULT_NAV_LABELS.tags, link: '/tags' },
    {
      text: navLabels.timeline || DEFAULT_NAV_LABELS.timeline,
      link: '/timeline'
    },
    { text: navLabels.pages || DEFAULT_NAV_LABELS.pages, link: '/pages' },
    { text: navLabels.about || DEFAULT_NAV_LABELS.about, link: '/about' }
  ]

  const head: [string, Record<string, string>][] = [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'author', content: meta.author || DEFAULT_META.author }],
    ['meta', { name: 'keywords', content: meta.keywords || '' }],
    ['meta', { name: 'HandheldFriendly', content: 'True' }],
    ['meta', { name: 'MobileOptimized', content: '320' }],
    [
      'meta',
      {
        name: 'theme-color',
        content: meta['theme-color'] || DEFAULT_META['theme-color']
      }
    ],
    ['meta', { property: 'og:type', content: 'website' }],
    [
      'meta',
      { property: 'og:locale', content: meta.locale || DEFAULT_META.locale }
    ],
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
      if (mdConf.hashtag !== false) md.use(hashtagPlugin)
      if (mdConf.mermaid !== false) md.use(mermaidPlugin)
      if (mdConf.callout !== false) md.use(calloutPlugin)
      getFooterRefTag(md)
    }
  }

  const customElements = [
    'mjx-container',
    'mjx-assistive-mml',
    'math',
    'maction',
    'maligngroup',
    'malignmark',
    'menclose',
    'merror',
    'mfenced',
    'mfrac',
    'mi',
    'mlongdiv',
    'mmultiscripts',
    'mn',
    'mo',
    'mover',
    'mpadded',
    'mphantom',
    'mroot',
    'mrow',
    'ms',
    'mscarries',
    'mscarry',
    'msgroup',
    'mspace',
    'msqrt',
    'msrow',
    'mstack',
    'mstyle',
    'msub',
    'msup',
    'msubsup',
    'mtable',
    'mtd',
    'mtext',
    'mtr',
    'munder',
    'munderover',
    'none',
    'semantics',
    'annotation',
    'annotation-xml',
    'mprescripts'
  ]

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
    vite: {
      ...(base.vite as Record<string, unknown>),
      define: {
        ...(((base.vite as Record<string, unknown>)?.define as Record<
          string,
          string
        >) || {}),
        __WIKI_RENDER_TITLE__: JSON.stringify(
          (mdConf as Record<string, unknown>).render_title ||
            'frontmatter_title'
        )
      }
    },
    vue: {
      template: {
        compilerOptions: {
          isCustomElement: (tag: string) => customElements.includes(tag)
        }
      }
    },
    themeConfig: {
      nav,
      sidebar: [{ text: '', items: [] }],
      search: { provider: 'local' },
      outline: [2, 3],
      outlineTitle: 'Table of Contents',
      wikiRenderTitle:
        (mdConf as Record<string, unknown>).render_title || 'frontmatter_title',
      website: meta.siteUrl || '',
      icpNumber: meta.icpNumber || '',
      themeLink: meta.themeLink || DEFAULT_META.themeLink,
      pageSize: page.pageSize || DEFAULT_PAGE_SIZE,
      defaultViewMode: blog.defaultViewMode || DEFAULT_BLOG.defaultViewMode,
      timelineSortDirection:
        timeline.sortDirection || DEFAULT_TIMELINE.sortDirection,
      dateFormat: toml?.datetime?.outputFormat || undefined,
      meta: { author: meta.author || DEFAULT_META.author }
    }
  }
}

export { createBlog, getFooterRefTag, getThemeConfig, mermaidPlugin }
