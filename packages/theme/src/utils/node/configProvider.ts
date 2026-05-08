import UnoCSS from 'unocss/vite'
import { vitePressAnalyzerPlugin } from 'vitepress-plugin-analyzer'
import { generateThemePlugin } from 'vitepress-plugin-config'
import llmstxt from 'vitepress-plugin-llms'

/**
 * Creates the default Clear Blog VitePress config fragment with core plugins wired in.
 *
 * @param cfg - Clear Blog options to merge into the generated config.
 * @returns VitePress config fragment used by consuming docs sites.
 */
const getThemeConfig = async (
  cfg: Record<string, unknown> = {}
): Promise<Record<string, unknown>> => {
  return {
    clearBlogConfig: {
      title: 'TTTTTTTitle',
      ...cfg
    },
    vite: {
      css: {
        preprocessorOptions: {
          scss: {
            api: 'modern'
          }
        }
      },
      server: { port: 4000, watch: { usePolling: true } },
      optimizeDeps: {
        exclude: ['gzip-size']
      },
      plugins: [
        vitePressAnalyzerPlugin(),
        llmstxt(),
        generateThemePlugin(),
        UnoCSS()
        //RssPlugin(RSS)
      ]
    }
  }
}

export { getThemeConfig }
