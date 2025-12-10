// ============================================
// D&D VAULT - MAIN ENTRY POINT
// ============================================

import { router } from './utils/router.js';
import { dataLoader } from './utils/data-loader.js';
import { clipboard } from './utils/clipboard.js';
import { renderSidebar } from './components/sidebar.js';
import { renderDashboard } from './components/dashboard.js';
import { renderListView } from './components/list-view.js';
import { renderDetailView } from './components/detail-view.js';
import { renderSearchView } from './components/search.js';
import { renderEncounterView } from './components/encounter.js';
import { renderQuestGraph } from './components/quest-graph.js';
import { renderScratchpad } from './components/scratchpad.js';
import { renderCalendar } from './components/calendar.js';

// Initialize app
async function init() {
    console.log('🏰 D&D Vault initializing...');

    // Show loading state
    document.getElementById('content').innerHTML = `
        <div class="loading">
            <span style="font-size: 2rem;">🏰</span>
            <span>Loading D&D Vault...</span>
        </div>
    `;

    try {
        // Load all data
        await dataLoader.loadAll();
        console.log('📚 Data loaded:', dataLoader.getCounts());

        // Initialize clipboard
        clipboard.init();

        // Setup routes
        setupRoutes();

        // Setup global keyboard shortcuts
        setupKeyboardShortcuts();

        // Initial render
        renderSidebar();
        router.handleRoute();

        console.log('✅ D&D Vault ready!');
    } catch (error) {
        console.error('❌ Failed to initialize:', error);
        document.getElementById('content').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">❌</div>
                <div class="empty-text">Failed to load data</div>
                <p style="color: var(--text-muted);">${error.message}</p>
            </div>
        `;
    }
}

// Setup all routes
function setupRoutes() {
    router
        // Dashboard
        .on('/', () => {
            renderSidebar();
            renderDashboard();
        })

        // Items
        .on('/items', () => {
            renderSidebar();
            renderListView('items', 'Items', '🎒');
        })

        // Monsters
        .on('/monsters', () => {
            renderSidebar();
            renderListView('monsters', 'Monsters', '💀');
        })

        // Characters
        .on('/characters', () => {
            renderSidebar();
            renderListView('characters', 'Characters', '👤');
        })

        // Shops
        .on('/shops', () => {
            renderSidebar();
            renderListView('shops', 'Shops', '🏪');
        })

        // Quest Graph (must come before /quests to match first)
        .on('/quests/graph', () => {
            renderSidebar();
            renderQuestGraph();
        })

        // Quests
        .on('/quests', () => {
            renderSidebar();
            renderListView('quests', 'Quests', '📜');
        })

        // Search
        .on('/search', () => {
            renderSidebar();
            renderSearchView();
        })

        // Encounter
        .on('/encounter', () => {
            renderSidebar();
            renderEncounterView();
        })

        // Scratchpad
        .on('/scratchpad', () => {
            renderSidebar();
            renderScratchpad();
        })

        // Calendar
        .on('/calendar', () => {
            renderSidebar();
            renderCalendar();
        })

        // 404
        .on('/404', () => {
            document.getElementById('content').innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🗺️</div>
                    <div class="empty-text">Page not found</div>
                </div>
            `;
        });
}

// Setup global keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Don't trigger shortcuts when typing in inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            // Allow Escape to blur input
            if (e.key === 'Escape') {
                e.target.blur();
            }
            return;
        }

        switch (e.key) {
            case '/':
                e.preventDefault();
                const searchInput = document.querySelector('.search-input');
                if (searchInput) searchInput.focus();
                break;

            case 'i':
                router.navigate('/items');
                break;

            case 'm':
                router.navigate('/monsters');
                break;

            case 'c':
                router.navigate('/characters');
                break;

            case 'q':
                router.navigate('/quests');
                break;

            case 's':
                if (e.shiftKey) {
                    router.navigate('/shops');
                } else {
                    router.navigate('/search');
                }
                break;

            case 'h':
            case 'd':
                router.navigate('/');
                break;

            case '?':
                showHelp();
                break;

            case 'Escape':
                router.navigate('/');
                break;
        }
    });
}

// Show help overlay
function showHelp() {
    const existingHelp = document.getElementById('help-overlay');
    if (existingHelp) {
        existingHelp.remove();
        return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'help-overlay';
    overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    `;

    overlay.innerHTML = `
        <div class="card" style="max-width: 400px;">
            <div class="card-header">
                <h2 class="card-title">⌨️ Keyboard Shortcuts</h2>
                <button class="btn btn-ghost" id="close-help">✕</button>
            </div>
            <div class="card-body">
                <table style="width: 100%; font-size: var(--text-sm);">
                    <tr><td><kbd class="kbd">/</kbd></td><td>Focus search</td></tr>
                    <tr><td><kbd class="kbd">d</kbd> or <kbd class="kbd">h</kbd></td><td>Dashboard</td></tr>
                    <tr><td><kbd class="kbd">i</kbd></td><td>Items list</td></tr>
                    <tr><td><kbd class="kbd">m</kbd></td><td>Monsters list</td></tr>
                    <tr><td><kbd class="kbd">c</kbd></td><td>Characters list</td></tr>
                    <tr><td><kbd class="kbd">q</kbd></td><td>Quests list</td></tr>
                    <tr><td><kbd class="kbd">s</kbd></td><td>Search</td></tr>
                    <tr><td><kbd class="kbd">Shift+S</kbd></td><td>Shops list</td></tr>
                    <tr><td><kbd class="kbd">Esc</kbd></td><td>Go home / close</td></tr>
                    <tr><td colspan="2" style="padding-top: var(--space-3); border-top: 1px solid var(--border-default);"></td></tr>
                    <tr><td><kbd class="kbd">Ctrl+1</kbd></td><td>Copy full block</td></tr>
                    <tr><td><kbd class="kbd">Ctrl+2</kbd></td><td>Copy rules only</td></tr>
                    <tr><td><kbd class="kbd">Ctrl+3</kbd></td><td>Copy lore only</td></tr>
                </table>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Close handlers
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
    document.getElementById('close-help').addEventListener('click', () => overlay.remove());
}

// Handle detail routes (need special handling due to params)
window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1);

    // Check for detail routes
    const detailMatch = hash.match(/^\/(items|monsters|characters|shops|quests)\/detail\/(.+)$/);
    if (detailMatch) {
        const [, type, id] = detailMatch;
        renderSidebar();
        renderDetailView(type, id);
        return;
    }
});

// Also handle on initial load
window.addEventListener('load', () => {
    const hash = window.location.hash.slice(1);
    const detailMatch = hash.match(/^\/(items|monsters|characters|shops|quests)\/detail\/(.+)$/);
    if (detailMatch) {
        const [, type, id] = detailMatch;
        // Wait for data to load
        dataLoader.loadAll().then(() => {
            renderSidebar();
            renderDetailView(type, id);
        });
    }
});

// Start the app
init();
