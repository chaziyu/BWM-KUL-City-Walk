import { DEFAULT_CENTER, POLYGON_OPACITY, ZOOM_THRESHOLD } from '../../config/app-config.js';
import { isMainSite } from '../sites/site-classification.js';
import { createGeolocationController } from './geolocation.js';
import { createMapFilter } from './map-filter.js';
import { createMarkerRenderer } from './marker-renderer.js';
import { createPolygonRenderer } from './polygon-renderer.js';

const VISITED_POLYGON_COLOR = '#007bff';

export function getSiteColors(site) {
  if (isMainSite(site)) {
    return { markerColor: '#A0522D', fillColor: '#DEB887', className: 'main-marker-pin' };
  }

  return { markerColor: '#9333EA', fillColor: '#E9D5FF', className: 'bonus-marker-pin' };
}

export function createMapController({
  L,
  loadSites,
  getIsCompleted,
  onSiteSelected,
  onSitePreview,
  onSitesLoaded,
}) {
  let map = null;
  let initPromise = null;
  let markersLayer = null;
  let polygonsLayer = null;
  let markerRenderer = null;
  let polygonRenderer = null;
  let geolocation = null;
  let allSites = [];
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

  function destroyMap() {
    window.removeEventListener('resize', updateVisibility);
    if (map) {
      map.off('zoomend', updateVisibility);
      geolocation?.destroy();
      geolocation = null;
      map.remove();
    }
    map = null;
    markersLayer = null;
    polygonsLayer = null;
    markerRenderer = null;
    polygonRenderer = null;
    allSites = [];
    briefPopupSiteId = null;
  }

  function initMap() {
    if (map) return Promise.resolve(map);
    if (initPromise) return initPromise;

    initPromise = (async () => {
      try {
        if (!L || typeof L.map !== 'function') {
          throw new Error('Leaflet is unavailable; the heritage map cannot initialise.');
        }

        const sites = await loadSites();

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

        const heritageZoneCoords = [
          [3.147975450896226, 101.69407218460753],
          [3.147875669801323, 101.69457723912365],
          [3.147127721948337, 101.6944130737071],
          [3.1470551688521766, 101.69489184188524],
          [3.147040581431142, 101.6953510702482],
          [3.146910977360818, 101.69596787508766],
          [3.146040219660293, 101.69582514844836],
          [3.1459295524663276, 101.69591377737044],
          [3.1458637739165027, 101.69617940300776],
          [3.145620507639194, 101.69619754843524],
          [3.1454236958548734, 101.69644408495282],
          [3.1454269210279193, 101.69664152594663],
          [3.145876457674504, 101.69661151752189],
          [3.145989111582452, 101.69696174751328],
          [3.1461807892438145, 101.6967713155949],
          [3.146446040826959, 101.69663637886669],
          [3.1466857109719655, 101.69655305879348],
          [3.1468060604896664, 101.69655801223007],
          [3.146937297155233, 101.69705182258997],
          [3.1479001753267966, 101.69784272570865],
          [3.1487399967401046, 101.69704196933861],
          [3.1491752105470994, 101.69664523897148],
          [3.149414835714637, 101.69667637206499],
          [3.1496467598275046, 101.69679166205447],
          [3.150331101888554, 101.69749987377344],
          [3.1504978321912773, 101.69782269435706],
          [3.1511062051509526, 101.69778453086059],
          [3.151545588948821, 101.69793104810935],
          [3.1518111265568223, 101.69815387102346],
          [3.1520067804815, 101.69841858672044],
          [3.152150698997616, 101.69845017521152],
          [3.152608986205081, 101.69846133998499],
          [3.1518050329278964, 101.6972225224726],
          [3.1518256789736085, 101.69716162454762],
          [3.152118750930242, 101.696964832047],
          [3.1512956011897018, 101.69643352266093],
          [3.1510097545517226, 101.69612397196687],
          [3.1513137554572097, 101.69585324808077],
          [3.151576527436319, 101.6955174573178],
          [3.150015739068621, 101.69453740808854],
          [3.147974025683567, 101.69407485071252]
        ];
        
        L.polyline(heritageZoneCoords, {
          color: '#8B4513',
          weight: 4,
          dashArray: '20, 10',
          interactive: false,
          className: 'animated-trail'
        }).addTo(map);

        markersLayer = L.layerGroup().addTo(map);
        polygonsLayer = L.layerGroup();

        markerRenderer = createMarkerRenderer({
          L,
          markersLayer,
          onSiteSelected: onSitePreview,
          getIsCompleted,
        });
        polygonRenderer = createPolygonRenderer({
          L,
          polygonsLayer,
          onSiteSelected: onSitePreview,
          getIsCompleted,
          getSiteColors,
          polygonOpacity: POLYGON_OPACITY,
          visitedColor: VISITED_POLYGON_COLOR,
        });

        map.on('zoomend', updateVisibility);
        window.addEventListener('resize', updateVisibility);

        allSites = sites;
        markerRenderer.render(sites);
        polygonRenderer.render(sites);
        geolocation = createGeolocationController({
          L,
          map,
          getMainSites: () => allSites.filter(isMainSite),
          isCompleted: getIsCompleted,
        });

        onSitesLoaded?.(sites);
        updateVisibility();
        setTimeout(() => map?.invalidateSize?.(), 100);
        return map;
      } catch (error) {
        destroyMap();
        throw error;
      } finally {
        initPromise = null;
      }
    })();

    return initPromise;
  }

  function refreshVisitedState(siteId) {
    const site = allSites.find((entry) => String(entry.id) === String(siteId));
    if (!site) return;
    const completed = getIsCompleted(siteId);
    markerRenderer.updateVisitedState(markerRenderer.getMarkers()[site.id], completed);
    polygonRenderer.updateVisitedState(site, completed);
    updateVisibility();
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
