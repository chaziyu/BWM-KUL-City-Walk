export const CARTO_POSITRON_URL =
  'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

export const CARTO_POSITRON_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors ' +
  '&copy; <a href="https://carto.com/attributions">CARTO</a>';

export function createCartoPositronLayer(L) {
  if (!L?.tileLayer) {
    throw new Error('Leaflet tileLayer is required to create the CARTO Positron basemap.');
  }

  return L.tileLayer(CARTO_POSITRON_URL, {
    attribution: CARTO_POSITRON_ATTRIBUTION,
    maxZoom: 20,
    opacity: 0.96,
    subdomains: 'abcd',
  });
}
