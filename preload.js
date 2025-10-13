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
  // Enhanced OCR document scanning functionality
  scanDocument: (imageData, options) => ipcRenderer.invoke('document-scan', imageData, options),
  scanDocumentBatch: (documents, options) => ipcRenderer.invoke('document-scan-batch', documents, options),
  initOCRLanguage: (language) => ipcRenderer.invoke('ocr-init-language', language),
  getOCRLanguages: () => ipcRenderer.invoke('ocr-get-languages'),
  
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
  },

  // Cross-Tab Data Transfer API
  crossTab: {
    // Tab management
    registerTab: (tabId, tabInfo) => ipcRenderer.invoke('cross-tab-register-tab', tabId, tabInfo),
    unregisterTab: (tabId) => ipcRenderer.invoke('cross-tab-unregister-tab', tabId),
    getActiveTabs: () => ipcRenderer.invoke('cross-tab-get-active-tabs'),
    
    // Data transfer
    transferData: (sourceTabId, targetTabId, data, options) => 
      ipcRenderer.invoke('cross-tab-transfer-data', sourceTabId, targetTabId, data, options),
    syncData: (tabId, dataType) => ipcRenderer.invoke('cross-tab-sync-data', tabId, dataType),
    
    // Tab data management
    updateTabData: (tabId, data, dataType) => ipcRenderer.invoke('cross-tab-update-tab-data', tabId, data, dataType),
    getTabData: (tabId, dataType) => ipcRenderer.invoke('cross-tab-get-tab-data', tabId, dataType),
    
    // Transfer monitoring
    getTransferHistory: () => ipcRenderer.invoke('cross-tab-get-transfer-history'),
    getMetrics: () => ipcRenderer.invoke('cross-tab-get-metrics'),
    
    // Transfer acknowledgment
    sendTransferAck: (ackData) => ipcRenderer.invoke('cross-tab-transfer-ack', ackData),
    
    // Event listeners for cross-tab events
    onTransferStarted: (callback) => ipcRenderer.on('cross-tab-transfer-started', callback),
    onTransferCompleted: (callback) => ipcRenderer.on('cross-tab-transfer-completed', callback),
    onTransferFailed: (callback) => ipcRenderer.on('cross-tab-transfer-failed', callback),
    onSyncCompleted: (callback) => ipcRenderer.on('cross-tab-sync-completed', callback),
    onConflictDetected: (callback) => ipcRenderer.on('cross-tab-conflict-detected', callback),
    onTabRegistered: (callback) => ipcRenderer.on('cross-tab-registered', callback),
    onTabUnregistered: (callback) => ipcRenderer.on('cross-tab-unregistered', callback),
    onDataReceive: (callback) => ipcRenderer.on('cross-tab-data-receive', callback),
    
    // Remove listeners
    removeAllCrossTabListeners: () => {
      ipcRenderer.removeAllListeners('cross-tab-transfer-started');
      ipcRenderer.removeAllListeners('cross-tab-transfer-completed');
      ipcRenderer.removeAllListeners('cross-tab-transfer-failed');
      ipcRenderer.removeAllListeners('cross-tab-sync-completed');
      ipcRenderer.removeAllListeners('cross-tab-conflict-detected');
      ipcRenderer.removeAllListeners('cross-tab-registered');
      ipcRenderer.removeAllListeners('cross-tab-unregistered');
      ipcRenderer.removeAllListeners('cross-tab-data-receive');
    }
  },

  // Chat System API
  chat: {
    // Message operations
    sendMessage: (data) => ipcRenderer.invoke('chat-send-message', data),
    getHistory: (data) => ipcRenderer.invoke('chat-get-history', data),
    searchMessages: (data) => ipcRenderer.invoke('chat-search-messages', data),
    
    // Room operations
    joinRoom: (data) => ipcRenderer.invoke('chat-join-room', data),
    getRooms: () => ipcRenderer.invoke('chat-get-rooms'),
    
    // System operations
    getStats: () => ipcRenderer.invoke('chat-get-stats'),
    toggleAI: (enabled) => ipcRenderer.invoke('chat-toggle-ai', enabled),
    
    // WebSocket event listeners (for real-time chat)
    onNewMessage: (callback) => ipcRenderer.on('chat-new-message', callback),
    onUserJoined: (callback) => ipcRenderer.on('chat-user-joined', callback),
    onUserLeft: (callback) => ipcRenderer.on('chat-user-left', callback),
    onUserTyping: (callback) => ipcRenderer.on('chat-user-typing', callback),
    onMessageUpdated: (callback) => ipcRenderer.on('chat-message-updated', callback),
    onMessageDeleted: (callback) => ipcRenderer.on('chat-message-deleted', callback),
    onRoomCreated: (callback) => ipcRenderer.on('chat-room-created', callback),
    onAIResponse: (callback) => ipcRenderer.on('chat-ai-response', callback),
    
    // Connection status
    onConnected: (callback) => ipcRenderer.on('chat-connected', callback),
    onDisconnected: (callback) => ipcRenderer.on('chat-disconnected', callback),
    onError: (callback) => ipcRenderer.on('chat-error', callback),
    
    // Helper methods for WebSocket integration
    connectWebSocket: (options = {}) => {
      // This would connect to the chat WebSocket server
      // The renderer can use this to establish real-time connections
      const port = options.port || 3080;
      const host = options.host || 'localhost';
      return { port, host, url: `http://${host}:${port}` };
    },
    
    // Format message for display
    formatMessage: (message) => {
      return {
        id: message.id,
        content: message.content,
        userId: message.userId,
        timestamp: new Date(message.timestamp).toLocaleString(),
        type: message.type || 'text',
        edited: message.edited || false,
        deleted: message.deleted || false
      };
    },
    
    // Generate unique user ID
    generateUserId: () => {
      return 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    },
    
    // Generate room ID
    generateRoomId: (name) => {
      const sanitized = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      return 'room_' + sanitized + '_' + Date.now();
    },
    
    // Remove chat event listeners
    removeAllChatListeners: () => {
      ipcRenderer.removeAllListeners('chat-new-message');
      ipcRenderer.removeAllListeners('chat-user-joined');
      ipcRenderer.removeAllListeners('chat-user-left');
      ipcRenderer.removeAllListeners('chat-user-typing');
      ipcRenderer.removeAllListeners('chat-message-updated');
      ipcRenderer.removeAllListeners('chat-message-deleted');
      ipcRenderer.removeAllListeners('chat-room-created');
      ipcRenderer.removeAllListeners('chat-ai-response');
      ipcRenderer.removeAllListeners('chat-connected');
      ipcRenderer.removeAllListeners('chat-disconnected');
      ipcRenderer.removeAllListeners('chat-error');
    }
  },

  // Theme Management API
  setTheme: (themeName) => ipcRenderer.invoke('set-theme', themeName),
  getTheme: () => ipcRenderer.invoke('get-theme'),
  getAvailableThemes: () => ipcRenderer.invoke('get-available-themes'),
  onThemeChanged: (cb) => ipcRenderer.on('apply-theme', (event, theme) => cb(theme)),
  
  // Learning System API
  learning: {
    // Get learning metrics and data
    getMetrics: () => ipcRenderer.invoke('learning-get-metrics'),
    
    // Predict next action
    predictAction: (context) => ipcRenderer.invoke('learning-predict-action', context),
    
    // Request interface adaptation
    adaptInterface: (component, context) => ipcRenderer.invoke('learning-adapt-interface', component, context),
    
    // Provide feedback on learning system
    provideFeedback: (interactionId, feedback) => ipcRenderer.invoke('learning-provide-feedback', interactionId, feedback),
    
    // Toggle privacy mode
    togglePrivacy: (enabled) => ipcRenderer.invoke('learning-toggle-privacy', enabled),
    
    // Update learning configuration
    updateConfig: (config) => ipcRenderer.invoke('learning-update-config', config),
    
    // Reset learning data
    reset: () => ipcRenderer.invoke('learning-reset'),
    
    // Listen to learning events
    onPatternsUpdated: (cb) => ipcRenderer.on('learning-patterns-updated', cb),
    onPreferencesUpdated: (cb) => ipcRenderer.on('learning-preferences-updated', cb),
    onInterfaceAdapted: (cb) => ipcRenderer.on('learning-interface-adapted', cb),
    onInteractionTracked: (cb) => ipcRenderer.on('learning-interaction-tracked', cb)
  },
  
  // Adaptive UI API
  onAdaptiveThemeChange: (cb) => ipcRenderer.on('adaptive-theme-change', cb),
  onAdaptiveLayoutChange: (cb) => ipcRenderer.on('adaptive-layout-change', cb),
  onAdaptiveThemeSuggestion: (cb) => ipcRenderer.on('adaptive-theme-suggestion', cb),
  onAdaptiveNotificationSettings: (cb) => ipcRenderer.on('adaptive-notification-settings', cb),
  onAdaptiveShortcutSuggestions: (cb) => ipcRenderer.on('adaptive-shortcut-suggestions', cb),
  
  // Send feedback to learning system
  sendLearningFeedback: (type, data) => ipcRenderer.send('learning-feedback', { type, data }),
  
  // Track UI interactions for learning
  trackUIInteraction: (interaction) => ipcRenderer.send('ui-interaction', interaction),
  
  // Navigation tracking
  trackNavigation: (navigation) => ipcRenderer.send('navigation', navigation),
  
  // Feature usage tracking
  trackFeatureUsage: (usage) => ipcRenderer.send('feature-used', usage),
  
  // Plugin Management API
  plugins: {
    // Plugin management
    list: () => ipcRenderer.invoke('plugin:list'),
    enable: (pluginId) => ipcRenderer.invoke('plugin:enable', pluginId),
    disable: (pluginId) => ipcRenderer.invoke('plugin:disable', pluginId),
    unload: (pluginId) => ipcRenderer.invoke('plugin:unload', pluginId),
    getInfo: (pluginId) => ipcRenderer.invoke('plugin:get-info', pluginId),
    
    // Plugin development
    create: (pluginData) => ipcRenderer.invoke('plugin:create', pluginData),
    validate: (pluginId) => ipcRenderer.invoke('plugin:validate', pluginId),
    getTemplates: () => ipcRenderer.invoke('plugin:get-templates'),
    package: (pluginId, outputPath) => ipcRenderer.invoke('plugin:package', pluginId, outputPath),
    
    // Hook system
    triggerHook: (hookName, ...args) => ipcRenderer.invoke('plugin:trigger-hook', hookName, ...args),
    
    // Plugin events
    onPluginLoaded: (cb) => ipcRenderer.on('plugin-loaded', cb),
    onPluginUnloaded: (cb) => ipcRenderer.on('plugin-unloaded', cb),
    onPluginEnabled: (cb) => ipcRenderer.on('plugin-enabled', cb),
    onPluginDisabled: (cb) => ipcRenderer.on('plugin-disabled', cb),
    onPluginMenuItemAdded: (cb) => ipcRenderer.on('plugin-menu-item-added', cb),
    onPluginNotification: (cb) => ipcRenderer.on('plugin-notification', cb),
    onPluginToolbarButtonAdded: (cb) => ipcRenderer.on('plugin-toolbar-button-added', cb),
    
    // Remove plugin listeners
    removePluginListeners: () => {
      ipcRenderer.removeAllListeners('plugin-loaded');
      ipcRenderer.removeAllListeners('plugin-unloaded');
      ipcRenderer.removeAllListeners('plugin-enabled');
      ipcRenderer.removeAllListeners('plugin-disabled');
      ipcRenderer.removeAllListeners('plugin-menu-item-added');
      ipcRenderer.removeAllListeners('plugin-notification');
      ipcRenderer.removeAllListeners('plugin-toolbar-button-added');
    }
  },
  
  // System integration
  system: {
    openPluginsFolder: () => ipcRenderer.invoke('system:open-plugins-folder'),
    getPluginsDir: () => ipcRenderer.invoke('system:get-plugins-dir')
  }
});

// Node-specific info (platform)
contextBridge.exposeInMainWorld('nodeAPI', {
  platform: process.platform,
});
