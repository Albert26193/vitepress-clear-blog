import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  test: {
    include: ['test/**/*.{test,spec}.{js,ts}'],
    environment: 'happy-dom',
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
