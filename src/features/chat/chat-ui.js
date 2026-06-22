function sanitizeRenderedHtml(html) {
  const template = document.createElement('template');
  template.innerHTML = html;
  const allowedTags = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'UL', 'OL', 'LI', 'A', 'CODE', 'PRE', 'BLOCKQUOTE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6']);
  const allowedProtocols = new Set(['http:', 'https:', 'mailto:', 'tel:']);

  function cleanNode(node) {
    if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent || '');
    if (node.nodeType !== Node.ELEMENT_NODE) return document.createDocumentFragment();

    const tagName = node.tagName.toUpperCase();
    const fragment = document.createDocumentFragment();
    if (!allowedTags.has(tagName)) {
      node.childNodes.forEach((child) => fragment.appendChild(cleanNode(child)));
      return fragment;
    }

    const cleanElement = document.createElement(tagName.toLowerCase());
    if (tagName === 'A') {
      const rawHref = node.getAttribute('href') || '';
      try {
        const url = new URL(rawHref, window.location.origin);
        if (allowedProtocols.has(url.protocol)) {
          cleanElement.href = url.href;
          cleanElement.target = '_blank';
          cleanElement.rel = 'noopener noreferrer';
        }
      } catch {}
    }

    node.childNodes.forEach((child) => cleanElement.appendChild(cleanNode(child)));
    return cleanElement;
  }

  const cleanFragment = document.createDocumentFragment();
  template.content.childNodes.forEach((node) => cleanFragment.appendChild(cleanNode(node)));
  return cleanFragment;
}

export function createChatUI({ strings }) {
  async function renderSafeMarkdown(container, text) {
    if (!container) return;
    container.replaceChildren();
    if (typeof marked === 'undefined') {
      container.textContent = text || '';
      return;
    }

    const rawHtml = await marked.parse(text || '');
    container.appendChild(sanitizeRenderedHtml(rawHtml));
  }

  function addMessage(role, text, options = {}) {
    const chatHistoryEl = document.getElementById('chatHistory');
    if (!chatHistoryEl) return null;

    const messageEl = document.createElement('div');
    const isUser = role === 'user';
    messageEl.className = `p-3 rounded-lg ${isUser ? 'bg-white text-gray-900 self-end' : 'bg-blue-100 text-blue-900 self-start'} max-w-xs shadow-sm chat-bubble`;

    const nameEl = document.createElement('p');
    nameEl.className = 'font-bold text-sm mb-1';
    nameEl.textContent = isUser ? strings.chat.userName : strings.chat.aiName;

    const contentEl = document.createElement('div');
    contentEl.className = 'chat-content';
    if (options.loading) {
      const loadingEl = document.createElement('span');
      loadingEl.className = 'skeleton-loading text-xs px-8 rounded';
      loadingEl.textContent = text;
      contentEl.appendChild(loadingEl);
    } else if (role === 'model') {
      void renderSafeMarkdown(contentEl, text);
    } else {
      contentEl.textContent = text;
    }

    messageEl.append(nameEl, contentEl);
    chatHistoryEl.appendChild(messageEl);
    chatHistoryEl.scrollTop = chatHistoryEl.scrollHeight;
    return messageEl;
  }

  function loadHistory(chatHistory) {
    const chatHistoryEl = document.getElementById('chatHistory');
    if (!chatHistoryEl) return;
    chatHistoryEl.innerHTML = '';
    chatHistory.forEach((msg) => {
      const text = msg.parts ? msg.parts[0].text : msg.text;
      addMessage(msg.role, text);
    });
  }

  function setDisabled(flag) {
    const chatInput = document.getElementById('chatInput');
    const chatSendBtn = document.getElementById('chatSendBtn');
    const chatLimitText = document.getElementById('chatLimitText');
    if (!chatInput || !chatSendBtn || !chatLimitText) return;

    chatInput.disabled = flag;
    chatSendBtn.disabled = flag;
    chatInput.placeholder = flag ? strings.chat.limitReached : strings.chat.placeholder;
    if (flag) chatLimitText.textContent = strings.chat.limitReached;
  }

  function updateCount(remaining) {
    const chatLimitText = document.getElementById('chatLimitText');
    if (!chatLimitText) return;
    chatLimitText.textContent = `You have ${remaining} messages remaining.`;
    if (remaining <= 0) setDisabled(true);
  }

  return { addMessage, loadHistory, renderSafeMarkdown, setDisabled, updateCount };
}
