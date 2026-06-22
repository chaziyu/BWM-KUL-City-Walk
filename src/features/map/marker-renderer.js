export function createMarkerRenderer({ L, markersLayer, onSiteSelected, getIsCompleted }) {
  const markers = {};

  function updateVisitedState(marker, isVisited) {
    if (!marker) return;
    marker.options.isVisited = isVisited;
    if (marker._icon) marker._icon.classList.toggle('marker-visited', isVisited);
  }

  function render(sites) {
    (sites || []).forEach((site) => {
      const latlng = Array.isArray(site.coordinates) ? site.coordinates : site.coordinates?.marker;
      if (!latlng) return;

      const marker = L.marker(latlng).bindTooltip(site.name, {
        permanent: false,
        direction: 'top',
        sticky: true,
      });

      marker.options.isVisited = getIsCompleted(site.id);
      marker.on('add', (event) => {
        setTimeout(() => {
          const el = event.target?._icon;
          if (el) {
            el.classList.add('animate-pin-drop');
            setTimeout(() => el.classList.remove('animate-pin-drop'), 500);
          }
        }, 0);

        updateVisitedState(event.target, event.target.options.isVisited);
      });
      marker.on('click', () => onSiteSelected(site));
      markersLayer.addLayer(marker);
      markers[site.id] = marker;
    });

    return markers;
  }

  return {
    getMarkers: () => markers,
    render,
    updateVisitedState,
  };
}
