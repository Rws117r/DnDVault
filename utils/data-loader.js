// ============================================
// D&D VAULT - DATA LOADER
// Loads and manages all JSON data
// ============================================

class DataLoader {
    constructor() {
        this.data = {
            items: [],
            monsters: [],
            characters: [],
            shops: [],
            quests: []
        };
        this.loaded = false;
        this.recentlyUsed = this.loadRecentlyUsed();
        this.pinned = this.loadPinned();
    }

    // Load all data files
    async loadAll() {
        if (this.loaded) return this.data;

        try {
            const [items, monsters, characters, shops, quests] = await Promise.all([
                this.loadJSON('items.json'),
                this.loadJSON('monsters.json'),
                this.loadJSON('characters.json'),
                this.loadJSON('shops.json'),
                this.loadJSON('quests.json')
            ]);

            this.data = { items, monsters, characters, shops, quests };
            this.loaded = true;
            return this.data;
        } catch (error) {
            console.error('Failed to load data:', error);
            throw error;
        }
    }

    // Load a single JSON file
    async loadJSON(filename) {
        const response = await fetch(filename);
        if (!response.ok) {
            console.warn(`Failed to load ${filename}`);
            return [];
        }
        return response.json();
    }

    // Get counts for dashboard
    getCounts() {
        return {
            items: this.data.items.length,
            monsters: this.data.monsters.length,
            characters: this.data.characters.length,
            shops: this.data.shops.length,
            quests: this.data.quests.length
        };
    }

    // Get item by ID
    getItemById(id) {
        return this.data.items.find(item => item.id === id);
    }

    getMonsterById(id) {
        return this.data.monsters.find(m => m.id === id);
    }

    getCharacterById(id) {
        return this.data.characters.find(c => c.id === id);
    }

    getShopById(id) {
        return this.data.shops.find(s => s.id === id);
    }

    getQuestById(id) {
        return this.data.quests.find(q => q.id === id);
    }

    // Search across all data
    search(query) {
        if (!query) return { items: [], monsters: [], characters: [], shops: [], quests: [] };

        const q = query.toLowerCase();

        // Check for prefix filter (e.g., "item:pipe")
        let typeFilter = null;
        let searchTerm = q;

        const prefixMatch = q.match(/^(item|monster|char|shop|quest):(.+)/);
        if (prefixMatch) {
            typeFilter = prefixMatch[1];
            searchTerm = prefixMatch[2].trim();
        }

        const matchFn = (item) => {
            const name = (item.name || '').toLowerCase();
            const desc = (item.description || '').toLowerCase();
            const tags = (item.tags || []).join(' ').toLowerCase();
            return name.includes(searchTerm) || desc.includes(searchTerm) || tags.includes(searchTerm);
        };

        const results = {
            items: (!typeFilter || typeFilter === 'item') ? this.data.items.filter(matchFn) : [],
            monsters: (!typeFilter || typeFilter === 'monster') ? this.data.monsters.filter(matchFn) : [],
            characters: (!typeFilter || typeFilter === 'char') ? this.data.characters.filter(matchFn) : [],
            shops: (!typeFilter || typeFilter === 'shop') ? this.data.shops.filter(matchFn) : [],
            quests: (!typeFilter || typeFilter === 'quest') ? this.data.quests.filter(matchFn) : []
        };

        return results;
    }

    // Get active quests
    getActiveQuests() {
        return this.data.quests.filter(q =>
            q.status === 'In Progress' ||
            q.status === 'Active' ||
            q.quest_type === 'Main Quest' ||
            q.quest_type === 'Debt Quest'
        ).slice(0, 5);
    }

    // Get urgent quests
    getUrgentQuests() {
        return this.data.quests.filter(q =>
            q.quest_type === 'Debt Quest' ||
            (q.name && q.name.toLowerCase().includes('ruby'))
        );
    }

    // Recently used management
    loadRecentlyUsed() {
        try {
            return JSON.parse(localStorage.getItem('dnd_vault_recent') || '[]');
        } catch {
            return [];
        }
    }

    saveRecentlyUsed() {
        localStorage.setItem('dnd_vault_recent', JSON.stringify(this.recentlyUsed));
    }

    addToRecent(type, id, name) {
        // Remove duplicates
        this.recentlyUsed = this.recentlyUsed.filter(r => !(r.type === type && r.id === id));
        // Add to front
        this.recentlyUsed.unshift({ type, id, name, timestamp: Date.now() });
        // Keep only 10
        this.recentlyUsed = this.recentlyUsed.slice(0, 10);
        this.saveRecentlyUsed();
    }

    getRecentlyUsed() {
        return this.recentlyUsed;
    }

    // Pinned items management
    loadPinned() {
        try {
            return JSON.parse(localStorage.getItem('dnd_vault_pinned') || '[]');
        } catch {
            return [];
        }
    }

    savePinned() {
        localStorage.setItem('dnd_vault_pinned', JSON.stringify(this.pinned));
    }

    togglePinned(type, id, name) {
        const exists = this.pinned.find(p => p.type === type && p.id === id);
        if (exists) {
            this.pinned = this.pinned.filter(p => !(p.type === type && p.id === id));
        } else {
            this.pinned.push({ type, id, name });
        }
        this.savePinned();
        return !exists;
    }

    isPinned(type, id) {
        return this.pinned.some(p => p.type === type && p.id === id);
    }

    getPinned() {
        return this.pinned;
    }
}

export const dataLoader = new DataLoader();
