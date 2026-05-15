import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { parse } from 'smol-toml'

import { CONFIG_PATH, THEME_COLOR_DEFAULTS } from './defaults'
import { validateConfigToml } from './validate'
import type { ValidatedConfigToml } from './validate'

const color = (
  obj: Record<string, unknown> | undefined,
  key: string,
  fallback: string
): string => {
  const val = obj?.[key]
  if (typeof val !== 'string' || val.length === 0) return fallback
  return val
}

/**
 * Generates CSS variables from TOML so users can customize the theme without editing source styles.
 *
 * @param configPathOrToml - Location of the TOML file, or a pre-parsed config object.
 * @returns Nothing; writes the generated stylesheet into the VitePress theme directory.
 * @throws When the TOML file does not contain a theme section.
 */
export const generateThemeFile = async (
  configPathOrToml: string | ValidatedConfigToml = CONFIG_PATH
) => {
  let theme: Record<string, unknown>
  let darkTheme: Record<string, unknown> | undefined

  if (typeof configPathOrToml === 'string') {
    const content = readFileSync(configPathOrToml, 'utf-8')
    const raw = parse(content)
    const rawObj = raw as Record<string, unknown>

    if (!rawObj.theme) {
      throw new Error('Missing theme configuration in config.toml')
    }

    const { issues } = validateConfigToml(raw, configPathOrToml)
    if (issues.length > 0) {
      throw new Error(
        issues
          .map((issue) => `[config] ${issue.path}: ${issue.message}`)
          .join('\n')
      )
    }

    theme = rawObj.theme as Record<string, unknown>
    darkTheme = theme.dark as Record<string, unknown> | undefined
  } else {
    const toml = configPathOrToml
    theme = (toml.theme as Record<string, unknown>) || {}
    darkTheme = theme.dark as Record<string, unknown> | undefined

    if (Object.keys(theme).length === 0) {
      throw new Error('Missing theme configuration in config.toml')
    }
  }

  const dL = THEME_COLOR_DEFAULTS.light
  const dD = THEME_COLOR_DEFAULTS.dark

  const bgColor = color(theme, 'vp-c-bg', dL['vp-c-bg'])
  const brandColor = color(theme, 'vp-c-brand', dL['vp-c-brand'])
  const brandColor1 = color(theme, 'vp-c-brand-1', dL['vp-c-brand-1'])
  const codeColor = color(theme, 'c-text-code', dL['c-text-code'])
  const strongColor = color(theme, 'c-text-strong', dL['c-text-strong'])
  const emColor = color(theme, 'c-text-em', dL['c-text-em'])
  const buttonBgColor = color(
    theme,
    'vp-button-brand-bg',
    dL['vp-button-brand-bg']
  )
  const SideBarBg = color(
    theme,
    'vp-sidebar-bg-color',
    dL['vp-sidebar-bg-color']
  )
  const textColor1 = color(theme, 'vp-c-text-1', dL['vp-c-text-1'])

  const darkBgColor = color(darkTheme, 'vp-c-bg', dD['vp-c-bg'])
  const darkBrandColor = color(darkTheme, 'vp-c-brand', dD['vp-c-brand'])
  const darkBrandColor1 = color(darkTheme, 'vp-c-brand-1', dD['vp-c-brand-1'])
  const darkCodeColor = color(darkTheme, 'c-text-code', dD['c-text-code'])
  const darkStrongColor = color(darkTheme, 'c-text-strong', dD['c-text-strong'])
  const darkEmColor = color(darkTheme, 'c-text-em', dD['c-text-em'])
  const darkButtonBgColor = color(
    darkTheme,
    'vp-button-brand-bg',
    dD['vp-button-brand-bg']
  )
  const darkSideBarBg = color(
    darkTheme,
    'vp-sidebar-bg-color',
    dD['vp-sidebar-bg-color']
  )
  const darkTextColor1 = color(darkTheme, 'vp-c-text-1', dD['vp-c-text-1'])

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
