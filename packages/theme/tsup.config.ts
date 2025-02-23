import path from 'path'
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/node.ts', 'src/index.ts'],
  format: ['esm'],
  outDir: path.resolve(__dirname, './dist'),
  dts: true,
  external: [
    'vitepress',
    'vue',
    /\.vue$/, // Vue 文件作为外部依赖
    /\.css$/ // CSS 文件作为外部依赖
  ],
  silent: true,
  clean: true,
  outExtension: () => ({
    js: '.mjs'
  })
})
