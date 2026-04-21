/**
 * GitHub Storage Service
 * 
 * Uses GitHub as a storage backend for media and library files.
 * Files are stored in a dedicated GitHub repository.
 * 
 * Required: A GitHub Personal Access Token with repo permissions
 */

// GitHub Configuration (loaded from localStorage or defaults)
const getGitHubConfig = () => {
    // Try to load from localStorage first (where token is stored securely)
    const savedConfig = localStorage.getItem('githubStorageConfig');
    if (savedConfig) {
        try {
            return JSON.parse(savedConfig);
        } catch (e) {
            console.error('Failed to parse saved GitHub config');
        }
    }
    
    // Return defaults (token must be set via admin panel)
    return window.githubConfig || {
        owner: 'okulloabdulsalam-eng',  // Your GitHub username
        repo: 'kiuma-storage',           // Repository for file storage
        branch: 'main',
        token: '',                       // Set via admin panel - stored in localStorage only
        mediaPath: 'media',
        libraryPath: 'library',
        notificationsPath: 'notifications/notifications.json'
    };
};

/**
 * Upload a file to GitHub repository
 * @param {File} file - File to upload
 * @param {string} folder - Target folder ('media' or 'library')
 * @param {string} subfolder - Optional subfolder (e.g., 'audio', 'video', 'images', 'books')
 * @param {Function} onProgress - Progress callback (optional)
 * @returns {Promise<Object>} Upload result with download URL
 */
async function uploadToGitHub(file, folder = 'media', subfolder = '', onProgress = null) {
    const config = getGitHubConfig();
    
    if (!config.owner || !config.repo || !config.token) {
        throw new Error('GitHub configuration not set. Please configure GitHub settings in admin panel.');
    }
    
    try {
        // Generate unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const fileName = `${timestamp}_${randomString}_${safeFileName}`;
        
        // Build path
        const basePath = folder === 'library' ? config.libraryPath : config.mediaPath;
        const fullPath = subfolder ? `${basePath}/${subfolder}/${fileName}` : `${basePath}/${fileName}`;
        
        // Convert file to base64
        if (onProgress) onProgress(10);
        const base64Content = await fileToBase64(file);
        if (onProgress) onProgress(40);
        
        // Upload to GitHub
        const response = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${fullPath}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${config.token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                message: `Upload ${folder} file: ${file.name}`,
                content: base64Content,
                branch: config.branch
            })
        });
        
        if (onProgress) onProgress(80);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to upload file to GitHub');
        }
        
        const result = await response.json();
        if (onProgress) onProgress(100);
        
        // Return file info with download URL
        return {
            success: true,
            fileName: fileName,
            originalName: file.name,
            path: fullPath,
            sha: result.content.sha,
            downloadUrl: result.content.download_url,
            htmlUrl: result.content.html_url,
            size: file.size,
            mimeType: file.type
        };
        
    } catch (error) {
        console.error('[GitHub Storage] Upload error:', error);
        throw error;
    }
}

/**
 * Delete a file from GitHub repository
 * @param {string} path - File path in repository
 * @param {string} sha - File SHA (required for deletion)
 * @returns {Promise<boolean>}
 */
async function deleteFromGitHub(path, sha) {
    const config = getGitHubConfig();
    
    if (!config.owner || !config.repo || !config.token) {
        throw new Error('GitHub configuration not set');
    }
    
    try {
        const response = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `token ${config.token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                message: `Delete file: ${path}`,
                sha: sha,
                branch: config.branch
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete file from GitHub');
        }
        
        return true;
    } catch (error) {
        console.error('[GitHub Storage] Delete error:', error);
        throw error;
    }
}

/**
 * List files in a GitHub repository folder
 * @param {string} path - Folder path
 * @returns {Promise<Array>}
 */
async function listGitHubFiles(path = '') {
    const config = getGitHubConfig();
    
    if (!config.owner || !config.repo) {
        throw new Error('GitHub configuration not set');
    }
    
    try {
        const headers = {
            'Accept': 'application/vnd.github.v3+json'
        };
        
        // Add token if available (for private repos)
        if (config.token) {
            headers['Authorization'] = `token ${config.token}`;
        }
        
        const response = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}?ref=${config.branch}`, {
            method: 'GET',
            headers: headers
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                return []; // Folder doesn't exist yet
            }
            const error = await response.json();
            throw new Error(error.message || 'Failed to list files');
        }
        
        const files = await response.json();
        
        // Filter to only files (not directories) and add useful info
        return Array.isArray(files) ? files.filter(f => f.type === 'file').map(f => ({
            name: f.name,
            path: f.path,
            sha: f.sha,
            size: f.size,
            downloadUrl: f.download_url,
            htmlUrl: f.html_url
        })) : [];
        
    } catch (error) {
        console.error('[GitHub Storage] List error:', error);
        throw error;
    }
}

/**
 * Get file info from GitHub
 * @param {string} path - File path
 * @returns {Promise<Object>}
 */
async function getGitHubFileInfo(path) {
    const config = getGitHubConfig();
    
    if (!config.owner || !config.repo) {
        throw new Error('GitHub configuration not set');
    }
    
    try {
        const headers = {
            'Accept': 'application/vnd.github.v3+json'
        };
        
        if (config.token) {
            headers['Authorization'] = `token ${config.token}`;
        }
        
        const response = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}?ref=${config.branch}`, {
            method: 'GET',
            headers: headers
        });
        
        if (!response.ok) {
            return null;
        }
        
        const file = await response.json();
        return {
            name: file.name,
            path: file.path,
            sha: file.sha,
            size: file.size,
            downloadUrl: file.download_url,
            htmlUrl: file.html_url
        };
        
    } catch (error) {
        console.error('[GitHub Storage] Get file info error:', error);
        return null;
    }
}

/**
 * Convert File to base64 string
 * @param {File} file 
 * @returns {Promise<string>}
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // Remove data URL prefix (e.g., "data:image/png;base64,")
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Check if GitHub is configured
 * @returns {boolean}
 */
function isGitHubConfigured() {
    const config = getGitHubConfig();
    return !!(config.owner && config.repo && config.token);
}

/**
 * Save GitHub configuration to localStorage
 * @param {Object} config 
 */
function saveGitHubConfig(config) {
    const safeConfig = {
        owner: config.owner || '',
        repo: config.repo || '',
        branch: config.branch || 'main',
        token: config.token || '',
        mediaPath: config.mediaPath || 'media',
        libraryPath: config.libraryPath || 'library',
        notificationsPath: config.notificationsPath || 'notifications/notifications.json'
    };
    
    localStorage.setItem('githubStorageConfig', JSON.stringify(safeConfig));
    window.githubConfig = safeConfig;
    
    return true;
}

/**
 * Load GitHub configuration from localStorage
 * @returns {Object}
 */
function loadGitHubConfig() {
    try {
        const stored = localStorage.getItem('githubStorageConfig');
        if (stored) {
            const config = JSON.parse(stored);
            window.githubConfig = config;
            return config;
        }
    } catch (e) {
        console.error('[GitHub Storage] Failed to load config:', e);
    }
    return null;
}

/**
 * Test GitHub connection
 * @returns {Promise<Object>}
 */
async function testGitHubConnection() {
    const config = getGitHubConfig();
    
    if (!config.owner || !config.repo || !config.token) {
        return { success: false, message: 'Configuration incomplete' };
    }
    
    try {
        const response = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}`, {
            method: 'GET',
            headers: {
                'Authorization': `token ${config.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (response.ok) {
            const repo = await response.json();
            return { 
                success: true, 
                message: `Connected to ${repo.full_name}`,
                repoInfo: {
                    name: repo.name,
                    fullName: repo.full_name,
                    private: repo.private,
                    defaultBranch: repo.default_branch
                }
            };
        } else {
            const error = await response.json();
            return { success: false, message: error.message || 'Connection failed' };
        }
    } catch (error) {
        return { success: false, message: error.message };
    }
}

/**
 * Get media type category from MIME type
 * @param {string} mimeType 
 * @returns {string}
 */
function getMediaCategory(mimeType) {
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.includes('document') || mimeType.includes('word')) return 'document';
    return 'other';
}

// Initialize on load
if (typeof window !== 'undefined') {
    // Load saved config
    loadGitHubConfig();
    
    // Export to window
    window.githubStorage = {
        upload: uploadToGitHub,
        delete: deleteFromGitHub,
        list: listGitHubFiles,
        getFileInfo: getGitHubFileInfo,
        isConfigured: isGitHubConfigured,
        saveConfig: saveGitHubConfig,
        loadConfig: loadGitHubConfig,
        testConnection: testGitHubConnection,
        getMediaCategory: getMediaCategory
    };
}

// ES6 exports
export {
    uploadToGitHub,
    deleteFromGitHub,
    listGitHubFiles,
    getGitHubFileInfo,
    isGitHubConfigured,
    saveGitHubConfig,
    loadGitHubConfig,
    testGitHubConnection,
    getMediaCategory
};
