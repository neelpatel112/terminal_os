// ===== TEXT EDITOR APPLICATION =====
console.log('📝 Initializing Text Editor...');

class TextEditor {
    constructor() {
        this.name = 'editor';
        this.version = '1.0.0';
        this.currentFile = null;
        this.unsavedChanges = false;
        this.isInitialized = false;
        this.windowId = null;
        this.cliCommands = {};
        this.initCLICommands();
    }

    initCLICommands() {
        this.cliCommands = {
            'edit': {
                description: 'Open a file in the text editor',
                handler: (args) => this.handleCLIEdit(args)
            },
            'create': {
                description: 'Create and edit a new file',
                handler: (args) => this.handleCLICreate(args)
            }
        };
    }

    // ===== GUI METHODS =====
    launch() {
        if (window.windowManager) {
            this.windowId = window.windowManager.createWindow('editor', {
                title: 'Text Editor - Untitled',
                width: 800,
                height: 600
            });
            
            this.initEditorUI();
            this.isInitialized = true;
            console.log('✅ Text Editor launched');
            return this.windowId;
        }
        return null;
    }

    initEditorUI() {
        const windowInfo = window.windowManager?.getWindowById(this.windowId);
        if (!windowInfo) return;
        
        const editor = windowInfo.element;
        
        // Get UI elements
        const textarea = editor.querySelector('.editor-textarea');
        const toolbar = editor.querySelector('.editor-toolbar');
        
        if (!textarea || !toolbar) return;
        
        // Setup toolbar buttons
        this.setupToolbarButtons(toolbar, textarea);
        
        // Setup textarea events
        textarea.addEventListener('input', () => {
            this.unsavedChanges = true;
            this.updateWindowTitle();
        });
        
        // Auto-save every 30 seconds
        setInterval(() => {
            if (this.unsavedChanges && this.currentFile) {
                this.saveFile(textarea.value);
            }
        }, 30000);
        
        // Load sample content
        setTimeout(() => {
            textarea.value = `# Welcome to Text Editor

This is a sample text editor for TerminalFirst OS.

Features:
- Syntax highlighting (coming soon)
- File management
- Auto-save
- Toolbar actions

Try these toolbar buttons:
• New - Create a new file
• Open - Open an existing file
• Save - Save current file
• Run - Execute code (if applicable)

Keyboard shortcuts:
Ctrl+S - Save
Ctrl+O - Open
Ctrl+N - New
Ctrl+F - Find (coming soon)
`;
        }, 100);
    }

    setupToolbarButtons(toolbar, textarea) {
        // New button
        const newBtn = toolbar.querySelector('[data-action="new"]');
        if (newBtn) {
            newBtn.addEventListener('click', () => {
                if (this.unsavedChanges) {
                    if (!confirm('You have unsaved changes. Create new file anyway?')) {
                        return;
                    }
                }
                this.newFile(textarea);
            });
        }
        
        // Open button
        const openBtn = toolbar.querySelector('[data-action="open"]');
        if (openBtn) {
            openBtn.addEventListener('click', () => {
                this.openFileDialog(textarea);
            });
        }
        
        // Save button
        const saveBtn = toolbar.querySelector('[data-action="save"]');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveFile(textarea.value);
            });
        }
        
        // Run button
        const runBtn = toolbar.querySelector('[data-action="run"]');
        if (runBtn) {
            runBtn.addEventListener('click', () => {
                this.runCode(textarea.value);
            });
        }
        
        // Add more toolbar buttons
        this.addCustomToolbarButtons(toolbar, textarea);
        
        // Add keyboard shortcuts
        this.addKeyboardShortcuts(textarea);
    }

    addCustomToolbarButtons(toolbar, textarea) {
        // Add find button
        const findBtn = document.createElement('button');
        findBtn.className = 'toolbar-btn';
        findBtn.innerHTML = '<i class="fas fa-search"></i>';
        findBtn.title = 'Find (Ctrl+F)';
        findBtn.addEventListener('click', () => {
            this.showFindDialog(textarea);
        });
        
        // Add theme toggle button
        const themeBtn = document.createElement('button');
        themeBtn.className = 'toolbar-btn';
        themeBtn.innerHTML = '<i class="fas fa-palette"></i>';
        themeBtn.title = 'Toggle theme';
        themeBtn.addEventListener('click', () => {
            this.toggleEditorTheme(textarea);
        });
        
        // Add spacer
        const spacer = document.createElement('div');
        spacer.style.flex = '1';
        
        // Insert before run button
        toolbar.insertBefore(findBtn, toolbar.querySelector('[data-action="run"]'));
        toolbar.insertBefore(themeBtn, toolbar.querySelector('[data-action="run"]'));
        toolbar.insertBefore(spacer, toolbar.querySelector('[data-action="run"]'));
    }

    addKeyboardShortcuts(textarea) {
        textarea.addEventListener('keydown', (e) => {
            // Ctrl+S - Save
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveFile(textarea.value);
            }
            
            // Ctrl+O - Open
            if (e.ctrlKey && e.key === 'o') {
                e.preventDefault();
                this.openFileDialog(textarea);
            }
            
            // Ctrl+N - New
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                this.newFile(textarea);
            }
            
            // Ctrl+F - Find
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                this.showFindDialog(textarea);
            }
        });
    }

    // ===== FILE OPERATIONS =====
    newFile(textarea) {
        if (this.unsavedChanges) {
            if (!confirm('You have unsaved changes. Create new file anyway?')) {
                return;
            }
        }
        
        textarea.value = '';
        this.currentFile = null;
        this.unsavedChanges = false;
        this.updateWindowTitle();
        
        if (window.showNotification) {
            window.showNotification({
                title: 'New File',
                message: 'Created new file',
                type: 'info'
            });
        }
    }

    openFileDialog(textarea) {
        // Create file dialog
        const dialog = document.createElement('div');
        dialog.className = 'editor-dialog';
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
        
        // Sample files
        const sampleFiles = [
            { name: 'welcome.txt', path: '/home/guest/welcome.txt' },
            { name: 'todo.md', path: '/home/guest/todo.md' },
            { name: 'config.json', path: '/home/guest/.config.json' },
            { name: 'script.js', path: '/home/guest/script.js' },
            { name: 'notes.md', path: '/home/guest/documents/notes.md' }
        ];
        
        dialog.innerHTML = `
            <h3 style="margin-bottom: 15px; color: var(--accent-primary);">
                <i class="fas fa-folder-open"></i> Open File
            </h3>
            <div style="margin-bottom: 15px; max-height: 300px; overflow-y: auto;">
                ${sampleFiles.map(file => `
                    <div class="file-item" data-path="${file.path}" 
                         style="padding: 8px 12px; margin: 2px 0; cursor: pointer; border-radius: 4px; 
                                background: var(--bg-tertiary); display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-file"></i>
                        <span>${file.name}</span>
                        <small style="margin-left: auto; color: var(--text-secondary);">${file.path}</small>
                    </div>
                `).join('')}
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 15px;">
                <button class="dialog-btn cancel" style="padding: 8px 16px; border: 1px solid var(--border-color); 
                        background: transparent; border-radius: 4px; cursor: pointer;">Cancel</button>
            </div>
        `;
        
        const editorWindow = window.windowManager?.getWindowById(this.windowId)?.element;
        if (editorWindow) {
            editorWindow.appendChild(dialog);
        }
        
        // Handle file selection
        dialog.querySelectorAll('.file-item').forEach(item => {
            item.addEventListener('click', () => {
                const path = item.dataset.path;
                this.openFile(path, textarea);
                dialog.remove();
            });
        });
        
        // Handle cancel
        dialog.querySelector('.cancel').addEventListener('click', () => {
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

    openFile(filePath, textarea) {
        // In a real app, this would read from the filesystem
        const fileContents = {
            '/home/guest/welcome.txt': 'Welcome to TerminalFirst OS!\nThis is a sample file opened in the text editor.',
            '/home/guest/todo.md': '# TODO List\n\n## Today\n- [ ] Finish text editor\n- [ ] Add syntax highlighting\n- [ ] Implement file browser\n\n## Tomorrow\n- [ ] Add plugins system\n- [ ] Create themes',
            '/home/guest/.config.json': '{\n  "editor": {\n    "theme": "dark",\n    "fontSize": 14,\n    "wordWrap": true\n  },\n  "terminal": {\n    "font": "JetBrains Mono"\n  }\n}',
            '/home/guest/script.js': '// Sample JavaScript\n\nfunction greet(name) {\n    console.log(`Hello, ${name}!`);\n}\n\n// Run the function\ngreet("TerminalFirst OS");',
            '/home/guest/documents/notes.md': '# Meeting Notes\n\n## Project Discussion\n- Need to improve terminal performance\n- Add more built-in applications\n- Implement package manager\n\n## Next Steps\n1. Fix window resizing bug\n2. Add drag and drop support\n3. Create documentation'
        };
        
        const content = fileContents[filePath] || `File: ${filePath}\n\nThis is a simulated file content.\n\nIn a real implementation, this would be loaded from the filesystem.`;
        
        textarea.value = content;
        this.currentFile = filePath;
        this.unsavedChanges = false;
        this.updateWindowTitle();
        
        // Apply syntax highlighting based on file extension
        this.applySyntaxHighlighting(filePath, textarea);
        
        if (window.showNotification) {
            window.showNotification({
                title: 'File Opened',
                message: `Opened: ${filePath.split('/').pop()}`,
                type: 'success'
            });
        }
    }

    saveFile(content) {
        if (!this.currentFile) {
            this.saveFileAs(content);
            return;
        }
        
        // In a real app, this would save to filesystem
        console.log(`Saving to ${this.currentFile}:`, content.substring(0, 100) + '...');
        
        this.unsavedChanges = false;
        this.updateWindowTitle();
        
        if (window.showNotification) {
            window.showNotification({
                title: 'File Saved',
                message: `Saved: ${this.currentFile.split('/').pop()}`,
                type: 'success'
            });
        }
    }

    saveFileAs(content) {
        // Create save dialog
        const dialog = document.createElement('div');
        dialog.className = 'editor-dialog';
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
        
        dialog.innerHTML = `
            <h3 style="margin-bottom: 15px; color: var(--accent-primary);">
                <i class="fas fa-save"></i> Save File As
            </h3>
            <div style="margin-bottom: 15px;">
                <input type="text" id="save-filename" placeholder="filename.txt" 
                       style="width: 100%; padding: 10px; border: 1px solid var(--border-color); 
                              border-radius: 4px; background: var(--bg-tertiary); color: var(--text-primary);">
            </div>
            <div style="margin-bottom: 15px;">
                <select id="save-location" style="width: 100%; padding: 10px; border: 1px solid var(--border-color); 
                        border-radius: 4px; background: var(--bg-tertiary); color: var(--text-primary);">
                    <option value="/home/guest">Home Directory</option>
                    <option value="/home/guest/documents">Documents</option>
                    <option value="/home/guest/downloads">Downloads</option>
                    <option value="/home/guest/pictures">Pictures</option>
                </select>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 10px;">
                <button class="dialog-btn cancel" style="padding: 8px 16px; border: 1px solid var(--border-color); 
                        background: transparent; border-radius: 4px; cursor: pointer;">Cancel</button>
                <button class="dialog-btn save" style="padding: 8px 16px; background: var(--accent-primary); 
                        color: white; border: none; border-radius: 4px; cursor: pointer;">Save</button>
            </div>
        `;
        
        const editorWindow = window.windowManager?.getWindowById(this.windowId)?.element;
        if (editorWindow) {
            editorWindow.appendChild(dialog);
            
            const filenameInput = dialog.querySelector('#save-filename');
            filenameInput.focus();
            
            // Handle save
            dialog.querySelector('.save').addEventListener('click', () => {
                const filename = filenameInput.value.trim();
                const location = dialog.querySelector('#save-location').value;
                
                if (filename) {
                    this.currentFile = `${location}/${filename}`;
                    this.saveFile(content);
                    dialog.remove();
                } else {
                    filenameInput.style.borderColor = 'var(--accent-danger)';
                }
            });
            
            // Handle cancel
            dialog.querySelector('.cancel').addEventListener('click', () => {
                dialog.remove();
            });
            
            // Enter to save
            filenameInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    dialog.querySelector('.save').click();
                }
            });
        }
    }

    // ===== EDITOR FEATURES =====
    showFindDialog(textarea) {
        const dialog = document.createElement('div');
        dialog.className = 'editor-dialog';
        dialog.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 15px;
            box-shadow: var(--shadow-heavy);
            z-index: 10001;
            min-width: 300px;
        `;
        
        dialog.innerHTML = `
            <h4 style="margin-bottom: 10px; color: var(--accent-primary);">
                <i class="fas fa-search"></i> Find
            </h4>
            <div style="margin-bottom: 10px; display: flex; gap: 10px;">
                <input type="text" id="find-text" placeholder="Search for..." 
                       style="flex: 1; padding: 8px; border: 1px solid var(--border-color); 
                              border-radius: 4px; background: var(--bg-tertiary); color: var(--text-primary);">
                <button id="find-next" style="padding: 8px 12px; background: var(--accent-primary); 
                        color: white; border: none; border-radius: 4px; cursor: pointer;">Find</button>
            </div>
            <div style="display: flex; gap: 5px; font-size: 0.9em;">
                <label style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                    <input type="checkbox" id="find-case"> Case sensitive
                </label>
                <label style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                    <input type="checkbox" id="find-whole"> Whole word
                </label>
            </div>
        `;
        
        const editorWindow = window.windowManager?.getWindowById(this.windowId)?.element;
        if (editorWindow) {
            editorWindow.appendChild(dialog);
            
            const findText = dialog.querySelector('#find-text');
            const findNext = dialog.querySelector('#find-next');
            
            findText.focus();
            
            findNext.addEventListener('click', () => {
                this.findInText(textarea, findText.value, dialog);
            });
            
            findText.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.findInText(textarea, findText.value, dialog);
                } else if (e.key === 'Escape') {
                    dialog.remove();
                }
            });
            
            // Close when clicking outside
            setTimeout(() => {
                const closeDialog = (e) => {
                    if (!dialog.contains(e.target) && e.target !== findText) {
                        dialog.remove();
                        document.removeEventListener('click', closeDialog);
                    }
                };
                document.addEventListener('click', closeDialog);
            }, 10);
        }
    }

    findInText(textarea, searchText, dialog) {
        if (!searchText) return;
        
        const content = textarea.value;
        const caseSensitive = dialog.querySelector('#find-case').checked;
        const wholeWord = dialog.querySelector('#find-whole').checked;
        
        let searchRegex;
        if (wholeWord) {
            searchRegex = caseSensitive ? 
                new RegExp(`\\b${searchText}\\b`, 'g') :
                new RegExp(`\\b${searchText}\\b`, 'gi');
        } else {
            searchRegex = caseSensitive ? 
                new RegExp(searchText, 'g') :
                new RegExp(searchText, 'gi');
        }
        
        const matches = content.match(searchRegex);
        const matchCount = matches ? matches.length : 0;
        
        // Update dialog with match count
        const findBtn = dialog.querySelector('#find-next');
        findBtn.textContent = matchCount > 0 ? `Find (${matchCount})` : 'Find (0)';
        findBtn.style.background = matchCount > 0 ? 'var(--accent-secondary)' : 'var(--accent-danger)';
        
        // Highlight first match (in a real editor, you'd scroll to it)
        if (matchCount > 0) {
            const firstMatch = searchRegex.exec(content);
            if (firstMatch) {
                textarea.focus();
                textarea.setSelectionRange(firstMatch.index, firstMatch.index + firstMatch[0].length);
            }
        }
    }

    toggleEditorTheme(textarea) {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const isDark = currentTheme === 'dark';
        
        // Toggle between dark and light editor themes
        if (isDark) {
            textarea.style.backgroundColor = '#ffffff';
            textarea.style.color = '#000000';
            textarea.style.border = '1px solid #e0e0e0';
        } else {
            textarea.style.backgroundColor = 'var(--bg-secondary)';
            textarea.style.color = 'var(--text-primary)';
            textarea.style.border = 'none';
        }
    }

    applySyntaxHighlighting(filePath, textarea) {
        const ext = filePath.split('.').pop().toLowerCase();
        
        // Remove any existing highlighting
        textarea.className = 'editor-textarea';
        
        // Add class based on file extension
        if (['js', 'javascript', 'json'].includes(ext)) {
            textarea.classList.add('language-javascript');
        } else if (ext === 'md' || ext === 'markdown') {
            textarea.classList.add('language-markdown');
        } else if (ext === 'html') {
            textarea.classList.add('language-html');
        } else if (ext === 'css') {
            textarea.classList.add('language-css');
        } else if (ext === 'py') {
            textarea.classList.add('language-python');
        }
        
        // In a real app, you would apply actual syntax highlighting here
        console.log(`Applied syntax highlighting for .${ext} file`);
    }

    runCode(code) {
        // Simple code execution for demo
        try {
            const lines = code.split('\n');
            const firstLine = lines[0] || '';
            
            if (firstLine.includes('console.log') || code.includes('console.log')) {
                // Simulate JavaScript execution
                const fakeOutput = code.match(/console\.log\(['"](.*?)['"]\)/g);
                if (fakeOutput) {
                    const messages = fakeOutput.map(log => 
                        log.match(/console\.log\(['"](.*?)['"]\)/)[1]
                    );
                    
                    if (window.showNotification) {
                        window.showNotification({
                            title: 'Code Executed',
                            message: `Output: ${messages.join(', ')}`,
                            type: 'info'
                        });
                    }
                }
            } else if (code.includes('#!') || code.includes('function')) {
                if (window.showNotification) {
                    window.showNotification({
                        title: 'Code Ready',
                        message: 'Code loaded successfully. Click Run in terminal to execute.',
                        type: 'info'
                    });
                }
            }
        } catch (error) {
            console.error('Code execution error:', error);
        }
    }

    updateWindowTitle() {
        const windowInfo = window.windowManager?.getWindowById(this.windowId);
        if (!windowInfo) return;
        
        let title = 'Text Editor';
        if (this.currentFile) {
            const filename = this.currentFile.split('/').pop();
            title = `${filename}${this.unsavedChanges ? ' *' : ''}`;
        } else if (this.unsavedChanges) {
            title = 'Untitled *';
        }
        
        const titleElement = windowInfo.element.querySelector('.window-title span');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }

    // ===== CLI HANDLERS =====
    handleCLIEdit(args) {
        if (args.length === 0) {
            return 'Usage: edit [filename]\nOpens a file in the text editor';
        }
        
        const filename = args[0];
        this.launch();
        
        // Simulate opening file after a delay
        setTimeout(() => {
            if (this.windowId) {
                const windowInfo = window.windowManager?.getWindowById(this.windowId);
                if (windowInfo) {
                    const textarea = windowInfo.element.querySelector('.editor-textarea');
                    if (textarea) {
                        this.openFile(filename, textarea);
                    }
                }
            }
        }, 500);
        
        return `Opening ${filename} in text editor...`;
    }

    handleCLICreate(args) {
        const filename = args[0] || 'newfile.txt';
        this.launch();
        
        setTimeout(() => {
            if (this.windowId) {
                const windowInfo = window.windowManager?.getWindowById(this.windowId);
                if (windowInfo) {
                    const textarea = windowInfo.element.querySelector('.editor-textarea');
                    if (textarea) {
                        textarea.value = `# ${filename}\n\nCreated: ${new Date().toLocaleString()}\n\nStart editing here...`;
                        this.currentFile = `/home/guest/${filename}`;
                        this.updateWindowTitle();
                    }
                }
            }
        }, 500);
        
        return `Creating new file: ${filename}`;
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
        console.log('🧹 Text Editor cleaned up');
    }
}

// Create global instance
const textEditor = new TextEditor();

// Export for use in other modules
window.textEditor = textEditor;

// Register CLI commands
if (window.TFSH) {
    Object.entries(textEditor.getCLICommands()).forEach(([cmd, info]) => {
        window.TFSH.registerCommand(cmd, info.handler, info.description);
    });
}

// Auto-launch for demo
setTimeout(() => {
    // Don't auto-launch, let user launch via terminal
    console.log('📝 Text Editor ready. Use "run editor" or "edit [file]" to launch.');
}, 1000);

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    textEditor.cleanup();
});

window.textEditor = textEditor;