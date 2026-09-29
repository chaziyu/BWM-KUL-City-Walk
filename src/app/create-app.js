import {
  DEFAULT_CENTER,
  HISTORY_WINDOW_SIZE,
  MAX_FONT_SIZE,
  MAX_MESSAGES_PER_SESSION,
  ZOOM,
} from '../config/app-config.js';
import { createAdminAccess } from '../features/access/admin-access.js';
import { createDemoAccess } from '../features/access/demo-access.js';
import { createLandingScreen } from '../features/access/landing-screen.js';
import { createVisitorAccess } from '../features/access/visitor-access.js';
import { createOpenFreeMapLayer } from '../features/map/basemap.js';
import { createMapController } from '../features/map/map-controller.js';
import { bindMapUI } from '../features/map/map-ui.js';
import { createBadgeController } from '../features/badge/badge-controller.js';
import { createChallengeController } from '../features/challenges/challenge-controller.js';
import { createChatController } from '../features/chat/chat-controller.js';
import { createDirectionsController } from '../features/directions/directions-controller.js';
import { createOnboardingController } from '../features/onboarding/onboarding-controller.js';
import { createPassportController } from '../features/passport/passport-controller.js';
import { createProgressService } from '../features/passport/progress-service.js';
import { createSiteActions } from '../features/sites/site-actions.js';
import { loadSiteData } from '../features/sites/site-data.js';
import { getMustVisitSites } from '../features/sites/site-domain.js';
import { createSiteModalController } from '../features/sites/site-modal.js';
import { createTranslationController } from '../features/translation/translation-controller.js';
import { STRINGS } from '../config/localization.js';
import { fireConfetti, renderMarkdown } from '../services/runtime-libs.js';
import { migrateData } from '../services/storage-migration.js';
import {
  endSession,
  getCurrentSession,
  refreshSession,
  startAdminSession,
  startDemoSession,
  startVisitorSession,
} from '../services/session-client.js';
import {
  clearScopedProgress,
  readScopedJSON,
  writeScopedJSON,
} from '../services/storage.js';
import { createModalManager } from '../ui/modal-manager.js';
import { showToast } from '../ui/toast.js';
import { createViewController } from './view-controller.js';

let appStartPromise = null;
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
  const generatedId = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2, 15);
  deviceId = `device-${generatedId}`;
  localStorage.setItem('bwm_device_id', deviceId);
}

migrateData();

const modalManager = createModalManager({
  appRoot: document.getElementById('app') || document,
  onModalStateChange({ activeModal }) {
    notifyLifecycle({ activeModal });
  },
});

const viewController = createViewController({
  onViewChange(activeView) {
    notifyLifecycle({ activeView });
  },
});

const progressService = createProgressService({
  getNamespace: () => activeSession.progressNamespace || 'visitor',
});

const mapController = createMapController({
  L: window.L,
  loadSites: loadSiteData,
  createBasemapLayer: createOpenFreeMapLayer,
  getIsCompleted: (siteId) => progressService.isCompleted(siteId),
  onSiteSelected: (site) => siteModalController.open(site),
  onSitesLoaded: (sites) => {
    allSiteData = sites;
    mainSites = getMustVisitSites(sites);
    progressService.setMainSites(mainSites);
    passportController.refreshProgress();
  },
  onLocationStatus({ message, severity }) {
    showToast(message, { severity });
  },
});

const passportController = createPassportController({
  strings: STRINGS,
  progressService,
  getMainSites: () => mainSites,
  modalManager,
  getCongratsModal: () => document.getElementById('congratsModal'),
  playCelebration() {
    const end = Date.now() + 3000;
    (function frame() {
      void fireConfetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 } });
      void fireConfetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 } });
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
  renderMarkdown,
  onSourceClick(siteId) {
    const site = allSiteData.find((item) => String(item.id) === String(siteId));
    if (!site) return;
    modalManager.close('chatModal');
    siteModalController.open(site);
  },
  saveHistory: saveChatHistory,
  setHistory: (nextHistory) => {
    chatHistory = nextHistory;
  },
  setMessageCount: (nextCount) => {
    userMessageCount = nextCount;
  },
  strings: STRINGS,
});

const directionsController = createDirectionsController({
  modalManager,
  onError(message) {
    showToast(message, { severity: 'error' });
  },
});
const badgeController = createBadgeController({ modalManager, progressService, strings: STRINGS });
const onboardingController = createOnboardingController({ getCurrentSession, modalManager });
const translationController = createTranslationController();

const challengeController = createChallengeController({
  getSolvedRiddle: () => solvedRiddle,
  modalManager,
  onSolved(next) {
    writeScopedJSON('solved_riddle', next, getProgressNamespace());
    void fireConfetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
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
    void openMapSafely();
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
  const remainingQuota = activeSession.remainingQuota;
  userMessageCount = remainingQuota !== null
    && remainingQuota !== undefined
    && Number.isFinite(Number(remainingQuota))
    ? Math.max(0, getChatLimit() - Number(remainingQuota))
    : 0;
  solvedRiddle = readScopedJSON('solved_riddle', {}, getProgressNamespace());
}

function saveChatHistory() {
  writeScopedJSON('chat_history', chatHistory, getProgressNamespace());
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

function setupPlatformWarning() {
  let pendingPasskey = '';

  function isPwaMode() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone || document.referrer.includes('android-app://');
  }

  function showPwaExplanation() {
    modalManager.open('pwaExplanationModal');
    document.getElementById('closePWAExplanation')?.addEventListener('click', () => modalManager.close('pwaExplanationModal'), { once: true });
    document.getElementById('gotItPWABtn')?.addEventListener('click', () => modalManager.close('pwaExplanationModal'), { once: true });
  }

  function getElements() {
    return {
      modal: document.getElementById('platformWarningModal'),
      warningContent: document.querySelector('#warningContent p'),
      continueBtn: document.getElementById('continueLoginBtn'),
      cancelBtn: document.getElementById('cancelLoginBtn'),
      passkeyDisplay: document.getElementById('passkeyDisplay'),
      copyBtn: document.getElementById('copyPasskeyBtn'),
      copySuccess: document.getElementById('copySuccess'),
      whatIsPWABtn: document.getElementById('whatIsPWABtn'),
    };
  }

  function bindWarningActions(elements) {
    const { modal, continueBtn, cancelBtn, passkeyDisplay, copyBtn, copySuccess, whatIsPWABtn } = elements;

    if (copyBtn && copyBtn.dataset.bound !== 'true') {
      copyBtn.dataset.bound = 'true';
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(pendingPasskey);
          copySuccess?.classList.remove('hidden');
          setTimeout(() => copySuccess?.classList.add('hidden'), 2000);
        } catch {
          passkeyDisplay?.select();
          document.execCommand('copy');
        }
      });
    }

    if (continueBtn && continueBtn.dataset.bound !== 'true') {
      continueBtn.dataset.bound = 'true';
      continueBtn.addEventListener('click', async () => {
        modalManager.close(modal);
        const session = await visitorAccess.submit(pendingPasskey, {
          button: document.getElementById('unlockBtn'),
          errorElement: document.getElementById('errorMsg'),
        });
        if (session?.authenticated) await openMapSafely();
      });
    }

    if (cancelBtn && cancelBtn.dataset.bound !== 'true') {
      cancelBtn.dataset.bound = 'true';
      cancelBtn.addEventListener('click', () => {
        modalManager.close(modal);
        const passcodeInput = document.getElementById('passcodeInput');
        if (passcodeInput) passcodeInput.value = '';
      });
    }

    if (whatIsPWABtn && whatIsPWABtn.dataset.bound !== 'true') {
      whatIsPWABtn.dataset.bound = 'true';
      whatIsPWABtn.addEventListener('click', showPwaExplanation);
    }
  }

  return async function showPlatformWarning() {
    const elements = getElements();
    const { modal, warningContent, passkeyDisplay } = elements;
    const passcodeInput = document.getElementById('passcodeInput');
    pendingPasskey = passcodeInput?.value || '';
    if (passkeyDisplay) passkeyDisplay.value = pendingPasskey;

    if (warningContent) {
      warningContent.textContent = isPwaMode()
        ? 'You are using the installed app view. Your passkey will be validated with this device.'
        : 'You are using the browser view. Your passkey will be validated with this device.';
    }

    modalManager.open(modal);
    bindWarningActions(elements);
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

  const btnAdminToggle = document.getElementById('btnAdminToggle');
  if (btnAdminToggle && btnAdminToggle.dataset.bound !== 'true') {
    btnAdminToggle.dataset.bound = 'true';
    btnAdminToggle.addEventListener('click', () => {
      if (activeSession?.role === 'admin') showAdminExperience();
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
  viewController.transitionTo('admin');
}

async function checkForURLPasskey() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  if (!code || activeSession?.authenticated) return;

  const cleanUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
  window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
  viewController.transitionTo('gatekeeper');
  const input = document.getElementById('passcodeInput');
  if (input) input.value = code;
  await showPlatformWarning();
}

async function syncActiveSession() {
  let refreshed;
  try {
    refreshed = await refreshSession();
  } catch {
    return;
  }

  if (!refreshed?.authenticated) {
    activeSession = refreshed;
    notifyLifecycle({ session: activeSession });
    throw new Error('Your session has expired. Please sign in again.');
  }

  activeSession = refreshed;
  notifyLifecycle({ session: activeSession });
}

async function showMapExperience() {
  await syncActiveSession();
  viewController.applySessionCapabilities(activeSession);
  loadScopedState();
  viewController.transitionTo('map');

  setupGameUIListeners();
  await mapController.initMap();
  bindMapUI({ controller: mapController, defaultCenter: DEFAULT_CENTER, defaultZoom: ZOOM });
  passportController.refreshProgress();
  chatController.updateCount();
  chatController.setDisabled(false);

  const resetDemoProgressBtn = document.getElementById('resetDemoProgressBtn');
  if (resetDemoProgressBtn) {
    resetDemoProgressBtn.classList.toggle('hidden', activeSession?.role !== 'demo');
  }

  onboardingController.openWelcomeOnce();
}

async function openMapSafely() {
  try {
    await showMapExperience();
    return true;
  } catch (error) {
    console.error('Unable to load the heritage map:', error);
    mapController.destroyMap();
    viewController.transitionTo('map-error');

    const message = document.getElementById('mapErrorMessage');
    if (message) {
      message.textContent = error?.message
        ? `The heritage map could not be loaded: ${error.message}`
        : 'The heritage map could not be loaded. Check your connection and try again.';
    }
    showToast('Unable to load the heritage map. You can retry without losing your session.', {
      severity: 'error',
    });
    return false;
  }
}

function showAdminExperience() {
  mapController.destroyMap();
  viewController.applySessionCapabilities(activeSession);
  viewController.transitionTo('admin');
  bindAdminUI();
  showAdminTools();
}

function showLandingPage() {
  mapController.destroyMap();
  viewController.transitionTo('landing');
}

function setupAccessFlow() {
  [
    ['btnVisitor', 'join-event-button'],
    ['passcodeInput', 'visitor-passkey-input'],
    ['unlockBtn', 'visitor-passkey-submit'],
    ['platformWarningModal', 'platform-warning'],
    ['continueLoginBtn', 'platform-warning-continue'],
    ['map', 'map-experience'],
  ].forEach(([id, testId]) => {
    document.getElementById(id)?.setAttribute('data-testid', testId);
  });

  const landingScreen = createLandingScreen({
    notifyLifecycle({ activeView }) {
      if (activeView) viewController.transitionTo(activeView);
    },
    async onExploreDemo() {
      try {
        await demoAccess.start();
      } catch {
        window.alert('Unable to start the demo session. Please try again.');
        return;
      }

      await openMapSafely();
    },
    onVisitor() {},
    onStaff: showAdminCode,
    onBackHome: showLandingPage,
    onCloseStaff: showLandingPage,
  });

  landingScreen.init();
  bindAdminUI();

  const retryMapBtn = document.getElementById('retryMapBtn');
  if (retryMapBtn && retryMapBtn.dataset.bound !== 'true') {
    retryMapBtn.dataset.bound = 'true';
    retryMapBtn.addEventListener('click', () => void openMapSafely());
  }

  const mapErrorBackBtn = document.getElementById('mapErrorBackBtn');
  if (mapErrorBackBtn && mapErrorBackBtn.dataset.bound !== 'true') {
    mapErrorBackBtn.dataset.bound = 'true';
    mapErrorBackBtn.addEventListener('click', () => {
      if (activeSession?.role === 'admin') showAdminExperience();
      else showLandingPage();
    });
  }

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
  setupAccessFlow();
  await checkForURLPasskey();

  if (activeSession?.authenticated) {
    if (activeSession.role === 'admin') showAdminExperience();
    else await openMapSafely();
    return;
  }

  showLandingPage();
}

export function createApp(options = {}) {
  if (appStartPromise) return appStartPromise;

  lifecycleHandler = options.onLifecycleChange;
  appStartPromise = new Promise((resolve, reject) => {
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

  return appStartPromise;
}
