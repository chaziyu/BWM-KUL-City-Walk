/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from 'vitest';
import { createProgressService } from '../../src/features/passport/progress-service.js';

describe('progress service', () => {
  let service;

  beforeEach(() => {
    localStorage.clear();
    service = createProgressService({
      getNamespace: () => 'visitor',
    });
    service.setMainSites([
      { id: '1' },
      { id: 2 },
      { id: '3' },
      { id: 'A' },
    ]);
  });

  it('merges visited and discovered ids, deduplicates, and filters non-main ids', () => {
    localStorage.setItem('jejak_visitor_visited', JSON.stringify(['1', 2, '2', 'A']));
    localStorage.setItem('jejak_visitor_discovered', JSON.stringify([3, '3', '999']));

    const state = service.load();

    expect(state.completedIds).toEqual(['1', '2', '3']);
    expect(state.count).toBe(3);
    expect(state.total).toBe(3);
    expect(state.isComplete).toBe(true);
  });

  it('records check-ins and quiz completions with string ids', () => {
    service.recordCheckIn(1);
    service.recordQuizCompletion(2);

    const state = service.getCompletionState();
    expect([...state.completedIds].sort()).toEqual(['1', '2']);
    expect(JSON.parse(localStorage.getItem('jejak_visitor_discovered'))).toEqual(['1']);
    expect(JSON.parse(localStorage.getItem('jejak_visitor_visited'))).toEqual(['2']);
  });
});
