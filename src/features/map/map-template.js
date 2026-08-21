export function createMapTemplate() {
  return `<div id="filterTabs" class="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom))] left-1/2 transform -translate-x-1/2 z-[2000] bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg rounded-2xl p-2 flex flex-col md:flex-row gap-2 w-48 md:w-auto transition-all">
        <button id="tabMustVisit" class="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 shadow-md transition-all">
            ✨ Must Visit
        </button>
        <button id="tabRecommended" class="w-full py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-all">
            Recommended
        </button>
    </div>
<div class="fixed top-[calc(5rem+env(safe-area-inset-top))] left-4 z-[1000] flex flex-col gap-2 pt-2">
        <button id="btnUIZoomIn" aria-label="Zoom In" class="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg text-2xl font-bold text-gray-700 hover:bg-gray-100 border border-gray-200 transition active:scale-95 flex items-center justify-center">
            +
        </button>
        <button id="btnUIZoomOut" aria-label="Zoom Out" class="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg text-2xl font-bold text-gray-700 hover:bg-gray-100 border border-gray-200 transition active:scale-95 flex items-center justify-center">
            -
        </button>
    </div>
<div id="progress-container" class="fixed top-[env(safe-area-inset-top)] left-0 w-full z-[1000] hidden px-4 pt-4">
        <div class="bg-white/90 backdrop-blur-sm shadow-lg rounded-full border border-gray-200 p-1 max-w-md mx-auto flex items-center">
            <div class="bg-gray-200 rounded-full h-3 w-full mx-3 relative overflow-hidden">
                <div id="progressBar" class="bg-gradient-to-r from-green-400 to-green-500 h-full w-0 transition-all duration-700 ease-out rounded-full">
                </div>
            </div>
            <span id="progressText" class="text-xs font-bold text-gray-700 whitespace-nowrap mr-2">0/11 Sites</span>
        </div>
    </div>
<div id="map-container" class="relative w-full h-[100dvh] z-10 hidden">
        <div id="map" class="w-full h-full"></div>
        <div id="map-state-panel" class="absolute inset-0 z-[500] bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 hidden"></div>
    </div>
<div class="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-4 z-[2500] flex flex-col gap-2">
        <button id="btnRecenter" aria-label="Recenter Map" class="bg-white/80 backdrop-blur-sm w-12 h-12 rounded-full shadow-xl hover:bg-gray-100 text-xl transition transform hover:scale-110 border border-gray-200" title="Back to Dataran Merdeka">📍</button>
    </div>
<div id="previewCard" class="fixed bottom-[env(safe-area-inset-bottom)] left-0 w-full bg-white rounded-t-2xl shadow-[0_-5px_20px_rgba(0,0,0,0.1)] z-[3000] transform transition-transform duration-300 translate-y-[150%] hidden flex flex-col pb-8">
        <div class="w-full flex justify-center pt-3 pb-1">
            <div class="w-12 h-1.5 bg-gray-300 rounded-full"></div>
        </div>
        <div class="p-4 flex gap-4 items-center">
            <img id="previewImage" src="" alt="Site" class="w-20 h-20 rounded-lg object-cover bg-gray-200">
            <div class="flex-1">
                <h3 id="previewTitle" class="text-lg font-bold text-gray-900 leading-tight mb-1">Site Name</h3>
                <p id="previewInfo" class="text-sm text-gray-700 mb-2 line-clamp-2"></p>
                <p id="previewDist" class="text-sm text-gray-500 mb-2">Tap for details</p>
                <button id="previewOpenBtn" class="text-blue-600 font-bold text-sm bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition">
                    Read Full History →
                </button>
            </div>
            <button id="previewCloseBtn" class="self-start text-gray-400 hover:text-gray-800 p-2 bg-gray-100 rounded-full">✕</button>
        </div>
    </div>`;
}
