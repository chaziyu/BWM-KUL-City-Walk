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

    const completionNote = plan.isFullThread ? 'Full story' : `${plan.requestedMinutes}-minute version`;
    const meta = document.createElement('p');
    meta.className = 'trail-summary__meta';
    meta.textContent = `${plan.theme} · about ${plan.estimatedMinutes} min · ${plan.stops.length} stops · ${completionNote}`;

    const copy = document.createElement('p');
    copy.className = 'trail-summary__copy';
    copy.textContent = plan.summary;
    summary.replaceChildren(meta, copy);

    plan.stops.forEach((stop, index) => {
      const item = document.createElement('li');
      item.className = 'trail-stop';

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'trail-stop__button';

      const marker = document.createElement('span');
      marker.className = 'trail-stop__marker';
      marker.setAttribute('aria-hidden', 'true');
      marker.textContent = String(index + 1);

      const content = document.createElement('span');
      content.className = 'trail-stop__content';

      const heading = document.createElement('strong');
      heading.className = 'trail-stop__title';
      heading.textContent = stop.site.name;

      const timing = document.createElement('span');
      timing.className = 'trail-stop__timing';
      timing.textContent = index === 0
        ? `Explore about ${stop.visitMinutes} min`
        : `${stop.walkMinutesFromPrevious} min walk · explore about ${stop.visitMinutes} min`;

      const chapter = document.createElement('span');
      chapter.className = 'trail-stop__chapter';
      chapter.textContent = stop.chapter;

      const chevron = document.createElement('span');
      chevron.className = 'trail-stop__chevron';
      chevron.setAttribute('aria-hidden', 'true');
      chevron.textContent = '›';

      content.append(heading, timing, chapter);
      button.append(marker, content, chevron);
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
    if (summary) {
      const loading = document.createElement('p');
      loading.className = 'trail-summary__meta';
      loading.textContent = 'Building your story walk…';
      summary.replaceChildren(loading);
    }

    try {
      await ensureLoaded();
      render();
    } catch (error) {
      console.error('Unable to load heritage threads:', error);
      if (summary) {
        const errorMessage = document.createElement('p');
        errorMessage.className = 'trail-summary__copy';
        errorMessage.textContent = 'Story walks could not be loaded. You can still explore sites directly from the map.';
        summary.replaceChildren(errorMessage);
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
