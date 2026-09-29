export function createTrailControlTemplate() {
  return `<button id="btnTrails" aria-label="Open story walks" class="map-action-button">
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 5h10a4 4 0 0 1 4 4v10"></path>
      <path d="M5 5v14h14"></path>
      <circle cx="5" cy="5" r="2"></circle>
      <circle cx="19" cy="19" r="2"></circle>
      <path d="M9 9h6M9 13h4"></path>
    </svg>
    <span>Story Walks</span>
  </button>`;
}

export function createTrailModalTemplate() {
  return `<div id="trailModal" class="classic-modal-backdrop fixed inset-0 z-[9000] hidden" role="dialog" aria-modal="true" aria-labelledby="trailTitle">
    <div class="classic-modal-content trail-panel animate-fade-scale">
      <header class="trail-panel__header">
        <div>
          <p class="ui-kicker">Story Walks</p>
          <h2 id="trailTitle" class="ui-title">Choose a story to walk</h2>
          <p class="ui-copy trail-panel__intro">Choose a theme and how much time you have. We’ll shape a walk through connected heritage stops.</p>
        </div>
        <button id="closeTrailModal" aria-label="Close story walks" class="ui-icon-button trail-panel__close">×</button>
      </header>

      <div class="trail-panel__controls">
        <label for="trailThemeSelect" class="ui-field-label">Story</label>
        <select id="trailThemeSelect" class="ui-field trail-select"></select>

        <fieldset class="trail-duration">
          <legend class="ui-field-label">Time available</legend>
          <div class="trail-duration__tabs" role="group" aria-label="Walk duration">
            <button type="button" data-trail-duration="30" class="trail-duration__button" aria-pressed="false">30 min</button>
            <button type="button" data-trail-duration="60" class="trail-duration__button" aria-pressed="true">60 min</button>
            <button type="button" data-trail-duration="90" class="trail-duration__button" aria-pressed="false">90 min</button>
          </div>
        </fieldset>

        <div id="trailSummary" class="trail-summary" aria-live="polite">
          <p class="trail-summary__meta">Preparing your walk…</p>
        </div>
      </div>

      <div class="trail-panel__route">
        <ol id="trailStops" class="trail-stop-list" aria-label="Story walk stops"></ol>
      </div>
    </div>
  </div>`;
}
