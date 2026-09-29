export function createDirectionsTemplate() {
  return `
    <div id="directionsModal" class="modern-modal-backdrop fixed inset-0 z-[8500] hidden" role="dialog" aria-modal="true" aria-labelledby="directionsTitle">
      <div class="modern-modal-content animate-fade-scale flex flex-col h-[85vh] max-w-4xl">
        <div class="flex justify-between items-center p-4 border-b bg-white rounded-t-3xl">
          <h2 id="directionsTitle" class="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span>🗺️</span> Directions
          </h2>
          <button id="closeDirectionsModal" aria-label="Close directions" class="text-gray-400 hover:text-gray-800 text-2xl transition">×</button>
        </div>

        <div class="bg-blue-50 border-b border-blue-100 px-4 py-2.5">
          <p id="directionsContextText" class="text-xs text-blue-800">
            Preview the route below, then open Google Maps for full navigation.
          </p>
        </div>

        <div id="directionsRouteRegion" class="flex-1 bg-gray-100 flex flex-col overflow-hidden relative">
          <div id="directionsLoading" class="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div class="flex flex-col items-center gap-4">
              <div class="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p id="directionsLoadingText" class="text-sm font-bold text-gray-600 animate-pulse">Loading route...</p>
            </div>
          </div>
          <iframe
            id="directionsIframe"
            title="Google Maps route preview"
            class="w-full h-full border-none"
            allowfullscreen=""
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>

        <div id="directionsSearchRegion" class="hidden flex-1 bg-gray-50 px-6 py-8 items-center justify-center text-center">
          <div class="max-w-lg">
            <div id="directionsSearchIcon" class="text-6xl mb-4">📍</div>
            <h3 id="directionsSearchTitle" class="text-xl font-bold text-gray-900 mb-2">Nearby search</h3>
            <p id="directionsSearchText" class="text-sm text-gray-600">
              Open Google Maps to browse current nearby results.
            </p>
          </div>
        </div>

        <div class="p-5 border-t bg-gradient-to-br from-white to-gray-50 rounded-b-3xl">
          <div class="mb-3 text-center">
            <p id="directionsFooterLead" class="text-xs text-gray-600 mb-1">
              <strong>Want full route details and options?</strong>
            </p>
            <p id="directionsFooterDetail" class="text-xs text-gray-500">
              Open Google Maps for step-by-step directions.
            </p>
          </div>

          <div class="flex flex-col gap-3">
            <a
              id="externalMapsLink"
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              class="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-4 px-6 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] text-center flex items-center justify-center gap-3"
            >
              <span id="externalMapsLinkText" class="text-lg">Open in Google Maps</span>
              <span id="externalMapsLinkBadge" class="bg-white/20 px-2 py-0.5 rounded-full text-xs">View Route</span>
            </a>
            <button id="closeDirectionsModalBtn" class="bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-200 transition-all duration-200 text-center">
              ← Back to Heritage Walk
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}
