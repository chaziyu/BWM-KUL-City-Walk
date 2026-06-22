import { initializeApp } from '../core/app-controller.js';

void initializeApp().catch((error) => {
  console.error('Unable to bootstrap BWM KUL City Walk:', error);
});
