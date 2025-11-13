// --- CONFIGURATION ---
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSOtyJ200uEv2yu24C-DesB5g57iBX9CpO_qp8mAQCKX1LYrS_S8BnZGtfVDq_9LqnJ7HO6nbXpu8J4/pub?gid=0&single=true&output=csv"; 
const ADMIN_PASSWORD = "BWM"; 

// --- GAME STATE ---
let visitedSites = JSON.parse(localStorage.getItem('jejak_visited')) || [];
const TOTAL_SITES = 13; // Number of numeric sites (1-13)

// --- 1. APP NAVIGATION & SECURITY ---

function getTodayString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function initApp() {
    const landingPage = document.getElementById('landing-page');
    const gatekeeper = document.getElementById('gatekeeper');
    
    // Check Login Session
    const sessionData = JSON.parse(localStorage.getItem('jejak_session'));
    const SESSION_DURATION = 24 * 60 * 60 * 1000; 

    if (sessionData && sessionData.valid) {
        if (Date.now() - sessionData.start < SESSION_DURATION) {
            landingPage.remove();
            gatekeeper.remove();
            // Show Game UI if logged in
            document.getElementById('game-ui').classList.remove('hidden');
            return; 
        } else {
            localStorage.removeItem('jejak_session');
        }
    }
    setupLandingPage();
}

function setupLandingPage() {
    const btnVisitor = document.getElementById('btnVisitor');
    const btnStaff = document.getElementById('btnStaff');
    const landingPage = document.getElementById('landing-page');
    const gatekeeper = document.getElementById('gatekeeper');
    const backToHome = document.getElementById('backToHome');
    const closeStaffScreen = document.getElementById('closeStaffScreen');
    const staffScreen = document.getElementById('staff-screen');

    btnVisitor.addEventListener('click', () => {
        landingPage.classList.add('hidden');
        gatekeeper.classList.remove('hidden');
    });

    btnStaff.addEventListener('click', async () => {
        const pass = prompt("👮 BWM STAFF LOGIN\nPlease enter your password:");
        if (pass === ADMIN_PASSWORD) {
            await showAdminCode();
        } else if (pass !== null) {
            alert("❌ Wrong password");
        }
    });

    backToHome.addEventListener('click', () => {
        gatekeeper.classList.add('hidden');
        landingPage.classList.remove('hidden');
    });

    closeStaffScreen.addEventListener('click', () => {
        staffScreen.classList.add('hidden');
        landingPage.classList.remove('hidden');
    });

    setupGatekeeperLogic();
}

async function showAdminCode() {
    const staffScreen = document.getElementById('staff-screen');
    const passkeyDisplay = document.getElementById('adminPasskeyDisplay');
    const dateDisplay = document.getElementById('adminDateDisplay');
    
    staffScreen.classList.remove('hidden');
    passkeyDisplay.textContent = "LOADING...";
    passkeyDisplay.classList.add('animate-pulse');

    try {
        const response = await fetch(SHEET_URL);
        const data = await response.text();
        const rows = data.split('\n');
        const todayStr = getTodayString();
        let todayCode = "NOT FOUND";
        
        for (let i = 1; i < rows.length; i++) {
            const cols = rows[i].split(',');
            if (cols[0] && cols[0].trim() === todayStr) {
                todayCode = cols[1].trim();
                break;
            }
        }
        passkeyDisplay.classList.remove('animate-pulse');
        passkeyDisplay.textContent = todayCode;
        dateDisplay.textContent = `Date: ${todayStr}`;
    } catch (e) {
        passkeyDisplay.textContent = "ERROR";
        alert("Connection Error.");
        staffScreen.classList.add('hidden');
    }
}

function setupGatekeeperLogic() {
    const btn = document.getElementById('unlockBtn');
    const input = document.getElementById('passcodeInput');
    btn.addEventListener('click', () => { if(input.value) verifyCode(input.value); });
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter' && input.value) verifyCode(input.value); });
}

async function verifyCode(enteredCode) {
    const btn = document.getElementById('unlockBtn');
    const errorMsg = document.getElementById('errorMsg');
    const landingPage = document.getElementById('landing-page');
    const gatekeeper = document.getElementById('gatekeeper');
    
    btn.textContent = "Verifying...";
    errorMsg.classList.add('hidden');

    try {
        const response = await fetch(SHEET_URL);
        const data = await response.text();
        const rows = data.split('\n');
        const todayStr = getTodayString();
        let validCode = null;

        for (let i = 1; i < rows.length; i++) {
            const cols = rows[i].split(',');
            if (cols.length >= 2 && cols[0].trim() === todayStr) {
                validCode = cols[1].trim();
                break;
            }
        }

        if (validCode && enteredCode.trim().toUpperCase() === validCode.toUpperCase()) {
            const session = { valid: true, start: Date.now() };
            localStorage.setItem('jejak_session', JSON.stringify(session));
            
            gatekeeper.style.opacity = '0';
            landingPage.style.opacity = '0';
            
            setTimeout(() => {
                gatekeeper.remove();
                landingPage.remove();
                document.getElementById('game-ui').classList.remove('hidden');
            }, 500);
        } else {
            btn.textContent = "Verify & Unlock";
            errorMsg.textContent = "Invalid Passkey.";
            errorMsg.classList.remove('hidden');
        }
    } catch (err) {
        btn.textContent = "Error";
        alert("Connection Error.");
    }
}

// --- 2. MAP & GAMIFICATION LOGIC ---

document.addEventListener('DOMContentLoaded', () => {
    initApp();
    updateGameProgress(); // Update UI on load

    const map = L.map('map').setView([3.1483, 101.6938], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);

    // Modal Elements
    const siteModal = document.getElementById('siteModal');
    const closeModal = document.getElementById('closeModal');
    const btnCollect = document.getElementById('btnCollectStamp');
    const btnDirections = document.getElementById('btnDirections');
    const rewardModal = document.getElementById('rewardModal');
    const closeReward = document.getElementById('closeReward');

    const elements = {
        title: document.getElementById('modalTitle'),
        built: document.getElementById('modalBuilt'),
        architects: document.getElementById('modalArchitects'),
        info: document.getElementById('modalInfo')
    };

    // Store markers to update them later
    const allMarkers = {};

    fetch('data.json')
        .then(res => res.json())
        .then(sites => {
            sites.forEach(site => {
                const marker = L.marker(site.coordinates).addTo(map);
                allMarkers[site.id] = marker;

                // If already visited, turn Gold immediately
                if (visitedSites.includes(site.id)) {
                    marker._icon.classList.add('marker-visited');
                }

                marker.on('click', () => {
                    // Populate Modal
                    elements.title.textContent = `${site.id}. ${site.name}`;
                    elements.built.textContent = site.built || "N/A";
                    elements.architects.textContent = site.architects || "N/A";
                    elements.info.textContent = site.info;
                    
                    // Setup Direction Link
                    btnDirections.href = `https://www.google.com/maps/dir/?api=1&destination=${site.coordinates[0]},${site.coordinates[1]}&travelmode=walking`;

                    // Setup Collect Button
                    // Only show collect button for numbered sites (1-13), not A-M
                    const isNumberedSite = !isNaN(site.id);
                    
                    if (!isNumberedSite) {
                        btnCollect.style.display = 'none'; // Hide for A-M sites
                    } else {
                        btnCollect.style.display = 'flex';
                        if (visitedSites.includes(site.id)) {
                            btnCollect.innerHTML = "✅ Stamp Collected";
                            btnCollect.classList.add('opacity-50', 'cursor-not-allowed');
                            btnCollect.disabled = true;
                        } else {
                            btnCollect.innerHTML = "🏆 Collect Stamp";
                            btnCollect.classList.remove('opacity-50', 'cursor-not-allowed');
                            btnCollect.disabled = false;
                            
                            // Handle Click
                            btnCollect.onclick = () => {
                                collectStamp(site.id, marker, btnCollect);
                            };
                        }
                    }
                    
                    siteModal.classList.remove('hidden');
                });
            });
        });

    // Logic to Collect Stamp
    function collectStamp(siteId, marker, btn) {
        if (!visitedSites.includes(siteId)) {
            // 1. Save to storage
            visitedSites.push(siteId);
            localStorage.setItem('jejak_visited', JSON.stringify(visitedSites));
            
            // 2. Update UI
            marker._icon.classList.add('marker-visited');
            btn.innerHTML = "✅ Stamp Collected";
            btn.classList.add('opacity-50', 'cursor-not-allowed');
            btn.disabled = true;

            // 3. Update Progress
            updateGameProgress();

            // 4. Check Victory
            const numberedSitesVisited = visitedSites.filter(id => !isNaN(id)).length;
            if (numberedSitesVisited >= TOTAL_SITES) {
                setTimeout(() => {
                    siteModal.classList.add('hidden');
                    rewardModal.classList.remove('hidden');
                }, 1000);
            }
        }
    }

    function updateGameProgress() {
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        
        // Count only numbered sites (1-13)
        const count = visitedSites.filter(id => !isNaN(id)).length;
        const percent = (count / TOTAL_SITES) * 100;
        
        progressBar.style.width = `${percent}%`;
        progressText.textContent = `${count}/${TOTAL_SITES} Sites`;
    }

    // User Location
    const userMarker = L.marker([0, 0]).addTo(map);
    const userCircle = L.circle([0, 0], { radius: 10 }).addTo(map);
    map.on('locationfound', (e) => {
        userMarker.setLatLng(e.latlng);
        userCircle.setLatLng(e.latlng).setRadius(e.accuracy / 2);
    });
    map.locate({ watch: true, enableHighAccuracy: true });

    // Close Modals
    const hideModal = () => siteModal.classList.add('hidden');
    closeModal.addEventListener('click', hideModal);
    closeReward.addEventListener('click', () => rewardModal.classList.add('hidden'));
});
