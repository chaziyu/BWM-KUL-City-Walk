import { buildGoogleMapsUrls } from '../../utils/google-maps.js';

export function getDirectionsUrls(site, mode) {
  const [lat, lon] = site.coordinates.marker;
  return buildGoogleMapsUrls(lat, lon, mode);
}
