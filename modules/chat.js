import { HISTORY_WINDOW_SIZE, MAX_MESSAGES_PER_SESSION } from './config.js';
import { chatHistory, userMessageCount, saveChatHistory, saveUserMessageCount } from './state.js';
import { STRINGS } from '../localization.js';
import { animateCloseModal } from './ui.js';

let chatSystemInitialized = false;
let chatModal, chatInput, chatSendBtn, chatLimitText, chatHistoryEl, closeChatModal;

export function initializeChatSystem() {
    if (chatSystemInitialized) return;

    chatModal = document.getElementById('chatModal');
    chatInput = document.getElementById('chatInput');
    chatSendBtn = document.getElementById('chatSendBtn');
    chatLimitText = document.getElementById('chatLimitText');
    chatHistoryEl = document.getElementById('chatHistory');
    closeChatModal = document.getElementById('closeChatModal');

    if (closeChatModal) {
        closeChatModal.addEventListener('click', () => {
            animateCloseModal(chatModal);
        });
    }

    if (chatSendBtn) chatSendBtn.addEventListener('click', handleSendMessage);
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSendMessage();
            }
        });
    }

    chatSystemInitialized = true;
    loadChatHistory();
}

export function loadChatHistory() {
    if (!chatHistoryEl) return;
    chatHistoryEl.innerHTML = "";
    chatHistory.forEach(msg => {
        const text = msg.parts ? msg.parts[0].text : msg.text;
        addChatMessage(msg.role, text);
    });
}

function addChatMessage(role, text) {
    if (!chatHistoryEl) return;

    const messageEl = document.createElement('div');
    const name = (role === 'user') ? STRINGS.chat.userName : STRINGS.chat.aiName;
    const align = (role === 'user') ? 'self-end' : 'self-start';
    const bg = (role === 'user') ? 'bg-white' : 'bg-blue-100';
    const textCol = (role === 'user') ? 'text-gray-900' : 'text-blue-900';

    // Parse markdown (assuming marked is global)
    const content = (role === 'model' && typeof marked !== 'undefined') ? marked.parse(text) : text;

    messageEl.className = `p-3 rounded-lg ${bg} ${textCol} max-w-xs shadow-sm ${align} chat-bubble`;
    messageEl.innerHTML = `<p class="font-bold text-sm mb-1">${name}</p><div>${content}</div>`;

    chatHistoryEl.appendChild(messageEl);
    chatHistoryEl.scrollTop = chatHistoryEl.scrollHeight;
    return messageEl;
}

export async function handleSendMessage() {
    if (!chatInput) return;
    const userQuery = chatInput.value.trim();
    const limit = Number(MAX_MESSAGES_PER_SESSION);

    // Check limit (unless admin - but we check local count here for UI speed, server/admin check is separate or we trust local for now)
    // For admin override, we might need to check session role.
    const sessionData = JSON.parse(localStorage.getItem('jejak_session'));
    const isAdmin = sessionData && sessionData.valid && sessionData.role === 'admin';

    if (!isAdmin && (!userQuery || userMessageCount >= limit)) {
        if (userMessageCount >= limit) disableChatUI(true);
        return;
    }

    chatInput.value = "";
    chatInput.disabled = true;
    chatSendBtn.disabled = true;

    addChatMessage('user', userQuery);
    const thinkingEl = addChatMessage('ai', '<span class="skeleton-loading text-xs px-8 rounded">Loading...</span>');

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userQuery: userQuery,
                history: chatHistory.slice(-HISTORY_WINDOW_SIZE)
            })
        });

        if (!response.ok) throw new Error('AI server error');

        const data = await response.json();

        // Update State
        chatHistory.push({ role: 'user', parts: [{ text: userQuery }] });
        chatHistory.push({ role: 'model', parts: [{ text: data.reply }] });
        saveChatHistory(chatHistory);

        if (!isAdmin) {
            saveUserMessageCount(userMessageCount + 1);
            updateChatUIWithCount(); // Update UI
        }

        const contentEl = thinkingEl.querySelector('div:last-child');
        if (contentEl) {
            contentEl.innerHTML = (typeof marked !== 'undefined') ? marked.parse(data.reply) : data.reply;
        }
        thinkingEl.classList.add('chat-bubble');

    } catch (error) {
        console.error("Chat error:", error);
        const contentEl = thinkingEl.querySelector('div:last-child');
        if (contentEl) contentEl.textContent = STRINGS.chat.error;
        thinkingEl.classList.add('bg-red-100', 'text-red-900');
    }

    if (isAdmin || userMessageCount < limit) {
        chatInput.disabled = false;
        chatSendBtn.disabled = false;
        chatInput.focus();
    } else {
        disableChatUI(true);
    }
}

export function updateChatUIWithCount() {
    if (!chatLimitText) return;

    const sessionData = JSON.parse(localStorage.getItem('jejak_session'));
    const isAdmin = sessionData && sessionData.valid && sessionData.role === 'admin';

    if (isAdmin) {
        chatLimitText.textContent = "⚡ UNLIMITED ADMIN ACCESS";
        chatLimitText.classList.add('text-yellow-600', 'font-black');
        disableChatUI(false);
        return;
    }

    const remaining = MAX_MESSAGES_PER_SESSION - userMessageCount;
    chatLimitText.textContent = `You have ${remaining} messages remaining.`;

    if (remaining <= 0) {
        disableChatUI(true);
    }
}

function disableChatUI(flag) {
    if (!chatInput || !chatSendBtn) return;
    chatInput.disabled = flag;
    chatSendBtn.disabled = flag;
    if (flag) {
        chatLimitText.textContent = STRINGS.chat.limitReached;
        chatInput.placeholder = STRINGS.chat.limitReached;
    }
}
