import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from 'smol-toml'

import type { ConfigToml } from './types'

const assignedConfigPath = '.vitepress/custom/config.toml'

/**
 * generate the theme custom css
 *
 * @param configPath the path of the config file
 * @output the custom css file named generated.css
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
  --vp-c-bg: ${bgColor} !important;
  --vp-c-brand: ${brandColor} !important;
  --vp-c-brand-1: ${brandColor1} !important;
  --vp-c-text-1: ${textColor1} !important;
  --vp-button-brand-bg: ${buttonBgColor} !important;
  --c-text-code: ${codeColor} !important;
  --c-text-strong: ${strongColor} !important;
  --c-text-em: ${emColor} !important;
  --vp-sidebar-bg-color: ${SideBarBg} !important;
}

.dark {
  --vp-c-bg: ${darkBgColor} !important;
  --vp-c-brand: ${darkBrandColor} !important;
  --vp-c-brand-1: ${darkBrandColor1} !important;
  --vp-c-text-1: ${darkTextColor1} !important;
  --vp-button-brand-bg: ${darkButtonBgColor} !important;
  --c-text-code: ${darkCodeColor} !important;
  --c-text-strong: ${darkStrongColor} !important;
  --c-text-em: ${darkEmColor} !important;
  --vp-sidebar-bg-color: ${darkSideBarBg} !important;
}
`.trim()

  writeFileSync(generatedCssPath, generatedCssTemplate)
}
