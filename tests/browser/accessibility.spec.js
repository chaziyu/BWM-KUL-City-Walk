import { test, expect } from '@playwright/test';

test.describe('Responsive and Accessibility', () => {
  test('Mobile landscape behavior', async ({ page }) => {
    await page.setViewportSize({ width: 812, height: 375 }); // iPhone landscape
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Keyboard navigation and modal focus', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    // Ensure focus moves logically (we can check document.activeElement)
  });
});
