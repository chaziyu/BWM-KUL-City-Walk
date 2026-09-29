export function createChatControlTemplate() {
  return '<button id="btnChat" aria-label="Open AI Tour Guide" class="bg-white/80 backdrop-blur-sm p-3 rounded-full shadow-xl hover:bg-gray-100 text-2xl transition transform hover:scale-110 border border-gray-200">💬</button>';
}

export function createChatModalTemplate() {
  return `<div id="chatModal" class="modern-modal-backdrop fixed inset-0 hidden" role="dialog" aria-modal="true" aria-labelledby="chatModalTitle">
    <div class="modern-modal-content animate-fade-scale">
      <div class="flex justify-between items-center p-4 border-b">
        <h2 id="chatModalTitle" class="text-xl font-bold text-gray-900">AI Tour Guide</h2>
        <button id="closeChatModal" aria-label="Close AI tour guide" class="text-gray-400 hover:text-gray-800 text-2xl transition">×</button>
      </div>
      <div id="chatHistory" class="flex-1 p-4 space-y-4 overflow-y-auto bg-gray-50 flex flex-col">
        <div class="p-3 rounded-lg bg-blue-100 text-blue-900 max-w-xs shadow-sm self-start">
          <p class="font-bold text-sm">AI Guide</p>
          <p>I’m your AI Tour Guide for the verified BWM KUL City Walk stops. Ask me about a place, route, or story along the walk.</p>
        </div>
      </div>
      <div class="p-4 border-t bg-white">
        <p id="chatLimitText" class="text-xs text-gray-500 text-center mb-2">Checking AI message availability…</p>
        <div class="flex gap-2">
          <input type="text" id="chatInput" placeholder="Ask a question..." class="flex-1 border-2 border-gray-200 p-2 rounded-lg focus:outline-none focus:border-blue-500 transition">
          <button id="chatSendBtn" class="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition">Send</button>
        </div>
      </div>
    </div>
  </div>`;
}

export function createChatTemplate() {
  return `${createChatControlTemplate()}
${createChatModalTemplate()}`;
}
