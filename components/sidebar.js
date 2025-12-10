// ============================================
// D&D VAULT - SIDEBAR COMPONENT
// ============================================

import { router } from '../utils/router.js';
import { dataLoader } from '../utils/data-loader.js';

export function renderSidebar() {
    const sidebar = document.getElementById('sidebar');
    const counts = dataLoader.getCounts();
    const currentRoute = router.currentRoute || '/';

    sidebar.innerHTML = `
        <div class="sidebar-header">
            <div class="sidebar-logo">
                <span class="logo-icon">🏰</span>
                <span>D&D Vault</span>
            </div>
            <div class="sidebar-campaign">Dolmenwood: Hag's Addle Arc</div>
        </div>
        
        <nav class="sidebar-nav">
            <div class="nav-section">
                <div class="nav-section-title">Navigation</div>
                <a class="nav-link ${currentRoute === '/' ? 'active' : ''}" data-route="/">
                    <span class="nav-icon">📊</span>
                    <span>Dashboard</span>
                </a>
            </div>
            
            <div class="nav-section">
                <div class="nav-section-title">Content</div>
                <a class="nav-link ${currentRoute === '/items' ? 'active' : ''}" data-route="/items">
                    <span class="nav-icon">🎒</span>
                    <span>Items</span>
                    <span class="nav-count">${counts.items}</span>
                </a>
                <a class="nav-link ${currentRoute === '/monsters' ? 'active' : ''}" data-route="/monsters">
                    <span class="nav-icon">💀</span>
                    <span>Monsters</span>
                    <span class="nav-count">${counts.monsters}</span>
                </a>
                <a class="nav-link ${currentRoute === '/characters' ? 'active' : ''}" data-route="/characters">
                    <span class="nav-icon">👤</span>
                    <span>Characters</span>
                    <span class="nav-count">${counts.characters}</span>
                </a>
                <a class="nav-link ${currentRoute === '/shops' ? 'active' : ''}" data-route="/shops">
                    <span class="nav-icon">🏪</span>
                    <span>Shops</span>
                    <span class="nav-count">${counts.shops}</span>
                </a>
                <a class="nav-link ${currentRoute === '/quests' ? 'active' : ''}" data-route="/quests">
                    <span class="nav-icon">📜</span>
                    <span>Quests</span>
                    <span class="nav-count">${counts.quests}</span>
                </a>
            </div>
            
            <div class="nav-section">
                <div class="nav-section-title">Tools</div>
                <a class="nav-link ${currentRoute === '/encounter' ? 'active' : ''}" data-route="/encounter">
                    <span class="nav-icon">⚔️</span>
                    <span>Encounter</span>
                </a>
                <a class="nav-link ${currentRoute === '/search' ? 'active' : ''}" data-route="/search">
                    <span class="nav-icon">🔍</span>
                    <span>Search</span>
                </a>
            </div>
            
            <div class="nav-section" style="margin-top: auto; border-top: 1px solid var(--border-default); padding-top: var(--space-4);">
                <label class="compact-toggle">
                    <input type="checkbox" id="compact-mode-toggle" ${localStorage.getItem('compactMode') === 'true' ? 'checked' : ''}>
                    <span>Compact Mode</span>
                </label>
                <div style="font-size: var(--text-xs); color: var(--text-muted); margin-top: var(--space-3);">
                    Press <kbd class="kbd">?</kbd> for help
                </div>
            </div>
        </nav>
    `;

    // Add click handlers
    sidebar.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const route = link.dataset.route;
            router.navigate(route);
        });
    });

    // Compact mode toggle
    const compactToggle = document.getElementById('compact-mode-toggle');
    compactToggle.addEventListener('change', () => {
        const isCompact = compactToggle.checked;
        localStorage.setItem('compactMode', isCompact);
        document.body.classList.toggle('compact-mode', isCompact);
    });

    // Apply saved compact mode on load
    if (localStorage.getItem('compactMode') === 'true') {
        document.body.classList.add('compact-mode');
    }
}
