import { test, expect } from '@playwright/test';

test.describe('Map recovery flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({ latitude: 3.1484, longitude: 101.6947 });
    await page.addInitScript(() => {
      try {
        localStorage.setItem('pwa_prompt_dismissed', String(Date.now() + 604800000));
      } catch (e) {
        // Safe to ignore in sandboxed iframes
      }
      try {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then((registrations) => {
            for (const registration of registrations) {
              registration.unregister().catch(() => {});
            }
          }).catch(() => {});
        }
      } catch (err) {
        // Safe to ignore in sandboxed iframes
      }
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

    // Verify loading state or error panel shows up on failure
    await expect(page.locator('#map-state-panel')).toBeVisible();
    await expect(page.locator('#map-state-panel')).toContainText('Unable to load the heritage trail.');

    // Click retry
    await page.locator('#btnMapRetry').click();

    // The state panel should disappear and the map should load successfully
    await expect(page.locator('#map-state-panel')).toBeHidden();
    await expect(page.locator('#map')).toBeVisible();
    expect(callCount).toBe(2);
  });

  test('two rapid Retry clicks and verify one map loads with no uncaught page error', async ({ page }) => {
    let callCount = 0;
    let resolveDelayedRoute;
    const delayedPromise = new Promise((resolve) => {
      resolveDelayedRoute = resolve;
    });

    await page.route('**/sites*.json', async (route) => {
      callCount += 1;
      if (callCount === 1) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      } else {
        await delayedPromise;
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

    // Capture uncaught page errors
    const errors = [];
    page.on('pageerror', (err) => {
      errors.push(err);
    });

    await page.goto('/');

    // Click explore demo to trigger map initialization
    await page.locator('#btnExploreDemo').click();

    // Verify error panel appears
    const statePanel = page.locator('#map-state-panel');
    await expect(statePanel).toBeVisible();
    await expect(statePanel).toHaveAttribute('role', 'alert');

    const retryBtn = page.locator('#btnMapRetry');
    await expect(retryBtn).toBeVisible();

    // Click retry twice rapidly using direct browser-side click dispatch to bypass Playwright's detachment checks
    await retryBtn.evaluate(btn => {
      btn.click();
      btn.click();
    });

    // Now resolve the delayed route
    resolveDelayedRoute();

    // The state panel should disappear and the map should load successfully
    await expect(statePanel).toBeHidden();
    await expect(page.locator('#map')).toBeVisible();

    // Verify only 2 calls to sites.json (initial + 1 retry) and no uncaught errors.
    expect(callCount).toBe(2);
    expect(errors).toEqual([]);
  });
});
