// ===== VIRTUAL FILESYSTEM =====
console.log('💾 Initializing Virtual Filesystem...');

class VirtualFileSystem {
    constructor() {
        this.root = {
            name: '/',
            type: 'directory',
            children: {},
            permissions: 'rwxr-xr-x',
            created: new Date(),
            modified: new Date(),
            size: 0
        };
        
        this.currentPath = '/home/guest';
        this.initDefaultStructure();
        this.setupIndexedDB();
    }

    initDefaultStructure() {
        // Create home directory
        this.mkdir('/home');
        this.mkdir('/home/guest');
        
        // Create standard directories
        const dirs = ['documents', 'downloads', 'pictures', 'music', 'desktop'];
        dirs.forEach(dir => this.mkdir(`/home/guest/${dir}`));
        
        // Create some default files
        this.writeFile('/home/guest/welcome.txt', 
            'Welcome to TerminalFirst OS!\n\n' +
            'This is your home directory.\n' +
            'You can create, edit, and delete files here.\n\n' +
            'Try these commands:\n' +
            '  ls - List files\n' +
            '  pwd - Show current directory\n' +
            '  cd [dir] - Change directory\n' +
            '  cat [file] - View file contents\n'
        );
        
        this.writeFile('/home/guest/todo.md',
            '# TODO List\n\n' +
            '## System Tasks\n' +
            '- [ ] Add more applications\n' +
            '- [ ] Implement package manager\n' +
            '- [ ] Add networking capabilities\n' +
            '- [ ] Create developer tools\n\n' +
            '## Personal Tasks\n' +
            '- [ ] Learn shell scripting\n' +
            '- [ ] Customize terminal theme\n' +
            '- [ ] Organize files\n'
        );
        
        this.writeFile('/home/guest/.config.json',
            JSON.stringify({
                theme: 'dark',
                editor: {
                    fontSize: 14,
                    wordWrap: true
                },
                terminal: {
                    font: 'JetBrains Mono',
                    fontSize: 13,
                    opacity: 0.95
                }
            }, null, 2)
        );
        
        // Create bin directory with executable scripts
        this.mkdir('/bin');
        this.writeFile('/bin/hello', '#!/bin/tfsh\necho "Hello from TerminalFirst OS!"');
        this.setPermissions('/bin/hello', 'rwxr-xr-x');
        
        // Create etc directory with configs
        this.mkdir('/etc');
        this.writeFile('/etc/hostname', 'terminal-first.local');
        this.writeFile('/etc/motd', 'Welcome to TerminalFirst OS v1.0.0-alpha');
        
        console.log('✅ Default filesystem structure created');
    }

    setupIndexedDB() {
        if (!window.indexedDB) {
            console.log('⚠️ IndexedDB not available, using in-memory only');
            return;
        }
        
        const request = indexedDB.open('terminalfirst-fs', 1);
        
        request.onerror = (event) => {
            console.error('❌ IndexedDB error:', event.target.error);
        };
        
        request.onsuccess = (event) => {
            this.db = event.target.result;
            console.log('✅ IndexedDB connected');
            this.loadFromDB();
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('filesystem')) {
                db.createObjectStore('filesystem');
            }
        };
    }

    async loadFromDB() {
        if (!this.db) return;
        
        try {
            const transaction = this.db.transaction(['filesystem'], 'readonly');
            const store = transaction.objectStore('filesystem');
            const request = store.get('root');
            
            request.onsuccess = (event) => {
                const saved = event.target.result;
                if (saved) {
                    this.root = saved;
                    console.log('💾 Loaded filesystem from IndexedDB');
                }
            };
        } catch (error) {
            console.error('Failed to load from IndexedDB:', error);
        }
    }

    async saveToDB() {
        if (!this.db) return;
        
        try {
            const transaction = this.db.transaction(['filesystem'], 'readwrite');
            const store = transaction.objectStore('filesystem');
            store.put(this.root, 'root');
        } catch (error) {
            console.error('Failed to save to IndexedDB:', error);
        }
    }

    // ===== PATH UTILITIES =====
    normalizePath(path) {
        if (!path.startsWith('/')) {
            path = this.joinPaths(this.currentPath, path);
        }
        
        // Remove trailing slashes (except root)
        if (path !== '/' && path.endsWith('/')) {
            path = path.slice(0, -1);
        }
        
        // Handle . and ..
        const parts = path.split('/').filter(p => p !== '.');
        const result = [];
        
        for (const part of parts) {
            if (part === '..') {
                if (result.length > 0 && result[result.length - 1] !== '') {
                    result.pop();
                }
            } else {
                result.push(part);
            }
        }
        
        const normalized = result.join('/') || '/';
        return normalized;
    }

    joinPaths(...paths) {
        return paths.join('/').replace(/\/+/g, '/');
    }

    getParentPath(path) {
        const normalized = this.normalizePath(path);
        if (normalized === '/') return '/';
        
        const lastSlash = normalized.lastIndexOf('/');
        if (lastSlash === 0) return '/';
        
        return normalized.substring(0, lastSlash);
    }

    getFileName(path) {
        const normalized = this.normalizePath(path);
        const lastSlash = normalized.lastIndexOf('/');
        return normalized.substring(lastSlash + 1);
    }

    // ===== FS OPERATIONS =====
    resolvePath(path) {
        const normalized = this.normalizePath(path);
        const parts = normalized.split('/').filter(p => p !== '');
        
        let current = this.root;
        
        for (const part of parts) {
            if (!current.children || !current.children[part]) {
                return null;
            }
            current = current.children[part];
        }
        
        return current;
    }

    mkdir(path) {
        const normalized = this.normalizePath(path);
        const parentPath = this.getParentPath(normalized);
        const dirName = this.getFileName(normalized);
        
        const parent = this.resolvePath(parentPath);
        if (!parent || parent.type !== 'directory') {
            throw new Error(`Cannot create directory: ${parentPath} does not exist or is not a directory`);
        }
        
        if (parent.children[dirName]) {
            throw new Error(`Directory already exists: ${normalized}`);
        }
        
        parent.children[dirName] = {
            name: dirName,
            type: 'directory',
            children: {},
            permissions: 'rwxr-xr-x',
            created: new Date(),
            modified: new Date(),
            size: 0
        };
        
        parent.modified = new Date();
        this.saveToDB();
        return true;
    }

    touch(path) {
        const normalized = this.normalizePath(path);
        const parentPath = this.getParentPath(normalized);
        const fileName = this.getFileName(normalized);
        
        const parent = this.resolvePath(parentPath);
        if (!parent || parent.type !== 'directory') {
            throw new Error(`Cannot create file: ${parentPath} does not exist or is not a directory`);
        }
        
        if (!parent.children[fileName]) {
            parent.children[fileName] = {
                name: fileName,
                type: 'file',
                content: '',
                permissions: 'rw-r--r--',
                created: new Date(),
                modified: new Date(),
                size: 0
            };
        } else {
            parent.children[fileName].modified = new Date();
        }
        
        parent.modified = new Date();
        this.saveToDB();
        return true;
    }

    writeFile(path, content) {
        const normalized = this.normalizePath(path);
        const parentPath = this.getParentPath(normalized);
        const fileName = this.getFileName(normalized);
        
        const parent = this.resolvePath(parentPath);
        if (!parent || parent.type !== 'directory') {
            throw new Error(`Cannot write file: ${parentPath} does not exist or is not a directory`);
        }
        
        const contentStr = String(content);
        parent.children[fileName] = {
            name: fileName,
            type: 'file',
            content: contentStr,
            permissions: 'rw-r--r--',
            created: new Date(),
            modified: new Date(),
            size: contentStr.length
        };
        
        parent.modified = new Date();
        this.saveToDB();
        return true;
    }

    readFile(path) {
        const node = this.resolvePath(path);
        if (!node) {
            throw new Error(`File not found: ${path}`);
        }
        
        if (node.type !== 'file') {
            throw new Error(`Not a file: ${path}`);
        }
        
        return node.content;
    }

    readFileBinary(path) {
        const content = this.readFile(path);
        return new TextEncoder().encode(content);
    }

    delete(path) {
        const normalized = this.normalizePath(path);
        const parentPath = this.getParentPath(normalized);
        const name = this.getFileName(normalized);
        
        const parent = this.resolvePath(parentPath);
        if (!parent || !parent.children[name]) {
            throw new Error(`File not found: ${path}`);
        }
        
        delete parent.children[name];
        parent.modified = new Date();
        this.saveToDB();
        return true;
    }

    rmdir(path) {
        const node = this.resolvePath(path);
        if (!node) {
            throw new Error(`Directory not found: ${path}`);
        }
        
        if (node.type !== 'directory') {
            throw new Error(`Not a directory: ${path}`);
        }
        
        if (Object.keys(node.children).length > 0) {
            throw new Error(`Directory not empty: ${path}`);
        }
        
        const parentPath = this.getParentPath(path);
        const dirName = this.getFileName(path);
        const parent = this.resolvePath(parentPath);
        
        delete parent.children[dirName];
        parent.modified = new Date();
        this.saveToDB();
        return true;
    }

    list(path = '.') {
        const normalized = this.normalizePath(path);
        const node = this.resolvePath(normalized);
        
        if (!node) {
            throw new Error(`Path not found: ${path}`);
        }
        
        if (node.type !== 'directory') {
            throw new Error(`Not a directory: ${path}`);
        }
        
        const items = [];
        
        // Add parent directory entry
        if (normalized !== '/') {
            items.push({
                name: '..',
                type: 'directory',
                size: 0,
                permissions: 'drwxr-xr-x',
                modified: node.modified
            });
        }
        
        // Add child entries
        for (const [name, child] of Object.entries(node.children)) {
            items.push({
                name,
                type: child.type,
                size: child.size || 0,
                permissions: child.permissions || (child.type === 'directory' ? 'drwxr-xr-x' : '-rw-r--r--'),
                modified: child.modified
            });
        }
        
        return items;
    }

    stat(path) {
        const node = this.resolvePath(path);
        if (!node) {
            throw new Error(`Path not found: ${path}`);
        }
        
        return {
            name: node.name,
            type: node.type,
            size: node.size || 0,
            permissions: node.permissions || (node.type === 'directory' ? 'drwxr-xr-x' : '-rw-r--r--'),
            created: node.created,
            modified: node.modified,
            accessed: new Date()
        };
    }

    exists(path) {
        return this.resolvePath(path) !== null;
    }

    isFile(path) {
        const node = this.resolvePath(path);
        return node && node.type === 'file';
    }

    isDirectory(path) {
        const node = this.resolvePath(path);
        return node && node.type === 'directory';
    }

    // ===== PERMISSIONS =====
    setPermissions(path, permissions) {
        const node = this.resolvePath(path);
        if (!node) {
            throw new Error(`Path not found: ${path}`);
        }
        
        // Validate permissions format (e.g., 'rwxr-xr-x')
        if (!/^[r-][w-][x-][r-][w-][x-][r-][w-][x-]$/.test(permissions)) {
            throw new Error(`Invalid permissions format: ${permissions}`);
        }
        
        node.permissions = permissions;
        node.modified = new Date();
        this.saveToDB();
        return true;
    }

    getPermissions(path) {
        const node = this.resolvePath(path);
        if (!node) {
            throw new Error(`Path not found: ${path}`);
        }
        
        return node.permissions || (node.type === 'directory' ? 'drwxr-xr-x' : '-rw-r--r--');
    }

    // ===== NAVIGATION =====
    cd(path) {
        const normalized = this.normalizePath(path);
        const node = this.resolvePath(normalized);
        
        if (!node) {
            throw new Error(`Directory not found: ${path}`);
        }
        
        if (node.type !== 'directory') {
            throw new Error(`Not a directory: ${path}`);
        }
        
        this.currentPath = normalized;
        return this.currentPath;
    }

    pwd() {
        return this.currentPath;
    }

    // ===== SEARCH =====
    find(startPath, pattern) {
        const normalized = this.normalizePath(startPath);
        const startNode = this.resolvePath(normalized);
        
        if (!startNode || startNode.type !== 'directory') {
            throw new Error(`Invalid start path: ${startPath}`);
        }
        
        const results = [];
        const regex = new RegExp(pattern);
        
        const search = (node, currentPath) => {
            for (const [name, child] of Object.entries(node.children)) {
                const childPath = this.joinPaths(currentPath, name);
                
                if (regex.test(name)) {
                    results.push({
                        path: childPath,
                        type: child.type,
                        size: child.size || 0,
                        modified: child.modified
                    });
                }
                
                if (child.type === 'directory') {
                    search(child, childPath);
                }
            }
        };
        
        search(startNode, normalized);
        return results;
    }

    // ===== BACKUP & RESTORE =====
    exportFilesystem() {
        return JSON.stringify(this.root, (key, value) => {
            if (key === 'created' || key === 'modified') {
                return value.toISOString();
            }
            return value;
        }, 2);
    }

    importFilesystem(json) {
        const data = JSON.parse(json, (key, value) => {
            if (key === 'created' || key === 'modified') {
                return new Date(value);
            }
            return value;
        });
        
        this.root = data;
        this.saveToDB();
        return true;
    }

    // ===== DISPLAY FORMATTING =====
    formatList(items, showAll = false, longFormat = false) {
        if (items.length === 0) return '';
        
        if (!longFormat) {
            // Simple list
            return items.map(item => item.name).join('  ');
        }
        
        // Long format like ls -l
        const lines = [];
        
        for (const item of items) {
            if (!showAll && item.name.startsWith('.')) continue;
            
            const typeChar = item.type === 'directory' ? 'd' : '-';
            const perms = item.permissions || (item.type === 'directory' ? 'drwxr-xr-x' : '-rw-r--r--');
            const size = item.size.toString().padStart(8);
            const date = item.modified.toLocaleDateString();
            const time = item.modified.toLocaleTimeString().slice(0, 5);
            
            lines.push(`${typeChar}${perms} ${size} ${date} ${time} ${item.name}`);
        }
        
        return lines.join('\n');
    }
}

// Create global instance
const VFS = new VirtualFileSystem();

// Export for use in other modules
window.VFS = VFS;
console.log('✅ Virtual Filesystem initialized');

// Auto-initialize if loaded standalone
if (!window.OS) {
    console.log('💾 VFS running in standalone mode');
    
    // Test the filesystem
    setTimeout(() => {
        console.log('Testing VFS...');
        console.log('Current path:', VFS.pwd());
        console.log('Listing home:', VFS.list('/home/guest'));
        console.log('Reading welcome file:', VFS.readFile('/home/guest/welcome.txt').substring(0, 50) + '...');
    }, 100);
}

window.VFS = VFS;