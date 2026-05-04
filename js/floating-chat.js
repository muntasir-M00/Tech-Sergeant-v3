// public/js/floating-chat.js

let isOpen = false;
let isMinimized = false;

function toggleChat() {
  isOpen = !isOpen;
  renderChat();
}

function minimizeChat() {
  isMinimized = !isMinimized;
  renderChat();
}

function closeChat() {
  isOpen = false;
  isMinimized = false;
  renderChat();
}

function renderChat() {
  const chatContainer = document.getElementById('floating-chat');
  
  if (!isOpen) {
    chatContainer.innerHTML = `
      <button onclick="toggleChat()" 
        class="fixed bottom-6 right-6 h-14 w-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl flex items-center justify-center z-50 transition-all">
        <i data-lucide="message-circle" class="w-6 h-6"></i>
      </button>
    `;
  } else {
    chatContainer.innerHTML = `
      <div class="fixed bottom-6 right-6 w-96 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden transition-all ${isMinimized ? 'h-14' : 'h-[500px]'}">
        
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-zinc-700 bg-zinc-950">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <i data-lucide="message-circle" class="w-5 h-5"></i>
            </div>
            <div>
              <p class="font-medium text-white">Chat Assistant</p>
              <p class="text-xs text-zinc-500">Online</p>
            </div>
          </div>
          <div class="flex gap-1">
            <button onclick="minimizeChat()" class="text-zinc-400 hover:text-white p-1">
              <i data-lucide="minus" class="w-5 h-5"></i>
            </button>
            <button onclick="closeChat()" class="text-zinc-400 hover:text-white p-1">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>
        </div>

        ${!isMinimized ? `
        <!-- Messages -->
        <div class="flex-1 p-4 overflow-y-auto bg-zinc-900 space-y-4" id="chat-messages">
          <div class="text-zinc-400 text-sm">Hello! How can I help you today?</div>
        </div>

        <!-- Input -->
        <div class="p-4 border-t border-zinc-700 bg-zinc-950">
          <div class="flex gap-2">
            <input type="text" id="chat-input" 
              class="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white"
              placeholder="Type your message...">
            <button onclick="sendMessage()" 
              class="bg-blue-600 hover:bg-blue-700 px-6 rounded-xl text-white font-medium">Send</button>
          </div>
        </div>` : ''}
      </div>
    `;
  }
  
  lucide.createIcons();
}

// Send message function (basic)
function sendMessage() {
  const input = document.getElementById('chat-input');
  if (!input || !input.value.trim()) return;
  
  const messages = document.getElementById('chat-messages');
  if (messages) {
    messages.innerHTML += `
      <div class="flex justify-end">
        <div class="bg-blue-600 text-white px-4 py-2 rounded-2xl max-w-[80%]">
          ${input.value}
        </div>
      </div>
    `;
    messages.scrollTop = messages.scrollHeight;
    input.value = '';
  }
}

// Initialize chat when page loads
document.addEventListener('DOMContentLoaded', () => {
  renderChat();
});