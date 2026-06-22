import { test, expect } from '@playwright/test';

test.describe('Visitor flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({ latitude: 3.1484, longitude: 101.6947 });
    await page.addInitScript(() => {
      localStorage.setItem('pwa_prompt_dismissed', String(Date.now() + 604800000));
    });

    await page.route('**/api/session/current', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ authenticated: false }),
      });
    });
  });

  test('visitor can join with a passkey', async ({ page }) => {
    let visitorSessionCalled = false;

    await page.route('**/api/session/visitor', async (route) => {
      visitorSessionCalled = true;
      expect(route.request().postDataJSON().passkey).toBe('AB-12345');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          authenticated: true,
          role: 'visitor',
          progressNamespace: 'visitor',
          chatLimit: 15,
          allowedUI: ['map'],
        }),
      });
    });

    await page.goto('/');
    await page.getByTestId('join-event-button').click();
    await page.getByTestId('visitor-passkey-input').fill('AB-12345');
    await page.getByTestId('visitor-passkey-submit').click();

    await expect(page.getByTestId('platform-warning')).toBeVisible();
    await page.getByTestId('platform-warning-continue').click();

    await expect.poll(() => visitorSessionCalled).toBe(true);
    await expect(page.getByTestId('map-experience')).toBeVisible();
  });
});
