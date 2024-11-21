import fs from 'fs-extra'
import path from 'path'

import { assignedConfigPath, parseToml } from '../theme/utils/serverUtils'

/**
 * generate the theme custom css
 *
 * @param configPath the path of the config file
 * @output the custom css file named generated.css
 */
const generateThemeFile = async (configPath: string = assignedConfigPath) => {
  const config = await parseToml(configPath)
  console.log(config)
  const theme = config.theme
  const darkTheme = config.theme?.dark

  const bgColor = theme?.['vp-c-bg'] || '#fff'
  const brandColor = theme?.['vp-c-brand'] || '#ae1f7c'
  const codeColor = theme?.['c-text-code'] || '#333'
  const strongColor = theme?.['c-text-strong'] || '#000'
  const emColor = theme?.['c-text-em'] || '#000'
  const buttonBgColor = theme?.['vp-c-button-bg'] || '#ae1f7c'

  const darkBgColor = darkTheme?.['vp-c-bg'] || '#000'
  const darkBrandColor = darkTheme?.['vp-c-brand'] || '#ae1f7c'
  const darkCodeColor = darkTheme?.['c-text-code'] || '#333'
  const darkStrongColor = darkTheme?.['c-text-strong'] || '#000'
  const darkEmColor = darkTheme?.['c-text-em'] || '#000'
  const darkButtonBgColor = darkTheme?.['vp-c-button-bg'] || '#ae1f7c'

  const generatedCssPath = path.resolve(
    __dirname,
    '../theme/styles/generated.css'
  )

  const generatedCssTemplate = `
:root {
  --vp-c-bg: ${bgColor}; !important;
  --vp-c-brand: ${brandColor} !important;
  --vp-button-brand-bg: ${buttonBgColor} !important;
  --c-text-code: ${codeColor} !important;
  --c-text-strong: ${strongColor} !important;
  --c-text-em: ${emColor} !important;
}

.dark {
  --vp-c-bg: ${darkBgColor} !important;
  --vp-c-brand: ${darkBrandColor} !important;
  --vp-button-brand-bg: ${darkButtonBgColor} !important;
  --c-text-code: ${darkCodeColor} !important;
  --c-text-strong: ${darkStrongColor} !important;
  --c-text-em: ${darkEmColor} !important;
}
`.trim()

  await fs.writeFile(generatedCssPath, generatedCssTemplate)
}

const generateThemePlugin = (configPath: string = assignedConfigPath) => {
  return {
    name: 'vite-plugin-generated-theme',
    async buildStart() {
      await generateThemeFile(configPath)
    }
  }
}

export { generateThemePlugin }
