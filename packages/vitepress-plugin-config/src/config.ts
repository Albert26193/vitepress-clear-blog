import { resolve } from 'path'
import type { Plugin } from 'vitepress'

import { generateThemeFile } from './node'

const assignedConfigPath = '.vitepress/custom/config.toml'

/**
 * Registers Vite hooks that keep generated theme CSS in sync with custom TOML config.
 *
 * @param configPath - Location of the TOML file that drives generated theme variables.
 * @returns A VitePress plugin that updates CSS during build and local development.
 */
const generateThemePlugin = (
  configPath: string = assignedConfigPath
): Plugin => {
  return {
    name: 'vite-plugin-generated-theme',
    enforce: 'pre',
    async buildStart() {
      await generateThemeFile(configPath)
    },
    configureServer(server) {
      const configFilePath = resolve(process.cwd(), configPath)
      const generatedCssPath = resolve(
        process.cwd(),
        '.vitepress/theme/styles/generated.css'
      )

      server.watcher.add(configFilePath)
      server.watcher.on('change', async (file: string) => {
        if (file === configFilePath) {
          console.log(
            `[vite-plugin-generated-theme] Config file changed: ${file}`
          )
          try {
            await generateThemeFile(configPath)
            console.log('[vite-plugin-generated-theme] Generated CSS updated')
            const cssModule = server.moduleGraph.getModuleById(generatedCssPath)
            if (cssModule) {
              server.moduleGraph.invalidateModule(cssModule)
            }
            server.ws.send({
              type: 'full-reload',
              path: '*'
            })
          } catch (error) {
            console.error(
              '[vite-plugin-generated-theme] Error generating theme:',
              error
            )
          }
        }
      })
    }
  }
}

export { generateThemePlugin }
