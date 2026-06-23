export function createPolygonRenderer({
  L,
  polygonsLayer,
  onSiteSelected,
  getIsCompleted,
  getSiteColors,
  visitedColor,
  polygonOpacity,
}) {
  const polygons = {};

  function createPopupContent(site) {
    if (!globalThis.document) return [site.name, site.info].filter(Boolean).join('\n');

    const content = document.createElement('div');
    const title = document.createElement('strong');
    const info = document.createElement('p');

    title.textContent = site.name;
    info.textContent = site.info || '';
    content.append(title, info);
    return content;
  }

  function updateVisitedState(site, isVisited) {
    const polygon = polygons[site.id];
    if (!polygon) return;

    if (isVisited) {
      polygon.setStyle({
        color: visitedColor,
        fillColor: visitedColor,
        fillOpacity: polygonOpacity,
      });
      return;
    }

    const { markerColor, fillColor } = getSiteColors(site);
    polygon.setStyle({
      color: markerColor,
      fillColor,
      fillOpacity: 0.5,
    });
  }

  function render(sites) {
    polygonsLayer.clearLayers();
    Object.keys(polygons).forEach((id) => delete polygons[id]);

    (sites || []).forEach((site) => {
      if (!site.coordinates?.polygon) return;
      const { markerColor, fillColor } = getSiteColors(site);
      const polygon = L.polygon(site.coordinates.polygon, {
        color: markerColor,
        className: 'heritage-polygon',
        fillColor,
        fillOpacity: 0.5,
        weight: 2,
      });
      polygon.bindPopup(createPopupContent(site));
      polygon.on('click', () => onSiteSelected(site));
      polygonsLayer.addLayer(polygon);
      polygons[site.id] = polygon;
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
