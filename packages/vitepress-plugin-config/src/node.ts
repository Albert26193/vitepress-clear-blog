import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from 'smol-toml'

import type { ConfigToml } from './types'

const assignedConfigPath = '.vitepress/custom/config.toml'

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

  const theme = config.theme
  const darkTheme = config.theme?.dark

  const bgColor = theme?.['vp-c-bg'] || '#fff'
  const brandColor = theme?.['vp-c-brand'] || '#f00'
  const brandColor1 = theme?.['vp-c-brand-1'] || '#0f0'
  const codeColor = theme?.['c-text-code'] || '#ff0'
  const strongColor = theme?.['c-text-strong'] || '#000'
  const emColor = theme?.['c-text-em'] || '#000'
  const buttonBgColor = theme?.['vp-button-brand-bg'] || '#00f'
  const SideBarBg = theme?.['vp-sidebar-bg-color'] || '#000'
  const textColor1 = theme?.['vp-c-text-1'] || '#000'

  const darkBgColor = darkTheme?.['vp-c-bg'] || '#000'
  const darkBrandColor = darkTheme?.['vp-c-brand'] || '#f00'
  const darkBrandColor1 = darkTheme?.['vp-c-brand-1'] || '#0f0'
  const darkCodeColor = darkTheme?.['c-text-code'] || '#ff0'
  const darkStrongColor = darkTheme?.['c-text-strong'] || '#000'
  const darkEmColor = darkTheme?.['c-text-em'] || '#000'
  const darkButtonBgColor = darkTheme?.['vp-button-brand-bg'] || '#00f'
  const darkSideBarBg = darkTheme?.['vp-sidebar-bg-color'] || '#000'
  const darkTextColor1 = darkTheme?.['vp-c-text-1'] || '#000'

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

  writeFileSync(generatedCssPath, generatedCssTemplate)
}
