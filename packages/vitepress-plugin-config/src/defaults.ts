export const CONFIG_PATH = '.vitepress/custom/config.toml'

export const DEFAULT_PAGE_SIZE = 10

export const DEFAULT_BLOG = {
  defaultViewMode: 'card'
} as const

export const DEFAULT_TIMELINE = {
  sortDirection: 'desc'
} as const

export const DEFAULT_LINKS = {
  resolutionModes: [
    'repoRoot',
    'absolutePath',
    'relativeToCurrentFile',
    'obsidianShortest'
  ]
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
  themeLink: 'https://github.com/Albert26193/vitepress-clear-blog'
} as const

export const THEME_COLOR_DEFAULTS = {
  light: {
    'vp-c-bg': '#fff',
    'vp-c-brand': '#f00',
    'vp-c-brand-1': '#0f0',
    'vp-c-text-1': '#000',
    'vp-button-brand-bg': '#00f',
    'c-text-code': '#ff0',
    'c-text-strong': '#000',
    'c-text-em': '#000',
    'vp-sidebar-bg-color': '#000'
  },
  dark: {
    'vp-c-bg': '#000',
    'vp-c-brand': '#f00',
    'vp-c-brand-1': '#0f0',
    'vp-c-text-1': '#000',
    'vp-button-brand-bg': '#00f',
    'c-text-code': '#ff0',
    'c-text-strong': '#000',
    'c-text-em': '#000',
    'vp-sidebar-bg-color': '#000'
  }
} as const
