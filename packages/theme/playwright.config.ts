import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  expect: { timeout: 10000 },
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['./e2e/coverage-reporter.ts']],
  use: {
    baseURL: 'http://localhost:4173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  webServer: {
    command: 'pnpm exec vitepress preview packages/docs',
    cwd: '../..',
    port: 4173,
    reuseExistingServer: !process.env.CI
  }
})
