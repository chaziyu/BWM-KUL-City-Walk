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
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Unable to load heritage site data (HTTP ${response.status}).`);
      }
      return response.json();
    })
    .then((sites) => {
      siteCache = (sites || []).map(normalizeSite);
      return siteCache;
    })
    .catch((error) => {
      loadPromise = null;
      throw error;
    });

  return loadPromise;
}

export function getCachedSiteData() {
  return siteCache || [];
}
