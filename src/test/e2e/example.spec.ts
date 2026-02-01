import { test, expect } from '@playwright/test';

/**
 * Example E2E test demonstrating Playwright usage
 * This is a template for creating E2E tests following Page Object Model pattern
 */

test.describe('Example E2E Test', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Lawly/i);
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    // Add navigation logic here when login link is available
    // Example: await page.click('text=Login');
    // await expect(page).toHaveURL(/.*login/);
  });

  // Example test with screenshot
  test('should take screenshot of homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveScreenshot('homepage.png');
  });
});
