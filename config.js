// Configuration module
// Reads settings from environment variables with sensible defaults
// Uses a browser-safe check for process.env
const env = (typeof process !== 'undefined' && process.env) || {};

export const HISTORY_WINDOW_SIZE = Number(env.HISTORY_WINDOW_SIZE) || 30;
export const MAX_MESSAGES_PER_SESSION = Number(env.MAX_MESSAGES_PER_SESSION) || 15;
export const DEFAULT_CENTER = env.DEFAULT_CENTER ? JSON.parse(env.DEFAULT_CENTER) : [3.1495519988154683, 101.69609103393907];
export const ZOOM = Number(env.ZOOM) || 16;

// Magic Numbers & UI Constants
export const ZOOM_THRESHOLD = Number(env.ZOOM_THRESHOLD) || 18;
export const POLYGON_OPACITY = Number(env.POLYGON_OPACITY) || 0.2;
export const MAX_FONT_SIZE = Number(env.MAX_FONT_SIZE) || 130;
