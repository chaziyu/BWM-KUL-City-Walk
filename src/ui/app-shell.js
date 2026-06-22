import { createAccessTemplate } from '../features/access/access-template.js';
import { createChallengeTemplate } from '../features/challenges/challenge-template.js';
import { createChatTemplate } from '../features/chat/chat-template.js';
import { createBadgeTemplate } from '../features/badge/badge-template.js';
import { createDirectionsTemplate } from '../features/directions/directions-template.js';
import { createMapTemplate } from '../features/map/map-template.js';
import { createOnboardingTemplate } from '../features/onboarding/onboarding-template.js';
import { createPassportTemplate } from '../features/passport/passport-template.js';
import { createSiteModalTemplate } from '../features/sites/site-modal-template.js';
import { createTranslationTemplate } from '../features/translation/translation-template.js';

export function renderAppShell(appRoot = document.getElementById('app')) {
  if (!appRoot || appRoot.dataset.mounted === 'true') return;

  appRoot.dataset.mounted = 'true';
  appRoot.innerHTML = `
    <div data-app-region="access">${createAccessTemplate()}</div>
    <div data-app-region="map">${createMapTemplate()}</div>
    <div data-app-region="translation">${createTranslationTemplate()}</div>
    <div data-app-region="floating-controls" class="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-4 z-[2500] flex gap-2">
      ${createChallengeTemplate().split('<div id="challengeModal"')[0]}
      ${createPassportTemplate().split('<div id="passportModal"')[0]}
      ${createChatTemplate().split('<div id="chatModal"')[0]}
    </div>
    <div data-app-region="modals">
      ${createOnboardingTemplate()}
      <div id="challengeMount">${createChallengeTemplate().replace(/^.*?(<div id="challengeModal")/s, '$1')}</div>
      <div id="passportMount">${createPassportTemplate().replace(/^.*?(<div id="passportModal")/s, '$1')}</div>
      <div id="chatMount">${createChatTemplate().replace(/^.*?(<div id="chatModal")/s, '$1')}</div>
      ${createSiteModalTemplate()}
      ${createDirectionsTemplate()}
      ${createBadgeTemplate()}
    </div>
    <audio id="chaChingSound" src="/audio/cha-ching.mp3" preload="auto"></audio>
  `;
}
