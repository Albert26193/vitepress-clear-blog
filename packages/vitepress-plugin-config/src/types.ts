export type MermaidRenderMode = 'auto' | 'ascii' | 'svg'

/**
 * A font-family stack: either a single family or an ordered list of families.
 * Values are emitted into CSS with a CJK fallback appended automatically.
 */
export type FontStack = string | string[]

/**
 * Custom font-family stacks per role. Any role left unset falls through to the
 * theme's built-in default stack, so partial configuration is safe.
 *
 * `webfont` lists families to load from a Google Fonts css2-compatible
 * endpoint; each entry is a family name with an optional axis suffix
 * (e.g. `"Noto Serif SC:wght@400;700"`). `webfontBase` overrides the endpoint
 * origin — the default is a mainland-China-friendly mirror.
 */
export interface FontsConfig {
  sans?: FontStack
  serif?: FontStack
  mono?: FontStack
  webfont?: FontStack
  webfontBase?: string
}

/**
 * Describes custom CSS variable overrides for both light and dark theme modes.
 */
export interface ThemeConfig {
  'vp-c-bg'?: string
  'vp-c-bg-alt'?: string
  'vp-c-brand'?: string
  'vp-c-brand-1'?: string
  'vp-c-brand-2'?: string
  'vp-c-text-1'?: string
  'vp-c-text-2'?: string
  'vp-c-divider'?: string
  'vp-button-brand-bg'?: string
  'vp-code-bg'?: string
  'vp-code-block-bg'?: string
  'vp-sidebar-bg-color'?: string
  'c-text-code'?: string
  'c-text-strong'?: string
  'c-text-em'?: string
  fonts?: FontsConfig
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

export interface ImageDimensionTomlPreset {
  width?: number
  height?: number
}

export interface ImageDimensionTomlConfig {
  enabled?: boolean
  alt_preset?: boolean
  github_title_suffix?: boolean
  pandoc_attr_list?: boolean
  obsidian_bare_size?: boolean
  obsidian_pixel_size?: boolean
  url_query_params?: boolean
  html_title_size?: boolean
  strip_dimension_query?: boolean
  presets?: Record<string, number | ImageDimensionTomlPreset>
}

export interface MarkdownThemeModesConfig {
  light?: string
  dark?: string
}

export type MarkdownThemeConfig = string | MarkdownThemeModesConfig

export interface MarkdownConfig {
  mathjax?: boolean
  wikilinks?: boolean
  footnote?: boolean
  hashtag?: boolean
  mermaid?: boolean
  mermaid_render?: MermaidRenderMode
  callout?: boolean
  image_dimension?: boolean | ImageDimensionTomlConfig
  render_title?: 'frontmatter_title' | 'first_heading' | 'alias' | 'file_name'
  link_style?: 'wiki' | 'origin'
  theme?: MarkdownThemeConfig
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
    pageSizeCard?: number
    pageSizeList?: number
  }
  nav?: NavLabels
  markdown?: MarkdownConfig
  datetime?: DatetimeConfig
  blog?: BlogConfig
  outline?: OutlineConfig
  timeline?: TimelineConfig
  links?: LinksConfig
  theme: ThemeConfig
}
