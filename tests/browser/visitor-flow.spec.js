import { test, expect } from '@playwright/test';

test.describe('Visitor flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({ latitude: 3.1484, longitude: 101.6947 });
    await page.addInitScript(() => {
      localStorage.setItem('pwa_prompt_dismissed', String(Date.now() + 604800000));
    });

  });

  test('project admin stays locked until prototype admin authentication', async ({ page }) => {
    let authenticated = false;

    const guestSession = {
      authenticated: false,
      role: 'guest',
      progressNamespace: null,
      chatLimit: 0,
      allowedUI: ['landing'],
    };
    const adminSession = {
      authenticated: true,
      role: 'admin',
      progressNamespace: 'admin',
      chatLimit: 30,
      remainingQuota: 30,
      allowedUI: ['map', 'chat', 'passport', 'challenge', 'share', 'admin'],
    };

    await page.route('**/api/session/current', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(authenticated ? adminSession : guestSession),
      });
    });

    await page.route('**/api/session/admin', async (route) => {
      authenticated = true;
      expect(route.request().postDataJSON().password).toBe('prototype-password');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(adminSession),
      });
    });

    await page.goto('/');
    await page.getByTestId('project-admin-entry').click();

    await expect(page.getByTestId('admin-login-form')).toBeVisible();
    await expect(page.getByTestId('admin-tools')).toBeHidden();

    await page.getByTestId('admin-password-input').fill('prototype-password');
    await page.getByTestId('admin-login-submit').click();

    await expect(page.getByTestId('admin-login-form')).toBeHidden();
    await expect(page.getByTestId('admin-tools')).toBeVisible();
  });

  test('visitor can join with a passkey', async ({ page }) => {
    let visitorSessionCalled = false;
    let authenticated = false;

    const guestSession = {
      authenticated: false,
      role: 'guest',
      progressNamespace: null,
      chatLimit: 0,
      allowedUI: ['landing'],
    };
    const visitorSession = {
      authenticated: true,
      role: 'visitor',
      progressNamespace: 'visitor',
      chatLimit: 15,
      remainingQuota: 15,
      allowedUI: ['map', 'chat', 'passport', 'challenge', 'share'],
    };

    await page.route('**/api/session/current', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(authenticated ? visitorSession : guestSession),
      });
    });

    await page.route('**/api/session/visitor', async (route) => {
      visitorSessionCalled = true;
      authenticated = true;
      expect(route.request().postDataJSON().passkey).toBe('AB-12345');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(visitorSession),
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
