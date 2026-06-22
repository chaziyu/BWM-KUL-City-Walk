import { startLegacyApp } from '../../app.js';
import { getState, setState } from './app-state.js';

let initializationPromise = null;

export function initializeApp() {
  if (initializationPromise) return initializationPromise;

  setState({ bootstrapInitialized: true });

  initializationPromise = startLegacyApp({
    onLifecycleChange(patch) {
      setState(patch);
    },
  }).then(() => {
    const state = getState();
    return state;
  });

  return initializationPromise;
}
