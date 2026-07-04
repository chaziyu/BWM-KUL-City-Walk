import { endSession } from '../../services/session-client.js';

let isOnline = navigator.onLine;

async function handleClearOfflineData() {
  const confirmed = window.confirm('Are you sure you want to clear offline data? This will clear all cached maps, heritage images, offline progress, and sign you out.');
  if (!confirmed) return;

  try {
    // Delete all browser cache storage
    if ('caches' in window) {
      const keys = await window.caches.keys();
      await Promise.all(keys.map(key => window.caches.delete(key)));
    }
    // Logout from Vercel session
    await endSession().catch(() => {});
    // Clear localStorage
    localStorage.clear();
    // Reload page
    window.location.reload();
  } catch (err) {
    console.error('Failed to clear offline data:', err);
    window.location.reload();
  }
}

export function updateConnectivityUI(onlineState = navigator.onLine) {
  isOnline = onlineState;

  let banner = document.getElementById('connectivity-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'connectivity-banner';
    banner.className = 'fixed top-[calc(1rem+env(safe-area-inset-top))] left-4 right-4 z-[9999] md:max-w-md md:mx-auto bg-amber-50/95 backdrop-blur-md border border-amber-300 text-amber-900 rounded-2xl p-3 shadow-xl flex items-center justify-between gap-3 transition-all duration-300 transform -translate-y-32 hidden';
    document.body.appendChild(banner);
  }

  let mapNotice = document.getElementById('map-offline-notice');
  if (!mapNotice) {
    mapNotice = document.createElement('div');
    mapNotice.id = 'map-offline-notice';
    mapNotice.className = 'fixed top-[calc(5rem+env(safe-area-inset-top))] left-4 right-4 z-[1000] md:max-w-xs md:left-auto md:right-4 bg-gray-900/85 backdrop-blur-sm border border-gray-700 text-white rounded-xl px-3 py-2 text-[10px] text-center shadow-lg transition-opacity duration-300 opacity-0 pointer-events-none';
    mapNotice.textContent = 'Map tiles require internet. Previously viewed areas may still appear offline.';
    document.body.appendChild(mapNotice);
  }

  const mapContainer = document.getElementById('map-container');
  const isMapVisible = mapContainer && !mapContainer.classList.contains('hidden');

  if (!isOnline) {
    // Show offline banner
    banner.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="text-xl" aria-hidden="true">⚠️</span>
        <div class="text-left">
          <p class="text-xs font-bold text-amber-900">You are offline</p>
          <p class="text-[10px] text-amber-700 leading-tight">Heritage details remain usable. AI, maps, and login are limited.</p>
        </div>
      </div>
      <button id="pwa-clear-offline-btn" class="flex-shrink-0 bg-amber-600/10 hover:bg-amber-600/20 text-amber-800 text-[10px] font-bold px-2.5 py-1.5 rounded-lg active:scale-95 transition cursor-pointer">
        Clear Cache
      </button>
    `;
    banner.classList.remove('bg-green-50/95', 'border-green-300', 'text-green-900');
    banner.classList.add('bg-amber-50/95', 'border-amber-300', 'text-amber-900');
    banner.classList.remove('hidden');
    // Force a reflow to trigger transition
    void banner.offsetHeight;
    banner.classList.remove('-translate-y-32');

    // Bind Clear Cache button
    document.getElementById('pwa-clear-offline-btn')?.addEventListener('click', handleClearOfflineData);

    // Show map offline notice only when map is active
    if (isMapVisible) {
      mapNotice.classList.remove('opacity-0', 'pointer-events-none');
    } else {
      mapNotice.classList.add('opacity-0', 'pointer-events-none');
    }

    // Disable AI Chat
    const chatInput = document.getElementById('chatInput');
    const chatSendBtn = document.getElementById('chatSendBtn');
    if (chatInput) {
      chatInput.disabled = true;
      chatInput.placeholder = 'Chat requires internet connection...';
    }
    if (chatSendBtn) {
      chatSendBtn.disabled = true;
      chatSendBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }

    // Disable Translation
    const loadTranslateBtn = document.getElementById('loadTranslateBtn');
    if (loadTranslateBtn) {
      loadTranslateBtn.disabled = true;
      loadTranslateBtn.classList.add('opacity-50', 'cursor-not-allowed');
      loadTranslateBtn.title = 'Translation requires internet';
    }

    // Disable Directions External Maps
    const externalMapsLink = document.getElementById('externalMapsLink');
    if (externalMapsLink) {
      externalMapsLink.classList.add('pointer-events-none', 'opacity-50');
      externalMapsLink.title = 'Maps require internet';
    }

    // Disable Passkey Login Submit
    const unlockBtn = document.getElementById('unlockBtn');
    if (unlockBtn) {
      unlockBtn.disabled = true;
      unlockBtn.classList.add('opacity-50', 'cursor-not-allowed');
      unlockBtn.title = 'Login requires internet';
    }

    const continueLoginBtn = document.getElementById('continueLoginBtn');
    if (continueLoginBtn) {
      continueLoginBtn.disabled = true;
      continueLoginBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }

    // Disable Admin Passkey tools
    const adminGenerateBtn = document.getElementById('adminGenerateBtn');
    if (adminGenerateBtn) {
      adminGenerateBtn.disabled = true;
      adminGenerateBtn.classList.add('opacity-50', 'cursor-not-allowed');
      adminGenerateBtn.title = 'Passkey generation requires internet';
    }
  } else {
    // Show online banner briefly if it was visible
    if (banner && !banner.classList.contains('-translate-y-32') && !banner.classList.contains('hidden')) {
      banner.innerHTML = `
        <div class="flex items-center gap-3">
          <span class="text-xl" aria-hidden="true">✅</span>
          <div class="text-left">
            <p class="text-xs font-bold text-green-900">Back online</p>
            <p class="text-[10px] text-green-700 leading-tight">All features and live updates restored.</p>
          </div>
        </div>
      `;
      banner.classList.remove('bg-amber-50/95', 'border-amber-300', 'text-amber-900');
      banner.classList.add('bg-green-50/95', 'border-green-300', 'text-green-900');

      setTimeout(() => {
        banner.classList.add('-translate-y-32');
        // Hide from DOM layout after transition completes
        setTimeout(() => {
          if (banner.classList.contains('-translate-y-32')) {
            banner.classList.add('hidden');
          }
        }, 300);
      }, 3000);
    }

    // Hide map offline notice
    mapNotice.classList.add('opacity-0', 'pointer-events-none');

    // Re-enable AI Chat
    const chatInput = document.getElementById('chatInput');
    const chatSendBtn = document.getElementById('chatSendBtn');
    if (chatInput) {
      chatInput.disabled = false;
      chatInput.placeholder = 'Ask a question...';
    }
    if (chatSendBtn) {
      chatSendBtn.disabled = false;
      chatSendBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }

    // Re-enable Translation
    const loadTranslateBtn = document.getElementById('loadTranslateBtn');
    if (loadTranslateBtn) {
      loadTranslateBtn.disabled = false;
      loadTranslateBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      loadTranslateBtn.title = 'Translate page';
    }

    // Re-enable Directions
    const externalMapsLink = document.getElementById('externalMapsLink');
    if (externalMapsLink) {
      externalMapsLink.classList.remove('pointer-events-none', 'opacity-50');
      externalMapsLink.title = '';
    }

    // Re-enable Passkey Login
    const unlockBtn = document.getElementById('unlockBtn');
    if (unlockBtn) {
      unlockBtn.disabled = false;
      unlockBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      unlockBtn.title = '';
    }

    const continueLoginBtn = document.getElementById('continueLoginBtn');
    if (continueLoginBtn) {
      continueLoginBtn.disabled = false;
      continueLoginBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }

    // Re-enable Admin Tools
    const adminGenerateBtn = document.getElementById('adminGenerateBtn');
    if (adminGenerateBtn) {
      adminGenerateBtn.disabled = false;
      adminGenerateBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      adminGenerateBtn.title = '';
    }
  }
}

export function initConnectivity() {
  window.addEventListener('online', () => updateConnectivityUI(true));
  window.addEventListener('offline', () => updateConnectivityUI(false));

  // Call initially to set state
  updateConnectivityUI(navigator.onLine);

  // Observe map-container visibility
  const mapContainer = document.getElementById('map-container');
  if (mapContainer) {
    const observer = new MutationObserver(() => {
      updateConnectivityUI(navigator.onLine);
    });
    observer.observe(mapContainer, { attributes: true, attributeFilter: ['class'] });
  }
}
