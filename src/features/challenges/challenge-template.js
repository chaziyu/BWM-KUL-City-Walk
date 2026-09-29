export function createChallengeControlTemplate() {
  return `<button id="btnChallenge" aria-label="Open daily challenge" class="map-action-button">
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 4h8v4a4 4 0 0 1-8 0V4Z"></path>
      <path d="M8 6H5v1a4 4 0 0 0 4 4M16 6h3v1a4 4 0 0 1-4 4M12 12v4M9 20h6M10 16h4"></path>
    </svg>
    <span>Challenge</span>
  </button>`;
}

export function createChallengeModalTemplate() {
  return `<div id="challengeModal" class="classic-modal-backdrop fixed inset-0 z-[9000] flex hidden" role="dialog" aria-modal="true" aria-labelledby="challengeTitle">
    <div class="classic-modal-content p-6 text-center animate-fade-scale">
      <button id="closeChallengeModal" aria-label="Close daily challenge" class="absolute top-4 right-4 text-gray-400 hover:text-gray-800 text-2xl transition">×</button>
      <div class="text-6xl mb-4">🏆</div>
      <h2 id="challengeTitle" class="text-2xl font-bold text-gray-800 mb-3">Daily Challenge</h2>
      <p id="challengeRiddle" class="text-gray-600 mb-4">Riddle loading...</p>
      <p id="challengeResult" class="font-bold text-green-600"></p>
    </div>
  </div>`;
}

export function createChallengeTemplate() {
  return `${createChallengeControlTemplate()}
${createChallengeModalTemplate()}`;
}
