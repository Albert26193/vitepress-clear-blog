export interface ThemeConfig {
  'vp-c-bg'?: string
  'vp-c-brand'?: string
  'vp-c-brand-1'?: string
  'vp-button-brand-bg'?: string
  'c-text-code'?: string
  'c-text-strong'?: string
  'c-text-em'?: string
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
  theme: ThemeConfig
  'theme.dark'?: ThemeConfig
}
