import { initializeApp } from '../core/app-controller.js';
import { renderAppShell } from '../ui/app-shell.js';
import { initConnectivity } from '../features/connectivity/connectivity-controller.js';

renderAppShell();
initConnectivity();

void initializeApp().catch((error) => {
  console.error('Unable to bootstrap BWM KUL City Walk:', error);
});
