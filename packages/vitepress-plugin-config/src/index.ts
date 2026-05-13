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
