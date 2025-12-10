// ============================================
// D&D VAULT - QUEST GRAPH
// Interactive visual flowchart of campaign relationships
// ============================================

import { router } from '../utils/router.js';
import { dataLoader } from '../utils/data-loader.js';
import { clipboard } from '../utils/clipboard.js';

// Graph state
let graphState = {
    nodes: [],
    edges: [],
    selectedNode: null,
    zoom: 1,
    pan: { x: 0, y: 0 },
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    dragNode: null,
    viewMode: 'default' // default, timeline, dependencies, factions
};

// Node types and colors
const NODE_TYPES = {
    quest: {
        size: { w: 180, h: 100 },
        colors: {
            main: '#F59E0B',
            side: '#3B82F6',
            faction: '#10B981',
            urgent: '#EF4444'
        }
    },
    npc: {
        size: { w: 120, h: 90 },
        colors: {
            ally: '#10B981',
            neutral: '#6B7280',
            antagonist: '#EF4444',
            unknown: '#8B5CF6'
        }
    },
    item: {
        size: { w: 100, h: 80 },
        colors: {
            common: '#6B7280',
            uncommon: '#10B981',
            rare: '#3B82F6',
            legendary: '#F59E0B'
        }
    },
    faction: {
        size: { w: 140, h: 80 },
        colors: {
            default: '#8B5CF6'
        }
    },
    branch: {
        size: { w: 120, h: 60 },
        colors: {
            pending: '#F59E0B',
            resolved: '#6B7280'
        }
    }
};

const CONNECTION_TYPES = [
    { id: 'quest_giver', label: 'Quest Giver', color: '#10B981' },
    { id: 'required_for', label: 'Required For', color: '#F59E0B' },
    { id: 'unlocks', label: 'Unlocks', color: '#3B82F6' },
    { id: 'blocks', label: 'Blocks', color: '#EF4444' },
    { id: 'faction_tie', label: 'Faction Tie', color: '#8B5CF6' },
    { id: 'emotional', label: 'Emotional', color: '#EC4899' },
    { id: 'item_origin', label: 'Item Origin', color: '#6B7280' },
    { id: 'location', label: 'Location', color: '#14B8A6' }
];

let canvas, ctx;
let animationFrame;

export function renderQuestGraph() {
    const content = document.getElementById('content');
    const header = document.getElementById('header');

    // Render header
    header.innerHTML = `
        <div style="display: flex; align-items: center; gap: var(--space-4);">
            <h1 class="header-title">🌳 Quest Graph</h1>
            <div class="view-mode-tabs">
                <button class="view-tab active" data-mode="default">Default</button>
                <button class="view-tab" data-mode="dependencies">Dependencies</button>
                <button class="view-tab" data-mode="factions">Factions</button>
            </div>
        </div>
        <div style="display: flex; gap: var(--space-2);">
            <button class="btn btn-ghost" id="auto-layout-btn">🔄 Auto Layout</button>
            <button class="btn btn-ghost" id="reset-view-btn">🎯 Reset View</button>
            <button class="btn btn-primary" id="copy-graph-btn">📋 Copy Summary</button>
        </div>
    `;

    // Render content
    content.innerHTML = `
        <div class="graph-container">
            <canvas id="graph-canvas"></canvas>
            
            <!-- Floating Add Button -->
            <div class="graph-add-menu" id="add-menu">
                <button class="add-menu-btn" id="add-menu-toggle">+</button>
                <div class="add-menu-items hidden">
                    <button class="add-item-btn" data-type="quest">📜 Quest</button>
                    <button class="add-item-btn" data-type="npc">👤 NPC</button>
                    <button class="add-item-btn" data-type="item">🎒 Item</button>
                    <button class="add-item-btn" data-type="faction">⚔️ Faction</button>
                    <button class="add-item-btn" data-type="branch">◇ Branch</button>
                </div>
            </div>

            <!-- Minimap -->
            <div class="graph-minimap" id="minimap">
                <canvas id="minimap-canvas" width="150" height="100"></canvas>
            </div>

            <!-- Detail Panel -->
            <div class="graph-panel hidden" id="detail-panel">
                <div class="panel-header">
                    <h3 id="panel-title">Node Details</h3>
                    <button class="btn btn-ghost panel-close">✕</button>
                </div>
                <div class="panel-body" id="panel-body"></div>
            </div>

            <!-- Zoom Controls -->
            <div class="graph-zoom">
                <button class="zoom-btn" id="zoom-in">+</button>
                <span class="zoom-level" id="zoom-level">100%</span>
                <button class="zoom-btn" id="zoom-out">−</button>
            </div>
        </div>

        <!-- Connection Modal -->
        <div id="connection-modal" class="modal hidden">
            <div class="modal-content" style="max-width: 300px;">
                <div class="modal-header">
                    <h3>Create Connection</h3>
                    <button class="btn btn-ghost modal-close">✕</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Connection Type</label>
                        <div class="connection-type-list" id="connection-type-list"></div>
                    </div>
                    <div class="form-group">
                        <label>Influence</label>
                        <div class="influence-buttons">
                            <button class="influence-btn" data-value="-1">-1</button>
                            <button class="influence-btn active" data-value="0">0</button>
                            <button class="influence-btn" data-value="+1">+1</button>
                            <button class="influence-btn" data-value="+2">+2</button>
                        </div>
                    </div>
                    <button class="btn btn-primary" id="create-connection-btn" style="width: 100%;">Create</button>
                </div>
            </div>
        </div>

        <!-- Add Node Modal -->
        <div id="add-node-modal" class="modal hidden">
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h3 id="add-node-title">Add Node</h3>
                    <button class="btn btn-ghost modal-close">✕</button>
                </div>
                <div class="modal-body" id="add-node-body"></div>
            </div>
        </div>
    `;

    // Initialize canvas
    initCanvas();
    loadGraphState();
    buildNodesFromData();

    // Attach handlers
    attachGraphHandlers();

    // Start render loop
    startRenderLoop();
}

// ============================================
// CANVAS INITIALIZATION
// ============================================

function initCanvas() {
    canvas = document.getElementById('graph-canvas');
    ctx = canvas.getContext('2d');

    // Set canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
    const container = document.querySelector('.graph-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

function startRenderLoop() {
    function render() {
        drawGraph();
        animationFrame = requestAnimationFrame(render);
    }
    render();
}

// ============================================
// GRAPH DATA BUILDING
// ============================================

function buildNodesFromData() {
    const savedPositions = JSON.parse(localStorage.getItem('dnd_vault_graph_positions') || '{}');

    graphState.nodes = [];
    graphState.edges = [];

    // Add quest nodes
    dataLoader.data.quests.forEach((quest, i) => {
        const pos = savedPositions[quest.id] || getDefaultPosition(i, 'quest', dataLoader.data.quests.length);
        graphState.nodes.push({
            id: quest.id,
            type: 'quest',
            data: quest,
            x: pos.x,
            y: pos.y,
            pinned: pos.pinned || false
        });
    });

    // Add NPC nodes (only major ones)
    const majorNPCs = dataLoader.data.characters.filter(c =>
        c.type === 'Major NPC' || c.type === 'Ally NPC' || c.type === 'Antagonist'
    ).slice(0, 15);

    majorNPCs.forEach((npc, i) => {
        const pos = savedPositions[npc.id] || getDefaultPosition(i, 'npc', majorNPCs.length);
        graphState.nodes.push({
            id: npc.id,
            type: 'npc',
            data: npc,
            x: pos.x,
            y: pos.y,
            pinned: pos.pinned || false
        });
    });

    // Build edges from quest connections
    dataLoader.data.quests.forEach(quest => {
        // NPC connections from quest_giver, related_npcs
        if (quest.quest_giver_id) {
            graphState.edges.push({
                from: quest.quest_giver_id,
                to: quest.id,
                type: 'quest_giver'
            });
        }
        if (quest.related_npcs) {
            quest.related_npcs.forEach(npcId => {
                graphState.edges.push({
                    from: quest.id,
                    to: npcId,
                    type: 'emotional'
                });
            });
        }
    });

    // Load custom edges from localStorage
    const savedEdges = JSON.parse(localStorage.getItem('dnd_vault_graph_edges') || '[]');
    graphState.edges.push(...savedEdges);
}

function getDefaultPosition(index, type, total) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Radial layout
    const rings = {
        quest: 200,
        npc: 350,
        item: 450,
        faction: 300
    };

    const radius = rings[type] || 300;
    const angle = (2 * Math.PI * index / total) - Math.PI / 2;

    return {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
    };
}

// ============================================
// DRAWING
// ============================================

function drawGraph() {
    // Clear canvas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply transforms
    ctx.save();
    ctx.translate(graphState.pan.x, graphState.pan.y);
    ctx.scale(graphState.zoom, graphState.zoom);

    // Draw grid
    drawGrid();

    // Draw edges first
    graphState.edges.forEach(edge => drawEdge(edge));

    // Draw nodes
    graphState.nodes.forEach(node => drawNode(node));

    ctx.restore();

    // Draw minimap
    drawMinimap();
}

function drawGrid() {
    const gridSize = 50;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;

    const startX = -graphState.pan.x / graphState.zoom;
    const startY = -graphState.pan.y / graphState.zoom;
    const endX = startX + canvas.width / graphState.zoom;
    const endY = startY + canvas.height / graphState.zoom;

    for (let x = Math.floor(startX / gridSize) * gridSize; x < endX; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
        ctx.stroke();
    }

    for (let y = Math.floor(startY / gridSize) * gridSize; y < endY; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();
    }
}

function drawNode(node) {
    const config = NODE_TYPES[node.type];
    const { w, h } = config.size;
    const x = node.x - w / 2;
    const y = node.y - h / 2;

    // Get color based on node subtype
    let color = getNodeColor(node);

    // Selection glow
    if (graphState.selectedNode === node.id) {
        ctx.shadowColor = '#F59E0B';
        ctx.shadowBlur = 20;
    }

    // Draw node background
    ctx.fillStyle = node.type === 'branch' ? 'transparent' : '#1e293b';
    ctx.strokeStyle = color;
    ctx.lineWidth = graphState.selectedNode === node.id ? 3 : 2;

    if (node.type === 'branch') {
        // Diamond shape
        ctx.beginPath();
        ctx.moveTo(node.x, y);
        ctx.lineTo(x + w, node.y);
        ctx.lineTo(node.x, y + h);
        ctx.lineTo(x, node.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    } else {
        // Rounded rectangle
        roundRect(ctx, x, y, w, h, 8);
        ctx.fill();
        ctx.stroke();
    }

    ctx.shadowBlur = 0;

    // Draw node content
    drawNodeContent(node, x, y, w, h, color);
}

function getNodeColor(node) {
    const config = NODE_TYPES[node.type];

    switch (node.type) {
        case 'quest':
            const questType = node.data.quest_type?.toLowerCase() || 'side';
            if (questType.includes('main')) return config.colors.main;
            if (questType.includes('faction')) return config.colors.faction;
            if (questType.includes('urgent') || questType.includes('debt')) return config.colors.urgent;
            return config.colors.side;

        case 'npc':
            const role = node.data.type?.toLowerCase() || 'neutral';
            if (role.includes('ally')) return config.colors.ally;
            if (role.includes('antagonist')) return config.colors.antagonist;
            if (role.includes('mysterious')) return config.colors.unknown;
            return config.colors.neutral;

        case 'item':
            const rarity = node.data.rarity?.toLowerCase() || 'common';
            return config.colors[rarity] || config.colors.common;

        default:
            return Object.values(config.colors)[0];
    }
}

function drawNodeContent(node, x, y, w, h, color) {
    ctx.fillStyle = '#e2e8f0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Icon
    const icons = { quest: '📜', npc: '👤', item: '🎒', faction: '⚔️', branch: '◇' };
    ctx.font = '16px Arial';
    ctx.fillText(icons[node.type], node.x, y + 15);

    // Name (truncated)
    ctx.font = 'bold 12px Inter, sans-serif';
    const name = node.data.name || 'Unnamed';
    const truncated = name.length > 18 ? name.slice(0, 16) + '...' : name;
    ctx.fillText(truncated, node.x, y + 35);

    // Status/Type badge
    if (node.type === 'quest' && node.data.status) {
        ctx.font = '10px Inter, sans-serif';
        ctx.fillStyle = getStatusColor(node.data.status);
        ctx.fillText(node.data.status, node.x, y + 52);
    }

    // Progress bar for quests
    if (node.type === 'quest') {
        const progress = calculateQuestProgress(node.data);
        const barWidth = w - 20;
        const barX = x + 10;
        const barY = y + h - 15;

        // Background
        ctx.fillStyle = '#374151';
        roundRect(ctx, barX, barY, barWidth, 6, 3);
        ctx.fill();

        // Progress
        ctx.fillStyle = color;
        roundRect(ctx, barX, barY, barWidth * progress, 6, 3);
        ctx.fill();
    }

    // Disposition halo for NPCs
    if (node.type === 'npc') {
        const disposition = node.data.disposition || 0;
        const haloColor = getDispositionColor(disposition);
        ctx.strokeStyle = haloColor;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(node.x, node.y, Math.max(w, h) / 2 + 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
}

function getStatusColor(status) {
    switch (status?.toLowerCase()) {
        case 'completed': return '#10B981';
        case 'in progress': return '#F59E0B';
        case 'failed': return '#EF4444';
        default: return '#6B7280';
    }
}

function getDispositionColor(disposition) {
    if (disposition >= 2) return '#10B981'; // Loves party
    if (disposition >= 1) return '#84CC16'; // Friendly
    if (disposition >= 0) return '#EAB308'; // Cautious
    if (disposition >= -1) return '#F97316'; // Concerned
    return '#EF4444'; // Hostile
}

function calculateQuestProgress(quest) {
    if (quest.status === 'Completed') return 1;
    if (quest.objectives && quest.objectives.length > 0) {
        const completed = quest.objectives.filter(o => o.completed).length;
        return completed / quest.objectives.length;
    }
    if (quest.status === 'In Progress') return 0.5;
    return 0;
}

function drawEdge(edge) {
    const fromNode = graphState.nodes.find(n => n.id === edge.from);
    const toNode = graphState.nodes.find(n => n.id === edge.to);

    if (!fromNode || !toNode) return;

    const connectionType = CONNECTION_TYPES.find(t => t.id === edge.type);
    const color = connectionType?.color || '#6B7280';

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.7;

    // Curved bezier line
    const midX = (fromNode.x + toNode.x) / 2;
    const midY = (fromNode.y + toNode.y) / 2;
    const offset = 30;

    ctx.beginPath();
    ctx.moveTo(fromNode.x, fromNode.y);
    ctx.quadraticCurveTo(midX + offset, midY - offset, toNode.x, toNode.y);
    ctx.stroke();

    // Arrow head
    drawArrowHead(midX + offset / 2, midY - offset / 2, toNode.x, toNode.y, color);

    ctx.globalAlpha = 1;
}

function drawArrowHead(fromX, fromY, toX, toY, color) {
    const headLen = 10;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function drawMinimap() {
    const minimapCanvas = document.getElementById('minimap-canvas');
    if (!minimapCanvas) return;

    const mCtx = minimapCanvas.getContext('2d');
    const scale = 0.1;

    mCtx.fillStyle = '#1e293b';
    mCtx.fillRect(0, 0, 150, 100);

    // Draw nodes
    graphState.nodes.forEach(node => {
        mCtx.fillStyle = getNodeColor(node);
        mCtx.fillRect(
            node.x * scale + 75,
            node.y * scale + 50,
            4, 4
        );
    });

    // Draw viewport
    mCtx.strokeStyle = '#F59E0B';
    mCtx.lineWidth = 1;
    mCtx.strokeRect(
        (-graphState.pan.x / graphState.zoom) * scale + 75,
        (-graphState.pan.y / graphState.zoom) * scale + 50,
        (canvas.width / graphState.zoom) * scale,
        (canvas.height / graphState.zoom) * scale
    );
}

// ============================================
// EVENT HANDLERS
// ============================================

function attachGraphHandlers() {
    // Canvas mouse events
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel);
    canvas.addEventListener('dblclick', handleDoubleClick);

    // Zoom controls
    document.getElementById('zoom-in')?.addEventListener('click', () => {
        graphState.zoom = Math.min(graphState.zoom + 0.1, 2);
        updateZoomDisplay();
    });
    document.getElementById('zoom-out')?.addEventListener('click', () => {
        graphState.zoom = Math.max(graphState.zoom - 0.1, 0.3);
        updateZoomDisplay();
    });

    // Header buttons
    document.getElementById('auto-layout-btn')?.addEventListener('click', autoLayout);
    document.getElementById('reset-view-btn')?.addEventListener('click', resetView);
    document.getElementById('copy-graph-btn')?.addEventListener('click', copyGraphSummary);

    // View mode tabs
    document.querySelectorAll('.view-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.view-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            graphState.viewMode = tab.dataset.mode;
        });
    });

    // Add menu
    document.getElementById('add-menu-toggle')?.addEventListener('click', () => {
        document.querySelector('.add-menu-items')?.classList.toggle('hidden');
    });
    document.querySelectorAll('.add-item-btn').forEach(btn => {
        btn.addEventListener('click', () => showAddNodeModal(btn.dataset.type));
    });

    // Panel close
    document.querySelector('.panel-close')?.addEventListener('click', () => {
        document.getElementById('detail-panel').classList.add('hidden');
        graphState.selectedNode = null;
    });

    // Modal closes
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => btn.closest('.modal').classList.add('hidden'));
    });
}

function handleMouseDown(e) {
    const { x, y } = getCanvasCoords(e);
    const node = getNodeAtPosition(x, y);

    if (node) {
        graphState.dragNode = node;
        graphState.selectedNode = node.id;
        showDetailPanel(node);
    } else {
        graphState.isDragging = true;
    }

    graphState.dragStart = { x: e.clientX, y: e.clientY };
}

function handleMouseMove(e) {
    if (graphState.dragNode) {
        const dx = (e.clientX - graphState.dragStart.x) / graphState.zoom;
        const dy = (e.clientY - graphState.dragStart.y) / graphState.zoom;
        graphState.dragNode.x += dx;
        graphState.dragNode.y += dy;
        graphState.dragNode.pinned = true;
        graphState.dragStart = { x: e.clientX, y: e.clientY };
    } else if (graphState.isDragging) {
        graphState.pan.x += e.clientX - graphState.dragStart.x;
        graphState.pan.y += e.clientY - graphState.dragStart.y;
        graphState.dragStart = { x: e.clientX, y: e.clientY };
    }
}

function handleMouseUp() {
    if (graphState.dragNode) {
        saveGraphState();
    }
    graphState.isDragging = false;
    graphState.dragNode = null;
}

function handleWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    graphState.zoom = Math.max(0.3, Math.min(2, graphState.zoom + delta));
    updateZoomDisplay();
}

function handleDoubleClick(e) {
    const { x, y } = getCanvasCoords(e);
    const node = getNodeAtPosition(x, y);

    if (node) {
        // Navigate to detail page
        const typeMap = {
            quest: 'quests',
            npc: 'characters',
            item: 'items'
        };
        const route = typeMap[node.type];
        if (route) {
            router.navigate(`/${route}/detail/${node.data.id}`);
        }
    }
}

function getCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left - graphState.pan.x) / graphState.zoom,
        y: (e.clientY - rect.top - graphState.pan.y) / graphState.zoom
    };
}

function getNodeAtPosition(x, y) {
    return graphState.nodes.find(node => {
        const config = NODE_TYPES[node.type];
        const hw = config.size.w / 2;
        const hh = config.size.h / 2;
        return x >= node.x - hw && x <= node.x + hw &&
            y >= node.y - hh && y <= node.y + hh;
    });
}

function updateZoomDisplay() {
    document.getElementById('zoom-level').textContent = `${Math.round(graphState.zoom * 100)}%`;
}

// ============================================
// DETAIL PANEL
// ============================================

function showDetailPanel(node) {
    const panel = document.getElementById('detail-panel');
    const title = document.getElementById('panel-title');
    const body = document.getElementById('panel-body');

    panel.classList.remove('hidden');
    title.textContent = node.data.name;

    body.innerHTML = `
        <div class="panel-section">
            <label>Type</label>
            <div class="chip">${node.type}</div>
        </div>
        
        ${node.type === 'quest' ? `
            <div class="panel-section">
                <label>Status</label>
                <select id="node-status" class="panel-select">
                    <option value="Not Started" ${node.data.status === 'Not Started' ? 'selected' : ''}>Not Started</option>
                    <option value="In Progress" ${node.data.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                    <option value="Completed" ${node.data.status === 'Completed' ? 'selected' : ''}>Completed</option>
                    <option value="Failed" ${node.data.status === 'Failed' ? 'selected' : ''}>Failed</option>
                </select>
            </div>
        ` : ''}
        
        ${node.type === 'npc' ? `
            <div class="panel-section">
                <label>Disposition</label>
                <input type="range" id="node-disposition" min="-2" max="2" value="${node.data.disposition || 0}">
                <span id="disposition-value">${node.data.disposition || 0}</span>
            </div>
        ` : ''}
        
        <div class="panel-section">
            <label>Description</label>
            <p style="font-size: var(--text-sm); color: var(--text-secondary);">
                ${node.data.description?.slice(0, 150) || 'No description'}...
            </p>
        </div>
        
        <div class="panel-section">
            <label>Connections</label>
            <div id="node-connections">
                ${renderNodeConnections(node)}
            </div>
        </div>
        
        <div class="panel-actions">
            <button class="btn btn-sm btn-ghost" id="copy-node-btn">📋 Copy</button>
            <button class="btn btn-sm btn-ghost" id="view-detail-btn">👁️ View Full</button>
        </div>
    `;

    // Attach panel handlers
    document.getElementById('node-status')?.addEventListener('change', (e) => {
        node.data.status = e.target.value;
    });

    document.getElementById('node-disposition')?.addEventListener('input', (e) => {
        node.data.disposition = parseInt(e.target.value);
        document.getElementById('disposition-value').textContent = e.target.value;
    });

    document.getElementById('copy-node-btn')?.addEventListener('click', () => {
        copyNodeSummary(node);
    });

    document.getElementById('view-detail-btn')?.addEventListener('click', () => {
        const typeMap = { quest: 'quests', npc: 'characters', item: 'items' };
        router.navigate(`/${typeMap[node.type]}/detail/${node.data.id}`);
    });
}

function renderNodeConnections(node) {
    const connections = graphState.edges.filter(e =>
        e.from === node.id || e.to === node.id
    );

    if (connections.length === 0) {
        return '<p style="color: var(--text-muted); font-size: var(--text-sm);">No connections</p>';
    }

    return connections.map(edge => {
        const otherId = edge.from === node.id ? edge.to : edge.from;
        const otherNode = graphState.nodes.find(n => n.id === otherId);
        const type = CONNECTION_TYPES.find(t => t.id === edge.type);

        return `
            <div class="connection-item">
                <span class="connection-type" style="background: ${type?.color}">${type?.label}</span>
                <span>${otherNode?.data.name || 'Unknown'}</span>
            </div>
        `;
    }).join('');
}

// ============================================
// AUTO LAYOUT
// ============================================

function autoLayout() {
    // Simple force-directed layout
    const iterations = 50;
    const repulsion = 5000;
    const attraction = 0.01;

    for (let i = 0; i < iterations; i++) {
        graphState.nodes.forEach(node => {
            if (node.pinned) return;

            let fx = 0, fy = 0;

            // Repulsion from other nodes
            graphState.nodes.forEach(other => {
                if (other === node) return;
                const dx = node.x - other.x;
                const dy = node.y - other.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                fx += repulsion * dx / (dist * dist);
                fy += repulsion * dy / (dist * dist);
            });

            // Attraction to connected nodes
            graphState.edges.forEach(edge => {
                let other = null;
                if (edge.from === node.id) other = graphState.nodes.find(n => n.id === edge.to);
                if (edge.to === node.id) other = graphState.nodes.find(n => n.id === edge.from);
                if (!other) return;

                const dx = other.x - node.x;
                const dy = other.y - node.y;
                fx += attraction * dx;
                fy += attraction * dy;
            });

            // Center gravity
            fx += (canvas.width / 2 - node.x) * 0.001;
            fy += (canvas.height / 2 - node.y) * 0.001;

            node.x += fx;
            node.y += fy;
        });
    }

    saveGraphState();
}

function resetView() {
    graphState.zoom = 1;
    graphState.pan = { x: 0, y: 0 };
    updateZoomDisplay();
}

// ============================================
// ADD NODE
// ============================================

function showAddNodeModal(type) {
    const modal = document.getElementById('add-node-modal');
    const title = document.getElementById('add-node-title');
    const body = document.getElementById('add-node-body');

    modal.classList.remove('hidden');
    document.querySelector('.add-menu-items')?.classList.add('hidden');

    const typeNames = { quest: 'Quest', npc: 'NPC', item: 'Item', faction: 'Faction', branch: 'Branch' };
    title.textContent = `Add ${typeNames[type]}`;

    if (type === 'quest' || type === 'npc' || type === 'item') {
        // Search existing
        const dataKey = type === 'quest' ? 'quests' : type === 'npc' ? 'characters' : 'items';
        const existingIds = graphState.nodes.map(n => n.id);
        const available = dataLoader.data[dataKey].filter(d => !existingIds.includes(d.id));

        body.innerHTML = `
            <input type="text" class="search-input" id="add-search" placeholder="Search ${typeNames[type]}s...">
            <div id="add-results" style="max-height: 300px; overflow-y: auto; margin-top: var(--space-3);">
                ${available.slice(0, 10).map(d => `
                    <div class="add-result-item" data-id="${d.id}" data-type="${type}">
                        ${d.name}
                    </div>
                `).join('')}
            </div>
        `;

        document.getElementById('add-search')?.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            const filtered = available.filter(d => d.name.toLowerCase().includes(q)).slice(0, 10);
            document.getElementById('add-results').innerHTML = filtered.map(d => `
                <div class="add-result-item" data-id="${d.id}" data-type="${type}">
                    ${d.name}
                </div>
            `).join('');
            attachAddResultHandlers();
        });

        attachAddResultHandlers();
    } else {
        // Custom node
        body.innerHTML = `
            <div class="form-group">
                <label>Name</label>
                <input type="text" id="custom-node-name" class="panel-input">
            </div>
            <button class="btn btn-primary" id="add-custom-btn" style="width: 100%;">Add</button>
        `;

        document.getElementById('add-custom-btn')?.addEventListener('click', () => {
            const name = document.getElementById('custom-node-name').value;
            if (name) {
                addCustomNode(type, name);
                modal.classList.add('hidden');
            }
        });
    }
}

function attachAddResultHandlers() {
    document.querySelectorAll('.add-result-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = item.dataset.id;
            const type = item.dataset.type;
            addExistingNode(id, type);
            document.getElementById('add-node-modal').classList.add('hidden');
        });
    });
}

function addExistingNode(id, type) {
    const dataKey = type === 'quest' ? 'quests' : type === 'npc' ? 'characters' : 'items';
    const data = dataLoader.data[dataKey].find(d => d.id === id);
    if (!data) return;

    graphState.nodes.push({
        id,
        type,
        data,
        x: canvas.width / 2 + (Math.random() - 0.5) * 200,
        y: canvas.height / 2 + (Math.random() - 0.5) * 200,
        pinned: false
    });

    saveGraphState();
}

function addCustomNode(type, name) {
    const id = `custom-${type}-${Date.now()}`;
    graphState.nodes.push({
        id,
        type,
        data: { id, name },
        x: canvas.width / 2 + (Math.random() - 0.5) * 200,
        y: canvas.height / 2 + (Math.random() - 0.5) * 200,
        pinned: false
    });

    saveGraphState();
}

// ============================================
// COPY FUNCTIONS
// ============================================

function copyGraphSummary() {
    let summary = `**Campaign Graph: Hag's Addle Arc**\n\n`;

    // Active quests
    const quests = graphState.nodes.filter(n => n.type === 'quest');
    const activeQuests = quests.filter(q => q.data.status === 'In Progress');

    summary += `**Active Quests:**\n`;
    activeQuests.forEach(q => {
        const progress = Math.round(calculateQuestProgress(q.data) * 100);
        summary += `- ${q.data.name} (${progress}%) - ${q.data.summary?.slice(0, 50) || ''}...\n`;
    });

    // NPCs
    const npcs = graphState.nodes.filter(n => n.type === 'npc');
    summary += `\n**Key NPCs:**\n`;
    npcs.forEach(n => {
        const disp = n.data.disposition || 0;
        const dispLabel = disp >= 1 ? 'Ally' : disp <= -1 ? 'Hostile' : 'Neutral';
        summary += `- ${n.data.name} (${dispLabel}, disposition ${disp >= 0 ? '+' : ''}${disp})\n`;
    });

    // Connections summary
    summary += `\n**Connections:** ${graphState.edges.length} total\n`;

    clipboard.copy(summary, 'Graph summary copied!');
}

function copyNodeSummary(node) {
    let summary = `**${node.data.name}** (${node.type})\n\n`;

    if (node.data.description) {
        summary += node.data.description + '\n\n';
    }

    if (node.type === 'quest' && node.data.status) {
        summary += `Status: ${node.data.status}\n`;
    }

    clipboard.copy(summary, 'Node copied!');
}

// ============================================
// PERSISTENCE
// ============================================

function saveGraphState() {
    const positions = {};
    graphState.nodes.forEach(node => {
        positions[node.id] = { x: node.x, y: node.y, pinned: node.pinned };
    });
    localStorage.setItem('dnd_vault_graph_positions', JSON.stringify(positions));

    // Save custom edges
    const customEdges = graphState.edges.filter(e => e.custom);
    localStorage.setItem('dnd_vault_graph_edges', JSON.stringify(customEdges));
}

function loadGraphState() {
    // Zoom and pan are reset on load, positions restored in buildNodesFromData
}

// Cleanup on route change
window.addEventListener('hashchange', () => {
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
    }
});
