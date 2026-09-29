// @ts-check

/** @typedef {import('../../types/domain.js').HeritageSite} HeritageSite */

/**
 * @param {HeritageSite | null | undefined} site
 * @returns {boolean}
 */
export function isMustVisitSite(site) {
  return site?.category === 'must_visit';
}

/**
 * @param {HeritageSite[] | null | undefined} sites
 * @returns {HeritageSite[]}
 */
export function getMustVisitSites(sites) {
  return (sites || []).filter(isMustVisitSite);
}
