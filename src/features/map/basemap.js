import { maplibreGL } from '@maplibre/maplibre-gl-leaflet';

export const OPENFREEMAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

export function createOpenFreeMapLayer() {
  return maplibreGL({
    style: OPENFREEMAP_STYLE_URL,
  });
}
