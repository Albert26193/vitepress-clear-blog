import { resolve } from 'path'
import type { Logger } from 'vite'
import type { Plugin } from 'vitepress'

import { CONFIG_PATH } from './defaults'
import { clearConfigCacheEntry, loadConfig } from './loader'
import { generateThemeFile } from './node'

/**
 * Registers Vite hooks that keep generated theme CSS in sync with the TOML config.
 *
 * @returns A VitePress plugin that updates CSS during build and local development.
 */
const generateThemePlugin = (): Plugin => {
  let vitepressLogger: Logger | undefined

  return {
    name: 'vite-plugin-generated-theme',
    async configResolved(config) {
      vitepressLogger = config.logger
    },
    async buildStart() {
      const toml = loadConfig()
      await generateThemeFile(toml ?? CONFIG_PATH)
    },
    configureServer(server) {
      const configFilePath = resolve(process.cwd(), CONFIG_PATH)
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
            clearConfigCacheEntry()
            const toml = loadConfig()
            await generateThemeFile(toml ?? CONFIG_PATH)
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
