import { initializeApp } from '../core/app-controller.js';
import { initConnectivity } from '../features/connectivity/connectivity-controller.js';

initConnectivity();

void initializeApp().catch((error) => {
  console.error('Unable to bootstrap BWM KUL City Walk:', error);
});
