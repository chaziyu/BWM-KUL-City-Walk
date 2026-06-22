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
import { createPassportController } from './src/features/passport/passport-controller.js';
import { createProgressService } from './src/features/passport/progress-service.js';
import { applyBadgeStatus } from './src/features/passport/progress-ui.js';
import { createSiteActions } from './src/features/sites/site-actions.js';
import { loadSiteData } from './src/features/sites/site-data.js';
import { createSiteModalController } from './src/features/sites/site-modal.js';
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
import { buildGoogleMapsUrls } from './src/utils/google-maps.js';
import {
  animateCloseModal,
  animateOpenModal,
  installModalKeyboardHandlers,
  openModalState,
} from './src/utils/modal.js';

const DEBUG = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const DEFAULT_BADGE_AVATAR = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 280"><rect width="240" height="280" fill="#f8f1dd"/><circle cx="120" cy="90" r="52" fill="#1a3c5e"/><path d="M40 248c12-52 50-84 80-84s68 32 80 84" fill="#1a3c5e"/></svg>')}`;
const allRiddles = [
  { q: "My 41-meter clock tower houses a one-ton bell that first chimed for Queen Victoria's birthday. What am I?", a: '1' },
  { q: 'I was designed by A.B. Hubback to perfectly match my famous neighbor, the Sultan Abdul Samad Building.', a: '2' },
  { q: 'I am a 6-storey Art Deco building named after a famous tin tycoon, Loke Yew.', a: '3' },
  { q: "I sit at the 'muddy confluence' of two rivers, the very birthplace of Kuala Lumpur.", a: '4' },
  { q: 'My Art Deco clock tower was built in 1937 to commemorate the coronation of King George VI.', a: '5' },
  { q: "I am KL's oldest Chinese temple, and I am uniquely angled to follow Feng Shui principles.", a: '6' },
  { q: "I am an unusual triangular building with no 'five-foot way' and whimsical garlic-shaped finials on my roof.", a: '7' },
  { q: 'In 1932, I was the tallest building in KL, standing at 85 feet. I also housed Radio Malaya.', a: '9' },
  { q: 'My prayer services are held in both Arabic and Tamil, a unique feature for a mosque in this area.', a: '11' },
  { q: "I am Malaysia's oldest existing jewellers, founded by a man who was shipwrecked!", a: '12' },
  { q: "I was KL's only theatre, but I was heavily damaged by a major fire in the 1980s.", a: '13' },
];

let legacyStartPromise = null;
let activeSession = getCurrentSession();
let allSiteData = [];
let mainSites = [];
let chatHistory = [];
let userMessageCount = 0;
let solvedRiddle = {};
let gameUIBound = false;
let deviceId = localStorage.getItem('bwm_device_id');

if (!deviceId) {
  deviceId = `device-${Math.random().toString(36).slice(2, 11)}`;
  localStorage.setItem('bwm_device_id', deviceId);
}

migrateData();

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

const siteActions = createSiteActions({
  strings: STRINGS,
  progressController: passportController,
  onMapRefresh: (siteId) => mapController.refreshVisitedState(siteId),
  openGoogleMaps,
  openChat(question) {
    const siteModal = document.getElementById('siteModal');
    const chatModal = document.getElementById('chatModal');
    const chatInput = document.getElementById('chatInput');
    siteModal?.classList.add('hidden');
    animateOpenModal(chatModal);
    if (chatInput) {
      chatInput.value = question;
      void handleSendMessage();
    }
  },
  playChaChing() {
    document.getElementById('chaChingSound')?.play?.();
  },
});

const siteModalController = createSiteModalController({
  strings: STRINGS,
  actions: siteActions,
  progressService,
  getChallengeState() {
    const day = getDayOfYear();
    const today = allRiddles[day % allRiddles.length];
    return {
      siteId: today.a,
      solved: solvedRiddle.day === day && solvedRiddle.id === today.a,
    };
  },
  onChallengeSelected(site) {
    const day = getDayOfYear();
    const today = allRiddles[day % allRiddles.length];
    solvedRiddle = { day, id: today.a };
    writeScopedJSON('solved_riddle', solvedRiddle, getProgressNamespace());
    document.getElementById('siteModal')?.classList.add('hidden');
    updateChallengeModal();
    animateOpenModal(document.getElementById('challengeModal'));
    if (typeof confetti === 'function') {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
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

function openGoogleMaps(lat, lon, mode, siteName = '') {
  const { externalUrl, embedUrl } = buildGoogleMapsUrls(lat, lon, mode);
  const directionsModal = document.getElementById('directionsModal');
  const directionsIframe = document.getElementById('directionsIframe');
  const directionsLoading = document.getElementById('directionsLoading');
  const directionsTitle = document.getElementById('directionsTitle');
  const externalMapsLink = document.getElementById('externalMapsLink');

  if (directionsTitle) {
    let titleText = 'Directions';
    let icon = 'Map';
    if (mode === 'restaurants') {
      titleText = `Food Near ${siteName || 'Site'}`;
      icon = 'Food';
    } else if (mode === 'hotels') {
      titleText = `Hotels Near ${siteName || 'Site'}`;
      icon = 'Hotel';
    } else if (mode === 'transit' || mode === 'directions') {
      titleText = `Transit to ${siteName || 'Site'}`;
      icon = 'Transit';
    } else if (mode === 'walk') {
      titleText = `Walk to ${siteName || 'Site'}`;
      icon = 'Walk';
    }
    directionsTitle.innerHTML = `<span>${icon}</span> ${titleText}`;
  }

  if (directionsModal && directionsIframe) {
    directionsLoading?.classList.remove('hidden');
    directionsIframe.onload = () => directionsLoading?.classList.add('hidden');
    directionsIframe.src = embedUrl;
    if (externalMapsLink) externalMapsLink.href = externalUrl;
    if (directionsModal.classList.contains('hidden')) animateOpenModal(directionsModal);
    return;
  }

  if (externalUrl) window.open(externalUrl, '_blank');
}

function getDayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now - start) / (1000 * 60 * 60 * 24));
}

function updateChallengeModal() {
  const challengeRiddle = document.getElementById('challengeRiddle');
  const challengeResult = document.getElementById('challengeResult');
  if (!challengeRiddle || !challengeResult) return;

  const day = getDayOfYear();
  const today = allRiddles[day % allRiddles.length];
  challengeRiddle.textContent = `"${today.q}"`;
  challengeResult.textContent =
    solvedRiddle.day === day && solvedRiddle.id === today.a
      ? STRINGS.game.challengeSolved
      : STRINGS.game.challengeHint;
}

function updateChatUIWithCount() {
  const chatLimitText = document.getElementById('chatLimitText');
  const remaining = getChatLimit() - userMessageCount;
  if (!chatLimitText) return;
  chatLimitText.textContent = `You have ${remaining} messages remaining.`;
  if (remaining <= 0) disableChatUI(true);
}

function disableChatUI(flag) {
  const chatInput = document.getElementById('chatInput');
  const chatSendBtn = document.getElementById('chatSendBtn');
  const chatLimitText = document.getElementById('chatLimitText');
  if (!chatInput || !chatSendBtn || !chatLimitText) return;

  chatInput.disabled = flag;
  chatSendBtn.disabled = flag;
  chatInput.placeholder = flag ? STRINGS.chat.limitReached : STRINGS.chat.placeholder;
  if (flag) chatLimitText.textContent = STRINGS.chat.limitReached;
}

function sanitizeRenderedHtml(html) {
  const template = document.createElement('template');
  template.innerHTML = html;
  const allowedTags = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'UL', 'OL', 'LI', 'A', 'CODE', 'PRE', 'BLOCKQUOTE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6']);
  const allowedProtocols = new Set(['http:', 'https:', 'mailto:', 'tel:']);

  function cleanNode(node) {
    if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent || '');
    if (node.nodeType !== Node.ELEMENT_NODE) return document.createDocumentFragment();

    const tagName = node.tagName.toUpperCase();
    const fragment = document.createDocumentFragment();
    if (!allowedTags.has(tagName)) {
      node.childNodes.forEach((child) => fragment.appendChild(cleanNode(child)));
      return fragment;
    }

    const cleanElement = document.createElement(tagName.toLowerCase());
    if (tagName === 'A') {
      const rawHref = node.getAttribute('href') || '';
      try {
        const url = new URL(rawHref, window.location.origin);
        if (allowedProtocols.has(url.protocol)) {
          cleanElement.href = url.href;
          cleanElement.target = '_blank';
          cleanElement.rel = 'noopener noreferrer';
        }
      } catch {}
    }

    node.childNodes.forEach((child) => cleanElement.appendChild(cleanNode(child)));
    return cleanElement;
  }

  const cleanFragment = document.createDocumentFragment();
  template.content.childNodes.forEach((node) => cleanFragment.appendChild(cleanNode(node)));
  return cleanFragment;
}

async function renderSafeMarkdown(container, text) {
  if (!container) return;
  container.replaceChildren();
  if (typeof marked === 'undefined') {
    container.textContent = text || '';
    return;
  }

  const rawHtml = await marked.parse(text || '');
  container.appendChild(sanitizeRenderedHtml(rawHtml));
}

function addChatMessage(role, text, options = {}) {
  const chatHistoryEl = document.getElementById('chatHistory');
  if (!chatHistoryEl) return null;

  const messageEl = document.createElement('div');
  const isUser = role === 'user';
  messageEl.className = `p-3 rounded-lg ${isUser ? 'bg-white text-gray-900 self-end' : 'bg-blue-100 text-blue-900 self-start'} max-w-xs shadow-sm chat-bubble`;

  const nameEl = document.createElement('p');
  nameEl.className = 'font-bold text-sm mb-1';
  nameEl.textContent = isUser ? STRINGS.chat.userName : STRINGS.chat.aiName;

  const contentEl = document.createElement('div');
  contentEl.className = 'chat-content';
  if (options.loading) {
    const loadingEl = document.createElement('span');
    loadingEl.className = 'skeleton-loading text-xs px-8 rounded';
    loadingEl.textContent = text;
    contentEl.appendChild(loadingEl);
  } else if (role === 'model') {
    void renderSafeMarkdown(contentEl, text);
  } else {
    contentEl.textContent = text;
  }

  messageEl.append(nameEl, contentEl);
  chatHistoryEl.appendChild(messageEl);
  chatHistoryEl.scrollTop = chatHistoryEl.scrollHeight;
  return messageEl;
}

function loadChatHistory() {
  const chatHistoryEl = document.getElementById('chatHistory');
  if (!chatHistoryEl) return;
  chatHistoryEl.innerHTML = '';
  chatHistory.forEach((msg) => {
    const text = msg.parts ? msg.parts[0].text : msg.text;
    addChatMessage(msg.role, text);
  });
}

async function handleSendMessage() {
  const chatInput = document.getElementById('chatInput');
  const chatSendBtn = document.getElementById('chatSendBtn');
  if (!chatInput || !chatSendBtn) return;

  const userQuery = chatInput.value.trim();
  const limit = getChatLimit();
  if (!userQuery || userMessageCount >= limit) {
    if (userMessageCount >= limit) disableChatUI(true);
    return;
  }

  chatInput.value = '';
  chatInput.disabled = true;
  chatSendBtn.disabled = true;

  addChatMessage('user', userQuery);
  const thinkingEl = addChatMessage('model', 'Loading...', { loading: true });

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'X-Jejak-Device': deviceId,
      },
      body: JSON.stringify({
        userQuery,
        history: chatHistory.slice(-HISTORY_WINDOW_SIZE),
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.reply || data.error || 'AI server error');

    chatHistory.push({ role: 'user', parts: [{ text: userQuery }] });
    chatHistory.push({ role: 'model', parts: [{ text: data.reply }] });
    saveChatHistory();

    userMessageCount += 1;
    saveMessageCount();
    updateChatUIWithCount();

    const thinkingContent = thinkingEl?.querySelector('.chat-content');
    await renderSafeMarkdown(thinkingContent, data.reply);
    thinkingEl?.classList.add('chat-bubble');
  } catch (error) {
    if (thinkingEl?.querySelector('.chat-content')) {
      thinkingEl.querySelector('.chat-content').textContent = error.message || STRINGS.chat.error;
      thinkingEl.classList.add('bg-red-100', 'text-red-900');
    }
  }

  if (userMessageCount < limit) {
    chatInput.disabled = false;
    chatSendBtn.disabled = false;
    chatInput.focus();
  } else {
    disableChatUI(true);
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target?.result || '');
    reader.onerror = () => reject(new Error('Could not read image file.'));
    reader.readAsDataURL(file);
  });
}

function waitForImage(image) {
  if (!image) return Promise.reject(new Error('Badge image element is missing.'));
  if (image.complete && image.naturalWidth > 0) return Promise.resolve(image);

  return new Promise((resolve, reject) => {
    const handleLoad = () => {
      cleanup();
      resolve(image);
    };
    const handleError = () => {
      cleanup();
      reject(new Error('Badge image failed to load.'));
    };
    const cleanup = () => {
      image.removeEventListener('load', handleLoad);
      image.removeEventListener('error', handleError);
    };

    image.addEventListener('load', handleLoad, { once: true });
    image.addEventListener('error', handleError, { once: true });
  });
}

function setupBadgeGeneration() {
  const badgeModal = document.getElementById('badgeInputModal');
  const closeBadgeBtn = document.getElementById('closeBadgeModal');
  const btnGenerate = document.getElementById('btnGenerateBadge');
  const nameInput = document.getElementById('explorerNameInput');
  const photoInput = document.getElementById('explorerPhotoInput');
  const badgeName = document.getElementById('badgeNameDisplay');
  const badgeDate = document.getElementById('badgeDateDisplay');
  const badgePhoto = document.getElementById('badgeProfileImage');

  if (!badgeModal || !btnGenerate || !badgeName || !badgeDate || !badgePhoto) return;
  if (btnGenerate.dataset.badgeBound === 'true') return;

  btnGenerate.dataset.badgeBound = 'true';
  badgePhoto.src = DEFAULT_BADGE_AVATAR;
  if (closeBadgeBtn) closeBadgeBtn.type = 'button';

  btnGenerate.addEventListener('click', async () => {
    const userName = nameInput.value.trim() || 'Master Explorer';
    const today = new Date();
    let nextPhotoSrc = DEFAULT_BADGE_AVATAR;

    btnGenerate.textContent = STRINGS.game.generatingBadge;
    btnGenerate.disabled = true;

    try {
      badgeName.textContent = userName;
      badgeDate.textContent = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
      if (photoInput.files?.[0]) nextPhotoSrc = await readFileAsDataUrl(photoInput.files[0]);
      badgePhoto.src = nextPhotoSrc;
      await waitForImage(badgePhoto);
      await captureAndDownloadBadge();
      document.getElementById('chaChingSound')?.play?.();
      btnGenerate.textContent = STRINGS.game.generateBadge;
    } catch (error) {
      btnGenerate.textContent = STRINGS.game.tryAgain;
      window.alert(STRINGS.game.badgeError);
    } finally {
      btnGenerate.disabled = false;
    }
  });
}

async function captureAndDownloadBadge() {
  const badgeElement = document.getElementById('hiddenBadgeTemplate');
  if (!badgeElement) throw new Error('Badge template not found.');

  badgeElement.style.opacity = '1';
  badgeElement.style.zIndex = '-50';

  try {
    const statusDisplay = document.getElementById('badgeStatusDisplay');
    const captionDisplay = document.getElementById('badgeCaptionDisplay');
    const statusStamp = document.getElementById('badgeStatusStamp');
    const state = progressService.getCompletionState();

    applyBadgeStatus({
      statusDisplay,
      captionDisplay,
      statusStamp,
      count: state.count,
      total: state.total,
      isComplete: state.isComplete,
      strings: STRINGS,
    });

    const canvas = await html2canvas(badgeElement, {
      scale: 2,
      backgroundColor: null,
    });

    const filename = `Heritage-Explorer-${Date.now()}.png`;
    const triggerDownload = (href) => {
      const link = document.createElement('a');
      link.download = filename;
      link.href = href;
      link.click();
    };

    if (typeof canvas.toBlob === 'function') {
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((value) => (value ? resolve(value) : reject(new Error('Canvas export failed.'))), 'image/png');
      });
      const objectUrl = URL.createObjectURL(blob);
      triggerDownload(objectUrl);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      return;
    }

    triggerDownload(canvas.toDataURL('image/png'));
  } finally {
    badgeElement.style.opacity = '0';
  }
}

function setupTextSizeControls() {
  const btnTextSizeReset = document.getElementById('btnTextSizeReset');
  const btnTextSizeLarge = document.getElementById('btnTextSizeLarge');
  const btnTextSizeSmall = document.getElementById('btnTextSizeSmall');
  let currentTextSize = 100;

  if (btnTextSizeSmall && btnTextSizeSmall.dataset.bound !== 'true') {
    btnTextSizeSmall.dataset.bound = 'true';
    btnTextSizeSmall.addEventListener('click', () => {
      if (currentTextSize > 80) currentTextSize -= 10;
      document.documentElement.style.setProperty('--content-font-size', `${currentTextSize}%`);
    });
  }

  if (btnTextSizeLarge && btnTextSizeLarge.dataset.bound !== 'true') {
    btnTextSizeLarge.dataset.bound = 'true';
    btnTextSizeLarge.addEventListener('click', () => {
      if (currentTextSize < MAX_FONT_SIZE) currentTextSize += 10;
      document.documentElement.style.setProperty('--content-font-size', `${currentTextSize}%`);
    });
  }

  if (btnTextSizeReset && btnTextSizeReset.dataset.bound !== 'true') {
    btnTextSizeReset.dataset.bound = 'true';
    btnTextSizeReset.addEventListener('click', () => {
      currentTextSize = 100;
      document.documentElement.style.setProperty('--content-font-size', '100%');
    });
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
    const explanationModal = document.getElementById('pwaExplanationModal');
    explanationModal?.classList.remove('hidden');
    document.getElementById('closePWAExplanation')?.addEventListener('click', () => explanationModal?.classList.add('hidden'), { once: true });
    document.getElementById('gotItPWABtn')?.addEventListener('click', () => explanationModal?.classList.add('hidden'), { once: true });
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

    modal?.classList.remove('hidden');

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
        modal?.classList.add('hidden');
        const session = await visitorAccess.submit(passkey, {
          button: document.getElementById('unlockBtn'),
          errorElement: document.getElementById('errorMsg'),
        });
        if (session?.authenticated) showMapExperience();
      };
    }

    if (cancelBtn) {
      cancelBtn.onclick = () => {
        modal?.classList.add('hidden');
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
  const chatModal = document.getElementById('chatModal');
  const welcomeModal = document.getElementById('welcomeModal');
  const challengeModal = document.getElementById('challengeModal');
  const badgeInputModal = document.getElementById('badgeInputModal');
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

  document.getElementById('btnChat')?.addEventListener('click', () => {
    animateOpenModal(chatModal);
    openModalState('chatModal');
  });
  document.getElementById('closeChatModal')?.addEventListener('click', () => animateCloseModal(chatModal));
  document.getElementById('chatSendBtn')?.addEventListener('click', handleSendMessage);
  document.getElementById('chatInput')?.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') void handleSendMessage();
  });

  document.getElementById('closeWelcomeModal')?.addEventListener('click', () => animateCloseModal(welcomeModal));
  document.getElementById('closeCongratsModal')?.addEventListener('click', () => animateCloseModal(congratsModal));
  document.getElementById('btnChallenge')?.addEventListener('click', () => {
    updateChallengeModal();
    animateOpenModal(challengeModal);
  });
  document.getElementById('closeChallengeModal')?.addEventListener('click', () => animateCloseModal(challengeModal));
  document.getElementById('closeBadgeModal')?.addEventListener('click', () => animateCloseModal(badgeInputModal));

  document.getElementById('sharePassportBtn')?.addEventListener('click', () => {
    const payload = passportController.buildSharePayload();
    if (navigator.share) {
      navigator.share({ title: 'BWM KUL City Walk', text: payload.text, url: payload.url }).catch(console.error);
      return;
    }
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${payload.text}\n\nJoin the adventure: ${payload.url}`)}`, '_blank');
  });

  document.getElementById('shareWhatsAppBtn')?.addEventListener('click', () => {
    const payload = passportController.buildSharePayload();
    if (navigator.share) {
      navigator.share({ title: 'Mission Accomplished!', text: payload.text, url: payload.url }).catch(console.error);
      return;
    }
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${payload.text}\n\nDiscover KL's history and start your own adventure here: ${payload.url}`)}`, '_blank');
  });

  document.getElementById('resetDemoProgressBtn')?.addEventListener('click', () => {
    if (activeSession?.role !== 'demo') return;
    const confirmed = window.confirm('Reset your demo stamps, quiz progress, challenge progress, and local AI history on this device?');
    if (!confirmed) return;
    clearScopedProgress('demo');
    window.location.reload();
  });

  const directionsModal = document.getElementById('directionsModal');
  const directionsIframe = document.getElementById('directionsIframe');
  const closeDirections = () => {
    animateCloseModal(directionsModal);
    if (directionsIframe) directionsIframe.src = '';
  };
  document.getElementById('closeDirectionsModal')?.addEventListener('click', closeDirections);
  document.getElementById('closeDirectionsModalBtn')?.addEventListener('click', closeDirections);

  window.addEventListener('popstate', () => {
    [siteModal, chatModal, passportModal, welcomeModal, congratsModal, challengeModal, badgeInputModal].forEach((modal) => {
      if (modal && !modal.classList.contains('hidden')) animateCloseModal(modal);
    });
  });

  setupTextSizeControls();
  setupBadgeGeneration();
  loadChatHistory();
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
  updateChatUIWithCount();
  disableChatUI(userMessageCount >= getChatLimit());

  const resetDemoProgressBtn = document.getElementById('resetDemoProgressBtn');
  if (resetDemoProgressBtn) {
    resetDemoProgressBtn.classList.toggle('hidden', activeSession?.role !== 'demo');
  }

  if (!sessionStorage.getItem('jejak_welcome_shown')) {
    document.getElementById('welcomeModal')?.classList.remove('hidden');
    sessionStorage.setItem('jejak_welcome_shown', 'true');
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

function setupUserGuideAndPwa() {
  const userGuideModal = document.getElementById('userGuideModal');
  document.getElementById('btnPreLoginHelp')?.addEventListener('click', () => userGuideModal?.classList.remove('hidden'));
  document.getElementById('closeUserGuideModal')?.addEventListener('click', () => userGuideModal?.classList.add('hidden'));
  document.getElementById('closeUserGuideModalBtn')?.addEventListener('click', () => userGuideModal?.classList.add('hidden'));

  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
  });

  window.addEventListener('load', () => {
    setTimeout(() => {
      if (getCurrentSession()?.authenticated) return;
      const dismissedUntil = localStorage.getItem('pwa_prompt_dismissed');
      if (dismissedUntil && Date.now() < Number.parseInt(dismissedUntil, 10)) return;

      const pwaPrompt = document.getElementById('pwaInstallPrompt');
      const installBtn = document.getElementById('pwaInstallBtn');
      const iosInstructions = document.getElementById('iosInstructions');
      const genericInstructions = document.getElementById('genericInstructions');
      if (!pwaPrompt || !installBtn || !iosInstructions || !genericInstructions) return;

      const ua = navigator.userAgent || navigator.vendor || window.opera;
      const isIos = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
      const isAndroid = /android/i.test(ua);

      iosInstructions.classList.toggle('hidden', !isIos);
      installBtn.classList.toggle('hidden', !(deferredPrompt && isAndroid));
      genericInstructions.classList.toggle('hidden', isIos || (deferredPrompt && isAndroid));
      pwaPrompt.classList.remove('hidden');

      installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
        pwaPrompt.classList.add('hidden');
      }, { once: true });
    }, 1000);
  });

  const dismissPrompt = () => {
    document.getElementById('pwaInstallPrompt')?.classList.add('hidden');
    localStorage.setItem('pwa_prompt_dismissed', String(Date.now() + (7 * 24 * 60 * 60 * 1000)));
  };
  document.getElementById('closePWAPrompt')?.addEventListener('click', dismissPrompt);
  document.getElementById('continueBrowser')?.addEventListener('click', dismissPrompt);
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
        installModalKeyboardHandlers();
        setupUserGuideAndPwa();
        resolve(initApp());
      } catch (error) {
        reject(error);
      }
    });
  });

  return legacyStartPromise;
}
