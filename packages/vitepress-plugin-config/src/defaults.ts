export const CONFIG_PATH = '.vitepress/config.toml'

export const DEFAULT_PAGE_SIZE = 10

export const DEFAULT_BLOG = {
  defaultViewMode: 'card'
} as const

export const DEFAULT_TIMELINE = {
  sortDirection: 'desc'
} as const

export const DEFAULT_OUTLINE = {
  title: 'Table of Contents'
} as const

export const DEFAULT_LINKS = {
  resolutionModes: [
    'repoRoot',
    'absolutePath',
    'relativeToCurrentFile',
    'obsidianShortest'
  ]
} as const

export const DEFAULT_HOMEPAGE = {
  title: 'Blog',
  description: ''
} as const

export const DEFAULT_NAV_LABELS = {
  home: 'Home',
  tags: 'Tags',
  timeline: 'Timeline',
  pages: 'Pages',
  about: 'About'
} as const

export const DEFAULT_META = {
  author: 'Blogger',
  locale: 'zh_CN',
  'theme-color': '#1934e9',
  themeLink: 'https://github.com/Albert26193/vitepress-theme-link'
} as const

export const DEFAULT_MARKDOWN_THEME = {
  light: 'github-light',
  dark: 'ayu-dark'
} as const

/**
 * Default font-family stacks, mirrored verbatim by the SCSS `var(..., <default>)`
 * fallbacks. These are only used as a reference/contract for tests; the SCSS side
 * owns the live defaults. `cjkFallback` is what node.ts appends to user-configured
 * values so a custom font can never leave Chinese text as tofu (□) or blank.
 */
export const FONT_DEFAULTS = {
  serif:
    "'Times New Roman', times, 'Heti Song', serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",
  sans: "'Helvetica Neue', helvetica, arial, 'Heti Hei', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",
  mono: "'Iosevka', 'Fira Code', 'JetBrains Mono', 'Menlo', 'Consolas', 'Monaco', 'Andale Mono', 'Ubuntu Mono', 'Courier New', 'Heti Hei', monospace",
  cjkFallback: {
    serif: "'Heti Song', serif",
    sans: "'Heti Hei', sans-serif",
    mono: "'Heti Hei', monospace"
  }
} as const

/**
 * Defaults for webfont loading via a Google Fonts css2-compatible endpoint.
 * The default base is a mainland-China-friendly mirror (fonts.googleapis.com
 * is unreliable there); override with `theme.fonts.webfontBase` — any
 * path-compatible reverse proxy works, including the official origin.
 * fonts.font.im was rejected as default: its TLS cert was expired at the time
 * of writing, which is exactly the failure mode the override field exists for.
 */
export const WEBFONT_DEFAULTS = {
  base: 'https://fonts.loli.net',
  display: 'swap'
} as const

export const THEME_COLOR_DEFAULTS = {
  light: {
    'vp-c-bg': '#ffffff',
    'vp-c-bg-alt': '#f6f6f6',
    'vp-c-bg-soft': '#f6f6f7',
    'vp-c-brand': '#9873f7',
    'vp-c-brand-1': '#8a5cf5',
    'vp-c-brand-2': '#a68af9',
    'vp-c-text-1': '#222222',
    'vp-c-text-2': '#5c5c5c',
    'vp-c-text-3': '#929295',
    'vp-c-divider': '#e0e0e0',
    'vp-button-brand-bg': '#9873f7',
    'vp-code-bg': '#f6f6f6',
    'vp-code-block-bg': '#f6f6f6',
    'vp-sidebar-bg-color': '#f6f6f6',
    'c-text-code': '#e93147',
    'c-text-strong': '#111111',
    'c-text-em': '#086ddd',
    'main-page-text': '#050505'
  },
  dark: {
    'vp-c-bg': '#1e1e1e',
    'vp-c-bg-alt': '#262626',
    'vp-c-bg-soft': '#202127',
    'vp-c-brand': '#8a5cf5',
    'vp-c-brand-1': '#a68af9',
    'vp-c-brand-2': '#c5b6fc',
    'vp-c-text-1': '#dadada',
    'vp-c-text-2': '#b3b3b3',
    'vp-c-text-3': '#6a6a71',
    'vp-c-divider': '#363636',
    'vp-button-brand-bg': '#8a5cf5',
    'vp-code-bg': '#262626',
    'vp-code-block-bg': '#262626',
    'vp-sidebar-bg-color': '#242424',
    'c-text-code': '#fb464c',
    'c-text-strong': '#ebebeb',
    'c-text-em': '#027aff',
    'main-page-text': '#f0f0f0'
  }
} as const
