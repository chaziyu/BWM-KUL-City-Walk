/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const loadHistory = vi.fn();
const addMessage = vi.fn();
const renderSafeMarkdown = vi.fn();
const renderSourceChips = vi.fn();
const setDisabled = vi.fn();
const updateCount = vi.fn();
const send = vi.fn();

vi.mock('../../src/features/chat/chat-service.js', () => ({
  createChatService: vi.fn(() => ({ send })),
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
    send.mockReset();
  });

  it('loads only the active chat scope', () => {
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
      setHistory: vi.fn(),
      setMessageCount: vi.fn(),
      strings: { chat: { aiName: 'AI', userName: 'You', limitReached: 'Done', placeholder: 'Ask', error: 'Error' } },
    });

    controller.loadHistory();

    expect(loadHistory).toHaveBeenCalledWith([history[0]]);
  });

  it('prefills site chat without automatically sending a message', () => {
    const history = [
      { role: 'user', parts: [{ text: 'General question' }], meta: { scopeKey: 'general' } },
      { role: 'user', parts: [{ text: 'Site question' }], meta: { scopeKey: 'site:1' } },
    ];
    const modalManager = { open: vi.fn(), close: vi.fn() };
    const controller = createChatController({
      deviceId: 'device-1',
      getChatLimit: () => 5,
      getHistory: () => history,
      getMessageCount: () => 0,
      historyWindowSize: 6,
      getSiteName: () => 'Site',
      modalManager,
      saveHistory: vi.fn(),
      setHistory: vi.fn(),
      setMessageCount: vi.fn(),
      strings: { chat: { aiName: 'AI', userName: 'You', limitReached: 'Done', placeholder: 'Ask', error: 'Error' } },
    });

    controller.open({ siteId: '1' });

    expect(loadHistory).toHaveBeenLastCalledWith([history[1]]);
    expect(document.getElementById('chatInput').value).toBe('Tell me more about this site.');
    expect(send).not.toHaveBeenCalled();
  });
  it('syncs the local counter from server remaining quota', async () => {
    let messageCount = 0;
    const setMessageCount = vi.fn((next) => {
      messageCount = next;
    });
    const messageElement = document.createElement('div');
    const content = document.createElement('div');
    content.className = 'chat-content';
    messageElement.appendChild(content);
    addMessage.mockReturnValue(messageElement);
    send.mockResolvedValue({
      reply: 'Verified answer',
      remainingQuota: 3,
      sourceSiteIds: [],
      notFound: false,
    });

    const controller = createChatController({
      deviceId: 'device-1',
      getChatLimit: () => 5,
      getHistory: () => [],
      getMessageCount: () => messageCount,
      historyWindowSize: 6,
      getSiteName: () => 'Site',
      modalManager: { open: vi.fn(), close: vi.fn() },
      saveHistory: vi.fn(),
      setHistory: vi.fn(),
      setMessageCount,
      strings: { chat: { aiName: 'AI', userName: 'You', limitReached: 'Done', placeholder: 'Ask', error: 'Error' } },
    });

    document.getElementById('chatInput').value = 'Question';
    await controller.sendMessage();

    expect(setMessageCount).toHaveBeenCalledWith(2);
    expect(messageCount).toBe(2);
  });

  it('keeps chat available for cached queries after a server quota error', async () => {
    let messageCount = 0;
    const setMessageCount = vi.fn((next) => {
      messageCount = next;
    });
    const messageElement = document.createElement('div');
    const content = document.createElement('div');
    content.className = 'chat-content';
    messageElement.appendChild(content);
    addMessage.mockReturnValue(messageElement);
    const error = new Error('Quota reached');
    error.remainingQuota = 0;
    send.mockRejectedValue(error);

    const controller = createChatController({
      deviceId: 'device-1',
      getChatLimit: () => 5,
      getHistory: () => [],
      getMessageCount: () => messageCount,
      historyWindowSize: 6,
      getSiteName: () => 'Site',
      modalManager: { open: vi.fn(), close: vi.fn() },
      saveHistory: vi.fn(),
      setHistory: vi.fn(),
      setMessageCount,
      strings: { chat: { aiName: 'AI', userName: 'You', limitReached: 'Done', placeholder: 'Ask', error: 'Error' } },
    });

    document.getElementById('chatInput').value = 'Question';
    await controller.sendMessage();

    expect(setMessageCount).toHaveBeenCalledWith(5);
    expect(setDisabled).not.toHaveBeenCalledWith(true);
    expect(document.getElementById('chatInput').disabled).toBe(false);
    expect(document.getElementById('chatSendBtn').disabled).toBe(false);
  });
});
