// ===== STORAGE UTILITIES =====
console.log('💾 Initializing Storage Utilities...');

class StorageManager {
    constructor() {
        this.prefix = 'tfos_';
        this.cache = new Map();
        this.initIndexedDB();
    }

    // ===== LOCALSTORAGE METHODS =====
    set(key, value, ttl = null) {
        const item = {
            value,
            timestamp: Date.now(),
            ttl
        };
        
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(item));
            this.cache.set(key, value);
            return true;
        } catch (error) {
            console.error('Storage error (set):', error);
            return false;
        }
    }

    get(key, defaultValue = null) {
        // Check cache first
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }
        
        try {
            const itemStr = localStorage.getItem(this.prefix + key);
            if (!itemStr) return defaultValue;
            
            const item = JSON.parse(itemStr);
            
            // Check if expired
            if (item.ttl && Date.now() - item.timestamp > item.ttl * 1000) {
                this.remove(key);
                return defaultValue;
            }
            
            this.cache.set(key, item.value);
            return item.value;
        } catch (error) {
            console.error('Storage error (get):', error);
            return defaultValue;
        }
    }

    remove(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            this.cache.delete(key);
            return true;
        } catch (error) {
            console.error('Storage error (remove):', error);
            return false;
        }
    }

    exists(key) {
        return localStorage.getItem(this.prefix + key) !== null;
    }

    clear(prefix = '') {
        try {
            if (prefix) {
                // Clear only keys with specific prefix
                for (let i = localStorage.length - 1; i >= 0; i--) {
                    const key = localStorage.key(i);
                    if (key.startsWith(this.prefix + prefix)) {
                        localStorage.removeItem(key);
                        this.cache.delete(key.replace(this.prefix, ''));
                    }
                }
            } else {
                // Clear all tfos_ prefixed keys
                for (let i = localStorage.length - 1; i >= 0; i--) {
                    const key = localStorage.key(i);
                    if (key.startsWith(this.prefix)) {
                        localStorage.removeItem(key);
                    }
                }
                this.cache.clear();
            }
            return true;
        } catch (error) {
            console.error('Storage error (clear):', error);
            return false;
        }
    }

    keys(prefix = '') {
        const keys = [];
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(this.prefix + prefix)) {
                    keys.push(key.replace(this.prefix, ''));
                }
            }
        } catch (error) {
            console.error('Storage error (keys):', error);
        }
        return keys;
    }

    getAll(prefix = '') {
        const items = {};
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(this.prefix + prefix)) {
                    const itemStr = localStorage.getItem(key);
                    if (itemStr) {
                        const item = JSON.parse(itemStr);
                        items[key.replace(this.prefix, '')] = item.value;
                    }
                }
            }
        } catch (error) {
            console.error('Storage error (getAll):', error);
        }
        return items;
    }

    // ===== SESSION STORAGE =====
    setSession(key, value) {
        try {
            sessionStorage.setItem(this.prefix + key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Session storage error:', error);
            return false;
        }
    }

    getSession(key, defaultValue = null) {
        try {
            const item = sessionStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Session storage error:', error);
            return defaultValue;
        }
    }

    removeSession(key) {
        try {
            sessionStorage.removeItem(this.prefix + key);
            return true;
        } catch (error) {
            console.error('Session storage error:', error);
            return false;
        }
    }

    // ===== INDEXEDDB METHODS =====
    initIndexedDB() {
        if (!window.indexedDB) {
            console.warn('IndexedDB not supported');
            this.db = null;
            return;
        }
        
        const request = indexedDB.open('TerminalFirstOS', 1);
        
        request.onerror = (event) => {
            console.error('IndexedDB error:', event.target.error);
            this.db = null;
        };
        
        request.onsuccess = (event) => {
            this.db = event.target.result;
            console.log('✅ IndexedDB initialized');
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Create object stores
            if (!db.objectStoreNames.contains('files')) {
                db.createObjectStore('files', { keyPath: 'path' });
            }
            
            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings', { keyPath: 'key' });
            }
            
            if (!db.objectStoreNames.contains('cache')) {
                db.createObjectStore('cache', { keyPath: 'key' });
            }
        };
    }

    async idbSet(storeName, key, value) {
        if (!this.db) return false;
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            const request = store.put({ 
                [storeName === 'settings' ? 'key' : 'path']: key, 
                value, 
                timestamp: Date.now() 
            });
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => {
                console.error('IndexedDB set error:', request.error);
                resolve(false);
            };
        });
    }

    async idbGet(storeName, key) {
        if (!this.db) return null;
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            
            const request = store.get(key);
            
            request.onsuccess = () => {
                resolve(request.result ? request.result.value : null);
            };
            
            request.onerror = () => {
                console.error('IndexedDB get error:', request.error);
                resolve(null);
            };
        });
    }

    async idbRemove(storeName, key) {
        if (!this.db) return false;
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            const request = store.delete(key);
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => {
                console.error('IndexedDB remove error:', request.error);
                resolve(false);
            };
        });
    }

    async idbClear(storeName) {
        if (!this.db) return false;
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            const request = store.clear();
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => {
                console.error('IndexedDB clear error:', request.error);
                resolve(false);
            };
        });
    }

    // ===== FILE STORAGE =====
    async saveFile(path, content) {
        // Try IndexedDB first, fallback to localStorage
        if (this.db) {
            const success = await this.idbSet('files', path, content);
            if (success) return true;
        }
        
        // Fallback to localStorage
        return this.set(`file_${path}`, content);
    }

    async loadFile(path, defaultValue = '') {
        if (this.db) {
            const content = await this.idbGet('files', path);
            if (content !== null) return content;
        }
        
        // Fallback to localStorage
        return this.get(`file_${path}`, defaultValue);
    }

    async deleteFile(path) {
        if (this.db) {
            await this.idbRemove('files', path);
        }
        
        this.remove(`file_${path}`);
        return true;
    }

    // ===== SETTINGS STORAGE =====
    async saveSetting(key, value) {
        if (this.db) {
            const success = await this.idbSet('settings', key, value);
            if (success) return true;
        }
        
        return this.set(`setting_${key}`, value);
    }

    async loadSetting(key, defaultValue = null) {
        if (this.db) {
            const value = await this.idbGet('settings', key);
            if (value !== null) return value;
        }
        
        return this.get(`setting_${key}`, defaultValue);
    }

    // ===== CACHE MANAGEMENT =====
    setCache(key, value, ttl = 300) { // 5 minutes default
        return this.set(`cache_${key}`, value, ttl);
    }

    getCache(key, defaultValue = null) {
        return this.get(`cache_${key}`, defaultValue);
    }

    clearCache(prefix = '') {
        return this.clear(`cache_${prefix}`);
    }

    // ===== IMPORT/EXPORT =====
    exportData() {
        const data = {
            settings: this.getAll('setting_'),
            files: this.getAll('file_'),
            timestamp: Date.now(),
            version: '1.0'
        };
        
        return JSON.stringify(data, null, 2);
    }

    importData(json) {
        try {
            const data = JSON.parse(json);
            
            if (data.version !== '1.0') {
                throw new Error('Unsupported backup version');
            }
            
            // Import settings
            if (data.settings) {
                for (const [key, value] of Object.entries(data.settings)) {
                    this.set(`setting_${key}`, value);
                }
            }
            
            // Import files
            if (data.files) {
                for (const [key, value] of Object.entries(data.files)) {
                    this.set(`file_${key}`, value);
                }
            }
            
            return true;
        } catch (error) {
            console.error('Import error:', error);
            return false;
        }
    }

    // ===== STORAGE INFO =====
    getStorageInfo() {
        try {
            let totalSize = 0;
            let tfosSize = 0;
            let itemCount = 0;
            
            // Calculate localStorage usage
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                const itemSize = (key.length + value.length) * 2; // Approximate size in bytes
                totalSize += itemSize;
                
                if (key.startsWith(this.prefix)) {
                    tfosSize += itemSize;
                    itemCount++;
                }
            }
            
            // Add sessionStorage
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                const value = sessionStorage.getItem(key);
                const itemSize = (key.length + value.length) * 2;
                totalSize += itemSize;
                
                if (key.startsWith(this.prefix)) {
                    tfosSize += itemSize;
                    itemCount++;
                }
            }
            
            return {
                total: this.formatBytes(totalSize),
                tfos: this.formatBytes(tfosSize),
                itemCount,
                percentUsed: Math.round((totalSize / (5 * 1024 * 1024)) * 100), // 5MB limit typical
                cacheSize: this.cache.size
            };
        } catch (error) {
            console.error('Storage info error:', error);
            return {
                total: '0 B',
                tfos: '0 B',
                itemCount: 0,
                percentUsed: 0,
                cacheSize: 0
            };
        }
    }

    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // ===== CLEANUP =====
    cleanup() {
        // Remove expired items
        try {
            const now = Date.now();
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (key.startsWith(this.prefix)) {
                    try {
                        const item = JSON.parse(localStorage.getItem(key));
                        if (item.ttl && now - item.timestamp > item.ttl * 1000) {
                            localStorage.removeItem(key);
                            this.cache.delete(key.replace(this.prefix, ''));
                        }
                    } catch (e) {
                        // Invalid JSON, remove it
                        localStorage.removeItem(key);
                    }
                }
            }
        } catch (error) {
            console.error('Cleanup error:', error);
        }
        
        // Clear cache
        this.cache.clear();
        
        console.log('🧹 Storage cleaned up');
    }

    // ===== MIGRATION =====
    migrateOldKeys() {
        // Migrate from old key formats if needed
        const migrations = [
            { old: 'terminalfirst-theme', new: 'theme' },
            { old: 'terminalfirst-user', new: 'user' },
            { old: 'terminalfirst-sound', new: 'sound' }
        ];
        
        migrations.forEach(({ old, newKey }) => {
            const value = localStorage.getItem(old);
            if (value !== null) {
                this.set(newKey, value);
                localStorage.removeItem(old);
                console.log(`Migrated: ${old} -> ${newKey}`);
            }
        });
    }
}

// Create global instance
const storage = new StorageManager();

// Export for use in other modules
window.storage = storage;

// Auto-initialize
console.log('✅ Storage Utilities ready');

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    storage.cleanup();
});

// Periodically cleanup expired items (every 5 minutes)
setInterval(() => storage.cleanup(), 5 * 60 * 1000);

window.storage = storage;