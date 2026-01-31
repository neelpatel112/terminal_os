// ===== FILE MANAGER APPLICATION =====
console.log('📁 Initializing File Manager...');

class FileManager {
    constructor() {
        this.name = 'files';
        this.version = '1.0.0';
        this.currentPath = '/home/guest';
        this.selectedFiles = new Set();
        this.clipboard = null;
        this.windowId = null;
        this.cliCommands = {};
        this.initCLICommands();
        this.initSampleFiles();
    }

    initCLICommands() {
        this.cliCommands = {
            'files': {
                description: 'Open file manager',
                handler: () => this.handleCLIOpen()
            },
            'explorer': {
                description: 'Open file explorer',
                handler: () => this.handleCLIOpen()
            },
            'open': {
                description: 'Open a file or directory',
                handler: (args) => this.handleCLIOpenPath(args)
            }
        };
    }

    initSampleFiles() {
        // Sample file structure
        this.fileSystem = {
            '/home/guest': {
                type: 'directory',
                children: {
                    'documents': {
                        type: 'directory',
                        children: {
                            'notes.md': {
                                type: 'file',
                                content: '# Meeting Notes\n\nImportant points...',
                                size: 1024,
                                modified: new Date()
                            },
                            'project.txt': {
                                type: 'file',
                                content: 'Project requirements...',
                                size: 2048,
                                modified: new Date(Date.now() - 86400000)
                            }
                        }
                    },
                    'downloads': {
                        type: 'directory',
                        children: {
                            'archive.zip': {
                                type: 'file',
                                content: 'Compressed archive',
                                size: 5120000,
                                modified: new Date(Date.now() - 172800000)
                            }
                        }
                    },
                    'pictures': {
                        type: 'directory',
                        children: {
                            'screenshot.png': {
                                type: 'file',
                                content: 'Image data',
                                size: 1024000,
                                modified: new Date(Date.now() - 259200000)
                            }
                        }
                    },
                    'welcome.txt': {
                        type: 'file',
                        content: 'Welcome to TerminalFirst OS!',
                        size: 512,
                        modified: new Date()
                    },
                    'todo.md': {
                        type: 'file',
                        content: '# TODO\n\n- Organize files\n- Backup data\n- Clean downloads',
                        size: 768,
                        modified: new Date(Date.now() - 43200000)
                    },
                    '.config.json': {
                        type: 'file',
                        content: '{"theme":"dark"}',
                        size: 256,
                        modified: new Date()
                    }
                }
            }
        };
    }

    // ===== GUI METHODS =====
    launch() {
        if (window.windowManager) {
            this.windowId = window.windowManager.createWindow('files', {
                title: 'File Manager',
                width: 900,
                height: 600
            });
            
            this.initFileManagerUI();
            console.log('✅ File Manager launched');
            return this.windowId;
        }
        return null;
    }

    initFileManagerUI() {
        const windowInfo = window.windowManager?.getWindowById(this.windowId);
        if (!windowInfo) return;
        
        const fileman = windowInfo.element;
        
        // Get UI elements
        const sidebar = fileman.querySelector('.sidebar');
        const pathBar = fileman.querySelector('.path-bar .current-path');
        const fileList = fileman.querySelector('.file-list');
        
        if (!sidebar || !pathBar || !fileList) return;
        
        // Setup sidebar
        this.setupSidebar(sidebar, pathBar, fileList);
        
        // Setup file list
        this.refreshFileList(fileList);
        
        // Setup path bar
        this.updatePathBar(pathBar);
        
        // Setup context menu
        this.setupContextMenu(fileList);
        
        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts(fileList);
    }

    setupSidebar(sidebar, pathBar, fileList) {
        const places = [
            { name: 'Home', path: '/home/guest', icon: 'fas fa-home' },
            { name: 'Desktop', path: '/home/guest/desktop', icon: 'fas fa-desktop' },
            { name: 'Documents', path: '/home/guest/documents', icon: 'fas fa-file' },
            { name: 'Downloads', path: '/home/guest/downloads', icon: 'fas fa-download' },
            { name: 'Pictures', path: '/home/guest/pictures', icon: 'fas fa-image' },
            { name: 'Music', path: '/home/guest/music', icon: 'fas fa-music' },
            { name: 'Trash', path: '/trash', icon: 'fas fa-trash' }
        ];
        
        sidebar.innerHTML = `
            <h4 style="margin-bottom: 10px; color: var(--text-secondary); padding: 0 5px;">
                <i class="fas fa-bookmark"></i> Places
            </h4>
            ${places.map(place => `
                <div class="sidebar-item ${this.currentPath === place.path ? 'active' : ''}" 
                     data-path="${place.path}"
                     style="padding: 8px 12px; margin: 2px 0; cursor: pointer; border-radius: 4px; 
                            display: flex; align-items: center; gap: 10px; 
                            ${this.currentPath === place.path ? 'background: var(--accent-primary); color: white;' : ''}">
                    <i class="${place.icon}"></i>
                    <span>${place.name}</span>
                </div>
            `).join('')}
            
            <div style="margin-top: 20px; padding: 0 5px;">
                <h4 style="margin-bottom: 10px; color: var(--text-secondary);">
                    <i class="fas fa-chart-pie"></i> Storage
                </h4>
                <div style="font-size: 0.9em;">
                    <div>Used: 1.2 GB / 10 GB</div>
                    <div style="height: 4px; background: var(--bg-tertiary); border-radius: 2px; margin: 5px 0;">
                        <div style="width: 12%; height: 100%; background: var(--accent-primary); border-radius: 2px;"></div>
                    </div>
                    <div style="color: var(--text-secondary);">12% used</div>
                </div>
            </div>
            
            <div style="margin-top: 20px; padding: 0 5px;">
                <button id="new-folder-btn" style="width: 100%; padding: 8px; background: var(--accent-primary); 
                        color: white; border: none; border-radius: 4px; cursor: pointer; display: flex; 
                        align-items: center; justify-content: center; gap: 8px;">
                    <i class="fas fa-folder-plus"></i> New Folder
                </button>
            </div>
        `;
        
        // Handle sidebar item clicks
        sidebar.querySelectorAll('.sidebar-item').forEach(item => {
            item.addEventListener('click', () => {
                const path = item.dataset.path;
                this.navigateTo(path, pathBar, fileList);
            });
        });
        
        // New folder button
        const newFolderBtn = sidebar.querySelector('#new-folder-btn');
        if (newFolderBtn) {
            newFolderBtn.addEventListener('click', () => {
                this.createNewFolder(fileList);
            });
        }
    }

    refreshFileList(fileList) {
        const files = this.getCurrentDirectoryContents();
        
        fileList.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 15px; padding: 10px;">
                ${files.map(file => this.createFileItem(file)).join('')}
            </div>
        `;
        
        // Add click handlers to file items
        fileList.querySelectorAll('.file-item').forEach(item => {
            const fileName = item.dataset.name;
            const fileType = item.dataset.type;
            
            // Single click to select
            item.addEventListener('click', (e) => {
                if (!e.ctrlKey && !e.shiftKey) {
                    this.selectedFiles.clear();
                }
                this.selectedFiles.add(fileName);
                this.updateFileSelection(fileList);
                
                // Double click to open
                if (e.detail === 2) {
                    this.openFile(fileName, fileType);
                }
            });
            
            // Right click for context menu
            item.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                if (!this.selectedFiles.has(fileName)) {
                    this.selectedFiles.clear();
                    this.selectedFiles.add(fileName);
                    this.updateFileSelection(fileList);
                }
                this.showFileContextMenu(e.clientX, e.clientY, fileName, fileType);
            });
        });
    }

    createFileItem(file) {
        const icon = file.type === 'directory' ? 
            `<i class="fas fa-folder" style="color: var(--accent-warning);"></i>` :
            this.getFileIcon(file.name);
        
        const size = file.type === 'directory' ? '' : this.formatFileSize(file.size);
        const modified = this.formatDate(file.modified);
        
        return `
            <div class="file-item" data-name="${file.name}" data-type="${file.type}"
                 style="padding: 15px; text-align: center; cursor: pointer; border-radius: 8px; 
                        background: var(--bg-tertiary); border: 2px solid transparent;">
                <div style="font-size: 2em; margin-bottom: 10px;">${icon}</div>
                <div style="font-weight: 500; margin-bottom: 5px; word-break: break-all;">${file.name}</div>
                ${size ? `<div style="font-size: 0.8em; color: var(--text-secondary); margin-bottom: 3px;">${size}</div>` : ''}
                <div style="font-size: 0.7em; color: var(--text-secondary);">${modified}</div>
            </div>
        `;
    }

    getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        
        const iconMap = {
            'txt': 'fas fa-file-alt',
            'md': 'fas fa-file-alt',
            'pdf': 'fas fa-file-pdf',
            'jpg': 'fas fa-file-image',
            'png': 'fas fa-file-image',
            'gif': 'fas fa-file-image',
            'zip': 'fas fa-file-archive',
            'js': 'fas fa-file-code',
            'json': 'fas fa-file-code',
            'html': 'fas fa-file-code',
            'css': 'fas fa-file-code',
            'py': 'fas fa-file-code'
        };
        
        const iconClass = iconMap[ext] || 'fas fa-file';
        const color = iconClass.includes('code') ? 'var(--accent-secondary)' : 
                     iconClass.includes('image') ? 'var(--accent-danger)' :
                     iconClass.includes('pdf') ? 'var(--accent-danger)' : 'var(--text-secondary)';
        
        return `<i class="${iconClass}" style="color: ${color};"></i>`;
    }

    getCurrentDirectoryContents() {
        const pathParts = this.currentPath.split('/').filter(p => p);
        let current = this.fileSystem;
        
        for (const part of pathParts) {
            if (current[part] && current[part].children) {
                current = current[part].children;
            } else {
                return [];
            }
        }
        
        const files = [];
        
        // Add parent directory entry (except for root)
        if (this.currentPath !== '/home/guest') {
            files.push({
                name: '..',
                type: 'directory',
                size: 0,
                modified: new Date()
            });
        }
        
        // Add files and directories
        for (const [name, info] of Object.entries(current)) {
            files.push({
                name,
                type: info.type,
                size: info.size || 0,
                modified: info.modified || new Date()
            });
        }
        
        // Sort: directories first, then alphabetically
        return files.sort((a, b) => {
            if (a.type === 'directory' && b.type !== 'directory') return -1;
            if (a.type !== 'directory' && b.type === 'directory') return 1;
            return a.name.localeCompare(b.name);
        });
    }

    updateFileSelection(fileList) {
        fileList.querySelectorAll('.file-item').forEach(item => {
            const fileName = item.dataset.name;
            if (this.selectedFiles.has(fileName)) {
                item.style.borderColor = 'var(--accent-primary)';
                item.style.background = 'var(--bg-primary)';
            } else {
                item.style.borderColor = 'transparent';
                item.style.background = 'var(--bg-tertiary)';
            }
        });
    }

    navigateTo(path, pathBar, fileList) {
        // Validate path exists
        const pathParts = path.split('/').filter(p => p);
        let current = this.fileSystem;
        let valid = true;
        
        for (const part of pathParts) {
            if (current[part]) {
                if (current[part].children) {
                    current = current[part].children;
                }
            } else {
                valid = false;
                break;
            }
        }
        
        if (valid || path === '/home/guest') {
            this.currentPath = path;
            this.selectedFiles.clear();
            this.refreshFileList(fileList);
            this.updatePathBar(pathBar);
            this.updateSidebarSelection();
        } else {
            if (window.showNotification) {
                window.showNotification({
                    title: 'Navigation Error',
                    message: `Cannot access: ${path}`,
                    type: 'error'
                });
            }
        }
    }

    updatePathBar(pathBar) {
        if (pathBar) {
            pathBar.textContent = this.currentPath;
        }
    }

    updateSidebarSelection() {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;
        
        sidebar.querySelectorAll('.sidebar-item').forEach(item => {
            if (item.dataset.path === this.currentPath) {
                item.classList.add('active');
                item.style.background = 'var(--accent-primary)';
                item.style.color = 'white';
            } else {
                item.classList.remove('active');
                item.style.background = '';
                item.style.color = '';
            }
        });
    }

    // ===== FILE OPERATIONS =====
    openFile(filename, fileType) {
        if (filename === '..') {
            // Navigate up
            const pathParts = this.currentPath.split('/').filter(p => p);
            pathParts.pop();
            const newPath = '/' + pathParts.join('/') || '/home/guest';
            
            const windowInfo = window.windowManager?.getWindowById(this.windowId);
            if (windowInfo) {
                const pathBar = windowInfo.element.querySelector('.path-bar .current-path');
                const fileList = windowInfo.element.querySelector('.file-list');
                this.navigateTo(newPath, pathBar, fileList);
            }
            return;
        }
        
        if (fileType === 'directory') {
            // Navigate into directory
            const newPath = this.currentPath === '/' ? 
                `/${filename}` : `${this.currentPath}/${filename}`;
            
            const windowInfo = window.windowManager?.getWindowById(this.windowId);
            if (windowInfo) {
                const pathBar = windowInfo.element.querySelector('.path-bar .current-path');
                const fileList = windowInfo.element.querySelector('.file-list');
                this.navigateTo(newPath, pathBar, fileList);
            }
        } else {
            // Open file in appropriate application
            if (filename.endsWith('.txt') || filename.endsWith('.md') || filename.endsWith('.json')) {
                // Open in text editor
                if (window.textEditor) {
                    window.textEditor.launch();
                    setTimeout(() => {
                        const fullPath = `${this.currentPath}/${filename}`;
                        if (window.textEditor.handleCLIEdit) {
                            window.textEditor.handleCLIEdit([fullPath]);
                        }
                    }, 500);
                }
            } else {
                // Show file info
                if (window.showNotification) {
                    window.showNotification({
                        title: 'Open File',
                        message: `Opening ${filename}...`,
                        type: 'info'
                    });
                }
            }
        }
    }

    createNewFolder(fileList) {
        const folderName = prompt('Enter folder name:', 'New Folder');
        if (!folderName) return;
        
        // Add to current directory
        const pathParts = this.currentPath.split('/').filter(p => p);
        let current = this.fileSystem;
        
        for (const part of pathParts) {
            if (current[part]) {
                current = current[part].children;
            }
        }
        
        current[folderName] = {
            type: 'directory',
            children: {},
            modified: new Date()
        };
        
        this.refreshFileList(fileList);
        
        if (window.showNotification) {
            window.showNotification({
                title: 'Folder Created',
                message: `Created: ${folderName}`,
                type: 'success'
            });
        }
    }

    deleteSelectedFiles() {
        if (this.selectedFiles.size === 0) return;
        
        const fileList = this.getFileListElement();
        if (!fileList) return;
        
        const confirmMessage = this.selectedFiles.size === 1 ?
            `Delete "${Array.from(this.selectedFiles)[0]}"?` :
            `Delete ${this.selectedFiles.size} selected items?`;
        
        if (!confirm(confirmMessage + '\nThis action cannot be undone.')) {
            return;
        }
        
        const pathParts = this.currentPath.split('/').filter(p => p);
        let current = this.fileSystem;
        
        for (const part of pathParts) {
            if (current[part]) {
                current = current[part].children;
            }
        }
        
        // Delete files
        for (const filename of this.selectedFiles) {
            if (current[filename] && filename !== '..') {
                delete current[filename];
            }
        }
        
        this.selectedFiles.clear();
        this.refreshFileList(fileList);
        
        if (window.showNotification) {
            window.showNotification({
                title: 'Files Deleted',
                message: `Deleted ${this.selectedFiles.size} items`,
                type: 'warning'
            });
        }
    }

    renameFile(oldName, newName) {
        if (!newName || oldName === newName) return;
        
        const pathParts = this.currentPath.split('/').filter(p => p);
        let current = this.fileSystem;
        
        for (const part of pathParts) {
            if (current[part]) {
                current = current[part].children;
            }
        }
        
        if (current[oldName]) {
            current[newName] = { ...current[oldName] };
            delete current[oldName];
            current[newName].modified = new Date();
            
            const fileList = this.getFileListElement();
            if (fileList) {
                this.refreshFileList(fileList);
            }
            
            if (window.showNotification) {
                window.showNotification({
                    title: 'File Renamed',
                    message: `Renamed "${oldName}" to "${newName}"`,
                    type: 'success'
                });
            }
        }
    }

    copySelectedFiles() {
        if (this.selectedFiles.size === 0) return;
        
        const pathParts = this.currentPath.split('/').filter(p => p);
        let current = this.fileSystem;
        
        for (const part of pathParts) {
            if (current[part]) {
                current = current[part].children;
            }
        }
        
        this.clipboard = {
            operation: 'copy',
            files: Array.from(this.selectedFiles).map(name => ({
                name,
                data: current[name] ? JSON.parse(JSON.stringify(current[name])) : null
            })),
            sourcePath: this.currentPath
        };
        
        if (window.showNotification) {
            window.showNotification({
                title: 'Files Copied',
                message: `Copied ${this.selectedFiles.size} items to clipboard`,
                type: 'info'
            });
        }
    }

    cutSelectedFiles() {
        if (this.selectedFiles.size === 0) return;
        
        const pathParts = this.currentPath.split('/').filter(p => p);
        let current = this.fileSystem;
        
        for (const part of pathParts) {
            if (current[part]) {
                current = current[part].children;
            }
        }
        
        this.clipboard = {
            operation: 'cut',
            files: Array.from(this.selectedFiles).map(name => ({
                name,
                data: current[name] ? JSON.parse(JSON.stringify(current[name])) : null
            })),
            sourcePath: this.currentPath
        };
        
        if (window.showNotification) {
            window.showNotification({
                title: 'Files Cut',
                message: `Cut ${this.selectedFiles.size} items`,
                type: 'info'
            });
        }
    }

    pasteFiles() {
        if (!this.clipboard) return;
        
        const pathParts = this.currentPath.split('/').filter(p => p);
        let current = this.fileSystem;
        
        for (const part of pathParts) {
            if (current[part]) {
                current = current[part].children;
            }
        }
        
        let pasteCount = 0;
        
        for (const file of this.clipboard.files) {
            if (file.data) {
                // Check if file already exists
                if (current[file.name]) {
                    const newName = prompt(`"${file.name}" already exists. Enter new name:`, file.name);
                    if (newName && newName !== file.name) {
                        current[newName] = file.data;
                        current[newName].modified = new Date();
                        pasteCount++;
                    }
                } else {
                    current[file.name] = file.data;
                    current[file.name].modified = new Date();
                    pasteCount++;
                }
                
                // If cut operation, remove from source
                if (this.clipboard.operation === 'cut' && this.clipboard.sourcePath === this.currentPath) {
                    // Don't remove from current directory during paste
                }
            }
        }
        
        // If cut operation and different directory, remove from source
        if (this.clipboard.operation === 'cut' && this.clipboard.sourcePath !== this.currentPath) {
            const sourcePathParts = this.clipboard.sourcePath.split('/').filter(p => p);
            let source = this.fileSystem;
            
            for (const part of sourcePathParts) {
                if (source[part]) {
                    source = source[part].children;
                }
            }
            
            for (const file of this.clipboard.files) {
                delete source[file.name];
            }
        }
        
        const fileList = this.getFileListElement();
        if (fileList) {
            this.refreshFileList(fileList);
        }
        
        if (window.showNotification) {
            window.showNotification({
                title: 'Files Pasted',
                message: `Pasted ${pasteCount} items`,
                type: 'success'
            });
        }
        
        // Clear clipboard after paste for cut operation
        if (this.clipboard.operation === 'cut') {
            this.clipboard = null;
        }
    }

    showFileProperties(filename) {
        const pathParts = this.currentPath.split('/').filter(p => p);
        let current = this.fileSystem;
        
        for (const part of pathParts) {
            if (current[part]) {
                current = current[part].children;
            }
        }
        
        const file = current[filename];
        if (!file) return;
        
        const dialog = document.createElement('div');
        dialog.className = 'properties-dialog';
        dialog.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 20px;
            box-shadow: var(--shadow-heavy);
            z-index: 10001;
            min-width: 400px;
        `;
        
        const icon = file.type === 'directory' ? 
            '<i class="fas fa-folder" style="color: var(--accent-warning); font-size: 3em;"></i>' :
            this.getFileIcon(filename).replace('1em', '3em');
        
        dialog.innerHTML = `
            <h3 style="margin-bottom: 15px; color: var(--accent-primary); display: flex; align-items: center; gap: 10px;">
                ${icon}
                <span>${filename}</span>
            </h3>
            
            <div style="margin-bottom: 15px;">
                <div style="display: grid; grid-template-columns: 120px 1fr; gap: 10px; margin-bottom: 5px;">
                    <div style="color: var(--text-secondary);">Type:</div>
                    <div>${file.type === 'directory' ? 'Folder' : 'File'}</div>
                    
                    <div style="color: var(--text-secondary);">Size:</div>
                    <div>${this.formatFileSize(file.size || 0)}</div>
                    
                    <div style="color: var(--text-secondary);">Modified:</div>
                    <div>${this.formatDate(file.modified || new Date())}</div>
                    
                    <div style="color: var(--text-secondary);">Location:</div>
                    <div>${this.currentPath}</div>
                </div>
            </div>
            
            <div style="display: flex; justify-content: flex-end; gap: 10px;">
                <button class="dialog-btn close" style="padding: 8px 16px; border: 1px solid var(--border-color); 
                        background: transparent; border-radius: 4px; cursor: pointer;">Close</button>
            </div>
        `;
        
        const filemanWindow = window.windowManager?.getWindowById(this.windowId)?.element;
        if (filemanWindow) {
            filemanWindow.appendChild(dialog);
            
            dialog.querySelector('.close').addEventListener('click', () => {
                dialog.remove();
            });
            
            // Close on escape
            const closeOnEscape = (e) => {
                if (e.key === 'Escape') {
                    dialog.remove();
                    document.removeEventListener('keydown', closeOnEscape);
                }
            };
            document.addEventListener('keydown', closeOnEscape);
        }
    }

    // ===== CONTEXT MENU =====
    setupContextMenu(fileList) {
        // Context menu will be created dynamically
    }

    showFileContextMenu(x, y, filename, fileType) {
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            box-shadow: var(--shadow-heavy);
            z-index: 10000;
            min-width: 200px;
            padding: 5px 0;
        `;
        
        const isDirectory = fileType === 'directory';
        const hasSelection = this.selectedFiles.size > 0;
        const canPaste = this.clipboard !== null;
        
        menu.innerHTML = `
            ${!hasSelection ? `
                <div class="context-item" data-action="open">
                    <i class="fas fa-folder-open"></i> Open
                </div>
            ` : ''}
            
            ${hasSelection ? `
                <div class="context-item" data-action="open-selected">
                    <i class="fas fa-folder-open"></i> Open Selected
                </div>
            ` : ''}
            
            <div class="context-item" data-action="rename">
                <i class="fas fa-i-cursor"></i> Rename
            </div>
            
            <div class="divider"></div>
            
            <div class="context-item" data-action="copy">
                <i class="fas fa-copy"></i> Copy
            </div>
            
            <div class="context-item" data-action="cut">
                <i class="fas fa-cut"></i> Cut
            </div>
            
            <div class="context-item" data-action="paste" ${!canPaste ? 'style="opacity: 0.5;"' : ''}>
                <i class="fas fa-paste"></i> Paste
            </div>
            
            <div class="divider"></div>
            
            <div class="context-item" data-action="delete" style="color: var(--accent-danger);">
                <i class="fas fa-trash"></i> Delete
            </div>
            
            <div class="divider"></div>
            
            <div class="context-item" data-action="properties">
                <i class="fas fa-info-circle"></i> Properties
            </div>
        `;
        
        document.body.appendChild(menu);
        
        // Style context items
        menu.querySelectorAll('.context-item').forEach(item => {
            item.style.cssText = `
                padding: 8px 15px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 0.9em;
            `;
            item.addEventListener('mouseenter', () => {
                if (!item.style.opacity || item.style.opacity !== '0.5') {
                    item.style.background = 'var(--accent-primary)';
                    item.style.color = 'white';
                }
            });
            item.addEventListener('mouseleave', () => {
                item.style.background = 'transparent';
                item.style.color = '';
            });
        });
        
        menu.querySelectorAll('.divider').forEach(div => {
            div.style.cssText = `
                height: 1px;
                background: var(--border-color);
                margin: 5px 0;
            `;
        });
        
        // Handle actions
        menu.addEventListener('click', (e) => {
            const action = e.target.closest('.context-item')?.dataset.action;
            if (action) {
                this.handleContextAction(action, filename, fileType);
            }
            menu.remove();
        });
        
        // Remove menu when clicking elsewhere
        setTimeout(() => {
            const removeMenu = (e) => {
                if (!menu.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', removeMenu);
                }
            };
            document.addEventListener('click', removeMenu);
        }, 10);
    }

    handleContextAction(action, filename, fileType) {
        const fileList = this.getFileListElement();
        
        switch(action) {
            case 'open':
                this.openFile(filename, fileType);
                break;
                
            case 'open-selected':
                if (this.selectedFiles.size === 1) {
                    const singleFile = Array.from(this.selectedFiles)[0];
                    // Determine file type
                    const pathParts = this.currentPath.split('/').filter(p => p);
                    let current = this.fileSystem;
                    for (const part of pathParts) {
                        if (current[part]) {
                            current = current[part].children;
                        }
                    }
                    const file = current[singleFile];
                    this.openFile(singleFile, file?.type || 'file');
                }
                break;
                
            case 'rename':
                const newName = prompt('Enter new name:', filename);
                if (newName) {
                    this.renameFile(filename, newName);
                }
                break;
                
            case 'copy':
                this.copySelectedFiles();
                break;
                
            case 'cut':
                this.cutSelectedFiles();
                break;
                
            case 'paste':
                if (this.clipboard) {
                    this.pasteFiles();
                }
                break;
                
            case 'delete':
                this.deleteSelectedFiles();
                break;
                
            case 'properties':
                this.showFileProperties(filename);
                break;
        }
    }

    // ===== KEYBOARD SHORTCUTS =====
    setupKeyboardShortcuts(fileList) {
        document.addEventListener('keydown', (e) => {
            const isFileManagerActive = window.windowManager?.getWindowById(this.windowId)?.element?.classList.contains('active-window');
            if (!isFileManagerActive) return;
            
            switch(e.key) {
                case 'F5':
                    e.preventDefault();
                    this.refreshFileList(fileList);
                    break;
                    
                case 'Delete':
                    e.preventDefault();
                    this.deleteSelectedFiles();
                    break;
                    
                case 'F2':
                    e.preventDefault();
                    if (this.selectedFiles.size === 1) {
                        const filename = Array.from(this.selectedFiles)[0];
                        const newName = prompt('Rename file:', filename);
                        if (newName) {
                            this.renameFile(filename, newName);
                        }
                    }
                    break;
                    
                case 'c':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.copySelectedFiles();
                    }
                    break;
                    
                case 'x':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.cutSelectedFiles();
                    }
                    break;
                    
                case 'v':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.pasteFiles();
                    }
                    break;
                    
                case 'a':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        const files = this.getCurrentDirectoryContents();
                        this.selectedFiles = new Set(files.map(f => f.name).filter(n => n !== '..'));
                        this.updateFileSelection(fileList);
                    }
                    break;
            }
        });
    }

    getFileListElement() {
        const windowInfo = window.windowManager?.getWindowById(this.windowId);
        return windowInfo?.element.querySelector('.file-list');
    }

    // ===== UTILITIES =====
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    formatDate(date) {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
        
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Today, ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return date.toLocaleDateString([], { weekday: 'short' });
        } else {
            return date.toLocaleDateString();
        }
    }

    // ===== CLI HANDLERS =====
    handleCLIOpen() {
        this.launch();
        return 'Opening file manager...';
    }

    handleCLIOpenPath(args) {
        if (args.length === 0) {
            return 'Usage: open [path]\nOpens a file or directory';
        }
        
        const path = args[0];
        this.launch();
        
        setTimeout(() => {
            const windowInfo = window.windowManager?.getWindowById(this.windowId);
            if (windowInfo) {
                const pathBar = windowInfo.element.querySelector('.path-bar .current-path');
                const fileList = windowInfo.element.querySelector('.file-list');
                this.navigateTo(path, pathBar, fileList);
            }
        }, 500);
        
        return `Opening: ${path}`;
    }

    // ===== PUBLIC API =====
    getCLICommands() {
        return this.cliCommands;
    }

    isOpen() {
        return this.windowId !== null;
    }

    close() {
        if (this.windowId) {
            window.windowManager?.closeWindow(this.windowId);
            this.windowId = null;
        }
    }

    // ===== CLEANUP =====
    cleanup() {
        this.close();
        console.log('🧹 File Manager cleaned up');
    }
}

// Create global instance
const fileManager = new FileManager();

// Export for use in other modules
window.fileManager = fileManager;

// Register CLI commands
if (window.TFSH) {
    Object.entries(fileManager.getCLICommands()).forEach(([cmd, info]) => {
        window.TFSH.registerCommand(cmd, info.handler, info.description);
    });
}

// Auto-launch for demo
setTimeout(() => {
    console.log('📁 File Manager ready. Use "run files" or "files" to launch.');
}, 1000);

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    fileManager.cleanup();
});

window.fileManager = fileManager;