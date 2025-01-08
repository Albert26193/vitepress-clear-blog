import path from 'path'
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/node.ts'],
  format: ['cjs', 'esm'],
  outDir: path.resolve(__dirname, './dist'),
  dts: true,
  external: ['vitepress'],
  noExternal: [''],
  silent: true,
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.js' : '.mjs'
    }
  }
})
