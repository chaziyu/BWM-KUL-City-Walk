export function createMapFilter(initialMode = 'must_visit') {
  let activeMode = initialMode;

  return {
    getMode: () => activeMode,
    getVisibleSites(sites) {
      return (sites || []).filter((site) => site.category === activeMode);
    },
    setMode(nextMode) {
      activeMode = nextMode === 'recommended' ? 'recommended' : 'must_visit';
      return activeMode;
    },
  };
}
