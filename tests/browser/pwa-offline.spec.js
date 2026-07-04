import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Shared beforeEach: geolocation, PWA flag, mocked API / data routes
// ---------------------------------------------------------------------------
const setupPage = async (page) => {
  await page.context().grantPermissions(['geolocation']);
  await page.context().setGeolocation({ latitude: 3.1484, longitude: 101.6947 });
  await page.addInitScript(() => {
    window.__pwa_enabled__ = true;
  });

  // Mock session API to prevent network calls failing auth checks
  await page.route('**/api/session/current', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        authenticated: true,
        role: 'visitor',
        progressNamespace: 'visitor',
        chatLimit: 15,
        allowedUI: ['map', 'chat'],
      }),
    });
  });

  await page.route('**/data/sites.json', async (route) => {
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
            polygon: [
              [3.148, 101.694],
              [3.149, 101.694],
              [3.149, 101.695],
              [3.148, 101.695],
            ],
          },
        },
      ]),
    });
  });
};

// ---------------------------------------------------------------------------
// Helper: wait until the service worker controls the page
// ---------------------------------------------------------------------------
const waitForSWControl = async (page) => {
  return page.evaluate(async () => {
    if (navigator.serviceWorker.controller) return true;
    return new Promise((resolve) => {
      navigator.serviceWorker.addEventListener('controllerchange', () => resolve(true));
      setTimeout(() => resolve(false), 8000);
    });
  });
};

// ===========================================================================
// Suite 1 – Connectivity banner (existing tests, kept intact)
// ===========================================================================
test.describe('PWA Offline & Connectivity Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test('Service worker registers and activates', async ({ page }) => {
    await page.goto('/');

    const isControlled = await waitForSWControl(page);
    expect(isControlled).toBe(true);
  });

  test('Transition to offline shows banner and disables internet-required controls', async ({ page }) => {
    await page.goto('/');

    // Verify online state initially
    await expect(page.locator('#connectivity-banner')).toBeHidden();

    // Transition browser to offline mode
    await page.context().setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new window.Event('offline')));

    // Connectivity banner should slide down and show offline warning
    const banner = page.locator('#connectivity-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('You are offline');

    // Controls must be disabled
    const chatInput = page.locator('#chatInput');
    await expect(chatInput).toBeDisabled();
    await expect(chatInput).toHaveAttribute('placeholder', 'Chat requires internet connection...');

    const chatSendBtn = page.locator('#chatSendBtn');
    await expect(chatSendBtn).toBeDisabled();
    await expect(chatSendBtn).toHaveClass(/opacity-50/);

    const loadTranslateBtn = page.locator('#loadTranslateBtn');
    await expect(loadTranslateBtn).toBeDisabled();

    // Go back online
    await page.context().setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new window.Event('online')));

    // Banner changes to Back Online and fades out
    await expect(banner).toContainText('Back online');
    await expect(banner).toBeHidden({ timeout: 5000 });

    // Controls should re-enable
    await expect(chatInput).toBeEnabled();
    await expect(chatInput).toHaveAttribute('placeholder', 'Ask a question...');
    await expect(chatSendBtn).toBeEnabled();
    await expect(loadTranslateBtn).toBeEnabled();
  });
});

// ===========================================================================
// Suite 2 – Real service-worker caching behaviour (Chromium only)
// ===========================================================================
test.describe('PWA Service Worker – real caching behaviour', () => {
  // Chromium is required for Cache Storage APIs to be observable via
  // CDP / evaluate in the test context.
  test.skip(({ browserName }) => browserName !== 'chromium', 'Chromium only');

  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  // -------------------------------------------------------------------------
  // 1. Cached site data
  // -------------------------------------------------------------------------
  test('sites.json is served from bwm-site-data-v1 cache when offline', async ({ page }) => {
    await page.goto('/');

    // Wait until the SW controls the page
    const controlled = await waitForSWControl(page);
    expect(controlled).toBe(true);

    // Unroute the mock so we fetch the real sites.json
    await page.unroute('**/data/sites.json');

    // Fetch site data online
    const onlineData = await page.evaluate(async () => {
      const res = await fetch('/data/sites.json');
      const data = await res.json();
      return { status: res.status, data };
    });
    expect(onlineData.status).toBe(200);
    const hasSiteId1 = onlineData.data.some(site => site.id === '1');
    expect(hasSiteId1).toBe(true);

    // Confirm the entry exists in the runtime cache
    const cachedOnline = await page.evaluate(async () => {
      const cache = await caches.open('bwm-site-data-v1');
      const keys = await cache.keys();
      return keys.some((req) => req.url.includes('/data/sites.json'));
    });
    expect(cachedOnline).toBe(true);

    // Go offline and re-fetch – should still return 200 from cache and contain site id 1
    await page.context().setOffline(true);

    const offlineData = await page.evaluate(async () => {
      try {
        const res = await fetch('/data/sites.json');
        const data = await res.json();
        return { status: res.status, data };
      } catch {
        return { status: 0, data: [] };
      }
    });
    expect(offlineData.status).toBe(200);
    const hasSiteId1Offline = offlineData.data.some(site => site.id === '1');
    expect(hasSiteId1Offline).toBe(true);

    // Restore online state
    await page.context().setOffline(false);
  });

  // -------------------------------------------------------------------------
  // 2. Offline navigation fallback
  // -------------------------------------------------------------------------
  test('navigation to unknown route offline serves offline.html', async ({ page }) => {
    await page.goto('/');

    const controlled = await waitForSWControl(page);
    expect(controlled).toBe(true);

    // Go offline then navigate to a route that has never been fetched
    await page.context().setOffline(true);

    await page.goto('/offline-test-route', { waitUntil: 'domcontentloaded' });

    // The offline fallback page must contain the standard offline heading
    await expect(page.locator('body')).toContainText('You are offline');

    await page.context().setOffline(false);
  });

  // -------------------------------------------------------------------------
  // 3. API responses are never cached
  // -------------------------------------------------------------------------
  test('API responses are never stored in Cache Storage', async ({ page }) => {
    await page.goto('/');

    const controlled = await waitForSWControl(page);
    expect(controlled).toBe(true);

    // Trigger the mocked API call
    await page.evaluate(async () => {
      await fetch('/api/session/current').catch(() => {});
    });

    // Inspect every cache bucket for any /api/ URL
    const apiInCache = await page.evaluate(async () => {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        if (keys.some((req) => req.url.includes('/api/'))) {
          return true;
        }
      }
      return false;
    });

    expect(apiInCache).toBe(false);
  });

  // -------------------------------------------------------------------------
  // 4. Clear offline data deletes BWM runtime caches but preserves precache
  // -------------------------------------------------------------------------
  test('Clear Cache button deletes BWM runtime caches but preserves Workbox precache and offline fallback', async ({ page }) => {
    await page.goto('/');

    const controlled = await waitForSWControl(page);
    expect(controlled).toBe(true);

    // Seed bwm-site-data-v1 so we have something to assert against
    await page.evaluate(async () => {
      const res = await fetch('/data/sites.json');
      const cache = await caches.open('bwm-site-data-v1');
      await cache.put('/data/sites.json', res.clone ? res.clone() : res);
    });

    // Confirm both caches exist before clearing
    const cachesBefore = await page.evaluate(async () => {
      const names = await caches.keys();
      return {
        hasBwm: names.includes('bwm-site-data-v1'),
        hasPrecache: names.some(name => name.includes('workbox-precache'))
      };
    });
    expect(cachesBefore.hasBwm).toBe(true);
    expect(cachesBefore.hasPrecache).toBe(true);

    // Go offline so Clear Cache button is visible and no reload happens
    await page.context().setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new window.Event('offline')));

    // Wait for navigator.onLine to be false
    await expect.poll(async () => {
      return await page.evaluate(() => navigator.onLine);
    }).toBe(false);

    // Set up dialog listener to handle both confirm and alert dialogs
    let confirmHandled = false;
    let alertHandled = false;

    page.on('dialog', async (dialog) => {
      if (dialog.type() === 'confirm') {
        expect(dialog.message()).toContain('Are you sure you want to clear offline data?');
        confirmHandled = true;
        await dialog.accept();
      } else if (dialog.type() === 'alert') {
        expect(dialog.message()).toContain('Offline data cleared. Reconnect to restart the City Walk.');
        alertHandled = true;
        await dialog.accept();
      }
    });

    // Click Clear Cache button
    const clearBtn = page.locator('#pwa-clear-offline-btn');
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();

    // Wait for both dialogs to be handled asynchronously
    await expect.poll(() => confirmHandled).toBe(true);
    await expect.poll(() => alertHandled).toBe(true);

    // Check caches (no reload, so we can evaluate in current context)
    const cachesAfter = await page.evaluate(async () => {
      const names = await caches.keys();
      return {
        hasBwm: names.includes('bwm-site-data-v1'),
        hasPrecache: names.some(name => name.includes('workbox-precache'))
      };
    });
    expect(cachesAfter.hasBwm).toBe(false);
    expect(cachesAfter.hasPrecache).toBe(true);

    // Verify offline fallback remains reachable
    await page.goto('/offline-test-route', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText('You are offline');

    // Restore online state
    await page.context().setOffline(false);
  });
});
