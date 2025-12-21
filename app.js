//PROBLEM: Kedai Ubat Kwong Ban Heng is not there anymore!!!
//The garden flower stall is also not there anymore. Only the teochew association

// --- CONFIGURATION ---
import { HISTORY_WINDOW_SIZE, MAX_MESSAGES_PER_SESSION, DEFAULT_CENTER, ZOOM, ZOOM_THRESHOLD, POLYGON_OPACITY, MAX_FONT_SIZE } from './config.js';
import { migrateData } from './storage-migration.js';
import { STRINGS } from './localization.js';

// --- VERCEL ANALYTICS ---
import { inject } from 'https://cdn.jsdelivr.net/npm/@vercel/analytics/+esm';
inject();

// --- VERCEL SPEED INSIGHTS ---
import { injectSpeedInsights } from 'https://cdn.jsdelivr.net/npm/@vercel/speed-insights/+esm';
injectSpeedInsights();

// --- UTILITIES ---
const DEBUG = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const log = DEBUG ? console.log.bind(console) : () => { };

/**
 * Debounce function to limit execution frequency
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}


// --- DATA MIGRATION ---
// Run migration before loading any state variables
migrateData();

// --- HELPER FUNCTIONS ---

/**
 * Opens Google Maps for directions or nearby search.
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} mode - 'directions', 'restaurants', 'hotels', 'walk' or 'transit'
 * @param {string} [siteName] - Optional name of the location for richer place cards
 */
function openGoogleMaps(lat, lon, mode, siteName = "") {
    const destination = `${lat},${lon}`;
    let externalUrl = '';
    let embedUrl = '';

    // Determine the query text: use siteName if possible for richer cards
    const placeQuery = siteName ? encodeURIComponent(siteName) : destination;

    if (mode === 'directions' || mode === 'transit') {
        externalUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=transit`;
        // Legacy Embed: saddr=My+Location triggers route visualization on the map
        embedUrl = `https://maps.google.com/maps?saddr=My+Location&daddr=${destination}&t=m&z=15&dirflg=r&output=embed`;
    } else if (mode === 'walk') {
        externalUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=walking`;
        embedUrl = `https://maps.google.com/maps?saddr=My+Location&daddr=${destination}&t=m&z=15&dirflg=w&output=embed`;
    } else if (mode === 'restaurants') {
        // Search restaurants centered on the heritage site location, not user location
        externalUrl = `https://www.google.com/maps/search/restaurants/@${lat},${lon},16z`;
        // For embed: explicitly center on site coordinates and search nearby
        embedUrl = `https://maps.google.com/maps?q=restaurants&sll=${lat},${lon}&t=m&z=16&output=embed`;
    } else if (mode === 'hotels') {
        // Search hotels centered on the heritage site location, not user location
        externalUrl = `https://www.google.com/maps/search/hotels/@${lat},${lon},16z`;
        // For embed: explicitly center on site coordinates and search nearby
        embedUrl = `https://maps.google.com/maps?q=hotels&sll=${lat},${lon}&t=m&z=16&output=embed`;
    }

    const directionsModal = document.getElementById('directionsModal');
    const directionsIframe = document.getElementById('directionsIframe');
    const directionsLoading = document.getElementById('directionsLoading');
    const directionsTitle = document.getElementById('directionsTitle');
    const externalMapsLink = document.getElementById('externalMapsLink');

    if (directionsModal && directionsIframe) {
        // --- Update Dynamic Title with Action Icons ---
        if (directionsTitle) {
            let titleText = "Directions";
            let icon = "🗺️";
            if (mode === 'restaurants') { titleText = `Food Near ${siteName || 'Site'}`; icon = "🍔"; }
            else if (mode === 'hotels') { titleText = `Hotels Near ${siteName || 'Site'}`; icon = "🏨"; }
            else if (mode === 'transit' || mode === 'directions') { titleText = `Transit to ${siteName || 'Site'}`; icon = "🚇"; }
            else if (mode === 'walk') { titleText = `Walk to ${siteName || 'Site'}`; icon = "🚶"; }

            directionsTitle.innerHTML = `<span>${icon}</span> ${titleText}`;
        }
        // Setup Iframe
        if (directionsLoading) directionsLoading.classList.remove('hidden');
        directionsIframe.onload = () => {
            if (directionsLoading) directionsLoading.classList.add('hidden');
        };

        directionsIframe.src = embedUrl;
        if (externalMapsLink) externalMapsLink.href = externalUrl;


        // Open Modal if hidden
        if (directionsModal.classList.contains('hidden')) {
            animateOpenModal(directionsModal);
        }
    } else if (externalUrl) {
        window.open(externalUrl, '_blank');
    }
}

// --- PREMIUM MODAL ANIMATION HELPERS ---
function animateOpenModal(modal) {
    if (!modal) return;
    modal.classList.remove('hidden', 'modal-closing');
    modal.classList.add('modal-opening');

    // ACCESSIBILITY: Set focus to the first focusable element inside the modal
    const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const firstFocusableElement = modal.querySelectorAll(focusableElements)[0];
    if (firstFocusableElement) {
        setTimeout(() => firstFocusableElement.focus(), 100); // Small delay for visibility
    }
}

function animateCloseModal(modal) {
    if (!modal || modal.classList.contains('hidden')) return;

    // NEW: Stop audio when site modal closes
    if (modal.id === 'siteModal') {
        const soundEffect2 = document.getElementById('soundEffect2');
        if (soundEffect2) {
            soundEffect2.pause();
            soundEffect2.currentTime = 0;
        }
    }

    modal.classList.remove('modal-opening');
    modal.classList.add('modal-closing');
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('modal-closing');
        // Return focus to the trigger button if needed (Context specific, skipping generic implementation to avoid errors)
    }, 400); // Match CSS cinematicFadeOut duration
}

// NEW: Helper for smooth screen transitions (e.g. Landing -> Gatekeeper)
function animateScreenSwitch(fromScreen, toScreen) {
    if (!fromScreen || !toScreen) return;

    // 1. Fade out current screen
    fromScreen.classList.add('modal-closing'); // Clean fade out

    setTimeout(() => {
        fromScreen.classList.add('hidden');
        fromScreen.classList.remove('modal-closing');

        // 2. Show next screen with entry animation
        toScreen.classList.remove('hidden');
        // Re-trigger animation if class exists, or add it
        toScreen.classList.remove('animate-fade-scale');
        void toScreen.offsetWidth; // Trigger reflow
        toScreen.classList.add('animate-fade-scale');
    }, 400);
}

// ACCESSIBILITY: Global Key Listener for Escape and Tab Trapping
document.addEventListener('keydown', (e) => {
    // 1. Close Modals on ESC
    if (e.key === 'Escape') {
        const sensitiveModals = ['#gatekeeper', '#landing-page']; // Don't close these on ESC
        const openModals = document.querySelectorAll('[role="dialog"]:not(.hidden)');

        openModals.forEach(modal => {
            if (!sensitiveModals.includes('#' + modal.id)) {
                animateCloseModal(modal);
                // Special case handling for overlays
                if (modal.id === 'badgeInputModal') modal.classList.add('hidden');
            }
        });
    }

    // 2. Trap Focus in Modals
    if (e.key === 'Tab') {
        const openModal = document.querySelector('[role="dialog"]:not(.hidden)');
        if (openModal) {
            const focusableElements = openModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusableElements.length === 0) return;

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey) { /* Shift + Tab */
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                }
            } else { /* Tab */
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        }
    }
});

// --- HISTORY API HELPER ---
function openModalState(modalId) {
    window.history.pushState({ modal: modalId }, '', window.location.pathname);
}

// --- GAME STATE ---
let map = null;
let visitedSites = JSON.parse(localStorage.getItem('jejak_visited')) || [];
let discoveredSites = JSON.parse(localStorage.getItem('jejak_discovered')) || [];
const TOTAL_SITES = 11;
let allSiteData = [];
// NEW: Cached array of main heritage sites (numerical IDs) for performance
let mainSites = [];
let chatHistory = JSON.parse(localStorage.getItem('jejak_chat_history')) || [];
let userMessageCount = parseInt(localStorage.getItem('jejak_message_count')) || 0;
let currentModalSite = null; // To track the currently open pin
let currentModalMarker = null; // To track the currently open marker
let userMarker = null; // Make userMarker global for proximity pulse
let solvedRiddle = JSON.parse(localStorage.getItem('jejak_solved_riddle')) || {};
// Get or Create a unique Device ID for this browser
let markersLayer = null;  // New: Layer group for markers
let polygonsLayer = null; // New: Layer group for polygons
// ZOOM_THRESHOLD imported from config.js
let allMarkers = {}; // NEW: Global object to store all Leaflet marker objects by site ID.
let allPolygons = {}; // NEW: Global object to store all Leaflet polygon objects by site ID.
const VISITED_POLYGON_COLOR = '#007bff'; // Blue color for visited polygons
// --- END NEW FIXES ---
let deviceId = localStorage.getItem('bwm_device_id');
if (!deviceId) {
    deviceId = 'device-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('bwm_device_id', deviceId);
}

// --- ADDED: DAILY RIDDLE DATABASE ---
const allRiddles = [
    { q: "My 41-meter clock tower houses a one-ton bell that first chimed for Queen Victoria's birthday. What am I?", a: "1" },
    { q: "I was designed by A.B. Hubback to perfectly match my famous neighbor, the Sultan Abdul Samad Building.", a: "2" },
    { q: "I am a 6-storey Art Deco building named after a famous tin tycoon, Loke Yew.", a: "3" },
    { q: "I sit at the 'muddy confluence' of two rivers, the very birthplace of Kuala Lumpur.", a: "4" },
    { q: "My Art Deco clock tower was built in 1937 to commemorate the coronation of King George VI.", a: "5" },
    { q: "I am KL's oldest Chinese temple, and I am uniquely angled to follow Feng Shui principles.", a: "6" },
    { q: "I am an unusual triangular building with no 'five-foot way' and whimsical garlic-shaped finials on my roof.", a: "7" },
    { q: "In 1932, I was the tallest building in KL, standing at 85 feet. I also housed Radio Malaya.", a: "9" },
    { q: "My prayer services are held in both Arabic and Tamil, a unique feature for a mosque in this area.", a: "11" },
    { q: "I am Malaysia's oldest existing jewellers, founded by a man who was shipwrecked!", a: "12" },
    { q: "I was KL's only theatre, but I was heavily damaged by a major fire in the 1980s.", a: "13" }
];

// --- DOM Elements ---
let siteModal, siteModalImage, siteModalLabel, siteModalTitle, siteModalInfo, siteModalQuizArea, siteModalQuizQ, siteModalQuizOptions, siteModalQuizInput, siteModalQuizBtn, siteModalQuizResult, closeSiteModal, siteModalAskAI, siteModalDirections, siteModalCheckInBtn, siteModalSolveChallengeBtn, siteModalMoreBtn, siteModalMoreContent, siteModalMore;
let siteModalFoodBtn, siteModalHotelBtn; // NEW BUTTONS
let chatModal, closeChatModal, chatHistoryEl, chatInput, chatSendBtn, chatLimitText;
let passportModal, closePassportModal, passportInfo, passportGrid;
let welcomeModal, closeWelcomeModal;
let congratsModal, closeCongratsModal, shareWhatsAppBtn;
let challengeModal, closeChallengeModal, btnChallenge, challengeRiddle, challengeResult;
let chaChingSound;
let siteModalHintBtn, siteModalHintText;

// --- BADGE GENERATION LOGIC ---

// 1. Setup Listeners
document.addEventListener('DOMContentLoaded', () => {

    // Elements
    const badgeModal = document.getElementById('badgeInputModal');
    const closeBadgeBtn = document.getElementById('closeBadgeModal');
    const btnGenerate = document.getElementById('btnGenerateBadge');

    const nameInput = document.getElementById('explorerNameInput');
    const photoInput = document.getElementById('explorerPhotoInput');

    // Template Elements
    const badgeName = document.getElementById('badgeNameDisplay');
    const badgeDate = document.getElementById('badgeDateDisplay');
    const badgePhoto = document.getElementById('badgeProfileImage');

    // Close Modal Logic
    if (closeBadgeBtn) {
        closeBadgeBtn.addEventListener('click', () => {
            badgeModal.classList.add('hidden');
        });
    }

    // 2. The Main Generation Function
    if (btnGenerate) {
        btnGenerate.addEventListener('click', async () => {
            // A. Update the Template with User Data
            const userName = nameInput.value.trim() || "Master Explorer"; // Default if empty
            badgeName.textContent = userName;

            // Set Date
            const today = new Date();
            badgeDate.textContent = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

            // Handle Photo
            // Handle Photo
            if (photoInput.files && photoInput.files[0]) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    badgePhoto.onload = () => {
                        // Tiny delay to ensure rendering matches DOM
                        requestAnimationFrame(() => captureAndDownload());
                    };
                    badgePhoto.src = e.target.result;
                }
                reader.readAsDataURL(photoInput.files[0]);
            } else {
                // Use default if no photo uploaded
                badgePhoto.crossOrigin = "anonymous"; // Important for external images
                badgePhoto.onload = () => {
                    requestAnimationFrame(() => captureAndDownload());
                };
                badgePhoto.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
            }
        });
    }

    // 3. The Screenshot & Download Logic
    function captureAndDownload() {
        const badgeElement = document.getElementById('hiddenBadgeTemplate');

        // Show loading state
        btnGenerate.textContent = STRINGS.game.generatingBadge;
        btnGenerate.disabled = true;

        // UNHIDE TEMPLATE FOR CAPTURE
        badgeElement.style.opacity = '1';
        badgeElement.style.zIndex = '-50'; // Keep behind

        // DYNAMIC STATUS & CAPTION UPDATE
        const statusDisplay = document.getElementById('badgeStatusDisplay');
        const captionDisplay = document.getElementById('badgeCaptionDisplay');
        const statusStamp = document.getElementById('badgeStatusStamp');

        if (statusDisplay && captionDisplay && statusStamp) {
            const visitedCount = visitedSites.length;
            const mainSitesTotal = (typeof mainSites !== 'undefined' && mainSites.length > 0) ? mainSites.length : 11;
            const isComplete = visitedCount >= mainSitesTotal;

            // 1. Determine Title based on count
            let title = STRINGS.game.badgeLevels.beginner;
            if (visitedCount >= 10) title = STRINGS.game.badgeLevels.master;
            else if (visitedCount >= 6) title = STRINGS.game.badgeLevels.specialist;
            else if (visitedCount >= 3) title = STRINGS.game.badgeLevels.explorer;

            statusDisplay.textContent = title;

            // 2. Determine Caption
            const caption = isComplete
                ? STRINGS.game.badgeCaptions.complete
                : STRINGS.game.badgeCaptions.partial(visitedCount);

            captionDisplay.textContent = `"${caption}"`;

            // 3. Update Red Stamp
            if (isComplete) {
                statusStamp.innerHTML = '<div class="text-red-900/80 text-[9px] font-bold text-center uppercase leading-tight">BWM<br>Kuala Lumpur<br>COMPLETED</div>';
            } else {
                statusStamp.innerHTML = `<div class="text-red-900/80 text-[9px] font-bold text-center uppercase leading-tight">BWM<br>Kuala Lumpur<br>${visitedCount}/${mainSitesTotal} VISITED</div>`;
            }
        }

        html2canvas(badgeElement, {
            scale: 2, // High resolution
            useCORS: true, // Allow loading external images
            backgroundColor: null // Transparent background handling
        }).then(canvas => {
            // RE-HIDE TEMPLATE
            badgeElement.style.opacity = '0';

            // Create download link
            const link = document.createElement('a');
            link.download = `Heritage-Explorer-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();

            // Reset UI
            btnGenerate.textContent = STRINGS.game.generateBadge;
            btnGenerate.disabled = false;

            // Play sound!
            if (typeof chaChingSound !== 'undefined') chaChingSound.play();

        }).catch(err => {
            // RE-HIDE TEMPLATE
            badgeElement.style.opacity = '0';

            console.error("Badge generation failed:", err);
            alert(STRINGS.game.badgeError);
            btnGenerate.textContent = STRINGS.game.tryAgain;
            btnGenerate.disabled = false;
        });
    }
});

//BUG FIX
// --- UTILITY FUNCTION FOR SAFELY MANAGING MARKER STATE ---
function safelyUpdateMarkerVisitedState(marker, isVisited) {
    if (!marker) return; // Defensive check

    // 1. Persist state on the Leaflet object (Custom Property)
    marker.options.isVisited = isVisited;

    // 2. Safely apply the CSS class to the icon (if currently rendered)
    if (marker && marker._icon) {
        if (isVisited) {
            marker._icon.classList.add('marker-visited');
        } else {
            marker._icon.classList.remove('marker-visited');
        }
    }
}

// NEW HELPER: Safely updates the polygon's color
function safelyUpdatePolygonVisitedState(siteId, isVisited) {
    const polygon = allPolygons[siteId];
    if (polygon) {
        // NEW HELPER: Safely updates the polygon's color
        if (isVisited) {
            polygon.setStyle({
                color: VISITED_POLYGON_COLOR, // Blue Outline
                fillColor: VISITED_POLYGON_COLOR, // Blue Fill
                fillOpacity: POLYGON_OPACITY // Reduced opacity for visited
            });
        } else {
            // Logic to revert to original colors if needed (for completeness)
            const site = allSiteData.find(s => s.id === siteId);
            if (site) {
                const { markerColor, fillColor } = getSiteColors(site);
                polygon.setStyle({
                    color: markerColor,
                    fillColor: fillColor,
                    fillOpacity: 0.5
                });
            }
        }
    }
}

// --- MAP FILTER STATE ---
let activeFilterMode = 'must_visit'; // Default: Top 6 Only (as requested "highlight only")

// ... (existing code) ...

//MAP LOGIC
// 2. The Switcher Function (No "site" variable needed here!)
// --- MAP VISIBILITY TOGGLE (UPDATED FOR TABS) ---
function updateVisibility() {
    // Safety check: ensure map and layers are initialized before proceeding
    if (!map || !markersLayer || !polygonsLayer) return;

    const currentZoom = map.getZoom();

    // 1. Determine which Sites to Show based on Filter Mode
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
        // Ensure Polygons are hidden
        if (map.hasLayer(polygonsLayer)) map.removeLayer(polygonsLayer);

        // Ensure Markers Layer Group is on map
        if (!map.hasLayer(markersLayer)) map.addLayer(markersLayer);

        // Toggle individual markers within the group
        Object.keys(allMarkers).forEach(id => {
            const marker = allMarkers[id];
            if (visibleSiteIds.includes(id)) {
                if (!markersLayer.hasLayer(marker)) markersLayer.addLayer(marker);
            } else {
                if (markersLayer.hasLayer(marker)) markersLayer.removeLayer(marker);
            }
        });

    } else {
        // Zoomed in: Show Polygons (Show when Zoom >= Threshold)
        // Ensure Markers are hidden
        if (map.hasLayer(markersLayer)) map.removeLayer(markersLayer);

        // Ensure Polygons Layer Group is on map
        if (!map.hasLayer(polygonsLayer)) map.addLayer(polygonsLayer);

        // Toggle individual polygons within the group
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

// --- UTILITY FUNCTION FOR COLOR CODING BASED ON ID ---
function getSiteColors(site) {
    const isMainLocation = /^\d+$/.test(site.id); // Checks if ID is a number (1, 2, 3...)

    if (isMainLocation) {
        // Colors for Main Heritage Sites (Numerical ID: 1, 2, 3...)
        const markerColor = "#A0522D"; // Sienna Brown
        const fillColor = "#DEB887";   // Light Tan for polygon fill
        const className = 'main-marker-pin';
        return { markerColor, fillColor, className };
    } else {
        // Colors for Checkpoints/Bonus Sites (Alphabetical ID: A, B, M...)
        // UPDATED: Changed from Green to Purple for better contrast against map greenery
        const markerColor = "#9333EA"; // Vibrant Purple (Tailwind Purple-600)
        const fillColor = "#E9D5FF";   // Light Purple (Tailwind Purple-200)
        const className = 'bonus-marker-pin';
        return { markerColor, fillColor, className };
    }
}

// --- RELEASE RESOURCES ---
function destroyMap() {
    if (map) {
        map.remove(); // Removes from DOM and cleans up Leaflet listeners
        map = null;
        allMarkers = {};
        allPolygons = {};
        markersLayer = null;
        polygonsLayer = null;
        userMarker = null;
        log("Map destroyed and resources released.");
    }
}

// --- CORE GAME & MAP INITIALIZATION ---
function initializeGameAndMap() {
    if (map) return;

    // 1. Initialize the map object FIRST (Disable default zoom control)
    // ADDED: maxBounds to prevent panning away from KL
    map = L.map('map', {
        zoomControl: false,
        minZoom: 14,
        maxBounds: [
            [3.13, 101.67], // Southwest corner
            [3.17, 101.72]  // Northeast corner
        ],
        maxBoundsViscosity: 1.0 // Bounce back immediately
    }).setView(DEFAULT_CENTER, 16);

    // 2. NOW you can SAFELY attach the event listener, preventing the TypeError
    map.on('zoomend', updateVisibility); // <--- FIX IS HERE
    // NEW: Handle resize events (e.g. device rotation) to keep markers/polygons in sync
    window.addEventListener('resize', updateVisibility);

    // MODIFIED: Reverted to the original map style
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO',
        maxZoom: 20
    }).addTo(map);

    setTimeout(() => { map.invalidateSize(); }, 100);

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

    // Original heritage zone polygon
    L.polyline(heritageZoneCoords, {
        color: '#8B4513',
        weight: 4,
        dashArray: '20, 10', // Key: Sets a dashed line pattern
        interactive: false,
        className: 'animated-trail' // Key: Assign a CSS class
    }).addTo(map);

    // 3. Initialize the Layer Groups
    markersLayer = L.layerGroup().addTo(map); // Add markers layer to map (visible by default)
    polygonsLayer = L.layerGroup();           // Do NOT add polygons layer to map yet

    markersLayer.on('add', () => {
        markersLayer.eachLayer(layer => {
            // Check the state we saved on the marker object
            if (layer.options.isVisited) {
                safelyUpdateMarkerVisitedState(layer, true);
            }
        });
    });

    fetch('data.json').then(res => res.json()).then(sites => {
        allSiteData = sites;
        // CACHE MAIN SITES (Performance Optimization)
        mainSites = allSiteData.filter(site => !isNaN(parseInt(site.id)));
        log("Loaded sites:", allSiteData.length);

        sites.forEach(site => {

            // 1. FIX: DEFINE THE VARIABLE HERE!
            const isSiteVisited = visitedSites.includes(site.id) || discoveredSites.includes(site.id); // <--- FIX IS HERE

            // 1. Get Colors and Classes based on ID (Numerical vs. Alphabetical)
            const { markerColor, fillColor, className } = getSiteColors(site);

            // --- Determine Coordinates ---
            let latlng = Array.isArray(site.coordinates) ? site.coordinates : site.coordinates?.marker;
            if (!latlng) return;

            // 2. Create the Custom Div Icon using the calculated color
            /*
            const customIcon = L.divIcon({
                className: 'custom-map-pin ' + className,
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                // Use inline style for the color block of the pin
                html: `<div style="background-color: ${markerColor};" class="pin-head"></div><div class="pin-shadow"></div>`
            });
            */
            // 3. Create the Marker
            const marker = L.marker(latlng)
                .bindTooltip(site.name, {
                    permanent: false,
                    direction: 'top',
                    sticky: true
                });

            // NEW: Store the marker globally
            allMarkers[site.id] = marker;

            // FIX: Use the 'add' event and the helper to safely apply the class
            if (visitedSites.includes(site.id) || discoveredSites.includes(site.id)) {
                // Set the state on the marker object itself for persistence
                marker.options.isVisited = true;
            }

            // Always attach the listener to handle re-adding to map (filtering)
            marker.on('add', (e) => {
                // ADDED: Pin Drop Animation (Safe delay and cleanup)
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
            // END FIX
            // 4. Attach Click Event
            marker.on('click', () => {
                showPreviewCard(site);
            });
            markersLayer.addLayer(marker);

            // 4. Create the Polygon
            if (site.coordinates.polygon) {
                const poly = L.polygon(site.coordinates.polygon, {
                    color: markerColor,          // Outline: Category Color
                    fillColor: fillColor,        // Fill: Lighter Category Color
                    fillOpacity: 0.5,
                    weight: 2
                });

                // NEW: Store the polygon globally
                allPolygons[site.id] = poly;

                // NEW: Check if already visited and apply VISITED_POLYGON_COLOR
                if (isSiteVisited) {
                    safelyUpdatePolygonVisitedState(site.id, true);
                }

                poly.on('click', () => showPreviewCard(site));
                polygonsLayer.addLayer(poly);
            }

        });

        updateGameProgress();
        updatePassport();
        // FIX: Apply initial filter immediately after loading data
        updateVisibility();
    }).catch(err => console.error("Error loading Map Data:", err));


    // --- Custom User Location Pin ---
    const userIcon = L.divIcon({
        // 1. Keep the wrapper clean (no animation here!)
        className: 'user-pin-wrapper',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        // 2. Add the style class to this INNER div instead
        html: '<div class="user-location-pin"></div>'
    });

    // Make userMarker global
    userMarker = L.marker([0, 0], { icon: userIcon }).addTo(map);
    //userMarker = L.marker([0, 0]).addTo(map);

    const userCircle = L.circle([0, 0], {
        color: "#10B981",
        opacity: 0.4,
        fillColor: "#10B981",
        fillOpacity: 0.05,
        weight: 1
    }).addTo(map);

    // Create debounced version to limit proximity calculations
    const debouncedProximityPulse = debounce(updateProximityPulse, 500);

    map.on('locationfound', (e) => {
        userMarker.setLatLng(e.latlng);
        userCircle.setLatLng(e.latlng).setRadius(Math.min(e.accuracy / 2, 100));

        // --- ADDED: Proximity Feature Logic ---
        if (allSiteData.length > 0) {
            debouncedProximityPulse(e.latlng);
        }
    });

    // GPS State
    let gpsRetryCount = 0;
    let gpsFailed = false;

    map.on('locationerror', (e) => {
        if (DEBUG) console.error("GPS Error:", e);

        // Logic check for max retries on timeout
        if (e.code === 3) { // TIMEOUT
            gpsRetryCount++;
            if (gpsRetryCount >= 2) {
                console.warn("GPS Timed Out twice. Stopping location services.");
                gpsFailed = true;
                map.stopLocate(); // Stop trying
                return; // Silent exit
            }
        }

        let errorMessage = "GPS Error: ";
        switch (e.code) {
            case 1: // PERMISSION_DENIED
                errorMessage += "Permission Denied.\n\nPLEASE FIX: Go to your Device Settings > Privacy / Location Services > Allow Location for your browser.\n\nRefresh the page after changing this setting.";
                break;
            case 2: // POSITION_UNAVAILABLE
                errorMessage += "Position Unavailable.\n\nPlease move directly under the open sky. GPS signals are weak indoors.";
                break;
            case 3: // TIMEOUT
                errorMessage += "Request Timed Out.\n\nStandard GPS failed. We will try a lower accuracy method now...";
                // Fallback attempt with lower accuracy
                errorMessage += "Request Timed Out.\n\nStandard GPS failed. We will try a lower accuracy method now...";
                // Fallback attempt with lower accuracy
                console.warn(errorMessage); // Suppressed alert as per user request
                map.locate({ watch: true, enableHighAccuracy: false, maximumAge: 10000 });
                return; // Exit here to avoid double alert
            default:
                errorMessage += e.message + "\n\nEnsure Location Services are ON and you are using HTTPS.";
        }

        console.warn(errorMessage); // Suppressed alert as per user request
    });

    // Modified to include timeout and maximumAge to prevent infinite hanging
    map.locate({
        watch: true,
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 10000
    });

    // --- MAP FILTER STATE --- (Managed by activeFilterMode global)

    // ... (existing code) ...

    // 4. Set initial layer visibility based on starting zoom
    updateVisibility();

    // 5. Initialize Map Filter Tab Logic
    const tabMustVisit = document.getElementById('tabMustVisit');
    const tabRecommended = document.getElementById('tabRecommended');

    function updateTabStyles() {
        if (!tabMustVisit || !tabRecommended) return;

        if (activeFilterMode === 'must_visit') {
            // Must Visit Active
            tabMustVisit.className = "w-full md:w-48 h-12 flex items-center justify-center rounded-xl text-sm font-bold text-white bg-indigo-600 shadow-md transition-all transform scale-105 border-indigo-700";
            tabRecommended.className = "w-full md:w-48 h-12 flex items-center justify-center rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-all border border-transparent";
        } else {
            // Recommended Active
            tabMustVisit.className = "w-full md:w-48 h-12 flex items-center justify-center rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-all border border-transparent";
            tabRecommended.className = "w-full md:w-48 h-12 flex items-center justify-center rounded-xl text-sm font-bold text-white bg-indigo-600 shadow-md transition-all transform scale-105 border-indigo-700";
        }
    }

    if (tabMustVisit && tabRecommended) {
        tabMustVisit.addEventListener('click', () => {
            activeFilterMode = 'must_visit';
            updateTabStyles();
            updateVisibility();
        });

        tabRecommended.addEventListener('click', () => {
            activeFilterMode = 'recommended';
            updateTabStyles();
            updateVisibility();
        });

        // Init styles
        updateTabStyles();
    }


    if (!sessionStorage.getItem('jejak_welcome_shown')) {
        document.getElementById('welcomeModal').classList.remove('hidden');
        sessionStorage.setItem('jejak_welcome_shown', 'true');
    }
}

// --- GAME LOGIC FUNCTIONS ---

// ADDED: Proximity Pulse Function
// ADDED: Proximity Pulse Function with Performance Optimization
let currentPulseClass = ''; // Track current state

function updateProximityPulse(userLatLng) {
    if (!userMarker || !userMarker._icon) return;

    let closestDist = Infinity;

    // Check all main sites (using cached array if available)
    const sitesToCheck = (typeof mainSites !== 'undefined' && mainSites.length > 0) ? mainSites : allSiteData;

    // Filter out visited ones for the pulse (we want to guide them to NEW things)
    const activeSites = sitesToCheck.filter(site =>
        !visitedSites.includes(site.id) && !discoveredSites.includes(site.id)
    );

    activeSites.forEach(site => {
        let latlng = null;
        if (Array.isArray(site.coordinates)) {
            latlng = site.coordinates;
        } else if (site.coordinates && site.coordinates.marker) {
            latlng = site.coordinates.marker;
        }

        if (latlng) {
            const dist = userLatLng.distanceTo(latlng);
            if (dist < closestDist) closestDist = dist;
        }
    });

    // Determine target class
    let newClass = 'pulse-slow';
    if (closestDist < 75) newClass = 'pulse-fast';
    else if (closestDist < 250) newClass = 'pulse-medium';

    // OPTIMIZATION: Only touch DOM if class is different
    if (currentPulseClass !== newClass) {
        // Support both direct icon and inner wrapper depending on icon type
        const pinElement = userMarker._icon.querySelector('.user-location-pin') || userMarker._icon;

        // Remove old classes
        pinElement.classList.remove('pulse-fast', 'pulse-medium', 'pulse-slow');

        // Add new class
        pinElement.classList.add(newClass);

        currentPulseClass = newClass;
    }
}

// ADDED: Get Day of Year Function
function getDayOfYear() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
}

// ADDED: Update Daily Challenge Modal Function
function updateChallengeModal() {
    const dayOfYear = getDayOfYear();
    const riddleIndex = dayOfYear % allRiddles.length;
    const todayRiddle = allRiddles[riddleIndex];

    challengeRiddle.textContent = `"${todayRiddle.q}"`;

    if (solvedRiddle.day === dayOfYear && solvedRiddle.id === todayRiddle.a) {
        challengeResult.textContent = STRINGS.game.challengeSolved;
    } else {
        challengeResult.textContent = STRINGS.game.challengeHint;
    }
}

function handleMarkerClick(site, marker) {
    if (!siteModal) {
        console.error("Site modal is not initialized!");
        return;
    }

    // Ensure preview card is closed if it was open
    closePreviewCard();

    currentModalSite = site;
    currentModalMarker = marker; // Store the marker reference

    // --- STAGGERED ENTRANCE RESET ---
    const elementsToStagger = [
        siteModalTitle,
        siteModalInfo,
        document.getElementById('siteModalMore'),
        document.getElementById('siteModalCheckInBtn'),
        document.getElementById('siteModalSolveChallengeBtn'),
        document.querySelector('#siteModal .flex.gap-2'), // Directions/AskAI row
        document.querySelectorAll('#siteModal .flex.gap-2')[1] // Food/Hotel row
    ];

    elementsToStagger.forEach((el, index) => {
        if (!el) return;
        // If it's a NodeList (from querySelectorAll), handle each
        if (el instanceof NodeList) {
            el.forEach(subEl => {
                subEl.classList.remove('animate-staggered');
                subEl.style.opacity = '0';
                void subEl.offsetWidth; // trigger reflow
                subEl.classList.add('animate-staggered');
                subEl.style.animationDelay = `${0.1 + (index * 0.1)}s`;
            });
        } else {
            el.classList.remove('animate-staggered');
            el.style.opacity = '0';
            void el.offsetWidth; // trigger reflow
            el.classList.add('animate-staggered');
            el.style.animationDelay = `${0.1 + (index * 0.1)}s`;
        }
    });

    // 1. Basic Site Info
    siteModalLabel.textContent = site.id ? `${site.id}.` : "";
    siteModalTitle.textContent = site.name;
    siteModalInfo.textContent = site.info;
    siteModalImage.src = site.image || 'https://placehold.co/600x400/eee/ccc?text=Site+Image';

    // 2. MORE INFO SECTION (Replaced AI-Context with Flyer-Text, kept original font)
    if (!siteModalMore || !siteModalMoreBtn || !siteModalMoreContent) {
        siteModalMore = document.getElementById('siteModalMore');
        siteModalMoreBtn = document.getElementById('siteModalMoreBtn');
        siteModalMoreContent = document.getElementById('siteModalMoreContent');
    }

    if (siteModalMore && siteModalMoreBtn && siteModalMoreContent) {
        // --- Flyer Image (B&W PNG) ---
        const bwImageHtml = (site.flyer_image && site.flyer_image.trim() !== "")
            ? `<img src="${site.flyer_image}" class="w-full h-auto rounded-lg mb-4 shadow-md border border-gray-200" alt="Historical view">`
            : "";

        // --- Flyer Text (Replacing AI Context - Kept original text styling) ---
        const flyerTextHtml = site.flyer_text
            ? `<p class="text-gray-700 mb-4">${site.flyer_text}</p>`
            : "";

        // --- Visitor FAQ ---
        let faqHtml = "";
        if (site.faq) {
            faqHtml = `
                <div class="mt-4 pt-4 border-t border-gray-200">
                    <h4 class="font-bold text-gray-900 text-sm">📍 Visitor Quick Facts</h4>
                    <ul class="text-sm text-gray-700">
                        <li><strong>🕒 Hours:</strong> ${site.faq.opening_hours || 'Exterior view 24/7'}</li>
                        <li><strong>🎟️ Fee:</strong> ${site.faq.ticket_fee || 'Free Admission'}</li>
                        <li><strong>💡 Tip:</strong> ${site.faq.tips || 'Great for photography!'}</li>
                    </ul>
                </div>
            `;
        }

        // --- Combine into the dropdown ---
        // Strictly using Flyer info only. ai_context is deleted here.
        siteModalMoreContent.innerHTML = `${bwImageHtml}${flyerTextHtml}${faqHtml}`;

        // Reset visibility for each new site opened
        siteModalMoreContent.classList.add('hidden');
        siteModalMoreBtn.textContent = 'More info';

        // Only show button if Flyer or FAQ data exists
        const hasExtraInfo = bwImageHtml || flyerTextHtml || faqHtml;
        siteModalMore.style.display = hasExtraInfo ? 'block' : 'none';

        siteModalMoreBtn.onclick = () => {
            const isHidden = siteModalMoreContent.classList.contains('hidden');
            if (isHidden) {
                siteModalMoreContent.classList.remove('hidden');
                siteModalMoreBtn.textContent = 'Hide info';
            } else {
                siteModalMoreContent.classList.add('hidden');
                siteModalMoreBtn.textContent = 'More info';
            }
        };
    }

    // 3. ACTIONS (Kept the AI button visible)
    siteModalDirections.style.display = 'block';
    siteModalAskAI.style.display = 'block';

    // 4. QUIZ & CHECK-IN LOGIC
    const isMainSite = site.quiz && !isNaN(parseInt(site.id));

    if (isMainSite) {
        siteModalQuizArea.style.display = 'block';
        siteModalCheckInBtn.style.display = 'none';

        siteModalQuizQ.textContent = site.quiz.q;
        siteModalQuizResult.classList.add('hidden');

        // Reset Hint
        siteModalHintText.textContent = site.quiz.hint || "Try again!";
        siteModalHintText.classList.add('hidden');

        // Clear Options
        siteModalQuizOptions.innerHTML = '';

        // Get and Shuffle Options
        let options = site.quiz.options ? [...site.quiz.options] : [site.quiz.a];
        options.sort(() => Math.random() - 0.5);

        // Create Buttons
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = "w-full bg-white text-gray-800 font-bold py-3 px-4 rounded-lg border-2 border-gray-200 hover:bg-blue-50 hover:border-blue-400 transition text-center shadow-sm";
            btn.textContent = opt;

            btn.onclick = () => {
                // Check Answer
                if (opt === site.quiz.a) {
                    // CORRECT
                    siteModalQuizResult.textContent = STRINGS.game.quizCorrect;
                    siteModalQuizResult.className = "text-sm mt-2 text-center font-bold text-green-600";
                    siteModalQuizResult.classList.remove('hidden');

                    // Highlight Correct Button
                    btn.classList.remove('bg-white', 'border-gray-200', 'hover:bg-blue-50', 'hover:border-blue-400');
                    btn.classList.add('bg-green-100', 'border-green-500', 'text-green-800');

                    // Disable all buttons
                    const allBtns = siteModalQuizOptions.querySelectorAll('button');
                    allBtns.forEach(b => b.disabled = true);

                    if (!visitedSites.includes(site.id)) {
                        visitedSites.push(site.id);
                        localStorage.setItem('jejak_visited', JSON.stringify(visitedSites));

                        const markerToUpdate = allMarkers[site.id];
                        safelyUpdateMarkerVisitedState(markerToUpdate, true);
                        safelyUpdatePolygonVisitedState(site.id, true);

                        updateGameProgress();
                        updatePassport();
                        chaChingSound.play();

                        if (visitedSites.length === TOTAL_SITES) {
                            congratsModal.classList.remove('hidden');
                            if (typeof confetti === 'function') {
                                const duration = 3 * 1000;
                                const end = Date.now() + duration;
                                (function frame() {
                                    confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 } });
                                    confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 } });
                                    if (Date.now() < end) requestAnimationFrame(frame);
                                }());
                            }
                        }
                    }

                } else {
                    // WRONG
                    siteModalQuizResult.textContent = STRINGS.game.quizWrong;
                    siteModalQuizResult.className = "text-sm mt-2 text-center font-bold text-red-600";
                    siteModalQuizResult.classList.remove('hidden');

                    // Shake/Red Effect
                    btn.classList.add('bg-red-50', 'border-red-300');
                    setTimeout(() => {
                        btn.classList.remove('bg-red-50', 'border-red-300');
                    }, 500);

                    // SHOW HINT
                    siteModalHintText.classList.remove('hidden');
                }
            };
            siteModalQuizOptions.appendChild(btn);
        });

    } else {
        siteModalQuizArea.style.display = 'none';
        siteModalCheckInBtn.style.display = 'block';

        if (discoveredSites.includes(site.id)) {
            siteModalCheckInBtn.disabled = true;
            siteModalCheckInBtn.textContent = 'Visited';
            siteModalCheckInBtn.classList.remove('bg-purple-700', 'hover:bg-purple-800', 'text-white');
            siteModalCheckInBtn.classList.add('bg-gray-300', 'text-gray-600', 'cursor-not-allowed');
        } else {
            siteModalCheckInBtn.disabled = false;
            siteModalCheckInBtn.textContent = 'Check In to this Site';
            siteModalCheckInBtn.classList.remove('bg-gray-300', 'text-gray-600', 'cursor-not-allowed', 'bg-gray-400');
            siteModalCheckInBtn.classList.add('bg-purple-700', 'hover:bg-purple-800', 'text-white');
        }
    }

    // 5. DAILY CHALLENGE LOGIC
    const todayRiddle = allRiddles[getDayOfYear() % allRiddles.length];
    if (solvedRiddle.day !== getDayOfYear() && currentModalSite.id === todayRiddle.a) {
        siteModalSolveChallengeBtn.style.display = 'block';
    } else {
        siteModalSolveChallengeBtn.style.display = 'none';
    }

    siteModal.classList.remove('hidden');
}

/**
 * NEW: Handles the "Check In" button click for discovery sites
 */
function handleCheckIn() {
    if (!currentModalSite || !currentModalMarker) return;

    // Add to discovered list if not already there
    if (!discoveredSites.includes(currentModalSite.id)) {
        discoveredSites.push(currentModalSite.id);
        localStorage.setItem('jejak_discovered', JSON.stringify(discoveredSites));

        // Update the marker icon to "visited" (red)
        // FIX: Look up marker from global map and use safe helper
        const markerToUpdate = allMarkers[currentModalSite.id]; // Look up the marker globally
        safelyUpdateMarkerVisitedState(markerToUpdate, true);
        // END FIX

        // NEW: Update polygon color
        safelyUpdatePolygonVisitedState(currentModalSite.id, true); // <--- ADD THIS LINE
        // END NEW

        // NEW: Play Sound Effect 2 for Sites A-K
        if (/^[A-K]$/.test(currentModalSite.id)) {
            const soundEffect2 = document.getElementById('soundEffect2');
            if (soundEffect2) {
                soundEffect2.currentTime = 0;
                soundEffect2.play().catch(e => console.log("Audio play failed:", e));
            }
        }

        // Update the button state
        siteModalCheckInBtn.disabled = true;
        siteModalCheckInBtn.textContent = STRINGS.game.visitedBtn;
        siteModalCheckInBtn.classList.add('bg-gray-300', 'text-gray-600', 'cursor-not-allowed');
        siteModalCheckInBtn.classList.remove('bg-purple-700', 'hover:bg-purple-800', 'text-white');
    }
}

async function handleSendMessage() {
    const userQuery = chatInput.value.trim();
    const limit = Number(MAX_MESSAGES_PER_SESSION); // Explicit cast

    // Strict check before sending
    if (!userQuery || userMessageCount >= limit) {
        if (userMessageCount >= limit) disableChatUI(true); // Ensure UI reflects state
        return;
    }

    chatInput.value = "";
    chatInput.disabled = true;
    chatSendBtn.disabled = true;

    addChatMessage('user', userQuery);
    // Modified: Use skeleton loader instead of "..."
    const thinkingEl = addChatMessage('ai', '<span class="skeleton-loading text-xs px-8 rounded">Loading...</span>');

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userQuery: userQuery,
                history: chatHistory.slice(-HISTORY_WINDOW_SIZE)
            })
        });

        if (!response.ok) {
            throw new Error('AI server error');
        }

        const data = await response.json();

        chatHistory.push({ role: 'user', parts: [{ text: userQuery }] });
        chatHistory.push({ role: 'model', parts: [{ text: data.reply }] });
        localStorage.setItem('jejak_chat_history', JSON.stringify(chatHistory));

        userMessageCount++;
        localStorage.setItem('jejak_message_count', userMessageCount.toString());
        updateChatUIWithCount();

        // Render Markdown for AI reply
        const contentEl = thinkingEl.querySelector('div:last-child');
        if (contentEl) {
            contentEl.innerHTML = (typeof marked !== 'undefined') ? marked.parse(data.reply) : data.reply;
        }
        thinkingEl.classList.add('chat-bubble'); // Ensure styling applies

    } catch (error) {
        console.error("Chat error:", error);
        const contentEl = thinkingEl.querySelector('div:last-child');
        if (contentEl) {
            contentEl.textContent = STRINGS.chat.error;
        }
        thinkingEl.classList.add('bg-red-100', 'text-red-900');
    }

    // Only re-enable if we haven't hit the limit
    if (userMessageCount < limit) {
        chatInput.disabled = false;
        chatSendBtn.disabled = false;
        chatInput.focus();
    } else {
        disableChatUI(true); // Explicitly disable if limit reached
    }
}

function addChatMessage(role, text) {
    const messageEl = document.createElement('div');
    const name = (role === 'user' || role === 'user') ? STRINGS.chat.userName : STRINGS.chat.aiName;
    const align = (role === 'user' || role === 'user') ? 'self-end' : 'self-start';
    const bg = (role === 'user' || role === 'user') ? 'bg-white' : 'bg-blue-100';
    const textCol = (role === 'user' || role === 'user') ? 'text-gray-900' : 'text-blue-900';

    // Parse markdown for AI messages (model role)
    const content = (role === 'model' && typeof marked !== 'undefined') ? marked.parse(text) : text;

    messageEl.className = `p-3 rounded-lg ${bg} ${textCol} max-w-xs shadow-sm ${align} chat-bubble`;
    messageEl.innerHTML = `<p class="font-bold text-sm mb-1">${name}</p><div>${content}</div>`;

    chatHistoryEl.appendChild(messageEl);
    chatHistoryEl.scrollTop = chatHistoryEl.scrollHeight;
    return messageEl;
}

/**
 * NEW: Loads chat history from localStorage and populates the UI
 */
function loadChatHistory() {
    if (!chatHistoryEl) return;
    chatHistoryEl.innerHTML = ""; // Clear loader if any
    chatHistory.forEach(msg => {
        const text = msg.parts ? msg.parts[0].text : msg.text;
        addChatMessage(msg.role, text);
    });
}

// --- UI UPDATE FUNCTIONS ---

function updateGameProgress() {
    const count = visitedSites.length;
    // Use cached mainSites
    const mainSitesTotal = mainSites.length || TOTAL_SITES;

    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');

    if (progressBar && progressText) {
        const percentage = (count / mainSitesTotal) * 100;
        progressBar.style.width = `${percentage}%`;
        progressText.textContent = STRINGS.game.progressShort(count, mainSitesTotal);
    }
}



function updateChatUIWithCount() {
    // Check for Admin Override
    const sessionData = JSON.parse(localStorage.getItem('jejak_session'));
    const isAdmin = sessionData && sessionData.valid && sessionData.role === 'admin';

    if (isAdmin) {
        chatLimitText.textContent = "⚡ UNLIMITED ADMIN ACCESS";
        chatLimitText.classList.add('text-yellow-600', 'font-black');
        disableChatUI(false);
        return; // Skip limit check
    }

    const remaining = MAX_MESSAGES_PER_SESSION - userMessageCount;
    chatLimitText.textContent = `You have ${remaining} messages remaining.`;

    if (remaining <= 0) {
        disableChatUI(true);
    }
}

function disableChatUI(flag) {
    if (!chatInput || !chatSendBtn) return;
    chatInput.disabled = flag;
    chatSendBtn.disabled = flag;
    if (flag) {
        chatLimitText.textContent = STRINGS.chat.limitReached;
        chatInput.placeholder = STRINGS.chat.limitReached;
    }
}

function updatePassport() {
    if (!passportInfo || !passportGrid || mainSites.length === 0) {
        return;
    }

    const visitedCount = visitedSites.length;

    passportInfo.textContent = STRINGS.game.progress(visitedCount, mainSites.length);
    passportGrid.innerHTML = "";

    mainSites.forEach(site => {
        const stamp = document.createElement('div');
        stamp.className = 'passport-stamp';

        const isVisited = visitedSites.includes(site.id);
        if (!isVisited) {
            stamp.classList.add('grayscale');
        } else {
            // ADDED: Stamp animation for visited sites
            stamp.querySelector('img')?.classList.add('stamp-animate'); // Optional: animate the image or the whole stamp
        }

        const img = document.createElement('img');
        img.src = site.image || 'https://placehold.co/100x100/eee/ccc?text=?';
        img.alt = site.name;

        const name = document.createElement('p');
        name.textContent = `${site.id}. ${site.name}`;

        stamp.appendChild(img);
        stamp.appendChild(name);
        passportGrid.appendChild(stamp);
    });
}


// --- APP STARTUP & LANDING PAGE LOGIC ---
document.addEventListener('DOMContentLoaded', () => {

    // Helper to check if user is authorized
    function isAuthorized() {
        const sessionData = JSON.parse(localStorage.getItem('jejak_session'));
        return sessionData && sessionData.valid;
    }

    // --- CHECK FOR URL PASSKEY (AUTO-FILL ONLY) ---
    async function checkForURLPasskey() {
        const urlParams = new URLSearchParams(window.location.search);
        const urlCode = urlParams.get('code');

        if (urlCode && !isAuthorized()) {
            console.log("Magic link detected, auto-filling passkey:", urlCode);

            // Clean URL immediately for professional look
            const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.replaceState({ path: cleanUrl }, '', cleanUrl);

            // Show Gatekeeper with auto-filled passkey (but don't auto-login)
            const gatekeeper = document.getElementById('gatekeeper');
            const passcodeInput = document.getElementById('passcodeInput');
            const landingPage = document.getElementById('landing-page');

            if (gatekeeper && landingPage) {
                landingPage.classList.add('hidden');
                gatekeeper.classList.remove('hidden');
                // Auto-fill the passkey input, but let user click unlock manually
                passcodeInput.value = urlCode;

                // SHOW PLATFORM WARNING BEFORE ALLOWING LOGIN
                showPlatformWarning();
            }
        }
    }

    // --- PWA DETECTION ---
    function isPWAMode() {
        // Check if running in standalone mode (PWA)
        return window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone || // iOS Safari standalone
            document.referrer.includes('android-app://'); // Android TWA
    }

    // --- PLATFORM WARNING MODAL ---
    function showPlatformWarning() {
        const modal = document.getElementById('platformWarningModal');
        const warningContent = document.querySelector('#warningContent p');
        const continueBtn = document.getElementById('continueLoginBtn');
        const cancelBtn = document.getElementById('cancelLoginBtn');
        const unlockBtn = document.getElementById('unlockBtn');
        const passkeyDisplay = document.getElementById('passkeyDisplay');
        const copyBtn = document.getElementById('copyPasskeyBtn');
        const copySuccess = document.getElementById('copySuccess');

        // Get the passkey value from the input field
        const passkey = document.getElementById('passcodeInput').value;

        // Display the passkey in the modal
        if (passkeyDisplay) {
            passkeyDisplay.value = passkey;
        }

        // Determine platform and set appropriate warning
        const isPWA = isPWAMode();

        if (isPWA) {
            // User is on PWA
            warningContent.innerHTML = `
                <strong>📱 You're using the PWA (App Mode)</strong><br><br>
                Once you log in here, this passkey will be locked to the <strong>PWA only</strong>. 
                You won't be able to use it in a regular browser on this device.<br><br>
                If you prefer to use a browser instead, please close this app and open the link in your browser.
            `;
        } else {
            // User is on Browser
            warningContent.innerHTML = `
                <strong>🌐 You're using a Browser</strong><br><br>
                Once you log in here, this passkey will be locked to <strong>browser mode only</strong>. 
                You won't be able to use it in the PWA (installed app) on this device.<br><br>
                If you'd like the best experience with better GPS and offline features, we recommend installing the PWA first.
            `;
        }

        // Show modal
        modal.classList.remove('hidden');

        // Disable unlock button until user confirms
        unlockBtn.disabled = true;
        unlockBtn.classList.add('opacity-50', 'cursor-not-allowed');

        // Copy button functionality
        if (copyBtn) {
            copyBtn.onclick = async () => {
                try {
                    await navigator.clipboard.writeText(passkey);
                    // Show success message
                    if (copySuccess) {
                        copySuccess.classList.remove('hidden');
                        copyBtn.innerHTML = '<span>✓</span><span>Copied!</span>';
                        setTimeout(() => {
                            copySuccess.classList.add('hidden');
                            copyBtn.innerHTML = '<span>📋</span><span>Copy</span>';
                        }, 2000);
                    }
                } catch (err) {
                    console.error('Failed to copy:', err);
                    // Fallback for older browsers
                    passkeyDisplay.select();
                    document.execCommand('copy');
                }
            };
        }

        // Continue button - proceeds with login
        continueBtn.onclick = async () => {
            modal.classList.add('hidden');
            await proceedWithLogin();
        };

        // Cancel button - clears input and hides warning
        cancelBtn.onclick = () => {
            modal.classList.add('hidden');
            document.getElementById('passcodeInput').value = '';
            unlockBtn.disabled = false;
            unlockBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        };

        // "What is PWA?" button - shows explanation modal
        const whatIsPWABtn = document.getElementById('whatIsPWABtn');
        if (whatIsPWABtn) {
            whatIsPWABtn.onclick = () => {
                showPWAExplanation();
            };
        }
    }

    // --- PWA EXPLANATION MODAL ---
    function showPWAExplanation() {
        const explanationModal = document.getElementById('pwaExplanationModal');
        const closeBtn = document.getElementById('closePWAExplanation');
        const gotItBtn = document.getElementById('gotItPWABtn');

        // Show the explanation modal
        explanationModal.classList.remove('hidden');

        // Close button handler
        if (closeBtn) {
            closeBtn.onclick = () => {
                explanationModal.classList.add('hidden');
            };
        }

        // Got It button handler - close and return to platform warning
        if (gotItBtn) {
            gotItBtn.onclick = () => {
                explanationModal.classList.add('hidden');
            };
        }
    }

    async function initApp() {
        // Run auto-login check
        await checkForURLPasskey();

        const sessionData = JSON.parse(localStorage.getItem('jejak_session'));

        if (sessionData && sessionData.valid) {
            const gatekeeper = document.getElementById('gatekeeper');
            const landingPage = document.getElementById('landing-page');
            const staffScreen = document.getElementById('staff-screen');

            // --- ADMIN PERSISTENCE ---
            if (sessionData.role === 'admin') {
                if (landingPage) landingPage.remove();
                if (gatekeeper) gatekeeper.remove();

                // Show Staff Screen Tools directly
                if (staffScreen) {
                    staffScreen.classList.remove('hidden');
                    document.getElementById('adminLoginForm').classList.add('hidden');
                    document.getElementById('adminResult').classList.remove('hidden');

                    // We need to trigger the setup logic to attach listeners to the Result UI
                    setupAdminLoginLogic();
                    // Note: setupAdminLoginLogic needs to be "re-entrant" or handle the result state
                }
                return; // Stop here, don't show map yet
            }

            // --- USER PERSISTENCE ---
            // const sessionData = JSON.parse(localStorage.getItem('jejak_session')); // No longer needed directly here

            // --- DAILY RATE LIMIT RESET ---
            const todayStr = new Date().toDateString();
            const lastActiveDay = localStorage.getItem('jejak_last_active_day');

            if (lastActiveDay !== todayStr) {
                console.log("New day detected. Resetting chat limit.");
                userMessageCount = 0;
                localStorage.setItem('jejak_message_count', '0');
                localStorage.setItem('jejak_last_active_day', todayStr);
            }
            // -----------------------------

            // Session is VALID: Go straight to map
            if (landingPage) landingPage.remove();
            if (gatekeeper) gatekeeper.remove();
            document.getElementById('progress-container').classList.remove('hidden');

            initializeGameAndMap();
            setupGameUIListeners();

            if (chatLimitText) {
                if (userMessageCount >= MAX_MESSAGES_PER_SESSION) {
                    disableChatUI(true);
                } else {
                    updateChatUIWithCount();
                }
            }
        } else {
            // Session is INVALID or EXPIRED: Show landing page
            localStorage.removeItem('jejak_message_count');
            userMessageCount = 0;
            localStorage.removeItem('jejak_session');
            setupLandingPage(); // <-- This is the crucial call
        }
    }

    // --- THIS FUNCTION ATTACHES LISTENERS TO THE LANDING PAGE ---
    function setupLandingPage() {
        const btnInstallApp = document.getElementById('btnInstallApp');
        if (btnInstallApp) {
            btnInstallApp.addEventListener('click', () => {
                showPWAPrompt();
            });
        }

        document.getElementById('btnVisitor').addEventListener('click', () => {
            animateScreenSwitch(
                document.getElementById('landing-page'),
                document.getElementById('gatekeeper')
            );
        });

        document.getElementById('btnStaff').addEventListener('click', () => {
            showAdminCode();
        });

        document.getElementById('backToHome').addEventListener('click', () => {
            animateScreenSwitch(
                document.getElementById('gatekeeper'),
                document.getElementById('landing-page')
            );
        });

        const closeStaffBtn = document.getElementById('closeStaffScreen');
        if (closeStaffBtn) {
            closeStaffBtn.addEventListener('click', () => {
                animateScreenSwitch(
                    document.getElementById('staff-screen'),
                    document.getElementById('landing-page')
                );
            });
        }

        setupGatekeeperLogic();
        setupAdminLoginLogic();
    }


    // --- LOGIN & MODAL FUNCTIONS ---

    function showAdminCode() {
        animateScreenSwitch(
            document.getElementById('landing-page'),
            document.getElementById('staff-screen')
        );
    }



    function setupAdminLoginLogic() {
        const adminLoginBtn = document.getElementById('adminLoginBtn');
        if (!adminLoginBtn) return;

        // NEW: If already logged in, just show tools
        const sessionData = JSON.parse(localStorage.getItem('jejak_session'));
        if (sessionData && sessionData.valid && sessionData.role === 'admin') {
            showAdminTools();
        }

        // NEW: Allow Enter key to submit (Moved outside click handler)
        const passwordInput = document.getElementById('adminPasswordInput');
        if (passwordInput) {
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    adminLoginBtn.click();
                }
            });
        }

        // NEW: Admin Chat Button Listener
        const btnAdminChat = document.getElementById('btnAdminChat');
        if (btnAdminChat) {
            btnAdminChat.addEventListener('click', () => {
                // Ensure chat elements are initialized (in case game hasn't started)
                if (!chatModal) {
                    chatModal = document.getElementById('chatModal');
                    chatInput = document.getElementById('chatInput');
                    chatSendBtn = document.getElementById('chatSendBtn');
                    chatLimitText = document.getElementById('chatLimitText');
                    chatHistoryEl = document.getElementById('chatHistory');
                }

                // Re-use existing chat modal logic
                if (chatModal) {
                    animateOpenModal(chatModal);
                    openModalState('chatModal');
                    loadChatHistory();
                    updateChatUIWithCount(); // Will correctly show "UNLIMITED" if logged in
                    // Focus input
                    setTimeout(() => {
                        if (chatInput) chatInput.focus();
                    }, 300);
                }
            });
        }

        adminLoginBtn.addEventListener('click', async () => {
            const password = passwordInput ? passwordInput.value : ''; // Use existing ref or get value
            const errorMsg = document.getElementById('adminErrorMsg');
            // loginBtn is adminLoginBtn
            const loginBtn = adminLoginBtn;

            const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwxYifp10iZ4FtTAuAnv0R3wCo08m07c5plIcGof9WaHbeuyk_MySDig5JrmNAUBCgptw/exec";

            loginBtn.disabled = true;
            loginBtn.textContent = STRINGS.auth.verifying;
            errorMsg.classList.add('hidden');

            try {
                const response = await fetch(GOOGLE_SCRIPT_URL, {
                    method: 'POST',
                    mode: 'cors',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify({
                        passkey: password,
                        deviceId: 'ADMIN_DEVICE'
                    })
                });

                const result = await response.json();

                if (result.success && result.isAdmin) {
                    // Store admin session with password for persistent access
                    localStorage.setItem('jejak_session', JSON.stringify({
                        valid: true,
                        role: 'admin',
                        adminPassword: password  // Store password for API calls after reload
                    }));
                    showAdminTools();
                } else {
                    errorMsg.textContent = result.error || STRINGS.auth.invalidAdmin;
                    errorMsg.classList.remove('hidden');
                }
            } catch (error) {
                console.error('Error in admin login:', error);
                errorMsg.textContent = STRINGS.auth.networkError;
                errorMsg.classList.remove('hidden');
            } finally {
                loginBtn.disabled = false;
                loginBtn.textContent = STRINGS.auth.login;
            }
        });
    }

    // --- REUSABLE ADMIN TOOL HANDLER ---
    function showAdminTools() {
        document.getElementById('adminLoginForm').classList.add('hidden');
        document.getElementById('adminResult').classList.remove('hidden');
        document.getElementById('passkeyDate').textContent = STRINGS.auth.adminDate;

        // NEW: Hide the redundant "Back" button once logged in
        const closeStaffBtn = document.getElementById('closeStaffScreen');
        if (closeStaffBtn) closeStaffBtn.classList.add('hidden');

        // Show the admin toggle on the map
        const btnAdminToggle = document.getElementById('btnAdminToggle');
        if (btnAdminToggle) btnAdminToggle.classList.remove('hidden');

        const generateBtn = document.getElementById('adminGenerateBtn');
        const shareBtn = document.getElementById('adminShareBtn');
        const statusMsg = document.getElementById('adminStatusMsg');
        const resultText = document.getElementById('passkeyResult');
        const logoutBtn = document.getElementById('adminLogoutBtn');
        const switchToMapBtn = document.getElementById('adminSwitchToMapBtn');

        let lastGeneratedCode = "";
        const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwxYifp10iZ4FtTAuAnv0R3wCo08m07c5plIcGof9WaHbeuyk_MySDig5JrmNAUBCgptw/exec";

        generateBtn.onclick = async () => {
            // Retrieve admin password from session (works after reload)
            const sessionData = JSON.parse(localStorage.getItem('jejak_session'));
            const password = sessionData?.adminPassword || document.getElementById('adminPasswordInput').value || "";

            if (!password) {
                alert('Session expired. Please log in again.');
                return;
            }

            generateBtn.disabled = true;
            generateBtn.textContent = "Generating...";
            statusMsg.classList.add('hidden');

            try {
                const genResponse = await fetch(GOOGLE_SCRIPT_URL, {
                    method: 'POST',
                    mode: 'cors',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify({
                        action: 'generate',
                        passkey: password,
                        deviceId: 'ADMIN_DEVICE'
                    })
                });

                const genResult = await genResponse.json();
                if (genResult.success) {
                    lastGeneratedCode = genResult.code;
                    resultText.textContent = genResult.code;
                    statusMsg.textContent = STRINGS.auth.adminGenSuccess;
                    statusMsg.classList.remove('hidden');
                    shareBtn.classList.remove('hidden');
                } else {
                    alert("Failed: " + (genResult.error || "Check password"));
                }
            } catch (err) {
                console.error("Gen error:", err);
            } finally {
                generateBtn.disabled = false;
                generateBtn.textContent = STRINGS.auth.adminGenerateBtn;
            }
        };

        shareBtn.onclick = () => {
            if (!lastGeneratedCode) return;
            const shareUrl = `${window.location.origin}${window.location.pathname}?code=${lastGeneratedCode}`;
            const subject = encodeURIComponent(STRINGS.auth.emailSubject);
            const body = encodeURIComponent(STRINGS.auth.emailBody.replace('[CODE]', lastGeneratedCode).replace('[LINK]', shareUrl));
            window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
        };

        logoutBtn.onclick = () => {
            localStorage.removeItem('jejak_session');
            window.location.reload();
        };

        switchToMapBtn.onclick = () => {
            // FIX: Explicitly remove landing and gatekeeper once logged in as admin
            const landing = document.getElementById('landing-page');
            const gatekeeper = document.getElementById('gatekeeper');
            if (landing) landing.remove();
            if (gatekeeper) gatekeeper.remove();

            document.getElementById('staff-screen').classList.add('hidden');
            document.getElementById('progress-container').classList.remove('hidden');
            if (!map) {
                initializeGameAndMap();
                setupGameUIListeners();
            }
            const adminToggle = document.getElementById('btnAdminToggle');
            if (adminToggle) {
                adminToggle.classList.remove('hidden');
                adminToggle.onclick = () => {
                    document.getElementById('staff-screen').classList.remove('hidden');
                };
            }
        };
    }

    function setupGatekeeperLogic() {
        const unlockBtn = document.getElementById('unlockBtn');
        if (!unlockBtn) return;

        unlockBtn.addEventListener('click', async () => {
            const passcodeInput = document.getElementById('passcodeInput');
            const enteredCode = passcodeInput.value.trim();
            if (!enteredCode) return;

            // Show platform warning for manual login too (not just magic links)
            showPlatformWarning();
        });
    }

    async function proceedWithLogin() {
        const passcodeInput = document.getElementById('passcodeInput');
        const unlockBtn = document.getElementById('unlockBtn');
        const enteredCode = passcodeInput.value.trim();

        if (!enteredCode) return;

        unlockBtn.disabled = true;
        unlockBtn.textContent = STRINGS.auth.verifying;

        await verifyCode(enteredCode);

        // If verification failed, reset the button
        if (!localStorage.getItem('jejak_session')) {
            unlockBtn.disabled = false;
            unlockBtn.textContent = STRINGS.auth.verifyUnlock;
        }
    }

    async function verifyCode(enteredCode) {
        const errorMsg = document.getElementById('errorMsg');
        errorMsg.classList.add('hidden');

        // !!! REPLACE THIS WITH YOUR DEPLOYED WEB APP URL !!!
        const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwxYifp10iZ4FtTAuAnv0R3wCo08m07c5plIcGof9WaHbeuyk_MySDig5JrmNAUBCgptw/exec";

        try {
            // We use text/plain to bypass CORS "preflight" checks in Google Apps Script
            const response = await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'cors',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({
                    passkey: enteredCode,
                    deviceId: deviceId
                })
            });

            const result = await response.json();

            if (result.success) {
                // Save session
                localStorage.setItem('jejak_session', JSON.stringify({
                    valid: true,
                    // start: Date.now(), // REMOVED for permanent session
                    role: result.isAdmin ? 'admin' : 'user'
                }));

                // UI Transitions
                document.getElementById('gatekeeper').style.opacity = 0;
                document.getElementById('landing-page').style.opacity = 0;

                setTimeout(() => {
                    document.getElementById('gatekeeper').remove();
                    document.getElementById('landing-page').remove();
                    document.getElementById('progress-container').classList.remove('hidden');

                    // Start the app
                    initializeGameAndMap();
                    setupGameUIListeners();
                }, 500);

            } else {
                errorMsg.textContent = result.error || STRINGS.auth.invalidPasskey;
                errorMsg.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Verification Error:', error);
            errorMsg.textContent = STRINGS.auth.networkError;
            errorMsg.classList.remove('hidden');
        }
    }

    /**
     * Finds all DOM elements and attaches all in-game listeners.
     */
    function setupGameUIListeners() {
        // --- NEW: LOGO CLICK LISTENER ---
        const logoElement = document.getElementById('logoOverlay');
        if (logoElement) {
            logoElement.addEventListener('click', () => {
                // Open the Badan Warisan Malaysia website in a new tab
                window.open('https://badanwarisanmalaysia.org/', '_blank');
            });
            // Optional: Change cursor to indicate clickability
            logoElement.style.cursor = 'pointer';
        }

        // --- Find all elements first ---
        siteModal = document.getElementById('siteModal');
        siteModalImage = document.getElementById('siteModalImage');
        siteModalLabel = document.getElementById('siteModalLabel');
        siteModalTitle = document.getElementById('siteModalTitle');
        siteModalInfo = document.getElementById('siteModalInfo');
        siteModalQuizArea = document.getElementById('siteModalQuizArea');
        siteModalQuizQ = document.getElementById('siteModalQuizQ');
        siteModalQuizOptions = document.getElementById('siteModalQuizOptions');
        // siteModalQuizInput = document.getElementById('siteModalQuizInput'); // REMOVED
        // siteModalQuizBtn = document.getElementById('siteModalQuizBtn'); // REMOVED
        siteModalQuizResult = document.getElementById('siteModalQuizResult');
        closeSiteModal = document.getElementById('closeSiteModal');
        siteModalAskAI = document.getElementById('siteModalAskAI');
        siteModalDirections = document.getElementById('siteModalDirections');
        siteModalCheckInBtn = document.getElementById('siteModalCheckInBtn');
        siteModalSolveChallengeBtn = document.getElementById('siteModalSolveChallengeBtn'); // ADDED
        siteModalHintBtn = document.getElementById('siteModalHintBtn');
        siteModalHintText = document.getElementById('siteModalHintText');
        siteModalFoodBtn = document.getElementById('siteModalFoodBtn'); // NEW
        siteModalHotelBtn = document.getElementById('siteModalHotelBtn'); // NEW

        chatModal = document.getElementById('chatModal');
        closeChatModal = document.getElementById('closeChatModal');
        chatHistoryEl = document.getElementById('chatHistory');
        chatInput = document.getElementById('chatInput');
        chatSendBtn = document.getElementById('chatSendBtn');
        chatLimitText = document.getElementById('chatLimitText');

        passportModal = document.getElementById('passportModal');
        closePassportModal = document.getElementById('closePassportModal');
        passportInfo = document.getElementById('passportInfo');
        passportGrid = document.getElementById('passportGrid');

        welcomeModal = document.getElementById('welcomeModal');
        closeWelcomeModal = document.getElementById('closeWelcomeModal');

        // --- AUDIO UNLOCK LOGIC ---
        // Mobile browsers fix: Unlock audio context on first interaction
        const unlockAudio = () => {
            if (typeof chaChingSound !== 'undefined') {
                chaChingSound.volume = 0;
                chaChingSound.play().then(() => {
                    chaChingSound.pause();
                    chaChingSound.currentTime = 0;
                    chaChingSound.volume = 1; // Restore volume
                }).catch(() => { }); // Ignore errors

                // Remove listeners once unlocked
                document.removeEventListener('click', unlockAudio);
                document.removeEventListener('touchstart', unlockAudio);
                document.removeEventListener('keydown', unlockAudio);
            }
        };

        document.addEventListener('click', unlockAudio);
        document.addEventListener('touchstart', unlockAudio);
        document.addEventListener('keydown', unlockAudio);

        // ADDED: New Modal Elements
        congratsModal = document.getElementById('congratsModal');
        closeCongratsModal = document.getElementById('closeCongratsModal');
        shareWhatsAppBtn = document.getElementById('shareWhatsAppBtn');
        challengeModal = document.getElementById('challengeModal');
        closeChallengeModal = document.getElementById('closeChallengeModal');
        btnChallenge = document.getElementById('btnChallenge');
        challengeRiddle = document.getElementById('challengeRiddle');
        challengeResult = document.getElementById('challengeResult');
        chaChingSound = document.getElementById('chaChingSound');

        // --- Attach Listeners ---

        document.getElementById('btnRecenter').addEventListener('click', () => {
            if (!map) return;
            // Revert back to focusing on map center (Dataran Merdeka)
            import('./config.js').then(config => {
                map.setView(config.DEFAULT_CENTER, config.ZOOM);
            });
        });

        // --- NEW: Preview Card "Read Full History" Listener ---
        const pOB = document.getElementById('previewOpenBtn');
        if (pOB) {
            pOB.addEventListener('click', () => {
                const sid = document.getElementById('previewCard')?.dataset?.siteId;
                if (sid) { // Find site by string ID (to support '1' vs 1)
                    const site = allSiteData.find(s => s.id == sid);
                    if (site) handleMarkerClick(site, null);
                }
            });
        }

        // Back button handler is already defined below

        // --- BACK BUTTON HANDLER ---
        window.addEventListener('popstate', (event) => {
            // Close all known modals with animation
            [siteModal, chatModal, passportModal, welcomeModal, congratsModal, challengeModal, document.getElementById('badgeInputModal')].forEach(m => {
                if (m && !m.classList.contains('hidden')) animateCloseModal(m);
            });
            if (typeof closePreviewCard === 'function') closePreviewCard();
        });

        document.getElementById('btnChat').addEventListener('click', () => {
            animateOpenModal(chatModal);
            openModalState('chatModal');
        });

        // NEW: Admin Chat Button
        const btnAdminChat = document.getElementById('btnAdminChat');
        if (btnAdminChat) {
            btnAdminChat.addEventListener('click', () => {
                animateOpenModal(chatModal);
                openModalState('chatModal');
            });
        }

        closeChatModal.addEventListener('click', () => {
            animateCloseModal(chatModal);
        });

        document.getElementById('btnPassport').addEventListener('click', () => {
            updatePassport();
            animateOpenModal(passportModal);
            openModalState('passportModal');
        });
        closePassportModal.addEventListener('click', () => {
            animateCloseModal(passportModal);
        });

        closeSiteModal.addEventListener('click', () => {
            animateCloseModal(siteModal);
        });

        chatSendBtn.addEventListener('click', handleSendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSendMessage();
            }
        });

        siteModalAskAI.addEventListener('click', () => {
            const siteName = siteModalTitle.textContent;
            if (!siteName || siteName === "Site Title") return;

            const question = `Tell me more about ${siteName}.`;

            siteModal.classList.add('hidden'); // Close site modal immediately to prevent overlap transition
            animateOpenModal(chatModal);

            chatInput.value = question;
            handleSendMessage();
        });

        siteModalDirections.addEventListener('click', () => {
            if (!currentModalSite) return;
            openGoogleMaps(currentModalSite.coordinates.marker[0], currentModalSite.coordinates.marker[1], 'directions', currentModalSite.name);
        });

        // --- NEW LISTENER FOR "CHECK IN" BUTTON ---
        siteModalCheckInBtn.addEventListener('click', handleCheckIn);

        // --- NEW LISTENERS FOR FOOD & HOTEL ---
        // --- NEW LISTENERS FOR FOOD & HOTEL ---
        if (siteModalFoodBtn) {
            siteModalFoodBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (!currentModalSite) return;
                openGoogleMaps(currentModalSite.coordinates.marker[0], currentModalSite.coordinates.marker[1], 'restaurants', currentModalSite.name);
            });
        }

        if (siteModalHotelBtn) {
            siteModalHotelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (!currentModalSite) return;
                openGoogleMaps(currentModalSite.coordinates.marker[0], currentModalSite.coordinates.marker[1], 'hotels', currentModalSite.name);
            });
        }

        // --- GLOBAL UI ZOOM LOGIC ---
        const btnUIZoomIn = document.getElementById('btnUIZoomIn');
        const btnUIZoomOut = document.getElementById('btnUIZoomOut');
        let currentRootFontSize = 100; // Percentage

        if (btnUIZoomIn && btnUIZoomOut) {
            btnUIZoomIn.addEventListener('click', () => {
                if (currentRootFontSize < 130) { // Max 130%
                    currentRootFontSize += 10;
                    document.documentElement.style.fontSize = `${currentRootFontSize}%`;
                }
            });

            btnUIZoomOut.addEventListener('click', () => {
                if (currentRootFontSize > 80) { // Min 80%
                    currentRootFontSize -= 10;
                    document.documentElement.style.fontSize = `${currentRootFontSize}%`;
                }
            });
        }

        // --- NEW LISTENERS FOR NEW FEATURES ---
        if (closeWelcomeModal) {
            closeWelcomeModal.addEventListener('click', () => {
                animateCloseModal(welcomeModal);
            });
        }

        const sharePassportBtn = document.getElementById('sharePassportBtn');
        if (sharePassportBtn) {
            sharePassportBtn.addEventListener('click', () => {
                const count = visitedSites.length;
                const text = `I'm exploring Kuala Lumpur's Heritage Sites! I've visited ${count} so far on the BWM KUL City Walk. 🏛️✨`;
                const url = 'https://bwm-kul-city-walk.vercel.app/';

                if (navigator.share) {
                    navigator.share({
                        title: 'BWM KUL City Walk',
                        text: text,
                        url: url
                    }).catch(console.error);
                } else {
                    const message = `${text}\n\nJoin the adventure: ${url}`;
                    const whatsappMsg = encodeURIComponent(message);
                    window.open(`https://api.whatsapp.com/send?text=${whatsappMsg}`, '_blank');
                }
            });
        }

        closeCongratsModal.addEventListener('click', () => {
            animateCloseModal(congratsModal);
        });

        // --- DIRECTIONS VIEWER LISTENERS ---
        const directionsModal = document.getElementById('directionsModal');
        const directionsIframe = document.getElementById('directionsIframe');
        const closeDirectionsModal = document.getElementById('closeDirectionsModal');
        const closeDirectionsModalBtn = document.getElementById('closeDirectionsModalBtn');

        if (closeDirectionsModal) {
            closeDirectionsModal.addEventListener('click', () => {
                animateCloseModal(directionsModal);
                if (directionsIframe) directionsIframe.src = ""; // Clear source
            });
        }

        if (closeDirectionsModalBtn) {
            closeDirectionsModalBtn.addEventListener('click', () => {
                animateCloseModal(directionsModal);
                if (directionsIframe) directionsIframe.src = ""; // Clear source
            });
        }


        shareWhatsAppBtn.addEventListener('click', () => {
            const count = visitedSites.length;
            const total = (typeof mainSites !== 'undefined' && mainSites.length > 0) ? mainSites.length : 11;
            const text = (count >= total)
                ? "🎉 Mission Accomplished! I've collected all 11 heritage stamps on the BWM KUL City Walk! 🏛️✨"
                : `I'm exploring Kuala Lumpur's Heritage Sites! I've visited ${count}/${total} so far on the BWM KUL City Walk. 🏛️✨`;

            const url = 'https://bwm-kul-city-walk.vercel.app/';

            if (navigator.share) {
                navigator.share({
                    title: 'Mission Accomplished!',
                    text: text,
                    url: url
                }).catch(console.error);
            } else {
                const message = `${text}\n\nDiscover KL's history and start your own adventure here: ${url}`;
                const whatsappMsg = encodeURIComponent(message);
                window.open(`https://api.whatsapp.com/send?text=${whatsappMsg}`, '_blank');
            }
        });


        btnChallenge.addEventListener('click', () => {
            updateChallengeModal();
            animateOpenModal(challengeModal);
        });

        closeChallengeModal.addEventListener('click', () => {
            animateCloseModal(challengeModal);
        });

        siteModalSolveChallengeBtn.addEventListener('click', () => {
            const dayOfYear = getDayOfYear();
            const riddleIndex = dayOfYear % allRiddles.length;
            const todayRiddle = allRiddles[riddleIndex];

            // Mark as solved
            solvedRiddle = { day: dayOfYear, id: todayRiddle.a };
            localStorage.setItem('jejak_solved_riddle', JSON.stringify(solvedRiddle));

            // Hide button in site modal
            siteModalSolveChallengeBtn.style.display = 'none';
            siteModal.classList.add('hidden');

            // Show result in challenge modal
            updateChallengeModal();
            animateOpenModal(challengeModal);
            // BOMBASTIC: Trigger Small Confetti Burst!
            if (typeof confetti === 'function') {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }
        });

        // Load persisted chat history
        loadChatHistory();

        // --- NEW: ANIMATED CLOSING FOR BADGE MODAL ---
        const badgeInputModal = document.getElementById('badgeInputModal');
        const closeBadgeModal = document.getElementById('closeBadgeModal');
        if (closeBadgeModal) {
            closeBadgeModal.addEventListener('click', () => {
                animateCloseModal(badgeInputModal);
            });
        }
    }



    // --- Run the app ---
    initApp();
});

// --- ZOOM FUNCTIONALITY ---
// Globals for Preview Card (referenced by helpers)
let previewCard, previewImage, previewTitle, previewDist, previewOpenBtn, previewCloseBtn;
let currentPreviewSiteId = null;

document.addEventListener('DOMContentLoaded', () => {
    const btnTextSizeReset = document.getElementById('btnTextSizeReset');
    const btnTextSizeLarge = document.getElementById('btnTextSizeLarge');
    const contentText = document.getElementById('siteModalInfo');
    const moreContentText = document.getElementById('siteModalMoreContent');

    let currentTextSize = 100; // Percentage

    function updateTextSize() {
        // Updated: Use CSS Variable interaction
        document.documentElement.style.setProperty('--content-font-size', `${currentTextSize}%`);
    }

    if (btnTextSizeSmall) {
        btnTextSizeSmall.addEventListener('click', () => {
            if (currentTextSize > 80) {
                currentTextSize -= 10;
                updateTextSize();
            }
        });
    }

    if (btnTextSizeLarge) {
        btnTextSizeLarge.addEventListener('click', () => {
            if (currentTextSize < MAX_FONT_SIZE) { // Use constant
                currentTextSize += 10;
                updateTextSize();
            }
        });
    }

    if (btnTextSizeReset) {
        btnTextSizeReset.addEventListener('click', () => {
            currentTextSize = 100;
            updateTextSize();
        });
    }

    // --- PREVIEW CARD LOGIC ---
    previewCard = document.getElementById('previewCard');
    previewImage = document.getElementById('previewImage');
    previewTitle = document.getElementById('previewTitle');
    previewDist = document.getElementById('previewDist');
    previewOpenBtn = document.getElementById('previewOpenBtn');
    previewCloseBtn = document.getElementById('previewCloseBtn');
    // Ensure currentPreviewSiteId is global or scoped correctly (it is global)

    if (previewCloseBtn) {
        previewCloseBtn.addEventListener('click', closePreviewCard);
    }

    if (previewOpenBtn) {
        previewOpenBtn.addEventListener('click', () => {
            if (currentPreviewSiteId) {
                const site = allSiteData.find(s => s.id === currentPreviewSiteId);
                const marker = allMarkers[currentPreviewSiteId];
                if (site && marker) {
                    // Explicitly close preview first for smoother transition
                    closePreviewCard();

                    handleMarkerClick(site, marker);
                    // Explicitly show modal and push state
                    animateOpenModal(siteModal);
                    openModalState('siteModal');
                }
            }
        });
    }

    if (previewCard) {
        previewCard.addEventListener('click', (e) => {
            if (e.target.closest('#previewCloseBtn')) return;
            if (currentPreviewSiteId) previewOpenBtn.click();
        });
    }
}); // END DOMContentLoaded

// --- PREVIEW CARD HELPER FUNCTIONS ---
function showPreviewCard(site) {
    if (!previewCard) return;

    currentPreviewSiteId = site.id;

    // Set Content
    previewTitle.textContent = site.id + '. ' + site.name;

    // SKELETON LOADING FOR IMAGE
    previewImage.classList.add('skeleton-loading');
    previewImage.src = site.image || 'https://placehold.co/100x100/eee/ccc?text=Site';
    previewImage.onload = () => previewImage.classList.remove('skeleton-loading');

    previewDist.textContent = STRINGS.preview.tapForDetails; // Placeholder for distance if we had coords

    // Show Card
    previewCard.classList.remove('hidden', 'preview-card-closing');
    previewCard.classList.add('preview-card-opening');
}

function closePreviewCard() {
    if (!previewCard || previewCard.classList.contains('hidden')) return;

    previewCard.classList.remove('preview-card-opening');
    previewCard.classList.add('preview-card-closing');

    setTimeout(() => {
        previewCard.classList.add('hidden');
        previewCard.classList.remove('preview-card-closing');
    }, 400); // Wait for animation
}

// Override the global click handler behavior via a flag or modifying the loop?
// Better: We need to intercept where marker.on('click') is defined.
// Since that is deep in 'initializeGameAndMap', we might need to patch it.

// --- USER GUIDE MODAL LOGIC ---
// Setup listeners for pre-login help button AND map help button
const btnPreLoginHelp = document.getElementById('btnPreLoginHelp');
const btnMapHelp = document.getElementById('btnMapHelp'); // NEW
const userGuideModal = document.getElementById('userGuideModal');
const closeUserGuideModal = document.getElementById('closeUserGuideModal');
const closeUserGuideModalBtn = document.getElementById('closeUserGuideModalBtn');

if (btnPreLoginHelp && userGuideModal) {
    btnPreLoginHelp.addEventListener('click', () => {
        userGuideModal.classList.remove('hidden');
    });
}

// NEW: Listener for Map Help Button
if (btnMapHelp && userGuideModal) {
    btnMapHelp.addEventListener('click', () => {
        userGuideModal.classList.remove('hidden');
    });
}

if (closeUserGuideModal && userGuideModal) {
    closeUserGuideModal.addEventListener('click', () => {
        userGuideModal.classList.add('hidden');
    });
}

if (closeUserGuideModalBtn && userGuideModal) {
    closeUserGuideModalBtn.addEventListener('click', () => {
        userGuideModal.classList.add('hidden');
    });
}

// --- PWA INSTALL PROMPT LOGIC ---
// --- PWA INSTALL PROMPT LOGIC ---
// deferredPrompt is now captured in index.html to ensure we don't miss the event

// Detect if app is already installed
function isAppInstalled() {
    // Check if running in standalone mode (installed PWA)
    if (window.matchMedia('(display-mode: standalone)').matches) {
        return true;
    }
    // Check iOS standalone mode
    if (window.navigator.standalone === true) {
        return true;
    }
    return false;
}

// Detect device type
function getDeviceType() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;

    // iOS detection (including iPadOS 13+ which reports as MacIntel)
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        return 'ios';
    }
    // Check for iPadOS 13+ (MacIntel with Touch)
    if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) {
        return 'ios';
    }

    // Android detection
    if (/android/i.test(userAgent)) {
        return 'android';
    }

    // Desktop/other
    return 'desktop';
}

// Show PWA install prompt
function showPWAPrompt() {
    const pwaPrompt = document.getElementById('pwaInstallPrompt');
    const installBtn = document.getElementById('pwaInstallBtn');
    const iosInstructions = document.getElementById('iosInstructions');
    const genericInstructions = document.getElementById('genericInstructions');

    if (!pwaPrompt) return;

    const deviceType = getDeviceType();

    // Show appropriate UI based on device
    if (deviceType === 'ios') {
        // iOS: Show manual instructions (no programmatic install)
        iosInstructions.classList.remove('hidden');
        installBtn.classList.add('hidden');
        genericInstructions.classList.add('hidden');
    } else if (window.deferredPrompt) {
        // Android/Desktop (Chrome/Edge): Show install button if prompt is captured
        installBtn.classList.remove('hidden');
        iosInstructions.classList.add('hidden');
        genericInstructions.classList.add('hidden');
    } else {
        // Fallback for when prompt isn't captured (e.g. Firefox desktop or already installed but not detected)
        genericInstructions.classList.remove('hidden');
        installBtn.classList.add('hidden');
        iosInstructions.classList.add('hidden');
    }

    pwaPrompt.classList.remove('hidden');
}

// Setup PWA install prompt
function setupPWAInstallPrompt() {
    // Check if already installed
    if (isAppInstalled()) {
        console.log('PWA already installed');
        return;
    }

    // Check if user already dismissed the prompt
    const dismissedUntil = localStorage.getItem('pwa_prompt_dismissed');
    if (dismissedUntil && new Date().getTime() < parseInt(dismissedUntil)) {
        console.log('PWA prompt dismissed by user');
        return;
    }

    // Check if user is logged in
    const sessionData = JSON.parse(localStorage.getItem('jejak_session'));
    if (sessionData && sessionData.valid) {
        console.log('User already logged in, skip PWA prompt');
        return;
    }

    // Show prompt after 0.8 seconds delay (fast but not jarring)
    setTimeout(() => {
        showPWAPrompt();
    }, 800);
}

// Capture the beforeinstallprompt event (Android/Chrome)
// Removed redundant beforeinstallprompt listener (moved to index.html)

// Setup event listeners
const pwaInstallBtn = document.getElementById('pwaInstallBtn');
const closePWAPrompt = document.getElementById('closePWAPrompt');
const continueBrowser = document.getElementById('continueBrowser');
const pwaPrompt = document.getElementById('pwaInstallPrompt');

if (pwaInstallBtn) {
    pwaInstallBtn.addEventListener('click', async () => {
        // User manually clicked install, so we should forget they ever dismissed it
        localStorage.removeItem('pwa_prompt_dismissed');

        if (!window.deferredPrompt) return;

        // Show the install prompt
        window.deferredPrompt.prompt();

        // Wait for the user's response
        const { outcome } = await window.deferredPrompt.userChoice;
        console.log(`User response: ${outcome}`);

        // Clear the deferredPrompt
        window.deferredPrompt = null;

        // Hide the prompt
        if (pwaPrompt) pwaPrompt.classList.add('hidden');
    });
}

if (closePWAPrompt) {
    closePWAPrompt.addEventListener('click', () => {
        if (pwaPrompt) pwaPrompt.classList.add('hidden');
        // Remember dismissal for 7 days
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        localStorage.setItem('pwa_prompt_dismissed', (new Date().getTime() + sevenDays).toString());
    });
}

if (continueBrowser) {
    continueBrowser.addEventListener('click', () => {
        if (pwaPrompt) pwaPrompt.classList.add('hidden');
        // Remember dismissal for 7 days
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        localStorage.setItem('pwa_prompt_dismissed', (new Date().getTime() + sevenDays).toString());
    });
}

// Initialize PWA prompt when page loads
setupPWAInstallPrompt();

// --- OPTIMIZATION: DYNAMIC IMPORT FOR TOUR SYSTEM ---
// Load Tour System on idle (2s delay) or user interaction
// --- TOUR SYSTEM REMOVED ---
// (User requested removal of help button functionality)

