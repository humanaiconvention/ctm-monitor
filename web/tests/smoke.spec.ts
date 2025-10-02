import { test, expect } from '@playwright/test';

// Basic smoke routes - fast existence checks without heavy assertions
const routes = [
  '/',
  '/learn-more',
  '/preview-questions',
  '/explore'
];

test.describe('smoke routes', () => {
  for (const route of routes) {
    test(`route ${route} renders`, async ({ page }) => {
      const res = await page.goto(route);
      expect(res?.ok(), `Response ok for ${route}`).toBeTruthy();
      // Basic DOM sanity - ensure root app container present
      await expect(page.locator('#root')).toBeVisible();
      // Quick check: no severe console errors
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
      });
      // allow a tiny settle time for lazy routes
      await page.waitForTimeout(50);
      expect(errors.filter(e => !/favicon|manifest/i.test(e)), 'No console errors').toEqual([]);
    });
  }
});
