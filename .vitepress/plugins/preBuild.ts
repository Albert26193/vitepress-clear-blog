import fs from 'fs-extra'
import path from 'path'

import { assignedConfigPath, parseToml } from '../theme/utils/serverUtils'

/**
 * gerneate the theme custom css
 *
 * @param configPath the path of the config file
 * @output the custom css file named generated.css
 */
const generateThemeFile = async (configPath: string = assignedConfigPath) => {
  const config = await parseToml(configPath)
  const theme = config.theme as { brandColor?: string } | undefined
  const brandColor = theme?.brandColor || '#ae1f7c'

  const gerenatedCssPath = path.resolve(
    __dirname,
    '../theme/styles/generated.css'
  )

  const generatedCssTemplate = `
:root {
  --vp-c-brand: ${brandColor} !important;
}
`.trim()

  await fs.writeFile(gerenatedCssPath, generatedCssTemplate)
}

const generateThemePlugin = (configPath: string = assignedConfigPath) => {
  return {
    name: 'vite-plugin-genereate-theme',
    async buildStart() {
      await generateThemeFile(configPath)
    }
  }
}

export { generateThemePlugin }
