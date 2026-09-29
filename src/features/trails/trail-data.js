let trailCache = null;
let loadPromise = null;

export async function loadTrailData() {
  if (trailCache) return trailCache;
  if (loadPromise) return loadPromise;

  loadPromise = fetch(new URL('../../../data/trails.json', import.meta.url))
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Unable to load heritage threads (HTTP ${response.status}).`);
      }
      return response.json();
    })
    .then((trails) => {
      trailCache = Array.isArray(trails) ? trails : [];
      return trailCache;
    })
    .catch((error) => {
      loadPromise = null;
      throw error;
    });

  return loadPromise;
}

export function getCachedTrailData() {
  return trailCache || [];
}
