// ============================================
// D&D VAULT - SESSION SCRATCHPAD
// Simple paste & auto-save for ChatGPT sessions
// ============================================

import { router } from '../utils/router.js';
import { clipboard } from '../utils/clipboard.js';

let currentSession = {
    id: null,
    title: '',
    content: '',
    created: null,
    lastSaved: null
};

let saveTimeout = null;
let isSaving = false;

export function renderScratchpad() {
    const content = document.getElementById('content');
    const header = document.getElementById('header');

    // Load or create session
    loadCurrentSession();

    // Render header
    header.innerHTML = `
        <div style="display: flex; align-items: center; gap: var(--space-4);">
            <h1 class="header-title">📝 Session Scratchpad</h1>
        </div>
        <div style="display: flex; gap: var(--space-2); align-items: center;">
            <span class="save-indicator" id="save-indicator">✔ Saved</span>
            <button class="btn btn-ghost" id="new-session-btn">🆕 New Session</button>
            <button class="btn btn-ghost" id="download-btn">⬇️ Download</button>
        </div>
    `;

    // Render content
    content.innerHTML = `
        <div class="scratchpad-container">
            <!-- Session Title -->
            <div class="scratchpad-header">
                <input type="text" id="session-title" class="session-title-input" 
                       value="${currentSession.title}" 
                       placeholder="Session title...">
                <span class="session-date">${formatDate(currentSession.created)}</span>
            </div>

            <!-- Giant Text Area -->
            <textarea id="scratchpad-content" class="scratchpad-textarea" 
                      placeholder="Paste your ChatGPT session here...

Just Ctrl+A, Ctrl+C from ChatGPT, then Ctrl+V here.

Everything auto-saves. Zero effort.">${currentSession.content}</textarea>

            <!-- Previous Sessions Sidebar -->
            <div class="sessions-sidebar" id="sessions-sidebar">
                <h3>📚 Previous Sessions</h3>
                <div id="sessions-list">
                    ${renderSessionsList()}
                </div>
            </div>
        </div>
    `;

    attachScratchpadHandlers();
}

// ============================================
// SESSION MANAGEMENT
// ============================================

function loadCurrentSession() {
    const savedCurrent = localStorage.getItem('scratchpad_current_session');

    if (savedCurrent) {
        currentSession = JSON.parse(savedCurrent);
    } else {
        createNewSession();
    }
}

function createNewSession() {
    const now = new Date();
    const id = now.getTime().toString();

    currentSession = {
        id,
        title: `Session ${formatDate(now)}`,
        content: '',
        created: now.toISOString(),
        lastSaved: now.toISOString()
    };

    saveCurrentSession();
}

function saveCurrentSession() {
    currentSession.lastSaved = new Date().toISOString();
    localStorage.setItem('scratchpad_current_session', JSON.stringify(currentSession));

    // Also save to session history
    const sessions = getSessions();
    const existingIndex = sessions.findIndex(s => s.id === currentSession.id);

    if (existingIndex >= 0) {
        sessions[existingIndex] = currentSession;
    } else {
        sessions.unshift(currentSession);
    }

    // Keep last 50 sessions
    localStorage.setItem('scratchpad_sessions', JSON.stringify(sessions.slice(0, 50)));
}

function getSessions() {
    try {
        return JSON.parse(localStorage.getItem('scratchpad_sessions') || '[]');
    } catch {
        return [];
    }
}

function loadSession(id) {
    const sessions = getSessions();
    const session = sessions.find(s => s.id === id);
    if (session) {
        currentSession = session;
        localStorage.setItem('scratchpad_current_session', JSON.stringify(currentSession));
        renderScratchpad();
    }
}

// ============================================
// AUTO-SAVE
// ============================================

function triggerAutoSave() {
    // Show saving indicator
    const indicator = document.getElementById('save-indicator');
    if (indicator) {
        indicator.textContent = '● Saving...';
        indicator.classList.add('saving');
    }

    // Debounce save
    if (saveTimeout) clearTimeout(saveTimeout);

    saveTimeout = setTimeout(() => {
        saveCurrentSession();

        if (indicator) {
            indicator.textContent = '✔ Saved';
            indicator.classList.remove('saving');
        }
    }, 500);
}

// ============================================
// UI HELPERS
// ============================================

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

function renderSessionsList() {
    const sessions = getSessions();

    if (sessions.length === 0) {
        return '<p class="empty-sessions">No previous sessions</p>';
    }

    return sessions.slice(0, 20).map(session => `
        <div class="session-item ${session.id === currentSession.id ? 'active' : ''}" 
             data-session-id="${session.id}">
            <div class="session-item-title">${session.title || 'Untitled'}</div>
            <div class="session-item-date">${formatDate(session.created)}</div>
            <div class="session-item-preview">${(session.content || '').slice(0, 50)}...</div>
        </div>
    `).join('');
}

function downloadSession() {
    const filename = `${currentSession.title.replace(/[^a-z0-9]/gi, '_')}_${currentSession.id}.txt`;
    const blob = new Blob([currentSession.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
    clipboard.showToast('Session downloaded!');
}

// ============================================
// EVENT HANDLERS
// ============================================

function attachScratchpadHandlers() {
    // Title input
    document.getElementById('session-title')?.addEventListener('input', (e) => {
        currentSession.title = e.target.value;
        triggerAutoSave();
    });

    // Main textarea
    const textarea = document.getElementById('scratchpad-content');
    textarea?.addEventListener('input', (e) => {
        currentSession.content = e.target.value;
        triggerAutoSave();
    });

    // Auto-focus textarea
    textarea?.focus();

    // New session button
    document.getElementById('new-session-btn')?.addEventListener('click', () => {
        if (currentSession.content && currentSession.content.length > 10) {
            if (!confirm('Start a new session? Current session is saved.')) return;
        }
        createNewSession();
        renderScratchpad();
        clipboard.showToast('New session started!');
    });

    // Download button
    document.getElementById('download-btn')?.addEventListener('click', downloadSession);

    // Session list items
    document.querySelectorAll('.session-item').forEach(item => {
        item.addEventListener('click', () => {
            loadSession(item.dataset.sessionId);
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);
}

function handleKeyboard(e) {
    // Ctrl+S to force save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveCurrentSession();
        document.getElementById('save-indicator').textContent = '✔ Saved';
        clipboard.showToast('Session saved!');
    }
}

// Cleanup
window.addEventListener('hashchange', () => {
    document.removeEventListener('keydown', handleKeyboard);
});
