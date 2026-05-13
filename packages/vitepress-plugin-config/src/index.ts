export { generateThemePlugin } from './config'
export type { ConfigToml, ThemeConfig } from './types'
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
