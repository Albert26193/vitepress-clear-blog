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
  const bgAltColor = color(theme, 'vp-c-bg-alt', dL['vp-c-bg-alt'])
  const brandColor = color(theme, 'vp-c-brand', dL['vp-c-brand'])
  const brandColor1 = color(theme, 'vp-c-brand-1', dL['vp-c-brand-1'])
  const brandColor2 = color(theme, 'vp-c-brand-2', dL['vp-c-brand-2'])
  const codeColor = color(theme, 'c-text-code', dL['c-text-code'])
  const strongColor = color(theme, 'c-text-strong', dL['c-text-strong'])
  const emColor = color(theme, 'c-text-em', dL['c-text-em'])
  const buttonBgColor = color(
    theme,
    'vp-button-brand-bg',
    dL['vp-button-brand-bg']
  )
  const sideBarBg = color(
    theme,
    'vp-sidebar-bg-color',
    dL['vp-sidebar-bg-color']
  )
  const textColor1 = color(theme, 'vp-c-text-1', dL['vp-c-text-1'])
  const textColor2 = color(theme, 'vp-c-text-2', dL['vp-c-text-2'])
  const dividerColor = color(theme, 'vp-c-divider', dL['vp-c-divider'])
  const codeBg = color(theme, 'vp-code-bg', dL['vp-code-bg'])
  const codeBlockBg = color(theme, 'vp-code-block-bg', dL['vp-code-block-bg'])

  const darkBgColor = color(darkTheme, 'vp-c-bg', dD['vp-c-bg'])
  const darkBgAltColor = color(darkTheme, 'vp-c-bg-alt', dD['vp-c-bg-alt'])
  const darkBrandColor = color(darkTheme, 'vp-c-brand', dD['vp-c-brand'])
  const darkBrandColor1 = color(darkTheme, 'vp-c-brand-1', dD['vp-c-brand-1'])
  const darkBrandColor2 = color(darkTheme, 'vp-c-brand-2', dD['vp-c-brand-2'])
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
  const darkTextColor2 = color(darkTheme, 'vp-c-text-2', dD['vp-c-text-2'])
  const darkDividerColor = color(darkTheme, 'vp-c-divider', dD['vp-c-divider'])
  const darkCodeBg = color(darkTheme, 'vp-code-bg', dD['vp-code-bg'])
  const darkCodeBlockBg = color(
    darkTheme,
    'vp-code-block-bg',
    dD['vp-code-block-bg']
  )

  const generatedCssPath = resolve(
    process.cwd(),
    '.vitepress/theme/styles/generated.css'
  )

  const generatedCssTemplate = `
:root {
  --vp-c-bg: ${bgColor};
  --vp-c-bg-alt: ${bgAltColor};
  --vp-c-brand: ${brandColor};
  --vp-c-brand-1: ${brandColor1};
  --vp-c-brand-2: ${brandColor2};
  --vp-c-text-1: ${textColor1};
  --vp-c-text-2: ${textColor2};
  --vp-c-divider: ${dividerColor};
  --vp-button-brand-bg: ${buttonBgColor};
  --vp-code-bg: ${codeBg};
  --vp-code-block-bg: ${codeBlockBg};
  --vp-sidebar-bg-color: ${sideBarBg};
  --c-text-code: ${codeColor};
  --c-text-strong: ${strongColor};
  --c-text-em: ${emColor};
}

.dark {
  --vp-c-bg: ${darkBgColor};
  --vp-c-bg-alt: ${darkBgAltColor};
  --vp-c-brand: ${darkBrandColor};
  --vp-c-brand-1: ${darkBrandColor1};
  --vp-c-brand-2: ${darkBrandColor2};
  --vp-c-text-1: ${darkTextColor1};
  --vp-c-text-2: ${darkTextColor2};
  --vp-c-divider: ${darkDividerColor};
  --vp-button-brand-bg: ${darkButtonBgColor};
  --vp-code-bg: ${darkCodeBg};
  --vp-code-block-bg: ${darkCodeBlockBg};
  --vp-sidebar-bg-color: ${darkSideBarBg};
  --c-text-code: ${darkCodeColor};
  --c-text-strong: ${darkStrongColor};
  --c-text-em: ${darkEmColor};
}
`.trim()

  const outDir = dirname(generatedCssPath)
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true })
  }
  writeFileSync(generatedCssPath, generatedCssTemplate)
}
