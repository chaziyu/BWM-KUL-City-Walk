import L from 'leaflet';
import 'leaflet-defaulticon-compatibility';
import {
  DEFAULT_CENTER,
  HISTORY_WINDOW_SIZE,
  MAX_FONT_SIZE,
  MAX_MESSAGES_PER_SESSION,
  ZOOM,
} from './src/config/app-config.js';
import { createAdminAccess } from './src/features/access/admin-access.js';
import { createDemoAccess } from './src/features/access/demo-access.js';
import { createLandingScreen } from './src/features/access/landing-screen.js';
import { showOnly } from './src/features/access/access-ui.js';
import { createVisitorAccess } from './src/features/access/visitor-access.js';
import { createMapController } from './src/features/map/map-controller.js';
import { createMapPreview } from './src/features/map/map-preview.js';
import { bindMapUI } from './src/features/map/map-ui.js';
import { createBadgeController } from './src/features/badge/badge-controller.js';
import { createChallengeController } from './src/features/challenges/challenge-controller.js';
import { createChatController } from './src/features/chat/chat-controller.js';
import { createDirectionsController } from './src/features/directions/directions-controller.js';
import { createOnboardingController } from './src/features/onboarding/onboarding-controller.js';
import { createPassportController } from './src/features/passport/passport-controller.js';
import { createProgressService } from './src/features/passport/progress-service.js';
import { createSiteActions } from './src/features/sites/site-actions.js';
import { isMainSite } from './src/features/sites/site-classification.js';
import { loadSiteData } from './src/features/sites/site-data.js';
import { createSiteModalController } from './src/features/sites/site-modal.js';
import { createTranslationController } from './src/features/translation/translation-controller.js';
import { STRINGS } from './localization.js';
import { migrateData } from './src/services/storage-migration.js';
import {
  endSession,
  getCurrentSession,
  refreshSession,
  startAdminSession,
  startDemoSession,
  startVisitorSession,
} from './src/services/session-client.js';
import {
  clearScopedProgress,
  readScopedJSON,
  readScopedNumber,
  readScopedString,
  writeScopedJSON,
  writeScopedNumber,
  writeScopedString,
} from './src/services/storage.js';
import { createModalManager } from './src/ui/modal-manager.js';

let legacyStartPromise = null;
let activeSession = getCurrentSession();
let allSiteData = [];
let mainSites = [];
let chatHistory = [];
let userMessageCount = 0;
let solvedRiddle = {};
let gameUIBound = false;
let deviceId = localStorage.getItem('bwm_device_id');
const UI_TEXT_SIZE_KEY = 'jejak_ui_text_size';
const LEGACY_UI_TEXT_SIZE_KEY = 'ui_text_size';

if (!deviceId) {
  deviceId = `device-${Math.random().toString(36).slice(2, 11)}`;
  localStorage.setItem('bwm_device_id', deviceId);
}

migrateData();

const modalManager = createModalManager({
  appRoot: document.getElementById('app') || document,
});

const progressService = createProgressService({
  getNamespace: () => activeSession.progressNamespace || 'visitor',
});

let mapPreview = null;

const mapController = createMapController({
  L,
  loadSites: loadSiteData,
  getIsCompleted: (siteId) => progressService.isCompleted(siteId),
  onSiteSelected: (site) => siteModalController.open(site),
  onSitesLoaded: (sites) => {
    allSiteData = sites;
    mainSites = sites.filter(isMainSite);
    progressService.setMainSites(mainSites);
    passportController.refreshProgress();
  },
});

const passportController = createPassportController({
  strings: STRINGS,
  progressService,
  getMainSites: () => mainSites,
  modalManager,
  getCongratsModal: () => document.getElementById('congratsModal'),
  playCelebration() {
    if (typeof confetti !== 'function') return;
    const end = Date.now() + 3000;
    (function frame() {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 } });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  },
});

const chatController = createChatController({
  deviceId,
  getChatLimit,
  getHistory: () => chatHistory,
  getMessageCount: () => userMessageCount,
  getSiteName: (siteId) => allSiteData.find((site) => String(site.id) === String(siteId))?.name,
  historyWindowSize: HISTORY_WINDOW_SIZE,
  modalManager,
  onSourceClick(siteId) {
    const site = allSiteData.find((item) => String(item.id) === String(siteId));
    if (!site) return;
    modalManager.close('chatModal');
    siteModalController.open(site);
  },
  saveHistory: saveChatHistory,
  saveMessageCount,
  setHistory: (nextHistory) => {
    chatHistory = nextHistory;
  },
  setMessageCount: (nextCount) => {
    userMessageCount = nextCount;
  },
  strings: STRINGS,
});

const directionsController = createDirectionsController({ modalManager });
const badgeController = createBadgeController({ modalManager, progressService, strings: STRINGS });
const onboardingController = createOnboardingController({ getCurrentSession, modalManager });
const translationController = createTranslationController();

const challengeController = createChallengeController({
  getSolvedRiddle: () => solvedRiddle,
  modalManager,
  onSolved(next) {
    writeScopedJSON('solved_riddle', next, getProgressNamespace());
    if (typeof confetti === 'function') {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
  },
  setSolvedRiddle(next) {
    solvedRiddle = next;
  },
  strings: STRINGS,
});

const siteActions = createSiteActions({
  strings: STRINGS,
  progressController: passportController,
  onMapRefresh: (siteId) => mapController.refreshVisitedState(siteId),
  openChat(siteId) {
    modalManager.close('siteModal');
    chatController.open({ siteId });
  },
  openDirections: (site) => directionsController.openDirections(site),
  openFood: (site) => directionsController.openNearbySearch(site, 'food'),
  openHotels: (site) => directionsController.openNearbySearch(site, 'hotel'),
  playChaChing() {
    document.getElementById('chaChingSound')?.play?.();
  },
});

const siteModalController = createSiteModalController({
  strings: STRINGS,
  actions: siteActions,
  progressService,
  modalManager,
  getChallengeState() {
    return challengeController.getState();
  },
  onChallengeSelected() {
    modalManager.close('siteModal');
    challengeController.solveCurrent();
  },
});

mapPreview = createMapPreview({
  strings: STRINGS,
  getSites: () => allSiteData,
  openSiteDetails: (site) => siteModalController.open(site),
});

const demoAccess = createDemoAccess({
  startDemoSession,
  onSession(session) {
    activeSession = session;
    notifyLifecycle({ session: activeSession });
  },
});

const visitorAccess = createVisitorAccess({
  strings: STRINGS,
  startVisitorSession,
  deviceId,
  onSession(session) {
    activeSession = session;
    notifyLifecycle({ session: activeSession });
  },
});

const adminAccess = createAdminAccess({
  strings: STRINGS,
  startAdminSession,
  endSession,
  onSession(session) {
    activeSession = session;
    notifyLifecycle({ session: activeSession });
  },
  onShowMap() {
    showMapExperience();
  },
});

let lifecycleHandler = null;

function notifyLifecycle(patch) {
  if (typeof lifecycleHandler === 'function') lifecycleHandler(patch);
}

function onDomReady(callback) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback, { once: true });
    return;
  }

  callback();
}

function getProgressNamespace() {
  return activeSession.progressNamespace || 'visitor';
}

function getChatLimit() {
  return Number(activeSession.chatLimit) || Number(MAX_MESSAGES_PER_SESSION) || 15;
}

function loadScopedState() {
  progressService.load();
  chatHistory = readScopedJSON('chat_history', [], getProgressNamespace());
  userMessageCount = readScopedNumber('message_count', 0, getProgressNamespace());
  solvedRiddle = readScopedJSON('solved_riddle', {}, getProgressNamespace());
}

function saveChatHistory() {
  writeScopedJSON('chat_history', chatHistory, getProgressNamespace());
}

function saveMessageCount() {
  writeScopedNumber('message_count', userMessageCount, getProgressNamespace());
}

function applySessionChrome() {
  document.documentElement.classList.toggle('jejak-hide-staff', activeSession?.role !== 'admin');
}

function resetDailyChatIfNeeded() {
  const todayStr = new Date().toDateString();
  const namespace = getProgressNamespace();
  const lastActiveDay = readScopedString('last_active_day', '', namespace);

  if (lastActiveDay !== todayStr) {
    userMessageCount = 0;
    writeScopedNumber('message_count', 0, namespace);
    writeScopedString('last_active_day', todayStr, namespace);
  }
}

function setupTextSizeControls() {
  const btnTextSizeReset = document.getElementById('btnTextSizeReset');
  const btnTextSizeLarge = document.getElementById('btnTextSizeLarge');
  const btnTextSizeSmall = document.getElementById('btnTextSizeSmall');
  let currentTextSize = Number.parseInt(
    localStorage.getItem(UI_TEXT_SIZE_KEY) || localStorage.getItem(LEGACY_UI_TEXT_SIZE_KEY) || '100',
    10,
  );
  if (!Number.isFinite(currentTextSize)) currentTextSize = 100;

  function applyTextSize(nextSize) {
    currentTextSize = Math.min(MAX_FONT_SIZE, Math.max(80, nextSize));
    document.documentElement.style.setProperty('--content-font-size', `${currentTextSize}%`);
    localStorage.setItem(UI_TEXT_SIZE_KEY, String(currentTextSize));
  }

  applyTextSize(currentTextSize);

  function bindTextSizeButton(button, delta) {
    if (!button || button.dataset.bound === 'true') return;
    button.dataset.bound = 'true';
    button.addEventListener('click', () => applyTextSize(currentTextSize + delta));
  }

  bindTextSizeButton(btnTextSizeSmall, -10);
  bindTextSizeButton(btnTextSizeLarge, 10);

  if (btnTextSizeReset && btnTextSizeReset.dataset.bound !== 'true') {
    btnTextSizeReset.dataset.bound = 'true';
    btnTextSizeReset.addEventListener('click', () => applyTextSize(100));
  }
}


function setupGameUIListeners() {
  if (gameUIBound) return;
  gameUIBound = true;

  document.getElementById('logoOverlay')?.addEventListener('click', () => {
    window.open('https://badanwarisanmalaysia.org/', '_blank');
  });

  const siteModal = document.getElementById('siteModal');
  const passportModal = document.getElementById('passportModal');
  const congratsModal = document.getElementById('congratsModal');

  siteModalController.bind({
    modal: siteModal,
    image: document.getElementById('siteModalImage'),
    label: document.getElementById('siteModalLabel'),
    title: document.getElementById('siteModalTitle'),
    info: document.getElementById('siteModalInfo'),
    quizArea: document.getElementById('siteModalQuizArea'),
    quizQuestion: document.getElementById('siteModalQuizQ'),
    quizOptions: document.getElementById('siteModalQuizOptions'),
    quizResult: document.getElementById('siteModalQuizResult'),
    closeButton: document.getElementById('closeSiteModal'),
    askAI: document.getElementById('siteModalAskAI'),
    directions: document.getElementById('siteModalDirections'),
    checkIn: document.getElementById('siteModalCheckInBtn'),
    solveChallenge: document.getElementById('siteModalSolveChallengeBtn'),
    more: document.getElementById('siteModalMore'),
    moreButton: document.getElementById('siteModalMoreBtn'),
    moreContent: document.getElementById('siteModalMoreContent'),
    food: document.getElementById('siteModalFoodBtn'),
    hotel: document.getElementById('siteModalHotelBtn'),
    hintText: document.getElementById('siteModalHintText'),
  });
  mapPreview.bind();

  passportController.bind({
    btnPassport: document.getElementById('btnPassport'),
    passportModal,
    closePassportModal: document.getElementById('closePassportModal'),
    passportInfo: document.getElementById('passportInfo'),
    passportGrid: document.getElementById('passportGrid'),
    progressBar: document.getElementById('progressBar'),
    progressText: document.getElementById('progressText'),
  });

  chatController.bind();
  challengeController.bind();
  badgeController.bind();
  directionsController.bind();

  const closeCongrats = document.getElementById('closeCongratsModal');
  if (closeCongrats && closeCongrats.dataset.bound !== 'true') {
    closeCongrats.dataset.bound = 'true';
    closeCongrats.addEventListener('click', () => modalManager.close(congratsModal));
  }

  const sharePassportBtn = document.getElementById('sharePassportBtn');
  if (sharePassportBtn && sharePassportBtn.dataset.bound !== 'true') {
    sharePassportBtn.dataset.bound = 'true';
    sharePassportBtn.addEventListener('click', () => {
      const payload = passportController.buildSharePayload();
      if (navigator.share) {
        navigator.share({ title: 'BWM KUL City Walk', text: payload.text, url: payload.url }).catch(console.error);
        return;
      }
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${payload.text}\n\nJoin the adventure: ${payload.url}`)}`, '_blank');
    });
  }

  const shareWhatsAppBtn = document.getElementById('shareWhatsAppBtn');
  if (shareWhatsAppBtn && shareWhatsAppBtn.dataset.bound !== 'true') {
    shareWhatsAppBtn.dataset.bound = 'true';
    shareWhatsAppBtn.addEventListener('click', () => {
    const payload = passportController.buildSharePayload();
    if (navigator.share) {
      navigator.share({ title: 'Mission Accomplished!', text: payload.text, url: payload.url }).catch(console.error);
      return;
    }
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${payload.text}\n\nDiscover KL's history and start your own adventure here: ${payload.url}`)}`, '_blank');
    });
  }

  const resetDemoProgressBtn = document.getElementById('resetDemoProgressBtn');
  if (resetDemoProgressBtn && resetDemoProgressBtn.dataset.bound !== 'true') {
    resetDemoProgressBtn.dataset.bound = 'true';
    resetDemoProgressBtn.addEventListener('click', () => {
      if (activeSession?.role !== 'demo') return;
      const confirmed = window.confirm('Reset your demo stamps, quiz progress, challenge progress, and local AI history on this device?');
      if (!confirmed) return;
      clearScopedProgress('demo');
      window.location.reload();
    });
  }

  window.addEventListener('popstate', () => {
    mapPreview.close();
    modalManager.closeTopmost();
  });

  setupTextSizeControls();
  chatController.loadHistory();
}

function bindAdminUI() {
  adminAccess.bindLogin({
    button: document.getElementById('adminLoginBtn'),
    input: document.getElementById('adminPasswordInput'),
    errorElement: document.getElementById('adminErrorMsg'),
    onSuccess: showAdminTools,
  });

  adminAccess.bindTools({
    generateBtn: document.getElementById('adminGenerateBtn'),
    shareBtn: document.getElementById('adminShareBtn'),
    statusMsg: document.getElementById('adminStatusMsg'),
    resultText: document.getElementById('passkeyResult'),
    logoutBtn: document.getElementById('adminLogoutBtn'),
    switchToMapBtn: document.getElementById('adminSwitchToMapBtn'),
  });
}

function showAdminTools() {
  document.documentElement.classList.remove('jejak-hide-staff');
  document.getElementById('adminLoginForm')?.classList.add('hidden');
  document.getElementById('adminResult')?.classList.remove('hidden');
  document.getElementById('passkeyDate')?.replaceChildren(document.createTextNode(STRINGS.auth.adminDate));
  document.getElementById('closeStaffScreen')?.classList.add('hidden');
  document.getElementById('btnAdminToggle')?.classList.remove('hidden');
}

function showAdminCode() {
  showOnly(['staff-screen']);
  notifyLifecycle({ activeView: 'admin' });
}

async function checkForURLPasskey() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  if (!code || activeSession?.authenticated) return;

  const cleanUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
  window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
  showOnly(['gatekeeper']);
  notifyLifecycle({ activeView: 'gatekeeper' });
  const input = document.getElementById('passcodeInput');
  if (input) input.value = code;
  await showPlatformWarning();
}

let isInitializingMap = false;

async function showMapExperience() {
  if (isInitializingMap) return;
  isInitializingMap = true;

  notifyLifecycle({ activeView: 'map' });
  applySessionChrome();
  loadScopedState();
  resetDailyChatIfNeeded();

  showOnly([]);

  // Ensure map container and page chrome (like progress container) are visible
  document.getElementById('map-container')?.classList.remove('hidden');
  document.getElementById('progress-container')?.classList.remove('hidden');

  const statePanel = document.getElementById('map-state-panel');
  if (statePanel) {
    statePanel.setAttribute('role', 'status');
    statePanel.setAttribute('aria-live', 'polite');
    statePanel.innerHTML = `
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3 mx-auto"></div>
      <p class="text-gray-700 font-medium text-sm">Loading heritage trail...</p>
    `;
    statePanel.classList.remove('hidden');
  }

  // Disable any existing retry button during init
  const existingRetryBtn = document.getElementById('btnMapRetry');
  if (existingRetryBtn) {
    existingRetryBtn.disabled = true;
    existingRetryBtn.classList.add('opacity-50', 'cursor-not-allowed');
  }

  try {
    setupGameUIListeners();
    await mapController.initMap();

    // Success: hide the state panel
    statePanel?.classList.add('hidden');

    bindMapUI({ controller: mapController, defaultCenter: DEFAULT_CENTER, defaultZoom: ZOOM });
    passportController.refreshProgress();
    chatController.updateCount();
    chatController.setDisabled(userMessageCount >= getChatLimit());

    const resetDemoProgressBtn = document.getElementById('resetDemoProgressBtn');
    if (resetDemoProgressBtn) {
      resetDemoProgressBtn.classList.toggle('hidden', activeSession?.role !== 'demo');
    }

    onboardingController.openWelcomeOnce();
  } catch (error) {
    console.error('Failed to load map experience:', error?.message || 'Unknown error');

    if (statePanel) {
      statePanel.setAttribute('role', 'alert');
      statePanel.removeAttribute('aria-live');
      statePanel.innerHTML = `
        <div class="text-red-500 text-3xl mb-2 mx-auto">⚠️</div>
        <h3 class="text-sm font-bold text-gray-900 mb-1">Unable to load the heritage trail.</h3>
        <p class="text-gray-600 text-xs mb-4">Check your connection and try again.</p>
        <button id="btnMapRetry" class="px-4 py-2 bg-indigo-600 text-white font-bold text-sm rounded-lg shadow hover:bg-indigo-700 active:scale-95 transition-all">
          Retry
        </button>
      `;
      statePanel.classList.remove('hidden');

      const retryBtn = document.getElementById('btnMapRetry');
      retryBtn?.addEventListener('click', () => {
        if (retryBtn.disabled) return;
        retryBtn.disabled = true;
        retryBtn.classList.add('opacity-50', 'cursor-not-allowed');
        showMapExperience();
      });
    }
  } finally {
    isInitializingMap = false;
  }
}

function showAdminExperience() {
  notifyLifecycle({ activeView: 'admin' });
  applySessionChrome();
  showOnly(['staff-screen']);
  bindAdminUI();
  showAdminTools();
}

function showLandingPage() {
  notifyLifecycle({ activeView: 'landing' });
  document.documentElement.classList.remove('jejak-hide-staff');
  showOnly(['landing-page']);
}

function setupAccessFlow() {
  [
    ['btnVisitor', 'join-event-button'],
    ['passcodeInput', 'visitor-passkey-input'],
    ['unlockBtn', 'visitor-passkey-submit'],
    ['map', 'map-experience'],
  ].forEach(([id, testId]) => {
    document.getElementById(id)?.setAttribute('data-testid', testId);
  });

  const landingScreen = createLandingScreen({
    notifyLifecycle,
    async onExploreDemo() {
      try {
        await demoAccess.start();
        await showMapExperience();
      } catch {
        window.alert('Unable to start the demo session. Please try again.');
      }
    },
    onVisitor() {},
    onStaff: showAdminCode,
    onBackHome: showLandingPage,
    onCloseStaff: showLandingPage,
  });

  landingScreen.init();
  bindAdminUI();

  const unlockBtn = document.getElementById('unlockBtn');
  if (unlockBtn && unlockBtn.dataset.bound !== 'true') {
    unlockBtn.dataset.bound = 'true';
    unlockBtn.addEventListener('click', async () => {
      const passcodeInput = document.getElementById('passcodeInput');
      const pendingPasskey = passcodeInput?.value.trim();
      if (!pendingPasskey) return;
      
      const session = await visitorAccess.submit(pendingPasskey, {
        button: document.getElementById('unlockBtn'),
        errorElement: document.getElementById('errorMsg'),
      });
      if (session?.authenticated) showMapExperience();
    });
  }
}

async function initApp() {
  try {
    activeSession = await refreshSession();
  } catch {
    activeSession = getCurrentSession();
  }

  notifyLifecycle({ session: activeSession });
  await checkForURLPasskey();

  if (activeSession?.authenticated) {
    if (activeSession.role === 'admin') showAdminExperience();
    else await showMapExperience();
    return;
  }

  showLandingPage();
  setupAccessFlow();
}

export function startLegacyApp(options = {}) {
  if (legacyStartPromise) return legacyStartPromise;

  lifecycleHandler = options.onLifecycleChange;
  legacyStartPromise = new Promise((resolve, reject) => {
    onDomReady(() => {
      try {
        onboardingController.bind();
        translationController.bind();
        resolve(initApp());
      } catch (error) {
        reject(error);
      }
    });
  });

  return legacyStartPromise;
}
