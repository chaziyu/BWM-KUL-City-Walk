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
      { id: '1', category: 'must_visit' },
      { id: 2, category: 'must_visit' },
      { id: '3', category: 'must_visit' },
      { id: 'A', category: 'recommended' },
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
    const firstCheckIn = service.recordCheckIn(1);
    const duplicateCheckIn = service.recordCheckIn(1);
    const firstQuiz = service.recordQuizCompletion(2);
    const duplicateQuiz = service.recordQuizCompletion(2);

    expect(firstCheckIn.changed).toBe(true);
    expect(duplicateCheckIn.changed).toBe(false);
    expect(firstQuiz.changed).toBe(true);
    expect(duplicateQuiz.changed).toBe(false);

    const state = service.getCompletionState();
    expect([...state.completedIds].sort()).toEqual(['1', '2']);
    expect(JSON.parse(localStorage.getItem('jejak_visitor_discovered'))).toEqual(['1']);
    expect(JSON.parse(localStorage.getItem('jejak_visitor_visited'))).toEqual(['2']);
  });
});
