const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function createFocusTrap(container) {
  function getFocusable() {
    return [...(container?.querySelectorAll(FOCUSABLE) || [])].filter((el) => {
      if (el.disabled) return false;
      if (el.closest('[hidden], [aria-hidden="true"], .hidden')) return false;
      return true;
    });
  }

  function focusFirst() {
    const [first] = getFocusable();
    first?.focus();
  }

  function handleTab(event) {
    if (event.key !== 'Tab') return;
    const focusable = getFocusable();
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return { focusFirst, handleTab };
}
