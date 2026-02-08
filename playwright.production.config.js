// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Production E2E - Tests against live automatemyblog.com
 * No mocks, no local server. Run: npx playwright test --config=playwright.production.config.js
 */
module.exports = defineConfig({
  testDir: './e2e',
  testMatch: 'e2e/production.spec.js',
  fullyParallel: false,
  workers: 1,
  forbidOnly: true,
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'e2e-production-report' }]],
  use: {
    baseURL: 'https://automatemyblog.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  timeout: 90000,
  expect: { timeout: 10000 },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // No webServer - we test the live site
});
