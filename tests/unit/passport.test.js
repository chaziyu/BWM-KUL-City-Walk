/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from 'vitest';
import { createProgressService } from '../../src/features/passport/progress-service.js';

describe('Passport Logic', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('keeps demo and visitor progress separated', () => {
    const visitor = createProgressService({ getNamespace: () => 'visitor' });
    const demo = createProgressService({ getNamespace: () => 'demo' });

    visitor.setMainSites([{ id: '1' }]);
    demo.setMainSites([{ id: '1' }]);
    visitor.recordCheckIn('1');
    demo.load();

    expect(visitor.getCompletionState().count).toBe(1);
    expect(demo.getCompletionState().count).toBe(0);
  });
});
