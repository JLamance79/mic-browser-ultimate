const fs = require('fs');
const path = require('path');

class PluginDeveloper {
  constructor(pluginManager) {
    this.pluginManager = pluginManager;
    this.templates = new Map();
    this.setupTemplates();
  }

  /**
   * Setup plugin templates
   */
  setupTemplates() {
    // Basic plugin template
    this.templates.set('basic', {
      manifest: {
        id: '{{id}}',
        name: '{{name}}',
        version: '1.0.0',
        description: '{{description}}',
        author: '{{author}}',
        apiVersion: '1.0.0',
        permissions: ['storage', 'ui']
      },
      index: `class {{className}} {
  constructor(api) {
    this.api = api;
    console.log('🔌 {{name}} initialized');
  }

  async initialize() {
    console.log('🚀 {{name}} starting up...');
    
    // Add your initialization code here
    
    console.log('✅ {{name}} initialized successfully');
  }

  async cleanup() {
    console.log('🧹 {{name}} cleaning up...');
    // Perform cleanup tasks here
  }
}

module.exports = {{className}};`
    });

    // UI plugin template
    this.templates.set('ui', {
      manifest: {
        id: '{{id}}',
        name: '{{name}}',
        version: '1.0.0',
        description: '{{description}}',
        author: '{{author}}',
        apiVersion: '1.0.0',
        permissions: ['storage', 'ui', 'hooks']
      },
      index: `class {{className}} {
  constructor(api) {
    this.api = api;
    this.menuItems = [];
    console.log('🔌 {{name}} initialized');
  }

  async initialize() {
    console.log('🚀 {{name}} starting up...');
    
    // Add menu items
    this.addMenuItems();
    
    // Add toolbar button
    this.addToolbarButton();
    
    console.log('✅ {{name}} initialized successfully');
  }

  addMenuItems() {
    const menuItem = {
      id: '{{id}}-main-action',
      label: '{{name}} Action',
      click: () => {
        this.api.ui.showNotification({
          title: '{{name}}',
          message: 'Action executed successfully!'
        });
      }
    };
    
    this.api.ui.addMenuItem(menuItem);
    this.menuItems.push(menuItem.id);
  }

  addToolbarButton() {
    this.api.ui.addToolbarButton({
      id: '{{id}}-toolbar-btn',
      label: '{{name}}',
      icon: '🔧',
      click: () => {
        this.performMainAction();
      }
    });
  }

  performMainAction() {
    // Implement your main plugin functionality here
    this.api.ui.showNotification({
      title: '{{name}}',
      message: 'Main action performed!'
    });
  }

  async cleanup() {
    console.log('🧹 {{name}} cleaning up...');
    
    // Remove menu items
    this.menuItems.forEach(menuId => {
      this.api.ui.removeMenuItem(menuId);
    });
  }
}

module.exports = {{className}};`
    });

    // Hook-based plugin template
    this.templates.set('hooks', {
      manifest: {
        id: '{{id}}',
        name: '{{name}}',
        version: '1.0.0',
        description: '{{description}}',
        author: '{{author}}',
        apiVersion: '1.0.0',
        permissions: ['storage', 'hooks']
      },
      index: `class {{className}} {
  constructor(api) {
    this.api = api;
    this.hooks = [];
    console.log('🔌 {{name}} initialized');
  }

  async initialize() {
    console.log('🚀 {{name}} starting up...');
    
    // Register hooks
    this.registerHooks();
    
    console.log('✅ {{name}} initialized successfully');
  }

  registerHooks() {
    // Hook for page navigation
    const pageLoadHook = this.onPageLoaded.bind(this);
    this.api.addHook('page-loaded', pageLoadHook);
    this.hooks.push({ name: 'page-loaded', callback: pageLoadHook });

    // Hook for tab changes
    const tabChangeHook = this.onTabChanged.bind(this);
    this.api.addHook('tab-changed', tabChangeHook);
    this.hooks.push({ name: 'tab-changed', callback: tabChangeHook });

    // Hook for window events
    const windowEventHook = this.onWindowEvent.bind(this);
    this.api.addHook('window-event', windowEventHook);
    this.hooks.push({ name: 'window-event', callback: windowEventHook });
  }

  onPageLoaded(url, title) {
    console.log('📄 {{name}}: Page loaded -', url);
    
    // Track page visits
    const visits = this.api.storage.get('pageVisits') || {};
    visits[url] = (visits[url] || 0) + 1;
    this.api.storage.set('pageVisits', visits);
  }

  onTabChanged(tabInfo) {
    console.log('📑 {{name}}: Tab changed -', tabInfo.title);
    
    // Update current tab info
    this.api.storage.set('currentTab', tabInfo);
  }

  onWindowEvent(eventType, eventData) {
    console.log('🪟 {{name}}: Window event -', eventType);
    
    // Log window events
    const events = this.api.storage.get('windowEvents') || [];
    events.push({ type: eventType, data: eventData, timestamp: Date.now() });
    
    // Keep only last 100 events
    if (events.length > 100) {
      events.splice(0, events.length - 100);
    }
    
    this.api.storage.set('windowEvents', events);
  }

  async cleanup() {
    console.log('🧹 {{name}} cleaning up...');
    
    // Remove all hooks
    this.hooks.forEach(hook => {
      this.api.removeHook(hook.name, hook.callback);
    });
  }
}

module.exports = {{className}};`
    });
  }

  /**
   * Create a new plugin from template
   */
  async createPlugin(options) {
    const {
      id,
      name,
      description = 'A new plugin for MIC Browser Ultimate',
      author = 'Plugin Developer',
      template = 'basic'
    } = options;

    if (!id || !name) {
      throw new Error('Plugin id and name are required');
    }

    if (!this.templates.has(template)) {
      throw new Error(`Template '${template}' not found. Available templates: ${Array.from(this.templates.keys()).join(', ')}`);
    }

    const pluginDir = path.join(this.pluginManager.pluginsDir, id);

    // Check if plugin already exists
    if (fs.existsSync(pluginDir)) {
      throw new Error(`Plugin directory already exists: ${pluginDir}`);
    }

    try {
      // Create plugin directory
      fs.mkdirSync(pluginDir, { recursive: true });

      // Get template
      const templateData = this.templates.get(template);

      // Create class name from plugin name
      const className = name.replace(/[^a-zA-Z0-9]/g, '') + 'Plugin';

      // Replace template variables
      const manifestContent = this.replaceTemplateVars(JSON.stringify(templateData.manifest, null, 2), {
        id, name, description, author, className
      });

      const indexContent = this.replaceTemplateVars(templateData.index, {
        id, name, description, author, className
      });

      // Write files
      fs.writeFileSync(path.join(pluginDir, 'manifest.json'), manifestContent);
      fs.writeFileSync(path.join(pluginDir, 'index.js'), indexContent);

      // Create README
      const readmeContent = this.createReadme({ id, name, description, author, template });
      fs.writeFileSync(path.join(pluginDir, 'README.md'), readmeContent);

      console.log(`✅ Created plugin '${name}' at ${pluginDir}`);
      return pluginDir;
    } catch (error) {
      // Cleanup on error
      if (fs.existsSync(pluginDir)) {
        fs.rmSync(pluginDir, { recursive: true, force: true });
      }
      throw error;
    }
  }

  /**
   * Replace template variables
   */
  replaceTemplateVars(content, vars) {
    let result = content;
    for (const [key, value] of Object.entries(vars)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return result;
  }

  /**
   * Create README content for plugin
   */
  createReadme({ id, name, description, author, template }) {
    return `# ${name}

${description}

**Author:** ${author}  
**Template:** ${template}  
**Plugin ID:** ${id}

## Installation

This plugin is installed in the MIC Browser Ultimate plugins directory.

## Features

- Built using the ${template} template
- Follows MIC Browser Ultimate plugin API standards
- Includes proper error handling and cleanup

## Development

### Plugin Structure
\`\`\`
${id}/
├── manifest.json    # Plugin metadata and configuration
├── index.js        # Main plugin code
└── README.md       # This file
\`\`\`

### API Reference

The plugin has access to the following API methods:

#### Storage API
- \`api.storage.get(key)\` - Get stored data
- \`api.storage.set(key, value)\` - Store data
- \`api.storage.delete(key)\` - Delete stored data
- \`api.storage.clear()\` - Clear all stored data

#### UI API
- \`api.ui.addMenuItem(menuItem)\` - Add menu item
- \`api.ui.removeMenuItem(menuId)\` - Remove menu item
- \`api.ui.showNotification(options)\` - Show notification
- \`api.ui.addToolbarButton(button)\` - Add toolbar button

#### Hook API
- \`api.addHook(hookName, callback)\` - Register hook callback
- \`api.removeHook(hookName, callback)\` - Remove hook callback
- \`api.triggerHook(hookName, ...args)\` - Trigger hook (if allowed)

#### System API
- \`api.system.getAppVersion()\` - Get app version
- \`api.system.getPluginDir()\` - Get plugin directory path
- \`api.system.log(level, message)\` - Log message

#### Events API
- \`api.events.on(event, callback)\` - Listen for plugin events
- \`api.events.emit(event, ...args)\` - Emit plugin event
- \`api.events.off(event, callback)\` - Remove event listener

## License

This plugin is part of the MIC Browser Ultimate ecosystem.
`;
  }

  /**
   * Validate plugin structure
   */
  validatePlugin(pluginDir) {
    const errors = [];
    const warnings = [];

    try {
      // Check if directory exists
      if (!fs.existsSync(pluginDir)) {
        errors.push('Plugin directory does not exist');
        return { valid: false, errors, warnings };
      }

      // Check manifest.json
      const manifestPath = path.join(pluginDir, 'manifest.json');
      if (!fs.existsSync(manifestPath)) {
        errors.push('manifest.json is missing');
      } else {
        try {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
          
          // Check required fields
          const required = ['id', 'name', 'version', 'description', 'author'];
          const missing = required.filter(field => !manifest[field]);
          if (missing.length > 0) {
            errors.push(`manifest.json missing required fields: ${missing.join(', ')}`);
          }

          // Check API version
          if (!manifest.apiVersion) {
            warnings.push('manifest.json missing apiVersion field');
          } else if (manifest.apiVersion !== this.pluginManager.pluginAPIVersion) {
            warnings.push(`API version mismatch: plugin uses ${manifest.apiVersion}, current is ${this.pluginManager.pluginAPIVersion}`);
          }
        } catch (error) {
          errors.push(`manifest.json is not valid JSON: ${error.message}`);
        }
      }

      // Check index.js
      const indexPath = path.join(pluginDir, 'index.js');
      if (!fs.existsSync(indexPath)) {
        errors.push('index.js is missing');
      } else {
        try {
          // Basic syntax check
          const code = fs.readFileSync(indexPath, 'utf8');
          if (!code.includes('module.exports')) {
            warnings.push('index.js should export the plugin class or object');
          }
        } catch (error) {
          errors.push(`Error reading index.js: ${error.message}`);
        }
      }

      // Check for README
      const readmePath = path.join(pluginDir, 'README.md');
      if (!fs.existsSync(readmePath)) {
        warnings.push('README.md is missing (recommended)');
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Validation error: ${error.message}`],
        warnings
      };
    }
  }

  /**
   * Get available templates
   */
  getTemplates() {
    return Array.from(this.templates.keys()).map(key => ({
      name: key,
      description: this.getTemplateDescription(key)
    }));
  }

  getTemplateDescription(templateName) {
    const descriptions = {
      basic: 'Basic plugin template with minimal functionality',
      ui: 'UI-focused plugin template with menu items and toolbar buttons',
      hooks: 'Hook-based plugin template for intercepting browser events'
    };
    return descriptions[templateName] || 'Unknown template';
  }

  /**
   * Package plugin for distribution
   */
  async packagePlugin(pluginDir, outputPath) {
    const validation = this.validatePlugin(pluginDir);
    if (!validation.valid) {
      throw new Error(`Cannot package invalid plugin: ${validation.errors.join(', ')}`);
    }

    // For now, we'll create a simple zip-like structure
    // In a real implementation, you might use a proper archiving library
    const pluginName = path.basename(pluginDir);
    const packagePath = outputPath || path.join(path.dirname(pluginDir), `${pluginName}.plugin`);

    try {
      // For simplicity, we'll copy to a .plugin directory
      // In production, you'd want to create an actual archive
      if (fs.existsSync(packagePath)) {
        fs.rmSync(packagePath, { recursive: true, force: true });
      }

      this.copyDirectory(pluginDir, packagePath);
      
      console.log(`📦 Packaged plugin to: ${packagePath}`);
      return packagePath;
    } catch (error) {
      throw new Error(`Failed to package plugin: ${error.message}`);
    }
  }

  /**
   * Copy directory recursively
   */
  copyDirectory(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    
    const items = fs.readdirSync(src);
    for (const item of items) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      
      if (fs.statSync(srcPath).isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

module.exports = PluginDeveloper;