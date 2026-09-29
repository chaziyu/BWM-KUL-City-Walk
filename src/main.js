import L from 'leaflet';
import { setWorkerUrl } from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import './styles/main.css';
import 'maplibre-gl/dist/maplibre-gl.css';

setWorkerUrl(maplibreWorkerUrl);

window.L = L;
await import('leaflet-defaulticon-compatibility');

window.confetti = (...args) =>
  import('canvas-confetti').then(({ default: confetti }) => confetti(...args));

window.html2canvas = (...args) =>
  import('html2canvas').then(({ default: html2canvas }) => html2canvas(...args));

window.marked = {
  parse: (...args) => import('marked').then(({ marked }) => marked.parse(...args)),
};

await import('./app/bootstrap.js');
