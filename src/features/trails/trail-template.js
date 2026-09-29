export function createTrailControlTemplate() {
  return `<button id="btnTrails" aria-label="Open heritage threads" class="map-action-button">
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 5h10a4 4 0 0 1 4 4v10"></path>
      <path d="M5 5v14h14"></path>
      <circle cx="5" cy="5" r="2"></circle>
      <circle cx="19" cy="19" r="2"></circle>
      <path d="M9 9h6M9 13h4"></path>
    </svg>
    <span>Stories</span>
  </button>`;
}

export function createTrailModalTemplate() {
  return `<div id="trailModal" class="classic-modal-backdrop fixed inset-0 z-[9000] hidden" role="dialog" aria-modal="true" aria-labelledby="trailTitle">
    <div class="classic-modal-content passport-panel animate-fade-scale">
      <button id="closeTrailModal" aria-label="Close heritage threads" class="ui-icon-button passport-panel__close">×</button>
      <p class="ui-kicker">Heritage Threads</p>
      <h2 id="trailTitle" class="ui-title">Choose the story you want to walk</h2>
      <p class="ui-copy mb-4">Each thread connects nearby heritage stops into one narrative. The plan is generated locally and does not use AI or a paid routing API.</p>

      <label for="trailThemeSelect" class="block text-sm font-bold text-gray-800 mb-2">Story thread</label>
      <select id="trailThemeSelect" class="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm mb-4"></select>

      <div class="flex gap-2 mb-4" role="group" aria-label="Walk duration">
        <button type="button" data-trail-duration="30" class="ui-button ui-button--quiet flex-1">30 min</button>
        <button type="button" data-trail-duration="60" class="ui-button ui-button--secondary flex-1" aria-pressed="true">60 min</button>
        <button type="button" data-trail-duration="90" class="ui-button ui-button--quiet flex-1">90 min</button>
      </div>

      <div id="trailSummary" class="rounded-xl bg-gray-50 border border-gray-200 p-3 text-sm text-gray-700 mb-3" aria-live="polite">Choose a thread to build your walk.</div>
      <ol id="trailStops" class="space-y-2"></ol>
    </div>
  </div>`;
}
