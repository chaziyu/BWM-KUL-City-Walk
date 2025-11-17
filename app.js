// --- CONFIGURATION ---
const HISTORY_WINDOW_SIZE = 10;
const MAX_MESSAGES_PER_SESSION = 15; // Set the limit for user messages

// --- GAME STATE ---
let map = null;
let visitedSites = JSON.parse(localStorage.getItem('jejak_visited')) || [];
let discoveredSites = JSON.parse(localStorage.getItem('jejak_discovered')) || [];
const TOTAL_SITES = 13; 
let allSiteData = []; 
let chatHistory = [];
let userMessageCount = parseInt(localStorage.getItem('jejak_message_count')) || 0;


// --- CORE GAME & MAP INITIALIZATION ---
function initializeGameAndMap() {
    // ... (This function is correct and unchanged)
}

// --- GLOBAL UI HANDLERS & LOGIC ---

// NEW: A centralized function to update all chat UI elements with the current message count.
function updateChatUIWithCount() {
    const counter = document.getElementById('chatMessageCounter');
    const input = document.getElementById('chatInput');
    const remaining = Math.max(0, MAX_MESSAGES_PER_SESSION - userMessageCount);

    if (counter) {
        counter.textContent = `${remaining}/${MAX_MESSAGES_PER_SESSION} LEFT`;
    }
    if (input) {
        if (remaining > 0) {
            input.placeholder = `Ask a question (${remaining} left)...`;
        } else {
            input.placeholder = "You've reached your message limit.";
        }
    }
}

function disableChatUI(isInitialLoad = false) {
    const chatInput = document.getElementById('chatInput');
    const chatSendBtn = document.getElementById('chatSendBtn');
    
    chatInput.disabled = true;
    chatSendBtn.disabled = true;
    chatSendBtn.textContent = 'Limit';
    updateChatUIWithCount(); // Update the counter to show 0
    
    if (!isInitialLoad) {
        addMessageToUI("You have reached your message limit for this session. Please continue enjoying the heritage walk!", 'bot');
    }
}

// MODIFIED: The chat functions now include the limit logic
function addMessageToHistory(message, role) {
    chatHistory.push({ role, parts: [{ text: message }] });
}

function addMessageToUI(message, sender) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('flex', 'justify-' + (sender === 'user' ? 'end' : 'start'));
    messageDiv.innerHTML = `<div class="${sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'} p-3 rounded-lg max-w-xs"><p>${message}</p></div>`;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function handleChatSend(query, isSilent = false) {
    const chatInput = document.getElementById('chatInput');
    const chatSendBtn = document.getElementById('chatSendBtn');
    const userQuery = query || chatInput.value.trim();
    if (!userQuery) return;

    if (!isSilent) {
        if (userMessageCount >= MAX_MESSAGES_PER_SESSION) {
            disableChatUI();
            return;
        }
        userMessageCount++;
        localStorage.setItem('jejak_message_count', userMessageCount);
        updateChatUIWithCount(); // Update UI immediately after sending
    }

    addMessageToHistory(userQuery, 'user');
    if (!isSilent) {
        addMessageToUI(userQuery, 'user');
    }

    chatInput.value = '';
    chatSendBtn.disabled = true;
    chatSendBtn.textContent = '...';
    
    try {
        const recentHistory = chatHistory.slice(-HISTORY_WINDOW_SIZE);
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userQuery, history: recentHistory })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.reply || "Failed to get response.");

        addMessageToHistory(data.reply, 'model');
        addMessageToUI(data.reply, 'bot');

    } catch (error) {
        const errorMessage = `Error: ${error.message}`;
        addMessageToHistory(errorMessage, 'model');
        addMessageToUI(errorMessage, 'bot');
    } finally {
        if (userMessageCount < MAX_MESSAGES_PER_SESSION) {
            chatSendBtn.disabled = false;
            chatSendBtn.textContent = 'Send';
        } else {
            disableChatUI();
        }
    }
}

// --- APP STARTUP & LANDING PAGE LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    function initApp() {
        const sessionData = JSON.parse(localStorage.getItem('jejak_session'));
        const SESSION_DURATION = 24 * 60 * 60 * 1000;
        
        if (sessionData && sessionData.valid && (Date.now() - sessionData.start < SESSION_DURATION)) {
             document.getElementById('landing-page')?.remove();
             document.getElementById('gatekeeper')?.remove();
             document.getElementById('game-ui').classList.remove('hidden');
             initializeGameAndMap();
             updateGameProgress();
             
             // Update the chat UI with the count on initial load
             updateChatUIWithCount();
             if (userMessageCount >= MAX_MESSAGES_PER_SESSION) {
                 disableChatUI(true);
             }
        } else {
            // Reset message count for a new session
            localStorage.removeItem('jejak_message_count');
            userMessageCount = 0; // Also reset the in-memory variable
            localStorage.removeItem('jejak_session');
            setupLandingPage();
        }
    }

    function setupLandingPage() {
        // ... (This function remains unchanged)
    }

    // ... (All other functions from the previous correct version remain here)
    // - showAdminCode()
    // - setupGatekeeperLogic()
    // - verifyCode()
    // - initializeGameAndMap() and its helpers (handleMarkerClick, etc.) are now outside this listener.

    // Set up listeners for in-game buttons
    const btnChat = document.getElementById('btnChat');
    if (btnChat) {
        btnChat.addEventListener('click', () => {
            updateChatUIWithCount(); // Ensure count is fresh every time modal opens
            document.getElementById('chatModal').classList.remove('hidden');
        });
    }

    // ... (All other event listeners from the previous correct version remain here)

    // --- START THE APP ---
    initApp();
});
