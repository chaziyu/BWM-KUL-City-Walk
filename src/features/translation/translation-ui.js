export function suppressGoogleTranslatePopups() {
  const removePopups = () => {
    document.querySelectorAll('.goog-te-balloon-frame, .goog-te-banner-frame, .goog-tooltip').forEach((el) => el.remove());
    if (document.body.style.top !== '0px') document.body.style.top = '0px';
  };

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;
        if (
          node.classList?.contains('goog-te-banner-frame') ||
          node.classList?.contains('goog-te-balloon-frame') ||
          node.classList?.contains('goog-tooltip') ||
          node.id?.includes('goog-gt-')
        ) {
          node.remove();
          document.body.style.top = '0px';
        }
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(removePopups, 2000);
  return () => observer.disconnect();
}
