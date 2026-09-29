export function createPassportControlTemplate() {
  return '<button id="btnPassport" aria-label="My Passport" class="bg-white/80 backdrop-blur-sm p-3 rounded-full shadow-xl hover:bg-gray-100 text-2xl transition transform hover:scale-110 border border-gray-200">🛂</button>';
}

export function createPassportModalTemplate() {
  return `<div id="passportModal" class="classic-modal-backdrop fixed inset-0 z-[9000] hidden" role="dialog" aria-modal="true" aria-labelledby="passportTitle">
    <div class="classic-modal-content p-6 text-center animate-fade-scale">
      <button id="closePassportModal" aria-label="Close passport" class="absolute top-4 right-4 text-gray-400 hover:text-gray-800 text-2xl transition">×</button>
      <h2 id="passportTitle" class="text-2xl font-bold text-gray-800 mb-2">My Passport</h2>
      <p id="passportInfo" class="text-gray-600 mb-6 text-sm italic">Visited <span id="visitedCount">0</span> of 11 heritage buildings in Kuala Lumpur</p>
      <div id="passportGrid" class="max-h-[60vh] overflow-y-auto grid grid-cols-3 gap-4 p-2 bg-gray-100 rounded-lg"></div>
      <div class="mt-4 flex flex-col gap-2">
        <button id="createBadgeFromPassportBtn" class="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold py-3 rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition shadow-md flex items-center justify-center gap-2">
          🎓 Create / Download Explorer ID
        </button>
        <button id="sharePassportBtn" class="w-full bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600 transition shadow-md flex items-center justify-center gap-2">
          Share Progress on WhatsApp
        </button>
        <button id="resetDemoProgressBtn" class="hidden w-full bg-white text-red-600 border border-red-200 font-bold py-3 rounded-lg hover:bg-red-50 transition shadow-sm flex items-center justify-center gap-2">
          Reset Demo Progress
        </button>
      </div>
    </div>
  </div>
  <div id="congratsModal" class="classic-modal-backdrop fixed inset-0 z-[9000] flex hidden" role="dialog" aria-modal="true" aria-labelledby="congratsTitle">
    <div class="classic-modal-content p-6 text-center animate-fade-scale">
      <button id="closeCongratsModal" aria-label="Close completion message" class="absolute top-4 right-4 text-gray-400 hover:text-gray-800 text-2xl transition">×</button>
      <div class="text-6xl mb-4">🎉</div>
      <h2 id="congratsTitle" class="text-2xl font-bold text-gray-800 mb-3">Congratulations!</h2>
      <p class="text-gray-600 mb-6">You have visited all 11 heritage buildings in Kuala Lumpur and completed the BWM KUL City Walk Passport!</p>
      <button id="shareWhatsAppBtn" class="w-full bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600 transition shadow-lg">
        Share on WhatsApp
      </button>
      <button id="createBadgeFromCongratsBtn" class="bg-blue-600 text-white px-4 py-2 rounded mt-2">
        Claim Explorer Badge
      </button>
    </div>
  </div>`;
}

export function createPassportTemplate() {
  return `${createPassportControlTemplate()}
${createPassportModalTemplate()}`;
}
