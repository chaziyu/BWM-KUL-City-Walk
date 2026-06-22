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
import { bindMapUI } from './src/features/map/map-ui.js';
import { createBadgeController } from './src/features/badge/badge-controller.js';
import { createChallengeController } from './src/features/challenges/challenge-controller.js';
import { createChatController } from './src/features/chat/chat-controller.js';
import { createDirectionsController } from './src/features/directions/directions-controller.js';
import { createOnboardingController } from './src/features/onboarding/onboarding-controller.js';
import { createPassportController } from './src/features/passport/passport-controller.js';
import { createProgressService } from './src/features/passport/progress-service.js';
import { createSiteActions } from './src/features/sites/site-actions.js';
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

const mapController = createMapController({
  L: window.L,
  loadSites: loadSiteData,
  getIsCompleted: (siteId) => progressService.isCompleted(siteId),
  onSiteSelected: (site) => siteModalController.open(site),
  onSitesLoaded: (sites) => {
    allSiteData = sites;
    mainSites = sites.filter((site) => /^\d+$/.test(String(site.id)));
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
  historyWindowSize: HISTORY_WINDOW_SIZE,
  modalManager,
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
  openChat(site) {
    modalManager.close('siteModal');
    chatController.open({ site });
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
  const btnUIZoomIn = document.getElementById('btnUIZoomIn');
  const btnUIZoomOut = document.getElementById('btnUIZoomOut');
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
  bindTextSizeButton(btnUIZoomOut, -10);
  bindTextSizeButton(btnUIZoomIn, 10);

  if (btnTextSizeReset && btnTextSizeReset.dataset.bound !== 'true') {
    btnTextSizeReset.dataset.bound = 'true';
    btnTextSizeReset.addEventListener('click', () => applyTextSize(100));
  }
}

function setupPlatformWarning() {
  const modal = document.getElementById('platformWarningModal');
  const warningContent = document.querySelector('#warningContent p');
  const continueBtn = document.getElementById('continueLoginBtn');
  const cancelBtn = document.getElementById('cancelLoginBtn');
  const passkeyDisplay = document.getElementById('passkeyDisplay');
  const copyBtn = document.getElementById('copyPasskeyBtn');
  const copySuccess = document.getElementById('copySuccess');
  const whatIsPWABtn = document.getElementById('whatIsPWABtn');

  function isPwaMode() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone || document.referrer.includes('android-app://');
  }

  function showPwaExplanation() {
    modalManager.open('pwaExplanationModal');
    document.getElementById('closePWAExplanation')?.addEventListener('click', () => modalManager.close('pwaExplanationModal'), { once: true });
    document.getElementById('gotItPWABtn')?.addEventListener('click', () => modalManager.close('pwaExplanationModal'), { once: true });
  }

  return async function showPlatformWarning() {
    const passcodeInput = document.getElementById('passcodeInput');
    const passkey = passcodeInput?.value || '';
    if (passkeyDisplay) passkeyDisplay.value = passkey;

    if (warningContent) {
      warningContent.innerHTML = isPwaMode()
        ? "<strong>You're using the PWA (App Mode)</strong><br><br>Once you log in here, this passkey will be locked to the <strong>PWA only</strong>."
        : "<strong>You're using a Browser</strong><br><br>Once you log in here, this passkey will be locked to <strong>browser mode only</strong>.";
    }

    modalManager.open(modal);

    if (copyBtn) {
      copyBtn.onclick = async () => {
        try {
          await navigator.clipboard.writeText(passkey);
          copySuccess?.classList.remove('hidden');
          setTimeout(() => copySuccess?.classList.add('hidden'), 2000);
        } catch {
          passkeyDisplay?.select();
          document.execCommand('copy');
        }
      };
    }

    if (continueBtn) {
      continueBtn.onclick = async () => {
        modalManager.close(modal);
        const session = await visitorAccess.submit(passkey, {
          button: document.getElementById('unlockBtn'),
          errorElement: document.getElementById('errorMsg'),
        });
        if (session?.authenticated) showMapExperience();
      };
    }

    if (cancelBtn) {
      cancelBtn.onclick = () => {
        modalManager.close(modal);
        if (passcodeInput) passcodeInput.value = '';
      };
    }

    if (whatIsPWABtn) whatIsPWABtn.onclick = showPwaExplanation;
  };
}

const showPlatformWarning = setupPlatformWarning();

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

async function showMapExperience() {
  notifyLifecycle({ activeView: 'map' });
  applySessionChrome();
  loadScopedState();
  resetDailyChatIfNeeded();

  showOnly([]);
  document.getElementById('progress-container')?.classList.remove('hidden');
  document.getElementById('map')?.classList.remove('hidden');

  setupGameUIListeners();
  await mapController.initMap();
  bindMapUI({ controller: mapController, defaultCenter: DEFAULT_CENTER, defaultZoom: ZOOM });
  passportController.refreshProgress();
  chatController.updateCount();
  chatController.setDisabled(userMessageCount >= getChatLimit());

  const resetDemoProgressBtn = document.getElementById('resetDemoProgressBtn');
  if (resetDemoProgressBtn) {
    resetDemoProgressBtn.classList.toggle('hidden', activeSession?.role !== 'demo');
  }

  onboardingController.openWelcomeOnce();
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
      if (!passcodeInput?.value.trim()) return;
      await showPlatformWarning();
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
