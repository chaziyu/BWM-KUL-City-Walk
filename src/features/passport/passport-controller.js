import { buildShareText, updatePassportInfo, updateProgressBar } from './progress-ui.js';
import { renderPassportStamps } from './stamp-renderer.js';

export function createPassportController({
  strings,
  progressService,
  getMainSites,
  getCongratsModal,
  modalManager,
  playCelebration,
}) {
  let elements = {};

  function bind(dom) {
    elements = dom;

    if (elements.btnPassport && elements.btnPassport.dataset.bound !== 'true') {
      elements.btnPassport.dataset.bound = 'true';
      elements.btnPassport.addEventListener('click', openPassport);
    }

    if (elements.closePassportModal && elements.closePassportModal.dataset.bound !== 'true') {
      elements.closePassportModal.dataset.bound = 'true';
      elements.closePassportModal.addEventListener('click', () => {
        modalManager.close(elements.passportModal);
      });
    }
  }

  function refreshProgress() {
    const state = progressService.getCompletionState();
    const mainSites = getMainSites();

    updateProgressBar({
      progressBar: elements.progressBar,
      progressText: elements.progressText,
      count: state.count,
      total: state.total,
      strings,
    });

    updatePassportInfo({
      passportInfo: elements.passportInfo,
      count: state.count,
      total: state.total,
      strings,
    });

    renderPassportStamps({
      container: elements.passportGrid,
      sites: mainSites,
      completedIds: state.completedIds,
    });

    return state;
  }

  function maybeShowTrailCompletion() {
    const state = progressService.getCompletionState();
    const congratsModal = getCongratsModal?.();
    if (!state.isComplete || !congratsModal || !congratsModal.classList.contains('hidden')) {
      return;
    }

    modalManager.open(congratsModal);
    if (typeof playCelebration === 'function') playCelebration();
  }

  function openPassport() {
    refreshProgress();
    modalManager.open(elements.passportModal);
  }

  function buildSharePayload() {
    const state = progressService.getCompletionState();
    return {
      text: buildShareText({
        count: state.count,
        total: state.total,
        completed: state.isComplete,
      }),
      url: 'https://bwm-kul-city-walk.vercel.app/',
    };
  }

  return {
    bind,
    buildSharePayload,
    maybeShowTrailCompletion,
    openPassport,
    recordCheckIn(siteId) {
      const state = progressService.recordCheckIn(siteId);
      refreshProgress();
      return state;
    },
    recordQuizCompletion(siteId) {
      const state = progressService.recordQuizCompletion(siteId);
      refreshProgress();
      return state;
    },
    refreshProgress,
  };
}
