import { describe, expect, it } from 'vitest';
import { buildTrailPlan, getTrailById, normalizeTrailBudget } from '../../src/features/trails/trail-engine.js';

const sites = [
  { id: '1', name: 'One', category: 'must_visit' },
  { id: '2', name: 'Two', category: 'must_visit' },
  { id: '3', name: 'Three', category: 'must_visit' },
];

const trail = {
  id: 'story',
  title: 'Story',
  theme: 'Theme',
  summary: 'Summary',
  stops: [
    { siteId: '1', chapter: 'First', visitMinutes: 8, walkMinutesFromPrevious: 0 },
    { siteId: '2', chapter: 'Second', visitMinutes: 8, walkMinutesFromPrevious: 4 },
    { siteId: '3', chapter: 'Third', visitMinutes: 8, walkMinutesFromPrevious: 4 },
  ],
};

describe('trail engine', () => {
  it('builds a local time-budgeted plan without external routing', () => {
    const plan = buildTrailPlan(trail, sites, 25);

    expect(plan.stops.map((stop) => stop.site.id)).toEqual(['1', '2']);
    expect(plan.estimatedMinutes).toBe(20);
    expect(plan.isFullThread).toBe(false);
  });

  it('returns the full thread when the budget allows it', () => {
    const plan = buildTrailPlan(trail, sites, 40);

    expect(plan.stops).toHaveLength(3);
    expect(plan.estimatedMinutes).toBe(32);
    expect(plan.isFullThread).toBe(true);
  });

  it('skips missing site references safely', () => {
    const plan = buildTrailPlan(trail, sites.slice(0, 2), 90);

    expect(plan.stops.map((stop) => stop.site.id)).toEqual(['1', '2']);
    expect(plan.isFullThread).toBe(true);
  });

  it('normalizes invalid budgets and looks trails up by id', () => {
    expect(normalizeTrailBudget('bad')).toBe(60);
    expect(getTrailById([trail], 'story')).toBe(trail);
    expect(getTrailById([trail], 'missing')).toBeNull();
  });
});
