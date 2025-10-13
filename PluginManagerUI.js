/**
 * Plugin Management UI Component
 * Provides a user interface for managing plugins in MIC Browser Ultimate
 */

class PluginManagerUI {
  constructor() {
    this.plugins = [];
    this.container = null;
    this.initialized = false;
  }

  /**
   * Initialize the Plugin Manager UI
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Create the UI container
      this.createUI();
      
      // Load plugins list
      await this.loadPluginsList();
      
      // Setup event listeners
      this.setupEventListeners();
      
      this.initialized = true;
      console.log('🎛️ Plugin Manager UI initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Plugin Manager UI:', error);
      throw error;
    }
  }

  /**
   * Create the main UI structure
   */
  createUI() {
    // Remove existing container if present
    const existing = document.getElementById('plugin-manager-container');
    if (existing) {
      existing.remove();
    }

    // Create main container
    this.container = document.createElement('div');
    this.container.id = 'plugin-manager-container';
    this.container.className = 'plugin-manager hidden';
    
    this.container.innerHTML = `
      <div class="plugin-manager-overlay" id="plugin-overlay">
        <div class="plugin-manager-modal">
          <div class="plugin-manager-header">
            <h2>🔌 Plugin Manager</h2>
            <button class="plugin-close-btn" id="plugin-close-btn" title="Close">×</button>
          </div>
          
          <div class="plugin-manager-tabs">
            <button class="plugin-tab active" data-tab="installed">Installed Plugins</button>
            <button class="plugin-tab" data-tab="create">Create Plugin</button>
            <button class="plugin-tab" data-tab="developer">Developer Tools</button>
          </div>
          
          <div class="plugin-manager-content">
            <!-- Installed Plugins Tab -->
            <div class="plugin-tab-content active" id="installed-tab">
              <div class="plugin-actions">
                <button class="plugin-btn plugin-btn-primary" id="refresh-plugins-btn">
                  🔄 Refresh
                </button>
                <button class="plugin-btn plugin-btn-secondary" id="open-plugins-folder-btn">
                  📁 Open Plugins Folder
                </button>
              </div>
              
              <div class="plugins-list" id="plugins-list">
                <div class="loading-message">Loading plugins...</div>
              </div>
            </div>
            
            <!-- Create Plugin Tab -->
            <div class="plugin-tab-content" id="create-tab">
              <div class="create-plugin-form">
                <h3>Create New Plugin</h3>
                <form id="create-plugin-form">
                  <div class="form-group">
                    <label for="plugin-id">Plugin ID:</label>
                    <input type="text" id="plugin-id" name="id" required 
                           pattern="[a-z0-9-]+" 
                           placeholder="my-awesome-plugin"
                           title="Use lowercase letters, numbers, and hyphens only">
                  </div>
                  
                  <div class="form-group">
                    <label for="plugin-name">Plugin Name:</label>
                    <input type="text" id="plugin-name" name="name" required 
                           placeholder="My Awesome Plugin">
                  </div>
                  
                  <div class="form-group">
                    <label for="plugin-description">Description:</label>
                    <textarea id="plugin-description" name="description" 
                              placeholder="A brief description of what your plugin does"
                              rows="3"></textarea>
                  </div>
                  
                  <div class="form-group">
                    <label for="plugin-author">Author:</label>
                    <input type="text" id="plugin-author" name="author" 
                           placeholder="Your Name">
                  </div>
                  
                  <div class="form-group">
                    <label for="plugin-template">Template:</label>
                    <select id="plugin-template" name="template">
                      <option value="basic">Basic Plugin</option>
                      <option value="ui">UI Plugin (with menus and buttons)</option>
                      <option value="hooks">Hook-based Plugin (event handling)</option>
                    </select>
                  </div>
                  
                  <div class="form-actions">
                    <button type="submit" class="plugin-btn plugin-btn-primary">
                      ✨ Create Plugin
                    </button>
                    <button type="button" class="plugin-btn plugin-btn-secondary" id="clear-form-btn">
                      🗑️ Clear Form
                    </button>
                  </div>
                </form>
                
                <div class="create-result" id="create-result"></div>
              </div>
            </div>
            
            <!-- Developer Tools Tab -->
            <div class="plugin-tab-content" id="developer-tab">
              <div class="developer-tools">
                <h3>Developer Tools</h3>
                
                <div class="tool-section">
                  <h4>Plugin Validation</h4>
                  <p>Validate plugin structure and configuration:</p>
                  <div class="form-group">
                    <select id="validate-plugin-select">
                      <option value="">Select a plugin to validate...</option>
                    </select>
                  </div>
                  <button class="plugin-btn plugin-btn-secondary" id="validate-plugin-btn">
                    🔍 Validate Plugin
                  </button>
                  <div class="validation-result" id="validation-result"></div>
                </div>
                
                <div class="tool-section">
                  <h4>Plugin Console</h4>
                  <p>Monitor plugin logs and messages:</p>
                  <div class="plugin-console" id="plugin-console">
                    <div class="console-output" id="console-output"></div>
                    <div class="console-controls">
                      <button class="plugin-btn plugin-btn-small" id="clear-console-btn">
                        🗑️ Clear
                      </button>
                      <button class="plugin-btn plugin-btn-small" id="export-logs-btn">
                        💾 Export Logs
                      </button>
                    </div>
                  </div>
                </div>
                
                <div class="tool-section">
                  <h4>Plugin Statistics</h4>
                  <div class="plugin-stats" id="plugin-stats">
                    <div class="stat-item">
                      <span class="stat-label">Total Plugins:</span>
                      <span class="stat-value" id="total-plugins">0</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">Enabled Plugins:</span>
                      <span class="stat-value" id="enabled-plugins">0</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">Plugin Directory:</span>
                      <span class="stat-value" id="plugins-directory">Loading...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add CSS styles
    this.addStyles();
    
    // Append to body
    document.body.appendChild(this.container);
  }

  /**
   * Add CSS styles for the plugin manager
   */
  addStyles() {
    const existingStyles = document.getElementById('plugin-manager-styles');
    if (existingStyles) return;

    const styles = document.createElement('style');
    styles.id = 'plugin-manager-styles';
    styles.textContent = `
      .plugin-manager {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .plugin-manager.hidden {
        display: none;
      }

      .plugin-manager-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(5px);
      }

      .plugin-manager-modal {
        background: var(--bg-color, #ffffff);
        color: var(--text-color, #333333);
        border-radius: 12px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        width: 90vw;
        max-width: 900px;
        height: 80vh;
        max-height: 700px;
        display: flex;
        flex-direction: column;
        position: relative;
        overflow: hidden;
        border: 1px solid var(--border-color, #e0e0e0);
      }

      .plugin-manager-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px;
        border-bottom: 1px solid var(--border-color, #e0e0e0);
        background: var(--header-bg, #f8f9fa);
      }

      .plugin-manager-header h2 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
      }

      .plugin-close-btn {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: var(--text-color, #333);
        padding: 4px 8px;
        border-radius: 4px;
        transition: background-color 0.2s;
      }

      .plugin-close-btn:hover {
        background: var(--hover-bg, #e9ecef);
      }

      .plugin-manager-tabs {
        display: flex;
        background: var(--tabs-bg, #f1f3f4);
        border-bottom: 1px solid var(--border-color, #e0e0e0);
      }

      .plugin-tab {
        flex: 1;
        padding: 12px 16px;
        background: none;
        border: none;
        cursor: pointer;
        font-weight: 500;
        color: var(--text-color-muted, #666);
        transition: all 0.2s;
      }

      .plugin-tab:hover {
        background: var(--hover-bg, #e9ecef);
      }

      .plugin-tab.active {
        background: var(--bg-color, #ffffff);
        color: var(--text-color, #333);
        border-bottom: 3px solid var(--primary-color, #007bff);
      }

      .plugin-manager-content {
        flex: 1;
        overflow: hidden;
      }

      .plugin-tab-content {
        display: none;
        height: 100%;
        overflow-y: auto;
        padding: 20px 24px;
      }

      .plugin-tab-content.active {
        display: block;
      }

      .plugin-actions {
        display: flex;
        gap: 12px;
        margin-bottom: 20px;
      }

      .plugin-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      .plugin-btn-primary {
        background: var(--primary-color, #007bff);
        color: white;
      }

      .plugin-btn-primary:hover {
        background: var(--primary-hover, #0056b3);
      }

      .plugin-btn-secondary {
        background: var(--secondary-bg, #6c757d);
        color: white;
      }

      .plugin-btn-secondary:hover {
        background: var(--secondary-hover, #545b62);
      }

      .plugin-btn-small {
        padding: 4px 8px;
        font-size: 0.875rem;
      }

      .plugins-list {
        display: grid;
        gap: 16px;
      }

      .plugin-card {
        border: 1px solid var(--border-color, #e0e0e0);
        border-radius: 8px;
        padding: 16px;
        background: var(--card-bg, #f8f9fa);
        transition: all 0.2s;
      }

      .plugin-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }

      .plugin-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }

      .plugin-card-title {
        font-weight: 600;
        font-size: 1.1rem;
        margin: 0;
      }

      .plugin-card-status {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 500;
      }

      .plugin-status-enabled {
        background: #d4edda;
        color: #155724;
      }

      .plugin-status-disabled {
        background: #f8d7da;
        color: #721c24;
      }

      .plugin-card-meta {
        display: flex;
        gap: 16px;
        font-size: 0.875rem;
        color: var(--text-color-muted, #666);
        margin-bottom: 8px;
      }

      .plugin-card-description {
        margin-bottom: 12px;
        color: var(--text-color-muted, #666);
      }

      .plugin-card-actions {
        display: flex;
        gap: 8px;
      }

      .form-group {
        margin-bottom: 16px;
      }

      .form-group label {
        display: block;
        margin-bottom: 4px;
        font-weight: 500;
      }

      .form-group input,
      .form-group textarea,
      .form-group select {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid var(--border-color, #e0e0e0);
        border-radius: 4px;
        font-size: 14px;
        background: var(--input-bg, #ffffff);
        color: var(--text-color, #333);
      }

      .form-group textarea {
        resize: vertical;
        min-height: 80px;
      }

      .form-actions {
        display: flex;
        gap: 12px;
        margin-top: 24px;
      }

      .create-result {
        margin-top: 20px;
        padding: 12px;
        border-radius: 6px;
        display: none;
      }

      .create-result.success {
        background: #d4edda;
        border: 1px solid #c3e6cb;
        color: #155724;
        display: block;
      }

      .create-result.error {
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        color: #721c24;
        display: block;
      }

      .tool-section {
        margin-bottom: 32px;
        padding-bottom: 24px;
        border-bottom: 1px solid var(--border-color, #e0e0e0);
      }

      .tool-section:last-child {
        border-bottom: none;
      }

      .tool-section h4 {
        margin-top: 0;
        margin-bottom: 8px;
        color: var(--text-color, #333);
      }

      .validation-result {
        margin-top: 12px;
        padding: 12px;
        border-radius: 6px;
        display: none;
      }

      .validation-result.valid {
        background: #d4edda;
        border: 1px solid #c3e6cb;
        color: #155724;
        display: block;
      }

      .validation-result.invalid {
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        color: #721c24;
        display: block;
      }

      .plugin-console {
        border: 1px solid var(--border-color, #e0e0e0);
        border-radius: 6px;
        background: #1e1e1e;
        color: #ffffff;
        height: 200px;
        display: flex;
        flex-direction: column;
      }

      .console-output {
        flex: 1;
        padding: 12px;
        font-family: 'Consolas', 'Monaco', monospace;
        font-size: 12px;
        overflow-y: auto;
        white-space: pre-wrap;
      }

      .console-controls {
        display: flex;
        gap: 8px;
        padding: 8px 12px;
        border-top: 1px solid #333;
        background: #2d2d2d;
      }

      .plugin-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
      }

      .stat-item {
        display: flex;
        justify-content: space-between;
        padding: 12px;
        background: var(--card-bg, #f8f9fa);
        border-radius: 6px;
        border: 1px solid var(--border-color, #e0e0e0);
      }

      .stat-label {
        font-weight: 500;
      }

      .stat-value {
        font-weight: 600;
        color: var(--primary-color, #007bff);
      }

      .loading-message {
        text-align: center;
        padding: 40px 20px;
        color: var(--text-color-muted, #666);
      }

      @media (max-width: 768px) {
        .plugin-manager-modal {
          width: 95vw;
          height: 90vh;
        }

        .plugin-manager-tabs {
          flex-direction: column;
        }

        .plugin-actions {
          flex-direction: column;
        }

        .plugin-card-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }
      }
    `;

    document.head.appendChild(styles);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Close button
    const closeBtn = document.getElementById('plugin-close-btn');
    closeBtn?.addEventListener('click', () => this.hide());

    // Overlay click to close
    const overlay = document.getElementById('plugin-overlay');
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) this.hide();
    });

    // Tab switching
    document.querySelectorAll('.plugin-tab').forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });

    // Plugin actions
    document.getElementById('refresh-plugins-btn')?.addEventListener('click', () => this.loadPluginsList());
    document.getElementById('open-plugins-folder-btn')?.addEventListener('click', () => this.openPluginsFolder());

    // Create plugin form
    document.getElementById('create-plugin-form')?.addEventListener('submit', (e) => this.handleCreatePlugin(e));
    document.getElementById('clear-form-btn')?.addEventListener('click', () => this.clearCreateForm());

    // Developer tools
    document.getElementById('validate-plugin-btn')?.addEventListener('click', () => this.validateSelectedPlugin());
    document.getElementById('clear-console-btn')?.addEventListener('click', () => this.clearConsole());
    document.getElementById('export-logs-btn')?.addEventListener('click', () => this.exportLogs());

    // Listen for plugin events
    if (window.electronAPI) {
      // This would be implemented to listen for plugin events from the main process
    }
  }

  /**
   * Show the plugin manager
   */
  show() {
    if (!this.initialized) {
      this.initialize();
    }
    
    this.container?.classList.remove('hidden');
    this.loadPluginsList();
    this.updateDeveloperStats();
  }

  /**
   * Hide the plugin manager
   */
  hide() {
    this.container?.classList.add('hidden');
  }

  /**
   * Switch between tabs
   */
  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.plugin-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Update tab content
    document.querySelectorAll('.plugin-tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `${tabName}-tab`);
    });

    // Load tab-specific content
    if (tabName === 'developer') {
      this.updateDeveloperTab();
    }
  }

  /**
   * Load plugins list
   */
  async loadPluginsList() {
    const listContainer = document.getElementById('plugins-list');
    if (!listContainer) return;

    try {
      listContainer.innerHTML = '<div class="loading-message">Loading plugins...</div>';

      // Get plugins from main process
      let plugins = [];
      if (window.electronAPI && window.electronAPI.invoke) {
        plugins = await window.electronAPI.invoke('plugin:list');
      } else {
        // Fallback for testing
        plugins = [
          {
            id: 'example-plugin',
            name: 'Example Plugin',
            version: '1.0.0',
            description: 'An example plugin to demonstrate the plugin system',
            author: 'MIC Browser Ultimate',
            enabled: true
          }
        ];
      }

      this.plugins = plugins;
      this.renderPluginsList(plugins);
    } catch (error) {
      console.error('Error loading plugins:', error);
      listContainer.innerHTML = '<div class="loading-message">❌ Error loading plugins</div>';
    }
  }

  /**
   * Render plugins list
   */
  renderPluginsList(plugins) {
    const listContainer = document.getElementById('plugins-list');
    if (!listContainer) return;

    if (plugins.length === 0) {
      listContainer.innerHTML = `
        <div class="loading-message">
          <p>No plugins installed yet.</p>
          <p>Switch to the "Create Plugin" tab to create your first plugin!</p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = plugins.map(plugin => `
      <div class="plugin-card" data-plugin-id="${plugin.id}">
        <div class="plugin-card-header">
          <h3 class="plugin-card-title">${plugin.name}</h3>
          <span class="plugin-card-status plugin-status-${plugin.enabled ? 'enabled' : 'disabled'}">
            ${plugin.enabled ? '✅ Enabled' : '❌ Disabled'}
          </span>
        </div>
        
        <div class="plugin-card-meta">
          <span>📦 v${plugin.version}</span>
          <span>👤 ${plugin.author}</span>
          <span>🆔 ${plugin.id}</span>
        </div>
        
        <div class="plugin-card-description">${plugin.description}</div>
        
        <div class="plugin-card-actions">
          ${plugin.enabled ? 
            `<button class="plugin-btn plugin-btn-secondary" onclick="pluginManagerUI.disablePlugin('${plugin.id}')">
              ⏸️ Disable
            </button>` :
            `<button class="plugin-btn plugin-btn-primary" onclick="pluginManagerUI.enablePlugin('${plugin.id}')">
              ▶️ Enable
            </button>`
          }
          <button class="plugin-btn plugin-btn-secondary" onclick="pluginManagerUI.showPluginInfo('${plugin.id}')">
            ℹ️ Info
          </button>
          <button class="plugin-btn plugin-btn-secondary" onclick="pluginManagerUI.unloadPlugin('${plugin.id}')">
            🗑️ Unload
          </button>
        </div>
      </div>
    `).join('');
  }

  /**
   * Plugin action methods
   */
  async enablePlugin(pluginId) {
    try {
      if (window.electronAPI && window.electronAPI.invoke) {
        await window.electronAPI.invoke('plugin:enable', pluginId);
      }
      this.logMessage(`Plugin ${pluginId} enabled`);
      await this.loadPluginsList();
    } catch (error) {
      this.logMessage(`Error enabling plugin ${pluginId}: ${error.message}`, 'error');
    }
  }

  async disablePlugin(pluginId) {
    try {
      if (window.electronAPI && window.electronAPI.invoke) {
        await window.electronAPI.invoke('plugin:disable', pluginId);
      }
      this.logMessage(`Plugin ${pluginId} disabled`);
      await this.loadPluginsList();
    } catch (error) {
      this.logMessage(`Error disabling plugin ${pluginId}: ${error.message}`, 'error');
    }
  }

  async unloadPlugin(pluginId) {
    if (!confirm(`Are you sure you want to unload plugin "${pluginId}"?`)) return;

    try {
      if (window.electronAPI && window.electronAPI.invoke) {
        await window.electronAPI.invoke('plugin:unload', pluginId);
      }
      this.logMessage(`Plugin ${pluginId} unloaded`);
      await this.loadPluginsList();
    } catch (error) {
      this.logMessage(`Error unloading plugin ${pluginId}: ${error.message}`, 'error');
    }
  }

  async showPluginInfo(pluginId) {
    try {
      let info = null;
      if (window.electronAPI && window.electronAPI.invoke) {
        info = await window.electronAPI.invoke('plugin:get-info', pluginId);
      }
      
      const plugin = this.plugins.find(p => p.id === pluginId);
      const displayInfo = info || plugin;
      
      if (displayInfo) {
        alert(`Plugin Information:

Name: ${displayInfo.name}
ID: ${displayInfo.id}
Version: ${displayInfo.version}
Author: ${displayInfo.author}
Description: ${displayInfo.description}
API Version: ${displayInfo.apiVersion || 'Unknown'}
Permissions: ${displayInfo.permissions ? displayInfo.permissions.join(', ') : 'Unknown'}`);
      }
    } catch (error) {
      this.logMessage(`Error getting plugin info for ${pluginId}: ${error.message}`, 'error');
    }
  }

  /**
   * Handle create plugin form submission
   */
  async handleCreatePlugin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const pluginData = {
      id: formData.get('id'),
      name: formData.get('name'),
      description: formData.get('description') || `A new plugin for MIC Browser Ultimate`,
      author: formData.get('author') || 'Plugin Developer',
      template: formData.get('template')
    };

    const resultDiv = document.getElementById('create-result');
    
    try {
      // Simulate plugin creation (would call main process)
      this.logMessage(`Creating plugin: ${pluginData.name}...`);
      
      // In real implementation, this would call the main process
      // await window.electronAPI.invoke('plugin:create', pluginData);
      
      resultDiv.className = 'create-result success';
      resultDiv.textContent = `✅ Plugin "${pluginData.name}" created successfully! Switch to the "Installed Plugins" tab to see it.`;
      
      // Clear form
      e.target.reset();
      
      // Refresh plugins list
      setTimeout(() => this.loadPluginsList(), 1000);
      
    } catch (error) {
      resultDiv.className = 'create-result error';
      resultDiv.textContent = `❌ Error creating plugin: ${error.message}`;
      this.logMessage(`Error creating plugin: ${error.message}`, 'error');
    }
  }

  /**
   * Clear the create plugin form
   */
  clearCreateForm() {
    const form = document.getElementById('create-plugin-form');
    const resultDiv = document.getElementById('create-result');
    
    form?.reset();
    resultDiv?.classList.remove('success', 'error');
  }

  /**
   * Update developer tab content
   */
  async updateDeveloperTab() {
    // Update validation select
    const select = document.getElementById('validate-plugin-select');
    if (select) {
      select.innerHTML = '<option value="">Select a plugin to validate...</option>' +
        this.plugins.map(plugin => 
          `<option value="${plugin.id}">${plugin.name} (${plugin.id})</option>`
        ).join('');
    }

    this.updateDeveloperStats();
  }

  /**
   * Update developer statistics
   */
  updateDeveloperStats() {
    const totalElement = document.getElementById('total-plugins');
    const enabledElement = document.getElementById('enabled-plugins');
    const directoryElement = document.getElementById('plugins-directory');

    if (totalElement) totalElement.textContent = this.plugins.length;
    if (enabledElement) enabledElement.textContent = this.plugins.filter(p => p.enabled).length;
    if (directoryElement) directoryElement.textContent = 'Loading...'; // Would get from main process
  }

  /**
   * Validate selected plugin
   */
  async validateSelectedPlugin() {
    const select = document.getElementById('validate-plugin-select');
    const resultDiv = document.getElementById('validation-result');
    
    if (!select || !resultDiv) return;
    
    const pluginId = select.value;
    if (!pluginId) {
      alert('Please select a plugin to validate');
      return;
    }

    try {
      // In real implementation, this would call the main process
      // const result = await window.electronAPI.invoke('plugin:validate', pluginId);
      
      // Simulate validation result
      const result = {
        valid: true,
        errors: [],
        warnings: ['Example warning: Consider adding more documentation']
      };
      
      resultDiv.className = `validation-result ${result.valid ? 'valid' : 'invalid'}`;
      resultDiv.innerHTML = `
        <h4>${result.valid ? '✅ Validation Passed' : '❌ Validation Failed'}</h4>
        ${result.errors.length > 0 ? `
          <div><strong>Errors:</strong></div>
          <ul>${result.errors.map(error => `<li>${error}</li>`).join('')}</ul>
        ` : ''}
        ${result.warnings.length > 0 ? `
          <div><strong>Warnings:</strong></div>
          <ul>${result.warnings.map(warning => `<li>${warning}</li>`).join('')}</ul>
        ` : ''}
        ${result.valid && result.errors.length === 0 && result.warnings.length === 0 ? 
          '<p>Plugin structure is valid with no issues found.</p>' : ''}
      `;
      
    } catch (error) {
      resultDiv.className = 'validation-result invalid';
      resultDiv.innerHTML = `<h4>❌ Validation Error</h4><p>${error.message}</p>`;
    }
  }

  /**
   * Console management methods
   */
  logMessage(message, level = 'info') {
    const output = document.getElementById('console-output');
    if (!output) return;

    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    
    output.textContent += logEntry;
    output.scrollTop = output.scrollHeight;
  }

  clearConsole() {
    const output = document.getElementById('console-output');
    if (output) output.textContent = '';
  }

  exportLogs() {
    const output = document.getElementById('console-output');
    if (!output || !output.textContent.trim()) {
      alert('No logs to export');
      return;
    }

    const logs = output.textContent;
    const blob = new Blob([logs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `plugin-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Open plugins folder
   */
  async openPluginsFolder() {
    try {
      if (window.electronAPI && window.electronAPI.invoke) {
        await window.electronAPI.invoke('system:open-plugins-folder');
      } else {
        alert('This feature requires the Electron main process');
      }
    } catch (error) {
      this.logMessage(`Error opening plugins folder: ${error.message}`, 'error');
    }
  }
}

// Create global instance
window.pluginManagerUI = new PluginManagerUI();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PluginManagerUI;
}