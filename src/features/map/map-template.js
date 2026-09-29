export function createMapTemplate() {
  return `
    <div
      id="filterTabs"
      data-map-chrome
      aria-hidden="true"
      class="hidden fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-[2000] bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg rounded-2xl p-2 flex flex-col md:flex-row gap-2 w-48 md:w-auto transition-all"
    >
      <button id="tabMustVisit" class="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 shadow-md transition-all">
        ✨ Must Visit
      </button>
      <button id="tabRecommended" class="w-full py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-all">
        Recommended
      </button>
    </div>

    <div
      data-map-chrome
      aria-hidden="true"
      class="hidden fixed top-[calc(5rem+env(safe-area-inset-top))] left-4 z-[1000] flex flex-col gap-2 pt-2"
    >
      <button id="btnUIZoomIn" aria-label="Zoom In" class="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg text-2xl font-bold text-gray-700 hover:bg-gray-100 border border-gray-200 transition active:scale-95 flex items-center justify-center">+</button>
      <button id="btnUIZoomOut" aria-label="Zoom Out" class="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg text-2xl font-bold text-gray-700 hover:bg-gray-100 border border-gray-200 transition active:scale-95 flex items-center justify-center">−</button>
    </div>

    <div
      id="progress-container"
      data-map-chrome
      aria-hidden="true"
      class="hidden fixed top-[env(safe-area-inset-top)] left-0 w-full z-[1000] px-4 pt-4"
    >
      <div class="bg-white/90 backdrop-blur-sm shadow-lg rounded-full border border-gray-200 p-1 max-w-md mx-auto flex items-center">
        <div class="bg-gray-200 rounded-full h-3 w-full mx-3 relative overflow-hidden">
          <div id="progressBar" class="bg-gradient-to-r from-green-400 to-green-500 h-full w-0 transition-all duration-700 ease-out rounded-full"></div>
        </div>
        <span id="progressText" class="text-xs font-bold text-gray-700 whitespace-nowrap mr-2">0/11 Sites</span>
      </div>
    </div>

    <div id="map" aria-hidden="true" class="w-full h-[100dvh] z-10 hidden"></div>

    <div
      data-map-chrome
      aria-hidden="true"
      class="hidden fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-4 z-[2500] flex flex-col gap-2"
    >
      <button id="btnAdminToggle" aria-label="Toggle Stats / Admin Tools" class="bg-indigo-600 text-white w-12 h-12 rounded-full shadow-2xl hover:bg-indigo-700 transition transform hover:scale-105 border-2 border-indigo-400 hidden flex items-center justify-center text-xl" title="Switch to Admin Tools">🛠️</button>
      <button id="btnRecenter" aria-label="Recenter Map" class="bg-white/80 backdrop-blur-sm w-12 h-12 rounded-full shadow-xl hover:bg-gray-100 text-xl transition transform hover:scale-110 border border-gray-200" title="Back to Dataran Merdeka">📍</button>
    </div>
  `;
}
