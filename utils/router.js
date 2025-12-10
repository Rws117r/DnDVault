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
        const [path, ...params] = hash.split('/').filter(Boolean);
        const routePath = '/' + (path || '');

        // Find matching route
        if (this.routes[routePath]) {
            this.currentRoute = routePath;
            this.routes[routePath](params);
        } else if (this.routes['/404']) {
            this.routes['/404'](params);
        } else {
            console.warn('Route not found:', routePath);
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
