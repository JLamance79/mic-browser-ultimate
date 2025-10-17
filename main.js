require('dotenv').config();
const { app, BrowserWindow, Menu, ipcMain, dialog, shell, session } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
// Monitor performance
const { performance } = require('perf_hooks');
const PersistentStorage = require('./PersistentStorage');
const PlatformFeatures = require('./PlatformFeatures');
const ChatManager = require('./ChatManager');
const ChatAI = require('./ChatAI');
const CrossTabDataTransfer = require('./CrossTabDataTransfer');
const LearningEngine = require('./LearningEngine');
const { LearningIntegration } = require('./LearningIntegration');
const { AdaptiveUISystem } = require('./AdaptiveUI');
const { getSecurityManager } = require('./SecurityManager');
const PluginManager = require('./PluginManager');
const PluginDeveloper = require('./PluginDeveloper');
const { i18n } = require('./I18nManager');
const AutoUpdaterManager = require('./AutoUpdater');
const CrashReportingSystem = require('./CrashReporter');
const NativeNotificationManager = require('./NativeNotificationManager');
const DeepLinkManager = require('./DeepLinkManager');
const SystemTrayManager = require('./SystemTrayManager');

// Analytics & Telemetry Configuration
// Replace 'UA-XXXXXXXX-X' with your actual Google Analytics tracking ID
// Get your tracking ID from: https://analytics.google.com/
// Format: UA-XXXXXXXXX-X (Universal Analytics)
const ua = require('universal-analytics');
const ga = ua('UA-XXXXXXXX-X'); // Replace with your actual Google Analytics tracking ID

const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');
const noDevTools = process.argv.includes('--no-devtools');

// Memory Management - Limit cache size to 50MB
app.commandLine.appendSwitch('disk-cache-size', '52428800'); // 50MB

// Suppress common Electron warnings in development
if (isDev) {
  app.commandLine.appendSwitch('disable-features', 'VizDisplayCompositor');
  app.commandLine.appendSwitch('disable-dev-shm-usage');
  app.commandLine.appendSwitch('no-sandbox');
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
}

// Enable live reload for development
if (isDev) {
  try {
    // Suppress fs.Stats deprecation warning from readdirp (electron-reload dependency)
    const originalEmit = process.emit;
    process.emit = function(name, data, ...args) {
      if (name === 'warning' && data.name === 'DeprecationWarning' && 
          data.message.includes('fs.Stats constructor is deprecated')) {
        return false;
      }
      return originalEmit.apply(process, [name, data, ...args]);
    };
    
    require('electron-reload')(__dirname, {
      electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
      hardResetMethod: 'exit',
    });
    
    // Restore original emit after setup
    process.emit = originalEmit;
  } catch (error) {
    console.log('Electron reload not available:', error.message);
  }
}

let mainWindow;
let storage;
let platformFeatures;
let chatManager;
let chatAI;
let crossTabTransfer;
let learningEngine;
let learningIntegration;
let adaptiveUI;
let securityManager;
let pluginManager;
let pluginDeveloper;
let autoUpdaterManager;
let crashReporter;
let notificationManager;
let deepLinkManager;
let systemTrayManager;

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
      nodeIntegration: false, // Security best practice - DISABLED in renderer
      contextIsolation: true, // Security best practice - ENABLED (FIXED)
      enableRemoteModule: false, // Security best practice - DISABLED
      webviewTag: true, // Required for webview elements in browser tabs
      preload: (() => {
        const preloadPath = path.join(__dirname, 'preload.js');
        console.log('🔧 MAIN: Preload path set to:', preloadPath);
        console.log('🔧 MAIN: Preload file exists:', require('fs').existsSync(preloadPath));
        return preloadPath;
      })(),
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      enableBlinkFeatures: '',
      disableBlinkFeatures: 'Auxclick',
      sandbox: false, // Required for our preload script functionality
      safeDialogs: true,
      safeDialogsMessage: 'This page is trying to show multiple dialogs.',
      spellcheck: true,
      backgroundThrottling: false,
      devTools: isDev && !noDevTools // Only enable DevTools in development unless explicitly disabled
    },
    icon: iconPath,
    show: false, // Don't show until ready
  });

  // Add preload error handling
  mainWindow.webContents.on('preload-error', (event, preloadPath, error) => {
    console.error('🔧 MAIN ERROR: Preload script error:', error);
    console.error('🔧 MAIN ERROR: Preload path:', preloadPath);
  });

  // Capture console messages from renderer to check preload logs
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    if (message.includes('🔧 PRELOAD')) {
      console.log(`🔧 MAIN: Preload console [${level}]:`, message);
    }
  });

  // Load the app
  mainWindow.loadFile('index.html');

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // Track window creation
    ga.event('Window', 'Created', `${mainWindow.getBounds().width}x${mainWindow.getBounds().height}`).send();
    // Focus window on creation
    if (isDev && !noDevTools) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Filter out DevTools CSS errors
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    // Suppress DevTools theme CSS errors
    if (message.includes('devtools://theme/colors.css') && message.includes('MIME type')) {
      return; // Don't log this error
    }
    if (message.includes('Autofill.enable') || message.includes('Autofill.setAddresses')) {
      return; // Don't log autofill errors
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    // Track window closure
    ga.event('Window', 'Closed').send();
    mainWindow = null;
  });

  // Handle external links - Enhanced for comprehensive coverage
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Always open new windows in external browser
    console.log(`🔗 setWindowOpenHandler triggered for: ${url}`);
    try {
      shell.openExternal(url).then(() => {
        console.log(`✅ Successfully opened external URL: ${url}`);
      }).catch(error => {
        console.error(`❌ Failed to open external URL: ${url}`, error);
      });
    } catch (error) {
      console.error(`❌ Error in setWindowOpenHandler: ${url}`, error);
    }
    return { action: 'deny' };
  });

  // Security: Prevent new window creation (deprecated but still needed for older Electron)
  mainWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    console.log(`🔗 new-window event triggered for: ${url}`);
    try {
      shell.openExternal(url).then(() => {
        console.log(`✅ Successfully opened external URL (new-window): ${url}`);
      }).catch(error => {
        console.error(`❌ Failed to open external URL (new-window): ${url}`, error);
      });
    } catch (error) {
      console.error(`❌ Error in new-window handler: ${url}`, error);
    }
  });

  // Handle navigation to external URLs in main window
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const currentURL = mainWindow.webContents.getURL();
    const currentOrigin = new URL(currentURL).origin;
    
    try {
      const newURL = new URL(url);
      
      // If navigating to a different origin, open in external browser
      if (url.startsWith('http://') || url.startsWith('https://')) {
        if (newURL.origin !== currentOrigin && !url.includes('localhost') && !url.includes('127.0.0.1')) {
          event.preventDefault();
          console.log(`External navigation blocked, opening in browser: ${url}`);
          shell.openExternal(url);
        }
      }
    } catch (error) {
      // If URL parsing fails, assume it's safe internal navigation
      console.log(`URL parsing failed for: ${url}, allowing internal navigation`);
    }
  });
  
  // Plugin system event integration
  setupBrowserPluginHooks();
}

// Setup browser plugin hooks for webContents events
function setupBrowserPluginHooks() {
  if (!mainWindow || !pluginManager) return;
  
  // Hook for page navigation events
  mainWindow.webContents.on('did-navigate', (event, url) => {
    pluginManager.triggerHook('page-loaded', url, mainWindow.webContents.getTitle()).catch(error => {
      console.error('Error triggering page-loaded hook:', error);
    });
  });
  
  mainWindow.webContents.on('did-navigate-in-page', (event, url) => {
    pluginManager.triggerHook('page-changed', url, mainWindow.webContents.getTitle()).catch(error => {
      console.error('Error triggering page-changed hook:', error);
    });
  });
  
  // Hook for DOM ready
  mainWindow.webContents.on('dom-ready', () => {
    const url = mainWindow.webContents.getURL();
    const title = mainWindow.webContents.getTitle();
    pluginManager.triggerHook('dom-ready', url, title).catch(error => {
      console.error('Error triggering dom-ready hook:', error);
    });
  });
  
  // Hook for window events
  mainWindow.on('focus', () => {
    pluginManager.triggerHook('window-event', 'focus', {}).catch(error => {
      console.error('Error triggering window-event hook:', error);
    });
  });
  
  mainWindow.on('blur', () => {
    pluginManager.triggerHook('window-event', 'blur', {}).catch(error => {
      console.error('Error triggering window-event hook:', error);
    });
  });
  
  // Hook for tab changes (if multiple tabs are implemented in the future)
  // This is a placeholder for future tab functionality
  mainWindow.webContents.on('page-title-updated', (event, title) => {
    const url = mainWindow.webContents.getURL();
    pluginManager.triggerHook('tab-changed', { url, title, active: true }).catch(error => {
      console.error('Error triggering tab-changed hook:', error);
    });
  });
}

// Auto-updater configuration
function setupAutoUpdater() {
  console.log('🔄 Setting up enhanced auto-updater...');
  
  // Initialize the comprehensive auto-updater
  autoUpdaterManager = new AutoUpdaterManager();
  
  // Add IPC handlers for auto-updater
  ipcMain.handle('auto-updater-check', async () => {
    return await autoUpdaterManager.checkForUpdates(true);
  });
  
  ipcMain.handle('auto-updater-download', async () => {
    return await autoUpdaterManager.downloadUpdate();
  });
  
  ipcMain.handle('auto-updater-install', () => {
    autoUpdaterManager.quitAndInstall();
  });
  
  ipcMain.handle('auto-updater-status', () => {
    return autoUpdaterManager.getStatus();
  });
  
  ipcMain.handle('auto-updater-settings', async (event, settings) => {
    if (settings) {
      await autoUpdaterManager.updateSettings(settings);
    }
    return autoUpdaterManager.settings;
  });
  
  // Initialize auto-updater after a short delay
  setTimeout(async () => {
    await autoUpdaterManager.initialize();
  }, 3000);
  
  console.log('🔄 Enhanced auto-updater configured');
}

// Memory Management Setup
function setupMemoryManagement() {
  console.log('🧠 Setting up memory management...');
  
  // Clear webview cache periodically (every 30 minutes)
  const clearCacheInterval = 30 * 60 * 1000; // 30 minutes
  setInterval(() => {
    try {
      session.defaultSession.clearCache();
      console.log('🧹 Webview cache cleared');
    } catch (error) {
      console.error('❌ Error clearing webview cache:', error);
    }
  }, clearCacheInterval);
  
  // Initial cache clear after 5 minutes of app start
  setTimeout(() => {
    try {
      session.defaultSession.clearCache();
      console.log('🧹 Initial webview cache cleared');
    } catch (error) {
      console.error('❌ Error clearing initial webview cache:', error);
    }
  }, 5 * 60 * 1000);
  
  console.log('✅ Memory management setup complete');
}

async function setupSecurityPolicies() {
  try {
    console.log('🛡️ Setting up security policies...');
    
    // Configure Content Security Policy
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob: wss: ws:; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com; " +
            "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; " +
            "style-src-elem 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; " +
            "img-src 'self' data: blob: https:; " +
            "connect-src 'self' https: wss: ws: http://localhost:* https://api.* https://*.supabase.co; " +
            "font-src 'self' https://cdnjs.cloudflare.com data:; " +
            "worker-src 'self' blob: data:; " +
            "object-src 'none'; " +
            "media-src 'self' data: blob:; " +
            "frame-src 'none'; " +
            "child-src 'self' blob:;"
          ],
          'X-Frame-Options': ['DENY'],
          'X-Content-Type-Options': ['nosniff'],
          'X-XSS-Protection': ['1; mode=block'],
          'Referrer-Policy': ['strict-origin-when-cross-origin'],
          'Permissions-Policy': ['geolocation=(), microphone=(), camera=()'],
          'Strict-Transport-Security': ['max-age=31536000; includeSubDomains']
        },
      });
    });

    // Block dangerous protocols
    app.setAsDefaultProtocolClient('mic-browser');

    // Setup certificate validation
    app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
      if (isDev) {
        // Allow self-signed certificates in development
        event.preventDefault();
        callback(true);
      } else {
        // Log security event and deny in production
        securityManager.auditLogger.log('security', 'error', 'Certificate error', {
          url: url,
          error: error,
          fingerprint: certificate.fingerprint
        });
        callback(false);
      }
    });

    // Block insecure content
    session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
      const url = details.url;
      
      // Block known malicious domains (basic example)
      const blockedDomains = ['malware.com', 'phishing.net'];
      const hostname = new URL(url).hostname;
      
      if (blockedDomains.includes(hostname)) {
        securityManager.auditLogger.log('security', 'warning', 'Blocked malicious domain', {
          url: url,
          hostname: hostname
        });
        callback({ cancel: true });
      } else {
        callback({ cancel: false });
      }
    });

    console.log('✅ Security policies configured');
    
  } catch (error) {
    console.error('❌ Failed to setup security policies:', error);
    throw error;
  }
}

// App event handlers
app.whenReady().then(async () => {
  const startTime = performance.now();
  
  try {
    console.log('🚀 Initializing MIC Browser Ultimate with high-grade security...');
    
    // Track app startup analytics
    ga.event('App', 'Started', app.getVersion()).send();
    ga.event('Session', 'Started', process.platform).send();
    
    // Initialize security manager first (highest priority)
    securityManager = getSecurityManager();
    await securityManager.initialize();
    
    // Initialize crash reporting system
    await initializeCrashReporting();
    
    // Initialize native notification system
    await initializeNotificationManager();
    
    // Initialize deep link system
    await initializeDeepLinkManager();
    
    // Initialize system tray manager
    await initializeSystemTrayManager();
    
    // Initialize i18n system
    await i18n.initialize();
    console.log('🌐 I18n system initialized');
    
    // Setup security policies for the session
    await setupSecurityPolicies();
    
    // Initialize persistent storage with security integration
    storage = new PersistentStorage();
    await storage.initialize();
    
    // Setup core IPC handlers BEFORE creating window
    setupCoreIpcHandlers();
    
    createWindow();
    createMenu();
    setupAutoUpdater();
    setupMemoryManagement();
    
    // Initialize platform-specific features
    platformFeatures = new PlatformFeatures(mainWindow);

    // Initialize chat system
    await initializeChatSystem();
    
    // Initialize enhanced OCR processor
    await initializeOCRProcessor();
    
    // Initialize cross-tab data transfer system
    await initializeCrossTabTransfer();
    
    // Initialize learning engine and integration
    await initializeLearningSystem();
    
    // Initialize plugin system
    await initializePluginSystem();
    
    // Log startup performance
    const endTime = performance.now();
    console.log(`🚀 App started in ${Math.round(endTime - startTime)}ms`);
    
    // Monitor memory usage every 30 seconds
    setInterval(() => {
      const usage = process.memoryUsage();
      console.log(`📊 Memory Usage: ${Math.round(usage.heapUsed / 1024 / 1024)}MB heap, ${Math.round(usage.rss / 1024 / 1024)}MB RSS`);
    }, 30000);
    
    console.log('✅ MIC Browser Ultimate initialized with enterprise security');
    
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    dialog.showErrorBox('Security Initialization Error', 
      `Failed to initialize security layer: ${error.message}`);
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', async () => {
  // Track app shutdown
  ga.event('App', 'Shutdown', 'WindowsClosed').send();
  ga.event('Session', 'Ended', 'Normal').send();
  
  // Clean up systems
  try {
    // Clean up plugin system
    if (pluginManager) {
      const plugins = pluginManager.getPluginList();
      for (const plugin of plugins) {
        try {
          await pluginManager.unloadPlugin(plugin.id);
        } catch (error) {
          console.error(`Error unloading plugin ${plugin.id}:`, error);
        }
      }
    }
    
    // Clean up learning system
    if (learningEngine) {
      await learningEngine.shutdown();
    }
    
    // Clean up deep link system
    if (deepLinkManager) {
      await deepLinkManager.destroy();
    }
    
    // Clean up adaptive UI
    if (adaptiveUI) {
      await adaptiveUI.saveUIState();
    }
    
    // Clean up chat system
    if (chatManager) {
      await chatManager.stop();
    }
    
    console.log('✅ All systems shutdown successfully');
  } catch (error) {
    console.error('❌ Error during system shutdown:', error);
  }
  
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

// Initialize chat system
async function initializeChatSystem() {
  try {
    console.log('🚀 Initializing chat system...');
    
    // Initialize chat manager
    chatManager = new ChatManager(mainWindow, {
      port: 3080,
      dbPath: path.join(__dirname, 'data', 'chat.db')
    });
    
    // Initialize chat AI with existing AI service
    let aiService = null;
    try {
      if (process.env.ANTHROPIC_API_KEY) {
        const { Anthropic } = require('@anthropic-ai/sdk');
        aiService = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY
        });
      }
    } catch (error) {
      console.log('⚠️ Anthropic SDK not available, using fallback AI');
    }
    
    chatAI = new ChatAI(chatManager, aiService);
    
    // Start chat server
    await chatManager.start();
    
    // Setup chat AI event handlers
    setupChatAIHandlers();
    
    // Track chat system initialization
    ga.event('Feature', 'ChatSystemInitialized', 'Success').send();
    
    console.log('✅ Chat system initialized successfully');
    
  } catch (error) {
    console.error('❌ Failed to initialize chat system:', error);
    // Track chat system initialization failure
    ga.event('Feature', 'ChatSystemInitialized', 'Failed').send();
  }
}

// Setup chat AI event handlers
function setupChatAIHandlers() {
  // Handle AI requests from chat
  ipcMain.on('chat-ai-request', async (event, data) => {
    try {
      const { requestId, roomId, message, context, config } = data;
      
      // Use existing AI request handler
      const aiRequest = {
        command: message,
        context: {
          chatRoom: roomId,
          recentMessages: context
        },
        maxTokens: config?.maxTokens || 1500,
        temperature: config?.temperature || 0.7
      };
      
      // Get AI response using existing handler
      const response = await handleAIRequest(aiRequest);
      
      // Send response back to chat AI
      if (chatAI) {
        chatAI.emit('main-ai-response', {
          requestId,
          content: response.response || response.content,
          success: response.success
        });
      }
      
    } catch (error) {
      console.error('Error handling chat AI request:', error);
      if (chatAI) {
        chatAI.emit('main-ai-response', {
          requestId: data.requestId,
          content: "I'm sorry, I encountered an error processing your request.",
          success: false,
          error: error.message
        });
      }
    }
  });
  
  // Handle chat events from renderer
  ipcMain.on('chat-send-message', async (event, data) => {
    if (chatManager) {
      chatManager.emit('main-message', data);
    }
  });
}

// Extract AI request handling to reusable function
async function handleAIRequest(request) {
  try {
    // Try OpenAI first if available
    if (process.env.OPENAI_API_KEY) {
      try {
        const { OpenAI } = require('openai');
        
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
        
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
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
          max_tokens: request.maxTokens || 1000,
          temperature: request.temperature || 0.7
        });
        
        return {
          success: true,
          response: response.choices[0].message.content
        };
      } catch (openaiError) {
        console.log('OpenAI failed, trying Anthropic...');
      }
    }
    
    // Try Anthropic if OpenAI fails or isn't available
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const { Anthropic } = require('@anthropic-ai/sdk');
        
        const anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
        });
        
        const response = await anthropic.messages.create({
          model: "claude-3-5-haiku-20241022",
          max_tokens: request.maxTokens || 1000,
          temperature: request.temperature || 0.7,
          messages: [
            {
              role: "user",
              content: request.command
            }
          ]
        });
        
        return {
          success: true,
          response: response.content[0].text
        };
      } catch (anthropicError) {
        console.log('Anthropic failed');
      }
    }
    
    // Fallback response
    return {
      success: false,
      response: "I'm sorry, but no AI service is currently available. Please configure your API keys in the settings."
    };
    
  } catch (error) {
    console.error('AI request error:', error);
    return {
      success: false,
      response: "I encountered an error processing your request. Please try again."
    };
  }
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

// AI request handler (updated to use reusable function)
ipcMain.handle('ai-request', async (event, request) => {
    // Track AI request usage
    ga.event('Usage', 'AIRequest', request.command || 'unknown').send();
    return await handleAIRequest(request);
});

// Chat system IPC handlers
ipcMain.handle('chat-send-message', async (event, data) => {
    try {
        if (!chatManager) {
            throw new Error('Chat system not initialized');
        }
        
        const { roomId, userId, message, type = 'text', metadata = {} } = data;
        // Track chat message usage
        ga.event('Usage', 'ChatMessage', type).send();
        const chatMessage = await chatManager.sendMessage(roomId, userId, message, type, metadata);
        
        return { success: true, message: chatMessage };
    } catch (error) {
        console.error('Error sending chat message:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('chat-get-history', async (event, data) => {
    try {
        if (!chatManager) {
            throw new Error('Chat system not initialized');
        }
        
        const { roomId, limit = 50, offset = 0 } = data;
        const history = await chatManager.getChatHistory(roomId, limit, offset);
        
        return { success: true, history };
    } catch (error) {
        console.error('Error getting chat history:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('chat-join-room', async (event, data) => {
    try {
        if (!chatManager) {
            throw new Error('Chat system not initialized');
        }
        
        const { roomId, userId, roomName, isPrivate = false } = data;
        const room = await chatManager.createOrJoinRoom(roomId, userId, roomName, isPrivate);
        
        return { success: true, room };
    } catch (error) {
        console.error('Error joining chat room:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('chat-get-rooms', async (event) => {
    try {
        if (!chatManager) {
            throw new Error('Chat system not initialized');
        }
        
        const rooms = await chatManager.getActiveRooms();
        return { success: true, rooms };
    } catch (error) {
        console.error('Error getting chat rooms:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('chat-search-messages', async (event, data) => {
    try {
        if (!chatManager) {
            throw new Error('Chat system not initialized');
        }
        
        const { query, roomId, limit = 20 } = data;
        const results = await chatManager.searchMessages(query, roomId, limit);
        
        return { success: true, results };
    } catch (error) {
        console.error('Error searching chat messages:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('chat-get-stats', async (event) => {
    try {
        if (!chatManager) {
            throw new Error('Chat system not initialized');
        }
        
        const stats = chatManager.getStats();
        const aiStats = chatAI ? chatAI.getStats() : {};
        
        return { 
            success: true, 
            stats: { ...stats, ai: aiStats } 
        };
    } catch (error) {
        console.error('Error getting chat stats:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('chat-toggle-ai', async (event, enabled) => {
    try {
        if (!chatAI) {
            throw new Error('Chat AI not initialized');
        }
        
        chatAI.setEnabled(enabled);
        return { success: true, enabled };
    } catch (error) {
        console.error('Error toggling chat AI:', error);
        return { success: false, error: error.message };
    }
});

// Theme Manager
const themes = {
  dark: {
    background: '#0a0a0a',
    surface: '#1a1a2e',
    primary: '#667eea',
    text: '#e0e0e0',
    secondary: '#a0a0a0',
    accent: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444'
  },
  light: {
    background: '#ffffff',
    surface: '#f5f5f5',
    primary: '#4f46e5',
    text: '#1a1a1a',
    secondary: '#6b7280',
    accent: '#2563eb',
    success: '#059669',
    warning: '#d97706',
    danger: '#dc2626'
  },
  blue: {
    background: '#0f172a',
    surface: '#1e293b',
    primary: '#3b82f6',
    text: '#f1f5f9',
    secondary: '#94a3b8',
    accent: '#06b6d4',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444'
  },
  purple: {
    background: '#1e1b4b',
    surface: '#312e81',
    primary: '#8b5cf6',
    text: '#f3f4f6',
    secondary: '#a78bfa',
    accent: '#06b6d4',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444'
  }
};

// ================================================================
// IPC HANDLERS SETUP
// ================================================================

function setupCoreIpcHandlers() {
  console.log('🔧 Registering core IPC handlers...');
  
  // Theme Management IPC Handlers
  setupThemeIpcHandlers();
  
  // Other core handlers can be added here
  console.log('✅ Core IPC handlers registered');
}

function setupThemeIpcHandlers() {
  console.log('🎨 Setting up theme IPC handlers...');

// Theme IPC handlers
ipcMain.handle('set-theme', async (event, themeName) => {
  try {
    const theme = themes[themeName];
    if (!theme) {
      throw new Error(`Theme '${themeName}' not found`);
    }
    
    // Apply theme to main window
    mainWindow.webContents.send('apply-theme', { name: themeName, colors: theme });
    
    // Save theme preference
    if (storage) {
      await storage.setSetting('user-theme', themeName);
    }
    
    // Track theme change analytics
    ga.event('Usage', 'ThemeChanged', themeName).send();
    
    return { success: true, theme: { name: themeName, colors: theme } };
  } catch (error) {
    console.error('Error setting theme:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-theme', async (event) => {
  try {
    // Get saved theme preference or default to dark
    const savedTheme = storage ? await storage.getSetting('user-theme', 'dark') : 'dark';
    const theme = themes[savedTheme] || themes.dark;
    
    return { 
      success: true, 
      theme: { 
        name: savedTheme, 
        colors: theme 
      },
      availableThemes: Object.keys(themes)
    };
  } catch (error) {
    console.error('Error getting theme:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-available-themes', async (event) => {
  try {
    return {
      success: true,
      themes: Object.keys(themes).map(name => ({
        name,
        colors: themes[name]
      }))
    };
  } catch (error) {
    console.error('Error getting available themes:', error);
    return { success: false, error: error.message };
  }
});

  console.log('✅ Theme IPC handlers registered');
}

// Enhanced OCR document scanning handler
const { EnhancedOCRProcessor } = require('./EnhancedOCRProcessor');
let ocrProcessor = null;

// Initialize OCR processor on app startup
async function initializeOCRProcessor() {
    try {
        ocrProcessor = new EnhancedOCRProcessor({
            debug: isDev,
            savePreprocessed: isDev,
            maxImageSize: 4096,
            minConfidence: 0.60
        });
        
        // Set progress callback to send updates to renderer
        ocrProcessor.setProgressCallback((progress) => {
            if (mainWindow) {
                mainWindow.webContents.send('ocr-progress', progress);
            }
        });
        
        // Initialize with default language
        await ocrProcessor.initialize(['eng']);
        console.log('✅ Enhanced OCR processor initialized');
        
    } catch (error) {
        console.error('❌ OCR processor initialization failed:', error);
        ocrProcessor = null;
    }
}

async function initializeCrossTabTransfer() {
    try {
        if (!storage) {
            throw new Error('Persistent storage not initialized');
        }
        
        crossTabTransfer = new CrossTabDataTransfer(storage, mainWindow);
        
        // Set up event listeners for cross-tab events
        crossTabTransfer.on('transfer-started', (transfer) => {
            console.log(`🔄 Cross-tab transfer started: ${transfer.id}`);
            if (mainWindow) {
                mainWindow.webContents.send('cross-tab-transfer-started', transfer);
            }
        });
        
        crossTabTransfer.on('transfer-completed', (transfer) => {
            console.log(`✅ Cross-tab transfer completed: ${transfer.id}`);
            if (mainWindow) {
                mainWindow.webContents.send('cross-tab-transfer-completed', transfer);
            }
        });
        
        crossTabTransfer.on('transfer-failed', (transfer) => {
            console.error(`❌ Cross-tab transfer failed: ${transfer.id}`, transfer.error);
            if (mainWindow) {
                mainWindow.webContents.send('cross-tab-transfer-failed', transfer);
            }
        });
        
        crossTabTransfer.on('sync-completed', (syncData) => {
            if (mainWindow) {
                mainWindow.webContents.send('cross-tab-sync-completed', syncData);
            }
        });
        
        crossTabTransfer.on('conflict-detected', (conflict) => {
            console.warn('🔄 Data conflict detected:', conflict);
            if (mainWindow) {
                mainWindow.webContents.send('cross-tab-conflict-detected', conflict);
            }
        });
        
        crossTabTransfer.on('tab-registered', (data) => {
            if (mainWindow) {
                mainWindow.webContents.send('cross-tab-registered', data);
            }
        });
        
        crossTabTransfer.on('tab-unregistered', (data) => {
            if (mainWindow) {
                mainWindow.webContents.send('cross-tab-unregistered', data);
            }
        });
        
        console.log('✅ Cross-Tab Data Transfer system initialized');
        
    } catch (error) {
        console.error('❌ Cross-Tab Data Transfer initialization failed:', error);
        crossTabTransfer = null;
    }
}

// Initialize Learning Engine and Integration System
async function initializeLearningSystem() {
    try {
        console.log('🧠 Initializing Learning System...');
        
        // Get AI service for learning engine
        let aiService = null;
        try {
            if (process.env.ANTHROPIC_API_KEY) {
                const { Anthropic } = require('@anthropic-ai/sdk');
                aiService = new Anthropic({
                    apiKey: process.env.ANTHROPIC_API_KEY
                });
            }
        } catch (error) {
            console.log('⚠️ AI service not available for learning engine');
        }
        
        // Initialize learning engine
        learningEngine = new LearningEngine(storage, aiService);
        await learningEngine.initialize();
        
        // Initialize learning integration
        learningIntegration = new LearningIntegration(learningEngine);
        await learningIntegration.initialize();
        
        // Initialize adaptive UI system
        adaptiveUI = new AdaptiveUISystem(learningEngine, mainWindow);
        await adaptiveUI.initialize();
        
        // Integrate with existing components
        if (chatAI) {
            learningIntegration.integrateWithChatAI(chatAI);
        }
        
        if (crossTabTransfer) {
            learningIntegration.integrateWithCrossTabTransfer(crossTabTransfer);
        }
        
        if (mainWindow) {
            learningIntegration.integrateWithUI(mainWindow);
        }
        
        // Setup learning event handlers
        setupLearningHandlers();
        
        // Track learning system initialization
        ga.event('Feature', 'LearningSystemInitialized', 'Success').send();
        
        console.log('✅ Learning System initialized successfully');
        
    } catch (error) {
        console.error('❌ Learning System initialization failed:', error);
        // Track learning system initialization failure
        ga.event('Feature', 'LearningSystemInitialized', 'Failed').send();
        learningEngine = null;
        learningIntegration = null;
    }
}

// Initialize Plugin System
async function initializePluginSystem() {
    try {
        console.log('🔌 Initializing Plugin System...');
        
        // Initialize plugin manager
        pluginManager = new PluginManager();
        await pluginManager.initialize();
        
        // Initialize plugin developer tools
        pluginDeveloper = new PluginDeveloper(pluginManager);
        
        // Setup plugin event handlers
        setupPluginHandlers();
        
        // Setup additional IPC handlers for plugin system
        setupPluginIpcHandlers();
        
        // Track plugin system initialization
        ga.event('Feature', 'PluginSystemInitialized', 'Success').send();
        
        console.log('✅ Plugin System initialized successfully');
        
    } catch (error) {
        console.error('❌ Plugin System initialization failed:', error);
        // Track plugin system initialization failure
        ga.event('Feature', 'PluginSystemInitialized', 'Failed').send();
        pluginManager = null;
        pluginDeveloper = null;
    }
}

// Initialize Crash Reporting System
async function initializeCrashReporting() {
    try {
        console.log('🚨 Initializing Crash Reporting System...');
        
        let crashReporter = null;
        
        // Always setup IPC handlers, but functionality depends on mode
        if (!isDev) {
            // Only initialize in production builds
            crashReporter = new CrashReportingSystem({
                appName: 'MIC Browser Ultimate',
                appVersion: app.getVersion(),
                platform: process.platform,
                environment: isDev ? 'development' : 'production',
                privacy: {
                    collectUserData: false, // Default to privacy-first
                    collectSystemInfo: true,
                    collectPerformanceData: true
                }
            });
            
            await crashReporter.initialize();
            
            // Store global reference
            global.crashReporter = crashReporter;
            
            console.log('✅ Crash Reporting System initialized successfully');
        } else {
            console.log('🚨 Crash reporting disabled in development mode');
        }
        
        // Setup crash reporter IPC handlers (always, but with dev mode handling)
        setupCrashReportingIpcHandlers(crashReporter);
        
        // Track crash reporting initialization
        ga.event('Feature', 'CrashReportingInitialized', isDev ? 'Disabled' : 'Success').send();
        
    } catch (error) {
        console.error('❌ Crash Reporting System initialization failed:', error);
        // Still setup handlers for graceful degradation
        setupCrashReportingIpcHandlers(null);
        // Track crash reporting initialization failure
        ga.event('Feature', 'CrashReportingInitialized', 'Failed').send();
    }
}

// Initialize native notification manager
async function initializeNotificationManager() {
    try {
        console.log('🔔 Initializing Native Notification System...');
        
        notificationManager = new NativeNotificationManager();
        
        // Initialize the notification system
        const success = await notificationManager.init();
        
        if (success) {
            // Store global reference
            global.notificationManager = notificationManager;
            
            // Setup notification event handlers
            setupNotificationHandlers();
            
            // Setup notification IPC handlers
            setupNotificationIpcHandlers();
            
            console.log('✅ Native Notification System initialized successfully');
            
            // Show welcome notification in development
            if (isDev) {
                setTimeout(() => {
                    notificationManager.showSystemNotification(
                        'MIC Browser Ultimate',
                        'Native notifications are now active!',
                        { 
                            urgency: 'low',
                            clickAction: { type: 'app' }
                        }
                    );
                }, 2000);
            }
        } else {
            console.warn('⚠️ Native notifications not supported on this system');
        }
        
        // Track notification system initialization
        ga.event('Feature', 'NotificationSystemInitialized', success ? 'Success' : 'Unsupported').send();
        
    } catch (error) {
        console.error('❌ Native Notification System initialization failed:', error);
        // Track notification system initialization failure
        ga.event('Feature', 'NotificationSystemInitialized', 'Failed').send();
    }
}

// Initialize deep link manager
async function initializeDeepLinkManager() {
    try {
        console.log('🔗 Initializing Deep Link System...');
        
        deepLinkManager = new DeepLinkManager({
            protocol: 'mic-browser',
            enableSecurityValidation: true,
            enableLogging: true,
            maxUrlLength: 2048,
            enableHistory: true
        });
        
        // Initialize the deep link system
        const success = await deepLinkManager.initialize();
        
        if (success) {
            // Store global reference
            global.deepLinkManager = deepLinkManager;
            
            // Setup deep link event handlers
            setupDeepLinkHandlers();
            
            // Setup deep link IPC handlers
            setupDeepLinkIpcHandlers();
            
            console.log('✅ Deep Link System initialized successfully');
            
            // Track deep link initialization
            ga.event('Feature', 'DeepLinkInitialized', 'Success').send();
        } else {
            console.warn('⚠️ Deep link system could not be fully initialized');
        }
        
    } catch (error) {
        console.error('❌ Deep Link System initialization failed:', error);
        // Still setup handlers for graceful degradation
        setupDeepLinkIpcHandlers(null);
        // Track deep link initialization failure
        ga.event('Feature', 'DeepLinkInitialized', 'Failed').send();
    }
}

// Initialize System Tray Manager
async function initializeSystemTrayManager() {
    console.log('🖥️ Initializing System Tray Manager...');
    
    try {
        // Check if system tray is supported
        if (!SystemTrayManager.isSupported()) {
            console.log('[SystemTray] System tray not supported on this platform');
            return false;
        }

        // Create and initialize system tray manager
        systemTrayManager = new SystemTrayManager(mainWindow);
        const initialized = await systemTrayManager.initialize();
        
        if (initialized) {
            // Setup system tray IPC handlers
            setupSystemTrayIpcHandlers();
            
            // Setup system tray event handlers
            setupSystemTrayHandlers();
            
            // Make available globally
            global.systemTrayManager = systemTrayManager;
            
            console.log('✅ System Tray Manager initialized successfully');
            
            // Track initialization success
            ga.event('Feature', 'SystemTrayInitialized', 'Success').send();
            
            return true;
        } else {
            console.log('⚠️ System Tray Manager initialization skipped (disabled in settings)');
            return false;
        }

    } catch (error) {
        console.error('❌ Failed to initialize System Tray Manager:', error);
        
        // Still setup handlers for graceful degradation
        setupSystemTrayIpcHandlers(null);
        
        // Track initialization failure
        ga.event('Feature', 'SystemTrayInitialized', 'Failed').send();
        
        return false;
    }
}

// Setup notification system event handlers
function setupNotificationHandlers() {
    if (!notificationManager) return;
    
    // Handle notification events
    notificationManager.on('notification-clicked', (notificationId, options) => {
        console.log('[NotificationHandlers] Notification clicked:', notificationId);
        
        // Send to renderer process
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('notification-clicked', { notificationId, options });
        }
    });
    
    notificationManager.on('notification-closed', (notificationId) => {
        console.log('[NotificationHandlers] Notification closed:', notificationId);
        
        // Send to renderer process
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('notification-closed', { notificationId });
        }
    });
    
    notificationManager.on('notification-action', (notificationId, actionIndex) => {
        console.log('[NotificationHandlers] Notification action triggered:', notificationId, actionIndex);
        
        // Send to renderer process
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('notification-action', { notificationId, actionIndex });
        }
    });
    
    notificationManager.on('notification-command', (command, data) => {
        console.log('[NotificationHandlers] Notification command:', command, data);
        
        // Handle notification commands
        handleNotificationCommand(command, data);
    });
    
    notificationManager.on('settings-updated', (settings) => {
        console.log('[NotificationHandlers] Notification settings updated');
        
        // Send to renderer process
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('notification-settings-updated', settings);
        }
    });
    
    notificationManager.on('history-updated', () => {
        console.log('[NotificationHandlers] Notification history updated');
        
        // Send to renderer process
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('notification-history-updated');
        }
    });
}

// Handle notification commands
function handleNotificationCommand(command, data) {
    switch (command) {
        case 'open-settings':
            // Focus app and open settings
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.focus();
                mainWindow.webContents.send('open-settings-tab', data.tab || 'notifications');
            }
            break;
            
        case 'open-updates':
            // Open updates section
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.focus();
                mainWindow.webContents.send('open-settings-tab', 'updates');
            }
            break;
            
        case 'open-security':
            // Open security section
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.focus();
                mainWindow.webContents.send('open-settings-tab', 'security');
            }
            break;
            
        case 'export-crash-reports':
            // Trigger crash report export
            if (crashReporter) {
                crashReporter.exportReports();
            }
            break;
            
        default:
            console.warn('[NotificationHandlers] Unknown command:', command);
    }
}

// Setup notification IPC handlers
function setupNotificationIpcHandlers() {
    // Show notification
    ipcMain.handle('notification-show', async (event, options) => {
        try {
            if (!notificationManager) {
                return { success: false, error: 'Notification system not initialized' };
            }
            
            const notificationId = await notificationManager.showNotification(options);
            return { success: true, notificationId };
        } catch (error) {
            console.error('Error showing notification:', error);
            return { success: false, error: error.message };
        }
    });
    
    // Show predefined notification types
    ipcMain.handle('notification-show-system', async (event, title, body, options = {}) => {
        try {
            if (!notificationManager) {
                return { success: false, error: 'Notification system not initialized' };
            }
            
            const notificationId = await notificationManager.showSystemNotification(title, body, options);
            return { success: true, notificationId };
        } catch (error) {
            console.error('Error showing system notification:', error);
            return { success: false, error: error.message };
        }
    });
    
    ipcMain.handle('notification-show-security', async (event, title, body, options = {}) => {
        try {
            if (!notificationManager) {
                return { success: false, error: 'Notification system not initialized' };
            }
            
            const notificationId = await notificationManager.showSecurityAlert(title, body, options);
            return { success: true, notificationId };
        } catch (error) {
            console.error('Error showing security notification:', error);
            return { success: false, error: error.message };
        }
    });
    
    ipcMain.handle('notification-show-update', async (event, title, body, options = {}) => {
        try {
            if (!notificationManager) {
                return { success: false, error: 'Notification system not initialized' };
            }
            
            const notificationId = await notificationManager.showUpdateNotification(title, body, options);
            return { success: true, notificationId };
        } catch (error) {
            console.error('Error showing update notification:', error);
            return { success: false, error: error.message };
        }
    });
    
    ipcMain.handle('notification-show-chat', async (event, title, body, options = {}) => {
        try {
            if (!notificationManager) {
                return { success: false, error: 'Notification system not initialized' };
            }
            
            const notificationId = await notificationManager.showChatMessage(title, body, options);
            return { success: true, notificationId };
        } catch (error) {
            console.error('Error showing chat notification:', error);
            return { success: false, error: error.message };
        }
    });
    
    ipcMain.handle('notification-show-download', async (event, title, body, options = {}) => {
        try {
            if (!notificationManager) {
                return { success: false, error: 'Notification system not initialized' };
            }
            
            const notificationId = await notificationManager.showDownloadComplete(title, body, options);
            return { success: true, notificationId };
        } catch (error) {
            console.error('Error showing download notification:', error);
            return { success: false, error: error.message };
        }
    });
    
    ipcMain.handle('notification-show-error', async (event, title, body, options = {}) => {
        try {
            if (!notificationManager) {
                return { success: false, error: 'Notification system not initialized' };
            }
            
            const notificationId = await notificationManager.showError(title, body, options);
            return { success: true, notificationId };
        } catch (error) {
            console.error('Error showing error notification:', error);
            return { success: false, error: error.message };
        }
    });
    
    ipcMain.handle('notification-show-success', async (event, title, body, options = {}) => {
        try {
            if (!notificationManager) {
                return { success: false, error: 'Notification system not initialized' };
            }
            
            const notificationId = await notificationManager.showSuccess(title, body, options);
            return { success: true, notificationId };
        } catch (error) {
            console.error('Error showing success notification:', error);
            return { success: false, error: error.message };
        }
    });
    
    // Close notification
    ipcMain.handle('notification-close', async (event, notificationId) => {
        try {
            if (!notificationManager) {
                return { success: false, error: 'Notification system not initialized' };
            }
            
            notificationManager.closeNotification(notificationId);
            return { success: true };
        } catch (error) {
            console.error('Error closing notification:', error);
            return { success: false, error: error.message };
        }
    });
    
    // Close all notifications
    ipcMain.handle('notification-close-all', async (event) => {
        try {
            if (!notificationManager) {
                return { success: false, error: 'Notification system not initialized' };
            }
            
            notificationManager.closeAllNotifications();
            return { success: true };
        } catch (error) {
            console.error('Error closing all notifications:', error);
            return { success: false, error: error.message };
        }
    });
    
    // Get settings
    ipcMain.handle('notification-get-settings', async (event) => {
        try {
            if (!notificationManager) {
                return { success: false, error: 'Notification system not initialized' };
            }
            
            const settings = notificationManager.getSettings();
            return { success: true, settings };
        } catch (error) {
            console.error('Error getting notification settings:', error);
            return { success: false, error: error.message };
        }
    });
    
    // Update settings
    ipcMain.handle('notification-update-settings', async (event, newSettings) => {
        try {
            if (!notificationManager) {
                return { success: false, error: 'Notification system not initialized' };
            }
            
            await notificationManager.updateSettings(newSettings);
            return { success: true, settings: notificationManager.getSettings() };
        } catch (error) {
            console.error('Error updating notification settings:', error);
            return { success: false, error: error.message };
        }
    });
    
    // Get history
    ipcMain.handle('notification-get-history', async (event) => {
        try {
            if (!notificationManager) {
                return { success: false, error: 'Notification system not initialized' };
            }
            
            const history = notificationManager.getHistory();
            return { success: true, history };
        } catch (error) {
            console.error('Error getting notification history:', error);
            return { success: false, error: error.message };
        }
    });
    
    // Mark as read
    ipcMain.handle('notification-mark-read', async (event, notificationId) => {
        try {
            if (!notificationManager) {
                return { success: false, error: 'Notification system not initialized' };
            }
            
            notificationManager.markAsRead(notificationId);
            return { success: true };
        } catch (error) {
            console.error('Error marking notification as read:', error);
            return { success: false, error: error.message };
        }
    });
    
    // Clear history
    ipcMain.handle('notification-clear-history', async (event) => {
        try {
            if (!notificationManager) {
                return { success: false, error: 'Notification system not initialized' };
            }
            
            notificationManager.clearHistory();
            return { success: true };
        } catch (error) {
            console.error('Error clearing notification history:', error);
            return { success: false, error: error.message };
        }
    });
    
    // Get system info
    ipcMain.handle('notification-get-info', async (event) => {
        try {
            if (!notificationManager) {
                return { 
                    success: true, 
                    info: {
                        supported: false,
                        enabled: false,
                        activeCount: 0,
                        unreadCount: 0
                    }
                };
            }
            
            const info = {
                supported: notificationManager.isSupported(),
                enabled: notificationManager.isNotificationEnabled(),
                activeCount: notificationManager.getActiveNotificationCount(),
                unreadCount: notificationManager.getUnreadCount()
            };
            
            return { success: true, info };
        } catch (error) {
            console.error('Error getting notification info:', error);
            return { success: false, error: error.message };
        }
    });
    
    console.log('[NotificationIPC] Notification IPC handlers registered');
}

// Setup system tray event handlers
function setupSystemTrayHandlers() {
    if (!systemTrayManager) return;
    
    console.log('[SystemTrayHandlers] Setting up system tray event handlers...');
    
    // No specific event handlers needed for now as SystemTrayManager handles them internally
    // This function is here for future extensibility
    
    console.log('[SystemTrayHandlers] System tray handlers configured');
}

// Setup deep link system event handlers
function setupDeepLinkHandlers() {
    if (!deepLinkManager) return;
    
    // Handle deep link navigation events
    deepLinkManager.on('navigate-to-chat', (data) => {
        console.log('[DeepLinkHandlers] Navigate to chat:', data);
        
        // Send to renderer process
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.focus();
            mainWindow.webContents.send('navigate-to-chat', data);
        }
    });
    
    deepLinkManager.on('perform-search', (data) => {
        console.log('[DeepLinkHandlers] Perform search:', data);
        
        // Send to renderer process
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.focus();
            mainWindow.webContents.send('perform-search', data);
        }
    });
    
    deepLinkManager.on('navigate-to-settings', (data) => {
        console.log('[DeepLinkHandlers] Navigate to settings:', data);
        
        // Send to renderer process
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.focus();
            mainWindow.webContents.send('open-settings-tab', data.section || 'general');
        }
    });
    
    deepLinkManager.on('trigger-ocr', (data) => {
        console.log('[DeepLinkHandlers] Trigger OCR:', data);
        
        // Send to renderer process
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.focus();
            mainWindow.webContents.send('trigger-ocr', data);
        }
    });
    
    deepLinkManager.on('handle-transfer', (data) => {
        console.log('[DeepLinkHandlers] Handle transfer:', data);
        
        // Send to renderer process
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.focus();
            mainWindow.webContents.send('handle-transfer', data);
        }
    });
    
    deepLinkManager.on('handle-auth', (data) => {
        console.log('[DeepLinkHandlers] Handle auth:', data);
        
        // Send to renderer process
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.focus();
            mainWindow.webContents.send('handle-auth', data);
        }
    });
    
    deepLinkManager.on('link-handled', (data) => {
        console.log('[DeepLinkHandlers] Link handled successfully:', data.url);
    });
    
    deepLinkManager.on('link-rejected', (data) => {
        console.warn('[DeepLinkHandlers] Link rejected:', data.url, data.reason);
        
        // Show notification about rejected link
        if (notificationManager) {
            notificationManager.showSecurityAlert(
                'Deep Link Blocked',
                `Suspicious deep link blocked: ${data.reason}`,
                { urgency: 'normal' }
            );
        }
    });
    
    deepLinkManager.on('link-failed', (data) => {
        console.error('[DeepLinkHandlers] Link failed:', data.url, data.result);
    });
}

// Setup deep link IPC handlers
function setupDeepLinkIpcHandlers() {
    // Handle deep link
    ipcMain.handle('deeplink-handle', async (event, url) => {
        try {
            if (!deepLinkManager) {
                return { success: false, error: 'Deep link system not initialized' };
            }
            
            const result = await deepLinkManager.handleDeepLink(url);
            return result;
        } catch (error) {
            console.error('Error handling deep link:', error);
            return { success: false, error: error.message };
        }
    });
    
    // Generate deep link
    ipcMain.handle('deeplink-generate', async (event, action, params) => {
        try {
            if (!deepLinkManager) {
                return { success: false, error: 'Deep link system not initialized' };
            }
            
            const url = deepLinkManager.generateDeepLink(action, params);
            return { success: true, url };
        } catch (error) {
            console.error('Error generating deep link:', error);
            return { success: false, error: error.message };
        }
    });
    
    // Get settings
    ipcMain.handle('deeplink-get-settings', async (event) => {
        try {
            if (!deepLinkManager) {
                return { success: false, error: 'Deep link system not initialized' };
            }
            
            const settings = deepLinkManager.getSettings();
            return { success: true, settings };
        } catch (error) {
            console.error('Error getting deep link settings:', error);
            return { success: false, error: error.message };
        }
    });
    
    // Update settings
    ipcMain.handle('deeplink-update-settings', async (event, newSettings) => {
        try {
            if (!deepLinkManager) {
                return { success: false, error: 'Deep link system not initialized' };
            }
            
            const success = await deepLinkManager.updateSettings(newSettings);
            return { success, settings: deepLinkManager.getSettings() };
        } catch (error) {
            console.error('Error updating deep link settings:', error);
            return { success: false, error: error.message };
        }
    });
    
    // Get history
    ipcMain.handle('deeplink-get-history', async (event) => {
        try {
            if (!deepLinkManager) {
                return { success: false, error: 'Deep link system not initialized' };
            }
            
            const history = deepLinkManager.getHistory();
            return { success: true, history };
        } catch (error) {
            console.error('Error getting deep link history:', error);
            return { success: false, error: error.message };
        }
    });
    
    // Clear history
    ipcMain.handle('deeplink-clear-history', async (event) => {
        try {
            if (!deepLinkManager) {
                return { success: false, error: 'Deep link system not initialized' };
            }
            
            deepLinkManager.clearHistory();
            return { success: true };
        } catch (error) {
            console.error('Error clearing deep link history:', error);
            return { success: false, error: error.message };
        }
    });
    
    // Get statistics
    ipcMain.handle('deeplink-get-statistics', async (event) => {
        try {
            if (!deepLinkManager) {
                return { success: false, error: 'Deep link system not initialized' };
            }
            
            const statistics = deepLinkManager.getStatistics();
            return { success: true, statistics };
        } catch (error) {
            console.error('Error getting deep link statistics:', error);
            return { success: false, error: error.message };
        }
    });
    
    // Register custom route
    ipcMain.handle('deeplink-register-route', async (event, action) => {
        try {
            if (!deepLinkManager) {
                return { success: false, error: 'Deep link system not initialized' };
            }
            
            // Register a route that sends data back to renderer
            deepLinkManager.registerRoute(action, async (parsedUrl) => {
                // Send to renderer process for handling
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('custom-deeplink-route', { action, parsedUrl });
                }
                
                return {
                    success: true,
                    action: action,
                    message: 'Custom route handled',
                    data: parsedUrl
                };
            });
            
            return { success: true };
        } catch (error) {
            console.error('Error registering deep link route:', error);
            return { success: false, error: error.message };
        }
    });
    
    // Add security rule
    ipcMain.handle('deeplink-add-security-rule', async (event, pattern) => {
        try {
            if (!deepLinkManager) {
                return { success: false, error: 'Deep link system not initialized' };
            }
            
            deepLinkManager.addSecurityRule(pattern);
            return { success: true };
        } catch (error) {
            console.error('Error adding security rule:', error);
            return { success: false, error: error.message };
        }
    });
    
    console.log('[DeepLinkIPC] Deep link IPC handlers registered');
}

// Setup system tray IPC handlers
function setupSystemTrayIpcHandlers(trayManager = systemTrayManager) {
    // Get system tray settings
    ipcMain.handle('system-tray-get-settings', async (event) => {
        try {
            if (!trayManager) {
                return { success: false, error: 'System tray not available' };
            }
            
            const settings = trayManager.getSettings();
            return { success: true, settings };
        } catch (error) {
            console.error('Error getting system tray settings:', error);
            return { success: false, error: error.message };
        }
    });
    
    // Update system tray settings
    ipcMain.handle('system-tray-update-settings', async (event, newSettings) => {
        try {
            if (!trayManager) {
                return { success: false, error: 'System tray not available' };
            }
            
            trayManager.updateSettings(newSettings);
            return { success: true };
        } catch (error) {
            console.error('Error updating system tray settings:', error);
            return { success: false, error: error.message };
        }
    });
    
    // Get system tray statistics
    ipcMain.handle('system-tray-get-statistics', async (event) => {
        try {
            if (!trayManager) {
                return { success: false, error: 'System tray not available' };
            }
            
            const statistics = trayManager.getStatistics();
            return { success: true, statistics };
        } catch (error) {
            console.error('Error getting system tray statistics:', error);
            return { success: false, error: error.message };
        }
    });
    
    // Show system tray notification
    ipcMain.handle('system-tray-show-notification', async (event, title, body, type) => {
        try {
            if (!trayManager) {
                return { success: false, error: 'System tray not available' };
            }
            
            trayManager.showTrayNotification(title, body, type);
            return { success: true };
        } catch (error) {
            console.error('Error showing system tray notification:', error);
            return { success: false, error: error.message };
        }
    });
    
    // Update tray tooltip
    ipcMain.handle('system-tray-update-tooltip', async (event, tooltip) => {
        try {
            if (!trayManager) {
                return { success: false, error: 'System tray not available' };
            }
            
            trayManager.updateTrayTooltip(tooltip);
            return { success: true };
        } catch (error) {
            console.error('Error updating system tray tooltip:', error);
            return { success: false, error: error.message };
        }
    });
    
    // Check if system tray is supported
    ipcMain.handle('system-tray-is-supported', async (event) => {
        try {
            const supported = SystemTrayManager.isSupported();
            return { success: true, supported };
        } catch (error) {
            console.error('Error checking system tray support:', error);
            return { success: false, error: error.message };
        }
    });
    
    console.log('[SystemTrayIPC] System tray IPC handlers registered');
}

// Setup learning system event handlers
function setupLearningHandlers() {
    if (!learningEngine || !learningIntegration) return;
    
    // Handle learning configuration updates
    ipcMain.handle('learning-update-config', async (event, config) => {
        try {
            learningEngine.updateConfiguration(config);
            return { success: true };
        } catch (error) {
            console.error('Error updating learning config:', error);
            return { success: false, error: error.message };
        }
    });
    
    // Handle learning data requests
    ipcMain.handle('learning-get-metrics', async (event) => {
        try {
            return {
                success: true,
                metrics: learningEngine.getMetrics(),
                userProfile: learningEngine.getUserProfile(),
                patterns: learningEngine.getLearnedPatterns()
            };
        } catch (error) {
            console.error('Error getting learning metrics:', error);
            return { success: false, error: error.message };
        }
    });
    
    // Handle prediction requests
    ipcMain.handle('learning-predict-action', async (event, context) => {
        try {
            const prediction = await learningEngine.predictNextAction(context);
            return { success: true, prediction };
        } catch (error) {
            console.error('Error predicting action:', error);
            return { success: false, error: error.message };
        }
    });
    
    // Handle interface adaptation requests
    ipcMain.handle('learning-adapt-interface', async (event, component, context) => {
        try {
            const adaptations = await learningEngine.adaptInterface(component, context);
            return { success: true, adaptations };
        } catch (error) {
            console.error('Error adapting interface:', error);
            return { success: false, error: error.message };
        }
    });
    
    // Handle feedback provision
    ipcMain.handle('learning-provide-feedback', async (event, interactionId, feedback) => {
        try {
            const success = await learningEngine.provideFeedback(interactionId, feedback);
            return { success };
        } catch (error) {
            console.error('Error providing feedback:', error);
            return { success: false, error: error.message };
        }
    });
    
    // Handle privacy mode toggle
    ipcMain.handle('learning-toggle-privacy', async (event, enabled) => {
        try {
            learningEngine.enablePrivacyMode(enabled);
            return { success: true, privacyMode: enabled };
        } catch (error) {
            console.error('Error toggling privacy mode:', error);
            return { success: false, error: error.message };
        }
    });
    
    // Handle learning system reset
    ipcMain.handle('learning-reset', async (event) => {
        try {
            await learningEngine.reset();
            return { success: true };
        } catch (error) {
            console.error('Error resetting learning system:', error);
            return { success: false, error: error.message };
        }
    });
    
    // Send learning updates to renderer
    learningEngine.on('patterns-learned', () => {
        if (mainWindow) {
            mainWindow.webContents.send('learning-patterns-updated');
        }
    });
    
    learningEngine.on('preferences-learned', () => {
        if (mainWindow) {
            mainWindow.webContents.send('learning-preferences-updated');
        }
    });
    
    learningEngine.on('interface-adapted', (data) => {
        if (mainWindow) {
            mainWindow.webContents.send('learning-interface-adapted', data);
        }
    });
    
    learningIntegration.on('interaction-tracked', (interaction) => {
        if (mainWindow && isDev) {
            mainWindow.webContents.send('learning-interaction-tracked', interaction);
        }
    });
    
    // Handle learning feedback from renderer
    ipcMain.on('learning-feedback', (event, feedbackData) => {
        try {
            console.log('📝 Received learning feedback:', feedbackData);
            
            if (feedbackData.type === 'suggestion_accepted' || feedbackData.type === 'suggestion_dismissed') {
                // Track this as a learning interaction
                learningIntegration.trackInteraction({
                    component: 'adaptive_ui',
                    action: feedbackData.type,
                    data: feedbackData.data,
                    outcome: 'success',
                    satisfaction: feedbackData.type === 'suggestion_accepted' ? 1.0 : 0.0,
                    features: ['adaptive_ui', 'user_feedback']
                });
            }
        } catch (error) {
            console.error('Error handling learning feedback:', error);
        }
    });
}

// Setup plugin system event handlers
function setupPluginHandlers() {
    if (!pluginManager) return;
    
    // Handle plugin events
    pluginManager.on('plugin-loaded', (plugin) => {
        console.log(`🔌 Plugin loaded: ${plugin.manifest.name}`);
        if (mainWindow) {
            mainWindow.webContents.send('plugin-loaded', {
                id: plugin.id,
                name: plugin.manifest.name,
                version: plugin.manifest.version
            });
        }
    });
    
    pluginManager.on('plugin-unloaded', (data) => {
        console.log(`🔌 Plugin unloaded: ${data.pluginId}`);
        if (mainWindow) {
            mainWindow.webContents.send('plugin-unloaded', data);
        }
    });
    
    pluginManager.on('plugin-enabled', (plugin) => {
        console.log(`🔌 Plugin enabled: ${plugin.manifest.name}`);
        if (mainWindow) {
            mainWindow.webContents.send('plugin-enabled', {
                id: plugin.id,
                name: plugin.manifest.name
            });
        }
    });
    
    pluginManager.on('plugin-disabled', (plugin) => {
        console.log(`🔌 Plugin disabled: ${plugin.manifest.name}`);
        if (mainWindow) {
            mainWindow.webContents.send('plugin-disabled', {
                id: plugin.id,
                name: plugin.manifest.name
            });
        }
    });
    
    // Handle plugin UI events
    pluginManager.on('menu-item-added', (data) => {
        if (mainWindow) {
            mainWindow.webContents.send('plugin-menu-item-added', data);
        }
    });
    
    pluginManager.on('notification', (data) => {
        if (mainWindow) {
            mainWindow.webContents.send('plugin-notification', data);
        }
    });
    
    pluginManager.on('toolbar-button-added', (data) => {
        if (mainWindow) {
            mainWindow.webContents.send('plugin-toolbar-button-added', data);
        }
    });
}

// Setup additional IPC handlers for plugin system
function setupPluginIpcHandlers() {
    if (!pluginManager || !pluginDeveloper) return;
    
    // Plugin management handlers
    ipcMain.handle('plugin:create', async (event, pluginData) => {
        try {
            const pluginPath = await pluginDeveloper.createPlugin(pluginData);
            
            // Automatically load the new plugin
            setTimeout(async () => {
                try {
                    await pluginManager.loadPlugin(pluginData.id);
                } catch (error) {
                    console.error('Error auto-loading new plugin:', error);
                }
            }, 1000);
            
            return { success: true, path: pluginPath };
        } catch (error) {
            console.error('Error creating plugin:', error);
            return { success: false, error: error.message };
        }
    });
    
    ipcMain.handle('plugin:validate', async (event, pluginId) => {
        try {
            const plugin = pluginManager.getPlugin(pluginId);
            if (!plugin) {
                throw new Error('Plugin not found');
            }
            
            const result = pluginDeveloper.validatePlugin(plugin.path);
            return { success: true, ...result };
        } catch (error) {
            console.error('Error validating plugin:', error);
            return { success: false, error: error.message };
        }
    });
    
    ipcMain.handle('plugin:get-templates', async () => {
        try {
            const templates = pluginDeveloper.getTemplates();
            return { success: true, templates };
        } catch (error) {
            console.error('Error getting plugin templates:', error);
            return { success: false, error: error.message };
        }
    });
    
    ipcMain.handle('plugin:package', async (event, pluginId, outputPath) => {
        try {
            const plugin = pluginManager.getPlugin(pluginId);
            if (!plugin) {
                throw new Error('Plugin not found');
            }
            
            const packagePath = await pluginDeveloper.packagePlugin(plugin.path, outputPath);
            return { success: true, path: packagePath };
        } catch (error) {
            console.error('Error packaging plugin:', error);
            return { success: false, error: error.message };
        }
    });
    
    // Trigger plugin hooks for browser events
    ipcMain.handle('plugin:trigger-hook', async (event, hookName, ...args) => {
        try {
            const results = await pluginManager.triggerHook(hookName, ...args);
            return { success: true, results };
        } catch (error) {
            console.error('Error triggering plugin hook:', error);
            return { success: false, error: error.message };
        }
    });
    
    // System integration handlers
    ipcMain.handle('system:open-plugins-folder', async () => {
        try {
            await shell.openPath(pluginManager.pluginsDir);
            return { success: true };
        } catch (error) {
            console.error('Error opening plugins folder:', error);
            return { success: false, error: error.message };
        }
    });
    
    ipcMain.handle('system:get-plugins-dir', async () => {
        try {
            return { success: true, path: pluginManager.pluginsDir };
        } catch (error) {
            console.error('Error getting plugins directory:', error);
            return { success: false, error: error.message };
        }
    });
}

// Setup IPC handlers for crash reporting system
function setupCrashReportingIpcHandlers(crashReportingSystem) {
    const isDevMode = isDev;
    
    // Get crash reporting settings
    ipcMain.handle('crash-reporting:get-settings', async () => {
        try {
            if (!crashReportingSystem) {
                // Return default settings for development mode
                return { 
                    success: true, 
                    settings: {
                        enabled: false,
                        privacy: {
                            collectUserData: false,
                            collectSystemInfo: true,
                            collectPerformanceData: true
                        },
                        retentionDays: 30,
                        performance: {
                            memoryMonitoring: true,
                            cpuMonitoring: true,
                            pageLoadTimes: true,
                            alerts: false
                        }
                    }
                };
            }
            const settings = await crashReportingSystem.getSettings();
            return { success: true, settings };
        } catch (error) {
            console.error('Error getting crash reporting settings:', error);
            return { success: false, error: error.message };
        }
    });
    
    // Update crash reporting settings
    ipcMain.handle('crash-reporting:update-settings', async (event, newSettings) => {
        try {
            if (!crashReportingSystem) {
                // In development mode, just return success without doing anything
                return { success: true, message: 'Settings saved (development mode)' };
            }
            await crashReportingSystem.updateSettings(newSettings);
            return { success: true };
        } catch (error) {
            console.error('Error updating crash reporting settings:', error);
            return { success: false, error: error.message };
        }
    });
    
    // Get crash reports
    ipcMain.handle('crash-reporting:get-reports', async (event, filters) => {
        try {
            if (!crashReportingSystem) {
                // Return empty reports array for development mode
                return { success: true, reports: [] };
            }
            const reports = await crashReportingSystem.getCrashReports(filters);
            return { success: true, reports };
        } catch (error) {
            console.error('Error getting crash reports:', error);
            return { success: false, error: error.message };
        }
    });
    
    // Get crash analytics
    ipcMain.handle('crash-reporting:get-analytics', async (event, timeRange) => {
        try {
            if (!crashReportingSystem) {
                // Return empty analytics for development mode
                return { 
                    success: true, 
                    analytics: {
                        totalCrashes: 0,
                        recentCrashes: 0,
                        storageSize: 0,
                        trends: [],
                        types: {}
                    }
                };
            }
            const analytics = await crashReportingSystem.getAnalytics(timeRange);
            return { success: true, analytics };
        } catch (error) {
            console.error('Error getting crash analytics:', error);
            return { success: false, error: error.message };
        }
    });
    
    // Test crash reporting (development only)
    ipcMain.handle('crash-reporting:test-crash', async () => {
        if (!isDev) {
            return { success: false, error: 'Test crashes only available in development' };
        }
        
        try {
            if (crashReportingSystem) {
                await crashReportingSystem.triggerTestCrash();
            } else {
                // Simulate test crash in development mode
                console.log('🚨 Test crash triggered (development mode)');
                setTimeout(() => {
                    throw new Error('Test crash for crash reporting system verification');
                }, 100);
            }
            return { success: true };
        } catch (error) {
            console.error('Error triggering test crash:', error);
            return { success: false, error: error.message };
        }
    });
    
    // Clear crash reports
    ipcMain.handle('crash-reporting:clear-reports', async () => {
        try {
            if (!crashReportingSystem) {
                return { success: true, message: 'No reports to clear (development mode)' };
            }
            await crashReportingSystem.clearReports();
            return { success: true };
        } catch (error) {
            console.error('Error clearing crash reports:', error);
            return { success: false, error: error.message };
        }
    });
    
    // Export crash reports
    ipcMain.handle('crash-reporting:export-reports', async (event, exportPath) => {
        try {
            if (!crashReportingSystem) {
                return { 
                    success: false, 
                    error: 'Export not available in development mode' 
                };
            }
            const exportedPath = await crashReportingSystem.exportReports(exportPath);
            return { success: true, path: exportedPath };
        } catch (error) {
            console.error('Error exporting crash reports:', error);
            return { success: false, error: error.message };
        }
    });
}

ipcMain.handle('document-scan', async (event, imageData, options = {}) => {
    try {
        // Track OCR usage
        ga.event('Usage', 'DocumentScan', options.language || 'default').send();
        
        // Initialize OCR processor if not already done
        if (!ocrProcessor) {
            await initializeOCRProcessor();
        }
        
        if (!ocrProcessor) {
            throw new Error('OCR processor not available');
        }
        
        // Default options with enhanced settings
        const defaultOptions = {
            language: 'eng',
            psm: 3, // Fully automatic page segmentation
            preprocessImage: true,
            enhanceResults: true,
            filterLowConfidence: true,
            fixCommonErrors: true,
            preserveFormatting: true,
            detectOrientation: false
        };
        
        const finalOptions = { ...defaultOptions, ...options };
        
        // Process with enhanced OCR
        const result = await ocrProcessor.processDocument(imageData, finalOptions);
        
        return result;
        
    } catch (error) {
        console.error('OCR processing error:', error);
        return {
            success: false,
            error: error.message,
            details: error.stack
        };
    }
});

// OCR batch processing handler
ipcMain.handle('document-scan-batch', async (event, documents, options = {}) => {
    try {
        if (!ocrProcessor) {
            await initializeOCRProcessor();
        }
        
        if (!ocrProcessor) {
            throw new Error('OCR processor not available');
        }
        
        const result = await ocrProcessor.processBatch(documents, options);
        return { success: true, results: result };
        
    } catch (error) {
        console.error('OCR batch processing error:', error);
        return {
            success: false,
            error: error.message
        };
    }
});

// OCR language initialization handler
ipcMain.handle('ocr-init-language', async (event, language) => {
    try {
        if (!ocrProcessor) {
            await initializeOCRProcessor();
        }
        
        if (ocrProcessor) {
            await ocrProcessor.initializeWorker(language);
            return { success: true };
        }
        
        throw new Error('OCR processor not available');
        
    } catch (error) {
        console.error('OCR language initialization error:', error);
        return {
            success: false,
            error: error.message
        };
    }
});

// Get available OCR languages
ipcMain.handle('ocr-get-languages', async (event) => {
    try {
        if (!ocrProcessor) {
            await initializeOCRProcessor();
        }
        
        if (ocrProcessor) {
            return {
                success: true,
                languages: ocrProcessor.getAvailableLanguages()
            };
        }
        
        return {
            success: false,
            error: 'OCR processor not available'
        };
        
    } catch (error) {
        console.error('Error getting OCR languages:', error);
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

// I18n (Internationalization) handlers
ipcMain.handle('i18n-get-translations', async (event, langCode) => {
    try {
        const translations = i18n.exportTranslations(langCode);
        return { success: true, translations };
    } catch (error) {
        console.error('I18n get translations error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('i18n-set-language', async (event, langCode) => {
    try {
        const success = await i18n.setLanguage(langCode);
        if (success) {
            // Save language preference
            await storage.setSetting('app.language', langCode);
        }
        return { success };
    } catch (error) {
        console.error('I18n set language error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('i18n-get-available-languages', async (event) => {
    try {
        const languages = i18n.getAvailableLanguages();
        return { success: true, languages };
    } catch (error) {
        console.error('I18n get available languages error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('i18n-get-current-language', async (event) => {
    try {
        const currentLanguage = i18n.getCurrentLanguage();
        const info = i18n.getLanguageInfo(currentLanguage);
        return { success: true, language: currentLanguage, info };
    } catch (error) {
        console.error('I18n get current language error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('i18n-get-language-preference', async (event) => {
    try {
        const savedLanguage = await storage.getSetting('app.language', 'en');
        return savedLanguage;
    } catch (error) {
        console.error('I18n get language preference error:', error);
        return 'en';
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

// Cross-Tab Data Transfer IPC Handlers
ipcMain.handle('cross-tab-register-tab', async (event, tabId, tabInfo) => {
    try {
        if (crossTabTransfer) {
            crossTabTransfer.registerTab(tabId, tabInfo);
            return { success: true };
        }
        return { success: false, error: 'Cross-tab transfer not initialized' };
    } catch (error) {
        console.error('Register tab error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('cross-tab-unregister-tab', async (event, tabId) => {
    try {
        if (crossTabTransfer) {
            crossTabTransfer.unregisterTab(tabId);
            return { success: true };
        }
        return { success: false, error: 'Cross-tab transfer not initialized' };
    } catch (error) {
        console.error('Unregister tab error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('cross-tab-transfer-data', async (event, sourceTabId, targetTabId, data, options) => {
    try {
        if (crossTabTransfer) {
            const result = await crossTabTransfer.transferData(sourceTabId, targetTabId, data, options);
            return result;
        }
        return { success: false, error: 'Cross-tab transfer not initialized' };
    } catch (error) {
        console.error('Cross-tab transfer data error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('cross-tab-sync-data', async (event, tabId, dataType) => {
    try {
        if (crossTabTransfer) {
            await crossTabTransfer.syncTabData(tabId, dataType);
            return { success: true };
        }
        return { success: false, error: 'Cross-tab transfer not initialized' };
    } catch (error) {
        console.error('Cross-tab sync data error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('cross-tab-get-active-tabs', async (event) => {
    try {
        if (crossTabTransfer) {
            const tabs = crossTabTransfer.getTabSessions();
            return { success: true, tabs };
        }
        return { success: false, error: 'Cross-tab transfer not initialized' };
    } catch (error) {
        console.error('Get active tabs error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('cross-tab-get-transfer-history', async (event) => {
    try {
        if (crossTabTransfer) {
            const history = crossTabTransfer.getTransferHistory();
            return { success: true, history };
        }
        return { success: false, error: 'Cross-tab transfer not initialized' };
    } catch (error) {
        console.error('Get transfer history error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('cross-tab-get-metrics', async (event) => {
    try {
        if (crossTabTransfer) {
            const metrics = crossTabTransfer.getMetrics();
            return { success: true, metrics };
        }
        return { success: false, error: 'Cross-tab transfer not initialized' };
    } catch (error) {
        console.error('Get cross-tab metrics error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('cross-tab-update-tab-data', async (event, tabId, data, dataType) => {
    try {
        if (crossTabTransfer) {
            await crossTabTransfer.updateTabData(tabId, data, dataType);
            return { success: true };
        }
        return { success: false, error: 'Cross-tab transfer not initialized' };
    } catch (error) {
        console.error('Update tab data error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('cross-tab-get-tab-data', async (event, tabId, dataType) => {
    try {
        if (crossTabTransfer) {
            const data = await crossTabTransfer.getTabData(tabId, dataType);
            return { success: true, data };
        }
        return { success: false, error: 'Cross-tab transfer not initialized' };
    } catch (error) {
        console.error('Get tab data error:', error);
        return { success: false, error: error.message };
    }
});

// Handle transfer acknowledgments from renderer
ipcMain.handle('cross-tab-transfer-ack', async (event, ackData) => {
    try {
        if (crossTabTransfer) {
            crossTabTransfer.emit('transfer-ack', ackData);
            return { success: true };
        }
        return { success: false, error: 'Cross-tab transfer not initialized' };
    } catch (error) {
        console.error('Transfer ack error:', error);
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

// External Link Handler for Webviews
ipcMain.handle('open-external-link', async (event, url) => {
    try {
        console.log(`Opening external link from webview: ${url}`);
        await shell.openExternal(url);
        return { success: true };
    } catch (error) {
        console.error('Failed to open external link:', error);
        return { success: false, error: error.message };
    }
});

// Graceful shutdown
app.on('before-quit', async () => {
    // Shutdown cross-tab transfer system
    if (crossTabTransfer) {
        await crossTabTransfer.shutdown();
    }
    
    // Clean up chat system
    if (chatManager) {
        await chatManager.stop();
    }
    
    // Clean up auto-updater
    if (autoUpdaterManager) {
        autoUpdaterManager.destroy();
    }
    
    if (storage) {
        await storage.close();
    }
    
    if (platformFeatures) {
        platformFeatures.destroy();
    }
});
