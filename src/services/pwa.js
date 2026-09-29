export async function registerServiceWorker({
  navigatorImpl = globalThis.navigator,
  enabled = import.meta.env.PROD,
} = {}) {
  if (!enabled || !navigatorImpl?.serviceWorker?.register) return null;

  try {
    return await navigatorImpl.serviceWorker.register('/sw.js', { scope: '/' });
  } catch (error) {
    console.warn('Service worker registration failed:', error);
    return null;
  }
}
