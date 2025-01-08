import * as path from 'path'
import UnoCSS from 'unocss/vite'
import { defineConfig as defineVitePressConfig } from 'vitepress'
import type { UserConfig } from 'vitepress'
import { markdownAnalyzerPlugin } from 'vitepress-plugin-analyzer'
import { withMermaid } from 'vitepress-plugin-mermaid'

export { withMermaid }

export function defineConfig(config: UserConfig) {
  return defineVitePressConfig({
    ...config,
    // 这里可以添加默认的主题配置
    themeConfig: {
      ...config.themeConfig
      // 添加默认的主题配置
      // 例如：默认的导航栏配置、侧边栏配置等
    },
    // 添加默认的 Vite 配置
    vite: {
      ...config.vite,
      plugins: [
        ...(config.vite?.plugins || []),
        markdownAnalyzerPlugin(),
        UnoCSS()
      ],
      resolve: {
        ...config.vite?.resolve,
        alias: [
          ...(Array.isArray(config.vite?.resolve?.alias)
            ? config.vite.resolve.alias
            : []),
          {
            find: '@theme',
            replacement: path.resolve(__dirname)
          }
        ]
      }
    }
  })
}

// 为了向后兼容，保留 defineThemeConfig
export { defineConfig as defineThemeConfig }
