/**
 * Test Helper Utilities for E2E Tests
 */

/**
 * Generate a unique test email
 */
export function generateTestEmail() {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@e2etest.com`;
}

/**
 * Generate a unique test password
 */
export function generateTestPassword() {
  return `TestPassword123!${Math.random().toString(36).substring(7)}`;
}

/**
 * Wait for element to be visible with timeout
 */
export async function waitForElement(page, selector, timeout = 10000) {
  await page.waitForSelector(selector, { state: 'visible', timeout });
}

/**
 * Wait for element to be hidden
 */
export async function waitForElementHidden(page, selector, timeout = 10000) {
  await page.waitForSelector(selector, { state: 'hidden', timeout });
}

/**
 * Wait for text to appear on page
 */
export async function waitForText(page, text, timeout = 10000) {
  await page.waitForFunction(
    (text) => document.body.innerText.includes(text),
    text,
    { timeout }
  );
}

/**
 * Clear localStorage and sessionStorage
 */
export async function clearStorage(page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Wait for API call to complete (checks for loading indicators) - optimized
 */
export async function waitForAPICall(page, timeout = 10000) {
  // Wait for any loading spinners to disappear with shorter timeout
  await page.waitForSelector('.ant-spin-spinning', { state: 'hidden', timeout }).catch(() => {});
  // Reduced delay - state updates are usually fast
  await page.waitForTimeout(200);
}

/**
 * Fill form field with retry logic
 */
export async function fillField(page, selector, value, options = {}) {
  const { timeout = 10000, clear = true } = options;
  await waitForElement(page, selector, timeout);
  if (clear) {
    await page.fill(selector, '');
  }
  await page.fill(selector, value);
}

/**
 * Click element with retry logic
 */
export async function clickElement(page, selector, options = {}) {
  const { timeout = 10000, force = false } = options;
  await waitForElement(page, selector, timeout);
  if (force) {
    await page.click(selector, { force: true });
  } else {
    await page.click(selector);
  }
}

/**
 * Check if element exists
 */
export async function elementExists(page, selector) {
  try {
    await page.waitForSelector(selector, { timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get text content of element
 */
export async function getTextContent(page, selector) {
  await waitForElement(page, selector);
  return await page.textContent(selector);
}

/**
 * Take screenshot with descriptive name
 */
export async function takeScreenshot(page, name) {
  await page.screenshot({ 
    path: `e2e/screenshots/${name}-${Date.now()}.png`,
    fullPage: true 
  });
}

/**
 * Wait for navigation to complete (optimized for speed)
 */
export async function waitForNavigation(page) {
  // Use 'load' instead of 'networkidle' for faster execution
  // networkidle waits for 500ms of no network activity, which is slow
  await page.waitForLoadState('load');
  // Reduced wait time - React usually renders quickly after load
  await page.waitForTimeout(300);
}

/**
 * Login helper function
 */
export async function loginUser(page, email, password) {
  // Check if already logged in
  const isLoggedIn = await elementExists(page, '[data-testid="user-menu"]');
  if (isLoggedIn) {
    return;
  }

  // Look for login button or auth modal trigger
  const loginButton = await page.locator('text=/login|sign in/i').first();
  if (await loginButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await loginButton.click();
  }

  // Wait for auth modal
  await waitForElement(page, 'input[type="email"], input[placeholder*="email" i]', 10000);

  // Fill email
  const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();
  await emailInput.fill(email);

  // Fill password
  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.fill(password);

  // Click login button
  const submitButton = page.locator('button:has-text("Login"), button:has-text("Sign In")').first();
  await submitButton.click();

  // Wait for login to complete
  await waitForAPICall(page);
  await page.waitForTimeout(1000); // Reduced from 2000ms - API call wait handles most of the delay
}

/**
 * Logout helper function
 */
export async function logoutUser(page) {
  const userMenu = page.locator('[data-testid="user-menu"], .ant-dropdown-trigger').first();
  if (await userMenu.isVisible({ timeout: 2000 }).catch(() => false)) {
    await userMenu.click();
    await page.waitForTimeout(500);
    
    const logoutButton = page.locator('text=/logout|sign out/i').first();
    if (await logoutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await logoutButton.click();
      await waitForNavigation(page);
    }
  }
}

/**
 * Navigate to a specific tab
 */
export async function navigateToTab(page, tabName) {
  // Try different selectors for tab navigation
  const tabSelectors = [
    `[data-testid="tab-${tabName}"]`,
    `text=${tabName}`,
    `.ant-menu-item:has-text("${tabName}")`,
  ];

  for (const selector of tabSelectors) {
    const element = page.locator(selector).first();
    if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
      await element.click();
      await waitForNavigation(page);
      return;
    }
  }

  throw new Error(`Could not find tab: ${tabName}`);
}
