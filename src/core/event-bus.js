const listeners = new Map();

export function on(eventName, handler) {
  if (!listeners.has(eventName)) {
    listeners.set(eventName, new Set());
  }
  listeners.get(eventName).add(handler);
  return () => off(eventName, handler);
}

export function off(eventName, handler) {
  const handlers = listeners.get(eventName);
  if (!handlers) return;

  handlers.delete(handler);
  if (handlers.size === 0) listeners.delete(eventName);
}

export function emit(eventName, payload) {
  const handlers = listeners.get(eventName);
  if (!handlers) return;

  for (const handler of [...handlers]) {
    handler(payload);
  }
}
