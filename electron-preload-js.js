const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  readFile: (path) => ipcRenderer.invoke('read-file', path),
  scanDocument: () => ipcRenderer.invoke('scan-document'),

  // Settings
  getSetting: (key) => ipcRenderer.invoke('get-setting', key),
  setSetting: (key, value) => ipcRenderer.invoke('set-setting', key, value),

  // Browser operations
  createWebview: (url) => ipcRenderer.invoke('create-webview', url),

  // AI operations
  aiRequest: (request) => ipcRenderer.invoke('ai-request', request),

  // Data transfer
  transferData: (data) => ipcRenderer.invoke('transfer-data', data),

  // Clipboard
  clipboardWrite: (text) => ipcRenderer.invoke('clipboard-write', text),
  clipboardRead: () => ipcRenderer.invoke('clipboard-read'),

  // IPC event listeners
  on: (channel, callback) => {
    const validChannels = [
      'new-tab',
      'close-tab',
      'reload-page',
      'force-reload',
      'navigate-back',
      'navigate-forward',
      'navigate-home',
      'focus-address-bar',
      'toggle-mic',
      'open-scanner',
      'analyze-page',
      'start-transfer',
      'generate-report',
      'open-mic-settings',
      'bookmark-page',
      'show-bookmarks',
      'import-bookmarks',
      'save-page',
      'check-updates',
      'open-preferences',
      'data-received',
    ];

    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },

  // Remove listener
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
});

// Expose platform information
contextBridge.exposeInMainWorld('platform', {
  name: process.platform,
  version: process.versions.electron,
  node: process.versions.node,
  chrome: process.versions.chrome,
});

// Expose fs for file operations in renderer (safely)
contextBridge.exposeInMainWorld('fs', {
  readFile: async (filepath, options = {}) => {
    const result = await ipcRenderer.invoke('read-file', filepath);
    if (result.success) {
      if (options.encoding === 'utf8') {
        return result.content;
      }
      // Convert to Uint8Array for binary data
      return new TextEncoder().encode(result.content);
    }
    throw new Error(result.error);
  },
});

// Console log for debugging
console.log('Preload script loaded successfully');
