import { Buffer } from 'node:buffer';
import { test, expect } from '@playwright/test';

const TRANSPARENT_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=',
  'base64',
);

test.describe('Heritage basemap', () => {
  test('loads a CARTO Positron tile into the Leaflet map', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('pwa_prompt_dismissed', String(Date.now() + 604800000));
    });

    await page.route('**/api/session/current', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          authenticated: true,
          role: 'demo',
          accessType: 'demo',
          progressNamespace: 'demo',
          chatLimit: 5,
          remainingQuota: null,
          allowedUI: ['map', 'chat', 'passport', 'challenge', 'share', 'trails'],
        }),
      });
    });

    await page.route('https://*.basemaps.cartocdn.com/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: TRANSPARENT_PNG,
      });
    });

    await page.goto('/');

    await expect(page.locator('#map')).toBeVisible();
    const tile = page.locator('.leaflet-tile-loaded').first();
    await expect(tile).toBeVisible();

    const tileState = await tile.evaluate((image) => ({
      src: image.getAttribute('src'),
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
    }));

    expect(tileState.src).toContain('basemaps.cartocdn.com/light_all/');
    expect(tileState.naturalWidth).toBeGreaterThan(0);
    expect(tileState.naturalHeight).toBeGreaterThan(0);
  });
});
