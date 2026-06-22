export function bindMapUI({ controller, defaultCenter, defaultZoom }) {
  const recenterButton = document.getElementById('btnRecenter');
  const tabMustVisit = document.getElementById('tabMustVisit');
  const tabRecommended = document.getElementById('tabRecommended');

  function updateTabStyles(mode) {
    if (!tabMustVisit || !tabRecommended) return;

    if (mode === 'must_visit') {
      tabMustVisit.className =
        'w-full md:w-48 h-12 flex items-center justify-center rounded-xl text-sm font-bold text-white bg-indigo-600 shadow-md transition-all transform scale-105 border-indigo-700';
      tabRecommended.className =
        'w-full md:w-48 h-12 flex items-center justify-center rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-all border border-transparent';
      return;
    }

    tabMustVisit.className =
      'w-full md:w-48 h-12 flex items-center justify-center rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-all border border-transparent';
    tabRecommended.className =
      'w-full md:w-48 h-12 flex items-center justify-center rounded-xl text-sm font-bold text-white bg-indigo-600 shadow-md transition-all transform scale-105 border-indigo-700';
  }

  if (recenterButton && recenterButton.dataset.bound !== 'true') {
    recenterButton.dataset.bound = 'true';
    recenterButton.addEventListener('click', () => controller.recenter(defaultCenter, defaultZoom));
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
