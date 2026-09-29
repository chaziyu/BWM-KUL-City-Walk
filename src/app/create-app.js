import {
  DEFAULT_CENTER,
  HISTORY_WINDOW_SIZE,
  MAX_FONT_SIZE,
  MAX_MESSAGES_PER_SESSION,
  ZOOM,
} from '../config/app-config.js';
import { createAdminAccess } from '../features/access/admin-access.js';
import { createDemoAccess } from '../features/access/demo-access.js';
import { createPlatformWarningController } from '../features/access/platform-warning-controller.js';
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
import { createTrailController } from '../features/trails/trail-controller.js';
import { loadTrailData } from '../features/trails/trail-data.js';
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
import { createTextSizeController } from '../ui/text-size-controller.js';
import { createAccessFlow } from './access-flow.js';
import { createGameUiBindings } from './game-ui-bindings.js';
import { createViewController } from './view-controller.js';

let appStartPromise = null;
let activeSession = getCurrentSession();
let allSiteData = [];
let mainSites = [];
let chatHistory = [];
let userMessageCount = 0;
let solvedRiddle = {};
let deviceId = localStorage.getItem('bwm_device_id');
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

const trailController = createTrailController({
  getSites: () => allSiteData,
  loadTrails: loadTrailData,
  modalManager,
  onSiteSelected(site) {
    siteModalController.open(site);
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

const textSizeController = createTextSizeController({
  maxFontSize: MAX_FONT_SIZE,
});

const platformWarningController = createPlatformWarningController({
  modalManager,
  visitorAccess,
  onAuthenticated() {
    return openMapSafely();
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

const gameUiBindings = createGameUiBindings({
  badgeController,
  challengeController,
  chatController,
  directionsController,
  getSession: () => activeSession,
  modalManager,
  onShowAdmin: showAdminExperience,
  passportController,
  resetDemoProgress() {
    clearScopedProgress('demo');
  },
  siteModalController,
  textSizeController,
  trailController,
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

function showAdminLogin() {
  document.getElementById('adminLoginForm')?.classList.remove('hidden');
  document.getElementById('adminResult')?.classList.add('hidden');
  document.getElementById('closeStaffScreen')?.classList.remove('hidden');
  document.getElementById('btnAdminToggle')?.classList.add('hidden');

  const passwordInput = document.getElementById('adminPasswordInput');
  if (passwordInput) {
    passwordInput.value = '';
    window.setTimeout(() => passwordInput.focus(), 0);
  }

  const errorElement = document.getElementById('adminErrorMsg');
  errorElement?.classList.add('hidden');
  if (errorElement) errorElement.textContent = '';
}

function showAdminTools() {
  document.documentElement.classList.remove('jejak-hide-staff');
  document.getElementById('adminLoginForm')?.classList.add('hidden');
  document.getElementById('adminResult')?.classList.remove('hidden');
  document.getElementById('passkeyDate')?.replaceChildren(document.createTextNode(STRINGS.auth.adminDate));
  document.getElementById('closeStaffScreen')?.classList.remove('hidden');
  document.getElementById('btnAdminToggle')?.classList.remove('hidden');
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

  gameUiBindings.bind();
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

  if (activeSession?.authenticated && activeSession.role === 'admin') {
    showAdminTools();
    return;
  }

  showAdminLogin();
}

function showLandingPage() {
  mapController.destroyMap();
  viewController.transitionTo('landing');
}

const accessFlow = createAccessFlow({
  bindAdminUI,
  demoAccess,
  getSession: () => activeSession,
  onShowAdmin: showAdminExperience,
  onShowLanding: showLandingPage,
  onShowMap: openMapSafely,
  platformWarningController,
  viewController,
});

async function initApp() {
  try {
    activeSession = await refreshSession();
  } catch {
    activeSession = getCurrentSession();
  }

  notifyLifecycle({ session: activeSession });
  accessFlow.bind();
  await accessFlow.checkForUrlPasskey();

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
