import UnoCSS from 'unocss/vite'
import { vitePressAnalyzerPlugin } from 'vitepress-plugin-analyzer'
import llmstxt from 'vitepress-plugin-llms'

const getThemeConfig = async (cfg = {}) => {
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
      server: { port: 4000 },
      optimizeDeps: {
        exclude: ['gzip-size']
      },
      plugins: [
        vitePressAnalyzerPlugin(),
        llmstxt(),
        // generateThemePlugin(),
        UnoCSS()
        //RssPlugin(RSS)
      ]
    }
  }
}

export { getThemeConfig }
