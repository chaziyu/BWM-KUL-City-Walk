import { getDirectionsUrls } from './directions-service.js';

function titleFor(mode, siteName) {
  if (mode === 'restaurants') return { icon: 'Food', text: `Food Near ${siteName || 'Site'}` };
  if (mode === 'hotels') return { icon: 'Hotel', text: `Hotels Near ${siteName || 'Site'}` };
  if (mode === 'walk') return { icon: 'Walk', text: `Walk to ${siteName || 'Site'}` };
  return { icon: 'Transit', text: `Transit to ${siteName || 'Site'}` };
}

export function createDirectionsController({ modalManager }) {
  function bind() {
    const close = () => {
      modalManager.close('directionsModal');
      const iframe = document.getElementById('directionsIframe');
      if (iframe) iframe.src = '';
    };
    ['closeDirectionsModal', 'closeDirectionsModalBtn'].forEach((id) => {
      const button = document.getElementById(id);
      if (!button || button.dataset.bound === 'true') return;
      button.dataset.bound = 'true';
      button.addEventListener('click', close);
    });
  }

  function open(site, mode) {
    bind();
    const { externalUrl, embedUrl } = getDirectionsUrls(site, mode);
    const directionsIframe = document.getElementById('directionsIframe');
    const directionsLoading = document.getElementById('directionsLoading');
    const directionsTitle = document.getElementById('directionsTitle');
    const externalMapsLink = document.getElementById('externalMapsLink');

    const title = titleFor(mode, site.name);
    if (directionsTitle) directionsTitle.innerHTML = `<span>${title.icon}</span> ${title.text}`;
    if (externalMapsLink) externalMapsLink.href = externalUrl;
    if (directionsIframe) {
      directionsLoading?.classList.remove('hidden');
      directionsIframe.onload = () => directionsLoading?.classList.add('hidden');
      directionsIframe.src = embedUrl;
      modalManager.open('directionsModal');
      return;
    }
    if (externalUrl) window.open(externalUrl, '_blank');
  }

  return {
    bind,
    openDirections: (site) => open(site, 'directions'),
    openNearbySearch: (site, kind) => open(site, kind === 'hotel' ? 'hotels' : 'restaurants'),
  };
}
