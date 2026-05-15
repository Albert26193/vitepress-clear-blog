import { resolve } from 'path'
import type { Logger } from 'vite'
import type { Plugin } from 'vitepress'

import { CONFIG_PATH } from './defaults'
import { clearConfigCacheEntry, loadConfig } from './loader'
import { generateThemeFile } from './node'

/**
 * Registers Vite hooks that keep generated theme CSS in sync with custom TOML config.
 *
 * @param configPath - Location of the TOML file that drives generated theme variables.
 * @returns A VitePress plugin that updates CSS during build and local development.
 */
const generateThemePlugin = (configPath: string = CONFIG_PATH): Plugin => {
  let vitepressLogger: Logger | undefined

  return {
    name: 'vite-plugin-generated-theme',
    async configResolved(config) {
      vitepressLogger = config.logger
    },
    async buildStart() {
      const toml = loadConfig(configPath)
      await generateThemeFile(toml ?? configPath)
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
          vitepressLogger?.info(
            `[vite-plugin-generated-theme] Config file changed: ${file}`
          )
          try {
            clearConfigCacheEntry(configPath)
            const toml = loadConfig(configPath)
            await generateThemeFile(toml ?? configPath)
            vitepressLogger?.info(
              '[vite-plugin-generated-theme] Generated CSS updated'
            )
            const cssModule = server.moduleGraph.getModuleById(generatedCssPath)
            if (cssModule) {
              server.moduleGraph.invalidateModule(cssModule)
            }
            server.ws.send({
              type: 'full-reload',
              path: '*'
            })
          } catch (error) {
            vitepressLogger?.error(
              `[vite-plugin-generated-theme] Error generating theme: ${String(error)}`
            )
          }
        }
      })
    }
  }
}

export { generateThemePlugin }
