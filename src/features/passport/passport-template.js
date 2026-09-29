export function createPassportControlTemplate() {
  return `<button id="btnPassport" aria-label="Open my passport" class="map-action-button">
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="3" width="14" height="18" rx="2"></rect>
      <circle cx="12" cy="10" r="3"></circle>
      <path d="M9 16h6"></path>
    </svg>
    <span>Passport</span>
  </button>`;
}

export function createPassportModalTemplate() {
  return `<div id="passportModal" class="classic-modal-backdrop fixed inset-0 z-[9000] hidden" role="dialog" aria-modal="true" aria-labelledby="passportTitle">
    <div class="classic-modal-content passport-panel animate-fade-scale">
      <button id="closePassportModal" aria-label="Close passport" class="ui-icon-button passport-panel__close">×</button>
      <p class="ui-kicker">Your trail</p>
      <h2 id="passportTitle" class="ui-title">My Passport</h2>
      <p id="passportInfo" class="ui-copy passport-panel__info">Visited <span id="visitedCount">0</span> of 11 heritage buildings in Kuala Lumpur</p>
      <div id="passportGrid" class="passport-panel__grid"></div>
      <div class="passport-panel__actions">
        <button id="createBadgeFromPassportBtn" class="ui-button ui-button--primary">Create Explorer ID</button>
        <button id="sharePassportBtn" class="ui-button ui-button--secondary">Share progress</button>
        <button id="resetDemoProgressBtn" class="hidden ui-button ui-button--quiet passport-reset-button">Reset demo progress</button>
      </div>
    </div>
  </div>
  <div id="congratsModal" class="classic-modal-backdrop fixed inset-0 z-[9000] flex hidden" role="dialog" aria-modal="true" aria-labelledby="congratsTitle">
    <div class="classic-modal-content passport-panel passport-panel--complete animate-fade-scale">
      <button id="closeCongratsModal" aria-label="Close completion message" class="ui-icon-button passport-panel__close">×</button>
      <div class="status-symbol" aria-hidden="true">✓</div>
      <p class="ui-kicker">Trail complete</p>
      <h2 id="congratsTitle" class="ui-title">You completed the city walk</h2>
      <p class="ui-copy">You have visited all 11 heritage buildings in Kuala Lumpur and completed the BWM KUL City Walk Passport.</p>
      <div class="passport-panel__actions">
        <button id="createBadgeFromCongratsBtn" class="ui-button ui-button--primary">Claim Explorer ID</button>
        <button id="shareWhatsAppBtn" class="ui-button ui-button--secondary">Share completion</button>
      </div>
    </div>
  </div>`;
}

export function createPassportTemplate() {
  return `${createPassportControlTemplate()}
${createPassportModalTemplate()}`;
}
