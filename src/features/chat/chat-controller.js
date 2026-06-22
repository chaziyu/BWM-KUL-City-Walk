import { createChatService } from './chat-service.js';
import { createChatUI } from './chat-ui.js';

export function createChatController({
  deviceId,
  getChatLimit,
  getHistory,
  getMessageCount,
  historyWindowSize,
  modalManager,
  saveHistory,
  saveMessageCount,
  setHistory,
  setMessageCount,
  strings,
}) {
  const service = createChatService({ deviceId });
  const ui = createChatUI({ strings });

  function bind() {
    const button = document.getElementById('btnChat');
    if (button && button.dataset.bound !== 'true') {
      button.dataset.bound = 'true';
      button.addEventListener('click', () => open());
    }

    const closeButton = document.getElementById('closeChatModal');
    if (closeButton && closeButton.dataset.bound !== 'true') {
      closeButton.dataset.bound = 'true';
      closeButton.addEventListener('click', () => modalManager.close('chatModal'));
    }

    const sendButton = document.getElementById('chatSendBtn');
    if (sendButton && sendButton.dataset.bound !== 'true') {
      sendButton.dataset.bound = 'true';
      sendButton.addEventListener('click', () => void sendMessage());
    }

    const input = document.getElementById('chatInput');
    if (input && input.dataset.bound !== 'true') {
      input.dataset.bound = 'true';
      input.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') void sendMessage();
      });
    }
  }

  function open(context = {}) {
    bind();
    modalManager.open('chatModal');
    if (context.site) {
      const input = document.getElementById('chatInput');
      if (input) input.value = `Tell me more about ${context.site.name}.`;
      void sendMessage();
    } else if (typeof context === 'string') {
      const input = document.getElementById('chatInput');
      if (input) input.value = context;
      void sendMessage();
    }
  }

  function loadHistory() {
    ui.loadHistory(getHistory());
  }

  function updateCount() {
    ui.updateCount(getChatLimit() - getMessageCount());
  }

  function setDisabled(flag) {
    ui.setDisabled(flag);
  }

  async function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const chatSendBtn = document.getElementById('chatSendBtn');
    if (!chatInput || !chatSendBtn) return;

    const userQuery = chatInput.value.trim();
    const limit = getChatLimit();
    if (!userQuery || getMessageCount() >= limit) {
      if (getMessageCount() >= limit) ui.setDisabled(true);
      return;
    }

    chatInput.value = '';
    chatInput.disabled = true;
    chatSendBtn.disabled = true;
    ui.addMessage('user', userQuery);
    const thinkingEl = ui.addMessage('model', 'Loading...', { loading: true });

    try {
      const reply = await service.send({
        userQuery,
        history: getHistory().slice(-historyWindowSize),
      });
      const nextHistory = [
        ...getHistory(),
        { role: 'user', parts: [{ text: userQuery }] },
        { role: 'model', parts: [{ text: reply }] },
      ];
      setHistory(nextHistory);
      saveHistory();

      setMessageCount(getMessageCount() + 1);
      saveMessageCount();
      updateCount();

      await ui.renderSafeMarkdown(thinkingEl?.querySelector('.chat-content'), reply);
      thinkingEl?.classList.add('chat-bubble');
    } catch (error) {
      const content = thinkingEl?.querySelector('.chat-content');
      if (content) {
        content.textContent = error.message || strings.chat.error;
        thinkingEl.classList.add('bg-red-100', 'text-red-900');
      }
    }

    if (getMessageCount() < limit) {
      chatInput.disabled = false;
      chatSendBtn.disabled = false;
      chatInput.focus();
    } else {
      ui.setDisabled(true);
    }
  }

  return { bind, loadHistory, open, sendMessage, setDisabled, updateCount };
}
