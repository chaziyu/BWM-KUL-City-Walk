// Browser runtime configuration.
// Vite only exposes client variables prefixed with VITE_.
const env = import.meta.env || {};

export function numberSetting(name, fallback) {
  const raw = env[name];
  if (raw === undefined || raw === null || String(raw).trim() === '') return fallback;

  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function centerSetting() {
  if (!env.VITE_DEFAULT_CENTER) return [3.1495519988154683, 101.69609103393907];

  try {
    const value = JSON.parse(env.VITE_DEFAULT_CENTER);
    if (Array.isArray(value) && value.length === 2 && value.every(Number.isFinite)) {
      return value;
    }
  } catch {}

  return [3.1495519988154683, 101.69609103393907];
}

export const HISTORY_WINDOW_SIZE = numberSetting('VITE_HISTORY_WINDOW_SIZE', 30);
export const MAX_MESSAGES_PER_SESSION = numberSetting('VITE_MAX_MESSAGES_PER_SESSION', 15);
export const DEFAULT_CENTER = centerSetting();
export const ZOOM = numberSetting('VITE_ZOOM', 16);

export const ZOOM_THRESHOLD = numberSetting('VITE_ZOOM_THRESHOLD', ZOOM);
export const POLYGON_OPACITY = numberSetting('VITE_POLYGON_OPACITY', 0.2);
export const MAX_FONT_SIZE = numberSetting('VITE_MAX_FONT_SIZE', 130);
