export function createMarkerRenderer({
  L,
  markersLayer,
  onSiteDetails,
  onSiteSelected,
  onSiteUnselected,
  getIsCompleted,
  getSiteColors = () => ({ className: 'main-marker-pin' }),
}) {
  const markers = {};

  function createPopupContent(site) {
    if (!globalThis.document) return [site.name, site.info].filter(Boolean).join('\n');

    const content = document.createElement('div');
    content.className = 'heritage-popup';
    const title = document.createElement('strong');
    const info = document.createElement('p');
    const button = document.createElement('button');

    title.className = 'heritage-popup__title';
    title.textContent = site.name;
    info.className = 'heritage-popup__copy';
    info.textContent = site.info || '';
    button.type = 'button';
    button.textContent = 'Read full history';
    button.className = 'heritage-popup__button';
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      onSiteDetails(site);
    });
    content.append(title, info, button);
    return content;
  }

  function createSiteIcon(site) {
    if (!L?.divIcon) return undefined;
    const { className } = getSiteColors(site);

    return L.divIcon({
      className: `heritage-marker-wrapper ${className || ''}`.trim(),
      html: '<span class="heritage-marker"><span class="heritage-marker__core"></span></span>',
      iconSize: [28, 34],
      iconAnchor: [14, 29],
      popupAnchor: [0, -27],
      tooltipAnchor: [0, -25],
    });
  }

  function updateVisitedState(marker, isVisited) {
    if (!marker) return;
    marker.options.isVisited = isVisited;
    if (marker._icon) marker._icon.classList.toggle('marker-visited', isVisited);
  }

  function setActiveState(marker, isActive) {
    marker?._icon?.classList.toggle('marker-active', isActive);
  }

  function render(sites) {
    (sites || []).forEach((site) => {
      const latlng = Array.isArray(site.coordinates) ? site.coordinates : site.coordinates?.marker;
      if (!latlng) return;

      const icon = createSiteIcon(site);
      const marker = L.marker(latlng, icon ? { icon } : undefined)
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
      marker.on('popupopen', () => setActiveState(marker, true));
      marker.on('click', () => {
        setActiveState(marker, true);
        onSiteSelected(site);
      });
      marker.on('popupclose', () => {
        setActiveState(marker, false);
        onSiteUnselected?.(site);
      });
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
