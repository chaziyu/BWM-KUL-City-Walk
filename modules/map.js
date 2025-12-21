import { DEFAULT_CENTER, ZOOM, ZOOM_THRESHOLD, POLYGON_OPACITY } from './config.js';
import { debounce, log } from './utils.js';
import { animateOpenModal } from './ui.js';

let map = null;
let markersLayer = null;
let polygonsLayer = null;
let allMarkers = {};
let allPolygons = {};
let userMarker = null;
let userCircle = null;
let activeFilterMode = 'must_visit';
let allSiteData = [];
const VISITED_POLYGON_COLOR = '#007bff';

// External callbacks
let onMarkerClick = null;

// NEW: Global object to store all Leaflet marker objects by site ID.
export { allMarkers, allPolygons };

export function getSites() {
    return allSiteData;
}

export function initMap(elementId, onClickCallback) {
    if (map) return map;
    onMarkerClick = onClickCallback;

    map = L.map(elementId, {
        zoomControl: false,
        minZoom: 14,
        maxBounds: [
            [3.13, 101.67], // Southwest corner
            [3.17, 101.72]  // Northeast corner
        ],
        maxBoundsViscosity: 1.0
    }).setView(DEFAULT_CENTER, ZOOM);

    map.on('zoomend', updateVisibility);
    window.addEventListener('resize', updateVisibility);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO',
        maxZoom: 20
    }).addTo(map);

    setTimeout(() => { map.invalidateSize(); }, 100);

    // Heritage Zone Polygon
    const heritageZoneCoords = [
        [3.147975450896226, 101.69407218460753], [3.147875669801323, 101.69457723912365], [3.147127721948337, 101.6944130737071],
        [3.1470551688521766, 101.69489184188524], [3.147040581431142, 101.6953510702482], [3.146910977360818, 101.69596787508766],
        [3.146040219660293, 101.69582514844836], [3.1459295524663276, 101.69591377737044], [3.1458637739165027, 101.69617940300776],
        [3.145620507639194, 101.69619754843524], [3.1454236958548734, 101.69644408495282], [3.1454269210279193, 101.69664152594663],
        [3.145876457674504, 101.69661151752189], [3.145989111582452, 101.69696174751328], [3.1461807892438145, 101.6967713155949],
        [3.146446040826959, 101.69663637886669], [3.1466857109719655, 101.69655305879348], [3.1468060604896664, 101.69655801223007],
        [3.146937297155233, 101.69705182258997], [3.1479001753267966, 101.69784272570865], [3.1487399967401046, 101.69704196933861],
        [3.1491752105470994, 101.69664523897148], [3.149414835714637, 101.69667637206499], [3.1496467598275046, 101.69679166205447],
        [3.150331101888554, 101.69749987377344], [3.1504978321912773, 101.69782269435706], [3.1511062051509526, 101.69778453086059],
        [3.151545588948821, 101.69793104810935], [3.1518111265568223, 101.69815387102346], [3.1520067804815, 101.69841858672044],
        [3.152150698997616, 101.69845017521152], [3.152608986205081, 101.69846133998499], [3.1518050329278964, 101.6972225224726],
        [3.1518256789736085, 101.69716162454762], [3.152118750930242, 101.696964832047], [3.1512956011897018, 101.69643352266093],
        [3.1510097545517226, 101.69612397196687], [3.1513137554572097, 101.69585324808077], [3.151576527436319, 101.6955174573178],
        [3.150015739068621, 101.69453740808854], [3.147974025683567, 101.69407485071252]
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

    markersLayer.on('add', () => {
        markersLayer.eachLayer(layer => {
            if (layer.options.isVisited) {
                safelyUpdateMarkerVisitedState(layer, true);
            }
        });
    });

    // User Location
    const userIcon = L.divIcon({
        className: 'user-pin-wrapper',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        html: '<div class="user-location-pin"></div>'
    });

    userMarker = L.marker([0, 0], { icon: userIcon }).addTo(map);
    userCircle = L.circle([0, 0], {
        color: "#10B981",
        opacity: 0.4,
        fillColor: "#10B981",
        fillOpacity: 0.05,
        weight: 1
    }).addTo(map);

    return map;
}

export function loadSites(sites, visitedSites, discoveredSites) {
    allSiteData = sites; // Store locally
    allMarkers = {};
    allPolygons = {};
    markersLayer.clearLayers();
    polygonsLayer.clearLayers();

    sites.forEach(site => {
        const isSiteVisited = visitedSites.includes(site.id) || discoveredSites.includes(site.id);
        const { markerColor, fillColor, className } = getSiteColors(site);

        // Marker
        let latlng = Array.isArray(site.coordinates) ? site.coordinates : site.coordinates?.marker;
        if (latlng) {
            const marker = L.marker(latlng)
                .bindTooltip(site.name, {
                    permanent: false,
                    direction: 'top',
                    sticky: true
                });

            allMarkers[site.id] = marker;
            if (isSiteVisited) marker.options.isVisited = true;

            marker.on('add', (e) => {
                setTimeout(() => {
                    const el = e.target._icon;
                    if (el) {
                        el.classList.add('animate-pin-drop');
                        setTimeout(() => el.classList.remove('animate-pin-drop'), 500);
                    }
                }, 0);
                if (e.target.options.isVisited) {
                    safelyUpdateMarkerVisitedState(e.target, true);
                }
            });

            marker.on('click', () => {
                if (onMarkerClick) onMarkerClick(site, marker);
            });
            markersLayer.addLayer(marker);
        }

        // Polygon
        if (site.coordinates.polygon) {
            const poly = L.polygon(site.coordinates.polygon, {
                color: markerColor,
                fillColor: fillColor,
                fillOpacity: 0.5,
                weight: 2
            });

            allPolygons[site.id] = poly;
            if (isSiteVisited) {
                safelyUpdatePolygonVisitedState(site.id, true);
            }

            poly.on('click', () => {
                if (onMarkerClick) onMarkerClick(site, allMarkers[site.id]); // Pass marker if available
            });
            polygonsLayer.addLayer(poly);
        }
    });

    updateVisibility();
}

export function setFilterMode(mode) {
    activeFilterMode = mode;
    updateVisibility();
}

export function updateVisibility() {
    if (!map || !markersLayer || !polygonsLayer) return;

    const currentZoom = map.getZoom();

    const visibleSiteIds = allSiteData
        .filter(site => {
            if (activeFilterMode === 'must_visit') {
                return site.category === 'must_visit';
            } else {
                return site.category === 'recommended';
            }
        })
        .map(site => site.id);

    // A. Handle Markers (Show when Zoom < Threshold)
    if (currentZoom < ZOOM_THRESHOLD) {
        if (map.hasLayer(polygonsLayer)) map.removeLayer(polygonsLayer);
        if (!map.hasLayer(markersLayer)) map.addLayer(markersLayer);

        Object.keys(allMarkers).forEach(id => {
            const marker = allMarkers[id];
            if (visibleSiteIds.includes(id)) {
                if (!markersLayer.hasLayer(marker)) markersLayer.addLayer(marker);
            } else {
                if (markersLayer.hasLayer(marker)) markersLayer.removeLayer(marker);
            }
        });

    } else {
        // Zoomed in: Show Polygons
        if (map.hasLayer(markersLayer)) map.removeLayer(markersLayer);
        if (!map.hasLayer(polygonsLayer)) map.addLayer(polygonsLayer);

        Object.keys(allPolygons).forEach(id => {
            const poly = allPolygons[id];
            if (visibleSiteIds.includes(id)) {
                if (!polygonsLayer.hasLayer(poly)) polygonsLayer.addLayer(poly);
            } else {
                if (polygonsLayer.hasLayer(poly)) polygonsLayer.removeLayer(poly);
            }
        });
    }
}

function getSiteColors(site) {
    const isMainLocation = /^\d+$/.test(site.id);

    if (isMainLocation) {
        const markerColor = "#A0522D";
        const fillColor = "#DEB887";
        const className = 'main-marker-pin';
        return { markerColor, fillColor, className };
    } else {
        const markerColor = "#9333EA";
        const fillColor = "#E9D5FF";
        const className = 'bonus-marker-pin';
        return { markerColor, fillColor, className };
    }
}

export function safelyUpdateMarkerVisitedState(marker, isVisited) {
    if (!marker) return;
    marker.options.isVisited = isVisited;
    if (marker && marker._icon) {
        if (isVisited) {
            marker._icon.classList.add('marker-visited');
        } else {
            marker._icon.classList.remove('marker-visited');
        }
    }
}

export function safelyUpdatePolygonVisitedState(siteId, isVisited) {
    const polygon = allPolygons[siteId];
    if (polygon) {
        if (isVisited) {
            polygon.setStyle({
                color: VISITED_POLYGON_COLOR,
                fillColor: VISITED_POLYGON_COLOR,
                fillOpacity: POLYGON_OPACITY
            });
        }
    }
}

export function destroyMap() {
    if (map) {
        map.remove();
        map = null;
        allMarkers = {};
        allPolygons = {};
        markersLayer = null;
        polygonsLayer = null;
        userMarker = null;
        log("Map destroyed");
    }
}

export function startLocationWatch(onLocationFound, onLocationError) {
    if (!map) return;

    map.on('locationfound', (e) => {
        if (userMarker) userMarker.setLatLng(e.latlng);
        if (userCircle) userCircle.setLatLng(e.latlng).setRadius(Math.min(e.accuracy / 2, 100));
        if (onLocationFound) onLocationFound(e.latlng);
    });

    map.on('locationerror', (e) => {
        if (onLocationError) onLocationError(e);
        if (e.code === 3) { // TIMEOUT
            console.warn("GPS Timeout, trying lower accuracy");
            map.locate({ watch: true, enableHighAccuracy: false, maximumAge: 10000 });
        }
    });

    map.locate({
        watch: true,
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 10000
    });
}

export function stopLocationWatch() {
    if (map) map.stopLocate();
}

/**
 * Opens Google Maps for directions or nearby search.
 */
export function openGoogleMaps(lat, lon, mode, siteName = "") {
    const destination = `${lat},${lon}`;
    let externalUrl = '';
    let embedUrl = '';

    const placeQuery = siteName ? encodeURIComponent(siteName) : destination;

    if (mode === 'directions' || mode === 'transit') {
        externalUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=transit`;
        embedUrl = `https://maps.google.com/maps?saddr=My+Location&daddr=${destination}&t=m&z=15&dirflg=r&output=embed`;
    } else if (mode === 'walk') {
        externalUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=walking`;
        embedUrl = `https://maps.google.com/maps?saddr=My+Location&daddr=${destination}&t=m&z=15&dirflg=w&output=embed`;
    } else if (mode === 'restaurants') {
        externalUrl = `https://www.google.com/maps/search/restaurants/@${lat},${lon},16z`;
        embedUrl = `https://maps.google.com/maps?q=restaurants&sll=${lat},${lon}&t=m&z=16&output=embed`;
    } else if (mode === 'hotels') {
        externalUrl = `https://www.google.com/maps/search/hotels/@${lat},${lon},16z`;
        embedUrl = `https://maps.google.com/maps?q=hotels&sll=${lat},${lon}&t=m&z=16&output=embed`;
    }

    const directionsModal = document.getElementById('directionsModal');
    const directionsIframe = document.getElementById('directionsIframe');
    const directionsLoading = document.getElementById('directionsLoading');
    const directionsTitle = document.getElementById('directionsTitle');
    const externalMapsLink = document.getElementById('externalMapsLink');

    if (directionsModal && directionsIframe) {
        if (directionsTitle) {
            let titleText = "Directions";
            let icon = "🗺️";
            if (mode === 'restaurants') { titleText = `Food Near ${siteName || 'Site'}`; icon = "🍔"; }
            else if (mode === 'hotels') { titleText = `Hotels Near ${siteName || 'Site'}`; icon = "🏨"; }
            else if (mode === 'transit' || mode === 'directions') { titleText = `Transit to ${siteName || 'Site'}`; icon = "🚇"; }
            else if (mode === 'walk') { titleText = `Walk to ${siteName || 'Site'}`; icon = "🚶"; }

            directionsTitle.innerHTML = `<span>${icon}</span> ${titleText}`;
        }

        if (directionsLoading) directionsLoading.classList.remove('hidden');
        directionsIframe.onload = () => {
            if (directionsLoading) directionsLoading.classList.add('hidden');
        };

        directionsIframe.src = embedUrl;
        if (externalMapsLink) externalMapsLink.href = externalUrl;

        if (directionsModal.classList.contains('hidden')) {
            animateOpenModal(directionsModal);
        }
    } else if (externalUrl) {
        window.open(externalUrl, '_blank');
    }
}
