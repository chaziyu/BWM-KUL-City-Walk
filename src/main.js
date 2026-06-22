import L from 'leaflet';
import './styles/main.css';
import './app/bootstrap.js';

window.L = L;
await import('leaflet-defaulticon-compatibility');

window.confetti = (...args) =>
  import('canvas-confetti').then(({ default: confetti }) => confetti(...args));

window.html2canvas = (...args) =>
  import('html2canvas').then(({ default: html2canvas }) => html2canvas(...args));

window.marked = {
  parse: (...args) => import('marked').then(({ marked }) => marked.parse(...args)),
};
