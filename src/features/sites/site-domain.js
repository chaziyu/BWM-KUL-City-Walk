export function isMustVisitSite(site) {
  return site?.category === 'must_visit';
}

export function getMustVisitSites(sites) {
  return (sites || []).filter(isMustVisitSite);
}
