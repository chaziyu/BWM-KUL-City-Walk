//PROBLEM: Kedai Ubat Kwong Ban Heng is not there anymore!!!
//The garden flower stall is also not there anymore. Only the teochew association

// --- CONFIGURATION ---
const HISTORY_WINDOW_SIZE = 10;
const MAX_MESSAGES_PER_SESSION = 10;
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// --- GAME STATE ---
let map = null;
let visitedSites = JSON.parse(localStorage.getItem('jejak_visited')) || [];
let discoveredSites = JSON.parse(localStorage.getItem('jejak_discovered')) || [];
const TOTAL_SITES = 13; 
let allSiteData = []; 
let chatHistory = [];
let userMessageCount = parseInt(localStorage.getItem('jejak_message_count')) || 0;
let currentModalSite = null; // To track the currently open pin
let currentModalMarker = null; // To track the currently open marker
let userMarker = null; // Make userMarker global for proximity pulse
let solvedRiddle = JSON.parse(localStorage.getItem('jejak_solved_riddle')) || {};
// Get or Create a unique Device ID for this browser
let markersLayer = null;  // New: Layer group for markers
let polygonsLayer = null; // New: Layer group for polygons
const ZOOM_THRESHOLD = 18; // New: Define the zoom level where the switch happens
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
    { q: "I am a traditional medicine shop, a 'living museum' for over 30 years, where you can still buy herbs.", a: "8" },
    { q: "In 1932, I was the tallest building in KL, standing at 85 feet. I also housed Radio Malaya.", a: "9" },
    { q: "I am not a building, but a fragrant stop where artisans weave fresh flower garlands.", a: "10" },
    { q: "My prayer services are held in both Arabic and Tamil, a unique feature for a mosque in this area.", a: "11" },
    { q: "I am Malaysia's oldest existing jewellers, founded by a man who was shipwrecked!", a: "12" },
    { q: "I was KL's only theatre, but I was heavily damaged by a major fire in the 1980s.", a: "13" }
];

// --- DOM Elements ---
let siteModal, siteModalImage, siteModalLabel, siteModalTitle, siteModalInfo, siteModalQuizArea, siteModalQuizQ, siteModalQuizInput, siteModalQuizBtn, siteModalQuizResult, closeSiteModal, siteModalAskAI, siteModalDirections, siteModalCheckInBtn, siteModalSolveChallengeBtn, siteModalMoreBtn, siteModalMoreContent, siteModalMore;
let chatModal, closeChatModal, chatHistoryEl, chatInput, chatSendBtn, chatLimitText;
let passportModal, closePassportModal, passportInfo, passportGrid;
let welcomeModal, closeWelcomeModal;
let congratsModal, closeCongratsModal, shareWhatsAppBtn;
let challengeModal, closeChallengeModal, btnChallenge, challengeRiddle, challengeResult;
let chaChingSound;
let siteModalHintBtn, siteModalHintText;

//BUG FIX
// --- UTILITY FUNCTION FOR SAFELY MANAGING MARKER STATE ---
function safelyUpdateMarkerVisitedState(marker, isVisited) {
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
        if (isVisited) {
            polygon.setStyle({
                color: VISITED_POLYGON_COLOR, // Blue Outline
                fillColor: VISITED_POLYGON_COLOR, // Blue Fill
                fillOpacity: 0.2 // Reduced opacity for visited
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

//MAP LOGIC
// 2. The Switcher Function (No "site" variable needed here!)
// --- MAP VISIBILITY TOGGLE ---
function updateVisibility() {
    // Safety check: ensure map and layers are initialized before proceeding
    if (!map || !markersLayer || !polygonsLayer) return;

    const currentZoom = map.getZoom();

    if (currentZoom >= ZOOM_THRESHOLD) {
        // Zoomed in: Show Polygons, Hide Markers
        if (map.hasLayer(markersLayer)) map.removeLayer(markersLayer);
        if (!map.hasLayer(polygonsLayer)) map.addLayer(polygonsLayer);
    } else {
        // Zoomed out: Show Markers, Hide Polygons
        if (map.hasLayer(polygonsLayer)) map.removeLayer(polygonsLayer);
        if (!map.hasLayer(markersLayer)) map.addLayer(markersLayer);
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
        const markerColor = "#4CAF50"; // Green for checkpoint/bonus sites
        const fillColor = "#635b5bff";   // Light Green for polygon fill
        const className = 'bonus-marker-pin';
        return { markerColor, fillColor, className };
    }
}

// --- CORE GAME & MAP INITIALIZATION ---
function initializeGameAndMap() {
    if (map) return;
    
    // 1. Initialize the map object FIRST
    map = L.map('map').setView([3.1495519988154683, 101.69609103393907], 16);
    
    // 2. NOW you can SAFELY attach the event listener, preventing the TypeError
    map.on('zoomend', updateVisibility); // <--- FIX IS HERE

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
                
                // Use the 'add' event to guarantee the icon is in the DOM when we try to style it
                marker.on('add', (e) => {
                    safelyUpdateMarkerVisitedState(e.target, true);
                });
            }
            // END FIX

            marker.on('click', () => handleMarkerClick(site, marker));
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
                
                poly.on('click', () => handleMarkerClick(site, marker));
                polygonsLayer.addLayer(poly); 
            }
            
        });
        updateGameProgress();
        updatePassport(); 
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
    
    map.on('locationfound', (e) => {
        userMarker.setLatLng(e.latlng);
        userCircle.setLatLng(e.latlng).setRadius(Math.min(e.accuracy / 2, 100));
        
        // --- ADDED: Proximity Feature Logic ---
        if (allSiteData.length > 0) {
            updateProximityPulse(e.latlng);
        }
    });

    map.on('locationerror', (e) => {
    console.error("GPS Error:", e.message);
    alert("GPS Error: " + e.message + "\nPlease make sure Location Services are enabled and you are using HTTPS.");
});

    map.locate({ watch: true, enableHighAccuracy: true});
    
    // 4. Set initial layer visibility based on starting zoom
    updateVisibility(); 

    if (!sessionStorage.getItem('jejak_welcome_shown')) {
        document.getElementById('welcomeModal').classList.remove('hidden');
        sessionStorage.setItem('jejak_welcome_shown', 'true');
    }
}

// --- GAME LOGIC FUNCTIONS ---

// ADDED: Proximity Pulse Function
function updateProximityPulse(userLatLng) {
    if (!userMarker || !userMarker._icon) return;

    let closestDist = Infinity;
    const undiscoveredSites = allSiteData.filter(site => 
        !visitedSites.includes(site.id) && !discoveredSites.includes(site.id)
    );

    undiscoveredSites.forEach(site => {
        const siteLatLng = L.latLng(site.coordinates[0], site.coordinates[1]);
        const dist = userLatLng.distanceTo(siteLatLng);
        if (dist < closestDist) {
            closestDist = dist;
        }
    });

    const pinElement = userMarker._icon;
    pinElement.classList.remove('pulse-fast', 'pulse-medium', 'pulse-slow');

    if (closestDist < 75) { // Under 75 meters
        pinElement.classList.add('pulse-fast');
    } else if (closestDist < 250) { // Under 250 meters
        pinElement.classList.add('pulse-medium');
    } else { // Far away
        pinElement.classList.add('pulse-slow');
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
        challengeResult.textContent = "You've already solved today's challenge. Well done!";
    } else {
        challengeResult.textContent = "Find the heritage site that matches this riddle and click 'Solve Challenge' in its pop-up!";
    }
}

function handleMarkerClick(site, marker) {
    if (!siteModal) {
        console.error("Site modal is not initialized!");
        return; 
    }

    currentModalSite = site;
    currentModalMarker = marker; // Store the marker

    siteModalLabel.textContent = site.id ? `${site.id}.` : "";
    siteModalTitle.textContent = site.name;
    siteModalInfo.textContent = site.info;
    siteModalImage.src = site.image || 'https://placehold.co/600x400/eee/ccc?text=Site+Image';
    // NEW: Populate and toggle the More info section (prefers site.more_info over site.ai_context)
    if (!siteModalMore || !siteModalMoreBtn || !siteModalMoreContent) {
        siteModalMore = document.getElementById('siteModalMore');
        siteModalMoreBtn = document.getElementById('siteModalMoreBtn');
        siteModalMoreContent = document.getElementById('siteModalMoreContent');
    }
    if (siteModalMore && siteModalMoreBtn && siteModalMoreContent) {
        const moreText = (site.more_info && site.more_info.trim().length)
            ? site.more_info
            : (site.ai_context || '');
        const hasMore = moreText.trim().length > 0;

        // Reset state on open
        siteModalMoreContent.classList.add('hidden');
        siteModalMoreBtn.textContent = 'More info';
        siteModalMoreContent.textContent = hasMore ? moreText : '';

        // Show/hide button and container based on availability
        siteModalMore.style.display = hasMore ? 'block' : 'none';
        siteModalMoreBtn.style.display = hasMore ? 'block' : 'none';

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
    
    const isMainSite = site.quiz && !isNaN(parseInt(site.id));
    
    // Show "Ask AI" and "Directions" for ALL sites
    siteModalDirections.style.display = 'block';
    siteModalAskAI.style.display = 'block';

    if (isMainSite) {
        // This is a main site (1-13)
        siteModalQuizArea.style.display = 'block';
        siteModalCheckInBtn.style.display = 'none'; // Hide Check-in button
        
        siteModalQuizQ.textContent = site.quiz.q;
        siteModalQuizInput.value = "";
        siteModalQuizResult.classList.add('hidden');
        
        const newQuizBtn = siteModalQuizBtn.cloneNode(true);
        siteModalQuizBtn.parentNode.replaceChild(newQuizBtn, siteModalQuizBtn);
        siteModalQuizBtn = newQuizBtn; 
        
        // --- NEW: Quiz Hint Logic ---
        siteModalHintText.textContent = site.quiz.hint || "No hint available.";
        siteModalHintText.classList.add('hidden'); // Reset to hidden

        // Remove old listener to prevent duplicates (cloning for button above handles that, but link needs care)
        const newHintBtn = siteModalHintBtn.cloneNode(true);
        siteModalHintBtn.parentNode.replaceChild(newHintBtn, siteModalHintBtn);
        siteModalHintBtn = newHintBtn;

        siteModalHintBtn.addEventListener('click', () => {
            siteModalHintText.classList.toggle('hidden');
        });

        siteModalQuizBtn.addEventListener('click', () => {
            // SMART GRADING: Normalization Function
            const normalize = (val) => {
                if (!val) return '';
                // 1. Lowercase & Remove all non-alphanumeric chars (spaces, commas, dots, dashes)
                let s = val.toString().toLowerCase().replace(/[^a-z0-9]/g, '');

                // 2. Map Number Words to Digits (common cases)
                const numMap = {
                    'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
                    'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10'
                };
                return numMap[s] || s;
            };

            if (normalize(siteModalQuizInput.value) === normalize(site.quiz.a)) {
                siteModalQuizResult.textContent = "Correct! Well done!";
                siteModalQuizResult.className = "text-sm mt-2 text-center font-bold text-green-600";
                
                if (!visitedSites.includes(site.id)) {
                    visitedSites.push(site.id);
                    localStorage.setItem('jejak_visited', JSON.stringify(visitedSites));

                    // FIX: Use the global map and safe helper
                    const markerToUpdate = allMarkers[site.id]; // Look up the marker globally
                    safelyUpdateMarkerVisitedState(markerToUpdate, true); 
                    // END FIX

                    // NEW: Update polygon color
                    safelyUpdatePolygonVisitedState(site.id, true); // <--- ADD THIS LINE
                    // END NEW

                    updateGameProgress();
                    updatePassport();
                    
                    // --- ADDED: Play Sound & Check for Completion ---
                    chaChingSound.play();
                    
                    if (visitedSites.length === TOTAL_SITES) {
                        congratsModal.classList.remove('hidden');
                        // BOMBASTIC: Trigger Confetti!
                        if (typeof confetti === 'function') {
                            const duration = 3 * 1000;
                            const end = Date.now() + duration;

                            (function frame() {
                                confetti({
                                    particleCount: 5,
                                    angle: 60,
                                    spread: 55,
                                    origin: { x: 0 }
                                });
                                confetti({
                                    particleCount: 5,
                                    angle: 120,
                                    spread: 55,
                                    origin: { x: 1 }
                                });

                                if (Date.now() < end) {
                                    requestAnimationFrame(frame);
                                }
                            }());
                        }
                    }
                }
            } else {
                siteModalQuizResult.textContent = "Not quite, try again!";
                siteModalQuizResult.className = "text-sm mt-2 text-center font-bold text-red-600";
            }
            siteModalQuizResult.classList.remove('hidden');
        });

    } else {
        // This is a "discovery" pin (A, B, C...)
        siteModalQuizArea.style.display = 'none'; // Hide Quiz
        siteModalCheckInBtn.style.display = 'block'; // Show Check-in button
        
        // Set the state of the Check-in button
        if (discoveredSites.includes(site.id)) {
            siteModalCheckInBtn.disabled = true;
            siteModalCheckInBtn.textContent = 'Visited';
            siteModalCheckInBtn.classList.add('bg-gray-400', 'hover:bg-gray-400');
            siteModalCheckInBtn.classList.remove('bg-purple-600', 'hover:bg-purple-700');
        } else {
            siteModalCheckInBtn.disabled = false;
            siteModalCheckInBtn.textContent = 'Check In to this Site';
            siteModalCheckInBtn.classList.remove('bg-gray-400', 'hover:bg-gray-400');
            siteModalCheckInBtn.classList.add('bg-purple-600', 'hover:bg-purple-700');
        }
    }

    // --- ADDED: Daily Challenge Button Logic ---
    const dayOfYear = getDayOfYear();
    const riddleIndex = dayOfYear % allRiddles.length;
    const todayRiddle = allRiddles[riddleIndex];
    
    // Check if riddle is unsolved AND this is the correct site
    if (solvedRiddle.day !== dayOfYear && currentModalSite.id === todayRiddle.a) {
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
        
        // Update the button state
        siteModalCheckInBtn.disabled = true;
        siteModalCheckInBtn.textContent = 'Visited';
        siteModalCheckInBtn.classList.add('bg-gray-400', 'hover:bg-gray-400');
        siteModalCheckInBtn.classList.remove('bg-purple-600', 'hover:bg-purple-700');
    }
}

async function handleSendMessage() {
    const userQuery = chatInput.value.trim();
    if (!userQuery || userMessageCount >= MAX_MESSAGES_PER_SESSION) return;

    chatInput.value = "";
    chatInput.disabled = true;
    chatSendBtn.disabled = true;

    addChatMessage('user', userQuery);
    // Modified: Use skeleton loader instead of "..."
    const thinkingEl = addChatMessage('ai', '<span class="skeleton text-xs px-8 rounded">Loading...</span>');
    
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
        
        userMessageCount++;
        localStorage.setItem('jejak_message_count', userMessageCount.toString());
        updateChatUIWithCount();
        
        thinkingEl.querySelector('p:last-child').innerHTML = data.reply; // Select the content paragraph

    } catch (error) {
        console.error("Chat error:", error);
        thinkingEl.querySelector('p:last-child').textContent = "Sorry, I couldn't connect. Please try again.";
        thinkingEl.classList.add('bg-red-100', 'text-red-900');
    }

    if (userMessageCount < MAX_MESSAGES_PER_SESSION) {
        chatInput.disabled = false;
        chatSendBtn.disabled = false;
        chatInput.focus();
    }
}

function addChatMessage(role, text) {
    const messageEl = document.createElement('div');
    const name = (role === 'user') ? 'You' : 'AI Guide';
    const align = (role === 'user') ? 'self-end' : 'self-start';
    const bg = (role === 'user') ? 'bg-white' : 'bg-blue-100';
    const textCol = (role === 'user') ? 'text-gray-900' : 'text-blue-900';
    
    messageEl.className = `p-3 rounded-lg ${bg} ${textCol} max-w-xs shadow-sm ${align}`;
    messageEl.innerHTML = `<p class="font-bold text-sm">${name}</p><p>${text}</p>`;
    
    chatHistoryEl.appendChild(messageEl);
    chatHistoryEl.scrollTop = chatHistoryEl.scrollHeight;
    return messageEl;
}

// --- UI UPDATE FUNCTIONS ---

// function updateGameProgress() {
//     const visitedCount = visitedSites.length;
//     const mainSitesTotal = allSiteData.filter(site => !isNaN(parseInt(site.id))).length || TOTAL_SITES;
    
//     // 1. Update the Top Progress Bar
//     const progressBar = document.getElementById('progressBar');
//     const progressText = document.getElementById('progressText');
    
//     if (progressBar && progressText) {
//         const percentage = (count / mainSitesTotal) * 100;
//         progressBar.style.width = `${percentage}%`;
//         progressText.textContent = `${count}/${mainSitesTotal} Sites`;
//     }

//     // 2. Update the Passport Subtitle (The new part!)
//     const visitedCountEl = document.getElementById('visitedCount');
//     if (visitedCountEl) {
//         visitedCountEl.innerText = count;
//     }
// }

function updateGameProgress() {
    const visitedCount = visitedSites.length;
    const mainSitesTotal = allSiteData.filter(site => !isNaN(parseInt(site.id))).length || TOTAL_SITES;
    
    if (document.getElementById('progressBar') && document.getElementById('progressText')) {
        const percent = (visitedCount / mainSitesTotal) * 100;
        document.getElementById('progressBar').style.width = `${percent}%`;
        document.getElementById('progressText').textContent = `${visitedCount}/${mainSitesTotal} Sites`;
    }
}

function updateChatUIWithCount() {
    if (!chatLimitText) return;
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
        chatLimitText.textContent = "You have used all your messages for this session.";
        chatInput.placeholder = "No messages remaining.";
    }
}

function updatePassport() {
    if (!passportInfo || !passportGrid || allSiteData.length === 0) {
        return;
    }

    const mainSites = allSiteData.filter(site => !isNaN(parseInt(site.id)));
    const visitedCount = visitedSites.length;
    
    passportInfo.textContent = `You have collected ${visitedCount} of the ${mainSites.length} stamps.`;
    passportGrid.innerHTML = "";

    mainSites.forEach(site => {
        const stamp = document.createElement('div');
        stamp.className = 'passport-stamp';
        
        const isVisited = visitedSites.includes(site.id);
        if (!isVisited) {
            stamp.classList.add('grayscale');
        }else {
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
    
    function initApp() {
        const landingPage = document.getElementById('landing-page');
        const gatekeeper = document.getElementById('gatekeeper');
        const sessionData = JSON.parse(localStorage.getItem('jejak_session'));
        
        if (sessionData && sessionData.valid && (Date.now() - sessionData.start < SESSION_DURATION)) {
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
        document.getElementById('btnVisitor').addEventListener('click', () => {
            document.getElementById('landing-page').classList.add('hidden');

            const gatekeeper = document.getElementById('gatekeeper');
            gatekeeper.classList.remove('hidden');
            //gatekeeper.style.display = 'flex';
        });
        
        document.getElementById('btnStaff').addEventListener('click', () => {
            showAdminCode();
        });

        document.getElementById('backToHome').addEventListener('click', () => {
            document.getElementById('gatekeeper').classList.add('hidden');
            document.getElementById('landing-page').classList.remove('hidden');
        });
        
        const closeStaffBtn = document.getElementById('closeStaffScreen');
        if (closeStaffBtn) {
            closeStaffBtn.addEventListener('click', () => {
                document.getElementById('staff-screen').classList.add('hidden');
                document.getElementById('landing-page').classList.remove('hidden');
            });
        }
        
        setupGatekeeperLogic();
        setupAdminLoginLogic(); 
    }


    // --- LOGIN & MODAL FUNCTIONS ---

 function showAdminCode() {
        document.getElementById('landing-page').classList.add('hidden');
        document.getElementById('staff-screen').classList.remove('hidden');
    }



function setupAdminLoginLogic() {
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    if (!adminLoginBtn) return;

    adminLoginBtn.addEventListener('click', async () => {
        const password = document.getElementById('adminPasswordInput').value;
        const errorMsg = document.getElementById('adminErrorMsg');
        const loginBtn = document.getElementById('adminLoginBtn');

        // !!! USE THE SAME URL YOU USED IN verifyCode !!!
        const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyPSOwI9RSslAOcJSynxHScgz-aw7glqIeRS1OxCXanEkh0Bzk_iSBtuLLRSL97QSfTyw/exec";

        loginBtn.disabled = true;
        loginBtn.textContent = 'Verifying...';
        errorMsg.classList.add('hidden');

        try {
            // We send the admin password as the "passkey"
            // The Google Script is already programmed to recognize this!
            const response = await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'cors',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ 
                    passkey: password,
                    deviceId: 'ADMIN_DEVICE' // Device ID doesn't matter for Admin
                })
            });

            const result = await response.json();

            if (result.success && result.isAdmin) {
                // Save session as Admin
                localStorage.setItem('jejak_session', JSON.stringify({
                    valid: true,
                    start: Date.now(),
                    role: 'admin'
                }));

                // Update UI to show they are logged in
                document.getElementById('adminLoginForm').classList.add('hidden');
                
                // If you want to show a success message or redirect to map:
                document.getElementById('passkeyDate').textContent = `Authenticated as Admin`;
                document.getElementById('passkeyResult').textContent = "ACCESS GRANTED";
                document.getElementById('adminResult').classList.remove('hidden');

                // Optional: Automatically move to the map after 1.5 seconds
                setTimeout(() => {
                    location.reload(); 
                }, 1500);

            } else {
                errorMsg.textContent = result.error || 'Invalid Admin Password.';
                errorMsg.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error in admin login:', error);
            errorMsg.textContent = 'Network error. Check Google Script deployment.';
            errorMsg.classList.remove('hidden');
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Get Access';
        }
    });
}

    function setupGatekeeperLogic() {
    const unlockBtn = document.getElementById('unlockBtn');
    if (!unlockBtn) return;

    unlockBtn.addEventListener('click', async () => {
        const passcodeInput = document.getElementById('passcodeInput');
        const enteredCode = passcodeInput.value.trim();
        if (!enteredCode) return;
        
        unlockBtn.disabled = true;
        unlockBtn.textContent = 'Verifying...';
        
        await verifyCode(enteredCode);
        
        // If verification failed, reset the button
        if (!localStorage.getItem('jejak_session')) {
             unlockBtn.disabled = false;
             unlockBtn.textContent = 'Verify & Unlock';
        }
    });
}

async function verifyCode(enteredCode) {
    const errorMsg = document.getElementById('errorMsg');
    errorMsg.classList.add('hidden');

    // !!! REPLACE THIS WITH YOUR DEPLOYED WEB APP URL !!!
    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyPSOwI9RSslAOcJSynxHScgz-aw7glqIeRS1OxCXanEkh0Bzk_iSBtuLLRSL97QSfTyw/exec";

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
                start: Date.now(),
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
            errorMsg.textContent = result.error || 'Invalid or expired passkey.';
            errorMsg.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Verification Error:', error);
        errorMsg.textContent = 'Network error. Make sure the script is deployed to "Anyone".';
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
        siteModalQuizInput = document.getElementById('siteModalQuizInput');
        siteModalQuizBtn = document.getElementById('siteModalQuizBtn');
        siteModalQuizResult = document.getElementById('siteModalQuizResult');
        closeSiteModal = document.getElementById('closeSiteModal');
        siteModalAskAI = document.getElementById('siteModalAskAI');
        siteModalDirections = document.getElementById('siteModalDirections');
        siteModalCheckInBtn = document.getElementById('siteModalCheckInBtn');
        siteModalSolveChallengeBtn = document.getElementById('siteModalSolveChallengeBtn'); // ADDED
        siteModalHintBtn = document.getElementById('siteModalHintBtn');
        siteModalHintText = document.getElementById('siteModalHintText');
        
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
            if (map) {
                map.setView([3.1495519988154683, 101.69609103393907], 16);
            }
        });

        document.getElementById('btnChat').addEventListener('click', () => {
            chatModal.classList.remove('hidden');
        });
        closeChatModal.addEventListener('click', () => {
            chatModal.classList.add('hidden');
        });
        
        document.getElementById('btnPassport').addEventListener('click', () => {
            updatePassport();
            passportModal.classList.remove('hidden');
        });
        closePassportModal.addEventListener('click', () => {
            passportModal.classList.add('hidden');
        });

        closeSiteModal.addEventListener('click', () => {
            siteModal.classList.add('hidden');
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
            
            siteModal.classList.add('hidden');
            chatModal.classList.remove('hidden');
            
            chatInput.value = question;
            handleSendMessage();
        });
        
        siteModalDirections.addEventListener('click', () => {
            if (!currentModalSite) return;
            
            const lat = currentModalSite.coordinates.marker[0];
            const lon = currentModalSite.coordinates.marker[1];
            
            // === CRITICAL FIX ===
            // This is the correct, universal URL for Google Maps directions
            const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=walking`;
            
            window.open(url, '_blank');
        });
        
        // --- NEW LISTENER FOR "CHECK IN" BUTTON ---
        siteModalCheckInBtn.addEventListener('click', handleCheckIn);
        
        // --- ADDED: NEW LISTENERS FOR NEW FEATURES ---
        if (closeWelcomeModal) {
            closeWelcomeModal.addEventListener('click', () => {
                welcomeModal.classList.add('hidden');
            });
        }
        
        closeCongratsModal.addEventListener('click', () => {
            congratsModal.classList.add('hidden');
        });
        
        shareWhatsAppBtn.addEventListener('click', () => {
            const message = "🎉 Mission Accomplished! I've collected all 13 heritage stamps on the BWM KUL City Walk! 🏛️✨\n\nDiscover KL's history and start your own adventure here: https://bwm-kul-city-walk.vercel.app/";
            const whatsappMsg = encodeURIComponent(message);
            window.open(`https://wa.me/?text=${whatsappMsg}`, '_blank');
        });
        
        btnChallenge.addEventListener('click', () => {
            updateChallengeModal();
            challengeModal.classList.remove('hidden');
        });
        
        closeChallengeModal.addEventListener('click', () => {
            challengeModal.classList.add('hidden');
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
            challengeModal.classList.remove('hidden');
            // BOMBASTIC: Trigger Small Confetti Burst!
            if (typeof confetti === 'function') {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }
        });
    }

    

    // --- Run the app ---
    initApp();
});
