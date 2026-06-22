import { startLegacyApp } from '../../app.js';
import { getState, setState } from './app-state.js';
import { emit } from './event-bus.js';

let initializationPromise = null;

export function initializeApp() {
  if (initializationPromise) return initializationPromise;

  setState({ bootstrapInitialized: true });

  initializationPromise = startLegacyApp({
    onLifecycleChange(patch) {
      setState(patch);
      if ('session' in patch) emit('session:changed', patch.session);
      if ('activeView' in patch) emit('view:changed', patch.activeView);
    },
  }).then(() => {
    const state = getState();
    emit('app:started', state);
    return state;
  });

  return initializationPromise;
}
