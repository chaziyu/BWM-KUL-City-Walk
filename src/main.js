import L from 'leaflet';
import './styles/main.css';
import { registerServiceWorker } from './services/pwa.js';

window.L = L;
await import('./app/bootstrap.js');

void registerServiceWorker();
