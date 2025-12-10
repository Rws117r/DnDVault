// ============================================
// D&D VAULT - SEARCH COMPONENT
// Global search with results
// ============================================

import { router } from '../utils/router.js';
import { dataLoader } from '../utils/data-loader.js';
import { clipboard } from '../utils/clipboard.js';

export function renderSearchView(initialQuery = '') {
    const content = document.getElementById('content');
    const header = document.getElementById('header');

    // Get query from URL if present
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const query = urlParams.get('q') || initialQuery;

    // Render header
    header.innerHTML = `
        <h1 class="header-title">🔍 Search</h1>
    `;

    // Render content
    content.innerHTML = `
        <div class="content-wrapper">
            <div class="search-wrapper" style="max-width: 600px; margin-bottom: var(--space-6);">
                <span class="search-icon">🔍</span>
                <input type="text" class="search-input" id="search-input" 
                       placeholder="Search items, monsters, quests... (try item:pipe or quest:hag)"
                       value="${query}"
                       autofocus>
            </div>
            
            <div id="search-results">
                ${query ? renderResults(dataLoader.search(query)) : renderHelpText()}
            </div>
        </div>
    `;

    // Search handler
    const searchInput = document.getElementById('search-input');
    let debounceTimer;

    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const q = searchInput.value.trim();
            const resultsDiv = document.getElementById('search-results');

            if (q) {
                const results = dataLoader.search(q);
                resultsDiv.innerHTML = renderResults(results);
                attachResultHandlers();
            } else {
                resultsDiv.innerHTML = renderHelpText();
            }
        }, 150);
    });

    // Initial attachment if there's a query
    if (query) {
        attachResultHandlers();
    }
}

function renderHelpText() {
    return `
        <div class="card">
            <div class="card-body">
                <h3 style="margin-bottom: var(--space-4); color: var(--text-primary);">Search Tips</h3>
                <ul style="color: var(--text-secondary); padding-left: var(--space-5);">
                    <li>Search by name, description, or tags</li>
                    <li>Use <code style="background: var(--bg-deep); padding: 2px 6px; border-radius: 4px;">item:pipe</code> to search only items</li>
                    <li>Use <code style="background: var(--bg-deep); padding: 2px 6px; border-radius: 4px;">monster:undead</code> to search only monsters</li>
                    <li>Use <code style="background: var(--bg-deep); padding: 2px 6px; border-radius: 4px;">quest:hag</code> to search only quests</li>
                    <li>Press <kbd class="kbd">/</kbd> anywhere to focus search</li>
                </ul>
            </div>
        </div>
    `;
}

function renderResults(results) {
    const total = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);

    if (total === 0) {
        return `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <div class="empty-text">No results found</div>
            </div>
        `;
    }

    let html = `<p style="color: var(--text-muted); margin-bottom: var(--space-4);">${total} results found</p>`;

    // Items
    if (results.items.length > 0) {
        html += renderResultSection('Items', results.items, 'items', '🎒');
    }

    // Monsters
    if (results.monsters.length > 0) {
        html += renderResultSection('Monsters', results.monsters, 'monsters', '💀');
    }

    // Characters
    if (results.characters.length > 0) {
        html += renderResultSection('Characters', results.characters, 'characters', '👤');
    }

    // Shops
    if (results.shops.length > 0) {
        html += renderResultSection('Shops', results.shops, 'shops', '🏪');
    }

    // Quests
    if (results.quests.length > 0) {
        html += renderResultSection('Quests', results.quests, 'quests', '📜');
    }

    return html;
}

function renderResultSection(title, items, type, icon) {
    return `
        <div class="card" style="margin-bottom: var(--space-4);">
            <div class="card-header">
                <h2 class="card-title">${icon} ${title} (${items.length})</h2>
            </div>
            <table class="data-table">
                <tbody>
                    ${items.slice(0, 10).map(item => `
                        <tr class="result-row" data-type="${type}" data-id="${item.id}">
                            <td class="name-cell">${item.name}</td>
                            <td style="color: var(--text-secondary); max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                ${(item.description || '').slice(0, 60)}...
                            </td>
                            <td class="tags-cell">
                                ${(item.tags || []).slice(0, 3).map(t => `<span class="chip">${t}</span>`).join('')}
                            </td>
                            <td style="width: 80px;">
                                <button class="btn btn-sm btn-ghost quick-copy" data-id="${item.id}" title="Quick copy">
                                    📋
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                    ${items.length > 10 ? `
                        <tr>
                            <td colspan="4" style="color: var(--text-muted); text-align: center;">
                                ...and ${items.length - 10} more
                            </td>
                        </tr>
                    ` : ''}
                </tbody>
            </table>
        </div>
    `;
}

function attachResultHandlers() {
    // Row click -> detail view
    document.querySelectorAll('.result-row').forEach(row => {
        row.addEventListener('click', (e) => {
            // Don't navigate if clicking copy button
            if (e.target.closest('.quick-copy')) return;

            const type = row.dataset.type;
            const id = row.dataset.id;
            router.navigate(`/${type}/detail/${id}`);
        });
    });

    // Quick copy button
    document.querySelectorAll('.quick-copy').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            const row = btn.closest('.result-row');
            const type = row.dataset.type;

            let entity = null;
            switch (type) {
                case 'items': entity = dataLoader.getItemById(id); break;
                case 'monsters': entity = dataLoader.getMonsterById(id); break;
                case 'characters': entity = dataLoader.getCharacterById(id); break;
                case 'shops': entity = dataLoader.getShopById(id); break;
                case 'quests': entity = dataLoader.getQuestById(id); break;
            }

            if (entity) {
                const text = type === 'monsters'
                    ? clipboard.generateMonsterBlock(entity)
                    : clipboard.generateFullBlock(entity);
                await clipboard.copy(text, 'Copied!');
            }
        });
    });
}
