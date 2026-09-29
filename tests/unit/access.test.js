import { describe, expect, it } from 'vitest';
import { getScopedKey } from '../../src/services/storage.js';

describe('Access Control', () => {
  it('uses separate visitor and demo progress storage keys', () => {
    expect(getScopedKey('visited', 'visitor')).toBe('jejak_visitor_visited');
    expect(getScopedKey('visited', 'demo')).toBe('jejak_demo_visited');
  });

  it('keeps admin progress separate from visitor storage', () => {
    expect(getScopedKey('visited', 'admin')).toBe('jejak_admin_visited');
    expect(getScopedKey('visited', 'unknown')).toBe('jejak_visitor_visited');
  });
});
