import L from 'leaflet';
import { setWorkerUrl } from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import './styles/main.css';
import { registerServiceWorker } from './services/pwa.js';
import 'maplibre-gl/dist/maplibre-gl.css';

setWorkerUrl(maplibreWorkerUrl);

window.L = L;
await import('leaflet-defaulticon-compatibility');

await import('./app/bootstrap.js');

void registerServiceWorker();
