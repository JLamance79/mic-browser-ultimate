// ================================================================
// DEBUG CONSOLE MANAGER
// ================================================================
// Enhanced debugging interface for MIC Browser Ultimate

class DebugConsoleManager {
    constructor() {
        this.isVisible = false;
        this.logs = [];
        this.filters = {
            levels: ['info', 'warn', 'error', 'debug'],
            sources: ['main', 'renderer', 'ipc', 'system'],
            search: ''
        };
        this.maxLogs = 1000;
        this.ipcMonitor = true;
        this.performanceMetrics = {};
        
        this.init();
    }

    init() {
        console.log('🔧 Initializing Debug Console Manager...');
        
        // Only initialize in development mode
        if (!window.isDev && !localStorage.getItem('force-debug')) {
            return;
        }

        this.createDebugUI();
        this.setupLogCapture();
        this.setupIpcMonitoring();
        this.setupKeyboardShortcuts();
        this.startPerformanceMonitoring();
        
        console.log('✅ Debug Console Manager initialized');
    }

    createDebugUI() {
        // Create debug console HTML
        const debugHTML = `
            <div id="debug-console" class="debug-console hidden">
                <div class="debug-header">
                    <h3>🔧 Debug Console</h3>
                    <div class="debug-controls">
                        <button id="debug-clear" title="Clear logs">🗑️</button>
                        <button id="debug-export" title="Export logs">💾</button>
                        <button id="debug-settings" title="Settings">⚙️</button>
                        <button id="debug-close" title="Close">✖️</button>
                    </div>
                </div>
                
                <div class="debug-filters">
                    <input type="text" id="debug-search" placeholder="🔍 Search logs..." />
                    <div class="debug-level-filters">
                        <label><input type="checkbox" data-level="info" checked> Info</label>
                        <label><input type="checkbox" data-level="warn" checked> Warn</label>
                        <label><input type="checkbox" data-level="error" checked> Error</label>
                        <label><input type="checkbox" data-level="debug" checked> Debug</label>
                    </div>
                    <div class="debug-source-filters">
                        <label><input type="checkbox" data-source="main" checked> Main</label>
                        <label><input type="checkbox" data-source="renderer" checked> Renderer</label>
                        <label><input type="checkbox" data-source="ipc" checked> IPC</label>
                        <label><input type="checkbox" data-source="system" checked> System</label>
                    </div>
                </div>

                <div class="debug-tabs">
                    <button class="debug-tab active" data-tab="logs">📋 Logs</button>
                    <button class="debug-tab" data-tab="ipc">📡 IPC Monitor</button>
                    <button class="debug-tab" data-tab="performance">📊 Performance</button>
                    <button class="debug-tab" data-tab="state">🏷️ App State</button>
                </div>

                <div class="debug-content">
                    <div id="debug-logs-content" class="debug-tab-content active">
                        <div id="debug-logs-container" class="debug-logs"></div>
                    </div>
                    
                    <div id="debug-ipc-content" class="debug-tab-content">
                        <div class="debug-ipc-stats">
                            <span>IPC Calls: <span id="ipc-count">0</span></span>
                            <span>Avg Latency: <span id="ipc-latency">0ms</span></span>
                        </div>
                        <div id="debug-ipc-container" class="debug-logs"></div>
                    </div>
                    
                    <div id="debug-performance-content" class="debug-tab-content">
                        <div class="performance-metrics">
                            <div class="metric">
                                <label>Memory Usage:</label>
                                <span id="memory-usage">--</span>
                            </div>
                            <div class="metric">
                                <label>Render Time:</label>
                                <span id="render-time">--</span>
                            </div>
                            <div class="metric">
                                <label>FPS:</label>
                                <span id="fps-counter">--</span>
                            </div>
                        </div>
                        <div id="performance-chart" class="performance-chart"></div>
                    </div>
                    
                    <div id="debug-state-content" class="debug-tab-content">
                        <div class="state-inspector">
                            <h4>Application State</h4>
                            <pre id="app-state-display"></pre>
                        </div>
                    </div>
                </div>
            </div>

            <div id="debug-toggle" class="debug-toggle" title="Toggle Debug Console (Ctrl+Shift+D)">
                🔧
            </div>
        `;

        // Inject CSS
        const debugCSS = `
            <style>
                .debug-console {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 40vh;
                    background: #1a1a1a;
                    border-top: 2px solid #333;
                    color: #e0e0e0;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    z-index: 10000;
                    display: flex;
                    flex-direction: column;
                    transition: transform 0.3s ease;
                }

                .debug-console.hidden {
                    transform: translateY(100%);
                }

                .debug-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 12px;
                    background: #2a2a2a;
                    border-bottom: 1px solid #444;
                }

                .debug-header h3 {
                    margin: 0;
                    font-size: 14px;
                }

                .debug-controls button {
                    background: #444;
                    border: none;
                    color: #e0e0e0;
                    padding: 4px 8px;
                    margin-left: 4px;
                    cursor: pointer;
                    border-radius: 3px;
                }

                .debug-controls button:hover {
                    background: #555;
                }

                .debug-filters {
                    display: flex;
                    gap: 10px;
                    padding: 8px 12px;
                    background: #222;
                    border-bottom: 1px solid #444;
                    flex-wrap: wrap;
                    align-items: center;
                }

                .debug-filters input[type="text"] {
                    flex: 1;
                    min-width: 200px;
                    background: #333;
                    border: 1px solid #555;
                    color: #e0e0e0;
                    padding: 4px 8px;
                    border-radius: 3px;
                }

                .debug-level-filters, .debug-source-filters {
                    display: flex;
                    gap: 8px;
                }

                .debug-level-filters label, .debug-source-filters label {
                    font-size: 11px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .debug-tabs {
                    display: flex;
                    background: #2a2a2a;
                    border-bottom: 1px solid #444;
                }

                .debug-tab {
                    background: transparent;
                    border: none;
                    color: #aaa;
                    padding: 8px 12px;
                    cursor: pointer;
                    border-bottom: 2px solid transparent;
                    font-size: 11px;
                }

                .debug-tab.active {
                    color: #3b82f6;
                    border-bottom-color: #3b82f6;
                }

                .debug-tab:hover {
                    background: #333;
                }

                .debug-content {
                    flex: 1;
                    overflow: hidden;
                }

                .debug-tab-content {
                    height: 100%;
                    overflow-y: auto;
                    display: none;
                    padding: 8px;
                }

                .debug-tab-content.active {
                    display: block;
                }

                .debug-logs {
                    font-family: 'Courier New', monospace;
                    font-size: 11px;
                    line-height: 1.4;
                }

                .debug-log-entry {
                    padding: 2px 4px;
                    margin: 1px 0;
                    border-radius: 2px;
                    border-left: 3px solid transparent;
                }

                .debug-log-entry.info { border-left-color: #3b82f6; }
                .debug-log-entry.warn { border-left-color: #f59e0b; background: rgba(245, 158, 11, 0.1); }
                .debug-log-entry.error { border-left-color: #ef4444; background: rgba(239, 68, 68, 0.1); }
                .debug-log-entry.debug { border-left-color: #10b981; }

                .debug-log-time {
                    color: #666;
                    margin-right: 8px;
                }

                .debug-log-source {
                    color: #888;
                    margin-right: 8px;
                    font-weight: bold;
                }

                .debug-toggle {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 40px;
                    height: 40px;
                    background: #333;
                    color: #e0e0e0;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 16px;
                    z-index: 9999;
                    transition: all 0.3s ease;
                    border: 2px solid #555;
                }

                .debug-toggle:hover {
                    background: #444;
                    border-color: #666;
                    transform: scale(1.1);
                }

                .debug-ipc-stats {
                    display: flex;
                    gap: 20px;
                    padding: 8px;
                    background: #2a2a2a;
                    border-radius: 4px;
                    margin-bottom: 8px;
                }

                .performance-metrics {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 10px;
                    margin-bottom: 10px;
                }

                .metric {
                    background: #2a2a2a;
                    padding: 8px;
                    border-radius: 4px;
                }

                .metric label {
                    display: block;
                    font-size: 10px;
                    color: #aaa;
                    margin-bottom: 4px;
                }

                .state-inspector pre {
                    background: #2a2a2a;
                    padding: 10px;
                    border-radius: 4px;
                    overflow: auto;
                    font-size: 11px;
                    white-space: pre-wrap;
                }
            </style>
        `;

        // Inject HTML and CSS into page
        document.head.insertAdjacentHTML('beforeend', debugCSS);
        document.body.insertAdjacentHTML('beforeend', debugHTML);

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Toggle debug console
        document.getElementById('debug-toggle').addEventListener('click', () => {
            this.toggle();
        });

        // Close button
        document.getElementById('debug-close').addEventListener('click', () => {
            this.hide();
        });

        // Clear logs
        document.getElementById('debug-clear').addEventListener('click', () => {
            this.clearLogs();
        });

        // Export logs
        document.getElementById('debug-export').addEventListener('click', () => {
            this.exportLogs();
        });

        // Tab switching
        document.querySelectorAll('.debug-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Filter changes
        document.getElementById('debug-search').addEventListener('input', (e) => {
            this.filters.search = e.target.value;
            this.updateLogDisplay();
        });

        // Level and source filters
        document.querySelectorAll('.debug-filters input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateFilters();
                this.updateLogDisplay();
            });
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+D to toggle debug console
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                this.toggle();
            }
        });
    }

    setupLogCapture() {
        // Capture console logs
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;

        console.log = (...args) => {
            this.addLog('info', 'renderer', args.join(' '));
            originalLog.apply(console, args);
        };

        console.warn = (...args) => {
            this.addLog('warn', 'renderer', args.join(' '));
            originalWarn.apply(console, args);
        };

        console.error = (...args) => {
            this.addLog('error', 'renderer', args.join(' '));
            originalError.apply(console, args);
        };
    }

    setupIpcMonitoring() {
        if (!window.electronAPI) return;

        // Monitor IPC calls (if available)
        this.ipcCallCount = 0;
        this.ipcLatencies = [];

        // Wrap IPC methods to monitor them
        if (window.electronAPI.getTheme) {
            const originalGetTheme = window.electronAPI.getTheme;
            window.electronAPI.getTheme = async (...args) => {
                const start = performance.now();
                this.addLog('debug', 'ipc', 'IPC Call: getTheme');
                try {
                    const result = await originalGetTheme.apply(window.electronAPI, args);
                    const latency = performance.now() - start;
                    this.recordIpcCall('getTheme', latency, 'success');
                    return result;
                } catch (error) {
                    const latency = performance.now() - start;
                    this.recordIpcCall('getTheme', latency, 'error');
                    throw error;
                }
            };
        }
    }

    startPerformanceMonitoring() {
        setInterval(() => {
            this.updatePerformanceMetrics();
        }, 1000);
    }

    addLog(level, source, message) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = {
            timestamp,
            level,
            source,
            message,
            id: Date.now() + Math.random()
        };

        this.logs.unshift(logEntry);

        // Limit log count
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(0, this.maxLogs);
        }

        this.updateLogDisplay();
    }

    recordIpcCall(method, latency, status) {
        this.ipcCallCount++;
        this.ipcLatencies.push(latency);

        // Keep only last 100 latency measurements
        if (this.ipcLatencies.length > 100) {
            this.ipcLatencies.shift();
        }

        const avgLatency = this.ipcLatencies.reduce((a, b) => a + b, 0) / this.ipcLatencies.length;

        // Update IPC stats display
        document.getElementById('ipc-count').textContent = this.ipcCallCount;
        document.getElementById('ipc-latency').textContent = Math.round(avgLatency) + 'ms';

        // Integrate with Performance Monitor if available
        if (window.performanceMonitor) {
            window.performanceMonitor.recordIPCLatency(latency);
        }

        this.addLog('debug', 'ipc', `${method} completed in ${Math.round(latency)}ms (${status})`);
    }

    updateFilters() {
        this.filters.levels = Array.from(document.querySelectorAll('.debug-level-filters input:checked')).map(cb => cb.dataset.level);
        this.filters.sources = Array.from(document.querySelectorAll('.debug-source-filters input:checked')).map(cb => cb.dataset.source);
    }

    updateLogDisplay() {
        const container = document.getElementById('debug-logs-container');
        if (!container) return;

        const filteredLogs = this.logs.filter(log => {
            const levelMatch = this.filters.levels.includes(log.level);
            const sourceMatch = this.filters.sources.includes(log.source);
            const searchMatch = !this.filters.search || log.message.toLowerCase().includes(this.filters.search.toLowerCase());
            
            return levelMatch && sourceMatch && searchMatch;
        });

        container.innerHTML = filteredLogs.map(log => `
            <div class="debug-log-entry ${log.level}">
                <span class="debug-log-time">${log.timestamp}</span>
                <span class="debug-log-source">[${log.source}]</span>
                <span class="debug-log-message">${this.escapeHtml(log.message)}</span>
            </div>
        `).join('');

        // Auto-scroll to top for new logs
        container.scrollTop = 0;
    }

    updatePerformanceMetrics() {
        // Memory usage
        if (performance.memory) {
            const memory = performance.memory;
            const memoryUsage = `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB / ${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`;
            document.getElementById('memory-usage').textContent = memoryUsage;
        }

        // Frame rate estimation
        if (!this.lastFrameTime) {
            this.lastFrameTime = performance.now();
            this.frameCount = 0;
        } else {
            this.frameCount++;
            const now = performance.now();
            if (now - this.lastFrameTime >= 1000) {
                const fps = Math.round(this.frameCount * 1000 / (now - this.lastFrameTime));
                document.getElementById('fps-counter').textContent = fps;
                this.lastFrameTime = now;
                this.frameCount = 0;
            }
        }

        this.updateAppState();
    }

    updateAppState() {
        const appState = {
            electronAPI: !!window.electronAPI,
            themeManager: !!window.themeManager,
            currentTheme: window.themeManager?.getCurrentTheme()?.name || 'unknown',
            location: window.location.href,
            userAgent: navigator.userAgent.substring(0, 100) + '...',
            timestamp: new Date().toISOString()
        };

        const stateDisplay = document.getElementById('app-state-display');
        if (stateDisplay) {
            stateDisplay.textContent = JSON.stringify(appState, null, 2);
        }
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.debug-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update content panels
        document.querySelectorAll('.debug-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`debug-${tabName}-content`).classList.add('active');
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    show() {
        document.getElementById('debug-console').classList.remove('hidden');
        this.isVisible = true;
        this.updateLogDisplay();
        this.updateAppState();
    }

    hide() {
        document.getElementById('debug-console').classList.add('hidden');
        this.isVisible = false;
    }

    clearLogs() {
        this.logs = [];
        this.updateLogDisplay();
    }

    exportLogs() {
        const data = {
            timestamp: new Date().toISOString(),
            logs: this.logs,
            performanceMetrics: this.performanceMetrics
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `debug-logs-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.addLog('info', 'system', 'Debug logs exported successfully');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize debug console when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.debugConsole = new DebugConsoleManager();
    });
} else {
    window.debugConsole = new DebugConsoleManager();
}

// Export for external access
window.DebugConsoleManager = DebugConsoleManager;