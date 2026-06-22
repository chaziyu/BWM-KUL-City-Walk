export function on(element, eventName, handler, options) {
  if (!element) return () => {};
  element.addEventListener(eventName, handler, options);
  return () => element.removeEventListener(eventName, handler, options);
}

export function byId(id, root = document) {
  return root.getElementById(id);
}
