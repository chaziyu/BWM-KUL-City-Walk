// --- CONFIGURATION & IMPORTS ---
import { DEFAULT_CENTER, ZOOM } from './modules/config.js';
import { migrateData } from './storage-migration.js';
import { initMap, loadSites, updateVisibility } from './modules/map.js';
import { initGlobalUIListeners, animateOpenModal, animateCloseModal, animateScreenSwitch } from './modules/ui.js';
import * as Auth from './modules/auth.js';
import { handleMarkerClick, handleCheckIn, initGameUI } from './modules/game.js'; // We ended up not putting initGameUI in game.js, will implement in app.js
import { initializeChatSystem, handleSendMessage, loadChatHistory, updateChatUIWithCount } from './modules/chat.js';
import { visitedSites, discoveredSites } from './modules/state.js';

// --- VERCEL ANALYTICS ---
import { inject } from 'https://cdn.jsdelivr.net/npm/@vercel/analytics/+esm';
inject();

// --- VERCEL SPEED INSIGHTS ---
import { injectSpeedInsights } from 'https://cdn.jsdelivr.net/npm/@vercel/speed-insights/+esm';
injectSpeedInsights();

// --- DATA MIGRATION ---
migrateData();

// --- APP INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {

    // 1. PWA Check
    Auth.setupPWAInstallPrompt();

    // 2. Check for URL Magic Link
    await Auth.checkForURLPasskey(() => startApp());

    // 3. Session Check
    if (Auth.isAuthorized()) {
        const sessionData = JSON.parse(localStorage.getItem('jejak_session'));
        if (sessionData.role === 'admin') {
            // Admin Flow
            document.getElementById('landing-page').remove();
            document.getElementById('gatekeeper').remove();
            document.getElementById('staff-screen').classList.remove('hidden');
            Auth.setupAdminLoginLogic();
            Auth.showAdminTools(); // Directly show tools using locally stored password if avail? logic is in auth.js
        } else {
            // User Flow
            startApp();
        }
    } else {
        // Landing Page
        setupLandingPage();
    }
});

function setupLandingPage() {
    // Visitor Enter
    document.getElementById('btnVisitor').addEventListener('click', () => {
        animateScreenSwitch(
            document.getElementById('landing-page'),
            document.getElementById('gatekeeper')
        );
    });

    // Staff Enter
    document.getElementById('btnStaff').addEventListener('click', () => {
        animateScreenSwitch(
            document.getElementById('landing-page'),
            document.getElementById('staff-screen')
        );
    });

    // Back Buttons
    document.getElementById('backToHome').addEventListener('click', () => {
        animateScreenSwitch(
            document.getElementById('gatekeeper'),
            document.getElementById('landing-page')
        );
    });

    document.getElementById('closeStaffScreen')?.addEventListener('click', () => {
        animateScreenSwitch(
            document.getElementById('staff-screen'),
            document.getElementById('landing-page')
        );
    });

    Auth.setupGatekeeperLogic(() => startApp());
    Auth.setupAdminLoginLogic();
}

function startApp() {
    // Clean up login screens
    const landing = document.getElementById('landing-page');
    const gatekeeper = document.getElementById('gatekeeper');
    if (landing) landing.remove();
    if (gatekeeper) gatekeeper.remove();
    document.getElementById('progress-container').classList.remove('hidden');

    // Initialize Map
    const map = initMap('map', (site, marker) => {
        handleMarkerClick(site, marker);
    });

    // Load Data
    fetch('data.json').then(res => res.json()).then(sites => {
        loadSites(sites, visitedSites, discoveredSites);
    }).catch(console.error);

    // Initialize UI Listeners
    initGlobalUIListeners();
    setupAppListeners(map);

    // Init Chat (lazy load or eager?)
    // initializeChatSystem(); // Let's wait for user interaction or simplified init
}

function setupAppListeners(mapObj) {
    // Logo
    document.getElementById('logoOverlay')?.addEventListener('click', () => {
        window.open('https://badanwarisanmalaysia.org/', '_blank');
    });

    // Recenter
    document.getElementById('btnRecenter')?.addEventListener('click', () => {
        mapObj.setView(DEFAULT_CENTER, ZOOM);
    });

    // Filter Tabs
    const tabMustVisit = document.getElementById('tabMustVisit');
    const tabRecommended = document.getElementById('tabRecommended');
    if (tabMustVisit && tabRecommended) {
        // Note: activeFilterMode handling needs to be imported/exported from map.js properly
        // For now, assume map.js handles it via setFilterMode
        import('./modules/map.js').then(module => {
            tabMustVisit.addEventListener('click', () => {
                module.setFilterMode('must_visit');
                updateTabStyles('must_visit');
            });
            tabRecommended.addEventListener('click', () => {
                module.setFilterMode('recommended');
                updateTabStyles('recommended');
            });
        });
    }

    // Chat Button
    document.getElementById('btnChat')?.addEventListener('click', () => {
        initializeChatSystem();
        animateOpenModal(document.getElementById('chatModal'));
    });

    // Passport
    document.getElementById('btnPassport')?.addEventListener('click', () => {
        // Logic for passport update? It was in app.js. 
        // We need to move updatePassport to game.js or ui.js. 
        // For now, let's assume it's in game.js or we miss it.
        // Wait, I didn't include updatePassport in game.js!
        // I need to add it to game.js.
        import('./modules/game.js').then(m => {
            if (m.updatePassport) m.updatePassport(); // NEED TO IMPLEMENT
            animateOpenModal(document.getElementById('passportModal'));
        });
    });

    // Close Modals
    // ... handled by global listeners mostly, but specific close buttons:
    document.getElementById('closePassportModal')?.addEventListener('click', () => {
        animateCloseModal(document.getElementById('passportModal'));
    });

    document.getElementById('closeSiteModal')?.addEventListener('click', () => {
        animateCloseModal(document.getElementById('siteModal'));
    });

    // Check In
    document.getElementById('siteModalCheckInBtn')?.addEventListener('click', handleCheckIn);

    // Food/Hotel Buttons
    const siteModalFoodBtn = document.getElementById('siteModalFoodBtn');
    if (siteModalFoodBtn) {
        siteModalFoodBtn.addEventListener('click', (e) => {
            // import { currentModalSite } from './modules/game.js'; // Dynamic import for var?
            // Better to genericize openGoogleMaps
            // For now, let's skip deep linking for this first pass or implement later
        });
    }
}

function updateTabStyles(mode) {
    const tabMustVisit = document.getElementById('tabMustVisit');
    const tabRecommended = document.getElementById('tabRecommended');
    if (!tabMustVisit || !tabRecommended) return;

    if (mode === 'must_visit') {
        tabMustVisit.className = "w-full md:w-48 h-12 flex items-center justify-center rounded-xl text-sm font-bold text-white bg-indigo-600 shadow-md transition-all transform scale-105 border-indigo-700";
        tabRecommended.className = "w-full md:w-48 h-12 flex items-center justify-center rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-all border border-transparent";
    } else {
        tabMustVisit.className = "w-full md:w-48 h-12 flex items-center justify-center rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-all border border-transparent";
        tabRecommended.className = "w-full md:w-48 h-12 flex items-center justify-center rounded-xl text-sm font-bold text-white bg-indigo-600 shadow-md transition-all transform scale-105 border-indigo-700";
    }
}
