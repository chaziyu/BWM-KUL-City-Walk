export function createChatControlTemplate() {
  return `<button id="btnChat" aria-label="Open AI Tour Guide" class="map-action-button">
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6A2.5 2.5 0 0 1 16.5 15H11l-4 3v-3.2A2.5 2.5 0 0 1 5 12.5v-6Z"></path>
      <path d="M9 9h6M9 12h4"></path>
    </svg>
    <span>AI Guide</span>
  </button>`;
}

export function createChatModalTemplate() {
  return `<div id="chatModal" class="modern-modal-backdrop fixed inset-0 hidden" role="dialog" aria-modal="true" aria-labelledby="chatModalTitle">
    <div class="modern-modal-content chat-panel animate-fade-scale">
      <header class="chat-panel__header">
        <div>
          <p class="ui-kicker">Verified trail assistant</p>
          <h2 id="chatModalTitle" class="ui-title">AI Tour Guide</h2>
        </div>
        <button id="closeChatModal" aria-label="Close AI tour guide" class="ui-icon-button chat-panel__close">×</button>
      </header>

      <div id="chatHistory" class="chat-panel__history">
        <div class="chat-bubble chat-bubble--assistant">
          <p class="chat-bubble__name">AI Guide</p>
          <p>I’m your AI Tour Guide for the verified BWM KUL City Walk stops. Ask me about a place, route, or story along the walk.</p>
        </div>
      </div>

      <footer class="chat-panel__composer">
        <p id="chatLimitText" class="chat-panel__limit">Checking AI message availability…</p>
        <div class="chat-panel__input-row">
          <input type="text" id="chatInput" placeholder="Ask about a site or story…" class="ui-field">
          <button id="chatSendBtn" class="ui-button ui-button--primary chat-panel__send">Send</button>
        </div>
      </footer>
    </div>
  </div>`;
}

export function createChatTemplate() {
  return `${createChatControlTemplate()}
${createChatModalTemplate()}`;
}
