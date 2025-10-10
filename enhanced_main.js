require('dotenv').config();
const {
  app,
  BrowserWindow,
  Menu,
  ipcMain,
  dialog,
  shell,
  session,
  globalShortcut,
  powerSaveBlocker,
} = require('electron');
const path = require('path');
const Store = require('electron-store');
const { autoUpdater } = require('electron-updater');

// AI and OCR imports
const Anthropic = require('@anthropic-ai/sdk');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');

// Advanced system imports
const WorkflowRecorder = require('./core/workflow-recorder');
const UniversalDataBridge = require('./core/universal-data-bridge');
const TeamCollaboration = require('./core/team-collaboration');
const PhoneScannerServer = require('./core/phone-scanner-server');
const AITrainingSystem = require('./ai/ai-training-customization');
const PredictiveAutomation = require('./ai/predictive-automation');
const VoiceAssistant = require('./ai/voice-assistant');
const AdvancedSecurity = require('./security/advanced-security');
const BusinessIntelligence = require('./analytics/business-intelligence');

// Initialize secure storage
const store = new Store({
  encryptionKey: 'mic-browser-secure-key-' + require('os').hostname(),
  schema: {
    apiKeys: {
      type: 'object',
      properties: {
        claude: { type: 'string' },
        openai: { type: 'string' },
        google: { type: 'string' },
      },
    },
    userProfile: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        role: { type: 'string' },
        permissions: { type: 'array' },
      },
    },
    settings: {
      type: 'object',
      properties: {
        theme: { type: 'string', default: 'dark' },
        aiModel: { type: 'string', default: 'claude-3-sonnet' },
        autoSave: { type: 'boolean', default: true },
        voiceEnabled: { type: 'boolean', default: false },
        securityLevel: { type: 'string', default: 'standard' },
      },
    },
  },
});

// Global application state
let mainWindow;
let splashWindow;
const subsystems = new Map();
const activeWorkflows = new Map();
const connectedDevices = new Map();

// Performance monitoring
const performance = {
  startTime: Date.now(),
  metrics: {
    memoryUsage: [],
    cpuUsage: [],
    aiRequests: 0,
    ocrProcesses: 0,
    workflowsExecuted: 0,
    errorsHandled: 0,
  },
};

// Enable live reload for development
const isDev = process.argv.includes('--dev');
if (isDev) {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
    hardResetMethod: 'exit',
  });
}

class MicBrowserCore {
  constructor() {
    this.isInitialized = false;
    this.startupTasks = [];
    this.shutdownTasks = [];
    this.healthChecks = new Map();
  }

  async initialize() {
    try {
      console.log('🚀 Initializing MIC Browser Ultimate...');

      // Initialize core subsystems
      await this.initializeSubsystems();

      // Setup security
      await this.setupSecurity();

      // Initialize AI systems
      await this.initializeAI();

      // Setup IPC handlers
      this.setupIPCHandlers();

      // Initialize monitoring
      this.startHealthMonitoring();

      this.isInitialized = true;
      console.log('✅ MIC Browser Ultimate initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize MIC Browser:', error);
      throw error;
    }
  }

  async initializeSubsystems() {
    const systems = [
      { name: 'workflowRecorder', class: WorkflowRecorder, deps: [] },
      { name: 'dataBridge', class: UniversalDataBridge, deps: [] },
      { name: 'collaboration', class: TeamCollaboration, deps: [] },
      { name: 'phoneScanner', class: PhoneScannerServer, deps: [] },
      { name: 'aiTraining', class: AITrainingSystem, deps: ['aiCore'] },
      { name: 'predictive', class: PredictiveAutomation, deps: ['aiCore', 'workflowRecorder'] },
      { name: 'voice', class: VoiceAssistant, deps: ['aiCore'] },
      { name: 'security', class: AdvancedSecurity, deps: [] },
      { name: 'analytics', class: BusinessIntelligence, deps: ['dataBridge'] },
    ];

    for (const system of systems) {
      try {
        console.log(`Initializing ${system.name}...`);

        // Prepare dependencies
        const deps = system.deps.map((dep) => subsystems.get(dep));

        // Initialize system
        const instance = new system.class(mainWindow, ...deps);
        await instance.initialize?.();

        subsystems.set(system.name, instance);

        console.log(`✅ ${system.name} initialized`);
      } catch (error) {
        console.error(`❌ Failed to initialize ${system.name}:`, error);
        // Continue with other systems
      }
    }
  }

  async setupSecurity() {
    // Configure CSP
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob: wss:;",
          ],
          'X-Frame-Options': ['DENY'],
          'X-Content-Type-Options': ['nosniff'],
          'Referrer-Policy': ['strict-origin-when-cross-origin'],
        },
      });
    });

    // Block dangerous protocols
    app.setAsDefaultProtocolClient('mic-browser');

    // Setup certificate transparency
    app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
      if (isDev) {
        event.preventDefault();
        callback(true);
      } else {
        // Log security event
        subsystems.get('security')?.logSecurityEvent({
          type: 'certificate_error',
          url: url,
          error: error,
        });
        callback(false);
      }
    });
  }

  async initializeAI() {
    // Initialize Claude
    const claudeKey = store.get('apiKeys.claude');
    if (claudeKey) {
      this.anthropic = new Anthropic({
        apiKey: claudeKey,
      });
    }

    // Initialize OCR
    this.ocrWorker = await Tesseract.createWorker({
      logger: (m) => this.handleOCRProgress(m),
      errorHandler: (err) => console.error('OCR Error:', err),
    });

    await this.ocrWorker.loadLanguage('eng+spa+fra+deu');
    await this.ocrWorker.initialize('eng+spa+fra+deu');

    // Optimize OCR settings
    await this.ocrWorker.setParameters({
      tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
      preserve_interword_spaces: '1',
      tessedit_pageseg_mode: Tesseract.PSM.AUTO,
    });

    console.log('✅ AI systems initialized');
  }

  setupIPCHandlers() {
    // AI Chat Handler
    ipcMain.handle('ai-chat', async (event, request) => {
      try {
        performance.metrics.aiRequests++;

        const response = await this.processAIRequest(request);

        // Log interaction for training
        subsystems.get('aiTraining')?.recordInteraction(request, response);

        return response;
      } catch (error) {
        performance.metrics.errorsHandled++;
        return {
          success: false,
          error: error.message,
          fallback: 'I encountered an error processing your request. Please try again.',
        };
      }
    });

    // OCR Processing Handler
    ipcMain.handle('process-ocr', async (event, imageData, options = {}) => {
      try {
        performance.metrics.ocrProcesses++;

        // Preprocess image
        const processedImage = await this.preprocessImage(imageData);

        // Perform OCR
        const { data } = await this.ocrWorker.recognize(processedImage);

        // Post-process with AI enhancement
        const enhancedData = await this.enhanceOCRWithAI(data.text, options.documentType);

        return {
          success: true,
          rawText: data.text,
          confidence: data.confidence,
          extractedData: enhancedData,
          boundingBoxes: data.words,
        };
      } catch (error) {
        performance.metrics.errorsHandled++;
        return {
          success: false,
          error: error.message,
        };
      }
    });

    // Workflow Execution
    ipcMain.handle('execute-workflow', async (event, workflowId, parameters) => {
      try {
        performance.metrics.workflowsExecuted++;

        const workflow = subsystems.get('workflowRecorder');
        const result = await workflow.executeWorkflow(workflowId, parameters);

        return result;
      } catch (error) {
        performance.metrics.errorsHandled++;
        return { success: false, error: error.message };
      }
    });

    // Security Operations
    ipcMain.handle('security-operation', async (event, operation, data) => {
      const security = subsystems.get('security');
      return await security.handleOperation(operation, data);
    });

    // Analytics Queries
    ipcMain.handle('analytics-query', async (event, query) => {
      const analytics = subsystems.get('analytics');
      return await analytics.executeQuery(query);
    });

    // System Health Check
    ipcMain.handle('health-check', async () => {
      return {
        status: 'healthy',
        uptime: Date.now() - performance.startTime,
        metrics: performance.metrics,
        subsystems: Object.fromEntries(
          Array.from(subsystems.entries()).map(([name, system]) => [
            name,
            system.getHealth ? system.getHealth() : 'unknown',
          ])
        ),
      };
    });
  }

  async processAIRequest(request) {
    if (!this.anthropic) {
      throw new Error('Claude API not configured');
    }

    // Check if this is a predictive automation request
    const predictive = subsystems.get('predictive');
    const prediction = await predictive?.shouldPredict(request);

    if (prediction) {
      return prediction;
    }

    // Build context-aware prompt
    const context = await this.buildContext(request);

    const message = await this.anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 2048,
      temperature: 0.7,
      system: this.buildSystemPrompt(context),
      messages: request.messages || [{ role: 'user', content: request.message }],
    });

    const response = {
      success: true,
      content: message.content[0].text,
      usage: message.usage,
      actions: this.extractActions(message.content[0].text),
    };

    // Execute any actions
    if (response.actions.length > 0) {
      for (const action of response.actions) {
        await this.executeAction(action);
      }
    }

    return response;
  }

  buildSystemPrompt(context) {
    return `You are Mic, the most advanced AI browser assistant ever created. You have access to:

CAPABILITIES:
- Advanced OCR and document processing
- Workflow automation and recording
- Cross-application data transfer
- Predictive task automation
- Voice commands and natural language
- Real-time collaboration tools
- Enterprise security and compliance
- Analytics and business intelligence
- Multi-device synchronization

CURRENT CONTEXT:
- URL: ${context.url}
- Page Structure: ${JSON.stringify(context.pageStructure)}
- User Profile: ${JSON.stringify(context.userProfile)}
- Active Workflows: ${context.activeWorkflows}
- Connected Devices: ${context.connectedDevices}

AVAILABLE ACTIONS:
Use [ACTION: action_name, params: {...}] format for:
- fill_form: Auto-populate form fields
- scan_document: Process document with OCR
- transfer_data: Move data between applications
- execute_workflow: Run saved automation
- analyze_page: Study page structure
- voice_command: Process speech input
- secure_action: Handle sensitive operations
- collaborate: Share with team members
- predict_next: Anticipate user needs

You are proactive, intelligent, and always looking for ways to save time and increase productivity.`;
  }

  async buildContext(request) {
    return {
      url: request.url || 'unknown',
      pageStructure: request.pageStructure || {},
      userProfile: store.get('userProfile') || {},
      activeWorkflows: Array.from(activeWorkflows.keys()),
      connectedDevices: Array.from(connectedDevices.keys()),
      timestamp: new Date().toISOString(),
    };
  }

  extractActions(content) {
    const actions = [];
    const actionRegex = /\[ACTION:\s*([^,]+),\s*params:\s*({[^}]+})\]/g;
    let match;

    while ((match = actionRegex.exec(content)) !== null) {
      try {
        actions.push({
          action: match[1].trim(),
          params: JSON.parse(match[2]),
        });
      } catch (e) {
        console.error('Failed to parse action:', match[0]);
      }
    }

    return actions;
  }

  async executeAction(actionData) {
    const { action, params } = actionData;

    switch (action) {
      case 'fill_form':
        return await this.executeFormFill(params);
      case 'scan_document':
        return await this.executeScan(params);
      case 'transfer_data':
        return await this.executeTransfer(params);
      case 'execute_workflow':
        return await this.executeWorkflowAction(params);
      case 'analyze_page':
        return await this.executePageAnalysis(params);
      default:
        console.log('Unknown action:', action);
        return { success: false, error: 'Unknown action' };
    }
  }

  async preprocessImage(imageData) {
    // Enhance image for better OCR
    return await sharp(Buffer.from(imageData, 'base64'))
      .resize(2000, 2000, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .normalize()
      .sharpen()
      .toBuffer();
  }

  async enhanceOCRWithAI(rawText, documentType) {
    if (!this.anthropic) return { rawText };

    try {
      const prompt = `Extract structured data from this ${documentType || 'document'} OCR text:

${rawText}

Return only valid JSON with extracted fields like:
{"name": "...", "address": "...", "number": "...", "date": "..."}`;

      const message = await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 512,
        temperature: 0,
        messages: [{ role: 'user', content: prompt }],
      });

      const jsonMatch = message.content[0].text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('AI enhancement failed:', error);
    }

    return { rawText };
  }

  handleOCRProgress(progress) {
    mainWindow?.webContents.send('ocr-progress', progress);
  }

  startHealthMonitoring() {
    // Monitor system health every 30 seconds
    setInterval(async () => {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      performance.metrics.memoryUsage.push({
        timestamp: Date.now(),
        rss: memUsage.rss,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
      });

      performance.metrics.cpuUsage.push({
        timestamp: Date.now(),
        user: cpuUsage.user,
        system: cpuUsage.system,
      });

      // Keep only last 100 entries
      if (performance.metrics.memoryUsage.length > 100) {
        performance.metrics.memoryUsage.shift();
      }
      if (performance.metrics.cpuUsage.length > 100) {
        performance.metrics.cpuUsage.shift();
      }

      // Check for issues
      const heapUsed = memUsage.heapUsed / (1024 * 1024); // MB
      if (heapUsed > 1024) {
        // Over 1GB
        console.warn('High memory usage detected:', heapUsed, 'MB');
        if (global.gc) global.gc(); // Force garbage collection if available
      }

      // Send health update to renderer
      mainWindow?.webContents.send('system-health', {
        memory: heapUsed,
        uptime: Date.now() - performance.startTime,
        metrics: performance.metrics,
      });
    }, 30000);
  }

  async shutdown() {
    console.log('🔄 Shutting down MIC Browser...');

    // Execute shutdown tasks
    for (const task of this.shutdownTasks) {
      try {
        await task();
      } catch (error) {
        console.error('Shutdown task failed:', error);
      }
    }

    // Cleanup subsystems
    for (const [name, system] of subsystems) {
      try {
        await system.shutdown?.();
        console.log(`✅ ${name} shut down`);
      } catch (error) {
        console.error(`❌ Failed to shut down ${system}:`, error);
      }
    }

    // Cleanup OCR
    if (this.ocrWorker) {
      await this.ocrWorker.terminate();
    }

    console.log('✅ MIC Browser shutdown complete');
  }
}

// Create main window
function createWindow() {
  // Create splash screen
  splashWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  splashWindow.loadFile('splash.html');

  // Create main window
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1200,
    minHeight: 800,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true,
      webSecurity: !isDev,
      experimentalFeatures: true,
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#0a0a0a',
  });

  mainWindow.loadFile('index.html');

  // Show main window when ready
  mainWindow.once('ready-to-show', async () => {
    splashWindow.destroy();
    mainWindow.show();

    if (isDev) {
      mainWindow.webContents.openDevTools();
    }

    // Initialize core system
    const micCore = new MicBrowserCore();
    try {
      await micCore.initialize();

      // Send initialization complete
      mainWindow.webContents.send('system-ready', {
        version: app.getVersion(),
        features: Array.from(subsystems.keys()),
        performance: performance.metrics,
      });
    } catch (error) {
      console.error('Failed to initialize core:', error);
      dialog.showErrorBox(
        'Initialization Error',
        'Failed to initialize MIC Browser. Please check your configuration and try again.'
      );
    }
  });

  // Handle window events
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Setup global shortcuts
  globalShortcut.register('CommandOrControl+Shift+M', () => {
    mainWindow.webContents.send('toggle-mic-assistant');
  });

  globalShortcut.register('CommandOrControl+Shift+S', () => {
    mainWindow.webContents.send('quick-scan');
  });

  globalShortcut.register('CommandOrControl+Shift+V', () => {
    mainWindow.webContents.send('voice-command');
  });

  // Prevent power suspension during long operations
  const powerBlocker = powerSaveBlocker.start('prevent-app-suspension');
  mainWindow.on('closed', () => {
    powerSaveBlocker.stop(powerBlocker);
  });

  createMenu();
  setupAutoUpdater();
}

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Workspace',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow.webContents.send('new-workspace'),
        },
        {
          label: 'Open Workflow',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow.webContents.send('open-workflow'),
        },
        {
          label: 'Save Workflow',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow.webContents.send('save-workflow'),
        },
        { type: 'separator' },
        {
          label: 'Import Data',
          click: () => mainWindow.webContents.send('import-data'),
        },
        {
          label: 'Export Results',
          click: () => mainWindow.webContents.send('export-results'),
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: 'AI Assistant',
      submenu: [
        {
          label: 'Toggle Assistant',
          accelerator: 'CmdOrCtrl+Shift+M',
          click: () => mainWindow.webContents.send('toggle-mic-assistant'),
        },
        {
          label: 'Voice Commands',
          accelerator: 'CmdOrCtrl+Shift+V',
          click: () => mainWindow.webContents.send('voice-command'),
        },
        {
          label: 'Quick Scan',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => mainWindow.webContents.send('quick-scan'),
        },
        { type: 'separator' },
        {
          label: 'Train Custom Intent',
          click: () => mainWindow.webContents.send('train-intent'),
        },
        {
          label: 'View Learning Progress',
          click: () => mainWindow.webContents.send('view-learning'),
        },
        { type: 'separator' },
        {
          label: 'Configure API Keys',
          click: () => mainWindow.webContents.send('configure-api'),
        },
      ],
    },
    {
      label: 'Automation',
      submenu: [
        {
          label: 'Record Workflow',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow.webContents.send('record-workflow'),
        },
        {
          label: 'Predictive Mode',
          type: 'checkbox',
          checked: true,
          click: (item) => mainWindow.webContents.send('toggle-predictive', item.checked),
        },
        {
          label: 'Auto-Healing',
          type: 'checkbox',
          checked: true,
          click: (item) => mainWindow.webContents.send('toggle-auto-healing', item.checked),
        },
        { type: 'separator' },
        {
          label: 'Workflow Library',
          click: () => mainWindow.webContents.send('workflow-library'),
        },
        {
          label: 'Marketplace',
          click: () => mainWindow.webContents.send('marketplace'),
        },
      ],
    },
    {
      label: 'Analytics',
      submenu: [
        {
          label: 'Dashboard',
          click: () => mainWindow.webContents.send('show-dashboard'),
        },
        {
          label: 'Performance Report',
          click: () => mainWindow.webContents.send('performance-report'),
        },
        {
          label: 'Usage Statistics',
          click: () => mainWindow.webContents.send('usage-stats'),
        },
        {
          label: 'ROI Calculator',
          click: () => mainWindow.webContents.send('roi-calculator'),
        },
      ],
    },
    {
      label: 'Security',
      submenu: [
        {
          label: 'Security Dashboard',
          click: () => mainWindow.webContents.send('security-dashboard'),
        },
        {
          label: 'Audit Log',
          click: () => mainWindow.webContents.send('audit-log'),
        },
        {
          label: 'Compliance Report',
          click: () => mainWindow.webContents.send('compliance-report'),
        },
        { type: 'separator' },
        {
          label: 'Backup Data',
          click: () => mainWindow.webContents.send('backup-data'),
        },
        {
          label: 'Encrypt Workspace',
          click: () => mainWindow.webContents.send('encrypt-workspace'),
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Getting Started',
          click: () => shell.openExternal('https://micbrowser.com/docs'),
        },
        {
          label: 'Keyboard Shortcuts',
          click: () => mainWindow.webContents.send('show-shortcuts'),
        },
        {
          label: 'Video Tutorials',
          click: () => shell.openExternal('https://micbrowser.com/tutorials'),
        },
        { type: 'separator' },
        {
          label: 'Report Issue',
          click: () => shell.openExternal('https://github.com/micbrowser/issues'),
        },
        {
          label: 'Feature Request',
          click: () => shell.openExternal('https://micbrowser.com/feature-request'),
        },
        { type: 'separator' },
        {
          label: 'About MIC Browser',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About MIC Browser',
              message: `MIC Browser Ultimate v${app.getVersion()}`,
              detail:
                "The World's Most Advanced AI-Powered Browser\n\nFeatures:\n• Advanced AI Assistant\n• Intelligent Automation\n• Cross-Platform Sync\n• Enterprise Security\n• Voice Commands\n• OCR Processing\n• Predictive Analytics\n\n© 2024 MIC Browser Inc.",
            });
          },
        },
      ],
    },
  ];

  // macOS specific adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Auto-updater setup
function setupAutoUpdater() {
  if (isDev) return;

  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on('update-available', () => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: 'A new version is available. It will be downloaded in the background.',
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
  globalShortcut.unregisterAll();

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async (event) => {
  event.preventDefault();

  // Graceful shutdown
  const micCore = global.micCore;
  if (micCore) {
    await micCore.shutdown();
  }

  app.exit();
});

// Handle deep links
app.on('open-url', (event, url) => {
  event.preventDefault();
  mainWindow?.webContents.send('deep-link', url);
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });

  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.origin !== mainWindow.webContents.getURL()) {
      event.preventDefault();
    }
  });
});

module.exports = { createWindow };
