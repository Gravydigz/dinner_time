// Configuration for data paths
// In development: relative paths work with file://
// In production (Docker): served by nginx, paths relative to root

const CONFIG = {
    // Data paths - adjust based on environment
    recipesPath: '../../data/recipes/master_recipes.json',
    uploadsPath: '../../data/uploads/',

    // API endpoints (for future backend)
    apiBaseUrl: window.location.hostname === 'localhost'
        ? 'http://localhost:3000/api'
        : '/api',

    // Environment detection
    isDevelopment: window.location.protocol === 'file:',
    isProduction: window.location.protocol === 'http:' || window.location.protocol === 'https:'
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
