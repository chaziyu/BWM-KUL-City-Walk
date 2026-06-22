export function renderChallengeModal({ solvedRiddle, strings, today, day }) {
  const challengeRiddle = document.getElementById('challengeRiddle');
  const challengeResult = document.getElementById('challengeResult');
  if (!challengeRiddle || !challengeResult) return;

  challengeRiddle.textContent = `"${today.q}"`;
  challengeResult.textContent =
    solvedRiddle.day === day && solvedRiddle.id === today.a
      ? strings.game.challengeSolved
      : strings.game.challengeHint;
}
