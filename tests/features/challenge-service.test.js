import { describe, expect, it } from 'vitest';
import { getDayOfYear } from '../../src/features/challenges/challenge-service.js';

describe('daily challenge calendar', () => {
  it('uses Kuala Lumpur date boundaries', () => {
    expect(getDayOfYear(new Date('2026-01-01T15:59:59Z'))).toBe(1);
    expect(getDayOfYear(new Date('2026-01-01T16:00:00Z'))).toBe(2);
  });
});
