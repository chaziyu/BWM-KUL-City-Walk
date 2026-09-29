import { getDirectionsUrls } from './directions-service.js';

const NEARBY_MODE = Object.freeze({
  food: 'restaurants',
  hotel: 'hotels',
});

function presentationFor(mode, siteName) {
  const name = siteName || 'this site';

  if (mode === 'restaurants') {
    return {
      icon: '🍜',
      title: `Food Near ${name}`,
      context: 'Search Google Maps for restaurants centered on this heritage site.',
      searchTitle: 'Food near this site',
      searchText: `Browse current restaurant results around ${name} in Google Maps.`,
      footerLead: 'Looking for somewhere to eat?',
      footerDetail: 'Google Maps will show current restaurant listings, hours, ratings, and directions.',
      cta: 'Search Food in Google Maps',
      badge: 'Nearby Search',
    };
  }

  if (mode === 'hotels') {
    return {
      icon: '🏨',
      title: `Hotels Near ${name}`,
      context: 'Search Google Maps for hotels centered on this heritage site.',
      searchTitle: 'Hotels near this site',
      searchText: `Browse current hotel results around ${name} in Google Maps.`,
      footerLead: 'Looking for a place to stay?',
      footerDetail: 'Google Maps will show current hotel listings, ratings, and directions.',
      cta: 'Search Hotels in Google Maps',
      badge: 'Nearby Search',
    };
  }

  if (mode === 'walk') {
    return {
      icon: '🚶',
      title: `Walk to ${name}`,
      context: 'Preview the walking route below, then open Google Maps for live navigation.',
      footerLead: 'Want full walking directions?',
      footerDetail: 'Open Google Maps for live step-by-step navigation.',
      cta: 'Open Walking Directions',
      badge: 'View Route',
    };
  }

  return {
    icon: '🚌',
    title: `Transit to ${name}`,
    context: 'Preview the transit route below, then open Google Maps for live navigation.',
    footerLead: 'Want full transit directions?',
    footerDetail: 'Open Google Maps for live route options and timing.',
    cta: 'Open Transit Directions',
    badge: 'View Route',
  };
}

export function createDirectionsController({ modalManager }) {
  function bind() {
    const close = () => {
      modalManager.close('directionsModal');
      const iframe = document.getElementById('directionsIframe');
      if (iframe) {
        iframe.onload = null;
        iframe.src = '';
      }
    };

    ['closeDirectionsModal', 'closeDirectionsModalBtn'].forEach((id) => {
      const button = document.getElementById(id);
      if (!button || button.dataset.bound === 'true') return;
      button.dataset.bound = 'true';
      button.addEventListener('click', close);
    });
  }

  function applyPresentation(mode, siteName, kind) {
    const view = presentationFor(mode, siteName);
    const directionsTitle = document.getElementById('directionsTitle');
    const contextText = document.getElementById('directionsContextText');
    const routeRegion = document.getElementById('directionsRouteRegion');
    const searchRegion = document.getElementById('directionsSearchRegion');
    const searchIcon = document.getElementById('directionsSearchIcon');
    const searchTitle = document.getElementById('directionsSearchTitle');
    const searchText = document.getElementById('directionsSearchText');
    const footerLead = document.getElementById('directionsFooterLead');
    const footerDetail = document.getElementById('directionsFooterDetail');
    const linkText = document.getElementById('externalMapsLinkText');
    const linkBadge = document.getElementById('externalMapsLinkBadge');

    if (directionsTitle) {
      const icon = document.createElement('span');
      icon.textContent = view.icon;
      directionsTitle.replaceChildren(icon, document.createTextNode(` ${view.title}`));
    }

    if (contextText) contextText.textContent = view.context;
    if (footerLead) footerLead.innerHTML = `<strong>${view.footerLead}</strong>`;
    if (footerDetail) footerDetail.textContent = view.footerDetail;
    if (linkText) linkText.textContent = view.cta;
    if (linkBadge) linkBadge.textContent = view.badge;

    const isSearch = kind === 'search';
    routeRegion?.classList.toggle('hidden', isSearch);
    searchRegion?.classList.toggle('hidden', !isSearch);
    searchRegion?.classList.toggle('flex', isSearch);

    if (isSearch) {
      if (searchIcon) searchIcon.textContent = view.icon;
      if (searchTitle) searchTitle.textContent = view.searchTitle;
      if (searchText) searchText.textContent = view.searchText;
    }
  }

  function open(site, mode) {
    bind();

    let urls;
    try {
      urls = getDirectionsUrls(site, mode);
    } catch (error) {
      console.error('Unable to build Google Maps URL:', error);
      return false;
    }

    const externalMapsLink = document.getElementById('externalMapsLink');
    const directionsIframe = document.getElementById('directionsIframe');
    const directionsLoading = document.getElementById('directionsLoading');

    applyPresentation(mode, site?.name, urls.kind);

    if (externalMapsLink) externalMapsLink.href = urls.externalUrl;

    if (urls.kind === 'route' && directionsIframe && urls.embedUrl) {
      directionsLoading?.classList.remove('hidden');
      directionsIframe.onload = () => directionsLoading?.classList.add('hidden');
      directionsIframe.src = urls.embedUrl;
    } else if (directionsIframe) {
      directionsIframe.onload = null;
      directionsIframe.src = '';
      directionsLoading?.classList.add('hidden');
    }

    modalManager.open('directionsModal');
    return true;
  }

  function openNearbySearch(site, kind) {
    const mode = NEARBY_MODE[kind];
    if (!mode) {
      throw new RangeError(`Unsupported nearby search kind: ${kind}`);
    }
    return open(site, mode);
  }

  return {
    bind,
    openDirections: (site) => open(site, 'walk'),
    openNearbySearch,
  };
}
