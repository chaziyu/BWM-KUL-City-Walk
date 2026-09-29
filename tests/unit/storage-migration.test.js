/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from 'vitest';
import { migrateData } from '../../src/services/storage-migration.js';

describe('storage migration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('removes obsolete client quota counters while preserving progress', () => {
    localStorage.setItem('jejak_db_version', '3');
    localStorage.setItem('jejak_visitor_visited', JSON.stringify(['1']));
    localStorage.setItem('jejak_visitor_message_count', '4');
    localStorage.setItem('jejak_visitor_last_active_day', 'Mon Sep 29 2026');
    localStorage.setItem('jejak_demo_message_count', '2');
    localStorage.setItem('jejak_admin_visited', 'not-json');

    migrateData();

    expect(localStorage.getItem('jejak_db_version')).toBe('4');
    expect(localStorage.getItem('jejak_visitor_visited')).toBe(JSON.stringify(['1']));
    expect(localStorage.getItem('jejak_visitor_message_count')).toBeNull();
    expect(localStorage.getItem('jejak_visitor_last_active_day')).toBeNull();
    expect(localStorage.getItem('jejak_demo_message_count')).toBeNull();
    expect(localStorage.getItem('jejak_admin_visited')).toBe('[]');
  });
});
