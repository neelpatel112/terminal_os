// ===== HELPER FUNCTIONS =====
console.log('🔧 Initializing Helper Functions...');

class Helpers {
    constructor() {
        // Initialize any state if needed
    }

    // ===== DOM MANIPULATION =====
    createElement(tag, classes = '', text = '', attributes = {}) {
        const element = document.createElement(tag);
        
        if (classes) {
            element.className = classes;
        }
        
        if (text) {
            element.textContent = text;
        }
        
        for (const [key, value] of Object.entries(attributes)) {
            element.setAttribute(key, value);
        }
        
        return element;
    }

    removeElement(selector) {
        const element = typeof selector === 'string' ? 
            document.querySelector(selector) : selector;
        
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
            return true;
        }
        return false;
    }

    toggleElement(selector, force) {
        const element = typeof selector === 'string' ? 
            document.querySelector(selector) : selector;
        
        if (!element) return false;
        
        if (force !== undefined) {
            element.style.display = force ? '' : 'none';
            return force;
        } else {
            const isVisible = element.style.display !== 'none';
            element.style.display = isVisible ? 'none' : '';
            return !isVisible;
        }
    }

    addClass(element, className) {
        if (element && className) {
            element.classList.add(className);
            return true;
        }
        return false;
    }

    removeClass(element, className) {
        if (element && className) {
            element.classList.remove(className);
            return true;
        }
        return false;
    }

    toggleClass(element, className, force) {
        if (element && className) {
            if (force !== undefined) {
                if (force) {
                    element.classList.add(className);
                } else {
                    element.classList.remove(className);
                }
                return force;
            } else {
                return element.classList.toggle(className);
            }
        }
        return false;
    }

    // ===== STRING MANIPULATION =====
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    truncate(str, length, suffix = '...') {
        if (!str || str.length <= length) return str;
        return str.substring(0, length) + suffix;
    }

    slugify(str) {
        return str
            .toLowerCase()
            .replace(/[^\w\s-]/g, '') // Remove special chars
            .replace(/\s+/g, '-')     // Replace spaces with hyphens
            .replace(/--+/g, '-')     // Replace multiple hyphens
            .trim();
    }

    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    formatDuration(ms) {
        if (ms < 1000) return `${ms}ms`;
        
        const seconds = Math.floor(ms / 1000);
        if (seconds < 60) return `${seconds}s`;
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
        
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        
        return `${hours}h ${remainingMinutes}m`;
    }

    // ===== DATE & TIME =====
    formatDate(date, format = 'relative') {
        if (!date) return '';
        
        const d = date instanceof Date ? date : new Date(date);
        
        if (format === 'relative') {
            const now = new Date();
            const diffMs = now - d;
            const diffSeconds = Math.floor(diffMs / 1000);
            const diffMinutes = Math.floor(diffSeconds / 60);
            const diffHours = Math.floor(diffMinutes / 60);
            const diffDays = Math.floor(diffHours / 24);
            
            if (diffSeconds < 60) return 'just now';
            if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
            if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
            if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
            
            return d.toLocaleDateString();
        } else if (format === 'short') {
            return d.toLocaleDateString();
        } else if (format === 'long') {
            return d.toLocaleString();
        } else if (format === 'time') {
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        
        return d.toString();
    }

    getCurrentTimestamp() {
        return Date.now();
    }

    getISODate() {
        return new Date().toISOString();
    }

    // ===== ARRAY MANIPULATION =====
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    uniqueArray(array) {
        return [...new Set(array)];
    }

    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    // ===== OBJECT MANIPULATION =====
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    mergeObjects(...objects) {
        return objects.reduce((merged, obj) => {
            if (!obj) return merged;
            
            for (const [key, value] of Object.entries(obj)) {
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    merged[key] = this.mergeObjects(merged[key] || {}, value);
                } else {
                    merged[key] = value;
                }
            }
            
            return merged;
        }, {});
    }

    isEmptyObject(obj) {
        return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
    }

    // ===== VALIDATION =====
    isEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    isURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    isNumber(value) {
        return !isNaN(parseFloat(value)) && isFinite(value);
    }

    isString(value) {
        return typeof value === 'string' || value instanceof String;
    }

    isArray(value) {
        return Array.isArray(value);
    }

    isObject(value) {
        return value && typeof value === 'object' && !Array.isArray(value);
    }

    // ===== RANDOM GENERATION =====
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }

    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    randomId(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    randomHexColor() {
        return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    }

    // ===== FUNCTION UTILITIES =====
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    retry(fn, retries = 3, delay = 1000) {
        return new Promise((resolve, reject) => {
            const attempt = (attempts) => {
                fn()
                    .then(resolve)
                    .catch(error => {
                        if (attempts <= 1) {
                            reject(error);
                        } else {
                            setTimeout(() => attempt(attempts - 1), delay);
                        }
                    });
            };
            attempt(retries);
        });
    }

    // ===== EVENT HANDLING =====
    on(event, element, handler, options = {}) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        
        if (element) {
            element.addEventListener(event, handler, options);
            return () => element.removeEventListener(event, handler, options);
        }
        
        return () => {};
    }

    once(event, element, handler) {
        return this.on(event, element, handler, { once: true });
    }

    emit(event, detail = {}) {
        const customEvent = new CustomEvent(event, { detail });
        window.dispatchEvent(customEvent);
    }

    // ===== COOKIE MANAGEMENT =====
    setCookie(name, value, days = 7) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = "expires=" + date.toUTCString();
        document.cookie = name + "=" + encodeURIComponent(value) + ";" + expires + ";path=/";
        return true;
    }

    getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1);
            if (c.indexOf(nameEQ) === 0) {
                return decodeURIComponent(c.substring(nameEQ.length));
            }
        }
        return null;
    }

    deleteCookie(name) {
        this.setCookie(name, "", -1);
        return true;
    }

    // ===== URL MANIPULATION =====
    getQueryParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    setQueryParam(name, value) {
        const url = new URL(window.location);
        url.searchParams.set(name, value);
        window.history.replaceState({}, '', url);
        return url.toString();
    }

    removeQueryParam(name) {
        const url = new URL(window.location);
        url.searchParams.delete(name);
        window.history.replaceState({}, '', url);
        return url.toString();
    }

    // ===== FILE UTILITIES =====
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    downloadFile(filename, content, type = 'text/plain') {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // ===== SYSTEM UTILITIES =====
    getOSInfo() {
        const userAgent = navigator.userAgent;
        let os = 'Unknown';
        
        if (userAgent.includes('Windows')) os = 'Windows';
        else if (userAgent.includes('Mac')) os = 'macOS';
        else if (userAgent.includes('Linux')) os = 'Linux';
        else if (userAgent.includes('Android')) os = 'Android';
        else if (userAgent.includes('iOS')) os = 'iOS';
        
        return {
            os,
            userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screen: {
                width: screen.width,
                height: screen.height,
                availWidth: screen.availWidth,
                availHeight: screen.availHeight
            },
            window: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            devicePixelRatio: window.devicePixelRatio
        };
    }

    getBrowserInfo() {
        const userAgent = navigator.userAgent;
        let browser = 'Unknown';
        let version = '';
        
        if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
            browser = 'Chrome';
            version = userAgent.match(/Chrome\/(\d+)/)?.[1] || '';
        } else if (userAgent.includes('Firefox')) {
            browser = 'Firefox';
            version = userAgent.match(/Firefox\/(\d+)/)?.[1] || '';
        } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
            browser = 'Safari';
            version = userAgent.match(/Version\/(\d+)/)?.[1] || '';
        } else if (userAgent.includes('Edg')) {
            browser = 'Edge';
            version = userAgent.match(/Edg\/(\d+)/)?.[1] || '';
        }
        
        return {
            browser,
            version,
            userAgent,
            online: navigator.onLine,
            cookiesEnabled: navigator.cookieEnabled,
            javaEnabled: navigator.javaEnabled ? navigator.javaEnabled() : false
        };
    }

    // ===== PERFORMANCE =====
    measurePerformance(fn, ...args) {
        const start = performance.now();
        const result = fn(...args);
        const end = performance.now();
        
        return {
            result,
            time: end - start,
            timestamp: Date.now()
        };
    }

    async measureAsyncPerformance(fn, ...args) {
        const start = performance.now();
        const result = await fn(...args);
        const end = performance.now();
        
        return {
            result,
            time: end - start,
            timestamp: Date.now()
        };
    }

    // ===== ERROR HANDLING =====
    safeCall(fn, ...args) {
        try {
            return {
                success: true,
                result: fn(...args),
                error: null
            };
        } catch (error) {
            return {
                success: false,
                result: null,
                error: error.message
            };
        }
    }

    async safeAsyncCall(fn, ...args) {
        try {
            const result = await fn(...args);
            return {
                success: true,
                result,
                error: null
            };
        } catch (error) {
            return {
                success: false,
                result: null,
                error: error.message
            };
        }
    }

    // ===== LOGGING =====
    log(level, message, data = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = { timestamp, level, message, data };
        
        // Console logging
        const colors = {
            info: 'blue',
            warn: 'orange',
            error: 'red',
            debug: 'gray',
            success: 'green'
        };
        
        const color = colors[level] || 'black';
        console.log(`%c[${level.toUpperCase()}] ${timestamp}`, `color: ${color}`, message, data);
        
        // Store in memory (for debugging)
        if (!window._tfosLogs) {
            window._tfosLogs = [];
        }
        window._tfosLogs.push(logEntry);
        
        // Keep only last 100 logs
        if (window._tfosLogs.length > 100) {
            window._tfosLogs.shift();
        }
        
        return logEntry;
    }

    info(message, data = {}) {
        return this.log('info', message, data);
    }

    warn(message, data = {}) {
        return this.log('warn', message, data);
    }

    error(message, data = {}) {
        return this.log('error', message, data);
    }

    debug(message, data = {}) {
        return this.log('debug', message, data);
    }

    success(message, data = {}) {
        return this.log('success', message, data);
    }

    // ===== CLEANUP =====
    cleanup() {
        // Clean up any temporary state if needed
        console.log('🧹 Helpers cleaned up');
    }
}

// Create global instance
const helpers = new Helpers();

// Export for use in other modules
window.helpers = window.h = helpers;

// Add some commonly used functions to global scope
window.$ = (selector) => document.querySelector(selector);
window.$$ = (selector) => document.querySelectorAll(selector);

// Auto-initialize
console.log('✅ Helper Functions ready');

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    helpers.cleanup();
});

window.helpers = window.h = helpers;