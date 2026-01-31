// ===== PROCESS MANAGER =====
console.log('⚙️ Initializing Process Manager...');

class ProcessManager {
    constructor() {
        this.processes = new Map();
        this.nextPid = 1000;
        this.runningApps = new Map();
        this.systemServices = new Map();
        
        // Process states
        this.STATES = {
            RUNNING: 'running',
            PAUSED: 'paused',
            STOPPED: 'stopped',
            ERROR: 'error'
        };
        
        this.initSystemServices();
    }

    initSystemServices() {
        // Register core system services
        this.registerService('window-manager', {
            start: () => {
                console.log('🪟 Window Manager service started');
                return 'Window Manager ready';
            },
            stop: () => {
                console.log('🪟 Window Manager service stopped');
                return 'Window Manager stopped';
            },
            dependencies: []
        });
        
        this.registerService('notification-service', {
            start: () => {
                console.log('🔔 Notification service started');
                return 'Notification service ready';
            },
            stop: () => {
                console.log('🔔 Notification service stopped');
                return 'Notification service stopped';
            },
            dependencies: []
        });
        
        this.registerService('network-service', {
            start: () => {
                console.log('🌐 Network service started');
                return 'Network service ready';
            },
            stop: () => {
                console.log('🌐 Network service stopped');
                return 'Network service stopped';
            },
            dependencies: []
        });
        
        // Start all system services
        this.startAllServices();
    }

    // ===== PROCESS MANAGEMENT =====
    spawn(name, type = 'app', config = {}) {
        const pid = this.nextPid++;
        
        const process = {
            pid,
            name,
            type,
            state: this.STATES.RUNNING,
            config,
            createdAt: new Date(),
            cpuUsage: 0,
            memoryUsage: 0,
            parentPid: null,
            children: []
        };
        
        this.processes.set(pid, process);
        
        console.log(`✅ Spawned process: ${name} (PID: ${pid})`);
        
        // Update system stats periodically
        this.updateProcessStats(pid);
        
        return pid;
    }

    kill(pid, force = false) {
        const process = this.processes.get(pid);
        if (!process) {
            throw new Error(`Process not found: PID ${pid}`);
        }
        
        if (process.type === 'system' && !force) {
            throw new Error(`Cannot kill system process ${process.name} without force flag`);
        }
        
        // Kill child processes first
        for (const childPid of process.children) {
            this.kill(childPid, true);
        }
        
        process.state = this.STATES.STOPPED;
        this.processes.delete(pid);
        
        console.log(`❌ Killed process: ${process.name} (PID: ${pid})`);
        return true;
    }

    pause(pid) {
        const process = this.processes.get(pid);
        if (!process) {
            throw new Error(`Process not found: PID ${pid}`);
        }
        
        process.state = this.STATES.PAUSED;
        console.log(`⏸️ Paused process: ${process.name} (PID: ${pid})`);
        return true;
    }

    resume(pid) {
        const process = this.processes.get(pid);
        if (!process) {
            throw new Error(`Process not found: PID ${pid}`);
        }
        
        process.state = this.STATES.RUNNING;
        console.log(`▶️ Resumed process: ${process.name} (PID: ${pid})`);
        return true;
    }

    getProcess(pid) {
        return this.processes.get(pid);
    }

    getAllProcesses() {
        return Array.from(this.processes.values());
    }

    getProcessesByType(type) {
        return Array.from(this.processes.values())
            .filter(p => p.type === type);
    }

    getProcessesByState(state) {
        return Array.from(this.processes.values())
            .filter(p => p.state === state);
    }

    // ===== APPLICATION MANAGEMENT =====
    launchApp(appName, config = {}) {
        const pid = this.spawn(appName, 'app', config);
        this.runningApps.set(appName, pid);
        
        // Simulate app startup
        setTimeout(() => {
            const process = this.processes.get(pid);
            if (process) {
                process.config.windowId = `window-${pid}`;
                console.log(`🚀 App launched: ${appName} (Window ID: ${process.config.windowId})`);
                
                // Send notification
                if (window.showNotification) {
                    window.showNotification({
                        title: 'Application Started',
                        message: `${appName} is now running`,
                        type: 'success'
                    });
                }
            }
        }, 500);
        
        return {
            pid,
            name: appName,
            status: 'launching'
        };
    }

    closeApp(appName) {
        const pid = this.runningApps.get(appName);
        if (!pid) {
            throw new Error(`App not running: ${appName}`);
        }
        
        this.kill(pid);
        this.runningApps.delete(appName);
        
        return {
            name: appName,
            status: 'closed'
        };
    }

    getRunningApps() {
        const apps = [];
        for (const [name, pid] of this.runningApps) {
            const process = this.processes.get(pid);
            if (process) {
                apps.push({
                    name,
                    pid,
                    state: process.state,
                    windowId: process.config.windowId
                });
            }
        }
        return apps;
    }

    isAppRunning(appName) {
        return this.runningApps.has(appName);
    }

    // ===== SERVICE MANAGEMENT =====
    registerService(name, service) {
        this.systemServices.set(name, {
            ...service,
            running: false
        });
        console.log(`📦 Registered service: ${name}`);
    }

    startService(name) {
        const service = this.systemServices.get(name);
        if (!service) {
            throw new Error(`Service not found: ${name}`);
        }
        
        // Check dependencies
        for (const dep of service.dependencies) {
            if (!this.systemServices.get(dep)?.running) {
                throw new Error(`Dependency ${dep} is not running`);
            }
        }
        
        const result = service.start();
        service.running = true;
        
        console.log(`▶️ Started service: ${name}`);
        return result;
    }

    stopService(name) {
        const service = this.systemServices.get(name);
        if (!service) {
            throw new Error(`Service not found: ${name}`);
        }
        
        const result = service.stop();
        service.running = false;
        
        console.log(`⏹️ Stopped service: ${name}`);
        return result;
    }

    startAllServices() {
        for (const [name] of this.systemServices) {
            try {
                this.startService(name);
            } catch (error) {
                console.warn(`Failed to start service ${name}:`, error.message);
            }
        }
    }

    stopAllServices() {
        for (const [name] of this.systemServices) {
            try {
                this.stopService(name);
            } catch (error) {
                console.warn(`Failed to stop service ${name}:`, error.message);
            }
        }
    }

    getServiceStatus(name) {
        const service = this.systemServices.get(name);
        if (!service) {
            return { found: false, running: false };
        }
        
        return {
            found: true,
            running: service.running,
            dependencies: service.dependencies
        };
    }

    getAllServices() {
        const services = [];
        for (const [name, service] of this.systemServices) {
            services.push({
                name,
                running: service.running,
                dependencies: service.dependencies
            });
        }
        return services;
    }

    // ===== SYSTEM STATISTICS =====
    updateProcessStats(pid) {
        const process = this.processes.get(pid);
        if (!process) return;
        
        // Simulate CPU and memory usage
        process.cpuUsage = Math.min(100, Math.random() * 30);
        process.memoryUsage = Math.min(1024, Math.random() * 100 + 10); // MB
        
        // Continue updating if process is running
        if (process.state === this.STATES.RUNNING) {
            setTimeout(() => this.updateProcessStats(pid), 5000);
        }
    }

    getSystemStats() {
        const processes = this.getAllProcesses();
        
        const totalCPU = processes.reduce((sum, p) => sum + p.cpuUsage, 0);
        const totalMemory = processes.reduce((sum, p) => sum + p.memoryUsage, 0);
        
        const runningCount = processes.filter(p => p.state === this.STATES.RUNNING).length;
        const pausedCount = processes.filter(p => p.state === this.STATES.PAUSED).length;
        const stoppedCount = processes.filter(p => p.state === this.STATES.STOPPED).length;
        
        return {
            processes: {
                total: processes.length,
                running: runningCount,
                paused: pausedCount,
                stopped: stoppedCount
            },
            resources: {
                cpu: Math.min(100, totalCPU),
                memory: {
                    used: Math.round(totalMemory),
                    unit: 'MB'
                }
            },
            uptime: Date.now() - window.OS?.bootTime || 0
        };
    }

    getProcessTree() {
        const tree = {};
        
        for (const [pid, process] of this.processes) {
            if (!process.parentPid) {
                tree[pid] = {
                    name: process.name,
                    type: process.type,
                    state: process.state,
                    children: this.getChildProcesses(pid)
                };
            }
        }
        
        return tree;
    }

    getChildProcesses(parentPid) {
        const children = {};
        
        for (const [pid, process] of this.processes) {
            if (process.parentPid === parentPid) {
                children[pid] = {
                    name: process.name,
                    type: process.type,
                    state: process.state,
                    children: this.getChildProcesses(pid)
                };
            }
        }
        
        return children;
    }

    // ===== PROCESS COMMUNICATION =====
    sendSignal(pid, signal) {
        const process = this.processes.get(pid);
        if (!process) {
            throw new Error(`Process not found: PID ${pid}`);
        }
        
        console.log(`📨 Signal ${signal} sent to ${process.name} (PID: ${pid})`);
        
        // Handle common signals
        switch(signal) {
            case 'SIGTERM':
                return this.kill(pid);
            case 'SIGSTOP':
                return this.pause(pid);
            case 'SIGCONT':
                return this.resume(pid);
            default:
                console.log(`Signal ${signal} received by ${process.name}`);
                return true;
        }
    }

    broadcastSignal(signal, type = null) {
        let targets = this.getAllProcesses();
        
        if (type) {
            targets = targets.filter(p => p.type === type);
        }
        
        let successCount = 0;
        for (const process of targets) {
            try {
                this.sendSignal(process.pid, signal);
                successCount++;
            } catch (error) {
                console.warn(`Failed to send signal to ${process.name}:`, error.message);
            }
        }
        
        return {
            sent: targets.length,
            successful: successCount,
            failed: targets.length - successCount
        };
    }

    // ===== DEBUG & MONITORING =====
    monitorProcess(pid, callback) {
        const process = this.processes.get(pid);
        if (!process) {
            throw new Error(`Process not found: PID ${pid}`);
        }
        
        const interval = setInterval(() => {
            const updatedProcess = this.processes.get(pid);
            if (!updatedProcess || updatedProcess.state === this.STATES.STOPPED) {
                clearInterval(interval);
                callback({ event: 'terminated', pid });
                return;
            }
            
            callback({
                event: 'update',
                pid,
                state: updatedProcess.state,
                cpu: updatedProcess.cpuUsage,
                memory: updatedProcess.memoryUsage
            });
        }, 1000);
        
        return () => clearInterval(interval);
    }

    // ===== CLEANUP =====
    cleanup() {
        // Stop all processes
        const pids = Array.from(this.processes.keys());
        for (const pid of pids) {
            try {
                this.kill(pid, true);
            } catch (error) {
                // Ignore errors during cleanup
            }
        }
        
        // Stop all services
        this.stopAllServices();
        
        console.log('🧹 Process Manager cleaned up');
    }
}

// Create global instance
const ProcessMan = new ProcessManager();

// Export for use in other modules
window.ProcessMan = ProcessMan;
console.log('✅ Process Manager initialized');

// Auto-initialize if loaded standalone
if (!window.OS) {
    console.log('⚙️ Process Manager running in standalone mode');
    
    // Test the process manager
    setTimeout(() => {
        console.log('Testing Process Manager...');
        
        // Launch a test app
        const app = ProcessMan.launchApp('test-app', { mode: 'demo' });
        console.log('Launched app:', app);
        
        // Get system stats
        console.log('System stats:', ProcessMan.getSystemStats());
        
        // Get running apps
        console.log('Running apps:', ProcessMan.getRunningApps());
    }, 500);
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    ProcessMan.cleanup();
});

window.ProcessMan = ProcessMan;