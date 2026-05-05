import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.{test,spec}.{js,ts}'],
    coverage: {
      enabled: true,
      provider: 'v8',
      thresholds: {
        branches: 90,
        lines: 90
      }
    }
  }
})
