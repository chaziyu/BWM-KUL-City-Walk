export function createMapPreview({ strings, getSites, openSiteDetails }) {
  let currentSiteId = null;
  const emptyImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E';

  function close() {
    const card = document.getElementById('previewCard');
    if (!card || card.classList.contains('hidden')) return;
    card.classList.remove('preview-card-opening');
    card.classList.add('preview-card-closing');
    setTimeout(() => {
      card.classList.add('hidden');
      card.classList.remove('preview-card-closing');
    }, 400);
  }

  function open(site) {
    const card = document.getElementById('previewCard');
    const image = document.getElementById('previewImage');
    const title = document.getElementById('previewTitle');
    const info = document.getElementById('previewInfo');
    const distance = document.getElementById('previewDist');
    if (!card || !site) return;

    currentSiteId = String(site.id);
    card.dataset.siteId = currentSiteId;
    if (title) title.textContent = `${site.id}. ${site.name}`;
    if (info) info.textContent = site.info || '';
    if (distance) distance.textContent = strings?.preview?.tapForDetails || 'Tap for details';
    if (image) {
      image.classList.add('skeleton-loading');
      image.src = site.image || emptyImage;
      image.onload = () => image.classList.remove('skeleton-loading');
    }

    card.classList.remove('hidden', 'preview-card-closing');
    card.classList.add('preview-card-opening');
  }

  function openDetails() {
    const site = getSites().find((entry) => String(entry.id) === currentSiteId);
    if (!site) return;
    close();
    openSiteDetails(site);
  }

  function bind() {
    const card = document.getElementById('previewCard');
    const openButton = document.getElementById('previewOpenBtn');
    const closeButton = document.getElementById('previewCloseBtn');
    if (!card || card.dataset.bound === 'true') return;

    card.dataset.bound = 'true';
    closeButton?.addEventListener('click', (event) => {
      event.stopPropagation();
      close();
    });
    openButton?.addEventListener('click', (event) => {
      event.stopPropagation();
      openDetails();
    });
    card.addEventListener('click', (event) => {
      if (event.target.closest('#previewCloseBtn')) return;
      openButton?.click();
    });
  }

  return { bind, close, open };
}
