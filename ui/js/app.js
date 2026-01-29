/**
 * Poppit AI - Intelligent Chatbot
 * Features: Smart matching, context memory, typing animation, suggestions
 */

// ==================== CONFIGURATION ====================
const CONFIG = {
    apiUrl: 'http://localhost:8000/chat',
    useLocalData: false, // Set to true to use data.json, false to use AI model
    dataUrl: 'data.json',
    minConfidenceThreshold: 0.3,
    typingSpeed: 20, // milliseconds per character
    maxSuggestions: 3,
    encryptionKey: 'PoppitAI-SecureChat-2026' // XOR encryption key for localStorage
};

// ==================== ENCRYPTION UTILITIES ====================
const Encryption = {
    // XOR-based encryption/decryption
    xorCipher(text, key) {
        if (!text) return '';
        let result = '';
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return result;
    },
    
    // Encrypt data and encode to Base64
    encrypt(data, key = CONFIG.encryptionKey) {
        try {
            const jsonStr = JSON.stringify(data);
            const encrypted = this.xorCipher(jsonStr, key);
            return btoa(unescape(encodeURIComponent(encrypted))); // Base64 encode
        } catch (e) {
            console.error('Encryption error:', e);
            return null;
        }
    },
    
    // Decrypt Base64 data
    decrypt(encryptedData, key = CONFIG.encryptionKey) {
        try {
            const decoded = decodeURIComponent(escape(atob(encryptedData))); // Base64 decode
            const decrypted = this.xorCipher(decoded, key);
            return JSON.parse(decrypted);
        } catch (e) {
            console.error('Decryption error:', e);
            return null;
        }
    },
    
    // Save encrypted data to localStorage
    saveSecure(key, data) {
        const encrypted = this.encrypt(data);
        if (encrypted) {
            localStorage.setItem(key, encrypted);
            return true;
        }
        return false;
    },
    
    // Load and decrypt data from localStorage
    loadSecure(key) {
        const encrypted = localStorage.getItem(key);
        if (!encrypted) return null;
        return this.decrypt(encrypted);
    },
    
    // Clear encrypted data
    clearSecure(key) {
        localStorage.removeItem(key);
    }
};

// ==================== STATE MANAGEMENT ====================
const state = {
    data: [],
    lastQuestion: null,
    lastAnswer: null,
    conversationHistory: [],
    isTyping: false,
    retryMessageElement: null,
    isFirstResponse: true,
    sessionStartTime: new Date(),
    userName: 'User', // Can be customized
    currentChatId: null, // Current active chat session ID
    allChats: [], // Array of all chat sessions
    // Mobile & Touch
    isMobile: window.innerWidth <= 768,
    touchStartX: 0,
    touchStartY: 0,
    touchEndX: 0,
    touchEndY: 0,
    longPressTimer: null,
    // Input History Navigation
    inputHistory: [], // Array of user-sent messages
    historyIndex: -1, // Current position in history (-1 = not navigating)
    tempInput: '' // Temporary storage for current unsent message
};

// ==================== SYNONYM DICTIONARY ====================
const synonyms = {
    'hello': ['hi', 'hey', 'greetings', 'namaste', 'hola'],
    'help': ['assist', 'support', 'aid', 'guide'],
    'thanks': ['thank you', 'thankyou', 'appreciate', 'dhanyavad'],
    'what': ['kya', 'which'],
    'who': ['kaun', 'whom'],
    'how': ['kaise', 'kaise'],
    'why': ['kyu', 'kyun'],
    'when': ['kab'],
    'where': ['kahan', 'kaha'],
    'good': ['nice', 'great', 'excellent', 'awesome'],
    'bad': ['poor', 'terrible', 'awful'],
    'model': ['modal', 'ai', 'bot', 'assistant'],
    'creator': ['maker', 'developer', 'author', 'banaya'],
    'name': ['naam', 'called']
};

// ==================== DOM ELEMENTS ====================
const elements = {
    chatMessages: document.getElementById('chatMessages'),
    userInput: document.getElementById('userInput'),
    sendBtn: document.getElementById('sendBtn'),
    voiceBtn: document.getElementById('voiceBtn'),
    loading: document.getElementById('loading'),
    themeToggle: document.getElementById('themeToggle'),
    reloadChatBtn: document.getElementById('reloadChatBtn'),
    exportTxtBtn: document.getElementById('exportTxtBtn'),
    exportPdfBtn: document.getElementById('exportPdfBtn'),
    sidebar: document.getElementById('sidebar'),
    sidebarToggle: document.getElementById('sidebarToggle'),
    chatList: document.getElementById('chatList'),
    newChatBtn: document.getElementById('newChatBtn'),
    clearAllChatsBtn: document.getElementById('clearAllChatsBtn'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    sidebarOverlay: document.getElementById('sidebarOverlay'),
    browserWarning: document.getElementById('browserWarning')
};

// ==================== INITIALIZATION ====================
async function init() {
    try {
        checkBrowserCompatibility();
        setupMobileSupport();
        loadSavedTheme(); // Load theme preference
        initVoiceRecognition(); // Initialize voice input
        await loadData();
        loadAllChats(); // Load all chat sessions
        loadOrCreateChat(); // Load current or create new chat
        setupEventListeners();
        
        const modeText = CONFIG.useLocalData ? "local data" : "AI model (Gemma 2B)";
        showMessage(`Hello! I'm Poppit AI, powered by ${modeText}. I'm here to help you with any questions. Ask me anything! 😊`, false);
    } catch (error) {
        console.error('Initialization error:', error);
        
        if (CONFIG.useLocalData) {
            showMessage("Sorry, I couldn't load my knowledge base. Please check if data.json exists.", false);
        } else {
            showMessage("Hello! I'm Poppit AI. Ready to chat! (Make sure the AI server is running)", false);
        }
    }
}

// ==================== DATA LOADING ====================
async function loadData() {
    if (!CONFIG.useLocalData) {
        console.log('Using AI model API - no local data needed');
        state.data = [];
        return;
    }
    
    try {
        const response = await fetch(CONFIG.dataUrl);
        if (!response.ok) throw new Error('Failed to load data');
        state.data = await response.json();
        console.log(`Loaded ${state.data.length} knowledge entries`);
    } catch (error) {
        console.error('Error loading data:', error);
        throw error;
    }
}

// ==================== ENCRYPTED CHAT HISTORY ====================
function generateChatId() {
    return 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function getChatTitle(messages) {
    if (messages.length === 0) return 'New Chat';
    const firstUserMsg = messages.find(m => m.role === 'user');
    if (!firstUserMsg) return 'New Chat';
    const title = firstUserMsg.content.substring(0, 50);
    return title.length < firstUserMsg.content.length ? title + '...' : title;
}

function loadAllChats() {
    const chats = Encryption.loadSecure('allChats');
    if (chats && Array.isArray(chats)) {
        state.allChats = chats;
        console.log(`🔒 Loaded ${chats.length} encrypted chat sessions`);
    } else {
        state.allChats = [];
        console.log('🔒 No chat sessions found');
    }
    renderChatList();
}

function saveAllChats() {
    const success = Encryption.saveSecure('allChats', state.allChats);
    if (success) {
        console.log(`🔒 Saved ${state.allChats.length} chat sessions (encrypted)`);
        renderChatList();
    } else {
        console.error('❌ Failed to save chat sessions');
    }
}

function loadOrCreateChat() {
    // Always create a fresh new chat on startup
    createNewChat();
}

function createNewChat() {
    // Save current chat if it has messages
    if (state.currentChatId && state.conversationHistory.length > 0) {
        saveCurrentChat();
    } else if (state.currentChatId) {
        // Remove empty chat from history if switching away
        state.allChats = state.allChats.filter(c => c.id !== state.currentChatId || c.messages.length > 0);
        saveAllChats();
    }
    
    // Create new chat (don't add to allChats yet - will be added on first message)
    const newChatId = generateChatId();
    state.currentChatId = newChatId;
    state.conversationHistory = [];
    state.sessionStartTime = new Date();
    state.isFirstResponse = true;
    
    // Clear UI
    elements.chatMessages.innerHTML = '';
    
    console.log('✨ New chat created:', newChatId);
}

function reloadCurrentChat() {
    if (!state.currentChatId) {
        console.warn('No active chat to reload');
        return;
    }
    
    // First, save current state to localStorage
    saveCurrentChat();
    
    // Then load fresh data directly from localStorage
    const chatsFromStorage = Encryption.loadSecure('allChats');
    
    if (!chatsFromStorage || !Array.isArray(chatsFromStorage)) {
        console.warn('No chats found in localStorage');
        return;
    }
    
    // Find the current chat from fresh localStorage data
    const currentChat = chatsFromStorage.find(chat => chat.id === state.currentChatId);
    
    if (!currentChat) {
        console.warn('Current chat not found in localStorage');
        return;
    }
    
    // Update state with fresh data from localStorage
    state.allChats = chatsFromStorage;
    state.conversationHistory = currentChat.messages || [];
    
    // Clear the UI
    elements.chatMessages.innerHTML = '';
    
    // Re-render all messages in order (sorted by timestamp if available)
    const sortedMessages = [...state.conversationHistory].sort((a, b) => {
        if (a.timestamp && b.timestamp) {
            return new Date(a.timestamp) - new Date(b.timestamp);
        }
        return 0;
    });
    
    sortedMessages.forEach(msg => {
        if (msg.role === 'user') {
            showMessage(msg.content, true);
        } else if (msg.role === 'assistant') {
            showMessage(msg.content, false);
        }
    });
    
    // Update chat list to reflect any changes
    renderChatList();
    
    // Show confirmation
    console.log('🔄 Chat reloaded from localStorage in correct order');
    
    // Scroll to bottom
    setTimeout(() => {
        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    }, 100);
}

function loadChat(chatId) {
    // Save current chat first if it has messages
    if (state.currentChatId && state.conversationHistory.length > 0) {
        saveCurrentChat();
    } else if (state.currentChatId) {
        // Remove empty chat from history if switching away
        state.allChats = state.allChats.filter(c => c.id !== state.currentChatId || c.messages.length > 0);
        saveAllChats();
    }
    
    const chat = state.allChats.find(c => c.id === chatId);
    if (!chat) {
        console.error('Chat not found:', chatId);
        return;
    }
    
    state.currentChatId = chatId;
    state.conversationHistory = chat.messages || [];
    state.sessionStartTime = new Date(chat.createdAt);
    
    // Clear and reload UI
    elements.chatMessages.innerHTML = '';
    state.conversationHistory.forEach(msg => {
        if (msg.role === 'user') {
            showMessage(msg.content, true);
        } else if (msg.role === 'assistant') {
            showMessage(msg.content, false);
        }
    });
    
    renderChatList();
    console.log('📂 Loaded chat:', chatId);
}

function saveCurrentChat() {
    if (!state.currentChatId) return;
    
    // Don't save empty chats
    if (state.conversationHistory.length === 0) {
        console.log('🚫 Skipping save for empty chat');
        return;
    }
    
    const chatIndex = state.allChats.findIndex(c => c.id === state.currentChatId);
    
    if (chatIndex === -1) {
        // Chat doesn't exist yet - create it (first message)
        const newChat = {
            id: state.currentChatId,
            title: getChatTitle(state.conversationHistory),
            messages: state.conversationHistory,
            createdAt: state.sessionStartTime ? state.sessionStartTime.toISOString() : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        state.allChats.unshift(newChat);
        console.log('🆕 First message - chat added to history');
    } else {
        // Update existing chat
        state.allChats[chatIndex].messages = state.conversationHistory;
        state.allChats[chatIndex].title = getChatTitle(state.conversationHistory);
        state.allChats[chatIndex].updatedAt = new Date().toISOString();
    }
    
    saveAllChats();
}

function deleteChat(chatId, event) {
    if (event) {
        event.stopPropagation();
    }
    
    const chat = state.allChats.find(c => c.id === chatId);
    if (!chat) return;
    
    if (!confirm(`Delete "${chat.title}"?`)) return;
    
    state.allChats = state.allChats.filter(c => c.id !== chatId);
    
    // If deleting current chat, load another or create new
    if (state.currentChatId === chatId) {
        if (state.allChats.length > 0) {
            loadChat(state.allChats[0].id);
        } else {
            createNewChat();
        }
    }
    
    saveAllChats();
    console.log('🗑️ Deleted chat:', chatId);
}

function clearAllChats() {
    const pinnedChats = state.allChats.filter(chat => chat.pinned);
    const pinnedCount = pinnedChats.length;
    const totalChats = state.allChats.length;
    const toDeleteCount = totalChats - pinnedCount;
    
    if (toDeleteCount === 0) {
        alert('All chats are pinned! Unpin some chats first to delete them.');
        return;
    }
    
    const message = pinnedCount > 0 
        ? `⚠️ Delete ${toDeleteCount} unpinned chat(s)? ${pinnedCount} pinned chat(s) will be kept.`
        : '⚠️ Delete ALL chat history? This cannot be undone!';
    
    if (!confirm(message)) return;
    
    // Keep only pinned chats
    state.allChats = pinnedChats;
    
    // If current chat was deleted, load first pinned or create new
    const currentChatStillExists = state.allChats.find(c => c.id === state.currentChatId);
    if (!currentChatStillExists) {
        state.currentChatId = null;
        state.conversationHistory = [];
        elements.chatMessages.innerHTML = '';
        
        if (state.allChats.length > 0) {
            loadChat(state.allChats[0].id);
        } else {
            createNewChat();
        }
    }
    
    saveAllChats();
    console.log(`🗑️ ${toDeleteCount} chat(s) cleared, ${pinnedCount} pinned chat(s) kept`);
}

function togglePinChat(chatId, event) {
    if (event) {
        event.stopPropagation();
    }
    
    const chat = state.allChats.find(c => c.id === chatId);
    if (!chat) return;
    
    chat.pinned = !chat.pinned;
    saveAllChats();
    renderChatList();
    
    console.log(`📌 Chat ${chat.pinned ? 'pinned' : 'unpinned'}: ${chat.title}`);
}

function renderChatList() {
    elements.chatList.innerHTML = '';
    
    if (state.allChats.length === 0) {
        elements.chatList.innerHTML = '<div style="color: rgba(255,255,255,0.5); text-align: center; padding: 20px; font-size: 14px;">No chats yet</div>';
        return;
    }
    
    state.allChats.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-item' + (chat.id === state.currentChatId ? ' active' : '') + (chat.pinned ? ' pinned' : '');
        chatItem.onclick = () => loadChat(chat.id);
        
        const pinBtn = document.createElement('button');
        pinBtn.className = 'chat-item-pin';
        pinBtn.innerHTML = chat.pinned ? '📌' : '📍';
        pinBtn.title = chat.pinned ? 'Unpin chat' : 'Pin chat';
        pinBtn.onclick = (e) => togglePinChat(chat.id, e);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'chat-item-delete';
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.onclick = (e) => deleteChat(chat.id, e);
        
        const title = document.createElement('div');
        title.className = 'chat-item-title';
        title.textContent = chat.title;
        
        const date = document.createElement('div');
        date.className = 'chat-item-date';
        const chatDate = new Date(chat.updatedAt || chat.createdAt);
        date.textContent = chatDate.toLocaleDateString() + ' ' + chatDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        chatItem.appendChild(pinBtn);
        chatItem.appendChild(deleteBtn);
        chatItem.appendChild(title);
        chatItem.appendChild(date);
        
        elements.chatList.appendChild(chatItem);
    });
}

function toggleSidebar() {
    elements.sidebar.classList.toggle('collapsed');
    const isCollapsed = elements.sidebar.classList.contains('collapsed');
    elements.sidebarToggle.innerHTML = isCollapsed ? '▶' : '◀';
}

function loadChatHistory() {
    // Deprecated - now using session-based system
    console.log('Legacy loadChatHistory called - using new session system');
}

function saveChatHistory() {
    // Save current chat session
    saveCurrentChat();
}

function clearChatHistory() {
    // Clear only current chat
    if (confirm('Clear current chat?')) {
        state.conversationHistory = [];
        elements.chatMessages.innerHTML = '';
        saveCurrentChat();
        showMessage("Chat cleared. 🧹", false);
    }
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    elements.sendBtn.addEventListener('click', handleSend);
    
    // Handle Enter (send) vs Shift+Enter (new line) and Arrow key history navigation
    elements.userInput.addEventListener('keydown', (e) => {
        // Enter key handling
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevent default new line
            handleSend();
            return;
        }
        
        // Arrow key history navigation
        if (e.key === 'ArrowUp') {
            handleHistoryNavigation(e, 'up');
        } else if (e.key === 'ArrowDown') {
            handleHistoryNavigation(e, 'down');
        }
    });
    
    // Reset history navigation when user starts typing
    elements.userInput.addEventListener('input', (e) => {
        // Reset history index when user modifies text
        // (allows editing loaded history message without navigation jumping)
        if (state.historyIndex !== -1) {
            state.tempInput = elements.userInput.value;
        }
        
        // Auto-resize textarea
        autoResizeTextarea();
    });
    
    elements.themeToggle.addEventListener('click', toggleTheme);
    elements.reloadChatBtn.addEventListener('click', reloadCurrentChat);
    elements.exportTxtBtn.addEventListener('click', exportAsText);
    elements.exportPdfBtn.addEventListener('click', exportAsPDF);
    elements.sidebarToggle.addEventListener('click', toggleSidebar);
    elements.newChatBtn.addEventListener('click', createNewChat);
    elements.clearAllChatsBtn.addEventListener('click', clearAllChats);
    elements.voiceBtn.addEventListener('click', toggleVoiceInput);
    
    // Mobile-specific listeners
    if (elements.mobileMenuBtn) {
        elements.mobileMenuBtn.addEventListener('click', toggleMobileSidebar);
    }
    if (elements.sidebarOverlay) {
        elements.sidebarOverlay.addEventListener('click', closeMobileSidebar);
    }
    
    // Window resize handler
    window.addEventListener('resize', handleResize);
    
    // Touch gesture support
    setupTouchGestures();
}

// ==================== MESSAGE HANDLING ====================
async function handleSend() {
    const userMessage = elements.userInput.value.trim();
    
    if (!userMessage || state.isTyping) return;
    
    // Add to input history (avoid duplicates of last message)
    if (state.inputHistory.length === 0 || state.inputHistory[state.inputHistory.length - 1] !== userMessage) {
        state.inputHistory.push(userMessage);
    }
    
    // Reset history navigation
    state.historyIndex = -1;
    state.tempInput = '';
    
    // Show user message
    showMessage(userMessage, true);
    
    // Clear input and reset height
    elements.userInput.value = '';
    resetTextareaHeight();
    
    // Store in history and save encrypted with timestamp
    state.conversationHistory.push({ 
        role: 'user', 
        content: userMessage,
        timestamp: new Date().toISOString()
    });
    saveChatHistory();
    
    // Show loading
    setLoading(true);
    
    // Add 3-second delay only for first response
    if (state.isFirstResponse) {
        await sleep(3000);
        state.isFirstResponse = false;
    }
    
    // Process and respond
    await processMessage(userMessage);
    
    // Hide loading
    setLoading(false);
}

// ==================== INPUT HISTORY NAVIGATION ====================
/**
 * Handle arrow key navigation through input history
 * UP arrow: Navigate backward through history (older messages)
 * DOWN arrow: Navigate forward through history (newer messages)
 * 
 * @param {KeyboardEvent} e - The keyboard event
 * @param {string} direction - 'up' or 'down'
 */
function handleHistoryNavigation(e, direction) {
    const textarea = elements.userInput;
    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = textarea.value.substring(0, cursorPosition);
    const textAfterCursor = textarea.value.substring(cursorPosition);
    const lines = textarea.value.split('\n');
    
    // For multiline textarea, check if cursor is on first/last line
    if (direction === 'up') {
        // Only navigate history if cursor is on first line
        const isOnFirstLine = !textBeforeCursor.includes('\n');
        if (!isOnFirstLine && textarea.value.trim() !== '') {
            return; // Allow normal cursor movement
        }
    } else if (direction === 'down') {
        // Only navigate history if cursor is on last line
        const isOnLastLine = !textAfterCursor.includes('\n');
        if (!isOnLastLine && textarea.value.trim() !== '') {
            return; // Allow normal cursor movement
        }
    }
    
    // Prevent default arrow behavior when navigating history
    e.preventDefault();
    
    // No history to navigate
    if (state.inputHistory.length === 0) return;
    
    if (direction === 'up') {
        // Navigate backward (older messages)
        if (state.historyIndex === -1) {
            // Starting navigation - save current input
            state.tempInput = textarea.value;
            state.historyIndex = state.inputHistory.length - 1;
        } else if (state.historyIndex > 0) {
            state.historyIndex--;
        }
        
        // Load message from history
        textarea.value = state.inputHistory[state.historyIndex];
        
    } else if (direction === 'down') {
        // Navigate forward (newer messages)
        if (state.historyIndex === -1) {
            return; // Already at newest
        }
        
        if (state.historyIndex < state.inputHistory.length - 1) {
            state.historyIndex++;
            textarea.value = state.inputHistory[state.historyIndex];
        } else {
            // Reached newest - restore temp input or clear
            state.historyIndex = -1;
            textarea.value = state.tempInput;
            state.tempInput = '';
        }
    }
    
    // Move cursor to end
    textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
    
    // Trigger resize to adjust textarea height
    autoResizeTextarea();
}

// ==================== TEXTAREA AUTO-RESIZE ====================
/**
 * Auto-resize textarea based on content
 * - Grows from 1 line to max 6 lines (~180px)
 * - After max, enables scrolling
 * - Smooth CSS transition for height changes
 */
function autoResizeTextarea() {
    const textarea = elements.userInput;
    
    // Reset height to auto to get accurate scrollHeight
    textarea.style.height = 'auto';
    
    // Calculate new height based on content
    const newHeight = textarea.scrollHeight;
    const maxHeight = parseInt(getComputedStyle(textarea).maxHeight);
    
    // Apply new height (capped at maxHeight)
    if (newHeight <= maxHeight) {
        textarea.style.height = newHeight + 'px';
        textarea.style.overflowY = 'hidden';
    } else {
        textarea.style.height = maxHeight + 'px';
        textarea.style.overflowY = 'auto';
    }
}

/**
 * Reset textarea to minimum height (1 line)
 * Called after sending a message
 */
function resetTextareaHeight() {
    const textarea = elements.userInput;
    textarea.style.height = 'auto';
    textarea.style.overflowY = 'hidden';
}

// ==================== MESSAGE PROCESSING ====================
async function processMessage(userMessage) {
    // Check if using AI model or local data
    if (!CONFIG.useLocalData) {
        // Use AI model via API
        await callAIModel(userMessage);
        return;
    }
    
    // Use local data.json (smart matching)
    const normalizedInput = normalizeText(userMessage);
    
    // Check for context-dependent follow-ups
    if (isFollowUpQuestion(normalizedInput) && state.lastAnswer) {
        await typeMessage(state.lastAnswer, false);
        return;
    }
    
    // Find best match
    const result = findBestMatch(normalizedInput);
    
    if (result.score > CONFIG.minConfidenceThreshold) {
        // Good match found
        const confidence = getConfidenceLevel(result.score);
        let response = result.answer;
        
        // Add confidence indicator for low-medium matches
        if (confidence === 'low' || confidence === 'medium') {
            response = `💭 I'm not 100% sure, but here's what I found:\n\n${response}`;
        }
        
        // Store context
        state.lastQuestion = result.question;
        state.lastAnswer = response;
        
        // Type out response
        await typeMessage(response, false, confidence);
        
    } else {
        // No good match found - show suggestions
        const suggestions = getSuggestions(normalizedInput);
        
        let response = "🤔 I'm not sure I understand. Could you rephrase that?";
        
        if (suggestions.length > 0) {
            response += "\n\nDid you mean:";
            await typeMessage(response, false);
            showSuggestions(suggestions);
        } else {
            response += " Try asking about my features, creator, or how I work!";
            await typeMessage(response, false);
        }
    }
}

// ==================== AI MODEL API CALL ====================
async function callAIModel(userMessage) {
    try {
        const response = await fetch(CONFIG.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: userMessage
            })
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        const aiResponse = data.response;
        
        // Store context
        state.lastQuestion = userMessage;
        state.lastAnswer = aiResponse;
        
        // Type out response
        await typeMessage(aiResponse, false, 'high');
        
    } catch (error) {
        console.error('AI Model error:', error);
        
        let errorMessage = "🔴 Sorry, I couldn't connect to the AI model. ";
        
        if (error.message.includes('Failed to fetch')) {
            errorMessage += "Make sure the server is running:\n\n";
            errorMessage += "**Run this command:**\n";
            errorMessage += "`python start_ai.bat` or `uvicorn server:app --reload`";
        } else {
            errorMessage += "Please try again or contact support.";
        }
        
        await typeMessage(errorMessage, false, 'low');
    }
}

// ==================== TEXT NORMALIZATION ====================
function normalizeText(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .replace(/\s+/g, ' ')     // Normalize spaces
        .trim();
}

// ==================== SMART MATCHING ALGORITHM ====================
function findBestMatch(userInput) {
    let bestMatch = {
        question: null,
        answer: null,
        score: 0
    };
    
    const userWords = userInput.split(' ');
    const expandedUserWords = expandWithSynonyms(userWords);
    
    for (const item of state.data) {
        const questionText = normalizeText(item.instruction);
        const questionWords = questionText.split(' ');
        const expandedQuestionWords = expandWithSynonyms(questionWords);
        
        // Calculate match score
        let score = 0;
        
        // Exact phrase match (highest weight)
        if (questionText.includes(userInput) || userInput.includes(questionText)) {
            score += 10;
        }
        
        // Word overlap scoring
        for (const userWord of expandedUserWords) {
            if (expandedQuestionWords.includes(userWord)) {
                score += 1;
            }
        }
        
        // Normalize score by question length
        const normalizedScore = score / Math.max(questionWords.length, userWords.length);
        
        if (normalizedScore > bestMatch.score) {
            bestMatch = {
                question: item.instruction,
                answer: item.response,
                score: normalizedScore
            };
        }
    }
    
    return bestMatch;
}

// ==================== SYNONYM EXPANSION ====================
function expandWithSynonyms(words) {
    const expanded = [...words];
    
    for (const word of words) {
        // Check if word has synonyms
        if (synonyms[word]) {
            expanded.push(...synonyms[word]);
        }
        
        // Check if word is a synonym of something
        for (const [key, syns] of Object.entries(synonyms)) {
            if (syns.includes(word)) {
                expanded.push(key);
                expanded.push(...syns);
            }
        }
    }
    
    return [...new Set(expanded)]; // Remove duplicates
}

// ==================== FOLLOW-UP DETECTION ====================
function isFollowUpQuestion(normalizedInput) {
    const followUpPatterns = [
        'example', 'more', 'explain', 'detail', 'elaborate',
        'tell me more', 'what else', 'continue', 'go on'
    ];
    
    return followUpPatterns.some(pattern => normalizedInput.includes(pattern));
}

// ==================== CONFIDENCE LEVEL ====================
function getConfidenceLevel(score) {
    if (score > 0.7) return 'high';
    if (score > 0.5) return 'medium';
    return 'low';
}

// ==================== SUGGESTIONS ====================
function getSuggestions(userInput) {
    const suggestions = [];
    const userWords = userInput.split(' ');
    
    for (const item of state.data) {
        const questionText = normalizeText(item.instruction);
        const questionWords = questionText.split(' ');
        
        // Check for partial word matches
        let matchCount = 0;
        for (const userWord of userWords) {
            if (questionWords.some(qw => qw.includes(userWord) || userWord.includes(qw))) {
                matchCount++;
            }
        }
        
        if (matchCount > 0) {
            suggestions.push({
                question: item.instruction,
                score: matchCount
            });
        }
    }
    
    // Sort by score and return top N
    return suggestions
        .sort((a, b) => b.score - a.score)
        .slice(0, CONFIG.maxSuggestions)
        .map(s => s.question);
}

// ==================== DISPLAY FUNCTIONS ====================
function showMessage(text, isUser = false) {
    // Remove action buttons from previous last message
    const previousActions = elements.chatMessages.querySelectorAll('.message-actions');
    previousActions.forEach(actions => actions.remove());
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // Store raw text for later copying
    messageDiv.dataset.rawText = text;
    
    if (isUser) {
        // Always use textContent for user messages (never execute)
        contentDiv.textContent = text;
    } else {
        // Use innerHTML only for formatted content (already escaped in formatMessage)
        contentDiv.innerHTML = formatMessage(text);
    }
    
    messageDiv.appendChild(contentDiv);
    elements.chatMessages.appendChild(messageDiv);
    
    scrollToBottom();
}

async function typeMessage(text, isUser = false, confidence = 'high') {
    state.isTyping = true;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = `message-content ${confidence === 'low' ? 'confidence-low' : ''}`;
    
    // Store raw text for later copying
    messageDiv.dataset.rawText = text;
    
    messageDiv.appendChild(contentDiv);
    elements.chatMessages.appendChild(messageDiv);
    
    // Type line by line to preserve line breaks
    const lines = text.split('\n');
    let typedText = '';
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        
        // Type each character in the line
        for (let charIndex = 0; charIndex < line.length; charIndex++) {
            typedText += line[charIndex];
            contentDiv.textContent = typedText;
            scrollToBottom();
            await sleep(CONFIG.typingSpeed);
        }
        
        // Add line break after each line (except last)
        if (lineIndex < lines.length - 1) {
            typedText += '\n';
            contentDiv.textContent = typedText;
            scrollToBottom();
            await sleep(CONFIG.typingSpeed * 2); // Slight pause at line break
        }
    }
    
    // Replace with formatted version
    contentDiv.innerHTML = formatMessage(text);
    
    // Add confidence indicator
    if (confidence !== 'high') {
        const indicator = document.createElement('div');
        indicator.className = 'confidence-indicator';
        indicator.textContent = `Confidence: ${confidence}`;
        contentDiv.appendChild(indicator);
    }
    
    // Add action buttons to AI messages
    if (!isUser) {
        // Remove action buttons from previous messages
        const previousActions = elements.chatMessages.querySelectorAll('.message-actions');
        previousActions.forEach(actions => actions.remove());
        
        // Add action buttons to this message
        addActionButtons(messageDiv, text);
        
        // Save AI response to encrypted history with timestamp
        state.conversationHistory.push({ 
            role: 'assistant', 
            content: text,
            timestamp: new Date().toISOString()
        });
        saveChatHistory();
    }
    
    state.isTyping = false;
    scrollToBottom();
}

// ==================== ACTION BUTTONS ====================
function addActionButtons(messageDiv, responseText) {
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'message-actions';
    
    // Copy button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'action-btn';
    copyBtn.innerHTML = '📋';
    copyBtn.title = 'Copy response';
    copyBtn.onclick = () => copyResponse(messageDiv, copyBtn);
    
    // Like button
    const likeBtn = document.createElement('button');
    likeBtn.className = 'action-btn';
    likeBtn.innerHTML = '👍';
    likeBtn.title = 'Like';
    // Store the question and answer for this specific response
    const questionForThisResponse = state.lastQuestion;
    const answerForThisResponse = responseText;
    likeBtn.onclick = () => toggleLike(likeBtn, questionForThisResponse, answerForThisResponse);
    
    // Dislike button
    const dislikeBtn = document.createElement('button');
    dislikeBtn.className = 'action-btn';
    dislikeBtn.innerHTML = '👎';
    dislikeBtn.title = 'Dislike';
    dislikeBtn.onclick = () => toggleDislike(dislikeBtn, likeBtn);
    
    // Share button
    const shareBtn = document.createElement('button');
    shareBtn.className = 'action-btn';
    shareBtn.innerHTML = '🔗';
    shareBtn.title = 'Share';
    shareBtn.onclick = () => shareResponse(responseText);
    
    // Retry button
    const retryBtn = document.createElement('button');
    retryBtn.className = 'action-btn';
    retryBtn.innerHTML = '🔄';
    retryBtn.title = 'Retry';
    retryBtn.onclick = () => retryLastMessage();
    
    actionsDiv.appendChild(copyBtn);
    actionsDiv.appendChild(likeBtn);
    actionsDiv.appendChild(dislikeBtn);
    actionsDiv.appendChild(shareBtn);
    actionsDiv.appendChild(retryBtn);
    
    // Add to the content div, not the message div
    const contentDiv = messageDiv.querySelector('.message-content');
    if (contentDiv) {
        contentDiv.appendChild(actionsDiv);
    }
}

function copyResponse(messageDiv, button) {
    // Get raw text stored in dataset (preserves line breaks)
    const rawText = messageDiv.dataset.rawText;
    
    if (!rawText) {
        console.error('No raw text found');
        button.innerHTML = '❌';
        setTimeout(() => {
            button.innerHTML = '📋';
        }, 2000);
        return;
    }
    
    navigator.clipboard.writeText(rawText).then(() => {
        button.innerHTML = '✅';
        setTimeout(() => {
            button.innerHTML = '📋';
        }, 2000);
    }).catch(err => {
        console.error('Copy failed:', err);
        button.innerHTML = '❌';
        setTimeout(() => {
            button.innerHTML = '📋';
        }, 2000);
    });
}

function toggleLike(likeBtn, question, answer) {
    // Ensure button is clickable
    likeBtn.style.cursor = 'pointer';
    
    if (likeBtn.classList.contains('active')) {
        likeBtn.classList.remove('active');
        console.log('Like removed');
    } else {
        likeBtn.classList.add('active');
        // Remove dislike if active
        const dislikeBtn = likeBtn.parentElement.querySelector('.action-btn:nth-child(3)');
        if (dislikeBtn) {
            dislikeBtn.classList.remove('dislike-active');
        }
        
        // Save to like.json via API with the specific question and answer
        saveLikeToServer(question, answer);
        console.log('Like activated - saving to server...');
    }
}

async function saveLikeToServer(question, answer) {
    if (question && answer) {
        try {
            // Remove HTML formatting from response
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = formatMessage(answer);
            const plainResponse = tempDiv.textContent || tempDiv.innerText;
            
            const response = await fetch('http://localhost:8000/like', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    instruction: question,
                    response: plainResponse
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Like saved to like.json:', result);
            } else {
                console.error('❌ Failed to save like');
            }
        } catch (error) {
            console.error('Error saving like:', error);
        }
    } else {
        console.warn('⚠️ Cannot save like: missing question or answer');
    }
}

function toggleDislike(dislikeBtn, likeBtn) {
    if (dislikeBtn.classList.contains('dislike-active')) {
        dislikeBtn.classList.remove('dislike-active');
    } else {
        dislikeBtn.classList.add('dislike-active');
        // Remove like if active
        if (likeBtn) {
            likeBtn.classList.remove('active');
        }
    }
}

function shareResponse(text) {
    // Remove HTML tags for plain text
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = formatMessage(text);
    const plainText = tempDiv.textContent || tempDiv.innerText;
    
    if (navigator.share) {
        navigator.share({
            title: 'Poppit AI Response',
            text: plainText
        }).catch(err => console.log('Share cancelled'));
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(plainText).then(() => {
            alert('Response copied to clipboard! You can now share it.');
        });
    }
}

function retryLastMessage() {
    if (state.conversationHistory.length > 0) {
        // Get the last user message
        const lastUserMessage = [...state.conversationHistory]
            .reverse()
            .find(msg => msg.role === 'user');
        
        if (lastUserMessage) {
            // Find the current AI message element
            const allBotMessages = elements.chatMessages.querySelectorAll('.message.bot');
            const currentMessage = allBotMessages[allBotMessages.length - 1];
            
            if (currentMessage) {
                // Clear the message content and show loading
                const contentDiv = currentMessage.querySelector('.message-content');
                if (contentDiv) {
                    contentDiv.innerHTML = '<em>🔄 Regenerating response...</em>';
                    // Remove action buttons
                    const actions = contentDiv.querySelector('.message-actions');
                    if (actions) actions.remove();
                }
                
                // Store reference to the message to replace
                state.retryMessageElement = currentMessage;
                
                // Show loading
                setLoading(true);
                
                // Process the message again
                processMessage(lastUserMessage.content).then(() => {
                    // Remove the "Regenerating" message
                    if (state.retryMessageElement) {
                        state.retryMessageElement.remove();
                        state.retryMessageElement = null;
                    }
                    setLoading(false);
                });
            }
        }
    }
}

function showSuggestions(suggestions) {
    if (suggestions.length === 0) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    const suggestionsDiv = document.createElement('div');
    suggestionsDiv.className = 'suggestions';
    
    suggestions.forEach(suggestion => {
        const item = document.createElement('span');
        item.className = 'suggestion-item';
        item.textContent = suggestion;
        item.onclick = () => {
            elements.userInput.value = suggestion;
            handleSend();
        };
        suggestionsDiv.appendChild(item);
    });
    
    contentDiv.appendChild(suggestionsDiv);
    messageDiv.appendChild(contentDiv);
    elements.chatMessages.appendChild(messageDiv);
    
    scrollToBottom();
}

// ==================== FORMATTING ====================
function formatMessage(text) {
    // Detect ''' blocks (starting at beginning of any line)
    const tripleQuoteBlocks = [];
    
    // Find all ''' markers
    const lines = text.split('\n');
    let inTripleQuoteBlock = false;
    let blockContent = [];
    let tripleQuoteIndex = 0;
    let resultLines = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();
        
        if (trimmedLine === "'''") {
            if (!inTripleQuoteBlock) {
                // Start of triple quote block
                inTripleQuoteBlock = true;
                blockContent = [];
            } else {
                // End of triple quote block
                inTripleQuoteBlock = false;
                const placeholder = `__TRIPLE_QUOTE_BLOCK_${tripleQuoteIndex}__`;
                tripleQuoteBlocks.push({ 
                    content: blockContent.join('\n'), 
                    placeholder 
                });
                resultLines.push(placeholder);
                tripleQuoteIndex++;
                blockContent = [];
            }
        } else {
            if (inTripleQuoteBlock) {
                blockContent.push(line);
            } else {
                resultLines.push(line);
            }
        }
    }
    
    // If still in block (no closing '''), treat rest as block
    if (inTripleQuoteBlock && blockContent.length > 0) {
        const placeholder = `__TRIPLE_QUOTE_BLOCK_${tripleQuoteIndex}__`;
        tripleQuoteBlocks.push({ 
            content: blockContent.join('\n'), 
            placeholder 
        });
        resultLines.push(placeholder);
    }
    
    let processedText = resultLines.join('\n');
    
    // Detect and extract code blocks (```language or ``` or <code> tags)
    const codeBlockRegex = /```([\w]*)?\n([\s\S]*?)```|<code>([\s\S]*?)<\/code>/g;
    const codeBlocks = [];
    let match;
    
    // Extract code blocks and replace with placeholders
    let codeBlockIndex = 0;
    while ((match = codeBlockRegex.exec(processedText)) !== null) {
        const language = match[1] || 'code';
        const code = match[2] || match[3];
        const placeholder = `__CODE_BLOCK_${codeBlockIndex}__`;
        codeBlocks.push({ language, code, placeholder });
        processedText = processedText.replace(match[0], placeholder);
        codeBlockIndex++;
    }
    
    // Format regular text (non-code)
    let formatted = processedText;
    
    // Convert ### Headings
    formatted = formatted.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    
    // Convert ## Headings
    formatted = formatted.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    
    // Convert **bold**
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // Convert *italic*
    formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // Escape any remaining HTML to prevent execution
    formatted = formatted.replace(/<(?!(\/?(h2|h3|strong|em|u|ul|li|p|br)\b))/gi, '&lt;');
    
    // Convert bullet points
    const formattedLines = formatted.split('\n');
    let inList = false;
    let result = [];
    
    for (let line of formattedLines) {
        const trimmed = line.trim();
        
        // Check if this line contains a code block placeholder
        if (trimmed.includes('__CODE_BLOCK_')) {
            if (inList) {
                result.push('</ul>');
                inList = false;
            }
            result.push(trimmed);
            continue;
        }
        
        if (trimmed.startsWith('<h2>') || trimmed.startsWith('<h3>')) {
            if (inList) {
                result.push('</ul>');
                inList = false;
            }
            result.push(trimmed);
        } else if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
            if (!inList) {
                result.push('<ul>');
                inList = true;
            }
            const content = trimmed.substring(1).trim();
            result.push(`<li>${content}</li>`);
        } else {
            if (inList) {
                result.push('</ul>');
                inList = false;
            }
            if (trimmed) {
                result.push(`<p>${trimmed}</p>`);
            }
        }
    }
    
    if (inList) {
        result.push('</ul>');
    }
    
    formatted = result.join('');
    
    // Replace placeholders with actual code blocks
    codeBlocks.forEach(block => {
        const codeBlockId = 'code_' + Math.random().toString(36).substr(2, 9);
        const codeBlockHTML = `
            <div class="code-block-wrapper">
                <div class="code-block-header">
                    <span class="code-language">${escapeHtml(block.language)}</span>
                    <button class="code-copy-btn" onclick="copyCodeBlock('${codeBlockId}')" title="Copy code">
                        📋 Copy
                    </button>
                </div>
                <pre class="code-block"><code id="${codeBlockId}">${escapeHtml(block.code)}</code></pre>
            </div>
        `;
        formatted = formatted.replace(block.placeholder, codeBlockHTML);
    });
    
    // Replace placeholders with triple quote blocks
    tripleQuoteBlocks.forEach(block => {
        const tripleQuoteHTML = `
            <div class="triple-quote-block">
                <div class="triple-quote-content">${escapeHtml(block.content)}</div>
            </div>
        `;
        formatted = formatted.replace(block.placeholder, tripleQuoteHTML);
    });
    
    return formatted;
}

// Escape HTML to prevent XSS attacks
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Copy code block to clipboard
window.copyCodeBlock = function(codeBlockId) {
    const codeElement = document.getElementById(codeBlockId);
    if (!codeElement) return;
    
    const code = codeElement.textContent;
    
    navigator.clipboard.writeText(code).then(() => {
        // Find the copy button for this code block
        const codeBlock = codeElement.closest('.code-block-wrapper');
        const copyBtn = codeBlock.querySelector('.code-copy-btn');
        
        // Show feedback
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '✓ Copied!';
        copyBtn.style.background = 'rgba(40, 167, 69, 0.6)';
        
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
            copyBtn.style.background = '';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy code');
    });
};

// ==================== THEME TOGGLE ====================
function toggleTheme() {
    const body = document.body;
    const isLightMode = body.classList.contains('light-theme');
    
    if (isLightMode) {
        // Switch to dark mode
        body.classList.remove('light-theme');
        elements.themeToggle.textContent = '☀️ Light';
        localStorage.setItem('theme', 'dark');
    } else {
        // Switch to light mode
        body.classList.add('light-theme');
        elements.themeToggle.textContent = '🌙 Dark';
        localStorage.setItem('theme', 'light');
    }
}

function loadSavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        elements.themeToggle.textContent = '🌙 Dark';
    } else {
        // Default is dark mode
        document.body.classList.remove('light-theme');
        elements.themeToggle.textContent = '☀️ Light';
    }
}

// ==================== VOICE INPUT ====================
let recognition = null;
let isListening = false;

function initVoiceRecognition() {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        console.warn('Speech recognition not supported in this browser');
        elements.voiceBtn.disabled = true;
        elements.voiceBtn.title = 'Voice input not supported in this browser';
        elements.voiceBtn.style.opacity = '0.5';
        return false;
    }
    
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
        isListening = true;
        elements.voiceBtn.classList.add('listening');
        elements.voiceBtn.textContent = '🔴';
        elements.voiceBtn.title = 'Listening... Click to stop';
        console.log('Voice recognition started');
    };
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('Voice input:', transcript);
        elements.userInput.value = transcript;
        elements.userInput.focus();
    };
    
    recognition.onerror = (event) => {
        console.error('Voice recognition error:', event.error);
        isListening = false;
        elements.voiceBtn.classList.remove('listening');
        elements.voiceBtn.textContent = '🎤';
        elements.voiceBtn.title = 'Voice input';
        
        if (event.error === 'no-speech') {
            showBrowserWarning('No speech detected. Please try again.');
        } else if (event.error === 'not-allowed') {
            showBrowserWarning('Microphone access denied. Please enable microphone permissions.');
        } else {
            showBrowserWarning(`Voice input error: ${event.error}`);
        }
    };
    
    recognition.onend = () => {
        isListening = false;
        elements.voiceBtn.classList.remove('listening');
        elements.voiceBtn.textContent = '🎤';
        elements.voiceBtn.title = 'Voice input';
        console.log('Voice recognition ended');
    };
    
    return true;
}

function toggleVoiceInput() {
    if (!recognition) {
        showBrowserWarning('Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.');
        return;
    }
    
    if (isListening) {
        recognition.stop();
    } else {
        try {
            recognition.start();
        } catch (error) {
            console.error('Failed to start voice recognition:', error);
            showBrowserWarning('Failed to start voice input. Please try again.');
        }
    }
}

function showBrowserWarning(message) {
    const warning = elements.browserWarning;
    const warningText = document.getElementById('warningText');
    
    if (warning && warningText) {
        warningText.textContent = message;
        warning.classList.add('show');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            warning.classList.remove('show');
        }, 5000);
    }
}

// ==================== UTILITY FUNCTIONS ====================
function setLoading(isLoading) {
    if (isLoading) {
        elements.loading.classList.add('active');
        elements.sendBtn.disabled = true;
    } else {
        elements.loading.classList.remove('active');
        elements.sendBtn.disabled = false;
    }
}

function scrollToBottom() {
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== EXPORT FUNCTIONS ====================
function formatTimestamp(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function exportAsText() {
    if (state.conversationHistory.length === 0) {
        alert('⚠️ No chat history to export!');
        return;
    }
    
    const now = new Date();
    const exportDate = now.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    let content = '=';
    content += '\n🤖 POPPIT AI - CHAT HISTORY\n';
    content += '='.repeat(60) + '\n\n';
    content += `👤 User: ${state.userName}\n`;
    content += `📅 Export Date: ${exportDate}\n`;
    content += `🕒 Session Started: ${state.sessionStartTime.toLocaleString('en-US')}\n`;
    content += `💬 Total Messages: ${state.conversationHistory.length}\n`;
    content += '='.repeat(60) + '\n\n';
    
    // Add conversation
    state.conversationHistory.forEach((msg, index) => {
        const timestamp = msg.timestamp ? formatTimestamp(msg.timestamp) : 'N/A';
        const role = msg.role === 'user' ? '👤 USER' : '🤖 AI';
        
        content += `[${timestamp}] ${role}:\n`;
        content += `${msg.content}\n`;
        content += '-'.repeat(60) + '\n\n';
    });
    
    content += '='.repeat(60) + '\n';
    content += 'End of chat history\n';
    content += `Exported by Poppit AI | ${exportDate}\n`;
    
    // Create download
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PoppitAI-Chat-${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}-${now.getHours()}${now.getMinutes()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('✅ Chat exported as TXT');
}

function exportAsPDF() {
    if (state.conversationHistory.length === 0) {
        alert('⚠️ No chat history to export!');
        return;
    }
    
    const now = new Date();
    const exportDate = now.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Create a new window with print-friendly content
    const printWindow = window.open('', '_blank');
    
    let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Poppit AI - Chat History</title>
            <style>
                body {
                    font-family: 'Segoe UI', Arial, sans-serif;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                    line-height: 1.6;
                    color: #333;
                }
                .header {
                    text-align: center;
                    border-bottom: 3px solid #000;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .header h1 {
                    margin: 0;
                    font-size: 28px;
                    color: #1a1a1a;
                }
                .meta-info {
                    background: #f5f5f5;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 30px;
                    border-left: 4px solid #000;
                }
                .meta-info p {
                    margin: 5px 0;
                    font-size: 14px;
                }
                .message {
                    margin-bottom: 25px;
                    page-break-inside: avoid;
                }
                .message-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    font-size: 12px;
                    color: #666;
                }
                .message-role {
                    font-weight: bold;
                    font-size: 14px;
                }
                .message-role.user {
                    color: #0066cc;
                }
                .message-role.ai {
                    color: #cc6600;
                }
                .message-content {
                    padding: 12px 15px;
                    border-radius: 8px;
                    background: #fff;
                    border: 1px solid #ddd;
                }
                .message.user .message-content {
                    background: #e3f2fd;
                    border-color: #2196f3;
                }
                .message.ai .message-content {
                    background: #fff3e0;
                    border-color: #ff9800;
                }
                .footer {
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 2px solid #ccc;
                    text-align: center;
                    font-size: 12px;
                    color: #666;
                }
                @media print {
                    body { padding: 0; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🤖 Poppit AI - Chat History</h1>
            </div>
            
            <div class="meta-info">
                <p><strong>👤 User:</strong> ${state.userName}</p>
                <p><strong>📅 Export Date:</strong> ${exportDate}</p>
                <p><strong>🕒 Session Started:</strong> ${state.sessionStartTime.toLocaleString('en-US')}</p>
                <p><strong>💬 Total Messages:</strong> ${state.conversationHistory.length}</p>
            </div>
            
            <div class="conversation">
    `;
    
    // Add messages
    state.conversationHistory.forEach((msg, index) => {
        const timestamp = msg.timestamp ? formatTimestamp(msg.timestamp) : 'N/A';
        const role = msg.role === 'user' ? 'user' : 'ai';
        const roleName = msg.role === 'user' ? '👤 USER' : '🤖 AI';
        
        // Remove HTML tags for clean PDF
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = formatMessage(msg.content);
        const cleanContent = tempDiv.textContent || tempDiv.innerText;
        
        htmlContent += `
            <div class="message ${role}">
                <div class="message-header">
                    <span class="message-role ${role}">${roleName}</span>
                    <span class="message-time">${timestamp}</span>
                </div>
                <div class="message-content">
                    ${msg.content.replace(/\n/g, '<br>')}
                </div>
            </div>
        `;
    });
    
    htmlContent += `
            </div>
            
            <div class="footer">
                <p>End of chat history</p>
                <p>Exported by Poppit AI | ${exportDate}</p>
            </div>
            
            <div class="no-print" style="margin-top: 30px; text-align: center;">
                <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">🖨️ Print / Save as PDF</button>
                <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; cursor: pointer; margin-left: 10px;">❌ Close</button>
            </div>
        </body>
        </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Auto-trigger print dialog after a short delay
    setTimeout(() => {
        printWindow.print();
    }, 500);
    
    console.log('✅ Chat ready for PDF export');
}

// ==================== BROWSER COMPATIBILITY ====================
function checkBrowserCompatibility() {
    const warnings = [];
    
    // Check for essential features
    if (!window.localStorage) {
        warnings.push('LocalStorage not supported - chat history will not be saved');
    }
    
    if (!window.crypto || !window.crypto.subtle) {
        warnings.push('Some encryption features may not work');
    }
    
    if (!window.fetch) {
        warnings.push('Fetch API not supported - AI features may not work');
    }
    
    if (!('clipboard' in navigator)) {
        warnings.push('Clipboard API not available - copy features limited');
    }
    
    // Check for optional features
    const hasBackdropFilter = CSS.supports('backdrop-filter', 'blur(10px)') || 
                               CSS.supports('-webkit-backdrop-filter', 'blur(10px)');
    if (!hasBackdropFilter) {
        console.log('⚠️ Backdrop filter not supported - using fallback styles');
    }
    
    // Detect browser
    const ua = navigator.userAgent;
    const isChrome = /Chrome/.test(ua) && /Google Inc/.test(navigator.vendor);
    const isEdge = /Edg/.test(ua);
    const isBrave = navigator.brave && typeof navigator.brave.isBrave === 'function';
    const isFirefox = /Firefox/.test(ua);
    const isSafari = /Safari/.test(ua) && !isChrome && !isEdge;
    
    console.log('🌐 Browser detected:', {
        Chrome: isChrome,
        Edge: isEdge,
        Brave: isBrave,
        Firefox: isFirefox,
        Safari: isSafari
    });
    
    // Show warnings if any
    if (warnings.length > 0 && elements.browserWarning) {
        const warningText = document.getElementById('warningText');
        if (warningText) {
            warningText.textContent = warnings.join('. ');
            elements.browserWarning.classList.add('show');
            
            // Auto-hide after 10 seconds
            setTimeout(() => {
                if (elements.browserWarning) {
                    elements.browserWarning.classList.remove('show');
                }
            }, 10000);
        }
    }
}

// ==================== MOBILE & TOUCH SUPPORT ====================
function setupMobileSupport() {
    // Detect mobile on load
    state.isMobile = window.innerWidth <= 768;
    
    // Auto-collapse sidebar on mobile
    if (state.isMobile && elements.sidebar) {
        elements.sidebar.classList.remove('mobile-open');
    }
    
    // Prevent pull-to-refresh on mobile
    document.body.addEventListener('touchmove', (e) => {
        if (e.target === document.body) {
            e.preventDefault();
        }
    }, { passive: false });
    
    console.log('📱 Mobile support:', state.isMobile ? 'enabled' : 'desktop mode');
}

function handleResize() {
    const wasMobile = state.isMobile;
    state.isMobile = window.innerWidth <= 768;
    
    // Close mobile sidebar when switching to desktop
    if (wasMobile && !state.isMobile) {
        closeMobileSidebar();
    }
}

function toggleMobileSidebar() {
    if (elements.sidebar && elements.sidebarOverlay) {
        const isOpen = elements.sidebar.classList.toggle('mobile-open');
        if (isOpen) {
            elements.sidebarOverlay.classList.add('show');
            document.body.style.overflow = 'hidden';
        } else {
            elements.sidebarOverlay.classList.remove('show');
            document.body.style.overflow = '';
        }
    }
}

function closeMobileSidebar() {
    if (elements.sidebar && elements.sidebarOverlay) {
        elements.sidebar.classList.remove('mobile-open');
        elements.sidebarOverlay.classList.remove('show');
        document.body.style.overflow = '';
    }
}

function setupTouchGestures() {
    // Swipe to open/close sidebar on mobile
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    // Long press on chat items for options (mobile)
    if (elements.chatList) {
        elements.chatList.addEventListener('touchstart', handleLongPressStart, { passive: false });
        elements.chatList.addEventListener('touchend', handleLongPressEnd, { passive: true });
        elements.chatList.addEventListener('touchmove', handleLongPressCancel, { passive: true });
    }
}

function handleTouchStart(e) {
    if (!state.isMobile) return;
    
    state.touchStartX = e.changedTouches[0].screenX;
    state.touchStartY = e.changedTouches[0].screenY;
}

function handleTouchMove(e) {
    if (!state.isMobile) return;
    
    state.touchEndX = e.changedTouches[0].screenX;
    state.touchEndY = e.changedTouches[0].screenY;
}

function handleTouchEnd(e) {
    if (!state.isMobile) return;
    
    const deltaX = state.touchEndX - state.touchStartX;
    const deltaY = Math.abs(state.touchEndY - state.touchStartY);
    
    // Swipe right to open sidebar (from left edge)
    if (deltaX > 100 && deltaY < 50 && state.touchStartX < 50) {
        if (!elements.sidebar.classList.contains('mobile-open')) {
            toggleMobileSidebar();
        }
    }
    
    // Swipe left to close sidebar (when open)
    if (deltaX < -100 && deltaY < 50) {
        if (elements.sidebar.classList.contains('mobile-open')) {
            closeMobileSidebar();
        }
    }
}

function handleLongPressStart(e) {
    if (!state.isMobile) return;
    
    const chatItem = e.target.closest('.chat-item');
    if (!chatItem) return;
    
    e.preventDefault();
    
    state.longPressTimer = setTimeout(() => {
        // Vibrate if supported
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        
        // Show delete button on long press
        const deleteBtn = chatItem.querySelector('.chat-item-delete');
        if (deleteBtn) {
            deleteBtn.style.opacity = '1';
            deleteBtn.style.pointerEvents = 'auto';
            
            // Auto-hide after 3 seconds
            setTimeout(() => {
                deleteBtn.style.opacity = '';
                deleteBtn.style.pointerEvents = '';
            }, 3000);
        }
    }, 500); // 500ms long press
}

function handleLongPressEnd(e) {
    if (state.longPressTimer) {
        clearTimeout(state.longPressTimer);
        state.longPressTimer = null;
    }
}

function handleLongPressCancel(e) {
    if (state.longPressTimer) {
        clearTimeout(state.longPressTimer);
        state.longPressTimer = null;
    }
}

// ==================== START APPLICATION ====================
init();
