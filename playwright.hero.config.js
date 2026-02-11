// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/** Config for hero-image test: no webServer, use existing npm start server */
module.exports = defineConfig({
  testDir: './e2e',
  testMatch: 'e2e/hero-image.spec.js',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  timeout: 30000,
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
