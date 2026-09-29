import { buildGoogleMapsUrls } from '../../utils/google-maps.js';

export function getDirectionsUrls(site, mode) {
  const marker = site?.coordinates?.marker;
  if (!Array.isArray(marker) || marker.length !== 2) {
    throw new TypeError('This site does not have valid map coordinates.');
  }

  const [lat, lon] = marker;
  return buildGoogleMapsUrls(lat, lon, mode);
}
