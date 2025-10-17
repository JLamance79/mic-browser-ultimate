// Preload script startup debugging
console.log('🔧 PRELOAD: Script starting execution...');

let contextBridge, ipcRenderer;
try {
  const electron = require('electron');
  contextBridge = electron.contextBridge;
  ipcRenderer = electron.ipcRenderer;
  console.log('🔧 PRELOAD: Electron modules loaded successfully');
  console.log('🔧 PRELOAD: contextBridge available:', !!contextBridge);
  console.log('🔧 PRELOAD: ipcRenderer available:', !!ipcRenderer);
} catch (error) {
  console.error('🔧 PRELOAD ERROR: Failed to load Electron modules:', error);
  throw error;
}

// Input validation helpers
const validateInput = {
  isString: (value) => typeof value === 'string',
  isObject: (value) => value && typeof value === 'object' && !Array.isArray(value),
  isArray: (value) => Array.isArray(value),
  isFunction: (value) => typeof value === 'function',
  sanitizeString: (value) => {
    if (typeof value !== 'string') return '';
    return value.replace(/[<>]/g, '').trim();
  },
  sanitizeObject: (obj) => {
    if (!obj || typeof obj !== 'object') return {};
    return JSON.parse(JSON.stringify(obj)); // Deep clone and sanitize
  }
};

// Safe IPC wrapper with error handling
const safeInvoke = async (channel, ...args) => {
  try {
    // Basic input sanitization
    const sanitizedArgs = args.map(arg => {
      if (typeof arg === 'string') return validateInput.sanitizeString(arg);
      if (typeof arg === 'object') return validateInput.sanitizeObject(arg);
      return arg;
    });
    
    return await ipcRenderer.invoke(channel, ...sanitizedArgs);
  } catch (error) {
    console.error(`IPC Error on channel ${channel}:`, error.message);
    throw new Error(`Communication error: ${error.message}`);
  }
};

// Safe event listener wrapper
const safeOn = (channel, callback) => {
  if (!validateInput.isFunction(callback)) {
    throw new Error('Callback must be a function');
  }
  
  return ipcRenderer.on(channel, (event, ...args) => {
    try {
      callback(event, ...args);
    } catch (error) {
      console.error(`Event handler error on ${channel}:`, error.message);
    }
  });
};

// Expose a safe API to the renderer
console.log('🔧 PRELOAD: Attempting to expose electronAPI...');
console.log('🔧 PRELOAD: contextBridge available:', !!contextBridge);

try {
  const electronAPI = {
  onNewTab: (cb) => safeOn('new-tab', cb),
  onToggleAssistant: (cb) => safeOn('toggle-assistant', cb),
  onVoiceCommand: (cb) => safeOn('voice-command', cb),
  onQuickScan: (cb) => safeOn('quick-scan', cb),
  onFileSelected: (cb) => safeOn('file-selected', cb),
  getAppVersion: () => safeInvoke('get-app-version'),
  // AI request functionality with input validation
  aiRequest: (request) => {
    if (!validateInput.isObject(request)) {
      throw new Error('AI request must be an object');
    }
    return safeInvoke('ai-request', request);
  },
  // Enhanced OCR document scanning functionality with validation
  scanDocument: (imageData, options = {}) => {
    if (!imageData) {
      throw new Error('Image data is required for document scanning');
    }
    return safeInvoke('document-scan', imageData, options);
  },
  scanDocumentBatch: (documents, options = {}) => {
    if (!validateInput.isArray(documents) || documents.length === 0) {
      throw new Error('Documents must be a non-empty array');
    }
    return safeInvoke('document-scan-batch', documents, options);
  },
  initOCRLanguage: (language) => ipcRenderer.invoke('ocr-init-language', language),
  getOCRLanguages: () => ipcRenderer.invoke('ocr-get-languages'),
  
  // Persistent Storage API with validation
  storage: {
    // Settings
    getSetting: (key, defaultValue) => {
      if (!validateInput.isString(key) || key.trim() === '') {
        throw new Error('Setting key must be a non-empty string');
      }
      return safeInvoke('storage-get-setting', key, defaultValue);
    },
    setSetting: (key, value) => {
      if (!validateInput.isString(key) || key.trim() === '') {
        throw new Error('Setting key must be a non-empty string');
      }
      return safeInvoke('storage-set-setting', key, value);
    },
    getAllSettings: () => safeInvoke('storage-get-all-settings'),
    
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

  // I18n (Internationalization) API
  i18n: {
    getTranslations: (langCode) => ipcRenderer.invoke('i18n-get-translations', langCode),
    setLanguage: (langCode) => ipcRenderer.invoke('i18n-set-language', langCode),
    getAvailableLanguages: () => ipcRenderer.invoke('i18n-get-available-languages'),
    getCurrentLanguage: () => ipcRenderer.invoke('i18n-get-current-language'),
    getLanguagePreference: () => ipcRenderer.invoke('i18n-get-language-preference')
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
    checkForUpdates: () => safeInvoke('auto-updater-check'),
    downloadUpdate: () => safeInvoke('auto-updater-download'),
    quitAndInstall: () => safeInvoke('auto-updater-install'),
    getStatus: () => safeInvoke('auto-updater-status'),
    getSettings: () => safeInvoke('auto-updater-settings'),
    updateSettings: (settings) => {
      if (!validateInput.isObject(settings)) {
        throw new Error('Settings must be an object');
      }
      return safeInvoke('auto-updater-settings', settings);
    },
    
    // Event listeners for auto-updater events
    onUpdateEvent: (callback) => {
      if (!validateInput.isFunction(callback)) {
        throw new Error('Callback must be a function');
      }
      return safeOn('auto-updater', callback);
    },
    
    // Legacy event listeners for compatibility
    onUpdateChecking: (callback) => safeOn('updater-checking', callback),
    onUpdateAvailable: (callback) => safeOn('updater-update-available', callback),
    onUpdateNotAvailable: (callback) => safeOn('updater-update-not-available', callback),
    onUpdateError: (callback) => safeOn('updater-error', callback),
    onDownloadProgress: (callback) => safeOn('updater-download-progress', callback),
    onUpdateDownloaded: (callback) => safeOn('updater-update-downloaded', callback),
    
    // Remove listeners
    removeAllListeners: () => {
      ipcRenderer.removeAllListeners('auto-updater');
      ipcRenderer.removeAllListeners('updater-checking');
      ipcRenderer.removeAllListeners('updater-update-available');
      ipcRenderer.removeAllListeners('updater-update-not-available');
      ipcRenderer.removeAllListeners('updater-error');
      ipcRenderer.removeAllListeners('updater-download-progress');
      ipcRenderer.removeAllListeners('updater-update-downloaded');
    }
  },

  // Crash Reporting API
  crashReporting: {
    getSettings: () => safeInvoke('crash-reporting:get-settings'),
    updateSettings: (settings) => {
      if (!validateInput.isObject(settings)) {
        throw new Error('Settings must be an object');
      }
      return safeInvoke('crash-reporting:update-settings', settings);
    },
    getReports: (filters) => safeInvoke('crash-reporting:get-reports', filters),
    getAnalytics: (timeRange) => safeInvoke('crash-reporting:get-analytics', timeRange),
    clearReports: () => safeInvoke('crash-reporting:clear-reports'),
    exportReports: (exportPath) => {
      if (!validateInput.isString(exportPath) || exportPath.trim() === '') {
        throw new Error('Export path must be a non-empty string');
      }
      return safeInvoke('crash-reporting:export-reports', exportPath);
    },
    testCrash: () => safeInvoke('crash-reporting:test-crash'),
    
    // Event listeners for crash reporting events
    onCrashDetected: (callback) => {
      if (!validateInput.isFunction(callback)) {
        throw new Error('Callback must be a function');
      }
      return safeOn('crash-reporting:crash-detected', callback);
    },
    onReportGenerated: (callback) => {
      if (!validateInput.isFunction(callback)) {
        throw new Error('Callback must be a function');
      }
      return safeOn('crash-reporting:report-generated', callback);
    },
    
    // Remove listeners
    removeAllListeners: () => {
      ipcRenderer.removeAllListeners('crash-reporting:crash-detected');
      ipcRenderer.removeAllListeners('crash-reporting:report-generated');
    }
  },

  // Crash Reporting API
  crashReporting: {
    getSettings: () => safeInvoke('crash-reporting:get-settings'),
    updateSettings: (settings) => {
      if (!validateInput.isObject(settings)) {
        throw new Error('Settings must be an object');
      }
      return safeInvoke('crash-reporting:update-settings', settings);
    },
    getReports: (filters) => safeInvoke('crash-reporting:get-reports', filters),
    getAnalytics: (timeRange) => safeInvoke('crash-reporting:get-analytics', timeRange),
    clearReports: () => safeInvoke('crash-reporting:clear-reports'),
    exportReports: (exportPath) => {
      if (exportPath && (!validateInput.isString(exportPath) || exportPath.trim() === '')) {
        throw new Error('Export path must be a non-empty string');
      }
      return safeInvoke('crash-reporting:export-reports', exportPath);
    },
    testCrash: () => safeInvoke('crash-reporting:test-crash'),
    
    // Event listeners for crash reporting events
    onCrashDetected: (callback) => {
      if (!validateInput.isFunction(callback)) {
        throw new Error('Callback must be a function');
      }
      return safeOn('crash-reporting:crash-detected', callback);
    },
    
    onReportGenerated: (callback) => {
      if (!validateInput.isFunction(callback)) {
        throw new Error('Callback must be a function');
      }
      return safeOn('crash-reporting:report-generated', callback);
    },
    
    // Remove listeners
    removeAllListeners: () => {
      ipcRenderer.removeAllListeners('crash-reporting:crash-detected');
      ipcRenderer.removeAllListeners('crash-reporting:report-generated');
    }
  },

  // Native Notification API
  notifications: {
    // Show various types of notifications
    show: (options) => {
      if (!validateInput.isObject(options)) {
        throw new Error('Notification options must be an object');
      }
      if (!options.title || !validateInput.isString(options.title)) {
        throw new Error('Notification title is required and must be a string');
      }
      return safeInvoke('notification-show', options);
    },
    
    showSystem: (title, body, options = {}) => {
      if (!validateInput.isString(title) || title.trim() === '') {
        throw new Error('Title must be a non-empty string');
      }
      if (body && !validateInput.isString(body)) {
        throw new Error('Body must be a string');
      }
      if (!validateInput.isObject(options)) {
        throw new Error('Options must be an object');
      }
      return safeInvoke('notification-show-system', title, body, options);
    },
    
    showSecurity: (title, body, options = {}) => {
      if (!validateInput.isString(title) || title.trim() === '') {
        throw new Error('Title must be a non-empty string');
      }
      if (body && !validateInput.isString(body)) {
        throw new Error('Body must be a string');
      }
      if (!validateInput.isObject(options)) {
        throw new Error('Options must be an object');
      }
      return safeInvoke('notification-show-security', title, body, options);
    },
    
    showUpdate: (title, body, options = {}) => {
      if (!validateInput.isString(title) || title.trim() === '') {
        throw new Error('Title must be a non-empty string');
      }
      if (body && !validateInput.isString(body)) {
        throw new Error('Body must be a string');
      }
      if (!validateInput.isObject(options)) {
        throw new Error('Options must be an object');
      }
      return safeInvoke('notification-show-update', title, body, options);
    },
    
    showChat: (title, body, options = {}) => {
      if (!validateInput.isString(title) || title.trim() === '') {
        throw new Error('Title must be a non-empty string');
      }
      if (body && !validateInput.isString(body)) {
        throw new Error('Body must be a string');
      }
      if (!validateInput.isObject(options)) {
        throw new Error('Options must be an object');
      }
      return safeInvoke('notification-show-chat', title, body, options);
    },
    
    showDownload: (title, body, options = {}) => {
      if (!validateInput.isString(title) || title.trim() === '') {
        throw new Error('Title must be a non-empty string');
      }
      if (body && !validateInput.isString(body)) {
        throw new Error('Body must be a string');
      }
      if (!validateInput.isObject(options)) {
        throw new Error('Options must be an object');
      }
      return safeInvoke('notification-show-download', title, body, options);
    },
    
    showError: (title, body, options = {}) => {
      if (!validateInput.isString(title) || title.trim() === '') {
        throw new Error('Title must be a non-empty string');
      }
      if (body && !validateInput.isString(body)) {
        throw new Error('Body must be a string');
      }
      if (!validateInput.isObject(options)) {
        throw new Error('Options must be an object');
      }
      return safeInvoke('notification-show-error', title, body, options);
    },
    
    showSuccess: (title, body, options = {}) => {
      if (!validateInput.isString(title) || title.trim() === '') {
        throw new Error('Title must be a non-empty string');
      }
      if (body && !validateInput.isString(body)) {
        throw new Error('Body must be a string');
      }
      if (!validateInput.isObject(options)) {
        throw new Error('Options must be an object');
      }
      return safeInvoke('notification-show-success', title, body, options);
    },
    
    // Notification management
    close: (notificationId) => {
      if (!validateInput.isString(notificationId) || notificationId.trim() === '') {
        throw new Error('Notification ID must be a non-empty string');
      }
      return safeInvoke('notification-close', notificationId);
    },
    
    closeAll: () => safeInvoke('notification-close-all'),
    
    // Settings management
    getSettings: () => safeInvoke('notification-get-settings'),
    
    updateSettings: (settings) => {
      if (!validateInput.isObject(settings)) {
        throw new Error('Settings must be an object');
      }
      return safeInvoke('notification-update-settings', settings);
    },
    
    // History management
    getHistory: () => safeInvoke('notification-get-history'),
    
    markAsRead: (notificationId) => {
      if (!validateInput.isString(notificationId) || notificationId.trim() === '') {
        throw new Error('Notification ID must be a non-empty string');
      }
      return safeInvoke('notification-mark-read', notificationId);
    },
    
    clearHistory: () => safeInvoke('notification-clear-history'),
    
    // System information
    getInfo: () => safeInvoke('notification-get-info'),
    
    // Event listeners for notification events
    onClicked: (callback) => {
      if (!validateInput.isFunction(callback)) {
        throw new Error('Callback must be a function');
      }
      return safeOn('notification-clicked', callback);
    },
    
    onClosed: (callback) => {
      if (!validateInput.isFunction(callback)) {
        throw new Error('Callback must be a function');
      }
      return safeOn('notification-closed', callback);
    },
    
    onAction: (callback) => {
      if (!validateInput.isFunction(callback)) {
        throw new Error('Callback must be a function');
      }
      return safeOn('notification-action', callback);
    },
    
    onSettingsUpdated: (callback) => {
      if (!validateInput.isFunction(callback)) {
        throw new Error('Callback must be a function');
      }
      return safeOn('notification-settings-updated', callback);
    },
    
    onHistoryUpdated: (callback) => {
      if (!validateInput.isFunction(callback)) {
        throw new Error('Callback must be a function');
      }
      return safeOn('notification-history-updated', callback);
    },
    
    // Remove listeners
    removeAllListeners: () => {
      ipcRenderer.removeAllListeners('notification-clicked');
      ipcRenderer.removeAllListeners('notification-closed');
      ipcRenderer.removeAllListeners('notification-action');
      ipcRenderer.removeAllListeners('notification-settings-updated');
      ipcRenderer.removeAllListeners('notification-history-updated');
    }
  },

  // Deep Link API
  deepLink: {
    // Handle deep link
    handle: (url) => {
      if (!validateInput.isString(url) || url.trim() === '') {
        throw new Error('URL must be a non-empty string');
      }
      return safeInvoke('deeplink-handle', url);
    },
    
    // Generate deep link
    generate: (action, params = {}) => {
      if (!validateInput.isString(action) || action.trim() === '') {
        throw new Error('Action must be a non-empty string');
      }
      if (!validateInput.isObject(params)) {
        throw new Error('Params must be an object');
      }
      return safeInvoke('deeplink-generate', action, params);
    },
    
    // Get settings
    getSettings: () => safeInvoke('deeplink-get-settings'),
    
    // Update settings
    updateSettings: (settings) => {
      if (!validateInput.isObject(settings)) {
        throw new Error('Settings must be an object');
      }
      return safeInvoke('deeplink-update-settings', settings);
    },
    
    // Get history
    getHistory: () => safeInvoke('deeplink-get-history'),
    
    // Clear history
    clearHistory: () => safeInvoke('deeplink-clear-history'),
    
    // Get statistics
    getStatistics: () => safeInvoke('deeplink-get-statistics'),
    
    // Register custom route
    registerRoute: (action) => {
      if (!validateInput.isString(action) || action.trim() === '') {
        throw new Error('Action must be a non-empty string');
      }
      return safeInvoke('deeplink-register-route', action);
    },
    
    // Add security rule
    addSecurityRule: (pattern) => {
      if (!validateInput.isString(pattern) && !(pattern instanceof RegExp)) {
        throw new Error('Pattern must be a string or RegExp');
      }
      return safeInvoke('deeplink-add-security-rule', pattern.toString());
    },
    
    // Event listeners for deep link events
    onNavigateToChat: (callback) => {
      if (!validateInput.isFunction(callback)) {
        throw new Error('Callback must be a function');
      }
      return safeOn('navigate-to-chat', callback);
    },
    
    onPerformSearch: (callback) => {
      if (!validateInput.isFunction(callback)) {
        throw new Error('Callback must be a function');
      }
      return safeOn('perform-search', callback);
    },
    
    onOpenSettings: (callback) => {
      if (!validateInput.isFunction(callback)) {
        throw new Error('Callback must be a function');
      }
      return safeOn('open-settings-tab', callback);
    },
    
    onTriggerOCR: (callback) => {
      if (!validateInput.isFunction(callback)) {
        throw new Error('Callback must be a function');
      }
      return safeOn('trigger-ocr', callback);
    },
    
    onHandleTransfer: (callback) => {
      if (!validateInput.isFunction(callback)) {
        throw new Error('Callback must be a function');
      }
      return safeOn('handle-transfer', callback);
    },
    
    onHandleAuth: (callback) => {
      if (!validateInput.isFunction(callback)) {
        throw new Error('Callback must be a function');
      }
      return safeOn('handle-auth', callback);
    },
    
    onCustomRoute: (callback) => {
      if (!validateInput.isFunction(callback)) {
        throw new Error('Callback must be a function');
      }
      return safeOn('custom-deeplink-route', callback);
    },
    
    // Remove listeners
    removeAllListeners: () => {
      ipcRenderer.removeAllListeners('navigate-to-chat');
      ipcRenderer.removeAllListeners('perform-search');
      ipcRenderer.removeAllListeners('open-settings-tab');
      ipcRenderer.removeAllListeners('trigger-ocr');
      ipcRenderer.removeAllListeners('handle-transfer');
      ipcRenderer.removeAllListeners('handle-auth');
      ipcRenderer.removeAllListeners('custom-deeplink-route');
    }
  },

  // System Tray API
  systemTray: {
    // Get system tray settings
    getSettings: () => {
      return safeInvoke('system-tray-get-settings');
    },
    
    // Update system tray settings
    updateSettings: (settings) => {
      if (!validateInput.isObject(settings)) {
        throw new Error('Settings must be an object');
      }
      return safeInvoke('system-tray-update-settings', settings);
    },
    
    // Get system tray statistics
    getStatistics: () => {
      return safeInvoke('system-tray-get-statistics');
    },
    
    // Show system tray notification
    showNotification: (title, body, type = 'info') => {
      if (!validateInput.isString(title) || title.trim() === '') {
        throw new Error('Title must be a non-empty string');
      }
      if (!validateInput.isString(body) || body.trim() === '') {
        throw new Error('Body must be a non-empty string');
      }
      if (!validateInput.isString(type) || !['info', 'warning', 'error', 'success'].includes(type)) {
        throw new Error('Type must be one of: info, warning, error, success');
      }
      return safeInvoke('system-tray-show-notification', title, body, type);
    },
    
    // Update tray tooltip
    updateTooltip: (tooltip) => {
      if (!validateInput.isString(tooltip) || tooltip.trim() === '') {
        throw new Error('Tooltip must be a non-empty string');
      }
      return safeInvoke('system-tray-update-tooltip', tooltip);
    },
    
    // Check if system tray is supported
    isSupported: () => {
      return safeInvoke('system-tray-is-supported');
    },
    
    // Event listeners for system tray actions
    onQuickAction: (callback) => {
      if (!validateInput.isFunction(callback)) {
        throw new Error('Callback must be a function');
      }
      return safeOn('tray-quick-action', callback);
    },
    
    onShowStatistics: (callback) => {
      if (!validateInput.isFunction(callback)) {
        throw new Error('Callback must be a function');
      }
      return safeOn('show-tray-statistics', callback);
    },
    
    // Remove listeners
    removeAllListeners: () => {
      ipcRenderer.removeAllListeners('tray-quick-action');
      ipcRenderer.removeAllListeners('show-tray-statistics');
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
  },
  
  // External Link Handler
  openExternalLink: (url) => {
    if (!validateInput.isString(url) || url.trim() === '') {
      throw new Error('URL must be a non-empty string');
    }
    const sanitizedUrl = validateInput.sanitizeString(url);
    return safeInvoke('open-external-link', sanitizedUrl);
  },
  
  // API Ready Check
  isReady: () => Promise.resolve(true)
  };
  
  console.log('🔧 PRELOAD: About to expose electronAPI object...');
  
  // Use contextBridge with context isolation enabled
  contextBridge.exposeInMainWorld('electronAPI', electronAPI);
  console.log('🔧 PRELOAD: electronAPI exposed via contextBridge successfully!');
  
  // DIRECT WINDOW FALLBACK: Ensure main functionality works regardless of contextBridge issues
  try {
    window._electronAPITest = 'PRELOAD_SUCCESS';
    window.electronAPI = electronAPI; // Direct fallback assignment
    console.log('🔧 PRELOAD: Direct window APIs written successfully');
    console.log('🔧 PRELOAD: electronAPI.openExternalLink available via window:', typeof window.electronAPI.openExternalLink);
  } catch (error) {
    console.error('🔧 PRELOAD ERROR: Cannot write to window:', error);
  }
} catch (error) {
  console.error('🔧 PRELOAD ERROR: Failed to expose electronAPI:', error);
  console.error('🔧 PRELOAD ERROR Stack:', error.stack);
}

// System info (safe platform detection)
const platformInfo = process.platform;
const devMode = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');

// COMBINED API EXPOSURE - Single contextBridge call to avoid conflicts
console.log('🔧 PRELOAD: Adding nodeAPI and isDev to window...');
try {
  contextBridge.exposeInMainWorld('nodeAPI', {
    platform: platformInfo, // Safe: only platform string, not process object
  });
  console.log('🔧 PRELOAD: nodeAPI exposed via contextBridge successfully');
  
  contextBridge.exposeInMainWorld('isDev', devMode);
  console.log('🔧 PRELOAD: isDev exposed via contextBridge successfully');
} catch (error) {
  console.error('🔧 PRELOAD ERROR: Failed to expose nodeAPI/isDev:', error);
}

// Preload script loaded successfully
console.log('🔧 Preload script execution complete');

// Notify renderer that preload is complete
window.addEventListener('DOMContentLoaded', () => {
  console.log('🔧 Preload DOMContentLoaded triggered');
  // Send ready signal to renderer after a short delay to ensure all APIs are exposed
  setTimeout(() => {
    console.log('🔧 Dispatching electronapi-ready event');
    window.dispatchEvent(new CustomEvent('electronapi-ready'));
  }, 50);
});
