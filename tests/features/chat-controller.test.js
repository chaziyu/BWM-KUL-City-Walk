/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const loadHistory = vi.fn();
const addMessage = vi.fn();
const renderSafeMarkdown = vi.fn();
const renderSourceChips = vi.fn();
const setDisabled = vi.fn();
const updateCount = vi.fn();

vi.mock('../../src/features/chat/chat-service.js', () => ({
  createChatService: vi.fn(() => ({ send: vi.fn() })),
}));

vi.mock('../../src/features/chat/chat-ui.js', () => ({
  createChatUI: vi.fn(() => ({
    addMessage,
    loadHistory,
    renderSafeMarkdown,
    renderSourceChips,
    setDisabled,
    updateCount,
  })),
}));

import { createChatController } from '../../src/features/chat/chat-controller.js';

describe('chat controller history', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="chatHistory"></div><input id="chatInput" /><button id="chatSendBtn"></button>';
    loadHistory.mockClear();
    addMessage.mockClear();
    renderSafeMarkdown.mockClear();
    renderSourceChips.mockClear();
    setDisabled.mockClear();
    updateCount.mockClear();
  });

  it('loads the full stored history when a site chat opens', () => {
    const history = [
      { role: 'user', parts: [{ text: 'General question' }], meta: { scopeKey: 'general' } },
      { role: 'user', parts: [{ text: 'Site question' }], meta: { scopeKey: 'site:1' } },
    ];
    const controller = createChatController({
      deviceId: 'device-1',
      getChatLimit: () => 5,
      getHistory: () => history,
      getMessageCount: () => 0,
      historyWindowSize: 6,
      getSiteName: () => 'Site',
      modalManager: { open: vi.fn(), close: vi.fn() },
      saveHistory: vi.fn(),
      saveMessageCount: vi.fn(),
      setHistory: vi.fn(),
      setMessageCount: vi.fn(),
      strings: { chat: { aiName: 'AI', userName: 'You', limitReached: 'Done', placeholder: 'Ask', error: 'Error' } },
    });

    controller.loadHistory();

    expect(loadHistory).toHaveBeenCalledWith(history);
  });
});
