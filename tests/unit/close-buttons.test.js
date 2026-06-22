/* @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { createBadgeTemplate } from '../../src/features/badge/badge-template.js';
import { createChallengeTemplate } from '../../src/features/challenges/challenge-template.js';
import { createChatTemplate } from '../../src/features/chat/chat-template.js';
import { createDirectionsTemplate } from '../../src/features/directions/directions-template.js';
import { createOnboardingTemplate } from '../../src/features/onboarding/onboarding-template.js';
import { createPassportTemplate } from '../../src/features/passport/passport-template.js';
import { createSiteModalTemplate } from '../../src/features/sites/site-modal-template.js';

describe('icon-only close controls', () => {
  it('has modal-specific accessible names', () => {
    document.body.innerHTML = [
      createSiteModalTemplate(),
      createPassportTemplate(),
      createChatTemplate(),
      createDirectionsTemplate(),
      createBadgeTemplate(),
      createChallengeTemplate(),
      createOnboardingTemplate(),
    ].join('');

    expect(document.getElementById('closeSiteModal').getAttribute('aria-label')).toBe('Close site details');
    expect(document.getElementById('closePassportModal').getAttribute('aria-label')).toBe('Close passport');
    expect(document.getElementById('closeCongratsModal').getAttribute('aria-label')).toBe('Close completion message');
    expect(document.getElementById('closeChatModal').getAttribute('aria-label')).toBe('Close AI tour guide');
    expect(document.getElementById('closeDirectionsModal').getAttribute('aria-label')).toBe('Close directions');
    expect(document.getElementById('closeBadgeModal').getAttribute('aria-label')).toBe('Close explorer ID badge');
    expect(document.getElementById('closeChallengeModal').getAttribute('aria-label')).toBe('Close daily challenge');
    expect(document.getElementById('closePWAPrompt').getAttribute('aria-label')).toBe('Close install prompt');
    expect(document.getElementById('closePWAExplanation').getAttribute('aria-label')).toBe('Close PWA explanation');
    expect(document.getElementById('closeUserGuideModal').getAttribute('aria-label')).toBe('Close user guide');
  });
});
