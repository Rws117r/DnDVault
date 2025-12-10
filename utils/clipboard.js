// ============================================
// D&D VAULT - CLIPBOARD UTILITY
// Handles copy-to-clipboard with toast feedback
// ============================================

class ClipboardManager {
    constructor() {
        this.toastContainer = null;
    }

    init() {
        this.toastContainer = document.getElementById('toast-container');
    }

    // Copy text to clipboard
    async copy(text, label = 'Copied!') {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast(`✓ ${label}`);
            return true;
        } catch (error) {
            console.error('Failed to copy:', error);
            // Fallback for older browsers
            this.fallbackCopy(text);
            this.showToast(`✓ ${label}`);
            return true;
        }
    }

    // Fallback copy method
    fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }

    // Show toast notification
    showToast(message, type = 'success', duration = 2000) {
        if (!this.toastContainer) this.init();

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        this.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // Generate copy blocks for different formats
    generateFullBlock(entity) {
        let block = `**${entity.name}**`;
        if (entity.category) block += ` — ${entity.category}`;
        if (entity.rarity) block += ` (${entity.rarity})`;
        block += '\n\n';

        if (entity.description) {
            block += entity.description + '\n\n';
        }

        if (entity.rules) {
            block += entity.rules.replace(/\\n/g, '\n');
        }

        return block;
    }

    generateRulesOnly(entity) {
        if (entity.rules) {
            return entity.rules.replace(/\\n/g, '\n');
        }
        if (entity.special_abilities) {
            return entity.special_abilities.replace(/\\n/g, '\n');
        }
        return entity.description || '';
    }

    generateLoreOnly(entity) {
        return entity.description || '';
    }

    generateReferenceUse(entity, user = 'Character') {
        let block = `${user} uses **${entity.name}**.\n\n`;
        block += '**Effect:**\n';
        block += this.generateRulesOnly(entity);
        return block;
    }

    // Generate monster stat block
    generateMonsterBlock(monster) {
        let block = `**${monster.name}**\n\n`;
        block += `AC ${monster.ac} | HD ${monster.hd} | HP ${monster.hp}\n`;
        block += `Att: ${monster.attacks} | THAC0 ${monster.thac0}\n`;
        block += `MV ${monster.movement} | ML ${monster.morale}\n`;
        block += `Saves: ${monster.saves}\n`;
        block += `AL ${monster.alignment} | XP ${monster.xp}\n\n`;

        if (monster.special_abilities) {
            block += '**Special:**\n' + monster.special_abilities.replace(/\\n/g, '\n');
        }

        return block;
    }

    generateCombatBlock(monster) {
        return `**${monster.name}** — AC ${monster.ac} | HP ${monster.hp} | Att ${monster.attacks} | THAC0 ${monster.thac0}`;
    }

    // Generate shop block
    generateShopBlock(shop) {
        let block = `**${shop.name}**\n`;
        if (shop.type) block += `*${shop.type}*`;
        if (shop.location) block += ` — ${shop.location}`;
        block += '\n\n';

        if (shop.owner_name) {
            block += `**Proprietor:** ${shop.owner_name}\n\n`;
        }

        if (shop.description) {
            block += shop.description + '\n\n';
        }

        // Include inventory summary
        if (shop.growler_menu && shop.growler_menu.length > 0) {
            block += '**Growler Menu:**\n';
            shop.growler_menu.forEach(item => {
                block += `- ${item.name} (${item.price})\n`;
            });
            block += '\n';
        }

        if (shop.oddments_menu && shop.oddments_menu.length > 0) {
            block += '**Oddments:**\n';
            shop.oddments_menu.forEach(item => {
                block += `- ${item.name} (${item.price})\n`;
            });
            block += '\n';
        }

        return block;
    }

    // Generate character block
    generateCharacterBlock(char) {
        let block = `**${char.name}**`;
        if (char.type) block += ` — ${char.type}`;
        block += '\n\n';

        if (char.description) {
            block += char.description + '\n\n';
        }

        if (char.appearance) {
            block += `**Appearance:** ${char.appearance}\n\n`;
        }

        if (char.personality) {
            block += `**Personality:** ${char.personality}\n\n`;
        }

        if (char.motivations) {
            block += `**Motivations:** ${char.motivations}\n\n`;
        }

        return block;
    }

    // Generate quest block
    generateQuestBlock(quest) {
        let block = `**${quest.name}**\n`;
        if (quest.quest_type) block += `*${quest.quest_type}*`;
        if (quest.status) block += ` — Status: ${quest.status}`;
        block += '\n\n';

        if (quest.summary) {
            block += quest.summary + '\n\n';
        }

        if (quest.objectives && quest.objectives.length > 0) {
            block += '**Objectives:**\n';
            quest.objectives.forEach(obj => {
                block += `- ${obj}\n`;
            });
            block += '\n';
        }

        if (quest.rewards) {
            block += `**Rewards:** ${quest.rewards}\n\n`;
        }

        if (quest.failure_consequences) {
            block += `**⚠️ Failure:** ${quest.failure_consequences}\n`;
        }

        return block;
    }
}

export const clipboard = new ClipboardManager();
