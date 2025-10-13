# MIC Browser Ultimate - Plugin System

## Overview

The MIC Browser Ultimate Plugin System is a comprehensive, extensible plugin architecture that allows developers to create custom extensions for the browser. The system provides a secure, standardized API for plugins to interact with the browser's functionality while maintaining isolation and security.

## Features

- ✨ **Easy Plugin Development**: Simple template-based plugin creation
- 🔒 **Secure Architecture**: Sandboxed plugin execution with controlled API access
- 🎛️ **Rich Plugin API**: Comprehensive API for storage, UI, hooks, and system integration
- 🔧 **Developer Tools**: Built-in validation, testing, and debugging tools
- 📦 **Plugin Packaging**: Easy plugin distribution and installation
- 🖥️ **Management UI**: User-friendly interface for managing plugins
- 🪝 **Hook System**: Event-driven architecture for browser integration

## Architecture

### Core Components

1. **PluginManager** (`PluginManager.js`)
   - Central plugin management and lifecycle control
   - Plugin loading, enabling, disabling, and unloading
   - Hook system for event-driven architecture
   - API provisioning and security

2. **PluginDeveloper** (`PluginDeveloper.js`)
   - Plugin development tools and utilities
   - Template-based plugin generation
   - Plugin validation and packaging
   - Developer assistance tools

3. **PluginManagerUI** (`PluginManagerUI.js`)
   - User interface for plugin management
   - Plugin creation wizard
   - Developer tools and console
   - Plugin statistics and monitoring

## Plugin Development

### Quick Start

1. **Open Plugin Manager**
   - Click the plugin button (🔌) in the settings panel
   - Navigate to the "Create Plugin" tab

2. **Create a New Plugin**
   ```javascript
   // Example plugin data
   {
     id: 'my-awesome-plugin',
     name: 'My Awesome Plugin',
     description: 'Does awesome things',
     author: 'Your Name',
     template: 'basic' // or 'ui', 'hooks'
   }
   ```

3. **Plugin Structure**
   ```
   my-awesome-plugin/
   ├── manifest.json    # Plugin metadata
   ├── index.js        # Main plugin code
   ├── README.md       # Documentation
   └── data.json       # Plugin data (auto-created)
   ```

### Plugin Templates

#### Basic Plugin
Simple plugin template with minimal functionality:
```javascript
class MyPlugin {
  constructor(api) {
    this.api = api;
  }

  async initialize() {
    // Plugin initialization code
  }

  async cleanup() {
    // Plugin cleanup code
  }
}

module.exports = MyPlugin;
```

#### UI Plugin
Plugin with user interface elements:
```javascript
class MyUIPlugin {
  constructor(api) {
    this.api = api;
    this.menuItems = [];
  }

  async initialize() {
    // Add menu items
    this.api.ui.addMenuItem({
      id: 'my-action',
      label: 'My Action',
      click: () => this.performAction()
    });
    
    // Add toolbar button
    this.api.ui.addToolbarButton({
      id: 'my-button',
      label: 'My Button',
      icon: '🔧',
      click: () => this.performAction()
    });
  }

  performAction() {
    this.api.ui.showNotification({
      title: 'My Plugin',
      message: 'Action performed!'
    });
  }
}

module.exports = MyUIPlugin;
```

#### Hook-based Plugin
Plugin that responds to browser events:
```javascript
class MyHookPlugin {
  constructor(api) {
    this.api = api;
    this.hooks = [];
  }

  async initialize() {
    // Register for page load events
    const pageLoadHook = this.onPageLoaded.bind(this);
    this.api.addHook('page-loaded', pageLoadHook);
    this.hooks.push({ name: 'page-loaded', callback: pageLoadHook });
  }

  onPageLoaded(url, title) {
    console.log(`Page loaded: ${title} (${url})`);
    
    // Track page visits
    const visits = this.api.storage.get('pageVisits') || {};
    visits[url] = (visits[url] || 0) + 1;
    this.api.storage.set('pageVisits', visits);
  }
}

module.exports = MyHookPlugin;
```

## Plugin API Reference

### Storage API
```javascript
// Get stored data
const value = api.storage.get('key');

// Store data
api.storage.set('key', 'value');

// Delete data
api.storage.delete('key');

// Clear all plugin data
api.storage.clear();
```

### UI API
```javascript
// Add menu item
api.ui.addMenuItem({
  id: 'unique-menu-id',
  label: 'Menu Label',
  click: () => console.log('Clicked!')
});

// Remove menu item
api.ui.removeMenuItem('unique-menu-id');

// Show notification
api.ui.showNotification({
  title: 'Notification Title',
  message: 'Notification message'
});

// Add toolbar button
api.ui.addToolbarButton({
  id: 'unique-button-id',
  label: 'Button Label',
  icon: '🔧',
  click: () => console.log('Button clicked!')
});
```

### Hook API
```javascript
// Register hook callback
api.addHook('page-loaded', (url, title) => {
  console.log(`Page: ${title}`);
});

// Remove hook callback
api.removeHook('page-loaded', callback);

// Available hooks:
// - 'page-loaded': When a page finishes loading
// - 'page-changed': When URL changes in page
// - 'dom-ready': When DOM is ready
// - 'tab-changed': When active tab changes
// - 'window-event': Window focus/blur events
```

### System API
```javascript
// Get application version
const version = api.system.getAppVersion();

// Get plugin directory
const pluginDir = api.system.getPluginDir();

// Log messages
api.system.log('info', 'Plugin message');
api.system.log('error', 'Error message');
api.system.log('warn', 'Warning message');
```

### Events API
```javascript
// Listen for plugin events
api.events.on('custom-event', (data) => {
  console.log('Custom event:', data);
});

// Emit plugin events
api.events.emit('custom-event', { message: 'Hello!' });

// Remove event listener
api.events.off('custom-event', callback);
```

## Manifest Format

The `manifest.json` file contains plugin metadata:

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "Description of what the plugin does",
  "author": "Author Name",
  "apiVersion": "1.0.0",
  "permissions": [
    "storage",
    "ui",
    "hooks",
    "system"
  ],
  "homepage": "https://example.com/my-plugin",
  "repository": "https://github.com/user/my-plugin",
  "license": "MIT"
}
```

### Required Fields
- `id`: Unique plugin identifier (lowercase, hyphens allowed)
- `name`: Human-readable plugin name
- `version`: Plugin version (semantic versioning)
- `description`: Brief description of plugin functionality
- `author`: Plugin author name

### Optional Fields
- `apiVersion`: Required plugin API version
- `permissions`: Array of required permissions
- `homepage`: Plugin homepage URL
- `repository`: Source code repository URL
- `license`: Plugin license

## Plugin Lifecycle

### Loading Process
1. **Discovery**: Plugin manager scans plugins directory
2. **Validation**: Manifest and structure validation
3. **Loading**: Plugin code is loaded and instantiated
4. **Initialization**: Plugin `initialize()` method is called
5. **Registration**: Plugin is registered and becomes active

### Runtime
- Plugin receives API object for browser interaction
- Plugin can register hooks for browser events
- Plugin can store and retrieve persistent data
- Plugin can create UI elements and notifications

### Unloading
1. **Cleanup**: Plugin `cleanup()` method is called
2. **Deregistration**: Hooks and UI elements are removed
3. **Unloading**: Plugin is removed from memory

## Security Model

### Sandboxing
- Plugins run in controlled environment
- Limited access to browser internals
- API-based interaction only

### Permissions
- Plugins declare required permissions
- Runtime permission validation
- Minimal privilege principle

### API Isolation
- Each plugin gets isolated API instance
- No cross-plugin data access
- Secure storage per plugin

## Development Tools

### Plugin Console
- Real-time plugin log monitoring
- Error tracking and debugging
- Performance metrics

### Validation Tools
- Structure validation
- Manifest validation
- API compatibility checking

### Testing Framework
- Automated plugin testing
- API verification
- Integration testing

## Plugin Distribution

### Packaging
```javascript
// Package plugin for distribution
const packagePath = await pluginDeveloper.packagePlugin(pluginId, outputPath);
```

### Installation
- Drag and drop plugin files
- Manual extraction to plugins folder
- Automatic loading on startup

## Troubleshooting

### Common Issues

1. **Plugin Won't Load**
   - Check manifest.json syntax
   - Verify all required fields
   - Check file permissions

2. **API Errors**
   - Verify API version compatibility
   - Check permission declarations
   - Review API method signatures

3. **Hook Not Triggering**
   - Ensure hook name is correct
   - Check plugin is enabled
   - Verify callback function signature

### Debug Mode
Enable debug logging by setting environment variable:
```bash
DEBUG_PLUGINS=true
```

### Log Files
Plugin logs are available in:
- Plugin Console (UI)
- Developer Tools Console
- Application logs

## Examples

See the automatically created `example-plugin` for a working demonstration of the plugin system.

## Contributing

To contribute to the plugin system:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

The MIC Browser Ultimate Plugin System is part of the MIC Browser Ultimate project and follows the same license terms.

## Support

For plugin development support:
- Check the built-in documentation
- Use the plugin validation tools
- Review example plugins
- Submit issues for bugs or feature requests