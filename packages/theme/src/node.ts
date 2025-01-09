// import { presetIcons, presetUno } from 'unocss'
// import UnoCSS from 'unocss/vite'
// import { defineConfig as defineVitePressConfig } from 'vitepress'
// import type { UserConfig } from 'vitepress'
// import { markdownAnalyzerPlugin } from 'vitepress-plugin-analyzer'
// import { withMermaid } from 'vitepress-plugin-mermaid'

// import { getPosts } from './utils/serverUtils'

// export { withMermaid }

// const pageSize = 10

// export async function defineConfig(config: UserConfig) {
//   const posts = await getPosts(pageSize)

//   return defineVitePressConfig({
//     ...config,
//     themeConfig: {
//       ...config.themeConfig,
//       posts
//     },
//     vite: {
//       ...config.vite,
//       css: {
//         ...config.vite?.css,
//         // 确保 CSS 文件能被正确处理
//         preprocessorOptions: {
//           css: {
//             additionalData: '' // 移除 additionalData，让 Vite 直接处理 CSS 导入
//           }
//         }
//       },
//       plugins: [
//         UnoCSS({
//           presets: [
//             presetUno(),
//             presetIcons({
//               scale: 1.2,
//               warn: true
//             })
//           ]
//         }),
//         ...(config.vite?.plugins || []),
//         markdownAnalyzerPlugin()
//       ]
//     }
//   })
// }

// export { defineConfig as defineThemeConfig }
