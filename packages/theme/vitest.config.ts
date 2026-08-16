/// <reference types="vitest" />
import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      'vitepress-plugin-analyzer': resolve(
        __dirname,
        '../vitepress-plugin-analyzer/src/node/index.ts'
      ),
      'vitepress-plugin-callouts': resolve(
        __dirname,
        '../vitepress-plugin-callouts/src/node/index.ts'
      ),
      'vitepress-plugin-codeblock-fold': resolve(
        __dirname,
        '../vitepress-plugin-codeblock-fold/src/index.ts'
      ),
      'vitepress-plugin-config': resolve(
        __dirname,
        '../vitepress-plugin-config/src/index.ts'
      ),
      'vitepress-plugin-hashtag': resolve(
        __dirname,
        '../vitepress-plugin-hashtag/src/node/index.ts'
      ),
      'vitepress-plugin-hashtag/client': resolve(
        __dirname,
        '../vitepress-plugin-hashtag/src/client/index.ts'
      ),
      'vitepress-plugin-image-dimension': resolve(
        __dirname,
        '../vitepress-plugin-image-dimension/src/node/index.ts'
      ),
      'vitepress-plugin-shortlink': resolve(
        __dirname,
        '../vitepress-plugin-shortlink/src/node/index.ts'
      )
    }
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.spec.ts', 'src/**/*.spec.ts']
  }
})
