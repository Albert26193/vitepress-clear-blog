import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  'packages/theme/vitest.config.ts',
  'packages/vitepress-plugin-analyzer/vitest.config.ts',
  'packages/vitepress-plugin-codeblock-fold/vitest.config.ts',
  'packages/vitepress-plugin-config/vitest.config.ts',
  'packages/vitepress-plugin-hashtag/vitest.config.ts',
  'packages/vitepress-plugin-details-block/vitest.config.ts',
  'packages/vitepress-plugin-callout/vitest.config.ts',
  'packages/vitepress-plugin-image-dimension/vitest.config.ts'
])
