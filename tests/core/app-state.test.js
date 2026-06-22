import { beforeEach, describe, expect, it } from 'vitest';
import { getState, resetState, setState } from '../../src/core/app-state.js';

const DEFAULT_STATE = {
  session: null,
  activeView: 'landing',
  activeModal: null,
  bootstrapInitialized: false,
};

describe('app state', () => {
  beforeEach(() => {
    resetState();
  });

  it('starts with the default state', () => {
    expect(getState()).toEqual(DEFAULT_STATE);
  });

  it('merges allowed keys', () => {
    setState({ activeView: 'map', bootstrapInitialized: true });

    expect(getState()).toEqual({
      ...DEFAULT_STATE,
      activeView: 'map',
      bootstrapInitialized: true,
    });
  });

  it('does not expose mutable internal state', () => {
    const snapshot = getState();
    snapshot.activeView = 'admin';

    expect(getState().activeView).toBe('landing');
  });

  it('rejects unknown keys', () => {
    expect(() => setState({ map: {} })).toThrow('Unknown app state key: map');
  });

  it('resets to defaults', () => {
    setState({ activeView: 'map' });
    resetState();

    expect(getState()).toEqual(DEFAULT_STATE);
  });
});
