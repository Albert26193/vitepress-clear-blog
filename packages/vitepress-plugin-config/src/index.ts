export { generateThemePlugin } from './config'
export type {
  BlogConfig,
  ConfigToml,
  DatetimeConfig,
  HomepageConfig,
  LinksConfig,
  OutlineConfig,
  ThemeConfig,
  TimelineConfig
} from './types'
export {
  validateConfigToml,
  validateConfigTomlWithFallback,
  configTomlSchema
} from './validate'
export type {
  ValidatedConfigToml,
  ConfigValidationIssue,
  ConfigValidationResult
} from './validate'
export { loadConfig, clearConfigCache, clearConfigCacheEntry } from './loader'
export {
  CONFIG_PATH,
  DEFAULT_PAGE_SIZE,
  DEFAULT_NAV_LABELS,
  DEFAULT_BLOG,
  DEFAULT_HOMEPAGE,
  DEFAULT_OUTLINE,
  DEFAULT_LINKS,
  DEFAULT_META,
  DEFAULT_TIMELINE,
  THEME_COLOR_DEFAULTS
} from './defaults'
