import { resolve } from 'path'
import type { Logger } from 'vite'
import type { Plugin } from 'vitepress'

import { CONFIG_PATH, DEFAULT_MARKDOWN_THEME } from './defaults'
import { clearConfigCacheEntry, loadConfig } from './loader'
import { generateThemeFile } from './node'
import type { MarkdownThemeConfig } from './types'

const serializeMarkdownTheme = (
  theme: MarkdownThemeConfig | undefined
): string => {
  if (typeof theme === 'string') return JSON.stringify(theme)
  if (!theme) return JSON.stringify(DEFAULT_MARKDOWN_THEME)

  return JSON.stringify({
    dark: theme.dark ?? DEFAULT_MARKDOWN_THEME.dark,
    light: theme.light ?? DEFAULT_MARKDOWN_THEME.light
  })
}

/**
 * Registers Vite hooks that keep generated theme CSS in sync with the TOML config.
 *
 * @returns A VitePress plugin that updates CSS during build and local development.
 */
const generateThemePlugin = (): Plugin => {
  let vitepressLogger: Logger | undefined
  let markdownThemeSnapshot = serializeMarkdownTheme(undefined)

  return {
    name: 'vite-plugin-generated-theme',
    async configResolved(config) {
      vitepressLogger = config.logger
    },
    async buildStart() {
      const toml = loadConfig()
      markdownThemeSnapshot = serializeMarkdownTheme(toml?.markdown?.theme)
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
            const nextMarkdownThemeSnapshot = serializeMarkdownTheme(
              toml?.markdown?.theme
            )
            await generateThemeFile(toml ?? CONFIG_PATH)
            vitepressLogger?.info(
              '[vite-plugin-generated-theme] Generated CSS updated'
            )
            if (nextMarkdownThemeSnapshot !== markdownThemeSnapshot) {
              markdownThemeSnapshot = nextMarkdownThemeSnapshot
              vitepressLogger?.info(
                '[vite-plugin-generated-theme] Markdown highlight theme changed; restarting dev server'
              )
              await server.restart()
              return
            }
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
