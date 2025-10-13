require('dotenv').config();
const { app, BrowserWindow, Menu, ipcMain, dialog, globalShortcut } = require('electron');

const path = require('path');
const fs = require('fs').promises;
const Store = require('electron-store');

// Core integrations - only load what's essential
let Anthropic, Tesseract, sharp;
try {
  Anthropic = require('@anthropic-ai/sdk');
  Tesseract = require('tesseract.js');
  sharp = require('sharp');
} catch (error) {
  console.log('⚠️ Some optional dependencies not installed. Install them for full functionality.');
}

// Initialize secure storage
const store = new Store({
  encryptionKey: 'mic-browser-' + require('os').hostname(),
  schema: {
    apiKeys: {
      type: 'object',
      properties: {
        claude: { type: 'string' },
      },
    },
    settings: {
      type: 'object',
      properties: {
        theme: { type: 'string', default: 'dark' },
        aiEnabled: { type: 'boolean', default: true },
        ocrEnabled: { type: 'boolean', default: true },
      },
    },
  },
});

// Global application state
let mainWindow;
let micCore;
const isDev = process.argv.includes('--dev');

// Core MIC Browser System
class MICBrowserCore {
  constructor() {
    this.initialized = false;
    this.ai = null;
    this.ocr = null;
    this.workflows = new Map();
    this.sessions = new Map();

    // Performance tracking
    this.metrics = {
      startTime: Date.now(),
      aiRequests: 0,
      ocrProcesses: 0,
      workflowsExecuted: 0,
    };
  }

  async initialize() {
    try {
      console.log('🚀 Initializing MIC Browser Core...');

      // Initialize AI if available
      if (Anthropic) {
        await this.initializeAI();
      }

      // Initialize OCR if available
      if (Tesseract) {
        await this.initializeOCR();
      }

      // Initialize basic workflow system
      this.initializeWorkflows();

      // Setup IPC handlers
      this.setupIPCHandlers();

      this.initialized = true;
      console.log('✅ MIC Browser Core initialized successfully');

      // Notify renderer
      if (mainWindow) {
        mainWindow.webContents.send('core-initialized', {
          aiEnabled: !!this.ai,
          ocrEnabled: !!this.ocr,
          features: this.getAvailableFeatures(),
        });
      }
    } catch (error) {
      console.error('❌ MIC Browser initialization failed:', error);
      throw error;
    }
  }

  async initializeAI() {
    const apiKey = store.get('apiKeys.claude');
    if (!apiKey) {
      console.log('⚠️ Claude API key not configured');
      return;
    }

    try {
      this.ai = new Anthropic({
        apiKey: apiKey,
      });

      // Test connection
      await this.testAIConnection();
      console.log('🧠 Claude AI initialized');
    } catch (error) {
      console.error('❌ AI initialization failed:', error);
      this.ai = null;
    }
  }

  async testAIConnection() {
    try {
      const response = await this.ai.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 50,
        messages: [
          {
            role: 'user',
            content: 'Respond with exactly: "MIC Browser AI ready"',
          },
        ],
      });

      if (!response.content[0].text.includes('MIC Browser AI ready')) {
        throw new Error('Unexpected AI response');
      }
    } catch (error) {
      throw new Error(`AI connection test failed: ${error.message}`);
    }
  }

  async initializeOCR() {
    try {
      this.ocr = await Tesseract.createWorker({
        logger: (m) => {
          if (mainWindow) {
            mainWindow.webContents.send('ocr-progress', m);
          }
        },
      });

      await this.ocr.loadLanguage('eng');
      await this.ocr.initialize('eng');

      // Optimize for document processing
      await this.ocr.setParameters({
        tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
        preserve_interword_spaces: '1',
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
      });

      console.log('📄 OCR engine initialized');
    } catch (error) {
      console.error('❌ OCR initialization failed:', error);
      this.ocr = null;
    }
  }

  initializeWorkflows() {
    // Basic workflow storage
    this.workflows.set('example', {
      id: 'example',
      name: 'Example Workflow',
      steps: [
        { type: 'navigate', url: 'https://example.com' },
        { type: 'click', selector: '#button' },
        { type: 'input', selector: '#field', value: 'test' },
      ],
    });

    console.log('🔄 Basic workflow system initialized');
  }

  setupIPCHandlers() {
    // AI Request Handler
    ipcMain.handle('ai-request', async (event, request) => {
      if (!this.ai) {
        return {
          success: false,
          error: 'AI not available. Please configure your Claude API key.',
        };
      }

      try {
        this.metrics.aiRequests++;

        const response = await this.ai.messages.create({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: request.maxTokens || 1500,
          temperature: request.temperature || 0.7,
          system: this.buildSystemPrompt(request.context || {}),
          messages: [
            {
              role: 'user',
              content: request.message || request.command,
            },
          ],
        });

        const content = response.content[0].text;
        const actions = this.extractActions(content);

        return {
          success: true,
          content: content,
          actions: actions,
          usage: response.usage,
        };
      } catch (error) {
        console.error('AI request failed:', error);
        return {
          success: false,
          error: error.message,
          fallback: 'I encountered an error processing your request. Please try again.',
        };
      }
    });

    // OCR Handler
    ipcMain.handle('process-ocr', async (event, imageData, options = {}) => {
      if (!this.ocr) {
        return {
          success: false,
          error: 'OCR not available. Please check your installation.',
        };
      }

      try {
        this.metrics.ocrProcesses++;

        let processedImage = imageData;

        // Preprocess image if sharp is available
        if (sharp && Buffer.isBuffer(imageData)) {
          processedImage = await sharp(imageData)
            .resize(2000, 2000, {
              fit: 'inside',
              withoutEnlargement: true,
            })
            .normalize()
            .sharpen()
            .toBuffer();
        }

        // Perform OCR
        const { data } = await this.ocr.recognize(processedImage);

        // Extract structured data based on document type
        const extractedData = this.extractStructuredData(data.text, options.documentType || 'auto');

        // Enhance with AI if available
        let enhancedData = extractedData;
        if (this.ai && data.text.trim().length > 10) {
          try {
            enhancedData = await this.enhanceOCRWithAI(data.text, options.documentType);
          } catch (aiError) {
            console.log('AI enhancement failed, using basic extraction');
          }
        }

        return {
          success: true,
          rawText: data.text,
          confidence: data.confidence,
          extractedData: { ...extractedData, ...enhancedData },
          boundingBoxes: data.words.map((word) => ({
            text: word.text,
            bbox: word.bbox,
            confidence: word.confidence,
          })),
        };
      } catch (error) {
        console.error('OCR processing failed:', error);
        return {
          success: false,
          error: error.message,
        };
      }
    });

    // Settings Management
    ipcMain.handle('get-setting', (event, key) => {
      return store.get(key);
    });

    ipcMain.handle('set-setting', (event, key, value) => {
      store.set(key, value);

      // Re-initialize AI if API key changed
      if (key === 'apiKeys.claude') {
        this.initializeAI().catch(console.error);
      }

      return true;
    });

    // Workflow Execution
    ipcMain.handle('execute-workflow', async (event, workflowId, parameters = {}) => {
      try {
        this.metrics.workflowsExecuted++;

        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
          throw new Error(`Workflow not found: ${workflowId}`);
        }

        const result = await this.executeWorkflow(workflow, parameters);
        return { success: true, result };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // File Operations
    ipcMain.handle('save-file', async (event, data) => {
      try {
        const result = await dialog.showSaveDialog(mainWindow, {
          defaultPath: data.filename || 'document.txt',
          filters: data.filters || [{ name: 'All Files', extensions: ['*'] }],
        });

        if (!result.canceled) {
          await fs.writeFile(result.filePath, data.content);
          return { success: true, path: result.filePath };
        }

        return { success: false, canceled: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // System Health
    ipcMain.handle('get-system-health', () => {
      return {
        uptime: Date.now() - this.metrics.startTime,
        aiAvailable: !!this.ai,
        ocrAvailable: !!this.ocr,
        metrics: this.metrics,
        memory: process.memoryUsage(),
      };
    });
  }

  buildSystemPrompt(context) {
    return `You are MIC, an advanced AI browser assistant. You help users automate web tasks, process documents, and work more efficiently.

Current Context:
- URL: ${context.url || 'Not specified'}
- Page Title: ${context.title || 'Not specified'}
- Available Actions: fill forms, extract data, navigate pages, analyze content

When you need to perform actions, format them as:
[ACTION: action_name, params: {"param1": "value1"}]

Available actions:
- fill_form: Fill form fields automatically
- click_element: Click on page elements  
- navigate_to: Navigate to a URL
- extract_data: Extract data from the page
- scan_document: Process document with OCR
- execute_workflow: Run a saved workflow

Be helpful, concise, and actionable in your responses.`;
  }

  extractActions(content) {
    const actions = [];
    const actionRegex = /\[ACTION:\s*([^,]+),\s*params:\s*(\{[^}]*\})\]/g;
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

  extractStructuredData(text, documentType) {
    const data = {};

    // Common patterns for different document types
    if (documentType === 'drivers_license' || documentType === 'auto') {
      // Driver's License patterns
      const patterns = {
        licenseNumber: /(?:DL|License|LIC)\s*[#:]?\s*([A-Z0-9-]{6,})/i,
        name: /^([A-Z][a-z]+)\s+([A-Z][a-z]+)/m,
        dob: /(?:DOB|Born)\s*[:]?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
        expiration: /(?:EXP|Expires?)\s*[:]?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
        address: /(\d+\s+[A-Za-z\s]+(?:St|Ave|Rd|Dr|Ln|Blvd)[^0-9]*)/i,
      };

      for (const [field, pattern] of Object.entries(patterns)) {
        const match = text.match(pattern);
        if (match) {
          if (field === 'name' && match.length > 2) {
            data.firstName = match[1];
            data.lastName = match[2];
            data.fullName = `${match[1]} ${match[2]}`;
          } else {
            data[field] = match[1].trim();
          }
        }
      }
    }

    // Extract emails, phones, URLs regardless of document type
    const emails = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    if (emails) data.emails = emails;

    const phones = text.match(
      new RegExp(
        '\\+?[1-9]?[\\-\\.\\s]?\\(?[0-9]{3}\\)?[\\-\\.\\s]?[0-9]{3}[\\-\\.\\s]?[0-9]{4}',
        'g'
      )
    );
    if (phones) data.phones = phones;

    return data;
  }

  async enhanceOCRWithAI(text, documentType) {
    const prompt = `Extract structured data from this ${documentType || 'document'} text:

"${text}"

Return only JSON with relevant fields. For driver's license: firstName, lastName, licenseNumber, dob, address, expiration.
For other documents, extract relevant fields like names, dates, numbers, addresses.

JSON:`;

    try {
      const response = await this.ai.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 300,
        temperature: 0,
        messages: [{ role: 'user', content: prompt }],
      });

      const jsonMatch = response.content[0].text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('AI OCR enhancement failed:', error);
    }

    return {};
  }

  async executeWorkflow(workflow, parameters) {
    console.log(`Executing workflow: ${workflow.name}`);

    const results = [];

    for (const step of workflow.steps) {
      try {
        const result = await this.executeWorkflowStep(step, parameters);
        results.push(result);

        // Send progress update
        if (mainWindow) {
          mainWindow.webContents.send('workflow-progress', {
            workflow: workflow.id,
            completed: results.length,
            total: workflow.steps.length,
          });
        }
      } catch (error) {
        console.error(`Workflow step failed:`, error);
        results.push({ error: error.message });
      }
    }

    return results;
  }

  async executeWorkflowStep(step, parameters) {
    // Send step to renderer for execution
    return new Promise((resolve, reject) => {
      mainWindow.webContents.send('execute-workflow-step', { step, parameters });

      // Wait for result
      const timeout = setTimeout(() => {
        reject(new Error('Workflow step timeout'));
      }, 10000);

      const handler = (event, result) => {
        clearTimeout(timeout);
        ipcMain.removeListener('workflow-step-result', handler);

        if (result.success) {
          resolve(result.data);
        } else {
          reject(new Error(result.error));
        }
      };

      ipcMain.once('workflow-step-result', handler);
    });
  }

  getAvailableFeatures() {
    return {
      ai: !!this.ai,
      ocr: !!this.ocr,
      workflows: true,
      fileOperations: true,
      imageProcessing: !!sharp,
    };
  }

  getMetrics() {
    return {
      ...this.metrics,
      uptime: Date.now() - this.metrics.startTime,
      initialized: this.initialized,
    };
  }

  async shutdown() {
    console.log('🔄 Shutting down MIC Browser...');

    if (this.ocr) {
      await this.ocr.terminate();
    }

    console.log('✅ MIC Browser shutdown complete');
  }
}

// Create main window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: !isDev,
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    show: false,
    backgroundColor: '#0a0a0a',
  });

  // Load the main interface
  mainWindow.loadFile('index.html');

  mainWindow.once('ready-to-show', async () => {
    mainWindow.show();

    if (isDev) {
      mainWindow.webContents.openDevTools();
    }

    // Initialize core system
    micCore = new MICBrowserCore();
    try {
      await micCore.initialize();
    } catch (error) {
      console.error('Failed to initialize MIC Browser:', error);

      dialog.showErrorBox(
        'Initialization Error',
        'Some features may not work properly. Please check the console for details.'
      );
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create application menu
  createMenu();

  // Setup keyboard shortcuts
  setupShortcuts();
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Tab',
          accelerator: 'CmdOrCtrl+T',
          click: () => mainWindow.webContents.send('new-tab'),
        },
        {
          label: 'Close Tab',
          accelerator: 'CmdOrCtrl+W',
          click: () => mainWindow.webContents.send('close-tab'),
        },
        { type: 'separator' },
        {
          label: 'Save Page',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow.webContents.send('save-page'),
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
          accelerator: 'CmdOrCtrl+M',
          click: () => mainWindow.webContents.send('toggle-assistant'),
        },
        {
          label: 'Quick Scan',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => mainWindow.webContents.send('quick-scan'),
        },
        { type: 'separator' },
        {
          label: 'Configure API Keys',
          click: () => mainWindow.webContents.send('configure-api-keys'),
        },
      ],
    },
    {
      label: 'Tools',
      submenu: [
        {
          label: 'Developer Tools',
          accelerator: 'F12',
          click: () => mainWindow.webContents.toggleDevTools(),
        },
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow.webContents.send('reload-page'),
        },
        { type: 'separator' },
        {
          label: 'System Health',
          click: async () => {
            const health = micCore ? micCore.getMetrics() : { error: 'Not initialized' };
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'System Health',
              message: 'MIC Browser Status',
              detail: JSON.stringify(health, null, 2),
            });
          },
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About MIC Browser',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About MIC Browser',
              message: `MIC Browser v${app.getVersion()}`,
              detail: 'AI-Powered Browser with Claude Integration and OCR\n\n© 2024 MIC Browser',
            });
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

function setupShortcuts() {
  // Register global shortcuts
  globalShortcut.register('CommandOrControl+Shift+M', () => {
    if (mainWindow) {
      mainWindow.webContents.send('toggle-assistant');
    }
  });

  globalShortcut.register('CommandOrControl+Shift+S', () => {
    if (mainWindow) {
      mainWindow.webContents.send('quick-scan');
    }
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

  if (micCore) {
    micCore.shutdown();
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (micCore) {
    micCore.shutdown();
  }
});

// Handle certificate errors in development
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (isDev) {
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});

module.exports = { createWindow };
