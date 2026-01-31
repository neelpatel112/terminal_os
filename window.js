// ===== WINDOW MANAGER =====
console.log('🪟 Initializing Window Manager...');

class WindowManager {
    constructor() {
        this.windows = new Map();
        this.windowCounter = 1;
        this.zIndex = 100;
        this.activeWindow = null;
        this.windowTemplates = new Map();
        this.initWindowTemplates();
    }

    initWindowTemplates() {
        // Terminal window template
        this.windowTemplates.set('terminal', {
            title: 'Terminal',
            icon: 'fas fa-terminal',
            width: 800,
            height: 500,
            minWidth: 400,
            minHeight: 300,
            resizable: true,
            content: `
                <div class="window-content">
                    <div class="terminal-output" style="flex: 1; overflow-y: auto; margin-bottom: 10px;"></div>
                    <div class="terminal-input-line">
                        <span class="prompt">tfsh ></span>
                        <input type="text" class="terminal-input" placeholder="Type command...">
                    </div>
                </div>
            `
        });

        // Editor window template
        this.windowTemplates.set('editor', {
            title: 'Text Editor',
            icon: 'fas fa-file-code',
            width: 700,
            height: 600,
            minWidth: 400,
            minHeight: 300,
            resizable: true,
            content: `
                <div class="window-content" style="padding: 0; display: flex; flex-direction: column;">
                    <div class="editor-toolbar" style="padding: 10px; background: var(--bg-tertiary); border-bottom: 1px solid var(--border-color);">
                        <button class="toolbar-btn" data-action="new"><i class="fas fa-file"></i></button>
                        <button class="toolbar-btn" data-action="open"><i class="fas fa-folder-open"></i></button>
                        <button class="toolbar-btn" data-action="save"><i class="fas fa-save"></i></button>
                        <div style="flex: 1;"></div>
                        <button class="toolbar-btn" data-action="run"><i class="fas fa-play"></i></button>
                    </div>
                    <textarea class="editor-textarea" style="flex: 1; border: none; padding: 15px; font-family: 'JetBrains Mono', monospace; resize: none; outline: none; background: var(--bg-secondary); color: var(--text-primary);"></textarea>
                </div>
            `
        });

        // File manager window template
        this.windowTemplates.set('files', {
            title: 'File Manager',
            icon: 'fas fa-folder',
            width: 800,
            height: 500,
            minWidth: 400,
            minHeight: 300,
            resizable: true,
            content: `
                <div class="window-content" style="padding: 0; display: flex;">
                    <div class="sidebar" style="width: 200px; border-right: 1px solid var(--border-color); padding: 15px;">
                        <h4 style="margin-bottom: 10px; color: var(--text-secondary);">Places</h4>
                        <div class="sidebar-item active" data-path="/home/guest">Home</div>
                        <div class="sidebar-item" data-path="/">Root</div>
                        <div class="sidebar-item" data-path="/documents">Documents</div>
                        <div class="sidebar-item" data-path="/downloads">Downloads</div>
                        <div class="sidebar-item" data-path="/pictures">Pictures</div>
                    </div>
                    <div style="flex: 1; padding: 15px;">
                        <div class="path-bar" style="margin-bottom: 15px; padding: 5px 10px; background: var(--bg-tertiary); border-radius: 4px;">
                            <span class="current-path">/home/guest</span>
                        </div>
                        <div class="file-list" style="height: calc(100% - 50px); overflow-y: auto;"></div>
                    </div>
                </div>
            `
        });

        // Settings window template
        this.windowTemplates.set('settings', {
            title: 'Settings',
            icon: 'fas fa-cog',
            width: 700,
            height: 500,
            minWidth: 500,
            minHeight: 400,
            resizable: false,
            content: `
                <div class="window-content" style="padding: 0; display: flex;">
                    <div class="settings-sidebar" style="width: 200px; border-right: 1px solid var(--border-color); padding: 15px;">
                        <div class="settings-category active" data-category="appearance">Appearance</div>
                        <div class="settings-category" data-category="system">System</div>
                        <div class="settings-category" data-category="terminal">Terminal</div>
                        <div class="settings-category" data-category="apps">Applications</div>
                        <div class="settings-category" data-category="about">About</div>
                    </div>
                    <div class="settings-content" style="flex: 1; padding: 20px; overflow-y: auto;"></div>
                </div>
            `
        });
    }

    createWindow(type, options = {}) {
        const template = this.windowTemplates.get(type);
        if (!template) {
            throw new Error(`Window template not found: ${type}`);
        }

        const windowId = `window-${this.windowCounter++}`;
        
        // Create window element
        const windowElement = document.createElement('div');
        windowElement.className = 'window';
        windowElement.id = windowId;
        windowElement.dataset.windowType = type;
        
        // Apply options
        const config = { ...template, ...options };
        
        // Set position (cascade)
        const cascadeOffset = (this.windows.size * 30) % 300;
        const left = 100 + cascadeOffset;
        const top = 100 + cascadeOffset;
        
        windowElement.style.cssText = `
            position: absolute;
            left: ${left}px;
            top: ${top}px;
            width: ${config.width}px;
            height: ${config.height}px;
            z-index: ${this.zIndex++};
        `;
        
        // Create window HTML
        windowElement.innerHTML = `
            <div class="window-header">
                <div class="window-title">
                    <i class="${config.icon}"></i>
                    <span>${config.title}</span>
                </div>
                <div class="window-controls">
                    <button class="win-btn minimize"><i class="fas fa-minus"></i></button>
                    <button class="win-btn maximize"><i class="fas fa-expand-alt"></i></button>
                    <button class="win-btn close"><i class="fas fa-times"></i></button>
                </div>
            </div>
            ${config.content}
        `;
        
        // Add to desktop
        const desktop = document.getElementById('desktop') || document.body;
        desktop.appendChild(windowElement);
        
        // Initialize window functionality
        this.initWindowFunctionality(windowElement, windowId, config);
        
        // Store window info
        this.windows.set(windowId, {
            id: windowId,
            element: windowElement,
            type: type,
            config: config,
            state: 'normal', // normal, minimized, maximized
            position: { left, top },
            size: { width: config.width, height: config.height }
        });
        
        // Make it active
        this.focusWindow(windowId);
        
        console.log(`✅ Created window: ${type} (${windowId})`);
        
        // Add to taskbar
        this.addToTaskbar(windowId, config.title);
        
        return windowId;
    }

    initWindowFunctionality(windowElement, windowId, config) {
        // Make draggable
        this.makeDraggable(windowElement, windowId);
        
        // Make resizable if enabled
        if (config.resizable) {
            this.makeResizable(windowElement, windowId, config.minWidth, config.minHeight);
        }
        
        // Window controls
        const header = windowElement.querySelector('.window-header');
        const minimizeBtn = windowElement.querySelector('.win-btn.minimize');
        const maximizeBtn = windowElement.querySelector('.win-btn.maximize');
        const closeBtn = windowElement.querySelector('.win-btn.close');
        
        // Click to focus
        windowElement.addEventListener('mousedown', (e) => {
            if (!e.target.closest('.win-btn')) {
                this.focusWindow(windowId);
            }
        });
        
        // Minimize
        minimizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.minimizeWindow(windowId);
        });
        
        // Maximize/Restore
        maximizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const windowInfo = this.windows.get(windowId);
            if (windowInfo.state === 'maximized') {
                this.restoreWindow(windowId);
            } else {
                this.maximizeWindow(windowId);
            }
        });
        
        // Close
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeWindow(windowId);
        });
        
        // Double click header to maximize/restore
        header.addEventListener('dblclick', () => {
            const windowInfo = this.windows.get(windowId);
            if (windowInfo.state === 'maximized') {
                this.restoreWindow(windowId);
            } else {
                this.maximizeWindow(windowId);
            }
        });
    }

    makeDraggable(windowElement, windowId) {
        const header = windowElement.querySelector('.window-header');
        let isDragging = false;
        let startX, startY, startLeft, startTop;
        
        header.addEventListener('mousedown', startDrag);
        
        function startDrag(e) {
            if (e.target.closest('.window-controls')) return;
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            
            const rect = windowElement.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;
            
            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', stopDrag);
            
            windowElement.classList.add('dragging');
            windowManager.focusWindow(windowId);
        }
        
        function drag(e) {
            if (!isDragging) return;
            
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            let newLeft = startLeft + dx;
            let newTop = startTop + dy;
            
            // Boundary checking
            const maxLeft = window.innerWidth - 50;
            const maxTop = window.innerHeight - 50;
            
            newLeft = Math.max(0, Math.min(newLeft, maxLeft));
            newTop = Math.max(0, Math.min(newTop, maxTop));
            
            windowElement.style.left = newLeft + 'px';
            windowElement.style.top = newTop + 'px';
        }
        
        function stopDrag() {
            isDragging = false;
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('mouseup', stopDrag);
            windowElement.classList.remove('dragging');
            
            // Save position
            const windowInfo = windowManager.windows.get(windowId);
            if (windowInfo && windowInfo.state === 'normal') {
                const rect = windowElement.getBoundingClientRect();
                windowInfo.position = { left: rect.left, top: rect.top };
            }
        }
    }

    makeResizable(windowElement, windowId, minWidth, minHeight) {
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';
        resizeHandle.style.cssText = `
            position: absolute;
            width: 15px;
            height: 15px;
            right: 0;
            bottom: 0;
            cursor: nwse-resize;
            background: linear-gradient(135deg, transparent 50%, var(--border-color) 50%);
        `;
        windowElement.appendChild(resizeHandle);
        
        let isResizing = false;
        let startX, startY, startWidth, startHeight;
        
        resizeHandle.addEventListener('mousedown', startResize);
        
        function startResize(e) {
            e.preventDefault();
            e.stopPropagation();
            
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            
            startWidth = windowElement.offsetWidth;
            startHeight = windowElement.offsetHeight;
            
            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', stopResize);
            
            windowElement.classList.add('resizing');
            windowManager.focusWindow(windowId);
        }
        
        function resize(e) {
            if (!isResizing) return;
            
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            let newWidth = Math.max(minWidth, startWidth + dx);
            let newHeight = Math.max(minHeight, startHeight + dy);
            
            // Maximum size
            const maxWidth = window.innerWidth - parseInt(windowElement.style.left || 0);
            const maxHeight = window.innerHeight - parseInt(windowElement.style.top || 0);
            
            newWidth = Math.min(newWidth, maxWidth);
            newHeight = Math.min(newHeight, maxHeight);
            
            windowElement.style.width = newWidth + 'px';
            windowElement.style.height = newHeight + 'px';
        }
        
        function stopResize() {
            isResizing = false;
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResize);
            windowElement.classList.remove('resizing');
            
            // Save size
            const windowInfo = windowManager.windows.get(windowId);
            if (windowInfo && windowInfo.state === 'normal') {
                windowInfo.size = {
                    width: windowElement.offsetWidth,
                    height: windowElement.offsetHeight
                };
            }
        }
    }

    focusWindow(windowId) {
        // Remove active class from all windows
        document.querySelectorAll('.window').forEach(w => {
            w.classList.remove('active-window');
        });
        
        const windowInfo = this.windows.get(windowId);
        if (!windowInfo) return;
        
        // Bring to front
        windowInfo.element.classList.add('active-window');
        windowInfo.element.style.zIndex = this.zIndex++;
        this.activeWindow = windowId;
        
        // Update taskbar
        this.updateTaskbarActive(windowId);
    }

    minimizeWindow(windowId) {
        const windowInfo = this.windows.get(windowId);
        if (!windowInfo) return;
        
        windowInfo.element.style.display = 'none';
        windowInfo.state = 'minimized';
        
        // Update taskbar
        this.updateTaskbarMinimized(windowId, true);
        
        // Play sound
        this.playSound('click');
    }

    maximizeWindow(windowId) {
        const windowInfo = this.windows.get(windowId);
        if (!windowInfo) return;
        
        // Save current position and size
        windowInfo.oldPosition = { ...windowInfo.position };
        windowInfo.oldSize = { ...windowInfo.size };
        
        // Maximize
        windowInfo.element.style.left = '0';
        windowInfo.element.style.top = '0';
        windowInfo.element.style.width = '100vw';
        windowInfo.element.style.height = 'calc(100vh - 48px)';
        windowInfo.element.style.borderRadius = '0';
        
        // Update icon
        const maximizeBtn = windowInfo.element.querySelector('.win-btn.maximize i');
        maximizeBtn.className = 'fas fa-compress-alt';
        
        windowInfo.state = 'maximized';
        this.playSound('click');
    }

    restoreWindow(windowId) {
        const windowInfo = this.windows.get(windowId);
        if (!windowInfo || !windowInfo.oldPosition) return;
        
        // Restore position and size
        windowInfo.element.style.left = windowInfo.oldPosition.left + 'px';
        windowInfo.element.style.top = windowInfo.oldPosition.top + 'px';
        windowInfo.element.style.width = windowInfo.oldSize.width + 'px';
        windowInfo.element.style.height = windowInfo.oldSize.height + 'px';
        windowInfo.element.style.borderRadius = '12px';
        
        // Update icon
        const maximizeBtn = windowInfo.element.querySelector('.win-btn.maximize i');
        maximizeBtn.className = 'fas fa-expand-alt';
        
        windowInfo.state = 'normal';
        this.playSound('click');
    }

    closeWindow(windowId) {
        const windowInfo = this.windows.get(windowId);
        if (!windowInfo) return;
        
        // Remove from DOM
        windowInfo.element.remove();
        
        // Remove from windows map
        this.windows.delete(windowId);
        
        // Remove from taskbar
        this.removeFromTaskbar(windowId);
        
        // Update active window
        if (this.activeWindow === windowId) {
            this.activeWindow = null;
            // Focus next window if available
            if (this.windows.size > 0) {
                const nextWindow = Array.from(this.windows.keys())[0];
                this.focusWindow(nextWindow);
            }
        }
        
        this.playSound('click');
        console.log(`❌ Closed window: ${windowId}`);
    }

    // ===== TASKBAR INTEGRATION =====
    addToTaskbar(windowId, title) {
        const taskbarWindows = document.getElementById('taskbar-windows');
        if (!taskbarWindows) return;
        
        const taskbarItem = document.createElement('div');
        taskbarItem.className = 'taskbar-window active';
        taskbarItem.textContent = title;
        taskbarItem.dataset.windowId = windowId;
        
        taskbarItem.onclick = () => {
            const windowInfo = this.windows.get(windowId);
            if (!windowInfo) return;
            
            if (windowInfo.state === 'minimized') {
                // Restore minimized window
                windowInfo.element.style.display = 'flex';
                windowInfo.state = 'normal';
                this.updateTaskbarMinimized(windowId, false);
            }
            
            this.focusWindow(windowId);
        };
        
        taskbarWindows.appendChild(taskbarItem);
    }

    updateTaskbarActive(windowId) {
        const taskbarItems = document.querySelectorAll('.taskbar-window');
        taskbarItems.forEach(item => {
            if (item.dataset.windowId === windowId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    updateTaskbarMinimized(windowId, minimized) {
        const taskbarItem = document.querySelector(`.taskbar-window[data-window-id="${windowId}"]`);
        if (taskbarItem) {
            if (minimized) {
                taskbarItem.classList.remove('active');
                taskbarItem.style.opacity = '0.7';
            } else {
                taskbarItem.style.opacity = '1';
            }
        }
    }

    removeFromTaskbar(windowId) {
        const taskbarItem = document.querySelector(`.taskbar-window[data-window-id="${windowId}"]`);
        if (taskbarItem) {
            taskbarItem.remove();
        }
    }

    // ===== WINDOW MANAGEMENT =====
    getAllWindows() {
        return Array.from(this.windows.values());
    }

    getWindowById(windowId) {
        return this.windows.get(windowId);
    }

    getWindowsByType(type) {
        return Array.from(this.windows.values()).filter(w => w.type === type);
    }

    bringAllToFront() {
        this.getAllWindows().forEach(windowInfo => {
            windowInfo.element.style.zIndex = this.zIndex++;
        });
    }

    cascadeWindows() {
        let offset = 0;
        this.getAllWindows().forEach(windowInfo => {
            if (windowInfo.state === 'normal') {
                windowInfo.element.style.left = 100 + offset + 'px';
                windowInfo.element.style.top = 100 + offset + 'px';
                windowInfo.position = { left: 100 + offset, top: 100 + offset };
                offset = (offset + 30) % 300;
            }
        });
    }

    tileWindows() {
        const windows = this.getAllWindows().filter(w => w.state === 'normal');
        if (windows.length === 0) return;
        
        const cols = Math.ceil(Math.sqrt(windows.length));
        const rows = Math.ceil(windows.length / cols);
        
        const width = (window.innerWidth - 50) / cols;
        const height = (window.innerHeight - 100) / rows;
        
        windows.forEach((windowInfo, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            
            const left = col * width + 10;
            const top = row * height + 10;
            
            windowInfo.element.style.left = left + 'px';
            windowInfo.element.style.top = top + 'px';
            windowInfo.element.style.width = (width - 20) + 'px';
            windowInfo.element.style.height = (height - 20) + 'px';
            
            windowInfo.position = { left, top };
            windowInfo.size = { width: width - 20, height: height - 20 };
        });
    }

    // ===== UTILITIES =====
    playSound(type) {
        if (localStorage.getItem('tfos-sound') === 'off') return;
        
        try {
            const audio = new Audio();
            audio.src = type === 'click' ? '/public/sounds/click.ogg' : '';
            audio.volume = 0.3;
            audio.play();
        } catch (error) {
            // Ignore audio errors
        }
    }

    // ===== CLEANUP =====
    cleanup() {
        // Close all windows
        const windowIds = Array.from(this.windows.keys());
        windowIds.forEach(id => this.closeWindow(id));
        
        console.log('🧹 Window Manager cleaned up');
    }
}

// Create global instance
const windowManager = new WindowManager();

// Export for use in other modules
window.windowManager = windowManager;

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Window Manager initialized');
    
    // Create initial terminal window
    setTimeout(() => {
        if (windowManager.windows.size === 0) {
            windowManager.createWindow('terminal');
        }
    }, 100);
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    windowManager.cleanup();
});

window.windowManager = windowManager;