const DEFAULT_STATE = {
  session: null,
  activeView: 'landing',
  activeModal: null,
  bootstrapInitialized: false,
};

const ALLOWED_KEYS = new Set(Object.keys(DEFAULT_STATE));
let state = { ...DEFAULT_STATE };

export function getState() {
  return { ...state };
}

export function setState(patch) {
  for (const key of Object.keys(patch)) {
    if (!ALLOWED_KEYS.has(key)) throw new Error(`Unknown app state key: ${key}`);
  }

  state = { ...state, ...patch };
  return getState();
}

export function resetState() {
  state = { ...DEFAULT_STATE };
  return getState();
}
