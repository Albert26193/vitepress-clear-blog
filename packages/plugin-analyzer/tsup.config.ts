import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    client: 'src/client/index.ts'
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  clean: true,
  minify: true,
  sourcemap: true,
  external: ['vitepress'],
  treeshake: true,
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.js'
    }
  },
  platform: 'node',
  target: 'node16'
})
