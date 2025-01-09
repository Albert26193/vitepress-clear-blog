import path from 'path'
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    node: 'src/node.ts'
  },
  format: ['esm'],
  outDir: path.resolve(__dirname, './dist'),
  dts: true,
  // external: ['vitepress', 'fs', 'path', 'gzip-size', 'node:fs', 'node:path'],
  noExternal: [''],
  silent: true
})
