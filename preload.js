const { contextBridge, ipcRenderer } = require('electron');

// Expose a safe API to the renderer
contextBridge.exposeInMainWorld('electronAPI', {
  onNewTab: (cb) => ipcRenderer.on('new-tab', cb),
  onToggleAssistant: (cb) => ipcRenderer.on('toggle-assistant', cb),
  onVoiceCommand: (cb) => ipcRenderer.on('voice-command', cb),
  onQuickScan: (cb) => ipcRenderer.on('quick-scan', cb),
  onFileSelected: (cb) => ipcRenderer.on('file-selected', cb),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  // AI request functionality
  aiRequest: (request) => ipcRenderer.invoke('ai-request', request),
  // OCR document scanning functionality
  scanDocument: (imageData, options) => ipcRenderer.invoke('document-scan', imageData, options),
  
  // Persistent Storage API
  storage: {
    // Settings
    getSetting: (key, defaultValue) => ipcRenderer.invoke('storage-get-setting', key, defaultValue),
    setSetting: (key, value) => ipcRenderer.invoke('storage-set-setting', key, value),
    getAllSettings: () => ipcRenderer.invoke('storage-get-all-settings'),
    
    // Bookmarks
    addBookmark: (url, title, folder, tags) => ipcRenderer.invoke('storage-add-bookmark', url, title, folder, tags),
    getBookmarks: (folder) => ipcRenderer.invoke('storage-get-bookmarks', folder),
    updateBookmark: (id, updates) => ipcRenderer.invoke('storage-update-bookmark', id, updates),
    deleteBookmark: (id) => ipcRenderer.invoke('storage-delete-bookmark', id),
    searchBookmarks: (query) => ipcRenderer.invoke('storage-search-bookmarks', query),
    
    // History
    addHistory: (url, title, visitTime) => ipcRenderer.invoke('storage-add-history', url, title, visitTime),
    getHistory: (days, limit) => ipcRenderer.invoke('storage-get-history', days, limit),
    clearHistory: (days) => ipcRenderer.invoke('storage-clear-history', days),
    
    // Command History
    addCommand: (command, result, executionTime) => ipcRenderer.invoke('storage-add-command', command, result, executionTime),
    getCommandHistory: (limit) => ipcRenderer.invoke('storage-get-command-history', limit),
    
    // AI Context
    saveAIContext: (sessionId, context) => ipcRenderer.invoke('storage-save-ai-context', sessionId, context),
    getAIContext: (sessionId) => ipcRenderer.invoke('storage-get-ai-context', sessionId),
    
    // Workflows
    saveWorkflow: (name, workflow) => ipcRenderer.invoke('storage-save-workflow', name, workflow),
    getWorkflow: (id) => ipcRenderer.invoke('storage-get-workflow', id),
    getAllWorkflows: () => ipcRenderer.invoke('storage-get-all-workflows'),
    
    // Tab State
    saveTabState: (sessionId, tabs) => ipcRenderer.invoke('storage-save-tab-state', sessionId, tabs),
    getTabState: (sessionId) => ipcRenderer.invoke('storage-get-tab-state', sessionId),
    
    // Analytics
    recordMetric: (metric, value, metadata) => ipcRenderer.invoke('storage-record-metric', metric, value, metadata),
    getMetrics: (metric, days) => ipcRenderer.invoke('storage-get-metrics', metric, days),
    
    // Cache
    setCache: (key, value, ttl) => ipcRenderer.invoke('storage-set-cache', key, value, ttl),
    getCache: (key) => ipcRenderer.invoke('storage-get-cache', key),
    clearCache: () => ipcRenderer.invoke('storage-clear-cache'),
    
    // Maintenance
    compact: () => ipcRenderer.invoke('storage-compact'),
    getStats: () => ipcRenderer.invoke('storage-get-stats'),
    
    // Import/Export
    exportData: () => ipcRenderer.invoke('storage-export-data'),
    importData: (data) => ipcRenderer.invoke('storage-import-data', data)
  },

  // Page Analysis API
  pageAnalysis: {
    analyze: (options) => ipcRenderer.invoke('page-analysis-analyze', options),
    getAnalysis: (url) => ipcRenderer.invoke('page-analysis-get', url),
    saveAnalysis: (url, analysis) => ipcRenderer.invoke('page-analysis-save', url, analysis),
    clearAnalysisCache: () => ipcRenderer.invoke('page-analysis-clear-cache'),
    exportAnalysis: (url, format) => ipcRenderer.invoke('page-analysis-export', url, format)
  },

  // Auto-updater API
  updater: {
    checkForUpdates: () => ipcRenderer.invoke('updater-check-for-updates'),
    downloadUpdate: () => ipcRenderer.invoke('updater-download-update'),
    quitAndInstall: () => ipcRenderer.invoke('updater-quit-and-install'),
    getVersion: () => ipcRenderer.invoke('updater-get-version'),
    
    // Event listeners
    onUpdateChecking: (callback) => ipcRenderer.on('updater-checking', callback),
    onUpdateAvailable: (callback) => ipcRenderer.on('updater-update-available', callback),
    onUpdateNotAvailable: (callback) => ipcRenderer.on('updater-update-not-available', callback),
    onUpdateError: (callback) => ipcRenderer.on('updater-error', callback),
    onDownloadProgress: (callback) => ipcRenderer.on('updater-download-progress', callback),
    onUpdateDownloaded: (callback) => ipcRenderer.on('updater-update-downloaded', callback),
    
    // Remove listeners
    removeAllListeners: () => {
      ipcRenderer.removeAllListeners('updater-checking');
      ipcRenderer.removeAllListeners('updater-update-available');
      ipcRenderer.removeAllListeners('updater-update-not-available');
      ipcRenderer.removeAllListeners('updater-error');
      ipcRenderer.removeAllListeners('updater-download-progress');
      ipcRenderer.removeAllListeners('updater-update-downloaded');
    }
  },

  // Platform Features API
  platform: {
    showNotification: (title, body, options) => ipcRenderer.invoke('platform-show-notification', title, body, options),
    updateProgress: (progress) => ipcRenderer.invoke('platform-update-progress', progress),
    clearProgress: () => ipcRenderer.invoke('platform-clear-progress'),
    getInfo: () => ipcRenderer.invoke('platform-get-info'),
    
    // Event listeners for platform-specific actions
    onThumbnailAction: (callback) => ipcRenderer.on('thumbnail-action', callback),
    onTouchBarAction: (callback) => ipcRenderer.on('touchbar-action', callback),
    onDockAction: (callback) => ipcRenderer.on('dock-action', callback),
    onTrayAction: (callback) => ipcRenderer.on('tray-action', callback),
    onMenuAction: (callback) => ipcRenderer.on('menu-action', callback),
    
    // Remove listeners
    removeAllPlatformListeners: () => {
      ipcRenderer.removeAllListeners('thumbnail-action');
      ipcRenderer.removeAllListeners('touchbar-action');
      ipcRenderer.removeAllListeners('dock-action');
      ipcRenderer.removeAllListeners('tray-action');
      ipcRenderer.removeAllListeners('menu-action');
    }
  }
});

// Node-specific info (platform)
contextBridge.exposeInMainWorld('nodeAPI', {
  platform: process.platform,
});
