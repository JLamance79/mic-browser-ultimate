require('dotenv').config();
const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const PersistentStorage = require('./PersistentStorage');
const PlatformFeatures = require('./PlatformFeatures');
const isDev = process.env.NODE_ENV === 'development';

// Enable live reload for development
if (isDev) {
  try {
    require('electron-reload')(__dirname, {
      electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
      hardResetMethod: 'exit',
    });
  } catch (error) {
    console.log('Electron reload not available:', error.message);
  }
}

let mainWindow;
let storage;
let platformFeatures;

function createWindow() {
  // Create the browser window
  // Resolve icon path: prefer .ico on Windows for the packaged app, fall back to PNG elsewhere
  const iconName = process.platform === 'win32' ? 'icon.ico' : 'icon.png';
  const iconPath =
    process && process.resourcesPath
      ? path.join(process.resourcesPath, 'assets', 'icons', iconName)
      : path.join(__dirname, 'assets', 'icons', iconName);

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    titleBarStyle: 'hidden', // For custom title bar if needed
    titleBarOverlay: {
      color: '#0a0a0a',
      symbolColor: '#e0e0e0',
    },
    webPreferences: {
      nodeIntegration: false, // Security best practice
      contextIsolation: true, // Security best practice
      enableRemoteModule: false, // Security best practice
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
    icon: iconPath,
    show: false, // Don't show until ready
  });

  // Load the app
  mainWindow.loadFile('index.html');

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // Focus window on creation
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Security: Prevent new window creation
  mainWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });
}

// Auto-updater configuration
function setupAutoUpdater() {
  // Configure auto-updater
  if (!isDev) {
    // Set update server URL for generic provider
    autoUpdater.setFeedURL({
      provider: 'generic',
      url: 'http://localhost:3001'
    });

    // Auto-updater event handlers
    autoUpdater.on('checking-for-update', () => {
      console.log('Checking for update...');
      if (mainWindow) {
        mainWindow.webContents.send('updater-checking');
      }
    });

    autoUpdater.on('update-available', (info) => {
      console.log('Update available:', info);
      if (mainWindow) {
        mainWindow.webContents.send('updater-update-available', info);
      }
    });

    autoUpdater.on('update-not-available', (info) => {
      console.log('Update not available:', info);
      if (mainWindow) {
        mainWindow.webContents.send('updater-update-not-available', info);
      }
    });

    autoUpdater.on('error', (err) => {
      console.error('Update error:', err);
      if (mainWindow) {
        mainWindow.webContents.send('updater-error', err.message);
      }
    });

    autoUpdater.on('download-progress', (progressObj) => {
      let log_message = `Download speed: ${progressObj.bytesPerSecond}`;
      log_message = log_message + ` - Downloaded ${progressObj.percent}%`;
      log_message = log_message + ` (${progressObj.transferred}/${progressObj.total})`;
      console.log(log_message);
      
      if (mainWindow) {
        mainWindow.webContents.send('updater-download-progress', progressObj);
      }
    });

    autoUpdater.on('update-downloaded', (info) => {
      console.log('Update downloaded:', info);
      if (mainWindow) {
        mainWindow.webContents.send('updater-update-downloaded', info);
      }
    });

    // Check for updates every 30 minutes in production
    setInterval(() => {
      autoUpdater.checkForUpdatesAndNotify();
    }, 30 * 60 * 1000);

    // Initial check 30 seconds after app start
    setTimeout(() => {
      autoUpdater.checkForUpdatesAndNotify();
    }, 30000);
  }
}

// App event handlers
app.whenReady().then(async () => {
  // Initialize persistent storage
  storage = new PersistentStorage();
  await storage.initialize();
  
  createWindow();
  createMenu();
  setupAutoUpdater();
  
  // Initialize platform-specific features
  platformFeatures = new PlatformFeatures(mainWindow);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Tab',
          accelerator: 'CmdOrCtrl+T',
          click: () => {
            mainWindow.webContents.send('new-tab');
          },
        },
        {
          label: 'Open File',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile'],
              filters: [
                { name: 'All Files', extensions: ['*'] },
                { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'txt'] },
                { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif'] },
              ],
            });
            if (!result.canceled) {
              mainWindow.webContents.send('file-selected', result.filePaths[0]);
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'MIC Assistant',
      submenu: [
        {
          label: 'Toggle AI Assistant',
          accelerator: 'CmdOrCtrl+M',
          click: () => {
            mainWindow.webContents.send('toggle-assistant');
          },
        },
        {
          label: 'Voice Command',
          accelerator: 'CmdOrCtrl+J',
          click: () => {
            mainWindow.webContents.send('voice-command');
          },
        },
        {
          label: 'Quick Scan',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            mainWindow.webContents.send('quick-scan');
          },
        },
      ],
    },
    {
      label: 'Window',
      submenu: [{ role: 'minimize' }, { role: 'close' }],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About MIC Browser Ultimate',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About MIC Browser Ultimate',
              message: 'MIC Browser Ultimate',
              detail: 'The future of AI-powered web automation and browsing assistance.',
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC handlers for renderer communication
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('show-save-dialog', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  return result;
});

ipcMain.handle('show-open-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  return result;
});

// AI request handler
ipcMain.handle('ai-request', async (event, request) => {
    try {
        // Try OpenAI first if available
        if (process.env.OPENAI_API_KEY) {
            try {
                const { OpenAI } = require('openai');
                
                const openai = new OpenAI({
                    apiKey: process.env.OPENAI_API_KEY,
                });
                
                const response = await openai.chat.completions.create({
                    model: "gpt-4",
                    messages: [
                        {
                            role: "system",
                            content: "You are MIC Browser Ultimate's AI assistant. Help users with web automation, document processing, and intelligent browsing tasks."
                        },
                        {
                            role: "user",
                            content: request.command
                        }
                    ],
                    max_tokens: 1000,
                    temperature: 0.7
                });
                
                return {
                    success: true,
                    response: response.choices[0].message.content
                };
            } catch (openaiError) {
                console.warn('OpenAI request failed:', openaiError.message);
            }
        }
        
        // Fallback to Anthropic Claude (already installed)
        if (process.env.ANTHROPIC_API_KEY) {
            const Anthropic = require('@anthropic-ai/sdk');
            
            const anthropic = new Anthropic({
                apiKey: process.env.ANTHROPIC_API_KEY,
            });
            
            const response = await anthropic.messages.create({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 1000,
                system: "You are MIC Browser Ultimate's AI assistant. Help users with web automation, document processing, and intelligent browsing tasks.",
                messages: [
                    {
                        role: 'user',
                        content: request.command
                    }
                ]
            });
            
            return {
                success: true,
                response: response.content[0].text
            };
        }
        
        // If no API keys are available, return a helpful message
        return {
            success: false,
            error: 'AI service not configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY in your .env file.'
        };
        
    } catch (error) {
        console.error('AI request error:', error);
        return {
            success: false,
            error: error.message
        };
    }
});

// OCR document scanning handler
ipcMain.handle('document-scan', async (event, imageData, options = {}) => {
    try {
        const Tesseract = require('tesseract.js');
        
        // Default options
        const defaultOptions = {
            language: 'eng',
            psm: 3, // Fully automatic page segmentation
            preserveInterword: true
        };
        
        const finalOptions = { ...defaultOptions, ...options };
        
        // Process the image with Tesseract
        const { data } = await Tesseract.recognize(imageData, finalOptions.language, {
            logger: m => {
                // Send progress updates to renderer
                if (m.status === 'recognizing text') {
                    event.sender.send('ocr-progress', {
                        status: m.status,
                        progress: m.progress
                    });
                }
            },
            tessedit_pageseg_mode: finalOptions.psm,
            preserve_interword_spaces: finalOptions.preserveInterword ? '1' : '0'
        });
        
        return {
            success: true,
            text: data.text,
            confidence: data.confidence,
            words: data.words,
            lines: data.lines,
            paragraphs: data.paragraphs,
            symbols: data.symbols
        };
        
    } catch (error) {
        console.error('OCR processing error:', error);
        return {
            success: false,
            error: error.message
        };
    }
});

// Persistent Storage IPC Handlers
ipcMain.handle('storage-get-setting', async (event, key, defaultValue) => {
    try {
        return await storage.getSetting(key, defaultValue);
    } catch (error) {
        console.error('Storage get setting error:', error);
        return defaultValue;
    }
});

ipcMain.handle('storage-set-setting', async (event, key, value) => {
    try {
        await storage.setSetting(key, value);
        return { success: true };
    } catch (error) {
        console.error('Storage set setting error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('storage-get-all-settings', async (event) => {
    try {
        return await storage.getAllSettings();
    } catch (error) {
        console.error('Storage get all settings error:', error);
        return {};
    }
});

// Bookmarks
ipcMain.handle('storage-add-bookmark', async (event, url, title, folder, tags) => {
    try {
        return await storage.addBookmark(url, title, folder, tags);
    } catch (error) {
        console.error('Storage add bookmark error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('storage-get-bookmarks', async (event, folder) => {
    try {
        return await storage.getAllBookmarks(folder);
    } catch (error) {
        console.error('Storage get bookmarks error:', error);
        return [];
    }
});

ipcMain.handle('storage-update-bookmark', async (event, id, updates) => {
    try {
        return await storage.updateBookmark(id, updates);
    } catch (error) {
        console.error('Storage update bookmark error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('storage-delete-bookmark', async (event, id) => {
    try {
        await storage.deleteBookmark(id);
        return { success: true };
    } catch (error) {
        console.error('Storage delete bookmark error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('storage-search-bookmarks', async (event, query) => {
    try {
        return await storage.searchBookmarks(query);
    } catch (error) {
        console.error('Storage search bookmarks error:', error);
        return [];
    }
});

// History
ipcMain.handle('storage-add-history', async (event, url, title, visitTime) => {
    try {
        return await storage.addHistory(url, title, visitTime);
    } catch (error) {
        console.error('Storage add history error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('storage-get-history', async (event, days, limit) => {
    try {
        return await storage.getHistory(days, limit);
    } catch (error) {
        console.error('Storage get history error:', error);
        return [];
    }
});

ipcMain.handle('storage-clear-history', async (event, days) => {
    try {
        await storage.clearHistory(days);
        return { success: true };
    } catch (error) {
        console.error('Storage clear history error:', error);
        return { success: false, error: error.message };
    }
});

// Command History
ipcMain.handle('storage-add-command', async (event, command, result, executionTime) => {
    try {
        return await storage.addCommandHistory(command, result, executionTime);
    } catch (error) {
        console.error('Storage add command error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('storage-get-command-history', async (event, limit) => {
    try {
        return await storage.getCommandHistory(limit);
    } catch (error) {
        console.error('Storage get command history error:', error);
        return [];
    }
});

// AI Context
ipcMain.handle('storage-save-ai-context', async (event, sessionId, context) => {
    try {
        return await storage.saveAIContext(sessionId, context);
    } catch (error) {
        console.error('Storage save AI context error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('storage-get-ai-context', async (event, sessionId) => {
    try {
        return await storage.getAIContext(sessionId);
    } catch (error) {
        console.error('Storage get AI context error:', error);
        return null;
    }
});

// Workflows
ipcMain.handle('storage-save-workflow', async (event, name, workflow) => {
    try {
        return await storage.saveWorkflow(name, workflow);
    } catch (error) {
        console.error('Storage save workflow error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('storage-get-workflow', async (event, id) => {
    try {
        return await storage.getWorkflow(id);
    } catch (error) {
        console.error('Storage get workflow error:', error);
        return null;
    }
});

ipcMain.handle('storage-get-all-workflows', async (event) => {
    try {
        return await storage.getAllWorkflows();
    } catch (error) {
        console.error('Storage get all workflows error:', error);
        return [];
    }
});

// Tab State
ipcMain.handle('storage-save-tab-state', async (event, sessionId, tabs) => {
    try {
        return await storage.saveTabState(sessionId, tabs);
    } catch (error) {
        console.error('Storage save tab state error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('storage-get-tab-state', async (event, sessionId) => {
    try {
        return await storage.getTabState(sessionId);
    } catch (error) {
        console.error('Storage get tab state error:', error);
        return null;
    }
});

// Analytics
ipcMain.handle('storage-record-metric', async (event, metric, value, metadata) => {
    try {
        return await storage.recordMetric(metric, value, metadata);
    } catch (error) {
        console.error('Storage record metric error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('storage-get-metrics', async (event, metric, days) => {
    try {
        return await storage.getMetrics(metric, days);
    } catch (error) {
        console.error('Storage get metrics error:', error);
        return [];
    }
});

// Cache
ipcMain.handle('storage-set-cache', async (event, key, value, ttl) => {
    try {
        await storage.setCache(key, value, ttl);
        return { success: true };
    } catch (error) {
        console.error('Storage set cache error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('storage-get-cache', async (event, key) => {
    try {
        return await storage.getCache(key);
    } catch (error) {
        console.error('Storage get cache error:', error);
        return null;
    }
});

ipcMain.handle('storage-clear-cache', async (event) => {
    try {
        await storage.clearCache();
        return { success: true };
    } catch (error) {
        console.error('Storage clear cache error:', error);
        return { success: false, error: error.message };
    }
});

// Database maintenance
ipcMain.handle('storage-compact', async (event) => {
    try {
        await storage.compact();
        return { success: true };
    } catch (error) {
        console.error('Storage compact error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('storage-get-stats', async (event) => {
    try {
        return await storage.getStats();
    } catch (error) {
        console.error('Storage get stats error:', error);
        return {};
    }
});

// Import/Export
ipcMain.handle('storage-export-data', async (event) => {
    try {
        return await storage.exportData();
    } catch (error) {
        console.error('Storage export data error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('storage-import-data', async (event, data) => {
    try {
        await storage.importData(data);
        return { success: true };
    } catch (error) {
        console.error('Storage import data error:', error);
        return { success: false, error: error.message };
    }
});

// Page Analysis IPC Handlers
ipcMain.handle('page-analysis-analyze', async (event, options = {}) => {
    try {
        // Analysis is performed in the renderer process
        // This handler can store analysis results if needed
        return { success: true, message: 'Analysis should be performed in renderer process' };
    } catch (error) {
        console.error('Page analysis error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('page-analysis-get', async (event, url) => {
    try {
        // Get cached analysis from storage
        const analysis = await storage.getCache(`page-analysis:${url}`);
        return analysis || null;
    } catch (error) {
        console.error('Get page analysis error:', error);
        return null;
    }
});

ipcMain.handle('page-analysis-save', async (event, url, analysis) => {
    try {
        // Save analysis to cache with 24 hour TTL
        await storage.setCache(`page-analysis:${url}`, analysis, 24 * 60 * 60 * 1000);
        
        // Also record analytics
        await storage.recordMetric('page_analysis', 1, {
            url: url,
            score: analysis.overallScore,
            timestamp: new Date().toISOString()
        });
        
        return { success: true };
    } catch (error) {
        console.error('Save page analysis error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('page-analysis-clear-cache', async (event) => {
    try {
        // Clear all page analysis cache entries
        // This is a simplified approach - in a real implementation you'd want to iterate through keys
        await storage.clearCache();
        return { success: true };
    } catch (error) {
        console.error('Clear page analysis cache error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('page-analysis-export', async (event, url, format = 'json') => {
    try {
        const analysis = await storage.getCache(`page-analysis:${url}`);
        if (!analysis) {
            return { success: false, error: 'No analysis found for this URL' };
        }
        
        if (format === 'json') {
            return { success: true, data: JSON.stringify(analysis, null, 2) };
        }
        
        // Could add other export formats here
        return { success: true, data: analysis };
    } catch (error) {
        console.error('Export page analysis error:', error);
        return { success: false, error: error.message };
    }
});

// Auto-updater IPC handlers
ipcMain.handle('updater-check-for-updates', async () => {
    if (!isDev) {
        try {
            const result = await autoUpdater.checkForUpdates();
            return { success: true, result };
        } catch (error) {
            console.error('Check for updates error:', error);
            return { success: false, error: error.message };
        }
    } else {
        return { success: false, error: 'Updates disabled in development mode' };
    }
});

ipcMain.handle('updater-download-update', async () => {
    if (!isDev) {
        try {
            await autoUpdater.downloadUpdate();
            return { success: true };
        } catch (error) {
            console.error('Download update error:', error);
            return { success: false, error: error.message };
        }
    } else {
        return { success: false, error: 'Updates disabled in development mode' };
    }
});

ipcMain.handle('updater-quit-and-install', async () => {
    if (!isDev) {
        try {
            autoUpdater.quitAndInstall();
            return { success: true };
        } catch (error) {
            console.error('Quit and install error:', error);
            return { success: false, error: error.message };
        }
    } else {
        return { success: false, error: 'Updates disabled in development mode' };
    }
});

ipcMain.handle('updater-get-version', async () => {
    return {
        currentVersion: app.getVersion(),
        isDev: isDev
    };
});

// Platform Features IPC Handlers
ipcMain.handle('platform-show-notification', async (event, title, body, options) => {
    if (platformFeatures) {
        return platformFeatures.showNotification(title, body, options);
    }
    return null;
});

ipcMain.handle('platform-update-progress', async (event, progress) => {
    if (platformFeatures) {
        platformFeatures.updateProgress(progress);
    }
});

ipcMain.handle('platform-clear-progress', async () => {
    if (platformFeatures) {
        platformFeatures.clearProgress();
    }
});

ipcMain.handle('platform-get-info', async () => {
    return {
        platform: process.platform,
        arch: process.arch,
        version: process.getSystemVersion(),
        features: {
            jumpList: process.platform === 'win32',
            touchBar: process.platform === 'darwin',
            dock: process.platform === 'darwin',
            tray: true,
            notifications: true
        }
    };
});

// Graceful shutdown
app.on('before-quit', async () => {
    if (storage) {
        await storage.close();
    }
    
    if (platformFeatures) {
        platformFeatures.destroy();
    }
});
