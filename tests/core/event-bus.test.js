import { describe, expect, it, vi } from 'vitest';
import { emit, on } from '../../src/core/event-bus.js';

describe('event bus', () => {
  it('sends payloads to handlers', () => {
    const handler = vi.fn();
    const unsubscribe = on('test:single', handler);

    emit('test:single', { ok: true });
    unsubscribe();

    expect(handler).toHaveBeenCalledWith({ ok: true });
  });

  it('sends payloads to multiple handlers', () => {
    const first = vi.fn();
    const second = vi.fn();
    const offFirst = on('test:multiple', first);
    const offSecond = on('test:multiple', second);

    emit('test:multiple', 1);
    offFirst();
    offSecond();

    expect(first).toHaveBeenCalledWith(1);
    expect(second).toHaveBeenCalledWith(1);
  });

  it('unsubscribe prevents later calls', () => {
    const handler = vi.fn();
    const unsubscribe = on('test:unsubscribe', handler);

    unsubscribe();
    emit('test:unsubscribe', 'ignored');

    expect(handler).not.toHaveBeenCalled();
  });

  it('does not throw without handlers', () => {
    expect(() => emit('test:none')).not.toThrow();
  });
});
