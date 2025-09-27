import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('home page has no critical accessibility violations', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const critical = results.violations.filter(v => ['serious','critical'].includes(v.impact || ''));
    if (critical.length) {
      console.log('\nSerious/Critical Accessibility Violations Summary:\n');
      for (const v of critical) {
        console.log(`- ${v.id} (${v.impact}) nodes=${v.nodes.length}`);
      }
      console.log('\nFull details available in axe results object.');
    }
    type Violation = { id: string };
    expect(
      critical.length,
      `Critical/Serious a11y violations found: ${critical.map((v: Violation) => v.id).join(', ')}`
    ).toBe(0);
  });
});
