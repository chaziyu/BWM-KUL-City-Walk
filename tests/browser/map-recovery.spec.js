import { test, expect } from '@playwright/test';

test.describe('Map recovery flow', () => {
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

    await page.route('**/api/session/demo', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          authenticated: true,
          role: 'demo',
          progressNamespace: 'demo',
          chatLimit: 15,
          allowedUI: ['map', 'passport', 'chat', 'challenges'],
        }),
      });
    });
  });

  test('browser retry after simulated failed data request loads map successfully', async ({ page }) => {
    let callCount = 0;

    await page.route('**/sites*.json', async (route) => {
      callCount += 1;
      if (callCount === 1) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: '1',
              category: 'must_visit',
              name: 'Bangunan Sultan Abdul Samad',
              coordinates: {
                marker: [3.1484, 101.6947],
                polygon: [[3.148, 101.694], [3.149, 101.694], [3.149, 101.695], [3.148, 101.695]],
              },
            },
          ]),
        });
      }
    });

    await page.goto('/');

    // Click explore demo to trigger map initialization
    await page.locator('#btnExploreDemo').click();

    // Verify loading overlay appears initially, then the error overlay shows up on failure
    await expect(page.locator('#map-error-overlay')).toBeVisible();
    await expect(page.locator('#map-error-overlay')).toContainText('Unable to load the heritage trail.');

    // Click retry
    await page.locator('#btnMapRetry').click();

    // The error overlay should disappear and the map should load successfully
    await expect(page.locator('#map-error-overlay')).toBeHidden();
    await expect(page.locator('#map')).toBeVisible();
    expect(callCount).toBe(2);
  });
});
