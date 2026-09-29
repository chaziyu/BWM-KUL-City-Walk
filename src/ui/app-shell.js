import { createAccessTemplate } from '../features/access/access-template.js';
import {
  createChallengeControlTemplate,
  createChallengeModalTemplate,
} from '../features/challenges/challenge-template.js';
import {
  createChatControlTemplate,
  createChatModalTemplate,
} from '../features/chat/chat-template.js';
import { createBadgeTemplate } from '../features/badge/badge-template.js';
import { createDirectionsTemplate } from '../features/directions/directions-template.js';
import { createMapTemplate } from '../features/map/map-template.js';
import { createOnboardingTemplate } from '../features/onboarding/onboarding-template.js';
import {
  createPassportControlTemplate,
  createPassportModalTemplate,
} from '../features/passport/passport-template.js';
import { createSiteModalTemplate } from '../features/sites/site-modal-template.js';
import { createTranslationTemplate } from '../features/translation/translation-template.js';

export function renderAppShell(appRoot = document.getElementById('app')) {
  if (!appRoot || appRoot.dataset.mounted === 'true') return;

  appRoot.dataset.mounted = 'true';
  appRoot.innerHTML = `
    <div data-app-region="access">${createAccessTemplate()}</div>
    <div data-app-region="map">${createMapTemplate()}</div>
    <div data-app-region="translation">${createTranslationTemplate()}</div>
    <nav data-app-region="floating-controls" data-map-chrome aria-hidden="true" aria-label="Trail actions" class="hidden map-action-dock">
      ${createChallengeControlTemplate()}
      ${createPassportControlTemplate()}
      ${createChatControlTemplate()}
    </nav>
    <div data-app-region="modals">
      ${createOnboardingTemplate()}
      <div id="challengeMount">${createChallengeModalTemplate()}</div>
      <div id="passportMount">${createPassportModalTemplate()}</div>
      <div id="chatMount">${createChatModalTemplate()}</div>
      ${createSiteModalTemplate()}
      ${createDirectionsTemplate()}
      ${createBadgeTemplate()}
    </div>
    <audio id="chaChingSound" src="/audio/cha-ching.mp3" preload="auto"></audio>
  `;
}
