import * as path from 'path'
import type { Theme, UserConfig } from 'vitepress'
import { markdownAnalyzerPlugin } from 'vitepress-plugin-analyzer'
import DefaultTheme from 'vitepress/theme'

import NewLayout from './components/NewLayout.vue'
import './styles/main.css'

// Define theme config type
export interface ThemeConfig {
  // Add your theme-specific config options here
}

// Theme helper to create the full config
export function defineConfig(
  config: Partial<UserConfig<ThemeConfig>> = {}
): UserConfig<ThemeConfig> {
  return {
    ...config,
    vite: {
      ...config.vite,
      plugins: [...(config.vite?.plugins || []), markdownAnalyzerPlugin()],
      resolve: {
        alias: [
          {
            find: '@',
            replacement: path.resolve(__dirname)
          }
        ],
        ...(config.vite?.resolve || {})
      }
    }
  }
}

// The theme implementation
export default {
  extends: DefaultTheme,
  Layout: NewLayout
} as Theme
