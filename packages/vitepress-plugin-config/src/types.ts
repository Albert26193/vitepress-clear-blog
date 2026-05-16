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
export interface DatetimeConfig {
  frontmatterFields?: string[]
  formats?: string[]
  outputFormat?: string
}

export interface HomepageConfig {
  title?: string
  description?: string
}

export interface BlogConfig {
  defaultViewMode?: 'card' | 'list'
}

export interface OutlineConfig {
  title?: string
}

export interface TimelineConfig {
  sortDirection?: 'desc' | 'asc'
}

export interface LinksConfig {
  resolutionModes?: string[]
}

export interface NavLabels {
  home?: string
  tags?: string
  timeline?: string
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
    icpNumber?: string
    themeLink?: string
  }
  homepage?: HomepageConfig
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
    render_title?: 'frontmatter_title' | 'first_heading' | 'alias' | 'file_name'
  }
  datetime?: DatetimeConfig
  blog?: BlogConfig
  outline?: OutlineConfig
  timeline?: TimelineConfig
  links?: LinksConfig
  theme: ThemeConfig
}
