/**
 * E2E: Calendar testbed at /calendar-testbed
 * Run against staging: npx playwright test --config=playwright.staging.config.js
 * Note: staging.automatemyblog.com is behind Vercel Deployment Protection (401).
 * Run in a browser where you're logged into Vercel, or use a protection-bypass token for CI.
 */

const { test, expect } = require('@playwright/test');

test.describe('Calendar testbed', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calendar-testbed');
    await page.waitForLoadState('networkidle').catch(() => {});
  });

  test('loads and shows title and mode selector', async ({ page }) => {
    await expect(page.getByText('Content Calendar Testbed')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('link', { name: /Back to Dashboard/i })).toBeVisible();
    await expect(page.getByText('Mock: Ready (30 ideas)')).toBeVisible();
    await expect(page.getByText('Live (audience ID)')).toBeVisible();
  });

  test('Mock Ready shows 30-day list', async ({ page }) => {
    await page.getByText('Mock: Ready (30 ideas)', { exact: false }).click();
    await expect(page.getByText('30-Day Content Calendar')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Day 1', { exact: true })).toBeVisible();
    await expect(page.getByText('Day 30', { exact: true })).toBeVisible();
  });

  test('Mock Generating shows spinner and message', async ({ page }) => {
    await page.getByText('Mock: Generating').click();
    await expect(page.getByText(/Your 30-day content calendar is being generated/)).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.ant-spin')).toBeVisible();
  });

  test('Mock Error shows error alert', async ({ page }) => {
    await page.getByText('Mock: Error').click();
    await expect(page.getByText('Something went wrong. Please try again.')).toBeVisible({ timeout: 5000 });
  });

  test('Mock Empty shows no calendar yet', async ({ page }) => {
    await page.getByText('Mock: Empty').click();
    await expect(page.getByText('No calendar yet')).toBeVisible({ timeout: 5000 });
  });

  test('Live mode shows audience dropdown and paste fallback', async ({ page }) => {
    await page.getByText('Live (audience ID)').click();
    await expect(page.getByText('Choose an audience (from your account)')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Or paste ID:')).toBeVisible();
    await expect(page.getByPlaceholder('Audience UUID (manual)')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Load calendar' })).toBeVisible();
  });
});
