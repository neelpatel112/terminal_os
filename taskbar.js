// ===== TASKBAR MANAGER =====
console.log('📌 Initializing Taskbar Manager...');

class TaskbarManager {
    constructor() {
        this.taskbar = null;
        this.startMenu = null;
        this.clockElement = null;
        this.systemTray = null;
        this.appPins = new Map();
        this.initAppPins();
    }

    init() {
        this.taskbar = document.getElementById('taskbar');
        this.startMenu = document.getElementById('start-menu');
        this.clockElement = document.getElementById('clock');
        this.systemTray = document.querySelector('.system-tray');
        
        if (!this.taskbar) {
            console.error('❌ Taskbar element not found');
            return;
        }
        
        this.initClock();
        this.initEventListeners();
        this.initSystemTray();
        this.updateAppPins();
        
        console.log('✅ Taskbar initialized');
    }

    initClock() {
        if (!this.clockElement) return;
        
        const updateClock = () => {
            const now = new Date();
            const time = now.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            this.clockElement.textContent = time;
            
            const date = now.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });
            this.clockElement.title = date;
        };
        
        updateClock();
        setInterval(updateClock, 1000);
    }

    initEventListeners() {
        // Start button
        const startButton = document.getElementById('start-button');
        if (startButton) {
            startButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleStartMenu();
                this.playSound('click');
            });
        }
        
        // Close start menu when clicking elsewhere
        document.addEventListener('click', (e) => {
            if (!this.startMenu?.contains(e.target) && !startButton?.contains(e.target)) {
                this.hideStartMenu();
            }
        });
        
        // Start menu apps
        document.querySelectorAll('.app-tile').forEach(tile => {
            tile.addEventListener('click', (e) => {
                e.stopPropagation();
                const app = tile.dataset.app;
                this.launchAppFromStartMenu(app);
            });
        });
        
        // App pins
        document.querySelectorAll('.app-pin').forEach(pin => {
            pin.addEventListener('click', (e) => {
                e.stopPropagation();
                const app = pin.dataset.app;
                this.launchAppFromPin(app);
            });
        });
        
        // Power button
        const powerButton = document.getElementById('power-button');
        if (powerButton) {
            powerButton.addEventListener('click', () => {
                this.showShutdownDialog();
            });
        }
        
        // Quick actions
        document.querySelectorAll('.quick-action').forEach(action => {
            action.addEventListener('click', (e) => {
                e.stopPropagation();
                const cmd = action.dataset.cmd;
                this.executeQuickAction(cmd);
            });
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Windows key or Ctrl+Esc to open start menu
            if (e.key === 'Meta' || (e.ctrlKey && e.key === 'Escape')) {
                e.preventDefault();
                this.toggleStartMenu();
            }
            
            // Escape to close start menu
            if (e.key === 'Escape' && this.startMenu?.style.display === 'block') {
                this.hideStartMenu();
            }
        });
    }

    initSystemTray() {
        if (!this.systemTray) return;
        
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
        
        // Network icon
        const networkIcon = this.systemTray.querySelector('.tray-icon .fa-wifi');
        if (networkIcon) {
            networkIcon.parentElement.addEventListener('click', () => {
                this.showNetworkMenu();
            });
        }
        
        // Audio icon
        const audioIcon = this.systemTray.querySelector('.tray-icon .fa-volume-up');
        if (audioIcon) {
            audioIcon.parentElement.addEventListener('click', () => {
                this.showVolumeSlider();
            });
        }
    }

    initAppPins() {
        // Default app pins
        this.appPins.set('terminal', {
            name: 'Terminal',
            icon: 'fas fa-terminal',
            action: () => this.launchApp('terminal')
        });
        
        this.appPins.set('editor', {
            name: 'Text Editor',
            icon: 'fas fa-file-code',
            action: () => this.launchApp('editor')
        });
        
        this.appPins.set('files', {
            name: 'File Manager',
            icon: 'fas fa-folder',
            action: () => this.launchApp('files')
        });
        
        this.appPins.set('settings', {
            name: 'Settings',
            icon: 'fas fa-cog',
            action: () => this.launchApp('settings')
        });
    }

    updateAppPins() {
        const appPinsContainer = document.querySelector('.app-pins');
        if (!appPinsContainer) return;
        
        // Clear existing pins except defaults
        const defaultApps = ['terminal', 'editor', 'files', 'settings'];
        const existingPins = Array.from(appPinsContainer.querySelectorAll('.app-pin'))
            .filter(pin => !defaultApps.includes(pin.dataset.app));
        
        existingPins.forEach(pin => pin.remove());
        
        // Add custom app pins (could be loaded from user config)
        // For now, just keep defaults
    }

    // ===== START MENU =====
    toggleStartMenu() {
        if (!this.startMenu) return;
        
        if (this.startMenu.style.display === 'block') {
            this.hideStartMenu();
        } else {
            this.showStartMenu();
        }
    }

    showStartMenu() {
        if (!this.startMenu) return;
        
        // Position at bottom left of start button
        const startButton = document.getElementById('start-button');
        if (startButton) {
            const rect = startButton.getBoundingClientRect();
            this.startMenu.style.left = rect.left + 'px';
            this.startMenu.style.bottom = (window.innerHeight - rect.top + 48) + 'px';
        }
        
        this.startMenu.style.display = 'block';
        this.startMenu.style.opacity = '1';
        
        // Update user info
        this.updateStartMenuUserInfo();
    }

    hideStartMenu() {
        if (!this.startMenu) return;
        this.startMenu.style.display = 'none';
    }

    updateStartMenuUserInfo() {
        const userInfo = this.startMenu.querySelector('.user-info');
        if (userInfo) {
            const user = localStorage.getItem('tfos-user') || 'guest';
            const hostname = 'terminal-first';
            userInfo.textContent = `${user}@${hostname}`;
        }
    }

    // ===== APP LAUNCHING =====
    launchAppFromStartMenu(appName) {
        this.hideStartMenu();
        this.launchApp(appName);
    }

    launchAppFromPin(appName) {
        this.launchApp(appName);
    }

    launchApp(appName) {
        this.playSound('click');
        
        // Check if window manager exists
        if (window.windowManager) {
            try {
                window.windowManager.createWindow(appName);
                
                // Show notification
                if (window.showNotification) {
                    window.showNotification({
                        title: 'Application Launched',
                        message: `${appName} started successfully`,
                        type: 'success'
                    });
                }
                
                return true;
            } catch (error) {
                console.error(`Failed to launch ${appName}:`, error);
                
                if (window.showNotification) {
                    window.showNotification({
                        title: 'Launch Error',
                        message: `Could not start ${appName}: ${error.message}`,
                        type: 'error'
                    });
                }
                
                return false;
            }
        } else {
            // Fallback to terminal command
            if (window.executeCommand) {
                window.executeCommand(`run ${appName}`);
            }
            return false;
        }
    }

    // ===== TASKBAR WINDOWS =====
    addWindowToTaskbar(windowId, title, icon = 'fas fa-window') {
        const taskbarWindows = document.getElementById('taskbar-windows');
        if (!taskbarWindows) return;
        
        // Check if already exists
        const existing = taskbarWindows.querySelector(`[data-window-id="${windowId}"]`);
        if (existing) {
            existing.classList.add('active');
            return existing;
        }
        
        // Create new taskbar item
        const taskbarItem = document.createElement('div');
        taskbarItem.className = 'taskbar-window';
        taskbarItem.dataset.windowId = windowId;
        
        // Add icon and title
        const iconEl = document.createElement('i');
        iconEl.className = icon;
        
        const titleEl = document.createElement('span');
        titleEl.textContent = title;
        
        taskbarItem.appendChild(iconEl);
        taskbarItem.appendChild(titleEl);
        
        // Click handler
        taskbarItem.addEventListener('click', () => {
            this.focusWindow(windowId);
        });
        
        // Context menu
        taskbarItem.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showWindowContextMenu(e.clientX, e.clientY, windowId);
        });
        
        taskbarWindows.appendChild(taskbarItem);
        return taskbarItem;
    }

    removeWindowFromTaskbar(windowId) {
        const taskbarWindows = document.getElementById('taskbar-windows');
        if (!taskbarWindows) return;
        
        const item = taskbarWindows.querySelector(`[data-window-id="${windowId}"]`);
        if (item) {
            item.remove();
        }
    }

    updateWindowInTaskbar(windowId, updates) {
        const item = document.querySelector(`.taskbar-window[data-window-id="${windowId}"]`);
        if (!item) return;
        
        if (updates.title) {
            const titleEl = item.querySelector('span');
            if (titleEl) titleEl.textContent = updates.title;
        }
        
        if (updates.icon) {
            const iconEl = item.querySelector('i');
            if (iconEl) iconEl.className = updates.icon;
        }
        
        if (updates.active !== undefined) {
            if (updates.active) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        }
    }

    focusWindow(windowId) {
        if (window.windowManager) {
            const windowInfo = window.windowManager.getWindowById(windowId);
            if (windowInfo) {
                if (windowInfo.state === 'minimized') {
                    window.windowManager.restoreWindow(windowId);
                }
                window.windowManager.focusWindow(windowId);
            }
        }
    }

    // ===== SYSTEM TRAY =====
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('tfos-theme', newTheme);
        
        // Update icon
        const themeIcon = document.querySelector('#theme-toggle i');
        if (themeIcon) {
            themeIcon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
        
        this.playSound('click');
    }

    showNetworkMenu() {
        // Simple network status popup
        if (window.showNotification) {
            window.showNotification({
                title: 'Network Status',
                message: 'Connected to TerminalFirst Network\nIP: 127.0.0.1\nStatus: Online',
                type: 'info'
            });
        }
    }

    showVolumeSlider() {
        // Create volume slider popup
        const slider = document.createElement('div');
        slider.className = 'volume-slider';
        slider.style.cssText = `
            position: absolute;
            bottom: 60px;
            right: 10px;
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 15px;
            box-shadow: var(--shadow-heavy);
            z-index: 10000;
        `;
        
        slider.innerHTML = `
            <div style="margin-bottom: 10px; font-weight: 500;">Volume</div>
            <input type="range" min="0" max="100" value="80" class="volume-range" 
                   style="width: 120px; accent-color: var(--accent-primary);">
            <div style="margin-top: 10px; font-size: 0.9em; color: var(--text-secondary);">
                Click to test sound
            </div>
        `;
        
        document.body.appendChild(slider);
        
        // Handle volume change
        const range = slider.querySelector('.volume-range');
        range.addEventListener('input', (e) => {
            // In a real app, you'd control actual audio
            console.log('Volume:', e.target.value);
        });
        
        // Click to test
        slider.addEventListener('click', () => {
            this.playSound('click');
        });
        
        // Auto-remove when clicking elsewhere
        setTimeout(() => {
            const removeSlider = (e) => {
                if (!slider.contains(e.target) && !e.target.closest('.tray-icon .fa-volume-up')) {
                    slider.remove();
                    document.removeEventListener('click', removeSlider);
                }
            };
            document.addEventListener('click', removeSlider);
        }, 10);
    }

    // ===== QUICK ACTIONS =====
    executeQuickAction(cmd) {
        switch(cmd) {
            case 'help':
                if (window.executeCommand) {
                    window.executeCommand('help');
                }
                break;
            case 'clear':
                if (window.executeCommand) {
                    window.executeCommand('clear');
                }
                break;
            case 'terminal':
                this.launchApp('terminal');
                break;
            case 'settings':
                this.launchApp('settings');
                break;
        }
        this.hideStartMenu();
    }

    // ===== SHUTDOWN =====
    showShutdownDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'shutdown-dialog';
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 25px;
            box-shadow: var(--shadow-heavy);
            z-index: 10000;
            min-width: 300px;
            text-align: center;
        `;
        
        dialog.innerHTML = `
            <h3 style="margin-bottom: 15px; color: var(--accent-primary);">
                <i class="fas fa-power-off"></i> Shutdown
            </h3>
            <p style="margin-bottom: 20px; color: var(--text-secondary);">
                What would you like to do?
            </p>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button class="shutdown-option" data-action="shutdown" 
                        style="padding: 12px; background: var(--accent-danger); color: white; border: none; border-radius: 8px; cursor: pointer;">
                    <i class="fas fa-power-off"></i> Shutdown TerminalFirst OS
                </button>
                <button class="shutdown-option" data-action="restart" 
                        style="padding: 12px; background: var(--accent-warning); color: white; border: none; border-radius: 8px; cursor: pointer;">
                    <i class="fas fa-redo"></i> Restart
                </button>
                <button class="shutdown-option" data-action="sleep" 
                        style="padding: 12px; background: var(--bg-tertiary); color: var(--text-primary); border: none; border-radius: 8px; cursor: pointer;">
                    <i class="fas fa-moon"></i> Sleep
                </button>
                <button class="shutdown-option" data-action="cancel" 
                        style="padding: 12px; background: transparent; color: var(--text-secondary); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer;">
                    Cancel
                </button>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Handle options
        dialog.querySelectorAll('.shutdown-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const action = e.target.closest('.shutdown-option').dataset.action;
                this.handleShutdownAction(action);
                dialog.remove();
            });
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

    handleShutdownAction(action) {
        switch(action) {
            case 'shutdown':
                if (window.shutdownOS) {
                    window.shutdownOS();
                } else {
                    alert('Shutting down TerminalFirst OS...\n(Close browser tab to exit)');
                }
                break;
            case 'restart':
                location.reload();
                break;
            case 'sleep':
                if (window.showNotification) {
                    window.showNotification({
                        title: 'Sleep Mode',
                        message: 'Entering sleep mode...',
                        type: 'info'
                    });
                }
                // In a real app, you'd dim the screen or similar
                break;
            case 'cancel':
                // Do nothing
                break;
        }
    }

    // ===== CONTEXT MENU =====
    showWindowContextMenu(x, y, windowId) {
        const contextMenu = document.createElement('div');
        contextMenu.className = 'context-menu';
        contextMenu.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            box-shadow: var(--shadow-heavy);
            z-index: 10000;
            min-width: 180px;
            padding: 5px 0;
        `;
        
        const windowInfo = window.windowManager?.getWindowById(windowId);
        const isMinimized = windowInfo?.state === 'minimized';
        const isMaximized = windowInfo?.state === 'maximized';
        
        contextMenu.innerHTML = `
            <div class="context-item" data-action="restore" ${isMinimized ? '' : 'style="display: none;"'}>
                <i class="fas fa-window-restore"></i> Restore
            </div>
            <div class="context-item" data-action="minimize" ${isMinimized ? 'style="display: none;"' : ''}>
                <i class="fas fa-window-minimize"></i> Minimize
            </div>
            <div class="context-item" data-action="maximize" ${isMaximized ? 'style="display: none;"' : ''}>
                <i class="fas fa-window-maximize"></i> Maximize
            </div>
            <div class="context-item" data-action="restore-down" ${isMaximized ? '' : 'style="display: none;"'}>
                <i class="fas fa-window-restore"></i> Restore Down
            </div>
            <div class="divider"></div>
            <div class="context-item" data-action="close">
                <i class="fas fa-times"></i> Close
            </div>
        `;
        
        document.body.appendChild(contextMenu);
        
        // Style context items
        contextMenu.querySelectorAll('.context-item').forEach(item => {
            item.style.cssText = `
                padding: 8px 15px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 0.9em;
            `;
            item.addEventListener('mouseenter', () => {
                item.style.background = 'var(--accent-primary)';
                item.style.color = 'white';
            });
            item.addEventListener('mouseleave', () => {
                item.style.background = 'transparent';
                item.style.color = '';
            });
        });
        
        // Handle actions
        contextMenu.addEventListener('click', (e) => {
            const action = e.target.closest('.context-item')?.dataset.action;
            if (action && window.windowManager) {
                switch(action) {
                    case 'restore':
                        window.windowManager.restoreWindow(windowId);
                        break;
                    case 'minimize':
                        window.windowManager.minimizeWindow(windowId);
                        break;
                    case 'maximize':
                        window.windowManager.maximizeWindow(windowId);
                        break;
                    case 'restore-down':
                        window.windowManager.restoreWindow(windowId);
                        break;
                    case 'close':
                        window.windowManager.closeWindow(windowId);
                        break;
                }
            }
            contextMenu.remove();
        });
        
        // Remove menu when clicking elsewhere
        setTimeout(() => {
            const removeMenu = (e) => {
                if (!contextMenu.contains(e.target)) {
                    contextMenu.remove();
                    document.removeEventListener('click', removeMenu);
                }
            };
            document.addEventListener('click', removeMenu);
        }, 10);
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
        // Remove any popups or dialogs
        document.querySelectorAll('.shutdown-dialog, .context-menu, .volume-slider').forEach(el => {
            el.remove();
        });
        
        console.log('🧹 Taskbar Manager cleaned up');
    }
}

// Create global instance
const taskbarManager = new TaskbarManager();

// Export for use in other modules
window.taskbarManager = taskbarManager;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => taskbarManager.init());
} else {
    taskbarManager.init();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    taskbarManager.cleanup();
});

window.taskbarManager = taskbarManager;