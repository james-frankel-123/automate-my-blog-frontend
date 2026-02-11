/**
 * Hero image placeholder → image swap E2E test.
 * Proves the hero image loads and replaces the placeholder on /streaming-testbed.
 *
 * Run: npx playwright test hero-image.spec.js --project=chromium
 * (App must be running: npm start)
 */
const { test, expect } = require('@playwright/test');

test.describe('Hero image on streaming testbed', () => {
  test('placeholder appears then hero image becomes visible after load', async ({ page }) => {
    await page.goto('/streaming-testbed');

    // Click "Run simulated content-chunk stream"
    await page.getByRole('button', { name: /Run simulated content-chunk stream/i }).click();

    // Wait for content with hero slot to appear — placeholder shows "Waiting for image…"
    const placeholder = page.getByText(/Waiting for image…/i);
    await expect(placeholder).toBeVisible({ timeout: 8000 });

    // Wait for the hero image (img.hero-image) to become visible — placeholder hides, image shows
    const heroImg = page.locator('img.hero-image');
    await expect(heroImg).toBeVisible({ timeout: 10000 });

    // Verify placeholder is gone
    await expect(placeholder).not.toBeVisible();

    // Verify the image has loaded (has natural dimensions)
    const dimensions = await heroImg.evaluate((img) => ({
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      src: img.src
    }));
    expect(dimensions.naturalWidth).toBeGreaterThan(0);
    expect(dimensions.naturalHeight).toBeGreaterThan(0);
  });
});
