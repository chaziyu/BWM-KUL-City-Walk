import { buildMoreInfoHtml, renderQuizOptions, renderSiteBasics } from './site-renderer.js';

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

export function createSiteModalController({
  strings,
  actions,
  progressService,
  getChallengeState,
  modalManager,
  onChallengeSelected,
}) {
  let currentSite = null;
  let elements = {};

  function bind(dom) {
    elements = dom;

    if (elements.closeButton && elements.closeButton.dataset.bound !== 'true') {
      elements.closeButton.dataset.bound = 'true';
      elements.closeButton.addEventListener('click', () => modalManager.close(elements.modal));
    }

    if (elements.askAI && elements.askAI.dataset.bound !== 'true') {
      elements.askAI.dataset.bound = 'true';
      elements.askAI.addEventListener('click', () => currentSite && actions.askAI(currentSite));
    }

    if (elements.directions && elements.directions.dataset.bound !== 'true') {
      elements.directions.dataset.bound = 'true';
      elements.directions.addEventListener('click', () => currentSite && actions.openDirections(currentSite));
    }

    if (elements.food && elements.food.dataset.bound !== 'true') {
      elements.food.dataset.bound = 'true';
      elements.food.addEventListener('click', (event) => {
        event.preventDefault();
        if (currentSite) actions.openFood(currentSite);
      });
    }

    if (elements.hotel && elements.hotel.dataset.bound !== 'true') {
      elements.hotel.dataset.bound = 'true';
      elements.hotel.addEventListener('click', (event) => {
        event.preventDefault();
        if (currentSite) actions.openHotels(currentSite);
      });
    }

    if (elements.checkIn && elements.checkIn.dataset.bound !== 'true') {
      elements.checkIn.dataset.bound = 'true';
      elements.checkIn.addEventListener('click', () => {
        if (!currentSite) return;
        actions.checkIn(currentSite);
        render(currentSite);
      });
    }

    if (elements.solveChallenge && elements.solveChallenge.dataset.bound !== 'true') {
      elements.solveChallenge.dataset.bound = 'true';
      elements.solveChallenge.addEventListener('click', () => {
        if (currentSite) onChallengeSelected?.(currentSite);
      });
    }
  }

  function renderMoreInfo(site) {
    const { hasExtraInfo, html } = buildMoreInfoHtml(site);
    elements.moreContent.innerHTML = html;
    elements.moreContent.classList.add('hidden');
    elements.moreButton.textContent = 'More info';
    elements.more.style.display = hasExtraInfo ? 'block' : 'none';
    elements.moreButton.onclick = () => {
      const isHidden = elements.moreContent.classList.contains('hidden');
      elements.moreContent.classList.toggle('hidden', !isHidden);
      elements.moreButton.textContent = isHidden ? 'Hide info' : 'More info';
    };
  }

  function renderQuiz(site) {
    if (!site.quiz || !/^\d+$/.test(String(site.id))) {
      elements.quizArea.style.display = 'none';
      elements.checkIn.style.display = 'block';

      const isCompleted = progressService.getDiscoveredSites().includes(String(site.id));
      elements.checkIn.disabled = isCompleted;
      elements.checkIn.textContent = isCompleted ? 'Visited' : 'Check In to this Site';
      elements.checkIn.className = isCompleted
        ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
        : 'bg-purple-700 hover:bg-purple-800 text-white';
      return;
    }

    elements.quizArea.style.display = 'block';
    elements.checkIn.style.display = 'none';
    elements.quizQuestion.textContent = site.quiz.q;
    elements.quizResult.classList.add('hidden');
    elements.hintText.textContent = site.quiz.hint || 'Try again!';
    elements.hintText.classList.add('hidden');

    renderQuizOptions({
      container: elements.quizOptions,
      options: shuffle(site.quiz.options || [site.quiz.a]),
      onSelect: (option, button) => {
        const result = actions.submitQuizAnswer(site, option);
        elements.quizResult.textContent = result.message;
        elements.quizResult.className = result.correct
          ? 'text-sm mt-2 text-center font-bold text-green-600'
          : 'text-sm mt-2 text-center font-bold text-red-600';
        elements.quizResult.classList.remove('hidden');

        if (result.correct) {
          button.classList.remove('bg-white', 'border-gray-200', 'hover:bg-blue-50', 'hover:border-blue-400');
          button.classList.add('bg-green-100', 'border-green-500', 'text-green-800');
          elements.quizOptions.querySelectorAll('button').forEach((btn) => {
            btn.disabled = true;
          });
        } else {
          button.classList.add('bg-red-50', 'border-red-300');
          setTimeout(() => button.classList.remove('bg-red-50', 'border-red-300'), 500);
          elements.hintText.classList.remove('hidden');
        }
      },
    });
  }

  function renderChallenge(site) {
    const state = getChallengeState?.();
    const shouldShow = Boolean(state?.siteId && String(site.id) === String(state.siteId) && !state.solved);
    elements.solveChallenge.style.display = shouldShow ? 'block' : 'none';
  }

  function render(site) {
    currentSite = site;
    renderSiteBasics({
      elements: {
        image: elements.image,
        info: elements.info,
        label: elements.label,
        title: elements.title,
      },
      site,
    });

    renderMoreInfo(site);
    renderQuiz(site);
    renderChallenge(site);

    elements.directions.style.display = 'block';
    elements.askAI.style.display = 'block';
  }

  function open(site) {
    if (!site) return;
    render(site);
    modalManager.open(elements.modal);
  }

  return {
    bind,
    getCurrentSite: () => currentSite,
    open,
    render,
  };
}
