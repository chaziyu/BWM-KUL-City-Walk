import { DEFAULT_CENTER, POLYGON_OPACITY, ZOOM_THRESHOLD } from '../../config/app-config.js';
import { createGeolocationController } from './geolocation.js';
import { createMapFilter } from './map-filter.js';
import { createMarkerRenderer } from './marker-renderer.js';
import { createPolygonRenderer } from './polygon-renderer.js';

const VISITED_POLYGON_COLOR = '#007bff';

export function getSiteColors(site) {
  if (/^\d+$/.test(String(site.id))) {
    return { markerColor: '#A0522D', fillColor: '#DEB887', className: 'main-marker-pin' };
  }

  return { markerColor: '#9333EA', fillColor: '#E9D5FF', className: 'bonus-marker-pin' };
}

export function createMapController({
  L,
  loadSites,
  getIsCompleted,
  onSiteSelected,
  onSitesLoaded,
}) {
  let map = null;
  let markersLayer = null;
  let polygonsLayer = null;
  let markerRenderer = null;
  let polygonRenderer = null;
  let geolocation = null;
  let allSites = [];
  let destroyed = false;
  let briefPopupSiteId = null;
  const mapFilter = createMapFilter();

  function getVisibleSiteIds() {
    return mapFilter.getVisibleSites(allSites).map((site) => String(site.id));
  }

  function updateVisibility() {
    if (!map || !markersLayer || !polygonsLayer) return;
    const visibleSiteIds = getVisibleSiteIds();

    if (map.getZoom() < ZOOM_THRESHOLD) {
      if (map.hasLayer(polygonsLayer)) map.removeLayer(polygonsLayer);
      if (!map.hasLayer(markersLayer)) map.addLayer(markersLayer);

      Object.entries(markerRenderer.getMarkers()).forEach(([id, marker]) => {
        if (visibleSiteIds.includes(id)) markersLayer.addLayer(marker);
        else markersLayer.removeLayer(marker);
      });
      return;
    }

    if (map.hasLayer(markersLayer)) map.removeLayer(markersLayer);
    if (!map.hasLayer(polygonsLayer)) map.addLayer(polygonsLayer);

    Object.entries(polygonRenderer.getPolygons()).forEach(([id, polygon]) => {
      if (visibleSiteIds.includes(id)) polygonsLayer.addLayer(polygon);
      else polygonsLayer.removeLayer(polygon);
    });
  }

  async function initMap() {
    if (map) return map;
    destroyed = false;

    map = L.map('map', {
      zoomControl: false,
      minZoom: 14,
      maxBounds: [
        [3.13, 101.67],
        [3.17, 101.72],
      ],
      maxBoundsViscosity: 1.0,
    }).setView(DEFAULT_CENTER, 16);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors © CARTO',
      maxZoom: 20,
    }).addTo(map);

    markersLayer = L.layerGroup().addTo(map);
    polygonsLayer = L.layerGroup();

    markerRenderer = createMarkerRenderer({
      L,
      markersLayer,
      onSiteDetails: onSiteSelected,
      onSiteSelected: (site) => {
        if (briefPopupSiteId === String(site.id)) {
          onSiteSelected(site);
          return;
        }
        briefPopupSiteId = String(site.id);
      },
      onSiteUnselected: (site) => {
        if (briefPopupSiteId === String(site.id)) briefPopupSiteId = null;
      },
      getIsCompleted,
    });
    polygonRenderer = createPolygonRenderer({
      L,
      polygonsLayer,
      onSiteDetails: onSiteSelected,
      onSiteSelected: (site) => {
        if (briefPopupSiteId === String(site.id)) {
          onSiteSelected(site);
          return;
        }
        briefPopupSiteId = String(site.id);
      },
      onSiteUnselected: (site) => {
        if (briefPopupSiteId === String(site.id)) briefPopupSiteId = null;
      },
      getIsCompleted,
      getSiteColors,
      polygonOpacity: POLYGON_OPACITY,
      visitedColor: VISITED_POLYGON_COLOR,
    });

    map.on('zoomend', updateVisibility);
    window.addEventListener('resize', updateVisibility);

    const sites = await loadSites();
    if (destroyed) return null;

    allSites = sites;
    markerRenderer.render(sites);
    polygonRenderer.render(sites);
    geolocation = createGeolocationController({
      L,
      map,
      getMainSites: () => allSites.filter((site) => /^\d+$/.test(String(site.id))),
      isCompleted: getIsCompleted,
    });

    onSitesLoaded?.(sites);
    updateVisibility();
    setTimeout(() => map?.invalidateSize(), 100);
    return map;
  }

  function refreshVisitedState(siteId) {
    const site = allSites.find((entry) => String(entry.id) === String(siteId));
    if (!site) return;
    const completed = getIsCompleted(siteId);
    markerRenderer.updateVisitedState(markerRenderer.getMarkers()[site.id], completed);
    polygonRenderer.updateVisitedState(site, completed);
    updateVisibility();
  }

  function destroyMap() {
    destroyed = true;
    window.removeEventListener('resize', updateVisibility);
    if (map) map.off('zoomend', updateVisibility);
    geolocation?.destroy();
    geolocation = null;
    map?.remove();
    map = null;
    markersLayer = null;
    polygonsLayer = null;
    allSites = [];
    briefPopupSiteId = null;
  }

  return {
    destroyMap,
    getFilterMode: () => mapFilter.getMode(),
    getMap: () => map,
    getSites: () => allSites,
    initMap,
    recenter(center, zoom) {
      map?.setView(center, zoom);
    },
    refreshVisitedState,
    setFilterMode(mode) {
      mapFilter.setMode(mode);
      updateVisibility();
    },
    zoomIn() {
      map?.zoomIn();
    },
    zoomOut() {
      map?.zoomOut();
    },
  };
}
