// ============================================
// D&D VAULT - ENCOUNTER PAGE
// Combat tracker with initiative, HP, and copy blocks
// ============================================

import { router } from '../utils/router.js';
import { dataLoader } from '../utils/data-loader.js';
import { clipboard } from '../utils/clipboard.js';

// Encounter state (persisted to localStorage)
let encounter = {
    id: null,
    name: 'New Encounter',
    location: '',
    round: 1,
    currentTurn: 0,
    party: [],      // { character_id, name, current_hp, max_hp, conditions, initiative }
    monsters: [],   // { monster_id, name, instances: [{ id, current_hp, max_hp, defeated }], initiative }
    initiative: [], // sorted list of { type: 'pc'|'monster', ref_id, instance_id?, name, init }
    log: []
};

const CONDITIONS = [
    'Blessed', 'Frightened', 'Poisoned', 'Stunned', 'Prone',
    'Invisible', 'Concentrating', 'Inspired', 'Deafened', 'Charmed'
];

export function renderEncounterView() {
    const content = document.getElementById('content');
    const header = document.getElementById('header');

    // Load saved encounter or create new
    loadEncounter();

    // Render header
    header.innerHTML = `
        <div style="display: flex; align-items: center; gap: var(--space-4);">
            <h1 class="header-title">⚔️ Encounter</h1>
            <input type="text" id="encounter-name" class="encounter-name-input" 
                   value="${encounter.name}" placeholder="Encounter name...">
        </div>
        <div style="display: flex; gap: var(--space-2);">
            <button class="btn btn-ghost" id="new-encounter-btn">🆕 New</button>
            <button class="btn btn-primary" id="save-encounter-btn">💾 Save</button>
        </div>
    `;

    // Render content
    content.innerHTML = `
        <div class="encounter-layout">
            <!-- LEFT COLUMN: Combatants -->
            <div class="encounter-left">
                <!-- Party Panel -->
                <div class="card encounter-panel">
                    <div class="card-header">
                        <h2 class="card-title">👥 Party</h2>
                    </div>
                    <div class="card-body" id="party-panel">
                        ${renderPartyPanel()}
                    </div>
                </div>

                <!-- Monsters Panel -->
                <div class="card encounter-panel">
                    <div class="card-header">
                        <h2 class="card-title">💀 Monsters</h2>
                        <button class="btn btn-sm btn-ghost" id="add-monster-btn">+ Add</button>
                    </div>
                    <div class="card-body" id="monsters-panel">
                        ${renderMonstersPanel()}
                    </div>
                </div>
            </div>

            <!-- RIGHT COLUMN: Controls -->
            <div class="encounter-right">
                <!-- Initiative Tracker -->
                <div class="card encounter-panel">
                    <div class="card-header">
                        <h2 class="card-title">⚡ Initiative</h2>
                        <span class="round-badge">Round ${encounter.round}</span>
                    </div>
                    <div class="card-body" id="initiative-panel">
                        ${renderInitiativePanel()}
                    </div>
                    <div class="card-footer" style="display: flex; gap: var(--space-2);">
                        <button class="btn btn-sm btn-primary" id="next-turn-btn">Next Turn →</button>
                        <button class="btn btn-sm btn-ghost" id="new-round-btn">New Round</button>
                        <button class="btn btn-sm btn-ghost" id="roll-initiative-btn">🎲 Roll</button>
                    </div>
                </div>

                <!-- Quick Copy Panel -->
                <div class="card encounter-panel copy-panel-sticky">
                    <div class="card-header">
                        <h2 class="card-title">📋 Quick Copy</h2>
                    </div>
                    <div class="card-body copy-buttons-grid">
                        <button class="copy-btn" id="copy-full-encounter">
                            Full Encounter
                            <span class="copy-shortcut">Ctrl+E</span>
                        </button>
                        <button class="copy-btn" id="copy-current-turn">
                            Current Turn
                            <span class="copy-shortcut">Ctrl+T</span>
                        </button>
                        <button class="copy-btn" id="copy-monster-snippet">
                            Monster Block
                        </button>
                        <button class="copy-btn" id="copy-action-template">
                            Action Template
                        </button>
                    </div>
                </div>

                <!-- Encounter Log -->
                <div class="card encounter-panel">
                    <div class="card-header">
                        <h2 class="card-title">📜 Combat Log</h2>
                        <button class="btn btn-sm btn-ghost" id="copy-log-btn">Copy Log</button>
                    </div>
                    <div class="card-body encounter-log" id="encounter-log">
                        ${renderLog()}
                    </div>
                </div>
            </div>
        </div>

        <!-- Add Monster Modal -->
        <div id="monster-modal" class="modal hidden">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Add Monsters</h3>
                    <button class="btn btn-ghost modal-close">✕</button>
                </div>
                <div class="modal-body">
                    <input type="text" id="monster-search" class="search-input" placeholder="Search monsters...">
                    <div id="monster-search-results" style="max-height: 300px; overflow-y: auto; margin-top: var(--space-3);"></div>
                </div>
            </div>
        </div>
    `;

    attachEventHandlers();
}

// ============================================
// PANEL RENDERERS
// ============================================

function renderPartyPanel() {
    if (encounter.party.length === 0) {
        // Auto-load PCs
        const pcs = dataLoader.data.characters.filter(c => c.type === 'PC');
        encounter.party = pcs.map(pc => ({
            character_id: pc.id,
            name: pc.name,
            current_hp: pc.current_hp || pc.max_hp || 10,
            max_hp: pc.max_hp || 10,
            conditions: [],
            initiative: 0,
            race_class: pc.race_class,
            key_items: pc.related_items?.slice(0, 2) || []
        }));
    }

    return encounter.party.map(pc => `
        <div class="combatant-card ${pc.current_hp <= 0 ? 'defeated' : ''}" data-id="${pc.character_id}">
            <div class="combatant-header">
                <span class="combatant-name">👤 ${pc.name}</span>
                <span class="combatant-class">${pc.race_class || ''}</span>
            </div>
            <div class="combatant-hp">
                <button class="hp-btn hp-minus" data-type="pc" data-id="${pc.character_id}">−</button>
                <input type="number" class="hp-input" value="${pc.current_hp}" 
                       data-type="pc" data-id="${pc.character_id}" min="0" max="${pc.max_hp}">
                <span class="hp-separator">/</span>
                <span class="hp-max">${pc.max_hp}</span>
                <button class="hp-btn hp-plus" data-type="pc" data-id="${pc.character_id}">+</button>
            </div>
            <div class="combatant-conditions">
                ${pc.conditions.map(c => `<span class="chip chip-condition" data-condition="${c}" data-id="${pc.character_id}">${c} ✕</span>`).join('')}
                <button class="btn btn-xs btn-ghost add-condition-btn" data-type="pc" data-id="${pc.character_id}">+ Condition</button>
            </div>
            <div class="combatant-actions">
                <button class="btn btn-xs btn-ghost copy-pc-btn" data-id="${pc.character_id}">📋 Copy</button>
            </div>
        </div>
    `).join('');
}

function renderMonstersPanel() {
    if (encounter.monsters.length === 0) {
        return `<div class="empty-state-small">No monsters added. Click "+ Add" to add monsters.</div>`;
    }

    return encounter.monsters.map(mon => `
        <div class="combatant-card monster-card" data-monster-id="${mon.monster_id}">
            <div class="combatant-header">
                <span class="combatant-name">💀 ${mon.name}</span>
                <span class="monster-count">×${mon.instances.length}</span>
                <button class="btn btn-xs btn-ghost toggle-stats-btn" data-monster-id="${mon.monster_id}">▼ Stats</button>
            </div>
            <div class="monster-instances">
                ${mon.instances.map((inst, i) => `
                    <div class="monster-instance ${inst.defeated ? 'defeated' : ''}" data-instance-id="${inst.id}">
                        <span class="instance-label">#${i + 1}</span>
                        <div class="combatant-hp">
                            <button class="hp-btn hp-minus" data-type="monster" data-monster-id="${mon.monster_id}" data-instance-id="${inst.id}">−</button>
                            <input type="number" class="hp-input" value="${inst.current_hp}" 
                                   data-type="monster" data-monster-id="${mon.monster_id}" data-instance-id="${inst.id}" min="0">
                            <span class="hp-separator">/</span>
                            <span class="hp-max">${inst.max_hp}</span>
                            <button class="hp-btn hp-plus" data-type="monster" data-monster-id="${mon.monster_id}" data-instance-id="${inst.id}">+</button>
                        </div>
                        <button class="btn btn-xs btn-ghost defeat-btn ${inst.defeated ? 'active' : ''}" 
                                data-monster-id="${mon.monster_id}" data-instance-id="${inst.id}">
                            ${inst.defeated ? '↩️' : '💀'}
                        </button>
                    </div>
                `).join('')}
            </div>
            <div class="monster-stats hidden" id="stats-${mon.monster_id}">
                ${renderMonsterStats(mon.monster_id)}
            </div>
        </div>
    `).join('');
}

function renderMonsterStats(monsterId) {
    const monster = dataLoader.getMonsterById(monsterId);
    if (!monster) return '';

    return `
        <div class="stat-block-mini">
            <div><strong>AC</strong> ${monster.ac} | <strong>HD</strong> ${monster.hd} | <strong>THAC0</strong> ${monster.thac0}</div>
            <div><strong>Att:</strong> ${monster.attacks}</div>
            <div><strong>MV:</strong> ${monster.movement} | <strong>ML:</strong> ${monster.morale}</div>
            ${monster.special_abilities ? `<div class="special-abilities"><strong>Special:</strong> ${monster.special_abilities.slice(0, 100)}...</div>` : ''}
            <button class="btn btn-xs btn-ghost copy-monster-full-btn" data-monster-id="${monsterId}">📋 Copy Full</button>
        </div>
    `;
}

function renderInitiativePanel() {
    if (encounter.initiative.length === 0) {
        return `<div class="empty-state-small">Roll initiative to start combat!</div>`;
    }

    return `
        <div class="initiative-list">
            ${encounter.initiative.map((entry, i) => `
                <div class="initiative-entry ${i === encounter.currentTurn ? 'current-turn' : ''} ${entry.defeated ? 'defeated' : ''}"
                     data-index="${i}">
                    <span class="init-order">${entry.init}</span>
                    <span class="init-icon">${entry.type === 'pc' ? '👤' : '💀'}</span>
                    <span class="init-name">${entry.name}${entry.instance_id ? ` #${entry.instance_id}` : ''}</span>
                    ${i === encounter.currentTurn ? '<span class="current-marker">→</span>' : ''}
                </div>
            `).join('')}
        </div>
    `;
}

function renderLog() {
    if (encounter.log.length === 0) {
        return `<div class="empty-state-small">Combat log will appear here...</div>`;
    }

    return encounter.log.map(entry => `
        <div class="log-entry">
            <span class="log-time">${entry.round ? `R${entry.round}` : ''}</span>
            <span class="log-text">${entry.text}</span>
        </div>
    `).join('');
}

// ============================================
// EVENT HANDLERS
// ============================================

function attachEventHandlers() {
    // Encounter name
    document.getElementById('encounter-name')?.addEventListener('change', (e) => {
        encounter.name = e.target.value;
        saveEncounter();
    });

    // New encounter
    document.getElementById('new-encounter-btn')?.addEventListener('click', () => {
        if (confirm('Start a new encounter? Current encounter will be saved.')) {
            saveEncounter();
            encounter = {
                id: Date.now().toString(),
                name: 'New Encounter',
                location: '',
                round: 1,
                currentTurn: 0,
                party: [],
                monsters: [],
                initiative: [],
                log: []
            };
            renderEncounterView();
        }
    });

    // Save encounter
    document.getElementById('save-encounter-btn')?.addEventListener('click', () => {
        saveEncounter();
        clipboard.showToast('Encounter saved!');
    });

    // Add monster button
    document.getElementById('add-monster-btn')?.addEventListener('click', () => {
        document.getElementById('monster-modal').classList.remove('hidden');
        document.getElementById('monster-search').focus();
    });

    // Monster modal close
    document.querySelector('.modal-close')?.addEventListener('click', () => {
        document.getElementById('monster-modal').classList.add('hidden');
    });

    // Monster search
    document.getElementById('monster-search')?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const results = dataLoader.data.monsters.filter(m =>
            m.name.toLowerCase().includes(query)
        ).slice(0, 10);

        document.getElementById('monster-search-results').innerHTML = results.map(m => `
            <div class="monster-search-result" data-id="${m.id}">
                <span>${m.name}</span>
                <span class="monster-hd">HD ${m.hd}</span>
                <input type="number" class="monster-count-input" value="1" min="1" max="10" style="width: 50px;">
                <button class="btn btn-sm btn-primary add-this-monster" data-id="${m.id}">Add</button>
            </div>
        `).join('');

        // Attach add handlers
        document.querySelectorAll('.add-this-monster').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const count = parseInt(btn.previousElementSibling.value) || 1;
                addMonster(id, count);
            });
        });
    });

    // HP buttons
    document.querySelectorAll('.hp-minus').forEach(btn => {
        btn.addEventListener('click', () => adjustHP(btn.dataset, -1));
    });
    document.querySelectorAll('.hp-plus').forEach(btn => {
        btn.addEventListener('click', () => adjustHP(btn.dataset, 1));
    });

    // HP inputs
    document.querySelectorAll('.hp-input').forEach(input => {
        input.addEventListener('change', (e) => {
            setHP(e.target.dataset, parseInt(e.target.value) || 0);
        });
    });

    // Defeat toggle
    document.querySelectorAll('.defeat-btn').forEach(btn => {
        btn.addEventListener('click', () => toggleDefeat(btn.dataset.monsterId, btn.dataset.instanceId));
    });

    // Toggle stats
    document.querySelectorAll('.toggle-stats-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const statsDiv = document.getElementById(`stats-${btn.dataset.monsterId}`);
            statsDiv.classList.toggle('hidden');
            btn.textContent = statsDiv.classList.contains('hidden') ? '▼ Stats' : '▲ Stats';
        });
    });

    // Add condition
    document.querySelectorAll('.add-condition-btn').forEach(btn => {
        btn.addEventListener('click', () => showConditionPicker(btn.dataset));
    });

    // Remove condition
    document.querySelectorAll('.chip-condition').forEach(chip => {
        chip.addEventListener('click', () => {
            removeCondition(chip.dataset.id, chip.dataset.condition);
        });
    });

    // Initiative controls
    document.getElementById('next-turn-btn')?.addEventListener('click', nextTurn);
    document.getElementById('new-round-btn')?.addEventListener('click', newRound);
    document.getElementById('roll-initiative-btn')?.addEventListener('click', showInitiativeRoller);

    // Copy buttons
    document.getElementById('copy-full-encounter')?.addEventListener('click', () => copyFullEncounter());
    document.getElementById('copy-current-turn')?.addEventListener('click', () => copyCurrentTurn());
    document.getElementById('copy-monster-snippet')?.addEventListener('click', () => copyMonsterSnippet());
    document.getElementById('copy-action-template')?.addEventListener('click', () => copyActionTemplate());
    document.getElementById('copy-log-btn')?.addEventListener('click', () => copyLog());

    // Copy PC buttons
    document.querySelectorAll('.copy-pc-btn').forEach(btn => {
        btn.addEventListener('click', () => copyPCBlock(btn.dataset.id));
    });

    // Copy monster buttons
    document.querySelectorAll('.copy-monster-full-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const monster = dataLoader.getMonsterById(btn.dataset.monsterId);
            if (monster) {
                clipboard.copy(clipboard.generateMonsterBlock(monster), 'Monster copied!');
            }
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', handleEncounterKeyboard);
}

// ============================================
// COMBAT ACTIONS
// ============================================

function addMonster(monsterId, count) {
    const monster = dataLoader.getMonsterById(monsterId);
    if (!monster) return;

    // Parse HP from HD (e.g., "2" or "2*" → 2d8 → avg 9)
    const hdMatch = monster.hd?.match(/(\d+)/);
    const hd = hdMatch ? parseInt(hdMatch[1]) : 1;
    const maxHp = monster.hp || (hd * 4 + 4); // Default: HD * 4.5

    const instances = [];
    for (let i = 0; i < count; i++) {
        instances.push({
            id: i + 1,
            current_hp: maxHp,
            max_hp: maxHp,
            defeated: false
        });
    }

    // Check if monster type already exists
    const existing = encounter.monsters.find(m => m.monster_id === monsterId);
    if (existing) {
        const startId = existing.instances.length + 1;
        instances.forEach((inst, i) => {
            inst.id = startId + i;
            existing.instances.push(inst);
        });
    } else {
        encounter.monsters.push({
            monster_id: monsterId,
            name: monster.name,
            instances,
            initiative: 0
        });
    }

    addToLog(`Added ${count}× ${monster.name}`);
    document.getElementById('monster-modal').classList.add('hidden');
    refreshPanels();
    saveEncounter();
}

function adjustHP(dataset, delta) {
    if (dataset.type === 'pc') {
        const pc = encounter.party.find(p => p.character_id === dataset.id);
        if (pc) {
            pc.current_hp = Math.max(0, Math.min(pc.max_hp, pc.current_hp + delta));
        }
    } else if (dataset.type === 'monster') {
        const mon = encounter.monsters.find(m => m.monster_id === dataset.monsterId);
        const inst = mon?.instances.find(i => i.id === parseInt(dataset.instanceId));
        if (inst) {
            inst.current_hp = Math.max(0, Math.min(inst.max_hp, inst.current_hp + delta));
            if (inst.current_hp <= 0) inst.defeated = true;
        }
    }
    refreshPanels();
    saveEncounter();
}

function setHP(dataset, value) {
    if (dataset.type === 'pc') {
        const pc = encounter.party.find(p => p.character_id === dataset.id);
        if (pc) pc.current_hp = Math.max(0, Math.min(pc.max_hp, value));
    } else if (dataset.type === 'monster') {
        const mon = encounter.monsters.find(m => m.monster_id === dataset.monsterId);
        const inst = mon?.instances.find(i => i.id === parseInt(dataset.instanceId));
        if (inst) inst.current_hp = Math.max(0, value);
    }
    refreshPanels();
    saveEncounter();
}

function toggleDefeat(monsterId, instanceId) {
    const mon = encounter.monsters.find(m => m.monster_id === monsterId);
    const inst = mon?.instances.find(i => i.id === parseInt(instanceId));
    if (inst) {
        inst.defeated = !inst.defeated;
        // Update initiative
        const initEntry = encounter.initiative.find(e =>
            e.type === 'monster' && e.ref_id === monsterId && e.instance_id === parseInt(instanceId)
        );
        if (initEntry) initEntry.defeated = inst.defeated;

        addToLog(`${mon.name} #${instanceId} ${inst.defeated ? 'defeated!' : 'revived'}`);
    }
    refreshPanels();
    saveEncounter();
}

function showConditionPicker(dataset) {
    const picker = document.createElement('div');
    picker.className = 'condition-picker';
    picker.innerHTML = `
        <div class="condition-picker-content">
            ${CONDITIONS.map(c => `<button class="condition-option" data-condition="${c}">${c}</button>`).join('')}
            <input type="text" class="custom-condition-input" placeholder="Custom...">
        </div>
    `;
    document.body.appendChild(picker);

    picker.querySelectorAll('.condition-option').forEach(btn => {
        btn.addEventListener('click', () => {
            addCondition(dataset.id, btn.dataset.condition);
            picker.remove();
        });
    });

    picker.querySelector('.custom-condition-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.value) {
            addCondition(dataset.id, e.target.value);
            picker.remove();
        }
    });

    picker.addEventListener('click', (e) => {
        if (e.target === picker) picker.remove();
    });
}

function addCondition(characterId, condition) {
    const pc = encounter.party.find(p => p.character_id === characterId);
    if (pc && !pc.conditions.includes(condition)) {
        pc.conditions.push(condition);
        addToLog(`${pc.name} gains ${condition}`);
        refreshPanels();
        saveEncounter();
    }
}

function removeCondition(characterId, condition) {
    const pc = encounter.party.find(p => p.character_id === characterId);
    if (pc) {
        pc.conditions = pc.conditions.filter(c => c !== condition);
        addToLog(`${pc.name} loses ${condition}`);
        refreshPanels();
        saveEncounter();
    }
}

// ============================================
// INITIATIVE
// ============================================

function showInitiativeRoller() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'initiative-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>🎲 Roll Initiative</h3>
                <button class="btn btn-ghost modal-close">✕</button>
            </div>
            <div class="modal-body">
                <h4>Party</h4>
                ${encounter.party.map(pc => `
                    <div class="init-roll-row">
                        <label>${pc.name}</label>
                        <input type="number" class="init-input" data-type="pc" data-id="${pc.character_id}" placeholder="Roll">
                    </div>
                `).join('')}
                <h4 style="margin-top: var(--space-4);">Monsters</h4>
                ${encounter.monsters.map(mon => `
                    <div class="init-roll-row">
                        <label>${mon.name}</label>
                        <input type="number" class="init-input" data-type="monster" data-id="${mon.monster_id}" placeholder="Roll">
                    </div>
                `).join('')}
                <button class="btn btn-primary" id="confirm-initiative" style="margin-top: var(--space-4); width: 100%;">
                    Start Combat!
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    modal.querySelector('#confirm-initiative').addEventListener('click', () => {
        buildInitiativeOrder();
        modal.remove();
    });
}

function buildInitiativeOrder() {
    encounter.initiative = [];

    // Collect PC initiatives
    document.querySelectorAll('#initiative-modal .init-input[data-type="pc"]').forEach(input => {
        const pc = encounter.party.find(p => p.character_id === input.dataset.id);
        if (pc) {
            const init = parseInt(input.value) || 0;
            pc.initiative = init;
            encounter.initiative.push({
                type: 'pc',
                ref_id: pc.character_id,
                name: pc.name,
                init,
                defeated: false
            });
        }
    });

    // Collect monster initiatives
    document.querySelectorAll('#initiative-modal .init-input[data-type="monster"]').forEach(input => {
        const mon = encounter.monsters.find(m => m.monster_id === input.dataset.id);
        if (mon) {
            const init = parseInt(input.value) || 0;
            mon.initiative = init;
            // Add each instance
            mon.instances.forEach(inst => {
                encounter.initiative.push({
                    type: 'monster',
                    ref_id: mon.monster_id,
                    instance_id: inst.id,
                    name: mon.name,
                    init,
                    defeated: inst.defeated
                });
            });
        }
    });

    // Sort by initiative (descending)
    encounter.initiative.sort((a, b) => b.init - a.init);
    encounter.currentTurn = 0;
    encounter.round = 1;

    addToLog(`Combat started! Round 1`);
    refreshPanels();
    saveEncounter();
}

function nextTurn() {
    if (encounter.initiative.length === 0) return;

    // Find next non-defeated combatant
    let next = encounter.currentTurn;
    let attempts = 0;
    do {
        next = (next + 1) % encounter.initiative.length;
        attempts++;
    } while (encounter.initiative[next].defeated && attempts < encounter.initiative.length);

    // Check if we wrapped around (new round)
    if (next <= encounter.currentTurn) {
        newRound();
    } else {
        encounter.currentTurn = next;
        const current = encounter.initiative[next];
        addToLog(`${current.name}'s turn`);
    }

    refreshPanels();
    saveEncounter();
}

function newRound() {
    encounter.round++;
    encounter.currentTurn = 0;

    // Find first non-defeated
    while (encounter.initiative[encounter.currentTurn]?.defeated &&
        encounter.currentTurn < encounter.initiative.length) {
        encounter.currentTurn++;
    }

    addToLog(`--- Round ${encounter.round} ---`);
    refreshPanels();
    saveEncounter();
}

// ============================================
// COPY FUNCTIONS
// ============================================

function copyFullEncounter() {
    let block = `**Encounter: ${encounter.name}**\n\n`;

    block += `**Party:**\n`;
    encounter.party.forEach(pc => {
        block += `- ${pc.name}: ${pc.current_hp}/${pc.max_hp} HP`;
        if (pc.conditions.length) block += `, conditions: ${pc.conditions.join(', ')}`;
        block += '\n';
    });

    block += `\n**Monsters:**\n`;
    encounter.monsters.forEach(mon => {
        const monster = dataLoader.getMonsterById(mon.monster_id);
        const alive = mon.instances.filter(i => !i.defeated).length;
        block += `- ${mon.name} (×${alive}): AC ${monster?.ac || '?'}, HD ${monster?.hd || '?'}`;
        if (monster?.special_abilities) block += `, Special: ${monster.special_abilities.slice(0, 50)}...`;
        block += '\n';
    });

    if (encounter.initiative.length) {
        block += `\n**Initiative Order:**\n`;
        encounter.initiative.forEach((entry, i) => {
            const marker = i === encounter.currentTurn ? '→ ' : '  ';
            const status = entry.defeated ? ' (defeated)' : '';
            block += `${marker}${entry.init}. ${entry.name}${entry.instance_id ? ` #${entry.instance_id}` : ''}${status}\n`;
        });
    }

    clipboard.copy(block, 'Full encounter copied!');
}

function copyCurrentTurn() {
    if (encounter.initiative.length === 0) {
        clipboard.showToast('No initiative set!', 'error');
        return;
    }

    const current = encounter.initiative[encounter.currentTurn];
    let block = `**Current Turn: ${current.name}${current.instance_id ? ` #${current.instance_id}` : ''}**\n\n`;

    if (current.type === 'pc') {
        const pc = encounter.party.find(p => p.character_id === current.ref_id);
        if (pc) {
            block += `HP: ${pc.current_hp}/${pc.max_hp}\n`;
            if (pc.conditions.length) block += `Conditions: ${pc.conditions.join(', ')}\n`;
        }
    } else {
        const mon = encounter.monsters.find(m => m.monster_id === current.ref_id);
        const inst = mon?.instances.find(i => i.id === current.instance_id);
        if (inst) {
            block += `HP: ${inst.current_hp}/${inst.max_hp}\n`;
        }
    }

    clipboard.copy(block, 'Current turn copied!');
}

function copyMonsterSnippet() {
    if (encounter.monsters.length === 0) {
        clipboard.showToast('No monsters in encounter!', 'error');
        return;
    }

    // Copy first monster or selected monster
    const mon = encounter.monsters[0];
    const monster = dataLoader.getMonsterById(mon.monster_id);
    if (monster) {
        clipboard.copy(clipboard.generateMonsterBlock(monster), 'Monster copied!');
    }
}

function copyActionTemplate() {
    const current = encounter.initiative[encounter.currentTurn];
    if (!current) {
        clipboard.showToast('No current turn!', 'error');
        return;
    }

    let block = `**${current.name} takes an action.**\n\n`;
    block += `Action:\nRoll:\nDamage:\nEffect:\n`;

    clipboard.copy(block, 'Action template copied!');
}

function copyLog() {
    let block = `**Combat Log: ${encounter.name}**\n\n`;
    encounter.log.forEach(entry => {
        block += `${entry.round ? `[R${entry.round}] ` : ''}${entry.text}\n`;
    });
    clipboard.copy(block, 'Combat log copied!');
}

function copyPCBlock(characterId) {
    const pc = encounter.party.find(p => p.character_id === characterId);
    if (!pc) return;

    let block = `**${pc.name}** — ${pc.race_class}\n`;
    block += `HP: ${pc.current_hp}/${pc.max_hp}\n`;
    if (pc.conditions.length) block += `Conditions: ${pc.conditions.join(', ')}\n`;

    clipboard.copy(block, `${pc.name} copied!`);
}

// ============================================
// UTILITIES
// ============================================

function addToLog(text) {
    encounter.log.push({
        round: encounter.round,
        text,
        timestamp: Date.now()
    });
}

function refreshPanels() {
    document.getElementById('party-panel').innerHTML = renderPartyPanel();
    document.getElementById('monsters-panel').innerHTML = renderMonstersPanel();
    document.getElementById('initiative-panel').innerHTML = renderInitiativePanel();
    document.getElementById('encounter-log').innerHTML = renderLog();
    document.querySelector('.round-badge').textContent = `Round ${encounter.round}`;
    attachEventHandlers();
}

function loadEncounter() {
    const saved = localStorage.getItem('dnd_vault_encounter');
    if (saved) {
        try {
            encounter = JSON.parse(saved);
        } catch (e) {
            console.error('Failed to load encounter:', e);
        }
    }
}

function saveEncounter() {
    localStorage.setItem('dnd_vault_encounter', JSON.stringify(encounter));
}

function handleEncounterKeyboard(e) {
    if (e.target.tagName === 'INPUT') return;

    if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
            case 'e':
                e.preventDefault();
                copyFullEncounter();
                break;
            case 't':
                e.preventDefault();
                copyCurrentTurn();
                break;
        }
    }

    if (e.key === ' ' && !e.target.matches('input, textarea')) {
        e.preventDefault();
        nextTurn();
    }
}
