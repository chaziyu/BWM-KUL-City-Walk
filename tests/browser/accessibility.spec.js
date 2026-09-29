import { test, expect } from '@playwright/test';

test.describe('Responsive and Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('pwa_prompt_dismissed', String(Date.now() + 604800000));
    });
    await page.route('**/api/session/current', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          authenticated: false,
          role: 'guest',
          progressNamespace: null,
          chatLimit: 0,
          allowedUI: ['landing'],
        }),
      });
    });
  });

  test('landing page fits a wide desktop ratio without horizontal or vertical clipping', async ({ page }) => {
    await page.setViewportSize({ width: 1780, height: 820 });
    await page.goto('/');

    const landing = page.locator('#landing-page');
    const title = page.locator('#landing-page h1');
    const footer = page.locator('.landing-footer');

    await expect(landing).toBeVisible();

    const metrics = await landing.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
    }));
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
    expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.clientHeight + 1);

    const titleBox = await title.boundingBox();
    const footerBox = await footer.boundingBox();
    expect(titleBox?.y ?? -1).toBeGreaterThanOrEqual(0);
    expect((footerBox?.y ?? 0) + (footerBox?.height ?? 0)).toBeLessThanOrEqual(820);
  });

  test('mobile landscape remains horizontally contained and vertically scrollable', async ({ page }) => {
    await page.setViewportSize({ width: 812, height: 375 });
    await page.goto('/');

    const landing = page.locator('#landing-page');
    const metrics = await landing.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      scrollHeight: element.scrollHeight,
      overflowY: window.getComputedStyle(element).overflowY,
    }));

    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
    expect(['auto', 'scroll']).toContain(metrics.overflowY);

    const help = page.locator('#btnPreLoginHelp');
    await help.scrollIntoViewIfNeeded();
    await expect(help).toBeVisible();
  });

  test('keyboard navigation reaches the primary visitor login action', async ({ page }) => {
    await page.goto('/');
    const primaryAction = page.locator('#btnVisitor');
    let reachedPrimaryAction = false;

    for (let index = 0; index < 8; index += 1) {
      await page.keyboard.press('Tab');
      if (await primaryAction.evaluate((element) => element.matches(':focus'))) {
        reachedPrimaryAction = true;
        break;
      }
    }

    expect(reachedPrimaryAction).toBe(true);
  });
});
