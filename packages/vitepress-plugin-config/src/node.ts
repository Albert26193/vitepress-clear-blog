import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { parse } from 'smol-toml'

import type { ConfigToml } from './types'

const assignedConfigPath = '.vitepress/custom/config.toml'

// Accepts hex, color functions, CSS variables, or named colors.
const VALID_COLOR = (v: string): boolean =>
  /^#/.test(v) ||
  /^rgba?\(/.test(v) ||
  /^hsla?\(/.test(v) ||
  /^var\(--/.test(v) ||
  /^[a-zA-Z]+$/.test(v)

/**
 * Validates a CSS color value and warns on likely typos.
 *
 * @returns `true` when the value is acceptable, `false` after a warning.
 */
const validateColor = (
  key: string,
  value: unknown,
  fallback: string
): value is string => {
  if (typeof value !== 'string' || value.length === 0) {
    console.warn(
      `[config] config.toml: ${key} must be a non-empty string, got "${String(value)}" — using default "${fallback}"`
    )
    return false
  }
  if (!VALID_COLOR(value)) {
    console.warn(
      `[config] config.toml: ${key}="${value}" looks malformed — expected a hex, rgb, hsl, var(--x), or named color`
    )
  }
  return true
}

const color = (
  obj: Record<string, unknown> | undefined,
  key: string,
  fallback: string
): string => {
  const val = obj?.[key]
  if (val === undefined || val === null) return fallback
  if (!validateColor(key, val, fallback)) return fallback
  return val as string
}

/**
 * Generates CSS variables from TOML so users can customize the theme without editing source styles.
 *
 * @param configPath - Location of the TOML file that provides theme color overrides.
 * @returns Nothing; writes the generated stylesheet into the VitePress theme directory.
 * @throws When the TOML file does not contain a theme section.
 */
export const generateThemeFile = async (
  configPath: string = assignedConfigPath
) => {
  const content = readFileSync(configPath, 'utf-8')
  const config = parse(content) as unknown as ConfigToml

  if (!config.theme) {
    throw new Error('Missing theme configuration in config.toml')
  }

  const theme = config.theme as unknown as Record<string, unknown>
  const darkTheme = config.theme?.dark as unknown as
    | Record<string, unknown>
    | undefined

  const bgColor = color(theme, 'vp-c-bg', '#fff')
  const brandColor = color(theme, 'vp-c-brand', '#f00')
  const brandColor1 = color(theme, 'vp-c-brand-1', '#0f0')
  const codeColor = color(theme, 'c-text-code', '#ff0')
  const strongColor = color(theme, 'c-text-strong', '#000')
  const emColor = color(theme, 'c-text-em', '#000')
  const buttonBgColor = color(theme, 'vp-button-brand-bg', '#00f')
  const SideBarBg = color(theme, 'vp-sidebar-bg-color', '#000')
  const textColor1 = color(theme, 'vp-c-text-1', '#000')

  const darkBgColor = color(darkTheme, 'vp-c-bg', '#000')
  const darkBrandColor = color(darkTheme, 'vp-c-brand', '#f00')
  const darkBrandColor1 = color(darkTheme, 'vp-c-brand-1', '#0f0')
  const darkCodeColor = color(darkTheme, 'c-text-code', '#ff0')
  const darkStrongColor = color(darkTheme, 'c-text-strong', '#000')
  const darkEmColor = color(darkTheme, 'c-text-em', '#000')
  const darkButtonBgColor = color(darkTheme, 'vp-button-brand-bg', '#00f')
  const darkSideBarBg = color(darkTheme, 'vp-sidebar-bg-color', '#000')
  const darkTextColor1 = color(darkTheme, 'vp-c-text-1', '#000')

  const generatedCssPath = resolve(
    process.cwd(),
    '.vitepress/theme/styles/generated.css'
  )

  const generatedCssTemplate = `
:root {
  --vp-c-bg: ${bgColor};
  --vp-c-brand: ${brandColor};
  --vp-c-brand-1: ${brandColor1};
  --vp-c-text-1: ${textColor1};
  --vp-button-brand-bg: ${buttonBgColor};
  --c-text-code: ${codeColor};
  --c-text-strong: ${strongColor};
  --c-text-em: ${emColor};
  --vp-sidebar-bg-color: ${SideBarBg};
}

.dark {
  --vp-c-bg: ${darkBgColor};
  --vp-c-brand: ${darkBrandColor};
  --vp-c-brand-1: ${darkBrandColor1};
  --vp-c-text-1: ${darkTextColor1};
  --vp-button-brand-bg: ${darkButtonBgColor};
  --c-text-code: ${darkCodeColor};
  --c-text-strong: ${darkStrongColor};
  --c-text-em: ${darkEmColor};
  --vp-sidebar-bg-color: ${darkSideBarBg};
}
`.trim()

  const outDir = dirname(generatedCssPath)
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true })
  }
  writeFileSync(generatedCssPath, generatedCssTemplate)
}
