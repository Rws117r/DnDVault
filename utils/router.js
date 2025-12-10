// ============================================
// D&D VAULT - ROUTER
// Simple hash-based SPA router
// ============================================

class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;

        // Listen for hash changes
        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
    }

    // Register a route
    on(path, callback) {
        this.routes[path] = callback;
        return this;
    }

    // Navigate to a route
    navigate(path) {
        window.location.hash = path;
    }

    // Handle current route
    handleRoute() {
        const hash = window.location.hash.slice(1) || '/';

        // Check for detail routes first (e.g., /items/detail/item-0001)
        const detailMatch = hash.match(/^\/(items|monsters|characters|shops|quests)\/detail\/(.+)$/);
        if (detailMatch) {
            // Detail routes are handled in main.js hashchange listener
            return;
        }

        // Try to find exact match first (for routes like /quests/graph)
        if (this.routes[hash]) {
            this.currentRoute = hash;
            this.routes[hash]();
            return;
        }

        // Extract base path
        const parts = hash.split('/').filter(Boolean);
        const routePath = '/' + (parts[0] || '');

        // Find matching route
        if (this.routes[routePath]) {
            this.currentRoute = routePath;
            this.routes[routePath](parts.slice(1));
        } else if (this.routes['/404']) {
            this.routes['/404']();
        } else {
            console.warn('Route not found:', hash);
        }
    }

    // Get current params from hash
    getParams() {
        const hash = window.location.hash.slice(1) || '/';
        const parts = hash.split('/').filter(Boolean);
        return parts.slice(1);
    }
}

export const router = new Router();
