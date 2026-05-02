import UnoCSS from 'unocss/vite'
import { vitePressAnalyzerPlugin } from 'vitepress-plugin-analyzer'
import { generateThemePlugin } from 'vitepress-plugin-config'
import llmstxt from 'vitepress-plugin-llms'

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
