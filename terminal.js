// ===== TERMINAL UI MANAGER =====
console.log('⌨️ Initializing Terminal UI Manager...');

class TerminalUIManager {
    constructor() {
        this.terminalElement = null;
        this.inputElement = null;
        this.outputElement = null;
        this.suggestionsElement = null;
        this.commandHistory = [];
        this.historyIndex = -1;
        this.currentDirectory = '/home/guest';
        this.terminalReady = false;
        this.autoCompleteEnabled = true;
        this.initCommands();
    }

    init() {
        this.terminalElement = document.getElementById('terminal-window');
        this.inputElement = document.getElementById('terminal-input');
        this.outputElement = document.getElementById('terminal-output');
        this.suggestionsElement = document.getElementById('suggestions');
        
        if (!this.inputElement || !this.outputElement) {
            console.error('❌ Terminal elements not found');
            return;
        }
        
        this.setupEventListeners();
        this.printWelcomeMessage();
        this.terminalReady = true;
        
        console.log('✅ Terminal UI initialized');
    }

    initCommands() {
        this.commands = {
            'help': {
                description: 'Show this help message',
                handler: (args) => this.handleHelp(args)
            },
            'clear': {
                description: 'Clear the terminal screen',
                handler: () => this.handleClear()
            },
            'echo': {
                description: 'Print text to terminal',
                handler: (args) => this.handleEcho(args)
            },
            'ls': {
                description: 'List directory contents',
                handler: (args) => this.handleLs(args)
            },
            'cd': {
                description: 'Change directory',
                handler: (args) => this.handleCd(args)
            },
            'pwd': {
                description: 'Print working directory',
                handler: () => this.handlePwd()
            },
            'cat': {
                description: 'Display file contents',
                handler: (args) => this.handleCat(args)
            },
            'mkdir': {
                description: 'Create a directory',
                handler: (args) => this.handleMkdir(args)
            },
            'touch': {
                description: 'Create an empty file',
                handler: (args) => this.handleTouch(args)
            },
            'rm': {
                description: 'Remove files or directories',
                handler: (args) => this.handleRm(args)
            },
            'date': {
                description: 'Display current date and time',
                handler: () => this.handleDate()
            },
            'whoami': {
                description: 'Display current user',
                handler: () => this.handleWhoami()
            },
            'theme': {
                description: 'Change terminal theme',
                handler: (args) => this.handleTheme(args)
            },
            'gui': {
                description: 'Toggle graphical interface',
                handler: () => this.handleGui()
            },
            'run': {
                description: 'Launch an application',
                handler: (args) => this.handleRun(args)
            },
            'apps': {
                description: 'List available applications',
                handler: () => this.handleApps()
            },
            'notify': {
                description: 'Send a notification',
                handler: (args) => this.handleNotify(args)
            },
            'sound': {
                description: 'Toggle sound effects',
                handler: (args) => this.handleSound(args)
            },
            'history': {
                description: 'Show command history',
                handler: () => this.handleHistory()
            },
            'neofetch': {
                description: 'Display system information',
                handler: () => this.handleNeofetch()
            }
        };
    }

    setupEventListeners() {
        // Input handling
        this.inputElement.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });
        
        this.inputElement.addEventListener('input', () => {
            this.updateSuggestions();
        });
        
        // Click to focus
        this.terminalElement?.addEventListener('click', () => {
            this.inputElement.focus();
        });
        
        // Focus input on window focus
        window.addEventListener('focus', () => {
            if (this.terminalElement?.classList.contains('active-window')) {
                this.inputElement.focus();
            }
        });
    }

    handleKeyDown(e) {
        switch(e.key) {
            case 'Enter':
                e.preventDefault();
                this.executeCommand();
                break;
                
            case 'Tab':
                e.preventDefault();
                this.handleTabCompletion();
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                this.navigateHistory('up');
                break;
                
            case 'ArrowDown':
                e.preventDefault();
                this.navigateHistory('down');
                break;
                
            case 'c':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.printOutput('^C', 'info');
                    this.printPrompt();
                }
                break;
                
            case 'l':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.handleClear();
                }
                break;
        }
    }

    // ===== COMMAND EXECUTION =====
    executeCommand() {
        const command = this.inputElement.value.trim();
        if (!command) {
            this.printPrompt();
            return;
        }
        
        // Add to history
        this.addToHistory(command);
        
        // Print command
        this.printCommand(command);
        
        // Parse and execute
        const [cmd, ...args] = command.split(' ');
        const flags = {};
        
        // Parse flags
        for (let i = 0; i < args.length; i++) {
            if (args[i].startsWith('--')) {
                const flagName = args[i].slice(2);
                if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
                    flags[flagName] = args[i + 1];
                    i++;
                } else {
                    flags[flagName] = true;
                }
            }
        }
        
        const positionalArgs = args.filter(arg => !arg.startsWith('--'));
        
        // Execute command
        const result = this.executeParsedCommand(cmd, positionalArgs, flags);
        
        // Print result
        if (result !== undefined && result !== '') {
            this.printOutput(result);
        }
        
        // Clear input and print new prompt
        this.inputElement.value = '';
        this.hideSuggestions();
        this.printPrompt();
        
        // Scroll to bottom
        this.scrollToBottom();
    }

    executeParsedCommand(cmd, args, flags) {
        if (!this.commands[cmd]) {
            return `Command not found: ${cmd}\nType 'help' for available commands`;
        }
        
        try {
            return this.commands[cmd].handler(args, flags);
        } catch (error) {
            console.error(`Command error: ${cmd}`, error);
            return `Error: ${error.message}`;
        }
    }

    // ===== COMMAND HANDLERS =====
    handleHelp(args) {
        if (args.length === 0) {
            let helpText = 'Available commands:\n\n';
            
            Object.entries(this.commands).forEach(([cmd, info]) => {
                helpText += `  ${cmd.padEnd(15)} ${info.description}\n`;
            });
            
            helpText += '\nType "help [command]" for more information';
            return helpText;
        } else {
            const cmd = args[0];
            if (this.commands[cmd]) {
                return `${cmd} - ${this.commands[cmd].description}`;
            } else {
                return `No help available for: ${cmd}`;
            }
        }
    }

    handleClear() {
        this.outputElement.innerHTML = '';
        return '';
    }

    handleEcho(args) {
        return args.join(' ');
    }

    handleLs(args) {
        const path = args[0] || this.currentDirectory;
        
        // Simulate file listing
        const files = {
            '/home/guest': [
                { name: 'documents', type: 'directory' },
                { name: 'downloads', type: 'directory' },
                { name: 'pictures', type: 'directory' },
                { name: 'welcome.txt', type: 'file' },
                { name: 'todo.md', type: 'file' },
                { name: '.config.json', type: 'file' }
            ],
            '/': [
                { name: 'bin', type: 'directory' },
                { name: 'etc', type: 'directory' },
                { name: 'home', type: 'directory' },
                { name: 'tmp', type: 'directory' },
                { name: 'usr', type: 'directory' }
            ]
        };
        
        const dirFiles = files[path] || [];
        if (dirFiles.length === 0) {
            return `ls: cannot access '${path}': No such file or directory`;
        }
        
        return dirFiles.map(f => f.name).join('  ');
    }

    handleCd(args) {
        const path = args[0] || '/home/guest';
        
        const validPaths = ['/', '/home', '/home/guest', '/documents', '/downloads', '/pictures'];
        if (validPaths.includes(path)) {
            this.currentDirectory = path;
            return '';
        } else if (path === '..') {
            // Go to parent directory
            if (this.currentDirectory === '/') {
                return '';
            }
            const parts = this.currentDirectory.split('/').filter(p => p);
            parts.pop();
            this.currentDirectory = '/' + parts.join('/') || '/';
            return '';
        } else if (path === '~') {
            this.currentDirectory = '/home/guest';
            return '';
        } else {
            return `cd: no such directory: ${path}`;
        }
    }

    handlePwd() {
        return this.currentDirectory;
    }

    handleCat(args) {
        if (args.length === 0) {
            return 'Usage: cat [filename]';
        }
        
        const filename = args[0];
        const fileContents = {
            'welcome.txt': 'Welcome to TerminalFirst OS!\nThis is your home directory.',
            'todo.md': '# TODO List\n\n- [ ] Explore the terminal\n- [ ] Try some commands\n- [ ] Launch applications',
            '.config.json': '{\n  "theme": "dark",\n  "editor": "enabled"\n}'
        };
        
        if (fileContents[filename]) {
            return fileContents[filename];
        } else {
            return `cat: ${filename}: No such file`;
        }
    }

    handleMkdir(args) {
        if (args.length === 0) {
            return 'Usage: mkdir [directory_name]';
        }
        
        const dirname = args[0];
        this.printOutput(`Created directory: ${dirname}`, 'success');
        return '';
    }

    handleTouch(args) {
        if (args.length === 0) {
            return 'Usage: touch [filename]';
        }
        
        const filename = args[0];
        this.printOutput(`Created file: ${filename}`, 'success');
        return '';
    }

    handleRm(args) {
        if (args.length === 0) {
            return 'Usage: rm [file_or_directory]';
        }
        
        const target = args[0];
        this.printOutput(`Removed: ${target}`, 'warning');
        return '';
    }

    handleDate() {
        return new Date().toLocaleString();
    }

    handleWhoami() {
        return localStorage.getItem('tfos-user') || 'guest';
    }

    handleTheme(args) {
        if (args.length === 0) {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            return `Current theme: ${currentTheme}`;
        }
        
        const theme = args[0];
        if (theme === 'dark' || theme === 'light') {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('tfos-theme', theme);
            
            // Update theme toggle icon
            const themeIcon = document.querySelector('#theme-toggle i');
            if (themeIcon) {
                themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
            
            return `Theme changed to ${theme}`;
        } else {
            return 'Invalid theme. Use "dark" or "light"';
        }
    }

    handleGui() {
        const taskbar = document.querySelector('.taskbar');
        if (taskbar.style.display === 'none') {
            taskbar.style.display = 'flex';
            return 'Graphical interface enabled';
        } else {
            taskbar.style.display = 'none';
            return 'Graphical interface disabled';
        }
    }

    handleRun(args) {
        if (args.length === 0) {
            return 'Usage: run [application_name]\nType "apps" for available applications';
        }
        
        const app = args[0];
        const validApps = ['editor', 'files', 'settings', 'calculator', 'browser'];
        
        if (validApps.includes(app)) {
            // Launch app through window manager if available
            if (window.windowManager) {
                window.windowManager.createWindow(app);
            }
            return `Launching ${app}...`;
        } else {
            return `Application not found: ${app}`;
        }
    }

    handleApps() {
        return `
Available Applications:
---------------------
• editor     - Text editor
• files      - File manager
• settings   - System settings
• calculator - Calculator
• browser    - Web browser

Usage: run [app_name]
        `;
    }

    handleNotify(args) {
        const title = args[0] || 'Notification';
        const message = args.slice(1).join(' ') || 'Hello from TerminalFirst OS!';
        
        if (window.showNotification) {
            window.showNotification({
                title,
                message,
                type: 'info'
            });
        }
        
        return `Notification sent: "${title}"`;
    }

    handleSound(args) {
        if (args.length === 0) {
            const current = localStorage.getItem('tfos-sound') || 'on';
            return `Sound effects: ${current}`;
        }
        
        const state = args[0];
        if (state === 'on' || state === 'off') {
            localStorage.setItem('tfos-sound', state);
            return `Sound effects ${state}`;
        } else {
            return 'Invalid state. Use "on" or "off"';
        }
    }

    handleHistory() {
        if (this.commandHistory.length === 0) {
            return 'No command history';
        }
        
        let historyText = 'Command history:\n';
        this.commandHistory.forEach((cmd, index) => {
            historyText += `  ${index + 1}  ${cmd}\n`;
        });
        
        return historyText;
    }

    handleNeofetch() {
        const user = localStorage.getItem('tfos-user') || 'guest';
        const theme = document.documentElement.getAttribute('data-theme') || 'dark';
        
        return `
             ${user}@terminal-first
             ----------------------------
             OS: TerminalFirst OS v1.0.0
             Shell: tfsh 1.0
             Theme: ${theme}
             Uptime: ${Math.floor(performance.now() / 1000)}s
             
             TerminalFirst - A terminal-first web OS
             https://github.com/yourusername/terminal-first-os
        `;
    }

    // ===== HISTORY MANAGEMENT =====
    addToHistory(command) {
        if (this.commandHistory[this.commandHistory.length - 1] !== command) {
            this.commandHistory.push(command);
            if (this.commandHistory.length > 50) {
                this.commandHistory.shift();
            }
        }
        this.historyIndex = -1;
    }

    navigateHistory(direction) {
        if (this.commandHistory.length === 0) return;
        
        if (direction === 'up') {
            if (this.historyIndex < this.commandHistory.length - 1) {
                this.historyIndex++;
                this.inputElement.value = this.commandHistory[this.commandHistory.length - 1 - this.historyIndex];
            }
        } else if (direction === 'down') {
            if (this.historyIndex > 0) {
                this.historyIndex--;
                this.inputElement.value = this.commandHistory[this.commandHistory.length - 1 - this.historyIndex];
            } else {
                this.historyIndex = -1;
                this.inputElement.value = '';
            }
        }
        
        // Move cursor to end
        this.inputElement.selectionStart = this.inputElement.selectionEnd = this.inputElement.value.length;
    }

    // ===== AUTO-COMPLETION =====
    handleTabCompletion() {
        const input = this.inputElement.value.trim();
        if (!input) return;
        
        const commands = Object.keys(this.commands);
        const matches = commands.filter(cmd => 
            cmd.startsWith(input.toLowerCase())
        );
        
        if (matches.length === 1) {
            this.inputElement.value = matches[0] + ' ';
        } else if (matches.length > 1) {
            // Show all matches
            this.printOutput(`\n${matches.join('  ')}`);
            this.printPrompt();
            this.inputElement.value = input;
        }
    }

    updateSuggestions() {
        if (!this.autoCompleteEnabled || !this.suggestionsElement) return;
        
        const input = this.inputElement.value;
        if (!input) {
            this.hideSuggestions();
            return;
        }
        
        const commands = Object.keys(this.commands);
        const matches = commands.filter(cmd => 
            cmd.toLowerCase().includes(input.toLowerCase())
        ).slice(0, 5); // Limit to 5 suggestions
        
        if (matches.length === 0) {
            this.hideSuggestions();
            return;
        }
        
        this.suggestionsElement.innerHTML = '';
        matches.forEach(cmd => {
            const suggestion = document.createElement('div');
            suggestion.className = 'suggestion-item';
            suggestion.textContent = cmd;
            suggestion.addEventListener('click', () => {
                this.inputElement.value = cmd;
                this.inputElement.focus();
                this.hideSuggestions();
            });
            this.suggestionsElement.appendChild(suggestion);
        });
        
        this.showSuggestions();
    }

    showSuggestions() {
        if (this.suggestionsElement) {
            this.suggestionsElement.classList.add('show');
        }
    }

    hideSuggestions() {
        if (this.suggestionsElement) {
            this.suggestionsElement.classList.remove('show');
        }
    }

    // ===== OUTPUT MANAGEMENT =====
    printWelcomeMessage() {
        const welcome = `
████████╗███████╗██████╗ ███╗   ███╗██╗███╗   ██╗███████╗
╚══██╔══╝██╔════╝██╔══██╗████╗ ████║██║████╗  ██║██╔════╝
   ██║   █████╗  ██████╔╝██╔████╔██║██║██╔██╗ ██║███████╗
   ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║██║██║╚██╗██║╚════██║
   ██║   ███████╗██║  ██║██║ ╚═╝ ██║██║██║ ╚████║███████║
   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚══════╝
   
TerminalFirst OS v1.0.0-alpha
Type 'help' for available commands
Type 'neofetch' for system information
        `;
        
        this.printOutput(welcome, 'info');
        this.printPrompt();
    }

    printPrompt() {
        const prompt = document.createElement('div');
        prompt.className = 'terminal-line';
        prompt.innerHTML = `<span class="prompt">tfsh ${this.currentDirectory} ></span> `;
        this.outputElement.appendChild(prompt);
        this.scrollToBottom();
    }

    printCommand(command) {
        const line = document.createElement('div');
        line.className = 'terminal-line';
        line.innerHTML = `<span class="prompt">tfsh ${this.currentDirectory} ></span> ${command}`;
        this.outputElement.appendChild(line);
    }

    printOutput(text, type = 'output') {
        if (!text && text !== '') return;
        
        const lines = text.split('\n');
        lines.forEach(line => {
            const output = document.createElement('div');
            output.className = `terminal-line ${type}`;
            output.textContent = line;
            this.outputElement.appendChild(output);
        });
    }

    scrollToBottom() {
        if (this.outputElement) {
            this.outputElement.scrollTop = this.outputElement.scrollHeight;
        }
    }

    // ===== PUBLIC API =====
    runCommand(command) {
        if (!this.terminalReady) {
            console.warn('Terminal not ready yet');
            return;
        }
        
        this.inputElement.value = command;
        this.executeCommand();
    }

    clear() {
        this.handleClear();
    }

    focus() {
        if (this.inputElement) {
            this.inputElement.focus();
        }
    }

    // ===== CLEANUP =====
    cleanup() {
        this.commandHistory = [];
        this.historyIndex = -1;
        console.log('🧹 Terminal UI cleaned up');
    }
}

// Create global instance
const terminalUI = new TerminalUIManager();

// Export for use in other modules
window.terminalUI = terminalUI;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => terminalUI.init());
} else {
    setTimeout(() => terminalUI.init(), 100);
}

// Global terminal command
window.runTerminalCommand = (command) => {
    if (terminalUI.terminalReady) {
        terminalUI.runCommand(command);
    } else {
        console.log('Terminal not ready, queuing command:', command);
        setTimeout(() => terminalUI.runCommand(command), 500);
    }
};

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    terminalUI.cleanup();
});

window.terminalUI = terminalUI;