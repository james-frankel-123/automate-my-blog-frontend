/**
 * E2E: Guided onboarding funnel (Issue #261).
 * Flow: website URL → Analyze → Confirm & Continue → audience → topic → signup gate (register).
 * Uses mocked backend; no real API. Run: npm run test:e2e
 */
const { test, expect } = require('@playwright/test');
const { installWorkflowMocks } = require('./mocks/workflow-api-mocks');

async function clearStorage(page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

function removeOverlay(page) {
  return page.evaluate(() => {
    const el = document.getElementById('webpack-dev-server-client-overlay');
    if (el) el.remove();
  });
}

test.describe('Onboarding funnel (Issue #261)', () => {
  test.beforeEach(async ({ page }) => {
    await installWorkflowMocks(page);
  });

  test('shows funnel when logged out and completes analysis → confirm → audience → topic → signup form', async ({ page }) => {
    test.setTimeout(90000);

    await page.goto('/');
    await clearStorage(page);
    await page.reload();
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForSelector('text=Loading...', { state: 'hidden', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1500);
    removeOverlay(page);

    await expect(page.getByTestId('onboarding-funnel')).toBeVisible({ timeout: 10000 });

    const urlInput = page.locator('input[placeholder*="website" i], input[placeholder*="url" i]').first();
    await urlInput.waitFor({ state: 'visible', timeout: 8000 });
    await urlInput.fill('https://example.com');

    await page.getByRole('button', { name: /Analyze/i }).first().click();

    await page.waitForSelector('.ant-spin-spinning', { state: 'hidden', timeout: 25000 }).catch(() => {});
    await page.waitForTimeout(1000);
    removeOverlay(page);

    const confirmBtn = page.getByTestId('confirm-analysis-btn');
    await expect(confirmBtn).toBeVisible({ timeout: 15000 });
    await confirmBtn.click();

    await expect(page.getByText(/Choose your audience/i)).toBeVisible({ timeout: 10000 });
    const firstAudienceCard = page.getByTestId('audience-card-0');
    await expect(firstAudienceCard).toBeVisible({ timeout: 8000 });
    await firstAudienceCard.click();

    await expect(page.getByText(/Choose a topic|Pick one for your article/i)).toBeVisible({ timeout: 10000 });
    const firstTopicCard = page.getByTestId('topic-card-0');
    await expect(firstTopicCard).toBeVisible({ timeout: 8000 });
    await firstTopicCard.click();

    await expect(page.getByTestId('signup-gate-card')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/Claim your free article/i)).toBeVisible();

    const registerTab = page.getByRole('tab', { name: 'Register' });
    if (await registerTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await registerTab.click();
      await page.waitForTimeout(300);
    }

    await page.getByLabel(/First name/i).fill('E2E');
    await page.getByLabel(/Last name/i).fill('Tester');
    await page.getByLabel(/Email/i).fill('e2e-funnel@example.com');
    await page.getByLabel(/^Password/i).fill('password123');
    await page.getByLabel(/Organization name/i).fill('E2E Org');
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByText(/Account created|Continuing/i)).toBeVisible({ timeout: 10000 });
  });

  test('funnel shows analysis results and Confirm & Continue after Analyze', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto('/');
    await clearStorage(page);
    await page.reload();
    await page.waitForSelector('text=Loading...', { state: 'hidden', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1000);
    removeOverlay(page);

    await expect(page.getByTestId('onboarding-funnel')).toBeVisible({ timeout: 10000 });

    await page.locator('input[placeholder*="website" i], input[placeholder*="url" i]').first().fill('https://example.com');
    await page.getByRole('button', { name: /Analyze/i }).first().click();

    await page.waitForSelector('.ant-spin-spinning', { state: 'hidden', timeout: 25000 }).catch(() => {});
    await page.waitForTimeout(1000);
    removeOverlay(page);

    await expect(page.getByTestId('analysis-carousel')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('confirm-analysis-btn')).toBeVisible({ timeout: 5000 });
  });
});
