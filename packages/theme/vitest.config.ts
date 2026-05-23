import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      'vitepress-plugin-analyzer/client': resolve(
        __dirname,
        '../vitepress-plugin-analyzer/src/client/index.ts'
      ),
      'vitepress-plugin-analyzer/types': resolve(
        __dirname,
        '../vitepress-plugin-analyzer/types/index.d.ts'
      ),
      'vitepress-plugin-analyzer': resolve(
        __dirname,
        '../vitepress-plugin-analyzer/src/node/index.ts'
      ),
      'vitepress-plugin-callout': resolve(
        __dirname,
        '../vitepress-plugin-callout/src/node/index.ts'
      ),
      'vitepress-plugin-codeblock-fold': resolve(
        __dirname,
        '../vitepress-plugin-codeblock-fold/src/index.ts'
      ),
      'vitepress-plugin-config': resolve(
        __dirname,
        '../vitepress-plugin-config/src/index.ts'
      ),
      'vitepress-plugin-details-block': resolve(
        __dirname,
        '../vitepress-plugin-details-block/src/index.ts'
      ),
      'vitepress-plugin-hashtag/client': resolve(
        __dirname,
        '../vitepress-plugin-hashtag/src/client/index.ts'
      ),
      'vitepress-plugin-hashtag': resolve(
        __dirname,
        '../vitepress-plugin-hashtag/src/node/index.ts'
      )
    }
  },
  test: {
    include: ['test/**/*.{test,spec}.{js,ts}'],
    exclude: ['e2e/**'],
    setupFiles: ['./test/setup.ts'],
    coverage: {
      enabled: true,
      provider: 'v8',
      thresholds: {
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90
      }
    }
  }
})
