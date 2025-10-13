const fs = require('fs');
const path = require('path');
const { app, ipcMain } = require('electron');
const EventEmitter = require('events');

class PluginManager extends EventEmitter {
  constructor(pluginsDir = null) {
    super();
    this.plugins = new Map();
    this.hooks = new Map();
    
    // Allow custom plugins directory for testing
    if (pluginsDir) {
      this.pluginsDir = pluginsDir;
    } else if (typeof app !== 'undefined' && app.getPath) {
      this.pluginsDir = path.join(app.getPath('userData'), 'plugins');
    } else {
      // Fallback for testing without Electron
      this.pluginsDir = path.join(process.cwd(), 'plugins');
    }
    
    this.pluginAPIVersion = '1.0.0';
    this.initialized = false;
  }

  /**
   * Initialize the plugin system
   */
  async initialize() {
    try {
      console.log('🔌 Initializing Plugin System...');
      
      // Ensure plugins directory exists
      if (!fs.existsSync(this.pluginsDir)) {
        fs.mkdirSync(this.pluginsDir, { recursive: true });
        console.log(`📁 Created plugins directory: ${this.pluginsDir}`);
      }

      // Create example plugin if no plugins exist
      await this.createExamplePlugin();

      // Load all plugins
      await this.loadPlugins();

      // Set up IPC handlers for plugin management (only if ipcMain is available)
      if (typeof ipcMain !== 'undefined') {
        this.setupIPCHandlers();
      }

      this.initialized = true;
      console.log('✅ Plugin System initialized successfully');
      this.emit('initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Plugin System:', error);
      throw error;
    }
  }

  /**
   * Load all plugins from the plugins directory
   */
  async loadPlugins() {
    try {
      const pluginDirs = fs.readdirSync(this.pluginsDir).filter(item => {
        const itemPath = path.join(this.pluginsDir, item);
        return fs.statSync(itemPath).isDirectory();
      });

      console.log(`🔍 Found ${pluginDirs.length} potential plugin directories`);

      for (const pluginDir of pluginDirs) {
        try {
          await this.loadPlugin(pluginDir);
        } catch (error) {
          console.error(`❌ Failed to load plugin ${pluginDir}:`, error);
        }
      }

      console.log(`✅ Successfully loaded ${this.plugins.size} plugins`);
    } catch (error) {
      console.error('❌ Error loading plugins:', error);
    }
  }

  /**
   * Load a single plugin
   */
  async loadPlugin(pluginDir) {
    const pluginPath = path.join(this.pluginsDir, pluginDir);
    const manifestPath = path.join(pluginPath, 'manifest.json');
    const indexPath = path.join(pluginPath, 'index.js');

    // Check if manifest exists
    if (!fs.existsSync(manifestPath)) {
      throw new Error(`Plugin ${pluginDir}: manifest.json not found`);
    }

    // Check if index.js exists
    if (!fs.existsSync(indexPath)) {
      throw new Error(`Plugin ${pluginDir}: index.js not found`);
    }

    // Load and validate manifest
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    this.validateManifest(manifest);

    // Check if plugin is already loaded
    if (this.plugins.has(manifest.id)) {
      console.log(`⚠️ Plugin ${manifest.id} already loaded, skipping`);
      return;
    }

    // Load plugin code
    const pluginCode = require(indexPath);
    
    // Create plugin context
    const pluginContext = {
      id: manifest.id,
      manifest,
      path: pluginPath,
      api: this.createPluginAPI(manifest.id),
      enabled: true,
      instance: null
    };

    try {
      // Initialize plugin
      if (typeof pluginCode === 'function') {
        pluginContext.instance = new pluginCode(pluginContext.api);
      } else if (pluginCode && typeof pluginCode.initialize === 'function') {
        pluginContext.instance = pluginCode;
        await pluginCode.initialize(pluginContext.api);
      } else {
        throw new Error('Plugin must export a constructor function or an object with initialize method');
      }

      // Store plugin
      this.plugins.set(manifest.id, pluginContext);
      
      console.log(`✅ Loaded plugin: ${manifest.name} v${manifest.version}`);
      this.emit('plugin-loaded', pluginContext);

    } catch (error) {
      throw new Error(`Failed to initialize plugin ${manifest.id}: ${error.message}`);
    }
  }

  /**
   * Validate plugin manifest
   */
  validateManifest(manifest) {
    const required = ['id', 'name', 'version', 'description', 'author'];
    const missing = required.filter(field => !manifest[field]);
    
    if (missing.length > 0) {
      throw new Error(`Manifest missing required fields: ${missing.join(', ')}`);
    }

    if (manifest.apiVersion && manifest.apiVersion !== this.pluginAPIVersion) {
      console.warn(`⚠️ Plugin ${manifest.id} uses API version ${manifest.apiVersion}, current is ${this.pluginAPIVersion}`);
    }
  }

  /**
   * Create plugin API for a specific plugin
   */
  createPluginAPI(pluginId) {
    return {
      // Plugin info
      getPluginId: () => pluginId,
      
      // Hook system
      addHook: (hookName, callback) => this.addHook(pluginId, hookName, callback),
      removeHook: (hookName, callback) => this.removeHook(pluginId, hookName, callback),
      triggerHook: (hookName, ...args) => this.triggerHook(hookName, ...args),
      
      // Storage API
      storage: {
        get: (key) => this.getPluginData(pluginId, key),
        set: (key, value) => this.setPluginData(pluginId, key, value),
        delete: (key) => this.deletePluginData(pluginId, key),
        clear: () => this.clearPluginData(pluginId)
      },
      
      // UI API
      ui: {
        addMenuItem: (menuItem) => this.addPluginMenuItem(pluginId, menuItem),
        removeMenuItem: (menuId) => this.removePluginMenuItem(pluginId, menuId),
        showNotification: (options) => this.showPluginNotification(pluginId, options),
        addToolbarButton: (button) => this.addPluginToolbarButton(pluginId, button)
      },
      
      // System API
      system: {
        getAppVersion: () => typeof app !== 'undefined' && app.getVersion ? app.getVersion() : '1.0.0',
        getPluginDir: () => path.join(this.pluginsDir, pluginId),
        log: (level, message) => this.logPluginMessage(pluginId, level, message)
      },
      
      // Events
      events: {
        on: (event, callback) => this.on(`plugin:${pluginId}:${event}`, callback),
        emit: (event, ...args) => this.emit(`plugin:${pluginId}:${event}`, ...args),
        off: (event, callback) => this.off(`plugin:${pluginId}:${event}`, callback)
      }
    };
  }

  /**
   * Hook system methods
   */
  addHook(pluginId, hookName, callback) {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, new Map());
    }
    
    const hookMap = this.hooks.get(hookName);
    if (!hookMap.has(pluginId)) {
      hookMap.set(pluginId, []);
    }
    
    hookMap.get(pluginId).push(callback);
    console.log(`🪝 Plugin ${pluginId} added hook for ${hookName}`);
  }

  removeHook(pluginId, hookName, callback) {
    if (!this.hooks.has(hookName)) return;
    
    const hookMap = this.hooks.get(hookName);
    if (!hookMap.has(pluginId)) return;
    
    const callbacks = hookMap.get(pluginId);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
      if (callbacks.length === 0) {
        hookMap.delete(pluginId);
      }
    }
  }

  async triggerHook(hookName, ...args) {
    if (!this.hooks.has(hookName)) return [];
    
    const results = [];
    const hookMap = this.hooks.get(hookName);
    
    for (const [pluginId, callbacks] of hookMap) {
      const plugin = this.plugins.get(pluginId);
      if (!plugin || !plugin.enabled) continue;
      
      for (const callback of callbacks) {
        try {
          const result = await callback(...args);
          results.push({ pluginId, result });
        } catch (error) {
          console.error(`❌ Hook ${hookName} error in plugin ${pluginId}:`, error);
        }
      }
    }
    
    return results;
  }

  /**
   * Plugin data storage methods
   */
  getPluginData(pluginId, key) {
    const dataPath = path.join(this.pluginsDir, pluginId, 'data.json');
    try {
      if (!fs.existsSync(dataPath)) return undefined;
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      return key ? data[key] : data;
    } catch {
      return undefined;
    }
  }

  setPluginData(pluginId, key, value) {
    const dataPath = path.join(this.pluginsDir, pluginId, 'data.json');
    let data = {};
    
    try {
      if (fs.existsSync(dataPath)) {
        data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      }
    } catch {
      data = {};
    }
    
    data[key] = value;
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  }

  deletePluginData(pluginId, key) {
    const dataPath = path.join(this.pluginsDir, pluginId, 'data.json');
    try {
      if (!fs.existsSync(dataPath)) return;
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      delete data[key];
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error deleting plugin data:', error);
    }
  }

  clearPluginData(pluginId) {
    const dataPath = path.join(this.pluginsDir, pluginId, 'data.json');
    try {
      if (fs.existsSync(dataPath)) {
        fs.unlinkSync(dataPath);
      }
    } catch (error) {
      console.error('Error clearing plugin data:', error);
    }
  }

  /**
   * UI integration methods (to be implemented based on your UI framework)
   */
  addPluginMenuItem(pluginId, menuItem) {
    console.log(`📋 Plugin ${pluginId} added menu item:`, menuItem.label);
    this.emit('menu-item-added', { pluginId, menuItem });
  }

  removePluginMenuItem(pluginId, menuId) {
    console.log(`📋 Plugin ${pluginId} removed menu item:`, menuId);
    this.emit('menu-item-removed', { pluginId, menuId });
  }

  showPluginNotification(pluginId, options) {
    console.log(`🔔 Plugin ${pluginId} notification:`, options.message);
    this.emit('notification', { pluginId, options });
  }

  addPluginToolbarButton(pluginId, button) {
    console.log(`🔘 Plugin ${pluginId} added toolbar button:`, button.label);
    this.emit('toolbar-button-added', { pluginId, button });
  }

  /**
   * Utility methods
   */
  logPluginMessage(pluginId, level, message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] [Plugin:${pluginId}] ${message}`);
  }

  /**
   * Plugin management methods
   */
  async enablePlugin(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) throw new Error(`Plugin ${pluginId} not found`);
    
    plugin.enabled = true;
    console.log(`✅ Enabled plugin: ${pluginId}`);
    this.emit('plugin-enabled', plugin);
  }

  async disablePlugin(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) throw new Error(`Plugin ${pluginId} not found`);
    
    plugin.enabled = false;
    console.log(`❌ Disabled plugin: ${pluginId}`);
    this.emit('plugin-disabled', plugin);
  }

  async unloadPlugin(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return;

    // Call plugin cleanup if available
    if (plugin.instance && typeof plugin.instance.cleanup === 'function') {
      try {
        await plugin.instance.cleanup();
      } catch (error) {
        console.error(`Error during plugin cleanup for ${pluginId}:`, error);
      }
    }

    // Remove all hooks for this plugin
    for (const [hookName, hookMap] of this.hooks) {
      hookMap.delete(pluginId);
    }

    // Remove plugin
    this.plugins.delete(pluginId);
    console.log(`🗑️ Unloaded plugin: ${pluginId}`);
    this.emit('plugin-unloaded', { pluginId });
  }

  /**
   * Get plugin information
   */
  getPluginList() {
    return Array.from(this.plugins.values()).map(plugin => ({
      id: plugin.id,
      name: plugin.manifest.name,
      version: plugin.manifest.version,
      description: plugin.manifest.description,
      author: plugin.manifest.author,
      enabled: plugin.enabled
    }));
  }

  getPlugin(pluginId) {
    return this.plugins.get(pluginId);
  }

  /**
   * Setup IPC handlers for renderer process communication
   */
  setupIPCHandlers() {
    if (typeof ipcMain === 'undefined') {
      console.warn('IPC not available, skipping IPC handler setup');
      return;
    }
    
    ipcMain.handle('plugin:list', () => this.getPluginList());
    ipcMain.handle('plugin:enable', (event, pluginId) => this.enablePlugin(pluginId));
    ipcMain.handle('plugin:disable', (event, pluginId) => this.disablePlugin(pluginId));
    ipcMain.handle('plugin:unload', (event, pluginId) => this.unloadPlugin(pluginId));
    ipcMain.handle('plugin:get-info', (event, pluginId) => {
      const plugin = this.getPlugin(pluginId);
      return plugin ? plugin.manifest : null;
    });
  }

  /**
   * Create example plugin for demonstration
   */
  async createExamplePlugin() {
    const examplePluginDir = path.join(this.pluginsDir, 'example-plugin');
    
    if (fs.existsSync(examplePluginDir)) return;

    try {
      fs.mkdirSync(examplePluginDir, { recursive: true });

      // Create manifest.json
      const manifest = {
        id: 'example-plugin',
        name: 'Example Plugin',
        version: '1.0.0',
        description: 'An example plugin to demonstrate the plugin system',
        author: 'MIC Browser Ultimate',
        apiVersion: this.pluginAPIVersion,
        permissions: ['storage', 'ui', 'hooks']
      };

      fs.writeFileSync(
        path.join(examplePluginDir, 'manifest.json'),
        JSON.stringify(manifest, null, 2)
      );

      // Create index.js
      const pluginCode = `
class ExamplePlugin {
  constructor(api) {
    this.api = api;
    console.log('🔌 Example Plugin initialized');
  }

  async initialize() {
    console.log('🚀 Example Plugin starting up...');
    
    // Add a hook for page navigation
    this.api.addHook('page-loaded', this.onPageLoaded.bind(this));
    
    // Add a menu item
    this.api.ui.addMenuItem({
      id: 'example-menu-item',
      label: 'Example Plugin Action',
      click: () => {
        this.api.ui.showNotification({
          title: 'Example Plugin',
          message: 'Hello from the example plugin!'
        });
      }
    });

    // Store some data
    this.api.storage.set('initialized', new Date().toISOString());
    
    console.log('✅ Example Plugin initialized successfully');
  }

  onPageLoaded(url) {
    console.log('📄 Example Plugin: Page loaded:', url);
    
    // Count page loads
    const count = this.api.storage.get('pageLoads') || 0;
    this.api.storage.set('pageLoads', count + 1);
  }

  async cleanup() {
    console.log('🧹 Example Plugin cleaning up...');
    // Perform cleanup tasks here
  }
}

module.exports = ExamplePlugin;
`;

      fs.writeFileSync(path.join(examplePluginDir, 'index.js'), pluginCode.trim());
      
      console.log('📝 Created example plugin for demonstration');
    } catch (error) {
      console.error('❌ Failed to create example plugin:', error);
    }
  }
}

module.exports = PluginManager;