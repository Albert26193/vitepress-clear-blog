export { generateThemePlugin } from './config'
export type { ConfigToml, DatetimeConfig, ThemeConfig } from './types'
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
  DEFAULT_META,
  THEME_COLOR_DEFAULTS
} from './defaults'
