import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  expect: { timeout: 10000 },
  retries: process.env.CI ? 2 : 0,
  fullyParallel: true,
  workers: 4,
  reporter: [['list'], ['./e2e/coverage-reporter.ts']],
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  // Two surfaces share one Playwright run: the main suite drives the testbed
  // preview, while the #434 boundary spec drives the demo preview (its page
  // only exists there). Each project pins its own baseURL.
  projects: [
    {
      name: 'testbed',
      testIgnore: 'WikiLinksBoundary.spec.ts',
      use: { baseURL: 'http://localhost:4173' }
    },
    {
      name: 'demo-boundary',
      testMatch: 'WikiLinksBoundary.spec.ts',
      use: { baseURL: 'http://localhost:4174' }
    }
  ],
  webServer: [
    {
      command: 'pnpm -F testbed preview',
      cwd: '../..',
      port: 4173,
      reuseExistingServer: !process.env.CI
    },
    {
      command: 'pnpm -F demo preview',
      cwd: '../..',
      port: 4174,
      reuseExistingServer: !process.env.CI
    }
  ]
})
