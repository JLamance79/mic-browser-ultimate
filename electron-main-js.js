const { app, BrowserWindow, Menu, ipcMain, dialog, shell, session } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');

// Initialize electron store for settings
const store = new Store();

// Keep a global reference of the window object
let mainWindow;

// Enable live reload for Electron in development
const isDev = process.argv.includes('--dev');

// Security: Enable sandbox for all renderers
app.enableSandbox();

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true,
      webSecurity: !isDev,
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    frame: process.platform !== 'darwin',
    show: false,
    backgroundColor: '#0a0a0a',
  });

  // Load the index.html file
  mainWindow.loadFile('index.html');

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
    app.quit();
  });

  // Set up the menu
  createMenu();

  // Handle new window requests (open in default browser)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Initialize IPC handlers
  initializeIPC();

  // Set up security headers
  setupSecurity();
}

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
          label: 'Close Tab',
          accelerator: 'CmdOrCtrl+W',
          click: () => {
            mainWindow.webContents.send('close-tab');
          },
        },
        { type: 'separator' },
        {
          label: 'Save Page',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('save-page');
          },
        },
        { type: 'separator' },
        {
          label: 'Exit',
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
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: 'Select All', accelerator: 'CmdOrCtrl+A', role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.webContents.send('reload-page');
          },
        },
        {
          label: 'Force Reload',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => {
            mainWindow.webContents.send('force-reload');
          },
        },
        { type: 'separator' },
        {
          label: 'Actual Size',
          accelerator: 'CmdOrCtrl+0',
          click: () => {
            mainWindow.webContents.setZoomLevel(0);
          },
        },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomLevel();
            mainWindow.webContents.setZoomLevel(currentZoom + 0.5);
          },
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomLevel();
            mainWindow.webContents.setZoomLevel(currentZoom - 0.5);
          },
        },
        { type: 'separator' },
        {
          label: 'Toggle Fullscreen',
          accelerator: 'F11',
          click: () => {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
          },
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'F12',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          },
        },
      ],
    },
    {
      label: 'Navigation',
      submenu: [
        {
          label: 'Back',
          accelerator: 'Alt+Left',
          click: () => {
            mainWindow.webContents.send('navigate-back');
          },
        },
        {
          label: 'Forward',
          accelerator: 'Alt+Right',
          click: () => {
            mainWindow.webContents.send('navigate-forward');
          },
        },
        { type: 'separator' },
        {
          label: 'Home',
          accelerator: 'Alt+Home',
          click: () => {
            mainWindow.webContents.send('navigate-home');
          },
        },
        {
          label: 'Focus Address Bar',
          accelerator: 'CmdOrCtrl+L',
          click: () => {
            mainWindow.webContents.send('focus-address-bar');
          },
        },
      ],
    },
    {
      label: 'Mic Assistant',
      submenu: [
        {
          label: 'Toggle Mic',
          accelerator: 'CmdOrCtrl+M',
          click: () => {
            mainWindow.webContents.send('toggle-mic');
          },
        },
        {
          label: 'Open Scanner',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            mainWindow.webContents.send('open-scanner');
          },
        },
        { type: 'separator' },
        {
          label: 'Analyze Current Page',
          click: () => {
            mainWindow.webContents.send('analyze-page');
          },
        },
        {
          label: 'Start Data Transfer',
          click: () => {
            mainWindow.webContents.send('start-transfer');
          },
        },
        {
          label: 'Generate Report',
          click: () => {
            mainWindow.webContents.send('generate-report');
          },
        },
        { type: 'separator' },
        {
          label: 'Mic Settings',
          click: () => {
            mainWindow.webContents.send('open-mic-settings');
          },
        },
      ],
    },
    {
      label: 'Bookmarks',
      submenu: [
        {
          label: 'Bookmark This Page',
          accelerator: 'CmdOrCtrl+D',
          click: () => {
            mainWindow.webContents.send('bookmark-page');
          },
        },
        {
          label: 'Show All Bookmarks',
          accelerator: 'CmdOrCtrl+Shift+B',
          click: () => {
            mainWindow.webContents.send('show-bookmarks');
          },
        },
        { type: 'separator' },
        {
          label: 'Import Bookmarks',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile'],
              filters: [
                { name: 'HTML Files', extensions: ['html', 'htm'] },
                { name: 'JSON Files', extensions: ['json'] },
              ],
            });
            if (!result.canceled) {
              mainWindow.webContents.send('import-bookmarks', result.filePaths[0]);
            }
          },
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Mic Browser',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Mic Browser',
              message: 'Mic Browser v1.0.0',
              detail:
                'An AI-powered web browser with integrated LLM assistant.\n\nMic understands and automates web applications, making your browsing experience intelligent and efficient.\n\n© 2024 Your Company',
              buttons: ['OK'],
            });
          },
        },
        {
          label: 'Documentation',
          click: () => {
            shell.openExternal('https://github.com/yourusername/mic-browser/wiki');
          },
        },
        {
          label: 'Report Issue',
          click: () => {
            shell.openExternal('https://github.com/yourusername/mic-browser/issues');
          },
        },
        { type: 'separator' },
        {
          label: 'Check for Updates',
          click: () => {
            mainWindow.webContents.send('check-updates');
          },
        },
      ],
    },
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { label: 'About Mic Browser', role: 'about' },
        { type: 'separator' },
        {
          label: 'Preferences...',
          accelerator: 'Cmd+,',
          click: () => {
            mainWindow.webContents.send('open-preferences');
          },
        },
        { type: 'separator' },
        { label: 'Services', role: 'services', submenu: [] },
        { type: 'separator' },
        { label: 'Hide Mic Browser', accelerator: 'Cmd+H', role: 'hide' },
        { label: 'Hide Others', accelerator: 'Cmd+Shift+H', role: 'hideothers' },
        { label: 'Show All', role: 'unhide' },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'Cmd+Q', click: () => app.quit() },
      ],
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function initializeIPC() {
  // Handle file operations
  ipcMain.handle('save-file', async (event, data) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: data.filename || 'document.html',
      filters: data.filters || [
        { name: 'HTML Files', extensions: ['html'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (!result.canceled) {
      fs.writeFileSync(result.filePath, data.content);
      return { success: true, path: result.filePath };
    }
    return { success: false };
  });

  ipcMain.handle('read-file', async (event, path) => {
    try {
      const content = fs.readFileSync(path, 'utf8');
      return { success: true, content };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Handle settings storage
  ipcMain.handle('get-setting', (event, key) => {
    return store.get(key);
  });

  ipcMain.handle('set-setting', (event, key, value) => {
    store.set(key, value);
    return true;
  });

  // Handle scan operations
  ipcMain.handle('scan-document', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp'] },
        { name: 'PDF Files', extensions: ['pdf'] },
      ],
    });

    if (!result.canceled) {
      // Here you would integrate with an OCR service
      // For now, return the file path
      return { success: true, path: result.filePaths[0] };
    }
    return { success: false };
  });

  // Handle browser operations
  ipcMain.handle('create-webview', () => {
    // This would create a new webview/browserView
    // For now, just acknowledge the request
    return { success: true, id: Date.now() };
  });

  // Handle LLM/AI operations (placeholder for API integration)
  ipcMain.handle('ai-request', async (_event, request) => {
    // Here you would integrate with Claude/GPT API
    // For now, return a mock response
    return {
      success: true,
      response: `Processing request: ${request.command}`,
      timestamp: new Date().toISOString(),
    };
  });

  // Handle data transfer between tabs
  ipcMain.handle('transfer-data', (event, data) => {
    // Broadcast to all webviews/tabs
    mainWindow.webContents.send('data-received', data);
    return { success: true };
  });

  // Handle clipboard operations
  ipcMain.handle('clipboard-write', (event, text) => {
    const { clipboard } = require('electron');
    clipboard.writeText(text);
    return { success: true };
  });

  ipcMain.handle('clipboard-read', () => {
    const { clipboard } = require('electron');
    return clipboard.readText();
  });
}

function setupSecurity() {
  // Set Content Security Policy
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob:",
        ],
      },
    });
  });

  // Prevent new window creation except from our app
  app.on('web-contents-created', (event, contents) => {
    contents.on('new-window', (event, navigationUrl) => {
      // Log and prevent new window
      console.log('Prevented new window:', navigationUrl);
      event.preventDefault();
    });
  });
}

// App event handlers
app.whenReady().then(() => {
  createWindow();

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

// Handle certificate errors
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (isDev) {
    // Ignore certificate errors in development
    event.preventDefault();
    callback(true);
  } else {
    // Use default behavior in production
    callback(false);
  }
});

// Prevent navigation to external protocols
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);

    if (
      parsedUrl.protocol !== 'https:' &&
      parsedUrl.protocol !== 'http:' &&
      parsedUrl.protocol !== 'file:'
    ) {
      console.log('Prevented navigation to:', navigationUrl);
      event.preventDefault();
    }
  });
});

// Auto-updater configuration (if using electron-updater)
if (!isDev) {
  const { autoUpdater } = require('electron-updater');

  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on('update-available', () => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Available',
      message:
        'A new version of Mic Browser is available. It will be downloaded in the background.',
      buttons: ['OK'],
    });
  });

  autoUpdater.on('update-downloaded', () => {
    dialog
      .showMessageBox(mainWindow, {
        type: 'info',
        title: 'Update Ready',
        message: 'Update downloaded. The application will restart to apply the update.',
        buttons: ['Restart Now', 'Later'],
      })
      .then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
  });
}

// Export for testing purposes
module.exports = { createWindow, createMenu };
