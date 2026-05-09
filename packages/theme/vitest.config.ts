import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.{test,spec}.{js,ts}'],
    setupFiles: ['./test/setup.ts'],
    coverage: {
      enabled: true,
      provider: 'v8',
      thresholds: {
        branches: 75,
        functions: 75,
        lines: 75,
        statements: 75
      }
    }
  }
})
