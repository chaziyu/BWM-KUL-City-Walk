/* @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest';
import { createMapPreview } from '../../src/features/map/map-preview.js';

describe('map preview', () => {
  it('renders a selected site and opens details from the preview card', () => {
    document.body.innerHTML = `
      <div id="previewCard" class="hidden">
        <img id="previewImage">
        <h3 id="previewTitle"></h3>
        <p id="previewInfo"></p>
        <p id="previewDist"></p>
        <button id="previewOpenBtn"></button>
        <button id="previewCloseBtn"></button>
      </div>
    `;
    const site = { id: '1', name: 'Heritage Site', info: 'Brief site description.', image: '/site.jpg' };
    const openSiteDetails = vi.fn();
    const preview = createMapPreview({
      strings: { preview: { tapForDetails: 'Tap for details' } },
      getSites: () => [site],
      openSiteDetails,
    });

    preview.bind();
    preview.open(site);
    document.getElementById('previewOpenBtn').click();

    expect(document.getElementById('previewTitle').textContent).toBe('1. Heritage Site');
    expect(document.getElementById('previewInfo').textContent).toBe('Brief site description.');
    expect(document.getElementById('previewDist').textContent).toBe('Tap for details');
    expect(document.getElementById('previewCard').classList.contains('hidden')).toBe(false);
    expect(openSiteDetails).toHaveBeenCalledWith(site);
  });
});
