/* @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest';
import { createChatUI } from '../../src/features/chat/chat-ui.js';

const strings = { chat: { aiName: 'AI Guide', userName: 'You', limitReached: 'Done', placeholder: 'Ask' } };

describe('chat UI sources', () => {
  it('renders locally resolved source chips', () => {
    const onSourceClick = vi.fn();
    document.body.innerHTML = '<div id="chatHistory"></div>';
    const ui = createChatUI({
      strings,
      getSiteName: (id) => (id === '1' ? 'Sultan Abdul Samad Building' : null),
      onSourceClick,
    });

    ui.addMessage('model', 'Answer', { sourceSiteIds: ['1'], notFound: false });
    document.querySelector('.source-chip').click();

    expect(document.querySelector('.source-chip')?.textContent).toBe('Sultan Abdul Samad Building');
    expect(onSourceClick).toHaveBeenCalledWith('1');
  });

  it('does not render source chips for notFound answers', () => {
    document.body.innerHTML = '<div id="chatHistory"></div>';
    const ui = createChatUI({ strings, getSiteName: () => 'Sultan Abdul Samad Building' });

    ui.addMessage('model', 'No verified info', { sourceSiteIds: ['1'], notFound: true });

    expect(document.querySelector('.source-chip')).toBeNull();
  });
});
