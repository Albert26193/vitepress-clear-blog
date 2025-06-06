import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.{test,spec}.{js,ts}'],
    coverage: {
      enabled: false
    }
  }
})
