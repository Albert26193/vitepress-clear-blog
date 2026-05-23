import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/node/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  clean: true,
  minify: true,
  sourcemap: true,
  treeshake: true,
  outDir: 'lib/node',
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.js'
    }
  },
  platform: 'node',
  target: 'node16'
})
