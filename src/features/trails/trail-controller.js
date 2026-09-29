import { buildTrailPlan, getTrailById } from './trail-engine.js';

export function createTrailController({
  getSites,
  loadTrails,
  modalManager,
  onSiteSelected,
}) {
  let bound = false;
  let trails = [];
  let selectedTrailId = '';
  let durationMinutes = 60;

  function setDurationButtons() {
    document.querySelectorAll('[data-trail-duration]').forEach((button) => {
      const isActive = Number(button.dataset.trailDuration) === durationMinutes;
      button.setAttribute('aria-pressed', String(isActive));
      button.classList.toggle('ui-button--secondary', isActive);
      button.classList.toggle('ui-button--quiet', !isActive);
    });
  }

  function fillTrailSelect() {
    const select = document.getElementById('trailThemeSelect');
    if (!select) return;

    const previous = selectedTrailId || select.value;
    select.replaceChildren();

    trails.forEach((trail) => {
      const option = document.createElement('option');
      option.value = String(trail.id);
      option.textContent = `${trail.title} — ${trail.theme}`;
      select.appendChild(option);
    });

    selectedTrailId = getTrailById(trails, previous)?.id || trails[0]?.id || '';
    select.value = selectedTrailId;
  }

  function render() {
    const summary = document.getElementById('trailSummary');
    const list = document.getElementById('trailStops');
    if (!summary || !list) return;

    const trail = getTrailById(trails, selectedTrailId);
    const plan = buildTrailPlan(trail, getSites?.() || [], durationMinutes);
    list.replaceChildren();

    if (!plan || !plan.stops.length) {
      summary.textContent = 'This story thread is unavailable right now.';
      return;
    }

    const completionNote = plan.isFullThread ? 'full thread' : `${plan.requestedMinutes}-minute version`;
    summary.textContent = `${plan.summary} About ${plan.estimatedMinutes} minutes · ${plan.stops.length} stops · ${completionNote}.`;

    plan.stops.forEach((stop, index) => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'w-full text-left rounded-xl border border-gray-200 bg-white p-3 hover:bg-gray-50 transition';

      const heading = document.createElement('strong');
      heading.className = 'block text-sm text-gray-900';
      heading.textContent = `${index + 1}. ${stop.site.name}`;

      const timing = document.createElement('span');
      timing.className = 'block text-xs text-gray-500 mt-1';
      timing.textContent = index === 0
        ? `Explore about ${stop.visitMinutes} min`
        : `${stop.walkMinutesFromPrevious} min walk · explore about ${stop.visitMinutes} min`;

      const chapter = document.createElement('span');
      chapter.className = 'block text-sm text-gray-700 mt-2';
      chapter.textContent = stop.chapter;

      button.append(heading, timing, chapter);
      button.addEventListener('click', () => {
        modalManager.close('trailModal');
        onSiteSelected?.(stop.site);
      });
      item.appendChild(button);
      list.appendChild(item);
    });
  }

  async function ensureLoaded() {
    if (trails.length) return trails;
    trails = await loadTrails();
    fillTrailSelect();
    return trails;
  }

  async function open() {
    modalManager.open('trailModal');
    const summary = document.getElementById('trailSummary');
    if (summary) summary.textContent = 'Building your heritage thread...';

    try {
      await ensureLoaded();
      render();
    } catch (error) {
      console.error('Unable to load heritage threads:', error);
      if (summary) {
        summary.textContent = 'Heritage threads could not be loaded. You can still explore sites directly from the map.';
      }
    }
  }

  function bind() {
    if (bound) return;
    bound = true;

    document.getElementById('btnTrails')?.addEventListener('click', () => void open());
    document.getElementById('closeTrailModal')?.addEventListener('click', () => modalManager.close('trailModal'));

    document.getElementById('trailThemeSelect')?.addEventListener('change', (event) => {
      selectedTrailId = event.target.value;
      render();
    });

    document.querySelectorAll('[data-trail-duration]').forEach((button) => {
      button.addEventListener('click', () => {
        durationMinutes = Number(button.dataset.trailDuration) || 60;
        setDurationButtons();
        render();
      });
    });

    setDurationButtons();
  }

  return {
    bind,
    open,
    render,
  };
}
