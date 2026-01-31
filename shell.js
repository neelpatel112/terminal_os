// ===== TERMINAL-FIRST SHELL (TFSH) =====
console.log('📟 Initializing TFSH v1.0...');

class TerminalFirstShell {
    constructor() {
        this.history = [];
        this.historyIndex = -1;
        this.aliases = {
            'll': 'ls -la',
            'cls': 'clear',
            'h': 'help',
            '?': 'help',
            'exit': 'echo "Use Ctrl+Shift+Q or shutdown command"',
            'reboot': 'echo "Press F5 to refresh the page"'
        };
        this.variables = {
            'USER': 'guest',
            'HOME': '/home/guest',
            'PATH': '/bin:/usr/bin:/usr/local/bin',
            'SHELL': '/bin/tfsh',
            'TERM': 'xterm-256color',
            'PS1': 'tfsh >'
        };
        this.commands = {};
        this.initCommands();
    }

    initCommands() {
        // Core commands will be registered by the OS
        this.commands = {};
    }

    registerCommand(name, handler, help = '') {
        this.commands[name] = {
            handler,
            help,
            name
        };
        console.log(`✅ Registered command: ${name}`);
    }

    unregisterCommand(name) {
        delete this.commands[name];
    }

    parse(input) {
        if (!input) return null;
        
        // Handle aliases
        if (this.aliases[input]) {
            input = this.aliases[input];
        }
        
        // Expand variables
        input = this.expandVariables(input);
        
        const tokens = [];
        let currentToken = '';
        let inQuotes = false;
        let quoteChar = '';
        
        for (let i = 0; i < input.length; i++) {
            const char = input[i];
            
            if (char === '"' || char === "'") {
                if (!inQuotes) {
                    inQuotes = true;
                    quoteChar = char;
                } else if (char === quoteChar) {
                    inQuotes = false;
                    quoteChar = '';
                } else {
                    currentToken += char;
                }
            } else if (char === ' ' && !inQuotes) {
                if (currentToken) {
                    tokens.push(currentToken);
                    currentToken = '';
                }
            } else if (char === '\\' && i + 1 < input.length) {
                // Escape character
                currentToken += input[i + 1];
                i++;
            } else {
                currentToken += char;
            }
        }
        
        if (currentToken) {
            tokens.push(currentToken);
        }
        
        if (tokens.length === 0) return null;
        
        const command = tokens[0];
        const args = tokens.slice(1);
        
        // Parse flags
        const flags = {};
        const positionalArgs = [];
        
        for (let i = 0; i < args.length; i++) {
            if (args[i].startsWith('--')) {
                const flagName = args[i].slice(2);
                if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
                    flags[flagName] = args[i + 1];
                    i++;
                } else {
                    flags[flagName] = true;
                }
            } else if (args[i].startsWith('-') && args[i].length === 2) {
                // Single letter flag like -l
                const flagName = args[i][1];
                flags[flagName] = true;
            } else {
                positionalArgs.push(args[i]);
            }
        }
        
        return {
            command,
            args: positionalArgs,
            flags,
            raw: input
        };
    }

    expandVariables(input) {
        return input.replace(/\$([A-Z_][A-Z0-9_]*)/g, (match, varName) => {
            return this.variables[varName] || '';
        });
    }

    async execute(parsed) {
        if (!parsed) return '';
        
        const { command, args, flags } = parsed;
        
        // Add to history
        this.addToHistory(parsed.raw);
        
        // Check if command exists
        if (!this.commands[command]) {
            return `tfsh: command not found: ${command}\nType 'help' for available commands`;
        }
        
        try {
            const result = await this.commands[command].handler(args, flags);
            return result;
        } catch (error) {
            console.error(`Command error: ${command}`, error);
            return `tfsh: ${command}: ${error.message}`;
        }
    }

    addToHistory(command) {
        if (this.history[this.history.length - 1] !== command) {
            this.history.push(command);
            if (this.history.length > 100) this.history.shift();
        }
        this.historyIndex = -1;
    }

    getHistory() {
        return [...this.history];
    }

    getHistoryItem(index) {
        if (index >= 0 && index < this.history.length) {
            return this.history[index];
        }
        return null;
    }

    navigateHistory(direction) {
        if (this.history.length === 0) return null;
        
        if (direction === 'up') {
            if (this.historyIndex < this.history.length - 1) {
                this.historyIndex++;
                return this.history[this.history.length - 1 - this.historyIndex];
            }
        } else if (direction === 'down') {
            if (this.historyIndex > 0) {
                this.historyIndex--;
                return this.history[this.history.length - 1 - this.historyIndex];
            } else {
                this.historyIndex = -1;
                return '';
            }
        }
        return null;
    }

    getSuggestions(input) {
        if (!input) return [];
        
        const matches = Object.keys(this.commands).filter(cmd => 
            cmd.startsWith(input.toLowerCase())
        );
        
        return matches;
    }

    getCommandHelp(command) {
        if (!this.commands[command]) {
            return `No help available for: ${command}`;
        }
        
        const cmd = this.commands[command];
        if (!cmd.help) {
            return `No detailed help available for: ${command}`;
        }
        
        return cmd.help;
    }

    setVariable(name, value) {
        this.variables[name] = value;
    }

    getVariable(name) {
        return this.variables[name];
    }

    getAllVariables() {
        return { ...this.variables };
    }

    setAlias(name, value) {
        this.aliases[name] = value;
    }

    removeAlias(name) {
        delete this.aliases[name];
    }

    getAllAliases() {
        return { ...this.aliases };
    }
}

// Create global instance
const TFSH = new TerminalFirstShell();

// Export for use in other modules
window.TFSH = TFSH;
console.log('✅ TFSH initialized');

// Auto-initialize if loaded standalone
if (!window.OS) {
    console.log('📟 TFSH running in standalone mode');
    
    // Register some demo commands
    TFSH.registerCommand('echo', (args) => args.join(' '), 'echo [text] - Print text to terminal');
    TFSH.registerCommand('demo', () => 'TFSH Demo Mode Active\nTry: echo hello', 'demo - Show demo message');
    
    // Test the shell
    setTimeout(() => {
        console.log('Testing TFSH...');
        const parsed = TFSH.parse('echo "Hello, TFSH!"');
        TFSH.execute(parsed).then(result => {
            console.log('TFSH Output:', result);
        });
    }, 100);
}

window.TFSH = TFSH;