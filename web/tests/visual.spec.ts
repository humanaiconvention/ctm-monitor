import { test, expect, Page } from '@playwright/test';

interface SnapOptions {
  animations?: 'disabled' | 'allow';
  fullPage?: boolean;
  maxDiffPixelRatio?: number;
}

async function snap(page: Page, name: string, opts: SnapOptions = {}) {
  await expect(page).toHaveScreenshot(name, {
    animations: 'disabled',
    fullPage: true,
    ...opts,
  });
}

// Utility: ensure lazy sections have mounted before snapshot
async function ensureSections(page: Page) {
  // Scroll to trigger intersection observers
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 3));
  await page.waitForTimeout(400); // allow mount
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(600); // final lazy content
  await page.evaluate(() => window.scrollTo(0, 0));
}

// NOTE: Run once with VISUAL_UPDATE=true to seed baselines: `VISUAL_UPDATE=true npx playwright test tests/visual.spec.ts`.

test.describe('Visual Regression', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('home – full page', async ({ page }: { page: Page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await ensureSections(page);
    await snap(page, 'home-full.png');
  });

  test('hero only', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('header.hero h1');
    const hero = page.locator('header.hero');
    await expect(hero).toHaveScreenshot('hero.png', { animations: 'disabled' });
  });

  test('voices section', async ({ page }) => {
    await page.goto('/');
    await ensureSections(page);
    const voices = page.locator('#voices');
    await expect(voices).toHaveScreenshot('voices.png', { animations: 'disabled' });
  });
});
