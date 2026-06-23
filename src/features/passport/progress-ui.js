export function updateProgressBar({ progressBar, progressText, count, total, strings }) {
  if (!progressBar || !progressText || !total) return;
  progressBar.style.width = `${(count / total) * 100}%`;
  progressText.textContent = strings.game.progressShort(count, total);
}

export function updatePassportInfo({ passportInfo, count, total, strings }) {
  if (!passportInfo) return;
  passportInfo.textContent = strings.game.progress(count, total);
}

export function buildShareText({ count, total, completed }) {
  return completed
    ? "🎉 Mission Accomplished! I've collected all 11 heritage stamps on the BWM KUL City Walk! 🏛️✨"
    : `I'm exploring Kuala Lumpur's Heritage Sites! I've visited ${count}/${total} so far on the BWM KUL City Walk. 🏛️✨`;
}

export function applyBadgeStatus({ statusDisplay, captionDisplay, statusStamp, count, total, isComplete, strings }) {
  if (!statusDisplay || !captionDisplay || !statusStamp) return;

  let title = strings.game.badgeLevels.beginner;
  if (count >= 10) title = strings.game.badgeLevels.master;
  else if (count >= 6) title = strings.game.badgeLevels.specialist;
  else if (count >= 3) title = strings.game.badgeLevels.explorer;

  statusDisplay.textContent = title;
  captionDisplay.textContent = isComplete
    ? `"${strings.game.badgeCaptions.complete}"`
    : `"${strings.game.badgeCaptions.partial(count)}"`;

  statusStamp.innerHTML = isComplete
    ? '<div class="text-red-900/80 text-[10px] font-sans font-bold text-center uppercase leading-tight">BWM KL<br>DONE</div>'
    : `<div class="text-red-900/80 text-[10px] font-sans font-bold text-center uppercase leading-tight">BWM KL<br>${count}/${total}</div>`;
}
