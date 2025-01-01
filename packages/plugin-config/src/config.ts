import fs from 'fs-extra'
import path from 'path'
import { parse } from 'smol-toml'
import type { Plugin } from 'vitepress'

import type { ConfigToml } from './types'

const assignedConfigPath = '.vitepress/custom/config.toml'

/**
 * generate the theme custom css
 *
 * @param configPath the path of the config file
 * @output the custom css file named generated.css
 */
const generateThemeFile = async (configPath: string = assignedConfigPath) => {
  const content = await fs.readFile(configPath, 'utf-8')
  const config = parse(content) as unknown as ConfigToml

  if (!config.theme) {
    throw new Error('Missing theme configuration in config.toml')
  }

  const theme = config.theme
  const darkTheme = config['theme.dark']

  const bgColor = theme?.['vp-c-bg'] || '#fff'
  const brandColor = theme?.['vp-c-brand'] || '#ae1f7c'
  const brandColor1 = theme?.['vp-c-brand-1'] || '#ae1f7c'
  const codeColor = theme?.['c-text-code'] || '#333'
  const strongColor = theme?.['c-text-strong'] || '#000'
  const emColor = theme?.['c-text-em'] || '#000'
  const buttonBgColor = theme?.['vp-button-brand-bg'] || '#ae1f7c'

  const darkBgColor = darkTheme?.['vp-c-bg'] || '#000'
  const darkBrandColor = darkTheme?.['vp-c-brand'] || '#ae1f7c'
  const darkBrandColor1 = darkTheme?.['vp-c-brand-1'] || '#ae1f7c'
  const darkCodeColor = darkTheme?.['c-text-code'] || '#333'
  const darkStrongColor = darkTheme?.['c-text-strong'] || '#000'
  const darkEmColor = darkTheme?.['c-text-em'] || '#000'
  const darkButtonBgColor = darkTheme?.['vp-button-brand-bg'] || '#ae1f7c'

  const generatedCssPath = path.resolve(
    process.cwd(),
    'packages/theme/src/styles/generated.css'
  )

  const generatedCssTemplate = `
:root {
  --vp-c-bg: ${bgColor} !important;
  --vp-c-brand: ${brandColor} !important;
  --vp-c-brand-1: ${brandColor1} !important;
  --vp-button-brand-bg: ${buttonBgColor} !important;
  --c-text-code: ${codeColor} !important;
  --c-text-strong: ${strongColor} !important;
  --c-text-em: ${emColor} !important;
}

.dark {
  --vp-c-bg: ${darkBgColor} !important;
  --vp-c-brand: ${darkBrandColor} !important;
  --vp-c-brand-1: ${darkBrandColor1} !important;
  --vp-button-brand-bg: ${darkButtonBgColor} !important;
  --c-text-code: ${darkCodeColor} !important;
  --c-text-strong: ${darkStrongColor} !important;
  --c-text-em: ${darkEmColor} !important;
}
`.trim()

  await fs.writeFile(generatedCssPath, generatedCssTemplate)
}

const generateThemePlugin = (
  configPath: string = assignedConfigPath
): Plugin => {
  return {
    name: 'vite-plugin-generated-theme',
    async buildStart() {
      await generateThemeFile(configPath)
    }
  }
}

export { generateThemeFile, generateThemePlugin }
