export function createMapTemplate() {
  return `
    <div
      id="progress-container"
      data-map-chrome
      aria-hidden="true"
      class="hidden map-progress-region"
    >
      <div class="map-progress-card">
        <div class="map-progress-copy">
          <span>Trail progress</span>
          <strong id="progressText">0/11 Sites</strong>
        </div>
        <div class="map-progress-track" aria-hidden="true">
          <div id="progressBar" class="map-progress-value" style="width: 0%"></div>
        </div>
      </div>
    </div>

    <div id="map" aria-hidden="true" class="w-full h-[100dvh] z-10 hidden"></div>

    <div
      id="mapUtilityRail"
      data-map-chrome
      aria-hidden="true"
      class="hidden map-utility-rail"
      aria-label="Map controls"
    >
      <button id="btnUIZoomIn" aria-label="Zoom in" class="ui-icon-button map-utility-button">
        <span class="map-control-glyph" aria-hidden="true">+</span>
      </button>
      <button id="btnUIZoomOut" aria-label="Zoom out" class="ui-icon-button map-utility-button">
        <span class="map-control-glyph" aria-hidden="true">−</span>
      </button>
      <span class="map-utility-divider" aria-hidden="true"></span>
      <button id="btnRecenter" aria-label="Recenter map on the heritage trail" class="ui-icon-button map-utility-button" title="Recenter map">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="5"></circle>
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3"></path>
        </svg>
      </button>
      <button id="btnAdminToggle" aria-label="Open admin tools" class="ui-icon-button map-utility-button hidden" title="Admin tools">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"></path>
          <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6l-.08.08V20H10v-.08l-.08-.08a1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1L3.92 14H4v-4h-.08L4 9.92a1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.88L4.2 6.98 7.03 4.15l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6l.08-.08V4h4v.08l.08.08a1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.08.36.29.7.6 1l.08.08H20v4h-.08l-.08.08c-.31.3-.52.64-.6 1Z"></path>
        </svg>
      </button>
    </div>

    <div
      id="filterTabs"
      data-map-chrome
      aria-hidden="true"
      class="hidden map-filter-tabs"
      role="group"
      aria-label="Filter heritage sites"
    >
      <button id="tabMustVisit" class="map-filter-tab" aria-pressed="true">
        Must visit
      </button>
      <button id="tabRecommended" class="map-filter-tab" aria-pressed="false">
        Recommended
      </button>
    </div>
  `;
}
