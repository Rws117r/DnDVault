// ============================================
// D&D VAULT - DETAIL VIEW COMPONENT
// Detail page with copy presets
// ============================================

import { router } from '../utils/router.js';
import { dataLoader } from '../utils/data-loader.js';
import { clipboard } from '../utils/clipboard.js';

export function renderDetailView(type, id) {
    const content = document.getElementById('content');
    const header = document.getElementById('header');

    // Get entity
    let entity = null;
    switch (type) {
        case 'items': entity = dataLoader.getItemById(id); break;
        case 'monsters': entity = dataLoader.getMonsterById(id); break;
        case 'characters': entity = dataLoader.getCharacterById(id); break;
        case 'shops': entity = dataLoader.getShopById(id); break;
        case 'quests': entity = dataLoader.getQuestById(id); break;
    }

    if (!entity) {
        content.innerHTML = `<div class="empty-state"><div class="empty-icon">❌</div><div class="empty-text">Entity not found</div></div>`;
        return;
    }

    // Track as recently used
    dataLoader.addToRecent(type.slice(0, -1), id, entity.name);

    const isPinned = dataLoader.isPinned(type.slice(0, -1), id);
    const icon = getTypeIcon(type);

    // Render header
    header.innerHTML = `
        <button class="btn btn-ghost" id="back-btn">← Back</button>
        <h1 class="header-title">${icon} ${entity.name}</h1>
    `;

    // Render content based on type
    content.innerHTML = `
        <div class="content-wrapper">
            <!-- Detail Header -->
            <div class="detail-header">
                <div>
                    <h1 class="detail-title">${entity.name}</h1>
                    <div class="detail-meta">
                        ${getMetaChips(entity, type)}
                    </div>
                </div>
                <div class="detail-actions">
                    <button class="btn btn-ghost ${isPinned ? 'pinned' : ''}" id="pin-btn">
                        ${isPinned ? '📌 Pinned' : '📌 Pin'}
                    </button>
                </div>
            </div>
            
            <div class="detail-columns">
                <!-- Left Column: Lore -->
                <div class="detail-left">
                    ${renderLoreSection(entity, type)}
                    ${renderRelationships(entity, type)}
                </div>
                
                <!-- Right Column: Mechanics -->
                <div class="detail-right">
                    ${renderMechanicsSection(entity, type)}
                    ${renderCopyBox(entity, type)}
                </div>
            </div>
        </div>
    `;

    // Add handlers
    document.getElementById('back-btn').addEventListener('click', () => {
        router.navigate(`/${type}`);
    });

    document.getElementById('pin-btn').addEventListener('click', () => {
        const nowPinned = dataLoader.togglePinned(type.slice(0, -1), id, entity.name);
        const btn = document.getElementById('pin-btn');
        btn.innerHTML = nowPinned ? '📌 Pinned' : '📌 Pin';
        btn.classList.toggle('pinned', nowPinned);
        clipboard.showToast(nowPinned ? 'Pinned!' : 'Unpinned!');
    });

    // Copy button handlers
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const format = btn.dataset.format;
            let text = '';

            switch (format) {
                case 'full':
                    if (type === 'monsters') text = clipboard.generateMonsterBlock(entity);
                    else if (type === 'shops') text = clipboard.generateShopBlock(entity);
                    else if (type === 'characters') text = clipboard.generateCharacterBlock(entity);
                    else if (type === 'quests') text = clipboard.generateQuestBlock(entity);
                    else text = clipboard.generateFullBlock(entity);
                    break;
                case 'rules':
                    text = type === 'monsters'
                        ? clipboard.generateCombatBlock(entity)
                        : clipboard.generateRulesOnly(entity);
                    break;
                case 'lore':
                    text = clipboard.generateLoreOnly(entity);
                    break;
                case 'reference':
                    text = clipboard.generateReferenceUse(entity, 'Character');
                    break;
            }

            await clipboard.copy(text, `${format} block copied!`);
            btn.classList.add('copied');
            setTimeout(() => btn.classList.remove('copied'), 2000);
        });
    });

    // Keyboard shortcuts
    const handleKeyboard = (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case '1':
                    e.preventDefault();
                    document.querySelector('[data-format="full"]')?.click();
                    break;
                case '2':
                    e.preventDefault();
                    document.querySelector('[data-format="rules"]')?.click();
                    break;
                case '3':
                    e.preventDefault();
                    document.querySelector('[data-format="lore"]')?.click();
                    break;
            }
        }
    };

    document.addEventListener('keydown', handleKeyboard);

    // Tag click handlers - navigate to search with tag
    document.querySelectorAll('[data-tag]').forEach(chip => {
        chip.addEventListener('click', () => {
            const tag = chip.dataset.tag;
            router.navigate(`/search?q=${encodeURIComponent(tag)}`);
        });
    });

    // Data-route click handlers (for related items/quests)
    document.querySelectorAll('[data-route]').forEach(chip => {
        chip.addEventListener('click', () => {
            router.navigate(chip.dataset.route);
        });
    });

    // Cleanup on route change
    window.addEventListener('hashchange', () => {
        document.removeEventListener('keydown', handleKeyboard);
    }, { once: true });
}

function getTypeIcon(type) {
    const icons = {
        items: '🎒',
        monsters: '💀',
        characters: '👤',
        shops: '🏪',
        quests: '📜'
    };
    return icons[type] || '📄';
}

function getMetaChips(entity, type) {
    const chips = [];

    switch (type) {
        case 'items':
            if (entity.category) chips.push(`<span class="chip chip-primary">${entity.category}</span>`);
            if (entity.rarity) chips.push(`<span class="chip chip-secondary">${entity.rarity}</span>`);
            if (entity.owner) chips.push(`<span class="chip">Owner: ${entity.owner}</span>`);
            break;
        case 'monsters':
            if (entity.hd) chips.push(`<span class="chip chip-primary">HD ${entity.hd}</span>`);
            if (entity.alignment) chips.push(`<span class="chip">${entity.alignment}</span>`);
            break;
        case 'characters':
            if (entity.type) chips.push(`<span class="chip chip-primary">${entity.type}</span>`);
            break;
        case 'shops':
            if (entity.type) chips.push(`<span class="chip chip-primary">${entity.type}</span>`);
            if (entity.location) chips.push(`<span class="chip">${entity.location}</span>`);
            break;
        case 'quests':
            if (entity.quest_type) chips.push(`<span class="chip chip-primary">${entity.quest_type}</span>`);
            if (entity.status) {
                const urgentTypes = ['Debt Quest', 'Main Quest'];
                const isUrgent = urgentTypes.includes(entity.quest_type);
                chips.push(`<span class="chip ${isUrgent ? 'chip-urgent' : ''}">${entity.status}</span>`);
            }
            break;
    }

    return chips.join('');
}

function renderLoreSection(entity, type) {
    let html = '';

    // Description
    if (entity.description) {
        html += `
            <div class="detail-section">
                <h3 class="detail-section-title">Description</h3>
                <div class="detail-text">${entity.description}</div>
            </div>
        `;
    }

    // Special sections per type
    switch (type) {
        case 'characters':
            if (entity.appearance) {
                html += `
                    <div class="detail-section">
                        <h3 class="detail-section-title">Appearance</h3>
                        <div class="detail-text">${entity.appearance}</div>
                    </div>
                `;
            }
            if (entity.personality) {
                html += `
                    <div class="detail-section">
                        <h3 class="detail-section-title">Personality</h3>
                        <div class="detail-text">${entity.personality}</div>
                    </div>
                `;
            }
            if (entity.motivations) {
                html += `
                    <div class="detail-section">
                        <h3 class="detail-section-title">Motivations</h3>
                        <div class="detail-text">${entity.motivations}</div>
                    </div>
                `;
            }
            if (entity.special_notes) {
                html += `
                    <div class="detail-section">
                        <h3 class="detail-section-title">Special Notes</h3>
                        <div class="detail-text">${entity.special_notes}</div>
                    </div>
                `;
            }
            break;

        case 'quests':
            if (entity.summary) {
                html += `
                    <div class="detail-section">
                        <h3 class="detail-section-title">Summary</h3>
                        <div class="detail-text">${entity.summary}</div>
                    </div>
                `;
            }
            if (entity.objectives && entity.objectives.length > 0) {
                html += `
                    <div class="detail-section">
                        <h3 class="detail-section-title">Objectives</h3>
                        <ul style="padding-left: var(--space-5); color: var(--text-secondary);">
                            ${entity.objectives.map(obj => `<li>${obj}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }
            break;

        case 'shops':
            // Shop owner info
            if (entity.owner_name) {
                html += `
                    <div class="detail-section">
                        <h3 class="detail-section-title">Proprietor</h3>
                        <div class="detail-text"><strong>${entity.owner_name}</strong></div>
                    </div>
                `;
            }

            // Growler Menu (taverns)
            if (entity.growler_menu && entity.growler_menu.length > 0) {
                html += `
                    <div class="detail-section">
                        <h3 class="detail-section-title">🍺 Growler Menu</h3>
                        <table class="data-table">
                            <thead><tr><th>Brew</th><th>Price</th><th>Effect</th></tr></thead>
                            <tbody>
                                ${entity.growler_menu.map(item => `
                                    <tr>
                                        <td><strong>${item.name}</strong></td>
                                        <td>${item.price}</td>
                                        <td style="font-style: italic; color: var(--text-secondary);">${item.effect || item.dialogue || '-'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }

            // Oddments Menu
            if (entity.oddments_menu && entity.oddments_menu.length > 0) {
                html += `
                    <div class="detail-section">
                        <h3 class="detail-section-title">🎒 Oddments & Goods</h3>
                        <table class="data-table">
                            <thead><tr><th>Item</th><th>Price</th><th>Notes</th></tr></thead>
                            <tbody>
                                ${entity.oddments_menu.map(item => `
                                    <tr>
                                        <td><strong>${item.name}</strong></td>
                                        <td>${item.price}</td>
                                        <td style="color: var(--text-secondary);">${item.effect || item.notes || '-'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }

            // General inventory
            if (entity.inventory && entity.inventory.length > 0) {
                html += `
                    <div class="detail-section">
                        <h3 class="detail-section-title">📦 Inventory</h3>
                        <table class="data-table">
                            <thead><tr><th>Item</th><th>Price</th><th>Stock</th></tr></thead>
                            <tbody>
                                ${entity.inventory.map(item => `
                                    <tr><td>${item.name}</td><td>${item.price}</td><td>${item.stock || '-'}</td></tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }

            // Secrets
            if (entity.secrets && entity.secrets.length > 0) {
                html += `
                    <div class="detail-section">
                        <h3 class="detail-section-title">🤫 Secrets</h3>
                        <div class="card" style="background: var(--bg-deep);">
                            <div class="card-body">
                                ${entity.secrets.map(secret => `
                                    <div style="margin-bottom: var(--space-3);">
                                        <strong>${secret.name}</strong>
                                        ${secret.item_id ? `<span class="chip chip-secondary" style="cursor: pointer; margin-left: var(--space-2);" data-route="/items/detail/${secret.item_id}">📦 View Item</span>` : ''}
                                        <p style="color: var(--text-secondary); margin-top: var(--space-2);">${secret.requirement}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                `;
            }

            // Special Notes (like Beiric relationship)
            if (entity.special_notes) {
                html += `
                    <div class="detail-section">
                        <h3 class="detail-section-title">📝 Special Notes</h3>
                        <div class="detail-text" style="white-space: pre-wrap;">${entity.special_notes}</div>
                    </div>
                `;
            }
            break;
    }

    // Tags
    if (entity.tags && entity.tags.length > 0) {
        html += `
            <div class="detail-section">
                <h3 class="detail-section-title">🏷️ Tags</h3>
                <div style="display: flex; flex-wrap: wrap; gap: var(--space-2);">
                    ${entity.tags.map(tag => `<span class="chip" data-tag="${tag}" style="cursor: pointer;" title="Search for ${tag}">${tag}</span>`).join('')}
                </div>
            </div>
        `;
    }

    return html;
}

function renderMechanicsSection(entity, type) {
    let html = '';

    switch (type) {
        case 'items':
            if (entity.rules) {
                html += `
                    <div class="detail-section">
                        <h3 class="detail-section-title">Mechanical Effects</h3>
                        <div class="detail-text" style="white-space: pre-wrap;">${entity.rules.replace(/\\n/g, '\n')}</div>
                    </div>
                `;
            }
            break;

        case 'monsters':
            html += `
                <div class="detail-section">
                    <h3 class="detail-section-title">OSE Stat Block</h3>
                    <div class="card" style="background: var(--bg-deep); font-family: var(--font-mono); font-size: var(--text-sm);">
                        <div class="card-body">
                            <div><strong>AC</strong> ${entity.ac} | <strong>HD</strong> ${entity.hd} | <strong>HP</strong> ${entity.hp}</div>
                            <div><strong>Attacks:</strong> ${entity.attacks}</div>
                            <div><strong>THAC0:</strong> ${entity.thac0}</div>
                            <div><strong>Movement:</strong> ${entity.movement}</div>
                            <div><strong>Saves:</strong> ${entity.saves}</div>
                            <div><strong>Morale:</strong> ${entity.morale}</div>
                            <div><strong>Alignment:</strong> ${entity.alignment}</div>
                            <div><strong>XP:</strong> ${entity.xp}</div>
                        </div>
                    </div>
                </div>
            `;
            if (entity.special_abilities) {
                html += `
                    <div class="detail-section">
                        <h3 class="detail-section-title">Special Abilities</h3>
                        <div class="detail-text" style="white-space: pre-wrap;">${entity.special_abilities.replace(/\\n/g, '\n')}</div>
                    </div>
                `;
            }
            break;

        case 'quests':
            if (entity.rewards) {
                html += `
                    <div class="detail-section">
                        <h3 class="detail-section-title">Rewards</h3>
                        <div class="detail-text">${entity.rewards}</div>
                    </div>
                `;
            }
            if (entity.failure_consequences) {
                html += `
                    <div class="detail-section">
                        <h3 class="detail-section-title">⚠️ Failure Consequences</h3>
                        <div class="detail-text" style="color: var(--status-urgent);">${entity.failure_consequences}</div>
                    </div>
                `;
            }
            break;
    }

    return html;
}

function renderRelationships(entity, type) {
    let html = '';

    if (entity.related_items && entity.related_items.length > 0) {
        html += `
            <div class="detail-section">
                <h3 class="detail-section-title">Related Items</h3>
                <div style="display: flex; flex-wrap: wrap; gap: var(--space-2);">
                    ${entity.related_items.map(id => {
            const item = dataLoader.getItemById(id);
            return item ? `<span class="chip chip-secondary" style="cursor: pointer;" data-route="/items/detail/${id}">${item.name}</span>` : '';
        }).join('')}
                </div>
            </div>
        `;
    }

    if (entity.quest_ids && entity.quest_ids.length > 0) {
        html += `
            <div class="detail-section">
                <h3 class="detail-section-title">Related Quests</h3>
                <div style="display: flex; flex-wrap: wrap; gap: var(--space-2);">
                    ${entity.quest_ids.map(id => {
            const quest = dataLoader.getQuestById(id);
            return quest ? `<span class="chip chip-primary" style="cursor: pointer;" data-route="/quests/detail/${id}">${quest.name}</span>` : '';
        }).join('')}
                </div>
            </div>
        `;
    }

    return html;
}

function renderCopyBox(entity, type) {
    const isMonster = type === 'monsters';

    return `
        <div class="copy-box">
            <div class="copy-box-title">
                📋 Copy for ChatGPT
            </div>
            <div class="copy-buttons">
                <button class="copy-btn" data-format="full">
                    ${isMonster ? 'Full Stat Block' : 'Full Block'}
                    <span class="copy-shortcut">Ctrl+1</span>
                </button>
                <button class="copy-btn" data-format="rules">
                    ${isMonster ? 'Combat Block' : 'Rules Only'}
                    <span class="copy-shortcut">Ctrl+2</span>
                </button>
                <button class="copy-btn" data-format="lore">
                    Lore Only
                    <span class="copy-shortcut">Ctrl+3</span>
                </button>
                ${!isMonster ? `
                    <button class="copy-btn" data-format="reference">
                        Reference Use
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}
