import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  clean: true,
  minify: true,
  sourcemap: false,
  treeshake: true,
  outDir: 'lib',
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.js'
    }
  },
  platform: 'browser',
  target: 'es2020',
  external: ['vue', 'vitepress']
})
