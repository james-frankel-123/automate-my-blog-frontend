// @ts-check
// Use when dev server is already running (e.g. npm start). No webServer started.
// Run: npx playwright test e2e/calendar-testbed.spec.js --config=playwright.local-no-server.config.js
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  testMatch: /calendar-testbed\.spec\.js$/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  timeout: 30000,
  expect: { timeout: 5000 },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
