import { initializeApp } from '../core/app-controller.js';
import { renderAppShell } from '../ui/app-shell.js';

renderAppShell();

void initializeApp().catch((error) => {
  console.error('Unable to bootstrap BWM KUL City Walk:', error);
});
