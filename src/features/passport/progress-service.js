// @ts-check

/** @typedef {import('../../types/domain.js').HeritageSite} HeritageSite */
/** @typedef {import('../../types/domain.js').ProgressState} ProgressState */

import { isMustVisitSite } from '../sites/site-domain.js';
import {
  readScopedJSON,
  writeScopedJSON,
} from '../../services/storage.js';

/**
 * @param {string | number} id
 * @returns {string}
 */
function normalizeId(id) {
  return String(id);
}

/**
 * @param {(string | number)[]} ids
 * @returns {string[]}
 */
function uniqueIds(ids) {
  return [...new Set(ids.map(normalizeId))];
}

/**
 * @param {{
 *   getNamespace?: () => string,
 *   onChanged?: (state: ProgressState) => void
 * }} [options]
 */
export function createProgressService({ getNamespace, onChanged } = {}) {
  /** @type {string[]} */
  let mainSiteIds = [];
  /** @type {string[]} */
  let visitedSites = [];
  /** @type {string[]} */
  let discoveredSites = [];

  function getValidIdSet() {
    return new Set(mainSiteIds);
  }

  function emitChanged() {
    const state = getCompletionState();
    if (typeof onChanged === 'function') onChanged(state);
    return state;
  }

  /**
   * @param {HeritageSite[]} sites
   * @returns {ProgressState}
   */
  function setMainSites(sites) {
    mainSiteIds = uniqueIds(
      (sites || [])
        .filter(isMustVisitSite)
        .map((site) => site.id),
    );
    return emitChanged();
  }

  function load() {
    const namespace = getNamespace?.() || 'visitor';
    visitedSites = uniqueIds(readScopedJSON('visited', [], namespace));
    discoveredSites = uniqueIds(readScopedJSON('discovered', [], namespace));
    return emitChanged();
  }

  function persistVisited() {
    writeScopedJSON('visited', visitedSites, getNamespace?.() || 'visitor');
  }

  function persistDiscovered() {
    writeScopedJSON('discovered', discoveredSites, getNamespace?.() || 'visitor');
  }

  /**
   * @returns {ProgressState}
   */
  function getCompletionState() {
    const validIds = getValidIdSet();
    const completedIds = uniqueIds([...visitedSites, ...discoveredSites]).filter((id) =>
      validIds.has(id),
    );

    return {
      visitedSites: [...visitedSites],
      discoveredSites: [...discoveredSites],
      completedIds,
      count: completedIds.length,
      total: mainSiteIds.length,
      isComplete: mainSiteIds.length > 0 && completedIds.length >= mainSiteIds.length,
    };
  }

  /**
   * @param {string | number} siteId
   * @returns {boolean}
   */
  function isCompleted(siteId) {
    return getCompletionState().completedIds.includes(normalizeId(siteId));
  }

  /**
   * @param {string | number} siteId
   * @returns {ProgressState & { changed: boolean }}
   */
  function recordQuizCompletion(siteId) {
    const normalized = normalizeId(siteId);
    const changed = !visitedSites.includes(normalized);
    if (changed) {
      visitedSites = [...visitedSites, normalized];
      persistVisited();
    }
    return { ...emitChanged(), changed };
  }

  /**
   * @param {string | number} siteId
   * @returns {ProgressState & { changed: boolean }}
   */
  function recordCheckIn(siteId) {
    const normalized = normalizeId(siteId);
    const changed = !discoveredSites.includes(normalized);
    if (changed) {
      discoveredSites = [...discoveredSites, normalized];
      persistDiscovered();
    }
    return { ...emitChanged(), changed };
  }

  return {
    getCompletionState,
    getDiscoveredSites: () => [...discoveredSites],
    getMainSiteIds: () => [...mainSiteIds],
    getVisitedSites: () => [...visitedSites],
    isCompleted,
    load,
    recordCheckIn,
    recordQuizCompletion,
    setMainSites,
  };
}
