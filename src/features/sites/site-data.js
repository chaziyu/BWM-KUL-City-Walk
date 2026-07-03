let siteCache = null;
let loadPromise = null;

function normalizeSite(site) {
  return {
    ...site,
    id: String(site.id),
  };
}

async function fetchAndValidateSites() {
  const response = await fetch(new URL('../../../data/sites.json', import.meta.url));
  if (!response.ok) {
    throw new Error(`Failed to load sites: ${response.status} ${response.statusText}`);
  }
  const sites = await response.json();
  if (!Array.isArray(sites)) {
    throw new Error('Fetched sites data must be an array');
  }
  return sites.map(normalizeSite);
}

export async function loadSiteData() {
  if (siteCache) return siteCache;
  if (loadPromise) return loadPromise;

  loadPromise = fetchAndValidateSites();

  try {
    siteCache = await loadPromise;
    return siteCache;
  } finally {
    loadPromise = null;
  }
}

export function resetSiteCache() {
  siteCache = null;
  loadPromise = null;
}
