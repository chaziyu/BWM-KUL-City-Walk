export const GOOGLE_MAPS_MODE = Object.freeze({
  TRANSIT: 'transit',
  WALK: 'walk',
  RESTAURANTS: 'restaurants',
  HOTELS: 'hotels',
});

function assertCoordinate(value, min, max, label) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new RangeError(`Invalid ${label} coordinate.`);
  }
  return number;
}

function mapsUrl(path, params) {
  const url = new URL(path, 'https://www.google.com');
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

export function buildGoogleMapsUrls(lat, lon, mode) {
  const latitude = assertCoordinate(lat, -90, 90, 'latitude');
  const longitude = assertCoordinate(lon, -180, 180, 'longitude');
  const destination = `${latitude},${longitude}`;

  if (mode === 'directions' || mode === GOOGLE_MAPS_MODE.TRANSIT) {
    return {
      kind: 'route',
      externalUrl: mapsUrl('/maps/dir/', {
        api: 1,
        destination,
        travelmode: 'transit',
      }),
      embedUrl: `https://maps.google.com/maps?saddr=My+Location&daddr=${encodeURIComponent(destination)}&t=m&z=15&dirflg=r&output=embed`,
    };
  }

  if (mode === GOOGLE_MAPS_MODE.WALK) {
    return {
      kind: 'route',
      externalUrl: mapsUrl('/maps/dir/', {
        api: 1,
        destination,
        travelmode: 'walking',
      }),
      embedUrl: `https://maps.google.com/maps?saddr=My+Location&daddr=${encodeURIComponent(destination)}&t=m&z=15&dirflg=w&output=embed`,
    };
  }

  if (mode === GOOGLE_MAPS_MODE.RESTAURANTS || mode === GOOGLE_MAPS_MODE.HOTELS) {
    const label = mode === GOOGLE_MAPS_MODE.RESTAURANTS ? 'restaurants' : 'hotels';
    return {
      kind: 'search',
      externalUrl: mapsUrl('/maps/search/', {
        api: 1,
        query: `${label} near ${destination}`,
      }),
      embedUrl: null,
    };
  }

  throw new RangeError(`Unsupported Google Maps mode: ${mode}`);
}
