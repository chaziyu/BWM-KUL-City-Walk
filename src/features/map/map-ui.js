export function bindMapUI({ controller, defaultCenter, defaultZoom, uiScaleController }) {
  const recenterButton = document.getElementById('btnRecenter');
  const scaleUpButton = document.getElementById('btnUIScaleUp');
  const scaleDownButton = document.getElementById('btnUIScaleDown');
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

  if (scaleUpButton && scaleUpButton.dataset.bound !== 'true') {
    scaleUpButton.dataset.bound = 'true';
    scaleUpButton.addEventListener('click', () => uiScaleController?.increase());
  }

  if (scaleDownButton && scaleDownButton.dataset.bound !== 'true') {
    scaleDownButton.dataset.bound = 'true';
    scaleDownButton.addEventListener('click', () => uiScaleController?.decrease());
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
