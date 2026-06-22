/* @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { renderPassportStamps } from '../../src/features/passport/stamp-renderer.js';

describe('stamp renderer', () => {
  it('renders mock site data and marks completed sites', async () => {
    document.body.innerHTML = '<div id="grid"></div>';
    const grid = document.getElementById('grid');

    renderPassportStamps({
      container: grid,
      sites: [
        { id: '1', name: 'Alpha', image: '/alpha.png' },
        { id: '2', name: 'Beta', image: '/beta.png' },
      ],
      completedIds: ['2'],
    });

    await new Promise((resolve) => requestAnimationFrame(resolve));

    expect(grid.children).toHaveLength(2);
    expect(grid.children[0].classList.contains('grayscale')).toBe(true);
    expect(grid.children[1].classList.contains('grayscale')).toBe(false);
    expect(grid.children[1].querySelector('img').classList.contains('stamp-animate')).toBe(true);
  });
});
