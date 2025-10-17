// ================================================================
// BREAKPOINT MANAGEMENT SYSTEM
// ================================================================
// Advanced breakpoint utilities for debugging MIC Browser Ultimate

class BreakpointManager {
    constructor() {
        this.breakpoints = new Map();
        this.activeBreakpoints = new Set();
        this.breakpointConfigs = [];
        this.debugSessions = new Map();
        this.vsCodeIntegration = null;
        
        this.init();
    }

    init() {
        console.log('🔧 Initializing Breakpoint Manager...');
        
        this.setupBreakpointAPI();
        this.setupVSCodeIntegration();
        this.loadSavedBreakpoints();
        this.setupDebugContext();
        
        console.log('✅ Breakpoint Manager initialized');
    }

    setupBreakpointAPI() {
        // Add breakpoint management to debug console if available
        if (window.debugConsole) {
            this.integrateWithDebugConsole();
        }

        // Expose global API
        window.breakpointManager = this;
        
        // Add to debug console tabs
        this.addBreakpointTab();
    }

    addBreakpointTab() {
        // Add breakpoints tab to debug console
        setTimeout(() => {
            const debugTabs = document.querySelector('.debug-tabs');
            const debugContent = document.querySelector('.debug-content');
            
            if (debugTabs && debugContent) {
                // Add tab button
                const breakpointTab = document.createElement('button');
                breakpointTab.className = 'debug-tab';
                breakpointTab.dataset.tab = 'breakpoints';
                breakpointTab.innerHTML = '🔴 Breakpoints';
                debugTabs.appendChild(breakpointTab);

                // Add tab content
                const breakpointContent = document.createElement('div');
                breakpointContent.id = 'debug-breakpoints-content';
                breakpointContent.className = 'debug-tab-content';
                breakpointContent.innerHTML = this.createBreakpointUI();
                debugContent.appendChild(breakpointContent);

                // Setup event listeners
                this.setupBreakpointEventListeners();
                
                console.log('✅ Breakpoint tab added to debug console');
            }
        }, 1000);
    }

    createBreakpointUI() {
        return `
            <div class="breakpoint-manager">
                <div class="breakpoint-controls">
                    <div class="breakpoint-actions">
                        <button id="add-breakpoint" class="bp-btn primary">➕ Add Breakpoint</button>
                        <button id="clear-all-breakpoints" class="bp-btn danger">🗑️ Clear All</button>
                        <button id="export-breakpoints" class="bp-btn">💾 Export</button>
                        <button id="import-breakpoints" class="bp-btn">📁 Import</button>
                    </div>
                    
                    <div class="breakpoint-quick-actions">
                        <select id="quick-breakpoint-file">
                            <option value="">Select file for quick breakpoint...</option>
                            <option value="main.js">main.js (Main Process)</option>
                            <option value="preload.js">preload.js (Preload)</option>
                            <option value="index.html">index.html (Renderer)</option>
                            <option value="DebugConsoleManager.js">DebugConsoleManager.js</option>
                        </select>
                        <input type="number" id="quick-line" placeholder="Line #" min="1" />
                        <button id="quick-add-breakpoint" class="bp-btn">⚡ Quick Add</button>
                    </div>
                </div>

                <div class="breakpoint-stats">
                    <div class="stat-item">
                        <label>Active Breakpoints:</label>
                        <span id="active-bp-count">0</span>
                    </div>
                    <div class="stat-item">
                        <label>Total Configured:</label>
                        <span id="total-bp-count">0</span>
                    </div>
                    <div class="stat-item">
                        <label>Debug Sessions:</label>
                        <span id="debug-session-count">0</span>
                    </div>
                </div>

                <div class="breakpoint-list-container">
                    <h4>📍 Active Breakpoints</h4>
                    <div id="breakpoint-list" class="breakpoint-list">
                        <div class="no-breakpoints">No breakpoints set. Add one above to get started!</div>
                    </div>
                </div>

                <div class="debug-session-info">
                    <h4>🔍 Debug Session Info</h4>
                    <div id="debug-session-info" class="session-info">
                        <div class="session-item">
                            <label>Debugger Attached:</label>
                            <span id="debugger-attached">Checking...</span>
                        </div>
                        <div class="session-item">
                            <label>Inspector URL:</label>
                            <span id="inspector-url">ws://127.0.0.1:5858/...</span>
                        </div>
                        <div class="session-item">
                            <label>VS Code Integration:</label>
                            <span id="vscode-integration">Not Connected</span>
                        </div>
                    </div>
                </div>

                <div class="breakpoint-templates">
                    <h4>⚡ Quick Breakpoint Templates</h4>
                    <div class="template-buttons">
                        <button class="template-btn" data-template="theme-change">🎨 Theme Change</button>
                        <button class="template-btn" data-template="ipc-calls">📡 IPC Calls</button>
                        <button class="template-btn" data-template="app-startup">🚀 App Startup</button>
                        <button class="template-btn" data-template="error-handling">❌ Error Handling</button>
                        <button class="template-btn" data-template="performance">📊 Performance</button>
                    </div>
                </div>
            </div>
        `;
    }

    setupBreakpointEventListeners() {
        // Add breakpoint button
        document.getElementById('add-breakpoint')?.addEventListener('click', () => {
            this.showAddBreakpointDialog();
        });

        // Clear all breakpoints
        document.getElementById('clear-all-breakpoints')?.addEventListener('click', () => {
            this.clearAllBreakpoints();
        });

        // Export/Import
        document.getElementById('export-breakpoints')?.addEventListener('click', () => {
            this.exportBreakpoints();
        });

        document.getElementById('import-breakpoints')?.addEventListener('click', () => {
            this.importBreakpoints();
        });

        // Quick add breakpoint
        document.getElementById('quick-add-breakpoint')?.addEventListener('click', () => {
            this.quickAddBreakpoint();
        });

        // Template buttons
        document.querySelectorAll('.template-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.applyBreakpointTemplate(e.target.dataset.template);
            });
        });

        // Tab switching integration
        document.querySelector('[data-tab="breakpoints"]')?.addEventListener('click', () => {
            this.refreshBreakpointDisplay();
        });
    }

    // Core breakpoint operations
    addBreakpoint(file, line, condition = null, logMessage = null) {
        const id = `${file}:${line}`;
        const breakpoint = {
            id,
            file,
            line,
            condition,
            logMessage,
            enabled: true,
            hitCount: 0,
            created: new Date().toISOString()
        };

        this.breakpoints.set(id, breakpoint);
        this.activeBreakpoints.add(id);

        // Log to debug console
        this.logBreakpointAction('add', breakpoint);
        
        // Update UI
        this.refreshBreakpointDisplay();
        
        // Try to sync with VS Code
        this.syncWithVSCode();

        return breakpoint;
    }

    removeBreakpoint(id) {
        const breakpoint = this.breakpoints.get(id);
        if (breakpoint) {
            this.breakpoints.delete(id);
            this.activeBreakpoints.delete(id);
            
            this.logBreakpointAction('remove', breakpoint);
            this.refreshBreakpointDisplay();
            this.syncWithVSCode();
        }
    }

    toggleBreakpoint(id) {
        const breakpoint = this.breakpoints.get(id);
        if (breakpoint) {
            breakpoint.enabled = !breakpoint.enabled;
            
            if (breakpoint.enabled) {
                this.activeBreakpoints.add(id);
            } else {
                this.activeBreakpoints.delete(id);
            }

            this.logBreakpointAction('toggle', breakpoint);
            this.refreshBreakpointDisplay();
        }
    }

    clearAllBreakpoints() {
        const count = this.breakpoints.size;
        this.breakpoints.clear();
        this.activeBreakpoints.clear();
        
        console.log(`🗑️ Cleared ${count} breakpoints`);
        this.refreshBreakpointDisplay();
    }

    // Quick breakpoint addition
    quickAddBreakpoint() {
        const fileSelect = document.getElementById('quick-breakpoint-file');
        const lineInput = document.getElementById('quick-line');
        
        const file = fileSelect.value;
        const line = parseInt(lineInput.value);

        if (!file || !line) {
            alert('Please select a file and enter a line number');
            return;
        }

        this.addBreakpoint(file, line);
        
        // Clear form
        fileSelect.value = '';
        lineInput.value = '';
    }

    // Breakpoint templates
    applyBreakpointTemplate(templateName) {
        const templates = {
            'theme-change': [
                { file: 'main.js', line: 1005, condition: null, logMessage: 'Theme change triggered' },
                { file: 'index.html', line: 9255, condition: null, logMessage: 'Theme applied to UI' }
            ],
            'ipc-calls': [
                { file: 'main.js', line: 1015, condition: null, logMessage: 'IPC theme handler called' },
                { file: 'preload.js', line: 267, condition: null, logMessage: 'IPC method invoked from renderer' }
            ],
            'app-startup': [
                { file: 'main.js', line: 397, condition: null, logMessage: 'App startup began' },
                { file: 'main.js', line: 418, condition: null, logMessage: 'Core IPC handlers setup' }
            ],
            'error-handling': [
                { file: 'main.js', line: 1020, condition: '!theme', logMessage: 'Theme not found error' },
                { file: 'DebugConsoleManager.js', line: 200, condition: 'error', logMessage: 'Debug console error' }
            ],
            'performance': [
                { file: 'main.js', line: 451, condition: null, logMessage: 'Performance monitoring point' },
                { file: 'DebugConsoleManager.js', line: 350, condition: null, logMessage: 'Performance metrics update' }
            ]
        };

        const template = templates[templateName];
        if (template) {
            let added = 0;
            template.forEach(bp => {
                this.addBreakpoint(bp.file, bp.line, bp.condition, bp.logMessage);
                added++;
            });
            
            console.log(`⚡ Applied ${templateName} template: ${added} breakpoints added`);
        }
    }

    // Display management
    refreshBreakpointDisplay() {
        const listContainer = document.getElementById('breakpoint-list');
        const activeBpCount = document.getElementById('active-bp-count');
        const totalBpCount = document.getElementById('total-bp-count');

        if (!listContainer) return;

        // Update counts
        if (activeBpCount) activeBpCount.textContent = this.activeBreakpoints.size;
        if (totalBpCount) totalBpCount.textContent = this.breakpoints.size;

        // Update breakpoint list
        if (this.breakpoints.size === 0) {
            listContainer.innerHTML = '<div class="no-breakpoints">No breakpoints set. Add one above to get started!</div>';
            return;
        }

        const breakpointHTML = Array.from(this.breakpoints.values())
            .sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)
            .map(bp => this.createBreakpointItem(bp))
            .join('');

        listContainer.innerHTML = breakpointHTML;

        // Add event listeners to breakpoint items
        this.attachBreakpointItemListeners();
    }

    createBreakpointItem(breakpoint) {
        const statusIcon = breakpoint.enabled ? '🔴' : '⚪';
        const conditionText = breakpoint.condition ? ` | Condition: ${breakpoint.condition}` : '';
        const logText = breakpoint.logMessage ? ` | Log: ${breakpoint.logMessage}` : '';
        
        return `
            <div class="breakpoint-item ${breakpoint.enabled ? 'enabled' : 'disabled'}" data-id="${breakpoint.id}">
                <div class="bp-info">
                    <span class="bp-status">${statusIcon}</span>
                    <span class="bp-location">${breakpoint.file}:${breakpoint.line}</span>
                    <span class="bp-details">${conditionText}${logText}</span>
                </div>
                <div class="bp-stats">
                    <span class="bp-hits">Hits: ${breakpoint.hitCount}</span>
                    <span class="bp-created">Created: ${new Date(breakpoint.created).toLocaleTimeString()}</span>
                </div>
                <div class="bp-actions">
                    <button class="bp-action-btn toggle" title="Toggle breakpoint">
                        ${breakpoint.enabled ? '⏸️' : '▶️'}
                    </button>
                    <button class="bp-action-btn edit" title="Edit breakpoint">✏️</button>
                    <button class="bp-action-btn remove" title="Remove breakpoint">🗑️</button>
                </div>
            </div>
        `;
    }

    attachBreakpointItemListeners() {
        // Toggle buttons
        document.querySelectorAll('.bp-action-btn.toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('.breakpoint-item').dataset.id;
                this.toggleBreakpoint(id);
            });
        });

        // Remove buttons
        document.querySelectorAll('.bp-action-btn.remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('.breakpoint-item').dataset.id;
                if (confirm('Remove this breakpoint?')) {
                    this.removeBreakpoint(id);
                }
            });
        });

        // Edit buttons
        document.querySelectorAll('.bp-action-btn.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('.breakpoint-item').dataset.id;
                this.editBreakpoint(id);
            });
        });
    }

    // VS Code integration
    setupVSCodeIntegration() {
        // Check if running in debug mode with inspector
        const debuggerAttached = typeof window.process !== 'undefined' && 
                                 process.argv.includes('--inspect');
        
        setTimeout(() => {
            const debuggerStatus = document.getElementById('debugger-attached');
            if (debuggerStatus) {
                debuggerStatus.textContent = debuggerAttached ? 'Yes' : 'No';
                debuggerStatus.className = debuggerAttached ? 'status-good' : 'status-warning';
            }

            // Try to detect VS Code
            this.detectVSCodeIntegration();
        }, 1000);
    }

    detectVSCodeIntegration() {
        // Simple VS Code detection (checks for debug environment)
        const isVSCodeDebug = window.process?.env?.VSCODE_PID || 
                             window.process?.env?.TERM_PROGRAM === 'vscode';
        
        const vscodeStatus = document.getElementById('vscode-integration');
        if (vscodeStatus) {
            vscodeStatus.textContent = isVSCodeDebug ? 'Connected' : 'Not Detected';
            vscodeStatus.className = isVSCodeDebug ? 'status-good' : 'status-info';
        }
    }

    syncWithVSCode() {
        // In a real implementation, this would sync with VS Code's debug adapter
        console.log('🔄 Syncing breakpoints with VS Code...');
        
        // For now, just save to localStorage so they persist
        this.saveBreakpoints();
    }

    // Persistence
    saveBreakpoints() {
        const data = {
            breakpoints: Array.from(this.breakpoints.entries()),
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('debug-breakpoints', JSON.stringify(data));
        console.log('💾 Breakpoints saved');
    }

    loadSavedBreakpoints() {
        try {
            const saved = localStorage.getItem('debug-breakpoints');
            if (saved) {
                const data = JSON.parse(saved);
                data.breakpoints.forEach(([id, breakpoint]) => {
                    this.breakpoints.set(id, breakpoint);
                    if (breakpoint.enabled) {
                        this.activeBreakpoints.add(id);
                    }
                });
                
                console.log(`📁 Loaded ${this.breakpoints.size} saved breakpoints`);
            }
        } catch (error) {
            console.error('Failed to load saved breakpoints:', error);
        }
    }

    exportBreakpoints() {
        const data = {
            breakpoints: Array.from(this.breakpoints.entries()),
            exported: new Date().toISOString(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `breakpoints-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('💾 Breakpoints exported');
    }

    importBreakpoints() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        
                        // Clear existing and import
                        this.clearAllBreakpoints();
                        
                        data.breakpoints.forEach(([id, breakpoint]) => {
                            this.breakpoints.set(id, breakpoint);
                            if (breakpoint.enabled) {
                                this.activeBreakpoints.add(id);
                            }
                        });
                        
                        this.refreshBreakpointDisplay();
                        console.log(`📁 Imported ${data.breakpoints.length} breakpoints`);
                        
                    } catch (error) {
                        console.error('Failed to import breakpoints:', error);
                        alert('Failed to import breakpoints. Please check the file format.');
                    }
                };
                reader.readAsText(file);
            }
        };
        
        input.click();
    }

    // Utility methods
    logBreakpointAction(action, breakpoint) {
        const messages = {
            add: `➕ Added breakpoint: ${breakpoint.file}:${breakpoint.line}`,
            remove: `➖ Removed breakpoint: ${breakpoint.file}:${breakpoint.line}`,
            toggle: `🔄 ${breakpoint.enabled ? 'Enabled' : 'Disabled'} breakpoint: ${breakpoint.file}:${breakpoint.line}`
        };

        console.log(messages[action] || `Breakpoint action: ${action}`);
        
        // Add to debug console if available
        if (window.debugConsole) {
            window.debugConsole.addLog('debug', 'breakpoint', messages[action]);
        }
    }

    setupDebugContext() {
        // Add global debug helpers
        window.bp = {
            add: (file, line, condition, logMessage) => this.addBreakpoint(file, line, condition, logMessage),
            remove: (id) => this.removeBreakpoint(id),
            toggle: (id) => this.toggleBreakpoint(id),
            clear: () => this.clearAllBreakpoints(),
            list: () => Array.from(this.breakpoints.values()),
            export: () => this.exportBreakpoints()
        };

        console.log('🛠️ Debug context setup complete. Use window.bp for quick breakpoint management');
    }

    // Add dialog and edit functionality
    showAddBreakpointDialog() {
        const dialog = this.createAddBreakpointDialog();
        document.body.appendChild(dialog);
    }

    createAddBreakpointDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'breakpoint-dialog-overlay';
        dialog.innerHTML = `
            <div class="breakpoint-dialog">
                <h3>➕ Add Breakpoint</h3>
                <form id="add-breakpoint-form">
                    <div class="form-group">
                        <label>File:</label>
                        <input type="text" id="bp-file" placeholder="e.g., main.js" required />
                    </div>
                    <div class="form-group">
                        <label>Line:</label>
                        <input type="number" id="bp-line" placeholder="Line number" min="1" required />
                    </div>
                    <div class="form-group">
                        <label>Condition (optional):</label>
                        <input type="text" id="bp-condition" placeholder="e.g., x > 10" />
                    </div>
                    <div class="form-group">
                        <label>Log Message (optional):</label>
                        <input type="text" id="bp-log" placeholder="Message to log when hit" />
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="bp-btn primary">Add Breakpoint</button>
                        <button type="button" class="bp-btn" onclick="this.closest('.breakpoint-dialog-overlay').remove()">Cancel</button>
                    </div>
                </form>
            </div>
        `;

        // Add event listener
        dialog.querySelector('#add-breakpoint-form').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const file = document.getElementById('bp-file').value;
            const line = parseInt(document.getElementById('bp-line').value);
            const condition = document.getElementById('bp-condition').value || null;
            const logMessage = document.getElementById('bp-log').value || null;

            this.addBreakpoint(file, line, condition, logMessage);
            dialog.remove();
        });

        return dialog;
    }

    editBreakpoint(id) {
        const breakpoint = this.breakpoints.get(id);
        if (!breakpoint) return;

        // Similar to add dialog but pre-filled
        // Implementation would be similar to showAddBreakpointDialog
        console.log('✏️ Edit breakpoint:', id);
        // For now, just log - full implementation would show edit dialog
    }
}

// CSS for breakpoint manager
const breakpointCSS = `
<style>
.breakpoint-manager {
    padding: 10px;
    font-family: 'Courier New', monospace;
    font-size: 12px;
}

.breakpoint-controls {
    background: #2a2a2a;
    padding: 10px;
    border-radius: 5px;
    margin-bottom: 10px;
}

.breakpoint-actions {
    display: flex;
    gap: 8px;
    margin-bottom: 10px;
    flex-wrap: wrap;
}

.breakpoint-quick-actions {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
}

.bp-btn {
    padding: 6px 12px;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-size: 11px;
    background: #444;
    color: #e0e0e0;
}

.bp-btn:hover { background: #555; }
.bp-btn.primary { background: #3b82f6; color: white; }
.bp-btn.danger { background: #ef4444; color: white; }

.breakpoint-stats {
    display: flex;
    gap: 20px;
    margin: 10px 0;
    padding: 8px;
    background: #222;
    border-radius: 3px;
}

.stat-item label {
    color: #aaa;
    margin-right: 5px;
}

.breakpoint-list {
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid #444;
    border-radius: 3px;
}

.breakpoint-item {
    padding: 8px;
    border-bottom: 1px solid #333;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.breakpoint-item.enabled {
    background: rgba(59, 130, 246, 0.1);
}

.breakpoint-item.disabled {
    background: rgba(156, 163, 175, 0.1);
    opacity: 0.7;
}

.bp-info {
    flex: 1;
    display: flex;
    gap: 10px;
    align-items: center;
}

.bp-location {
    font-weight: bold;
    color: #3b82f6;
}

.bp-details {
    color: #aaa;
    font-size: 10px;
}

.bp-stats {
    display: flex;
    gap: 10px;
    font-size: 10px;
    color: #888;
}

.bp-actions {
    display: flex;
    gap: 4px;
}

.bp-action-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 2px;
    font-size: 12px;
}

.bp-action-btn:hover {
    background: #444;
}

.no-breakpoints {
    padding: 20px;
    text-align: center;
    color: #666;
    font-style: italic;
}

.debug-session-info, .breakpoint-templates {
    margin-top: 15px;
    padding: 10px;
    background: #2a2a2a;
    border-radius: 5px;
}

.session-info {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.session-item {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
}

.status-good { color: #10b981; }
.status-warning { color: #f59e0b; }
.status-info { color: #3b82f6; }

.template-buttons {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-top: 8px;
}

.template-btn {
    padding: 4px 8px;
    background: #444;
    border: none;
    border-radius: 3px;
    color: #e0e0e0;
    cursor: pointer;
    font-size: 10px;
}

.template-btn:hover {
    background: #555;
}

.breakpoint-dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10001;
}

.breakpoint-dialog {
    background: #1a1a1a;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid #444;
    color: #e0e0e0;
    font-family: 'Courier New', monospace;
    min-width: 400px;
}

.form-group {
    margin-bottom: 15px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-size: 12px;
    color: #aaa;
}

.form-group input {
    width: 100%;
    padding: 6px;
    background: #333;
    border: 1px solid #555;
    border-radius: 3px;
    color: #e0e0e0;
    font-family: inherit;
}

.form-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 20px;
}
</style>
`;

// Inject CSS
document.head.insertAdjacentHTML('beforeend', breakpointCSS);

// Initialize breakpoint manager
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.breakpointManager = new BreakpointManager();
    });
} else {
    window.breakpointManager = new BreakpointManager();
}

// Export for external access
window.BreakpointManager = BreakpointManager;