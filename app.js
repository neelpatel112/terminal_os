console.log("=== TERMINALFIRST OS app.js LOADED ===");
alert("app.js is loaded!");  // Remove this after testing
// ===== TERMINALFIRST OS - MAIN ENTRY POINT =====
console.log('🚀 TerminalFirst OS v1.0.0-alpha initializing...');

// Global state
let OS = {
    booted: false,
    theme: 'dark',
    user: 'guest',
    windows: [],
    activeWindow: null,
    processes: [],
    notifications: [],
    fs: null,
    shell: null
};

// DOM Elements
let bootScreen, bootMessage, bootProgress, osInterface;
let desktop, terminalInput, terminalOutput, taskbarWindows;
let clockElement, themeToggle, startButton, startMenu, contextMenu;

// ===== BOOT SEQUENCE =====
async function bootOS() {
    console.log('🔄 Starting boot sequence...');
    
    bootScreen = document.getElementById('boot-screen');
    bootMessage = document.getElementById('boot-message');
    bootProgress = document.querySelector('.progress-fill');
    osInterface = document.getElementById('os-interface');
    
    // Simulate boot steps
    const bootSteps = [
        { msg: 'Loading kernel...', delay: 300, progress: 20 },
        { msg: 'Initializing filesystem...', delay: 400, progress: 40 },
        { msg: 'Starting shell...', delay: 300, progress: 60 },
        { msg: 'Loading window manager...', delay: 350, progress: 80 },
        { msg: 'Starting system services...', delay: 400, progress: 95 },
        { msg: 'Welcome to TerminalFirst OS', delay: 500, progress: 100 }
    ];
    
    for (const step of bootSteps) {
        await updateBootProgress(step.msg, step.progress, step.delay);
    }
    
    // Complete boot
    setTimeout(() => {
        bootScreen.style.opacity = '0';
        setTimeout(() => {
            bootScreen.style.display = 'none';
            osInterface.style.display = 'block';
            startOS();
            playSound('boot');
        }, 500);
    }, 1000);
}

async function updateBootProgress(message, progress, delay) {
    bootMessage.textContent = `> ${message}`;
    bootProgress.style.width = `${progress}%`;
    await sleep(delay);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ===== OS INITIALIZATION =====
function startOS() {
    console.log('✅ OS Interface ready');
    
    // Initialize DOM references
    initializeDOMElements();
    
    // Load saved state
    loadOSState();
    
    // Initialize core systems
    initializeClock();
    initializeTheme();
    initializeEventListeners();
    
    // Start terminal
    initializeTerminal();
    
    // Create default windows
    createDefaultWindows();
    
    OS.booted = true;
    
    // Show welcome notification
    showNotification({
        title: 'System Ready',
        message: 'TerminalFirst OS v1.0.0-alpha booted successfully.',
        type: 'success'
    });
    
    // Initial terminal output
    addTerminalOutput(`
████████╗███████╗██████╗ ███╗   ███╗██╗███╗   ██╗███████╗
╚══██╔══╝██╔════╝██╔══██╗████╗ ████║██║████╗  ██║██╔════╝
   ██║   █████╗  ██████╔╝██╔████╔██║██║██╔██╗ ██║███████╗
   ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║██║██║╚██╗██║╚════██║
   ██║   ███████╗██║  ██║██║ ╚═╝ ██║██║██║ ╚████║███████║
   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚══════╝
   
TerminalFirst OS v1.0.0-alpha
Type 'help' for available commands
Type 'gui' to enable graphical applications
    `);
}

// ===== DOM INITIALIZATION =====
function initializeDOMElements() {
    desktop = document.getElementById('desktop');
    terminalInput = document.getElementById('terminal-input');
    terminalOutput = document.getElementById('terminal-output');
    taskbarWindows = document.getElementById('taskbar-windows');
    clockElement = document.getElementById('clock');
    themeToggle = document.getElementById('theme-toggle');
    startButton = document.getElementById('start-button');
    startMenu = document.getElementById('start-menu');
    contextMenu = document.getElementById('context-menu');
}

// ===== STATE MANAGEMENT =====
function loadOSState() {
    const savedTheme = localStorage.getItem('tfos-theme');
    if (savedTheme) {
        OS.theme = savedTheme;
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon();
    }
    
    const savedUser = localStorage.getItem('tfos-user');
    if (savedUser) OS.user = savedUser;
}

function saveOSState() {
    localStorage.setItem('tfos-theme', OS.theme);
    localStorage.setItem('tfos-user', OS.user);
}

// ===== CLOCK =====
function initializeClock() {
    function updateClock() {
        const now = new Date();
        const time = now.toLocaleTimeString('en-US', { 
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
        });
        clockElement.textContent = time;
    }
    
    updateClock();
    setInterval(updateClock, 1000);
}

// ===== THEME SYSTEM =====
function initializeTheme() {
    themeToggle.addEventListener('click', toggleTheme);
    updateThemeIcon();
}

function toggleTheme() {
    OS.theme = OS.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', OS.theme);
    updateThemeIcon();
    saveOSState();
    playSound('click');
}

function updateThemeIcon() {
    const icon = themeToggle.querySelector('i');
    if (OS.theme === 'dark') {
        icon.className = 'fas fa-sun';
        themeToggle.title = 'Switch to Light Mode';
    } else {
        icon.className = 'fas fa-moon';
        themeToggle.title = 'Switch to Dark Mode';
    }
}

// ===== TERMINAL SYSTEM =====
function initializeTerminal() {
    terminalInput.focus();
    
    terminalInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const command = terminalInput.value.trim();
            if (command) {
                executeCommand(command);
                terminalInput.value = '';
                updateSuggestions('');
            }
        } else if (e.key === 'Tab') {
            e.preventDefault();
            handleTabCompletion();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            navigateCommandHistory('up');
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            navigateCommandHistory('down');
        } else {
            // Update suggestions as user types
            setTimeout(() => updateSuggestions(terminalInput.value), 10);
        }
    });
    
    terminalInput.addEventListener('input', () => {
        updateSuggestions(terminalInput.value);
    });
    
    // Command history
    let commandHistory = [];
    let historyIndex = -1;
    
    function navigateCommandHistory(direction) {
        if (commandHistory.length === 0) return;
        
        if (direction === 'up') {
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                terminalInput.value = commandHistory[commandHistory.length - 1 - historyIndex];
            }
        } else if (direction === 'down') {
            if (historyIndex > 0) {
                historyIndex--;
                terminalInput.value = commandHistory[commandHistory.length - 1 - historyIndex];
            } else {
                historyIndex = -1;
                terminalInput.value = '';
            }
        }
    }
    
    function addToHistory(command) {
        if (commandHistory[commandHistory.length - 1] !== command) {
            commandHistory.push(command);
            if (commandHistory.length > 50) commandHistory.shift();
        }
        historyIndex = -1;
    }
    
    // Command execution
    window.executeCommand = function(command) {
        playSound('click');
        addTerminalOutput(`<span class="prompt">tfsh ></span> ${command}`);
        addToHistory(command);
        
        // Basic command parsing
        const [cmd, ...args] = command.split(' ');
        const flags = {};
        
        // Parse flags (--flag value or --flag)
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
        
        // Execute command
        const output = handleCommand(cmd, args.filter(arg => !arg.startsWith('--')), flags);
        
        if (output) {
            addTerminalOutput(output);
        }
        
        // Scroll to bottom
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    };
}

function handleCommand(cmd, args, flags) {
    const commands = {
        // System commands
        'help': () => `
Available Commands:
------------------
• help - Show this help message
• clear - Clear terminal screen
• echo [text] - Print text to terminal
• theme [dark/light] - Change theme
• gui - Show/hide graphical interface
• apps - List available applications
• run [app] - Launch an application

• date - Show current date and time
• whoami - Show current user
• pwd - Print working directory
• ls [path] - List files and directories

• notify [title] [message] - Send notification
• sound [on/off] - Toggle sound effects

Type 'help [command]' for more info
        `,
        
        'clear': () => {
            terminalOutput.innerHTML = '';
            return '';
        },
        
        'echo': () => args.join(' '),
        
        'theme': () => {
            if (args[0] === 'dark' || args[0] === 'light') {
                OS.theme = args[0];
                document.documentElement.setAttribute('data-theme', OS.theme);
                updateThemeIcon();
                saveOSState();
                return `Theme set to ${OS.theme} mode`;
            }
            return `Current theme: ${OS.theme}`;
        },
        
        'gui': () => {
            const taskbar = document.querySelector('.taskbar');
            if (taskbar.style.display === 'none') {
                taskbar.style.display = 'flex';
                return 'Graphical interface enabled';
            } else {
                taskbar.style.display = 'none';
                return 'Graphical interface disabled (press Ctrl+Shift+G to show)';
            }
        },
        
        'apps': () => `
Available Applications:
---------------------
• terminal - Terminal emulator (default)
• editor - Text editor
• files - File manager
• settings - System settings
• calculator - Calculator
• browser - Web browser

Usage: run [app_name]
Example: run editor
        `,
        
        'run': () => {
            const app = args[0];
            if (!app) return 'Usage: run [app_name]\nType "apps" for available applications';
            
            const appNames = ['editor', 'files', 'settings', 'calculator', 'browser'];
            if (appNames.includes(app)) {
                launchApp(app);
                return `Launching ${app}...`;
            }
            return `Application "${app}" not found. Type "apps" for available applications.`;
        },
        
        'date': () => new Date().toLocaleString(),
        
        'whoami': () => OS.user,
        
        'pwd': () => '/home/' + OS.user,
        
        'ls': () => {
            const path = args[0] || '/';
            return `Directory: ${path}
📁 documents
📁 downloads
📁 pictures
📄 notes.txt
📄 todo.md
📄 config.json`;
        },
        
        'notify': () => {
            const title = args[0] || 'Notification';
            const message = args.slice(1).join(' ') || 'Hello from TerminalFirst OS!';
            showNotification({
                title,
                message,
                type: 'info'
            });
            return `Notification sent: "${title}"`;
        },
        
        'sound': () => {
            const state = args[0];
            if (state === 'on' || state === 'off') {
                localStorage.setItem('tfos-sound', state);
                return `Sound effects ${state}`;
            }
            const current = localStorage.getItem('tfos-sound') || 'on';
            return `Sound effects: ${current}`;
        },
        
        // Default handler
        'default': () => `Command not found: "${cmd}". Type "help" for available commands.`
    };
    
    const handler = commands[cmd] || commands['default'];
    return handler();
}

function addTerminalOutput(content) {
    const line = document.createElement('div');
    line.className = 'terminal-line';
    line.innerHTML = content;
    terminalOutput.appendChild(line);
    
    // Auto-scroll
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function updateSuggestions(input) {
    const suggestions = document.getElementById('suggestions');
    suggestions.innerHTML = '';
    
    if (!input) {
        suggestions.classList.remove('show');
        return;
    }
    
    const commandList = ['help', 'clear', 'echo', 'theme', 'gui', 'apps', 'run', 
                         'date', 'whoami', 'pwd', 'ls', 'notify', 'sound'];
    
    const matches = commandList.filter(cmd => 
        cmd.startsWith(input.toLowerCase())
    );
    
    if (matches.length > 0) {
        matches.forEach(cmd => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.textContent = cmd;
            div.onclick = () => {
                terminalInput.value = cmd;
                terminalInput.focus();
                suggestions.classList.remove('show');
            };
            suggestions.appendChild(div);
        });
        suggestions.classList.add('show');
    } else {
        suggestions.classList.remove('show');
    }
}

function handleTabCompletion() {
    const input = terminalInput.value;
    const commandList = ['help', 'clear', 'echo', 'theme', 'gui', 'apps', 'run', 
                         'date', 'whoami', 'pwd', 'ls', 'notify', 'sound'];
    
    const matches = commandList.filter(cmd => 
        cmd.startsWith(input.toLowerCase())
    );
    
    if (matches.length === 1) {
        terminalInput.value = matches[0];
    } else if (matches.length > 1) {
        // Show all matches in terminal
        addTerminalOutput(`\n${matches.join('  ')}`);
    }
}

// ===== WINDOW MANAGEMENT =====
function createDefaultWindows() {
    // Terminal window is already in HTML
    const terminalWindow = document.getElementById('terminal-window');
    OS.windows.push({
        id: 'terminal',
        element: terminalWindow,
        title: 'Terminal',
        pid: 1
    });
    OS.activeWindow = 'terminal';
    
    // Make window draggable and resizable
    makeWindowDraggable(terminalWindow);
    makeWindowResizable(terminalWindow);
    
    // Add to taskbar
    addWindowToTaskbar('terminal', 'Terminal');
}

function makeWindowDraggable(windowElement) {
    const header = windowElement.querySelector('.window-header');
    let isDragging = false;
    let offsetX, offsetY;
    
    header.addEventListener('mousedown', startDrag);
    
    function startDrag(e) {
        if (e.target.closest('.window-controls')) return;
        
        isDragging = true;
        bringWindowToFront(windowElement);
        
        const rect = windowElement.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);
        
        windowElement.classList.add('dragging');
    }
    
    function drag(e) {
        if (!isDragging) return;
        
        let x = e.clientX - offsetX;
        let y = e.clientY - offsetY;
        
        // Boundary checking
        x = Math.max(0, Math.min(x, window.innerWidth - 50));
        y = Math.max(0, Math.min(y, window.innerHeight - 50));
        
        windowElement.style.left = x + 'px';
        windowElement.style.top = y + 'px';
    }
    
    function stopDrag() {
        isDragging = false;
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', stopDrag);
        windowElement.classList.remove('dragging');
    }
}

function makeWindowResizable(windowElement) {
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    resizeHandle.style.cssText = `
        position: absolute;
        width: 15px;
        height: 15px;
        right: 0;
        bottom: 0;
        cursor: nwse-resize;
    `;
    windowElement.appendChild(resizeHandle);
    
    let isResizing = false;
    
    resizeHandle.addEventListener('mousedown', startResize);
    
    function startResize(e) {
        e.preventDefault();
        e.stopPropagation();
        
        isResizing = true;
        bringWindowToFront(windowElement);
        
        const startWidth = windowElement.offsetWidth;
        const startHeight = windowElement.offsetHeight;
        const startX = e.clientX;
        const startY = e.clientY;
        
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
        
        windowElement.classList.add('resizing');
    }
    
    function resize(e) {
        if (!isResizing) return;
        
        const newWidth = Math.max(300, windowElement.offsetWidth + (e.clientX - startX));
        const newHeight = Math.max(200, windowElement.offsetHeight + (e.clientY - startY));
        
        windowElement.style.width = newWidth + 'px';
        windowElement.style.height = newHeight + 'px';
    }
    
    function stopResize() {
        isResizing = false;
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResize);
        windowElement.classList.remove('resizing');
    }
}

function bringWindowToFront(windowElement) {
    // Remove active class from all windows
    document.querySelectorAll('.window').forEach(w => {
        w.classList.remove('active-window');
    });
    
    // Add active class to clicked window
    windowElement.classList.add('active-window');
    
    // Update z-index
    let maxZ = 10;
    document.querySelectorAll('.window').forEach(w => {
        const z = parseInt(w.style.zIndex) || 10;
        maxZ = Math.max(maxZ, z);
    });
    
    windowElement.style.zIndex = maxZ + 1;
    OS.activeWindow = windowElement.id;
}

function addWindowToTaskbar(windowId, title) {
    const taskbarItem = document.createElement('div');
    taskbarItem.className = 'taskbar-window active';
    taskbarItem.textContent = title;
    taskbarItem.dataset.windowId = windowId;
    
    taskbarItem.onclick = () => {
        const window = document.getElementById(`${windowId}-window`);
        if (window) {
            window.style.display = 'flex';
            bringWindowToFront(window);
        }
    };
    
    taskbarWindows.appendChild(taskbarItem);
}

// ===== APPLICATION LAUNCHER =====
function launchApp(appName) {
    playSound('click');
    
    showNotification({
        title: 'Launching Application',
        message: `Starting ${appName}...`,
        type: 'info'
    });
    
    switch(appName) {
        case 'editor':
            addTerminalOutput(`Launching text editor... (simulated)`);
            break;
        case 'files':
            addTerminalOutput(`Launching file manager... (simulated)`);
            break;
        case 'settings':
            addTerminalOutput(`Opening system settings... (simulated)`);
            break;
        default:
            addTerminalOutput(`Application "${appName}" launched in simulation mode.`);
    }
}

// ===== NOTIFICATION SYSTEM =====
function showNotification({ title, message, type = 'info', duration = 5000 }) {
    const notificationArea = document.getElementById('notification-area');
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-header">
            <span class="notification-title">${title}</span>
            <button class="notification-close">&times;</button>
        </div>
        <div class="notification-body">${message}</div>
    `;
    
    notificationArea.appendChild(notification);
    
    // Close button
    notification.querySelector('.notification-close').onclick = () => {
        notification.remove();
    };
    
    // Auto-remove after duration
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }
    }, duration);
    
    // Play notification sound if enabled
    playSound('notification');
}

// ===== EVENT LISTENERS =====
function initializeEventListeners() {
    // Start menu toggle
    startButton.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleStartMenu();
        playSound('click');
    });
    
    // Close start menu when clicking elsewhere
    document.addEventListener('click', () => {
        startMenu.style.display = 'none';
    });
    
    // Start menu apps
    document.querySelectorAll('.app-tile').forEach(tile => {
        tile.addEventListener('click', (e) => {
            e.stopPropagation();
            const app = tile.dataset.app;
            launchApp(app);
            startMenu.style.display = 'none';
        });
    });
    
    // Power button
    document.getElementById('power-button').addEventListener('click', () => {
        if (confirm('Are you sure you want to shutdown TerminalFirst OS?')) {
            shutdownOS();
        }
    });
    
    // Quick actions
    document.querySelectorAll('.quick-action').forEach(action => {
        action.addEventListener('click', () => {
            const cmd = action.dataset.cmd;
            executeCommand(cmd);
            startMenu.style.display = 'none';
        });
    });
    
    // App pins
    document.querySelectorAll('.app-pin').forEach(pin => {
        pin.addEventListener('click', () => {
            const app = pin.dataset.app;
            if (app === 'terminal') {
                const termWindow = document.getElementById('terminal-window');
                termWindow.style.display = 'flex';
                bringWindowToFront(termWindow);
            } else {
                launchApp(app);
            }
        });
    });
    
    // Window controls
    document.querySelectorAll('.win-btn.minimize').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const window = btn.closest('.window');
            window.style.display = 'none';
            playSound('click');
        });
    });
    
    document.querySelectorAll('.win-btn.maximize').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const window = btn.closest('.window');
            if (window.style.width === '100vw') {
                window.style.width = '800px';
                window.style.height = '500px';
                window.style.left = '100px';
                window.style.top = '100px';
            } else {
                window.style.width = '100vw';
                window.style.height = 'calc(100vh - 48px)';
                window.style.left = '0';
                window.style.top = '0';
            }
            playSound('click');
        });
    });
    
    document.querySelectorAll('.win-btn.close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const window = btn.closest('.window');
            window.style.display = 'none';
            playSound('click');
        });
    });
    
    // Context menu
    desktop.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showContextMenu(e.clientX, e.clientY);
    });
    
    document.addEventListener('click', () => {
        contextMenu.style.display = 'none';
    });
    
    // Context menu actions
    document.querySelectorAll('.context-item').forEach(item => {
        item.addEventListener('click', () => {
            const action = item.dataset.action;
            handleContextAction(action);
        });
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl+L to clear terminal
        if (e.ctrlKey && e.key === 'l') {
            e.preventDefault();
            executeCommand('clear');
        }
        
        // Ctrl+Shift+G to toggle GUI
        if (e.ctrlKey && e.shiftKey && e.key === 'g') {
            e.preventDefault();
            executeCommand('gui');
        }
        
        // Escape to close start menu
        if (e.key === 'Escape') {
            startMenu.style.display = 'none';
            contextMenu.style.display = 'none';
        }
        
        // Focus terminal with Ctrl+`
        if (e.ctrlKey && e.key === '`') {
            e.preventDefault();
            terminalInput.focus();
            const termWindow = document.getElementById('terminal-window');
            bringWindowToFront(termWindow);
        }
    });
    
    // Focus terminal when clicking on desktop
    desktop.addEventListener('click', (e) => {
        if (e.target === desktop) {
            terminalInput.focus();
        }
    });
}

function toggleStartMenu() {
    if (startMenu.style.display === 'block') {
        startMenu.style.display = 'none';
    } else {
        startMenu.style.display = 'block';
        startMenu.style.zIndex = '1000';
    }
}

function showContextMenu(x, y) {
    contextMenu.style.left = x + 'px';
    contextMenu.style.top = y + 'px';
    contextMenu.style.display = 'block';
    playSound('click');
}

function handleContextAction(action) {
    switch(action) {
        case 'new-terminal':
            executeCommand('echo "New terminal window (simulated)"');
            break;
        case 'new-file':
            executeCommand('echo "Creating new file..."');
            break;
        case 'new-folder':
            executeCommand('echo "Creating new folder..."');
            break;
        case 'refresh':
            showNotification({
                title: 'Desktop Refreshed',
                message: 'Desktop has been refreshed.',
                type: 'info'
            });
            break;
        case 'settings':
            launchApp('settings');
            break;
        case 'about':
            showNotification({
                title: 'About TerminalFirst OS',
                message: 'A terminal-first operating system built for the web.\nVersion 1.0.0-alpha',
                type: 'info',
                duration: 7000
            });
            break;
    }
    contextMenu.style.display = 'none';
}

// ===== AUDIO SYSTEM =====
function playSound(type) {
    if (localStorage.getItem('tfos-sound') === 'off') return;
    
    const audio = document.getElementById(`${type}-sound`);
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.log('Audio play failed:', e));
    }
}

// ===== SHUTDOWN =====
function shutdownOS() {
    showNotification({
        title: 'Shutting Down',
        message: 'TerminalFirst OS is shutting down...',
        type: 'warning'
    });
    
    // Save state
    saveOSState();
    
    // Fade out
    setTimeout(() => {
        osInterface.style.opacity = '0';
        setTimeout(() => {
            bootScreen.style.display = 'flex';
            bootScreen.style.opacity = '1';
            osInterface.style.display = 'none';
            osInterface.style.opacity = '1';
            
            // Reset boot screen
            bootMessage.textContent = '> System powered off';
            bootProgress.style.width = '0%';
            
            // Show reboot message
            setTimeout(() => {
                bootMessage.textContent = '> Press F5 to reboot...';
            }, 1000);
        }, 500);
    }, 1000);
}

// ===== EXPORT TO WINDOW =====
window.OS = OS;
window.executeCommand = executeCommand;
window.launchApp = launchApp;
window.showNotification = showNotification;

// ===== START BOOT PROCESS =====

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootOS);
} else {
    bootOS(); // DOM already loaded
}
// Global error handler
window.addEventListener('error', (e) => {
    console.error('OS Error:', e.error);
    showNotification({
        title: 'System Error',
        message: e.message || 'An unexpected error occurred',
        type: 'error'
    });
});  
// MANUALLY START BOOT
console.log("🚀 Manual boot starting...");
setTimeout(bootOS, 1000);