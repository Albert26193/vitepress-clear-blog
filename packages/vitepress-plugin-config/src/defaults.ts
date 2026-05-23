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

export const THEME_COLOR_DEFAULTS = {
  light: {
    'vp-c-bg': '#ffffff',
    'vp-c-bg-alt': '#f6f6f6',
    'vp-c-brand': '#9873f7',
    'vp-c-brand-1': '#8a5cf5',
    'vp-c-brand-2': '#a68af9',
    'vp-c-text-1': '#222222',
    'vp-c-text-2': '#5c5c5c',
    'vp-c-divider': '#e0e0e0',
    'vp-button-brand-bg': '#9873f7',
    'vp-code-bg': '#f6f6f6',
    'vp-code-block-bg': '#f6f6f6',
    'vp-sidebar-bg-color': '#f6f6f6',
    'c-text-code': '#e93147',
    'c-text-strong': '#111111',
    'c-text-em': '#086ddd'
  },
  dark: {
    'vp-c-bg': '#1e1e1e',
    'vp-c-bg-alt': '#262626',
    'vp-c-brand': '#8a5cf5',
    'vp-c-brand-1': '#a68af9',
    'vp-c-brand-2': '#c5b6fc',
    'vp-c-text-1': '#dadada',
    'vp-c-text-2': '#b3b3b3',
    'vp-c-divider': '#363636',
    'vp-button-brand-bg': '#8a5cf5',
    'vp-code-bg': '#262626',
    'vp-code-block-bg': '#262626',
    'vp-sidebar-bg-color': '#242424',
    'c-text-code': '#fb464c',
    'c-text-strong': '#ebebeb',
    'c-text-em': '#027aff'
  }
} as const
