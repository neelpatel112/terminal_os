// ===== SETTINGS APPLICATION =====
console.log('⚙️ Initializing Settings...');

class SettingsApp {
    constructor() {
        this.name = 'settings';
        this.version = '1.0.0';
        this.windowId = null;
        this.currentCategory = 'appearance';
        this.settings = this.loadSettings();
        this.cliCommands = {};
        this.initCLICommands();
    }

    initCLICommands() {
        this.cliCommands = {
            'settings': {
                description: 'Open system settings',
                handler: () => this.handleCLIOpen()
            },
            'config': {
                description: 'Configure system settings',
                handler: (args) => this.handleCLIConfig(args)
            }
        };
    }

    loadSettings() {
        const defaultSettings = {
            appearance: {
                theme: localStorage.getItem('tfos-theme') || 'dark',
                animations: true,
                transparency: 0.95,
                fontSize: 14
            },
            system: {
                sound: localStorage.getItem('tfos-sound') !== 'off',
                notifications: true,
                autosave: true,
                language: 'english'
            },
            terminal: {
                font: 'JetBrains Mono',
                fontSize: 13,
                blinkCursor: true,
                showSuggestions: true,
                historySize: 50
            },
            apps: {
                autoUpdate: false,
                developerMode: false
            },
            about: {
                version: '1.0.0-alpha',
                build: '2024.01.15',
                author: 'TerminalFirst Team'
            }
        };
        
        // Load saved settings
        const saved = localStorage.getItem('tfos-settings');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return { ...defaultSettings, ...parsed };
            } catch (e) {
                console.error('Failed to parse saved settings:', e);
            }
        }
        
        return defaultSettings;
    }

    saveSettings() {
        localStorage.setItem('tfos-settings', JSON.stringify(this.settings));
        
        // Also save individual settings that other components might check
        localStorage.setItem('tfos-theme', this.settings.appearance.theme);
        localStorage.setItem('tfos-sound', this.settings.system.sound ? 'on' : 'off');
        
        console.log('💾 Settings saved');
    }

    // ===== GUI METHODS =====
    launch() {
        if (window.windowManager) {
            this.windowId = window.windowManager.createWindow('settings', {
                title: 'Settings',
                width: 800,
                height: 550
            });
            
            this.initSettingsUI();
            console.log('✅ Settings launched');
            return this.windowId;
        }
        return null;
    }

    initSettingsUI() {
        const windowInfo = window.windowManager?.getWindowById(this.windowId);
        if (!windowInfo) return;
        
        const settingsWindow = windowInfo.element;
        
        // Get UI elements
        const sidebar = settingsWindow.querySelector('.settings-sidebar');
        const content = settingsWindow.querySelector('.settings-content');
        
        if (!sidebar || !content) return;
        
        // Setup sidebar
        this.setupSidebar(sidebar, content);
        
        // Load initial category
        this.loadCategory('appearance', content);
    }

    setupSidebar(sidebar, content) {
        const categories = [
            { id: 'appearance', name: 'Appearance', icon: 'fas fa-palette' },
            { id: 'system', name: 'System', icon: 'fas fa-cog' },
            { id: 'terminal', name: 'Terminal', icon: 'fas fa-terminal' },
            { id: 'apps', name: 'Applications', icon: 'fas fa-th' },
            { id: 'about', name: 'About', icon: 'fas fa-info-circle' }
        ];
        
        sidebar.innerHTML = categories.map(cat => `
            <div class="settings-category ${this.currentCategory === cat.id ? 'active' : ''}" 
                 data-category="${cat.id}"
                 style="padding: 12px 15px; margin: 2px 0; cursor: pointer; border-radius: 6px; 
                        display: flex; align-items: center; gap: 12px;
                        ${this.currentCategory === cat.id ? 'background: var(--accent-primary); color: white;' : ''}">
                <i class="${cat.icon}"></i>
                <span>${cat.name}</span>
            </div>
        `).join('');
        
        // Handle category clicks
        sidebar.querySelectorAll('.settings-category').forEach(item => {
            item.addEventListener('click', () => {
                const category = item.dataset.category;
                this.currentCategory = category;
                this.loadCategory(category, content);
                this.updateSidebarSelection(sidebar);
            });
        });
    }

    updateSidebarSelection(sidebar) {
        sidebar.querySelectorAll('.settings-category').forEach(item => {
            if (item.dataset.category === this.currentCategory) {
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

    loadCategory(category, content) {
        if (!content) return;
        
        let html = '';
        
        switch(category) {
            case 'appearance':
                html = this.getAppearanceSettings();
                break;
            case 'system':
                html = this.getSystemSettings();
                break;
            case 'terminal':
                html = this.getTerminalSettings();
                break;
            case 'apps':
                html = this.getAppsSettings();
                break;
            case 'about':
                html = this.getAboutSettings();
                break;
        }
        
        content.innerHTML = html;
        this.setupCategoryControls(category, content);
    }

    getAppearanceSettings() {
        const { appearance } = this.settings;
        
        return `
            <h2 style="margin-bottom: 20px; color: var(--accent-primary);">
                <i class="fas fa-palette"></i> Appearance
            </h2>
            
            <div style="margin-bottom: 25px;">
                <h4 style="margin-bottom: 15px; color: var(--text-primary);">Theme</h4>
                <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                    <div class="theme-option ${appearance.theme === 'dark' ? 'active' : ''}" 
                         data-theme="dark"
                         style="flex: 1; padding: 20px; border-radius: 8px; cursor: pointer; 
                                border: 2px solid ${appearance.theme === 'dark' ? 'var(--accent-primary)' : 'var(--border-color)'}; 
                                background: linear-gradient(135deg, #1a1a1a, #2a2a2a);">
                        <div style="text-align: center; color: white;">
                            <i class="fas fa-moon" style="font-size: 2em; margin-bottom: 10px;"></i>
                            <div style="font-weight: 500;">Dark</div>
                        </div>
                    </div>
                    <div class="theme-option ${appearance.theme === 'light' ? 'active' : ''}" 
                         data-theme="light"
                         style="flex: 1; padding: 20px; border-radius: 8px; cursor: pointer; 
                                border: 2px solid ${appearance.theme === 'light' ? 'var(--accent-primary)' : 'var(--border-color)'}; 
                                background: linear-gradient(135deg, #ffffff, #f0f2f5);">
                        <div style="text-align: center; color: #1a1a1a;">
                            <i class="fas fa-sun" style="font-size: 2em; margin-bottom: 10px;"></i>
                            <div style="font-weight: 500;">Light</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom: 25px;">
                <h4 style="margin-bottom: 15px; color: var(--text-primary);">Interface</h4>
                <div style="display: grid; gap: 15px;">
                    <label class="setting-toggle" style="display: flex; justify-content: space-between; align-items: center;">
                        <span>Animations</span>
                        <input type="checkbox" ${appearance.animations ? 'checked' : ''} data-setting="appearance.animations">
                    </label>
                    
                    <div class="setting-slider">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                            <span>Transparency</span>
                            <span>${Math.round(appearance.transparency * 100)}%</span>
                        </div>
                        <input type="range" min="0.5" max="1" step="0.05" value="${appearance.transparency}" 
                               data-setting="appearance.transparency"
                               style="width: 100%; accent-color: var(--accent-primary);">
                    </div>
                    
                    <div class="setting-select">
                        <label style="display: block; margin-bottom: 5px;">Font Size</label>
                        <select data-setting="appearance.fontSize" 
                                style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); 
                                       border-radius: 4px; background: var(--bg-tertiary); color: var(--text-primary);">
                            ${[12, 13, 14, 15, 16, 18].map(size => `
                                <option value="${size}" ${appearance.fontSize === size ? 'selected' : ''}>
                                    ${size}px
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid var(--border-color);">
                <button class="apply-btn" data-category="appearance" 
                        style="padding: 10px 20px; background: var(--accent-primary); color: white; 
                               border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                    Apply Changes
                </button>
            </div>
        `;
    }

    getSystemSettings() {
        const { system } = this.settings;
        
        return `
            <h2 style="margin-bottom: 20px; color: var(--accent-primary);">
                <i class="fas fa-cog"></i> System
            </h2>
            
            <div style="margin-bottom: 25px;">
                <h4 style="margin-bottom: 15px; color: var(--text-primary);">General</h4>
                <div style="display: grid; gap: 15px;">
                    <label class="setting-toggle" style="display: flex; justify-content: space-between; align-items: center;">
                        <span>Sound Effects</span>
                        <input type="checkbox" ${system.sound ? 'checked' : ''} data-setting="system.sound">
                    </label>
                    
                    <label class="setting-toggle" style="display: flex; justify-content: space-between; align-items: center;">
                        <span>Notifications</span>
                        <input type="checkbox" ${system.notifications ? 'checked' : ''} data-setting="system.notifications">
                    </label>
                    
                    <label class="setting-toggle" style="display: flex; justify-content: space-between; align-items: center;">
                        <span>Auto-save</span>
                        <input type="checkbox" ${system.autosave ? 'checked' : ''} data-setting="system.autosave">
                    </label>
                </div>
            </div>
            
            <div style="margin-bottom: 25px;">
                <h4 style="margin-bottom: 15px; color: var(--text-primary);">Language</h4>
                <select data-setting="system.language" 
                        style="width: 100%; max-width: 300px; padding: 8px 12px; border: 1px solid var(--border-color); 
                               border-radius: 4px; background: var(--bg-tertiary); color: var(--text-primary);">
                    <option value="english" ${system.language === 'english' ? 'selected' : ''}>English</option>
                    <option value="spanish" ${system.language === 'spanish' ? 'selected' : ''}>Spanish</option>
                    <option value="french" ${system.language === 'french' ? 'selected' : ''}>French</option>
                    <option value="german" ${system.language === 'german' ? 'selected' : ''}>German</option>
                    <option value="japanese" ${system.language === 'japanese' ? 'selected' : ''}>Japanese</option>
                </select>
            </div>
            
            <div style="margin-bottom: 25px;">
                <h4 style="margin-bottom: 15px; color: var(--text-primary);">Reset</h4>
                <div style="display: flex; gap: 10px;">
                    <button class="reset-btn" data-reset="system" 
                            style="padding: 10px 20px; background: var(--bg-tertiary); color: var(--text-primary); 
                                   border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer;">
                        Reset to Defaults
                    </button>
                    <button class="clear-btn" data-clear="cache" 
                            style="padding: 10px 20px; background: var(--bg-tertiary); color: var(--text-primary); 
                                   border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer;">
                        Clear Cache
                    </button>
                </div>
            </div>
        `;
    }

    getTerminalSettings() {
        const { terminal } = this.settings;
        
        return `
            <h2 style="margin-bottom: 20px; color: var(--accent-primary);">
                <i class="fas fa-terminal"></i> Terminal
            </h2>
            
            <div style="margin-bottom: 25px;">
                <h4 style="margin-bottom: 15px; color: var(--text-primary);">Display</h4>
                <div style="display: grid; gap: 15px;">
                    <div class="setting-select">
                        <label style="display: block; margin-bottom: 5px;">Font Family</label>
                        <select data-setting="terminal.font" 
                                style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); 
                                       border-radius: 4px; background: var(--bg-tertiary); color: var(--text-primary);">
                            <option value="JetBrains Mono" ${terminal.font === 'JetBrains Mono' ? 'selected' : ''}>
                                JetBrains Mono
                            </option>
                            <option value="Fira Code" ${terminal.font === 'Fira Code' ? 'selected' : ''}>
                                Fira Code
                            </option>
                            <option value="Cascadia Code" ${terminal.font === 'Cascadia Code' ? 'selected' : ''}>
                                Cascadia Code
                            </option>
                            <option value="Monaco" ${terminal.font === 'Monaco' ? 'selected' : ''}>
                                Monaco
                            </option>
                            <option value="Consolas" ${terminal.font === 'Consolas' ? 'selected' : ''}>
                                Consolas
                            </option>
                        </select>
                    </div>
                    
                    <div class="setting-select">
                        <label style="display: block; margin-bottom: 5px;">Font Size</label>
                        <select data-setting="terminal.fontSize" 
                                style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); 
                                       border-radius: 4px; background: var(--bg-tertiary); color: var(--text-primary);">
                            ${[10, 11, 12, 13, 14, 15, 16].map(size => `
                                <option value="${size}" ${terminal.fontSize === size ? 'selected' : ''}>
                                    ${size}px
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <label class="setting-toggle" style="display: flex; justify-content: space-between; align-items: center;">
                        <span>Blinking Cursor</span>
                        <input type="checkbox" ${terminal.blinkCursor ? 'checked' : ''} data-setting="terminal.blinkCursor">
                    </label>
                    
                    <label class="setting-toggle" style="display: flex; justify-content: space-between; align-items: center;">
                        <span>Command Suggestions</span>
                        <input type="checkbox" ${terminal.showSuggestions ? 'checked' : ''} data-setting="terminal.showSuggestions">
                    </label>
                </div>
            </div>
            
            <div style="margin-bottom: 25px;">
                <h4 style="margin-bottom: 15px; color: var(--text-primary);">History</h4>
                <div class="setting-slider">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                        <span>History Size</span>
                        <span>${terminal.historySize} commands</span>
                    </div>
                    <input type="range" min="10" max="200" step="10" value="${terminal.historySize}" 
                           data-setting="terminal.historySize"
                           style="width: 100%; accent-color: var(--accent-primary);">
                </div>
            </div>
            
            <div style="margin-top: 30px;">
                <button class="apply-btn" data-category="terminal" 
                        style="padding: 10px 20px; background: var(--accent-primary); color: white; 
                               border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                    Apply to Terminal
                </button>
            </div>
        `;
    }

    getAppsSettings() {
        const { apps } = this.settings;
        
        return `
            <h2 style="margin-bottom: 20px; color: var(--accent-primary);">
                <i class="fas fa-th"></i> Applications
            </h2>
            
            <div style="margin-bottom: 25px;">
                <h4 style="margin-bottom: 15px; color: var(--text-primary);">Updates</h4>
                <div style="display: grid; gap: 15px;">
                    <label class="setting-toggle" style="display: flex; justify-content: space-between; align-items: center;">
                        <span>Auto-update Applications</span>
                        <input type="checkbox" ${apps.autoUpdate ? 'checked' : ''} data-setting="apps.autoUpdate">
                    </label>
                    
                    <label class="setting-toggle" style="display: flex; justify-content: space-between; align-items: center;">
                        <span>Developer Mode</span>
                        <input type="checkbox" ${apps.developerMode ? 'checked' : ''} data-setting="apps.developerMode">
                    </label>
                </div>
            </div>
            
            <div style="margin-bottom: 25px;">
                <h4 style="margin-bottom: 15px; color: var(--text-primary);">Installed Applications</h4>
                <div style="background: var(--bg-tertiary); border-radius: 8px; padding: 15px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <div>
                            <i class="fas fa-terminal"></i>
                            <span style="margin-left: 10px; font-weight: 500;">Terminal</span>
                        </div>
                        <span style="color: var(--text-secondary);">v1.0.0</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <div>
                            <i class="fas fa-file-code"></i>
                            <span style="margin-left: 10px; font-weight: 500;">Text Editor</span>
                        </div>
                        <span style="color: var(--text-secondary);">v1.0.0</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <div>
                            <i class="fas fa-folder"></i>
                            <span style="margin-left: 10px; font-weight: 500;">File Manager</span>
                        </div>
                        <span style="color: var(--text-secondary);">v1.0.0</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <i class="fas fa-cog"></i>
                            <span style="margin-left: 10px; font-weight: 500;">Settings</span>
                        </div>
                        <span style="color: var(--text-secondary);">v1.0.0</span>
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 30px;">
                <button class="check-updates-btn" 
                        style="padding: 10px 20px; background: var(--bg-tertiary); color: var(--text-primary); 
                               border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer; font-weight: 500;">
                    Check for Updates
                </button>
            </div>
        `;
    }

    getAboutSettings() {
        const { about } = this.settings;
        
        return `
            <h2 style="margin-bottom: 20px; color: var(--accent-primary);">
                <i class="fas fa-info-circle"></i> About TerminalFirst OS
            </h2>
            
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="font-size: 4em; color: var(--accent-primary); margin-bottom: 20px;">
                    <i class="fas fa-terminal"></i>
                </div>
                <h1 style="margin-bottom: 10px; color: var(--text-primary);">TerminalFirst OS</h1>
                <p style="color: var(--text-secondary); margin-bottom: 20px;">
                    A terminal-first operating system for the web
                </p>
                <div style="background: var(--bg-tertiary); border-radius: 8px; padding: 20px; display: inline-block;">
                    <div style="font-size: 2em; font-weight: bold; color: var(--accent-primary);">
                        ${about.version}
                    </div>
                    <div style="color: var(--text-secondary);">Build ${about.build}</div>
                </div>
            </div>
            
            <div style="margin-bottom: 25px;">
                <h4 style="margin-bottom: 15px; color: var(--text-primary);">System Information</h4>
                <div style="display: grid; grid-template-columns: 120px 1fr; gap: 10px; background: var(--bg-tertiary); 
                     padding: 15px; border-radius: 8px;">
                    <div style="color: var(--text-secondary);">Version:</div>
                    <div>${about.version}</div>
                    
                    <div style="color: var(--text-secondary);">Build:</div>
                    <div>${about.build}</div>
                    
                    <div style="color: var(--text-secondary);">Author:</div>
                    <div>${about.author}</div>
                    
                    <div style="color: var(--text-secondary);">Browser:</div>
                    <div>${navigator.userAgent.split(' ')[0]}</div>
                    
                    <div style="color: var(--text-secondary);">Platform:</div>
                    <div>${navigator.platform}</div>
                    
                    <div style="color: var(--text-secondary);">Screen:</div>
                    <div>${screen.width} × ${screen.height}</div>
                </div>
            </div>
            
            <div style="margin-bottom: 25px;">
                <h4 style="margin-bottom: 15px; color: var(--text-primary);">Links</h4>
                <div style="display: flex; gap: 15px;">
                    <a href="#" class="about-link" style="padding: 10px 15px; background: var(--bg-tertiary); 
                       color: var(--text-primary); border-radius: 6px; text-decoration: none; display: flex; 
                       align-items: center; gap: 8px;">
                        <i class="fab fa-github"></i>
                        <span>GitHub</span>
                    </a>
                    <a href="#" class="about-link" style="padding: 10px 15px; background: var(--bg-tertiary); 
                       color: var(--text-primary); border-radius: 6px; text-decoration: none; display: flex; 
                       align-items: center; gap: 8px;">
                        <i class="fas fa-book"></i>
                        <span>Documentation</span>
                    </a>
                    <a href="#" class="about-link" style="padding: 10px 15px; background: var(--bg-tertiary); 
                       color: var(--text-primary); border-radius: 6px; text-decoration: none; display: flex; 
                       align-items: center; gap: 8px;">
                        <i class="fas fa-bug"></i>
                        <span>Report Bug</span>
                    </a>
                </div>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid var(--border-color);">
                <button class="restart-btn" 
                        style="padding: 10px 20px; background: var(--accent-primary); color: white; 
                               border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                    <i class="fas fa-redo"></i> Restart TerminalFirst OS
                </button>
            </div>
        `;
    }

    setupCategoryControls(category, content) {
        // Theme options
        content.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', () => {
                const theme = option.dataset.theme;
                content.querySelectorAll('.theme-option').forEach(opt => {
                    opt.style.borderColor = opt.dataset.theme === theme ? 
                        'var(--accent-primary)' : 'var(--border-color)';
                    opt.classList.toggle('active', opt.dataset.theme === theme);
                });
                
                this.settings.appearance.theme = theme;
                document.documentElement.setAttribute('data-theme', theme);
                
                // Update theme toggle icon in system tray
                const themeIcon = document.querySelector('#theme-toggle i');
                if (themeIcon) {
                    themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
                }
            });
        });
        
        // Toggle switches
        content.querySelectorAll('input[type="checkbox"][data-setting]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const [category, setting] = e.target.dataset.setting.split('.');
                this.settings[category][setting] = e.target.checked;
                
                // Immediate effect for some settings
                if (setting === 'sound') {
                    localStorage.setItem('tfos-sound', e.target.checked ? 'on' : 'off');
                }
            });
        });
        
        // Range sliders
        content.querySelectorAll('input[type="range"][data-setting]').forEach(slider => {
            const valueDisplay = slider.parentElement.querySelector('span:last-child');
            
            slider.addEventListener('input', (e) => {
                const [category, setting] = e.target.dataset.setting.split('.');
                const value = parseFloat(e.target.value);
                this.settings[category][setting] = value;
                
                if (valueDisplay) {
                    if (setting === 'transparency') {
                        valueDisplay.textContent = `${Math.round(value * 100)}%`;
                    } else {
                        valueDisplay.textContent = `${value} commands`;
                    }
                }
            });
        });
        
        // Select dropdowns
        content.querySelectorAll('select[data-setting]').forEach(select => {
            select.addEventListener('change', (e) => {
                const [category, setting] = e.target.dataset.setting.split('.');
                this.settings[category][setting] = e.target.value;
            });
        });
        
        // Apply buttons
        content.querySelectorAll('.apply-btn').forEach(button => {
            button.addEventListener('click', () => {
                const cat = button.dataset.category;
                this.saveSettings();
                
                // Apply changes immediately for some categories
                if (cat === 'appearance') {
                    // Theme is already applied
                    if (window.showNotification) {
                        window.showNotification({
                            title: 'Appearance Updated',
                            message: 'Appearance settings have been applied',
                            type: 'success'
                        });
                    }
                } else if (cat === 'terminal') {
                    // Terminal settings might need reload
                    if (window.showNotification) {
                        window.showNotification({
                            title: 'Terminal Settings',
                            message: 'Terminal settings will apply on next restart',
                            type: 'info'
                        });
                    }
                }
            });
        });
        
        // Reset buttons
        content.querySelectorAll('.reset-btn').forEach(button => {
            button.addEventListener('click', () => {
                const category = button.dataset.reset;
                if (confirm(`Reset ${category} settings to defaults?`)) {
                    this.resetCategory(category);
                    this.loadCategory(this.currentCategory, content);
                }
            });
        });
        
        // Clear cache button
        content.querySelectorAll('.clear-btn').forEach(button => {
            button.addEventListener('click', () => {
                if (confirm('Clear all cached data?\nThis will log you out and reset some settings.')) {
                    localStorage.clear();
                    location.reload();
                }
            });
        });
        
        // Check updates button
        content.querySelectorAll('.check-updates-btn').forEach(button => {
            button.addEventListener('click', () => {
                if (window.showNotification) {
                    window.showNotification({
                        title: 'Checking Updates',
                        message: 'No updates available. You have the latest version!',
                        type: 'info'
                    });
                }
            });
        });
        
        // Restart button
        content.querySelectorAll('.restart-btn').forEach(button => {
            button.addEventListener('click', () => {
                if (confirm('Restart TerminalFirst OS?\nUnsaved work may be lost.')) {
                    location.reload();
                }
            });
        });
        
        // About links
        content.querySelectorAll('.about-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const text = link.querySelector('span').textContent;
                
                if (window.showNotification) {
                    window.showNotification({
                        title: `${text} Link`,
                        message: `Opening ${text}... (simulated)`,
                        type: 'info'
                    });
                }
            });
        });
    }

    resetCategory(category) {
        const defaultSettings = this.loadSettings();
        this.settings[category] = { ...defaultSettings[category] };
        this.saveSettings();
        
        // Apply theme immediately
        if (category === 'appearance') {
            document.documentElement.setAttribute('data-theme', this.settings.appearance.theme);
        }
    }

    // ===== CLI HANDLERS =====
    handleCLIOpen() {
        this.launch();
        return 'Opening settings...';
    }

    handleCLIConfig(args) {
        if (args.length === 0) {
            return 'Usage: config [setting] [value]\nExample: config theme dark';
        }
        
        if (args.length === 1) {
            // Get setting value
            const setting = args[0];
            let value;
            
            switch(setting) {
                case 'theme':
                    value = this.settings.appearance.theme;
                    break;
                case 'sound':
                    value = this.settings.system.sound ? 'on' : 'off';
                    break;
                case 'font':
                    value = this.settings.terminal.font;
                    break;
                default:
                    return `Unknown setting: ${setting}`;
            }
            
            return `${setting}: ${value}`;
        } else if (args.length === 2) {
            // Set setting value
            const [setting, value] = args;
            let success = false;
            let message = '';
            
            switch(setting) {
                case 'theme':
                    if (value === 'dark' || value === 'light') {
                        this.settings.appearance.theme = value;
                        document.documentElement.setAttribute('data-theme', value);
                        localStorage.setItem('tfos-theme', value);
                        success = true;
                        message = `Theme set to ${value}`;
                    } else {
                        message = 'Invalid theme. Use "dark" or "light"';
                    }
                    break;
                    
                case 'sound':
                    if (value === 'on' || value === 'off') {
                        this.settings.system.sound = value === 'on';
                        localStorage.setItem('tfos-sound', value);
                        success = true;
                        message = `Sound effects ${value}`;
                    } else {
                        message = 'Invalid value. Use "on" or "off"';
                    }
                    break;
                    
                default:
                    message = `Cannot set ${setting} via CLI`;
            }
            
            if (success) {
                this.saveSettings();
            }
            
            return message;
        } else {
            return 'Usage: config [setting] [value]';
        }
    }

    // ===== PUBLIC API =====
    getCLICommands() {
        return this.cliCommands;
    }

    getSetting(category, setting) {
        return this.settings[category]?.[setting];
    }

    setSetting(category, setting, value) {
        if (this.settings[category]) {
            this.settings[category][setting] = value;
            this.saveSettings();
            return true;
        }
        return false;
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
        console.log('🧹 Settings cleaned up');
    }
}

// Create global instance
const settingsApp = new SettingsApp();

// Export for use in other modules
window.settingsApp = settingsApp;

// Register CLI commands
if (window.TFSH) {
    Object.entries(settingsApp.getCLICommands()).forEach(([cmd, info]) => {
        window.TFSH.registerCommand(cmd, info.handler, info.description);
    });
}

// Auto-launch for demo
setTimeout(() => {
    console.log('⚙️ Settings ready. Use "run settings" or "settings" to launch.');
}, 1000);

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    settingsApp.cleanup();
});

window.settingsApp = settingsApp;