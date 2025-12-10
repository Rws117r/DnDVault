// ============================================
// D&D VAULT - DASHBOARD COMPONENT
// ============================================

import { router } from '../utils/router.js';
import { dataLoader } from '../utils/data-loader.js';

export function renderDashboard() {
    const content = document.getElementById('content');
    const header = document.getElementById('header');
    const counts = dataLoader.getCounts();
    const activeQuests = dataLoader.getActiveQuests();
    const urgentQuests = dataLoader.getUrgentQuests();
    const recentlyUsed = dataLoader.getRecentlyUsed();
    const pinned = dataLoader.getPinned();

    // Render header
    header.innerHTML = `
        <h1 class="header-title">Dashboard</h1>
        <div class="header-search">
            <div class="search-wrapper">
                <span class="search-icon">🔍</span>
                <input type="text" class="search-input" id="global-search" placeholder="Search items, monsters, quests... (press /)">
            </div>
        </div>
    `;

    // Render content
    content.innerHTML = `
        <div class="content-wrapper">
            <!-- Campaign Header -->
            <div class="campaign-header">
                <h1 class="campaign-title">Dolmenwood — Five Cores of Suffering</h1>
                <div class="campaign-arc">Arc: The Ruby Contract</div>
            </div>
            
            <div class="dashboard-grid">
                <div class="dashboard-left">
                    <!-- Quick Stats -->
                    <div class="card">
                        <div class="card-header">
                            <h2 class="card-title">Vault Contents</h2>
                        </div>
                        <div class="card-body">
                            <div class="stat-grid">
                                <div class="stat-box" data-route="/items">
                                    <div class="stat-value">${counts.items}</div>
                                    <div class="stat-label">Items</div>
                                </div>
                                <div class="stat-box" data-route="/monsters">
                                    <div class="stat-value">${counts.monsters}</div>
                                    <div class="stat-label">Monsters</div>
                                </div>
                                <div class="stat-box" data-route="/characters">
                                    <div class="stat-value">${counts.characters}</div>
                                    <div class="stat-label">Characters</div>
                                </div>
                                <div class="stat-box" data-route="/shops">
                                    <div class="stat-value">${counts.shops}</div>
                                    <div class="stat-label">Shops</div>
                                </div>
                                <div class="stat-box" data-route="/quests">
                                    <div class="stat-value">${counts.quests}</div>
                                    <div class="stat-label">Quests</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Active Quests -->
                    <div class="card">
                        <div class="card-header">
                            <h2 class="card-title">Active Quests</h2>
                        </div>
                        <div class="card-body">
                            ${activeQuests.length > 0 ? activeQuests.map(quest => `
                                <div class="quest-item" data-id="${quest.id}" data-type="quest">
                                    <span class="quest-icon">📜</span>
                                    <div class="quest-info">
                                        <div class="quest-name">${quest.name}</div>
                                        <div class="quest-summary">${quest.description?.slice(0, 100) || quest.summary?.slice(0, 100) || ''}...</div>
                                        <div class="quest-tags">
                                            ${quest.quest_type ? `<span class="chip chip-primary">${quest.quest_type}</span>` : ''}
                                            ${quest.status ? `<span class="chip">${quest.status}</span>` : ''}
                                        </div>
                                    </div>
                                </div>
                            `).join('') : '<p class="empty-text">No active quests</p>'}
                        </div>
                    </div>
                </div>
                
                <div class="dashboard-right">
                    <!-- Urgent Panel -->
                    ${urgentQuests.length > 0 ? `
                        <div class="urgent-panel">
                            <div class="urgent-title">⚠️ Urgent: Ruby Contract</div>
                            <div class="urgent-text">
                                Enmog owes Azelach a soul within <strong>one lunar cycle</strong> or both he AND Ninuel join the Funeral Choir!
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- Recently Used -->
                    <div class="card">
                        <div class="card-header">
                            <h2 class="card-title">Recently Used</h2>
                        </div>
                        <div class="card-body">
                            <ul class="recent-list">
                                ${recentlyUsed.length > 0 ? recentlyUsed.map(item => `
                                    <li class="recent-item" data-id="${item.id}" data-type="${item.type}">
                                        <span class="recent-icon">${getTypeIcon(item.type)}</span>
                                        <span class="recent-name">${item.name}</span>
                                        <span class="recent-type">${item.type}</span>
                                    </li>
                                `).join('') : '<li class="empty-text">No recent items</li>'}
                            </ul>
                        </div>
                    </div>
                    
                    <!-- Pinned -->
                    ${pinned.length > 0 ? `
                        <div class="card">
                            <div class="card-header">
                                <h2 class="card-title">📌 Pinned</h2>
                            </div>
                            <div class="card-body">
                                <ul class="recent-list">
                                    ${pinned.map(item => `
                                        <li class="recent-item" data-id="${item.id}" data-type="${item.type}">
                                            <span class="recent-icon">${getTypeIcon(item.type)}</span>
                                            <span class="recent-name">${item.name}</span>
                                            <span class="recent-type">${item.type}</span>
                                        </li>
                                    `).join('')}
                                </ul>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;

    // Add click handlers for stat boxes
    content.querySelectorAll('.stat-box').forEach(box => {
        box.addEventListener('click', () => {
            router.navigate(box.dataset.route);
        });
    });

    // Add click handlers for quest items and recent items
    content.querySelectorAll('.quest-item, .recent-item').forEach(item => {
        item.addEventListener('click', () => {
            const type = item.dataset.type;
            const id = item.dataset.id;
            router.navigate(`/${type}s/detail/${id}`);
        });
    });

    // Add search handler
    const searchInput = document.getElementById('global-search');
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter' && searchInput.value.trim()) {
            router.navigate(`/search?q=${encodeURIComponent(searchInput.value)}`);
        }
    });
}

function getTypeIcon(type) {
    const icons = {
        item: '🎒',
        monster: '💀',
        character: '👤',
        shop: '🏪',
        quest: '📜'
    };
    return icons[type] || '📄';
}
