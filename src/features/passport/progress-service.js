import {
  readScopedJSON,
  writeScopedJSON,
} from '../../services/storage.js';

function normalizeId(id) {
  return String(id);
}

function uniqueIds(ids) {
  return [...new Set(ids.map(normalizeId))];
}

export function createProgressService({ getNamespace, onChanged } = {}) {
  let mainSiteIds = [];
  let visitedSites = [];
  let discoveredSites = [];

  function getValidIdSet() {
    return new Set(mainSiteIds);
  }

  function emitChanged() {
    const state = getCompletionState();
    if (typeof onChanged === 'function') onChanged(state);
    return state;
  }

  function setMainSites(sites) {
    mainSiteIds = uniqueIds(
      (sites || [])
        .filter((site) => /^\d+$/.test(String(site.id)))
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

  function isCompleted(siteId) {
    return getCompletionState().completedIds.includes(normalizeId(siteId));
  }

  function recordQuizCompletion(siteId) {
    const normalized = normalizeId(siteId);
    if (!visitedSites.includes(normalized)) {
      visitedSites = [...visitedSites, normalized];
      persistVisited();
    }
    return emitChanged();
  }

  function recordCheckIn(siteId) {
    const normalized = normalizeId(siteId);
    if (!discoveredSites.includes(normalized)) {
      discoveredSites = [...discoveredSites, normalized];
      persistDiscovered();
    }
    return emitChanged();
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
