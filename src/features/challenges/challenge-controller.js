import { getDailyRiddle, getDayOfYear } from './challenge-service.js';
import { renderChallengeModal } from './challenge-ui.js';

export function createChallengeController({
  getSolvedRiddle,
  modalManager,
  onSolved,
  setSolvedRiddle,
  strings,
}) {
  function getState() {
    const day = getDayOfYear();
    const today = getDailyRiddle(day);
    const solvedRiddle = getSolvedRiddle();
    return {
      siteId: today.a,
      solved: solvedRiddle.day === day && solvedRiddle.id === today.a,
    };
  }

  function updateModal() {
    const day = getDayOfYear();
    renderChallengeModal({
      day,
      solvedRiddle: getSolvedRiddle(),
      strings,
      today: getDailyRiddle(day),
    });
  }

  function open() {
    updateModal();
    modalManager.open('challengeModal');
  }

  function solveCurrent() {
    const day = getDayOfYear();
    const today = getDailyRiddle(day);
    const next = { day, id: today.a };
    setSolvedRiddle(next);
    updateModal();
    open();
    onSolved?.(next);
  }

  function bind() {
    const button = document.getElementById('btnChallenge');
    if (button && button.dataset.bound !== 'true') {
      button.dataset.bound = 'true';
      button.addEventListener('click', open);
    }
    const closeButton = document.getElementById('closeChallengeModal');
    if (closeButton && closeButton.dataset.bound !== 'true') {
      closeButton.dataset.bound = 'true';
      closeButton.addEventListener('click', () => modalManager.close('challengeModal'));
    }
  }

  return { bind, getState, open, solveCurrent, updateModal };
}
