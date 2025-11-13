// --- CONFIGURATION ---
// 🟢 YOUR LINK IS NOW SET BELOW 🟢
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSOtyJ200uEv2yu24C-DesB5g57iBX9CpO_qp8mAQCKX1LYrS_S8BnZGtfVDq_9LqnJ7HO6nbXpu8J4/pub?gid=0&single=true&output=csv"; 
const ADMIN_PASSWORD = "BWM"; // Password for NGO staff to see the daily code

// --- 1. GATEKEEPER & SECURITY LOGIC ---

function getTodayString() {
    // Returns "YYYY-MM-DD" for the current day (e.g. 2025-11-14)
    // This MUST match the format in your Google Sheet Column A
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function checkAccess() {
    const gatekeeper = document.getElementById('gatekeeper');
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');

    // --- ADMIN MODE (For Staff) ---
    // Use link: your-site.vercel.app/?mode=admin
    if (mode === 'admin') {
        const pass = prompt("👮 STAFF LOGIN\nPlease enter the Admin Password:");
        if (pass === ADMIN_PASSWORD) {
            await showAdminCode();
        } else {
            alert("❌ Wrong password");
        }
        // Admin stays on lock screen but gets the popup info
        return; 
    }

    // --- VISITOR MODE ---
    // Check if they have a valid 24-hour session
    const sessionData = JSON.parse(localStorage.getItem('jejak_session'));
    const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 Hours

    if (sessionData && sessionData.valid) {
        if (Date.now() - sessionData.start < SESSION_DURATION) {
            // Valid session exists -> Unlock immediately
            if(gatekeeper) gatekeeper.remove();
            return;
        } else {
            localStorage.removeItem('jejak_session'); // Expired
        }
    }

    // If locked, setup the button listener
    setupGatekeeper();
}

async function showAdminCode() {
    try {
        const response = await fetch(SHEET_URL);
        const data = await response.text();
        const rows = data.split('\n');
        const todayStr = getTodayString();
        
        let todayCode = "NOT FOUND";
        
        // Scan the sheet for today's date
        for (let i = 1; i < rows.length; i++) {
            const cols = rows[i].split(',');
            // Check if column A matches today
            if (cols[0] && cols[0].trim() === todayStr) {
                todayCode = cols[1].trim();
                break;
            }
        }
        alert(`📅 DATE: ${todayStr}\n🔑 TODAY'S CODE: ${todayCode}`);
    } catch (e) {
        console.error(e);
        alert("Error connecting to Google Sheet. Check internet.");
    }
}

async function verifyCode(enteredCode) {
    const btn = document.getElementById('unlockBtn');
    const errorMsg = document.getElementById('errorMsg');
    const input = document.getElementById('passcodeInput');
    
    btn.textContent = "Verifying...";
    errorMsg.classList.add('hidden');

    try {
        // 1. Fetch the CSV
        const response = await fetch(SHEET_URL);
        const data = await response.text();
        const rows = data.split('\n');
        
        // 2. Find Today's Code
        const todayStr = getTodayString();
        let validCode = null;

        for (let i = 1; i < rows.length; i++) {
            const cols = rows[i].split(',');
            // Ensure row has data and matches date
            if (cols.length >= 2 && cols[0].trim() === todayStr) {
                validCode = cols[1].trim();
                break;
            }
        }

        // 3. Validate
        if (validCode && enteredCode.trim().toUpperCase() === validCode.toUpperCase()) {
            // SUCCESS
            const session = { valid: true, start: Date.now() };
            localStorage.setItem('jejak_session', JSON.stringify(session));
            
            const gatekeeper = document.getElementById('gatekeeper');
            gatekeeper.style.opacity = '0';
            setTimeout(() => gatekeeper.remove(), 500);
        } else {
            // FAIL
            btn.textContent = "Unlock Map";
            errorMsg.textContent = "Invalid Code for Today.";
            errorMsg.classList.remove('hidden');
            input.classList.add('border-red-500');
        }

    } catch (err) {
        console.error(err);
        btn.textContent = "Error";
        alert("Could not connect to server. Please check internet.");
    }
}

function setupGatekeeper() {
    const btn = document.getElementById('unlockBtn');
    const input = document.getElementById('passcodeInput');
    
    if(!btn) return;

    // Allow clicking button
    btn.addEventListener('click', () => {
        if(input.value) verifyCode(input.value);
    });

    // Allow pressing "Enter" key
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && input.value) {
            verifyCode(input.value);
        }
    });
}


// --- 2. MAP & APP LOGIC ---

document.addEventListener('DOMContentLoaded', () => {
    checkAccess(); // Run security check first

    // Initialize Map
    const map = L.map('map').setView([3.1483, 101.6938], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);

    // Modal Elements
    const siteModal = document.getElementById('siteModal');
    const closeModal = document.getElementById('closeModal');
    const elements = {
        title: document.getElementById('modalTitle'),
        built: document.getElementById('modalBuilt'),
        architects: document.getElementById('modalArchitects'),
        info: document.getElementById('modalInfo')
    };

    // Close Modal Logic
    const hideModal = () => siteModal.classList.add('hidden');
    closeModal.addEventListener('click', hideModal);
    siteModal.addEventListener('click', (e) => {
        if (e.target === siteModal) hideModal();
    });

    // Fetch Data
    fetch('data.json')
        .then(res => res.json())
        .then(sites => {
            sites.forEach(site => {
                const marker = L.marker(site.coordinates).addTo(map);
                marker.on('click', () => {
                    elements.title.textContent = `${site.id}. ${site.name}`;
                    elements.built.textContent = site.built || "N/A";
                    elements.architects.textContent = site.architects || "N/A";
                    elements.info.textContent = site.info;
                    siteModal.classList.remove('hidden');
                });
            });
        });

    // User Location (Blue Dot)
    const userMarker = L.marker([0, 0]).addTo(map);
    const userCircle = L.circle([0, 0], { radius: 10 }).addTo(map);

    map.on('locationfound', (e) => {
        userMarker.setLatLng(e.latlng);
        userCircle.setLatLng(e.latlng).setRadius(e.accuracy / 2);
    });

    map.locate({ watch: true, enableHighAccuracy: true });
});
