import { test, expect } from '@playwright/test';

test.describe('App basic rendering', () => {
  test('loads the home page and shows React header', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/React/i);
    // Check root content exists
    const root = page.locator('#root');
    await expect(root).toBeVisible();
  });
});
