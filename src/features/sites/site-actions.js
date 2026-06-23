export function createSiteActions({
  strings,
  progressController,
  onMapRefresh,
  openChat,
  openDirections,
  openFood,
  openHotels,
  playChaChing,
}) {
  function afterProgressChange(siteId, method) {
    const state = progressController[method](siteId);
    if (typeof onMapRefresh === 'function') onMapRefresh(siteId);
    if (typeof playChaChing === 'function') playChaChing();
    progressController.maybeShowTrailCompletion();
    return state;
  }

  return {
    askAI(site) {
      openChat?.(site.id);
    },
    checkIn(site) {
      return afterProgressChange(site.id, 'recordCheckIn');
    },
    openDirections(site) {
      openDirections?.(site);
    },
    openFood(site) {
      openFood?.(site);
    },
    openHotels(site) {
      openHotels?.(site);
    },
    submitQuizAnswer(site, answer) {
      if (answer !== site.quiz.a) {
        return { correct: false, message: strings.game.quizWrong };
      }

      afterProgressChange(site.id, 'recordQuizCompletion');
      return { correct: true, message: strings.game.quizCorrect };
    },
  };
}
