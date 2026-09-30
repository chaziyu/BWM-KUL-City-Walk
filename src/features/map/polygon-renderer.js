export function createPolygonRenderer({
  L,
  polygonsLayer,
  onSiteDetails,
  onSiteSelected,
  onSiteUnselected,
  getIsCompleted,
  getSiteColors,
  visitedColor,
  selectedColor = '#172A3A',
  polygonOpacity,
}) {
  const polygons = {};
  const sitesById = {};
  let activeSiteId = null;

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

  function baseStyle(site, isVisited = getIsCompleted(site.id)) {
    if (isVisited) {
      return {
        color: visitedColor,
        fillColor: visitedColor,
        fillOpacity: Math.min(0.3, polygonOpacity + 0.08),
        weight: 2,
      };
    }

    const { markerColor, fillColor } = getSiteColors(site);
    return {
      color: markerColor,
      fillColor,
      fillOpacity: polygonOpacity,
      weight: 2,
    };
  }

  function activeStyle(site) {
    const style = baseStyle(site);
    return {
      ...style,
      color: selectedColor,
      fillOpacity: Math.min(0.34, polygonOpacity + 0.14),
      weight: 3,
    };
  }

  function hoverStyle(site) {
    const style = baseStyle(site);
    return {
      ...style,
      fillOpacity: Math.min(0.28, polygonOpacity + 0.06),
      weight: 2.5,
    };
  }

  function applyBaseStyle(site) {
    polygons[site.id]?.setStyle(baseStyle(site));
  }

  function activate(site) {
    if (activeSiteId && activeSiteId !== String(site.id)) {
      const previous = sitesById[activeSiteId];
      if (previous) applyBaseStyle(previous);
    }

    activeSiteId = String(site.id);
    polygons[site.id]?.setStyle(activeStyle(site));
  }

  function deactivate(site) {
    if (activeSiteId === String(site.id)) activeSiteId = null;
    applyBaseStyle(site);
  }

  function updateVisitedState(site, isVisited) {
    const polygon = polygons[site.id];
    if (!polygon) return;

    if (activeSiteId === String(site.id)) {
      polygon.setStyle(activeStyle(site));
      return;
    }

    polygon.setStyle(baseStyle(site, isVisited));
  }

  function render(sites) {
    polygonsLayer.clearLayers();
    Object.keys(polygons).forEach((id) => delete polygons[id]);
    Object.keys(sitesById).forEach((id) => delete sitesById[id]);
    activeSiteId = null;

    (sites || []).forEach((site) => {
      if (!site.coordinates?.polygon) return;
      const polygon = L.polygon(site.coordinates.polygon, {
        ...baseStyle(site),
        className: 'heritage-polygon',
      });
      polygon.bindPopup(createPopupContent(site));
      polygon.on('mouseover', () => {
        if (activeSiteId !== String(site.id)) polygon.setStyle(hoverStyle(site));
      });
      polygon.on('mouseout', () => {
        if (activeSiteId !== String(site.id)) applyBaseStyle(site);
      });
      polygon.on('popupopen', () => activate(site));
      polygon.on('click', () => {
        activate(site);
        onSiteSelected(site);
      });
      polygon.on('popupclose', () => {
        deactivate(site);
        onSiteUnselected?.(site);
      });
      polygonsLayer.addLayer(polygon);
      polygons[site.id] = polygon;
      sitesById[String(site.id)] = site;
      updateVisitedState(site, getIsCompleted(site.id));
    });

    return polygons;
  }

  return {
    getPolygons: () => polygons,
    render,
    updateVisitedState,
  };
}
