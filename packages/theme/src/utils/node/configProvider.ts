import type MarkdownIt from 'markdown-it'
import footnotePlugin from 'markdown-it-footnote'
import mathjax3 from 'markdown-it-mathjax3'
import UnoCSS from 'unocss/vite'
import {
  type ResolutionMode,
  vitePressAnalyzerPlugin
} from 'vitepress-plugin-analyzer'
import { calloutPlugin } from 'vitepress-plugin-callouts'
import {
  DEFAULT_BLOG,
  DEFAULT_HOMEPAGE,
  DEFAULT_META,
  DEFAULT_NAV_LABELS,
  DEFAULT_OUTLINE,
  DEFAULT_PAGE_SIZE,
  DEFAULT_TIMELINE,
  generateThemePlugin,
  loadConfig
} from 'vitepress-plugin-config'
import { hashtagPlugin } from 'vitepress-plugin-hashtag'
import { imageDimensionPlugin } from 'vitepress-plugin-image-dimension'
import type { ImageDimensionPluginOptions } from 'vitepress-plugin-image-dimension'
import llmstxt from 'vitepress-plugin-llms'
import { type RSSOptions, RssPlugin } from 'vitepress-plugin-rss'

import { classifyHref } from '../linkKind'
import { resolveDate } from './datetime'
import { getFooterRefTag, mermaidPlugin } from './mdEnhance'
import { createWikilinkPlugin } from './wikilinkPlugin'

type ImageDimensionTomlConfig = {
  enabled?: boolean
  alt_preset?: boolean
  github_title_suffix?: boolean
  pandoc_attr_list?: boolean
  obsidian_bare_size?: boolean
  obsidian_pixel_size?: boolean
  url_query_params?: boolean
  html_title_size?: boolean
  strip_dimension_query?: boolean
  presets?: ImageDimensionPluginOptions['presets']
}

const resolveImageDimensionOptions = (
  config: boolean | ImageDimensionTomlConfig | undefined
): ImageDimensionPluginOptions | false => {
  if (config === false) return false
  if (config === true || config === undefined) return {}
  if (config.enabled === false) return false

  return {
    conventions: {
      altPreset: config.alt_preset,
      githubTitleSuffix: config.github_title_suffix,
      pandocAttrList: config.pandoc_attr_list,
      obsidianBareSize: config.obsidian_bare_size,
      obsidianPixelSize: config.obsidian_pixel_size,
      urlQueryParams: config.url_query_params,
      htmlTitleSize: config.html_title_size
    },
    presets: config.presets,
    stripDimensionQuery: config.strip_dimension_query
  }
}

const isLinkStyleTargetHref = (href: string): boolean =>
  classifyHref(href) === 'pageCandidate'

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
      build: {
        chunkSizeWarningLimit: 2000
      },
      css: {
        preprocessorOptions: {
          scss: {
            api: 'modern'
          }
        }
      },
      server: { watch: { usePolling: true } },
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
        UnoCSS(),
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
const createBlog = async (
  cfg: Record<string, unknown> = {}
): Promise<Record<string, unknown>> => {
  const toml = loadConfig()
  const meta = toml?.meta || {}
  const homepage = toml?.homepage || {}
  const page = toml?.page || {}
  const mdConf = toml?.markdown || {}
  const navLabels = toml?.nav || {}
  const outline = toml?.outline || {}
  const blog = toml?.blog || {}
  const timeline = toml?.timeline || {}

  const base = await getThemeConfig(cfg)

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

  const vitePressBase = process.env.VITEPRESS_BASE || '/'
  const cleanUrls = cfg.cleanUrls === true
  const userTransformPageData = cfg.transformPageData as
    | ((pageData: { frontmatter?: Record<string, unknown> }) => unknown)
    | undefined

  const wikiLinkPlugin =
    mdConf.wikilinks !== false
      ? await createWikilinkPlugin(
          toml?.links?.resolutionModes as ResolutionMode[] | undefined,
          {},
          { base: vitePressBase, cleanUrls }
        )
      : null

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
    config: (md: MarkdownIt) => {
      const defaultLinkOpen =
        md.renderer.rules.link_open ||
        ((tokens, idx, options, _env, self) =>
          self.renderToken(tokens, idx, options))

      md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
        const token = tokens[idx]
        const href = token.attrGet('href')
        if (isLinkStyleTargetHref(href || '')) {
          token.attrSet('data-link-style-target', '')
        }
        return defaultLinkOpen(tokens, idx, options, env, self)
      }

      if (mdConf.mathjax !== false) md.use(mathjax3)
      if (mdConf.wikilinks !== false && wikiLinkPlugin) {
        md.use(wikiLinkPlugin)
      }
      if (mdConf.footnote !== false) md.use(footnotePlugin)
      if (mdConf.hashtag !== false) md.use(hashtagPlugin)
      if (mdConf.mermaid !== false) {
        md.use(mermaidPlugin, { renderMode: mdConf.mermaid_render || 'auto' })
      }
      if (mdConf.callout !== false) md.use(calloutPlugin)
      const imageDimensionOptions = resolveImageDimensionOptions(
        mdConf.image_dimension
      )
      if (imageDimensionOptions !== false) {
        md.use(imageDimensionPlugin, imageDimensionOptions)
      }
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
    base: vitePressBase,
    srcDir: './docs',
    srcExclude: ['README.md'],
    ignoreDeadLinks: true,
    title: meta.title || 'Blog',
    description: meta.description || '',
    head,
    markdown,
    transformPageData(pageData: { frontmatter?: Record<string, unknown> }) {
      if (pageData.frontmatter) {
        const normalized = resolveDate(
          pageData.frontmatter,
          toml?.datetime || {}
        )
        if (normalized) {
          pageData.frontmatter.date = normalized
        }
      }
      return userTransformPageData?.(pageData)
    },
    vite: {
      ...(base.vite as Record<string, unknown>),
      define: {
        ...(((base.vite as Record<string, unknown>)?.define as Record<
          string,
          string
        >) || {}),
        __RENDER_TITLE__: JSON.stringify(
          (mdConf as Record<string, unknown>).render_title ||
            'frontmatter_title'
        ),
        __LINK_STYLE__: JSON.stringify(
          (mdConf as Record<string, unknown>).link_style || 'origin'
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
      outlineTitle: outline.title || DEFAULT_OUTLINE.title,
      renderTitle:
        (mdConf as Record<string, unknown>).render_title || 'frontmatter_title',
      linkStyle: (mdConf as Record<string, unknown>).link_style || 'origin',
      website: meta.siteUrl || '',
      icpNumber: meta.icpNumber || '',
      themeLink: meta.themeLink || DEFAULT_META.themeLink,
      homepage: {
        title: homepage.title || meta.title || DEFAULT_HOMEPAGE.title,
        description:
          homepage.description ||
          meta.description ||
          DEFAULT_HOMEPAGE.description
      },
      pageSize: page.pageSize || DEFAULT_PAGE_SIZE,
      pageSizeCard: page.pageSizeCard || undefined,
      pageSizeList: page.pageSizeList || undefined,
      defaultViewMode: blog.defaultViewMode || DEFAULT_BLOG.defaultViewMode,
      timelineSortDirection:
        timeline.sortDirection || DEFAULT_TIMELINE.sortDirection,
      dateFormat: toml?.datetime?.outputFormat || undefined,
      meta: { author: meta.author || DEFAULT_META.author }
    }
  }
}

export { createBlog, getFooterRefTag, getThemeConfig, mermaidPlugin }
