// @ts-check

/** @typedef {import('../../types/domain.js').HeritageSite} HeritageSite */

const DEFAULT_BUDGET_MINUTES = 60;
const MIN_STOPS = 2;

function positiveMinutes(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function normalizeTrailBudget(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_BUDGET_MINUTES;
  return Math.max(15, Math.min(180, Math.round(parsed)));
}

export function getTrailById(trails, trailId) {
  return (trails || []).find((trail) => String(trail.id) === String(trailId)) || null;
}

export function buildTrailPlan(trail, sites, requestedMinutes = DEFAULT_BUDGET_MINUTES) {
  if (!trail || !Array.isArray(trail.stops)) return null;

  const budgetMinutes = normalizeTrailBudget(requestedMinutes);
  const siteById = new Map((sites || []).map((site) => [String(site.id), site]));
  const stops = [];
  let estimatedMinutes = 0;

  for (const stop of trail.stops) {
    const site = siteById.get(String(stop.siteId));
    if (!site) continue;

    const walkMinutes = stops.length === 0
      ? 0
      : positiveMinutes(stop.walkMinutesFromPrevious);
    const visitMinutes = Math.max(1, positiveMinutes(stop.visitMinutes, 6));
    const stopMinutes = walkMinutes + visitMinutes;

    if (stops.length >= MIN_STOPS && estimatedMinutes + stopMinutes > budgetMinutes) {
      break;
    }

    stops.push({
      site,
      chapter: String(stop.chapter || ''),
      visitMinutes,
      walkMinutesFromPrevious: walkMinutes,
    });
    estimatedMinutes += stopMinutes;
  }

  return {
    id: String(trail.id || ''),
    title: String(trail.title || ''),
    theme: String(trail.theme || ''),
    summary: String(trail.summary || ''),
    requestedMinutes: budgetMinutes,
    estimatedMinutes,
    stops,
    isFullThread: stops.length === trail.stops.filter((stop) => siteById.has(String(stop.siteId))).length,
  };
}
