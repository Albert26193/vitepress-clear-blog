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
  const theme = config.theme as { brandColor?: string } | undefined
  const brandColor = theme?.brandColor || '#ae1f7c'

  const generatedCssPath = path.resolve(
    __dirname,
    '../theme/styles/generated.css'
  )

  const generatedCssTemplate = `
:root {
  --vp-c-brand: ${brandColor} !important;
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
