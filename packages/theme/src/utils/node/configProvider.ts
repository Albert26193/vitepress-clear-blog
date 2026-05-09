import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from 'smol-toml'
import UnoCSS from 'unocss/vite'
import { vitePressAnalyzerPlugin } from 'vitepress-plugin-analyzer'
import { generateThemePlugin } from 'vitepress-plugin-config'
import llmstxt from 'vitepress-plugin-llms'
import { type RSSOptions, RssPlugin } from 'vitepress-plugin-rss'

/**
 * Creates the default Clear Blog VitePress config fragment with core plugins wired in.
 *
 * @param cfg - Clear Blog options to merge into the generated config.
 * @returns VitePress config fragment used by consuming docs sites.
 */
const getThemeConfig = async (
  cfg: Record<string, unknown> = {}
): Promise<Record<string, unknown>> => {
  const configPath = resolve(process.cwd(), '.vitepress/custom/config.toml')
  let tomlMeta: Record<string, string> = {}
  try {
    const raw = readFileSync(configPath, 'utf-8')
    const parsed = parse(raw) as Record<string, unknown>
    tomlMeta = (parsed.meta as Record<string, string>) || {}
  } catch {
    // config.toml may not exist; RSS will use fallbacks
  }

  const RSS: RSSOptions = {
    title: tomlMeta.title || 'Blog',
    description: tomlMeta.description || '',
    baseUrl: tomlMeta.siteUrl || '',
    copyright: tomlMeta.author ? `Copyright ${tomlMeta.author}` : '',
    author: tomlMeta.author ? { name: tomlMeta.author } : { name: 'Blogger' }
  }

  const rssValid = /^https?:\/\/.+/.test(RSS.baseUrl)

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
        UnoCSS(),
        ...(rssValid ? [RssPlugin(RSS)] : [])
      ]
    }
  }
}

export { getThemeConfig }
