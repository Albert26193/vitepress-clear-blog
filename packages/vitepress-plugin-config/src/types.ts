/**
 * Describes custom CSS variable overrides for both light and dark theme modes.
 */
export interface ThemeConfig {
  'vp-c-bg'?: string
  'vp-c-brand'?: string
  'vp-c-brand-1'?: string
  'vp-c-text-1'?: string
  'vp-button-brand-bg'?: string
  'c-text-code'?: string
  'c-text-strong'?: string
  'c-text-em'?: string
  'vp-sidebar-bg-color'?: string
  dark?: ThemeConfig
}

/**
 * Mirrors the custom TOML file shape consumed by the generated-theme plugin.
 */
export interface NavLabels {
  home?: string
  tags?: string
  timeline?: string
  collections?: string
  pages?: string
  about?: string
}

export interface ConfigToml {
  meta: {
    title?: string
    description?: string
    author?: string
    keywords?: string
    locale?: string
    lang?: string
    siteUrl?: string
    'theme-color'?: string
  }
  page: {
    pageSize?: number
  }
  nav?: NavLabels
  markdown?: {
    mathjax?: boolean
    wikilinks?: boolean
    footnote?: boolean
    hashtag?: boolean
    mermaid?: boolean
    callout?: boolean
  }
  theme: ThemeConfig
}
