export function bindMapUI({ controller, defaultCenter, defaultZoom }) {
  const recenterButton = document.getElementById('btnRecenter');
  const zoomInButton = document.getElementById('btnUIZoomIn');
  const zoomOutButton = document.getElementById('btnUIZoomOut');
  const tabMustVisit = document.getElementById('tabMustVisit');
  const tabRecommended = document.getElementById('tabRecommended');

  function updateTabStyles(mode) {
    if (!tabMustVisit || !tabRecommended) return;

    const mustVisitActive = mode === 'must_visit';
    tabMustVisit.setAttribute('aria-pressed', String(mustVisitActive));
    tabRecommended.setAttribute('aria-pressed', String(!mustVisitActive));
  }

  if (recenterButton && recenterButton.dataset.bound !== 'true') {
    recenterButton.dataset.bound = 'true';
    recenterButton.addEventListener('click', () => controller.recenter(defaultCenter, defaultZoom));
  }

  if (zoomInButton && zoomInButton.dataset.bound !== 'true') {
    zoomInButton.dataset.bound = 'true';
    zoomInButton.addEventListener('click', () => controller.zoomIn());
  }

  if (zoomOutButton && zoomOutButton.dataset.bound !== 'true') {
    zoomOutButton.dataset.bound = 'true';
    zoomOutButton.addEventListener('click', () => controller.zoomOut());
  }

  if (tabMustVisit && tabMustVisit.dataset.bound !== 'true') {
    tabMustVisit.dataset.bound = 'true';
    tabMustVisit.addEventListener('click', () => {
      controller.setFilterMode('must_visit');
      updateTabStyles('must_visit');
    });
  }

  if (tabRecommended && tabRecommended.dataset.bound !== 'true') {
    tabRecommended.dataset.bound = 'true';
    tabRecommended.addEventListener('click', () => {
      controller.setFilterMode('recommended');
      updateTabStyles('recommended');
    });
  }

  updateTabStyles(controller.getFilterMode());
}
