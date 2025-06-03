import type { Plugin } from 'vitepress'

import { generateThemeFile } from './node'

const assignedConfigPath = '.vitepress/custom/config.toml'

/**
 * generate the theme custom css
 *
 * @param configPath the path of the config file
 * @output the custom css file named generated.css
 */
const generateThemePlugin = (
  configPath: string = assignedConfigPath
): Plugin => {
  return {
    name: 'vite-plugin-generated-theme',
    enforce: 'pre',
    async buildStart() {
      await generateThemeFile(configPath)
    }
  }
}

export { generateThemePlugin }
