export function createMarkerRenderer({
  L,
  markersLayer,
  onSiteDetails,
  onSiteSelected,
  onSiteUnselected,
  getIsCompleted,
}) {
  const markers = {};

  function createPopupContent(site) {
    if (!globalThis.document) return [site.name, site.info].filter(Boolean).join('\n');

    const content = document.createElement('div');
    const title = document.createElement('strong');
    const info = document.createElement('p');
    const button = document.createElement('button');

    title.textContent = site.name;
    info.textContent = site.info || '';
    button.type = 'button';
    button.textContent = 'Read full history';
    button.className = 'mt-2 rounded bg-blue-600 px-3 py-1.5 text-sm font-bold text-white';
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      onSiteDetails(site);
    });
    content.append(title, info, button);
    return content;
  }

  function updateVisitedState(marker, isVisited) {
    if (!marker) return;
    marker.options.isVisited = isVisited;
    if (marker._icon) marker._icon.classList.toggle('marker-visited', isVisited);
  }

  function render(sites) {
    (sites || []).forEach((site) => {
      const latlng = Array.isArray(site.coordinates) ? site.coordinates : site.coordinates?.marker;
      if (!latlng) return;

      const marker = L.marker(latlng)
        .bindTooltip(site.name, {
          permanent: false,
          direction: 'top',
          sticky: true,
        })
        .bindPopup(createPopupContent(site));

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
      marker.on('popupclose', () => onSiteUnselected?.(site));
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
