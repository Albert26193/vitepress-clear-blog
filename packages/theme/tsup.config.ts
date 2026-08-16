import path from 'path'
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['./src/utils/node/index.ts'],
  format: ['esm', 'cjs'],
  outDir: path.resolve(__dirname, './lib/node'),
  dts: true,
  external: [
    'vitepress',
    'gzip-size',
    'fs',
    'path',
    'fdir',
    'node:os',
    'unocss'
  ],
  noExternal: [
    'dayjs',
    'vitepress-plugin-analyzer',
    'vitepress-plugin-callouts',
    'vitepress-plugin-config',
    'vitepress-plugin-image-dimension',
    'vitepress-plugin-llms',
    'vitepress-plugin-shortlink'
  ],
  silent: true,
  clean: true,
  outExtension: ({ format }) => ({
    js: format === 'esm' ? '.mjs' : '.js'
  })
})
