// ============================================
// D&D VAULT - LIST VIEW COMPONENT
// Generic list view for items, monsters, etc.
// ============================================

import { router } from '../utils/router.js';
import { dataLoader } from '../utils/data-loader.js';
import { clipboard } from '../utils/clipboard.js';

export function renderListView(type, title, icon) {
    const content = document.getElementById('content');
    const header = document.getElementById('header');
    const data = dataLoader.data[type] || [];

    // Render header
    header.innerHTML = `
        <h1 class="header-title">${icon} ${title}</h1>
        <div class="header-search">
            <div class="search-wrapper">
                <span class="search-icon">🔍</span>
                <input type="text" class="search-input" id="list-search" placeholder="Search ${title.toLowerCase()}...">
            </div>
        </div>
    `;

    // Render content
    content.innerHTML = `
        <div class="content-wrapper">
            <div class="filter-bar">
                <div class="filter-group">
                    <label class="filter-label">Sort by:</label>
                    <select class="filter-select" id="sort-select">
                        <option value="name">Name A-Z</option>
                        <option value="name-desc">Name Z-A</option>
                        <option value="recent">Recently Added</option>
                    </select>
                </div>
                ${type === 'items' ? `
                    <div class="filter-group">
                        <label class="filter-label">Category:</label>
                        <select class="filter-select" id="category-filter">
                            <option value="">All</option>
                            ${getUniqueCategories(data).map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                        </select>
                    </div>
                ` : ''}
                ${type === 'characters' ? `
                    <div class="filter-group">
                        <label class="filter-label">Type:</label>
                        <select class="filter-select" id="type-filter">
                            <option value="">All</option>
                            ${getUniqueTypes(data).map(t => `<option value="${t}">${t}</option>`).join('')}
                        </select>
                    </div>
                ` : ''}
            </div>
            
            <div class="card">
                <table class="data-table" id="data-table">
                    <thead>
                        <tr>
                            ${getTableHeaders(type)}
                        </tr>
                    </thead>
                    <tbody id="table-body">
                        ${renderTableRows(data, type)}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Store data for filtering
    let filteredData = [...data];

    // Search handler
    const searchInput = document.getElementById('list-search');
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        filteredData = data.filter(item => {
            const name = (item.name || '').toLowerCase();
            const desc = (item.description || '').toLowerCase();
            const tags = (item.tags || []).join(' ').toLowerCase();
            return name.includes(query) || desc.includes(query) || tags.includes(query);
        });
        applyFilters();
    });

    // Sort handler
    const sortSelect = document.getElementById('sort-select');
    sortSelect.addEventListener('change', applyFilters);

    // Category filter handler
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', applyFilters);
    }

    // Type filter handler
    const typeFilter = document.getElementById('type-filter');
    if (typeFilter) {
        typeFilter.addEventListener('change', applyFilters);
    }

    function applyFilters() {
        let result = [...filteredData];

        // Apply category filter
        if (categoryFilter && categoryFilter.value) {
            result = result.filter(item => item.category === categoryFilter.value);
        }

        // Apply type filter
        if (typeFilter && typeFilter.value) {
            result = result.filter(item => item.type === typeFilter.value);
        }

        // Apply sort
        const sortValue = sortSelect.value;
        if (sortValue === 'name') {
            result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        } else if (sortValue === 'name-desc') {
            result.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
        }

        document.getElementById('table-body').innerHTML = renderTableRows(result, type);
        attachRowHandlers(type);
    }

    attachRowHandlers(type);
}

function attachRowHandlers(type) {
    document.querySelectorAll('#table-body tr').forEach(row => {
        row.addEventListener('click', () => {
            const id = row.dataset.id;
            router.navigate(`/${type}/detail/${id}`);
        });
    });
}

function getTableHeaders(type) {
    switch (type) {
        case 'items':
            return '<th>Name</th><th>Category</th><th>Rarity</th><th>Tags</th>';
        case 'monsters':
            return '<th>Name</th><th>HD</th><th>AC</th><th>Alignment</th>';
        case 'characters':
            return '<th>Name</th><th>Type</th><th>Tags</th>';
        case 'shops':
            return '<th>Name</th><th>Owner</th><th>Location</th><th>Type</th>';
        case 'quests':
            return '<th>Name</th><th>Type</th><th>Status</th>';
        default:
            return '<th>Name</th><th>Description</th>';
    }
}

function renderTableRows(data, type) {
    if (data.length === 0) {
        return `<tr><td colspan="4" class="empty-state">No items found</td></tr>`;
    }

    return data.map(item => {
        switch (type) {
            case 'items':
                return `
                    <tr data-id="${item.id}">
                        <td class="name-cell">${item.name}</td>
                        <td>${item.category || '-'}</td>
                        <td>${item.rarity || '-'}</td>
                        <td class="tags-cell">${(item.tags || []).slice(0, 3).map(t => `<span class="chip">${t}</span>`).join('')}</td>
                    </tr>
                `;
            case 'monsters':
                return `
                    <tr data-id="${item.id}">
                        <td class="name-cell">${item.name}</td>
                        <td>${item.hd || '-'}</td>
                        <td>${item.ac || '-'}</td>
                        <td>${item.alignment || '-'}</td>
                    </tr>
                `;
            case 'characters':
                return `
                    <tr data-id="${item.id}">
                        <td class="name-cell">${item.name}</td>
                        <td>${item.type || '-'}</td>
                        <td class="tags-cell">${(item.tags || []).slice(0, 3).map(t => `<span class="chip">${t}</span>`).join('')}</td>
                    </tr>
                `;
            case 'shops':
                return `
                    <tr data-id="${item.id}">
                        <td class="name-cell">${item.name}</td>
                        <td>${item.owner || '-'}</td>
                        <td>${item.location || '-'}</td>
                        <td>${item.type || '-'}</td>
                    </tr>
                `;
            case 'quests':
                return `
                    <tr data-id="${item.id}">
                        <td class="name-cell">${item.name}</td>
                        <td><span class="chip chip-primary">${item.quest_type || '-'}</span></td>
                        <td>${item.status || '-'}</td>
                    </tr>
                `;
            default:
                return `
                    <tr data-id="${item.id}">
                        <td class="name-cell">${item.name}</td>
                        <td>${(item.description || '').slice(0, 50)}...</td>
                    </tr>
                `;
        }
    }).join('');
}

function getUniqueCategories(data) {
    const categories = new Set();
    data.forEach(item => {
        if (item.category) categories.add(item.category);
    });
    return Array.from(categories).sort();
}

function getUniqueTypes(data) {
    const types = new Set();
    data.forEach(item => {
        if (item.type) types.add(item.type);
    });
    return Array.from(types).sort();
}
