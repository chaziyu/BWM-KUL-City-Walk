export function createSiteActions({
  strings,
  progressController,
  onMapRefresh,
  openGoogleMaps,
  openChat,
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
      openChat?.(`Tell me more about ${site.name}.`);
    },
    checkIn(site) {
      return afterProgressChange(site.id, 'recordCheckIn');
    },
    openDirections(site) {
      openGoogleMaps(site.coordinates.marker[0], site.coordinates.marker[1], 'directions', site.name);
    },
    openFood(site) {
      openGoogleMaps(site.coordinates.marker[0], site.coordinates.marker[1], 'restaurants', site.name);
    },
    openHotels(site) {
      openGoogleMaps(site.coordinates.marker[0], site.coordinates.marker[1], 'hotels', site.name);
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
