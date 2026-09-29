let confettiModule;
let html2canvasModule;
let markedModule;

export async function fireConfetti(options) {
  confettiModule ||= import('canvas-confetti');
  const { default: confetti } = await confettiModule;
  return confetti(options);
}

export async function captureElement(element, options) {
  html2canvasModule ||= import('html2canvas');
  const { default: html2canvas } = await html2canvasModule;
  return html2canvas(element, options);
}

export async function renderMarkdown(text) {
  markedModule ||= import('marked');
  const { marked } = await markedModule;
  return marked.parse(text || '');
}
