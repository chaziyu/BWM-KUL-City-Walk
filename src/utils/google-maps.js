export function buildGoogleMapsUrls(lat, lon, mode) {
  const destination = `${lat},${lon}`;

  if (mode === 'directions' || mode === 'transit') {
    return {
      externalUrl: `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=transit`,
      embedUrl: `https://maps.google.com/maps?saddr=My+Location&daddr=${destination}&t=m&z=15&dirflg=r&output=embed`,
    };
  }

  if (mode === 'walk') {
    return {
      externalUrl: `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=walking`,
      embedUrl: `https://maps.google.com/maps?saddr=My+Location&daddr=${destination}&t=m&z=15&dirflg=w&output=embed`,
    };
  }

  if (mode === 'restaurants') {
    return {
      externalUrl: `https://www.google.com/maps/search/restaurants/@${lat},${lon},16z`,
      embedUrl: `https://maps.google.com/maps?q=restaurants&sll=${lat},${lon}&t=m&z=16&output=embed`,
    };
  }

  if (mode === 'hotels') {
    return {
      externalUrl: `https://www.google.com/maps/search/hotels/@${lat},${lon},16z`,
      embedUrl: `https://maps.google.com/maps?q=hotels&sll=${lat},${lon}&t=m&z=16&output=embed`,
    };
  }

  return { externalUrl: '', embedUrl: '' };
}
