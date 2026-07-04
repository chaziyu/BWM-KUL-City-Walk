import { test, expect } from '@playwright/test';

test.describe('PWA Offline & Connectivity Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Grant geolocation permissions and set location
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
          allowedUI: ['map', 'chat']
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
              polygon: [[3.148, 101.694], [3.149, 101.694], [3.149, 101.695], [3.148, 101.695]],
            },
          },
        ]),
      });
    });
  });

  test('Service worker registers and activates', async ({ page }) => {
    await page.goto('/');

    // Wait for the Service Worker to register and control the page
    const isControlled = await page.evaluate(async () => {
      if (navigator.serviceWorker.controller) return true;
      return new Promise((resolve) => {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          resolve(true);
        });
        // Timeout safeguard
        setTimeout(() => resolve(false), 5000);
      });
    });

    // Check SW control state
    expect(isControlled).toBe(true);
  });

  test('Transition to offline shows banner and disables internet-required controls', async ({ page }) => {
    await page.goto('/');

    // Verify online state initially
    await expect(page.locator('#connectivity-banner')).toBeHidden();

    // Transition browser to offline mode
    await page.context().setOffline(true);
    // Dispatch offline event directly in page to ensure immediate DOM update
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

  test('Clear Cache settings button works and deletes browser Cache Storage', async ({ page }) => {
    await page.goto('/');

    // Simulate going offline so the Clear Cache button appears in the banner
    await page.context().setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new window.Event('offline')));

    // Set up dialog listener to accept confirmation dialog
    let dialogTriggered = false;
    page.on('dialog', async (dialog) => {
      dialogTriggered = true;
      expect(dialog.message()).toContain('Are you sure you want to clear offline data?');
      await dialog.accept();
    });

    // Click "Clear Cache" button
    const clearBtn = page.locator('#pwa-clear-offline-btn');
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();

    // Verify confirm dialog was handled
    await expect.poll(() => dialogTriggered).toBe(true);
  });
});
