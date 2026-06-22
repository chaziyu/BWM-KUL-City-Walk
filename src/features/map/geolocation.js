import { debounce } from '../../utils/debounce.js';

export function createGeolocationController({ L, map, getMainSites, isCompleted }) {
  const userIcon = L.divIcon({
    className: 'user-pin-wrapper',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    html: '<div class="user-location-pin"></div>',
  });

  const userMarker = L.marker([0, 0], { icon: userIcon }).addTo(map);
  const userCircle = L.circle([0, 0], {
    color: '#10B981',
    opacity: 0.4,
    fillColor: '#10B981',
    fillOpacity: 0.05,
    weight: 1,
  }).addTo(map);

  let currentPulseClass = '';
  let retryCount = 0;

  function updateProximityPulse(userLatLng) {
    if (!userMarker._icon) return;

    let closestDist = Infinity;
    const activeSites = getMainSites().filter((site) => !isCompleted(site.id));

    activeSites.forEach((site) => {
      const latlng = site.coordinates?.marker || site.coordinates;
      if (!latlng) return;
      closestDist = Math.min(closestDist, userLatLng.distanceTo(latlng));
    });

    let nextClass = 'pulse-slow';
    if (closestDist < 75) nextClass = 'pulse-fast';
    else if (closestDist < 250) nextClass = 'pulse-medium';

    if (nextClass === currentPulseClass) return;

    const pinElement = userMarker._icon.querySelector('.user-location-pin') || userMarker._icon;
    pinElement.classList.remove('pulse-slow', 'pulse-medium', 'pulse-fast');
    pinElement.classList.add(nextClass);
    currentPulseClass = nextClass;
  }

  const handlePulse = debounce(updateProximityPulse, 500);

  function onLocationFound(event) {
    userMarker.setLatLng(event.latlng);
    userCircle.setLatLng(event.latlng).setRadius(Math.min(event.accuracy / 2, 100));
    handlePulse(event.latlng);
  }

  function onLocationError(event) {
    if (event.code === 3) {
      retryCount += 1;
      if (retryCount >= 2) {
        map.stopLocate();
        return;
      }
      map.locate({ watch: true, enableHighAccuracy: false, maximumAge: 10000 });
    }
  }

  map.on('locationfound', onLocationFound);
  map.on('locationerror', onLocationError);
  map.locate({
    watch: true,
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 10000,
  });

  return {
    destroy() {
      map.off('locationfound', onLocationFound);
      map.off('locationerror', onLocationError);
      map.stopLocate();
      userMarker.remove();
      userCircle.remove();
    },
  };
}
