let siteCache = null;
let loadPromise = null;

function normalizeSite(site) {
  return {
    ...site,
    id: String(site.id),
  };
}

export async function loadSiteData() {
  if (siteCache) return siteCache;
  if (loadPromise) return loadPromise;

  loadPromise = fetch(new URL('../../../data/sites.json', import.meta.url))
    .then((response) => response.json())
    .then((sites) => {
      siteCache = (sites || []).map(normalizeSite);
      return siteCache;
    });

  return loadPromise;
}

export function getCachedSiteData() {
  return siteCache || [];
}
