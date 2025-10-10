const {
  app,
  BrowserWindow,
  Menu,
  ipcMain,
  dialog,
  shell,
  session,
  webContents,
} = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');

// AI and OCR imports
const Anthropic = require('@anthropic-ai/sdk');
const Tesseract = require('tesseract.js');
const sharp = require('sharp'); // For image preprocessing

// Initialize electron store for settings
const store = new Store();

// Keep a global reference of the window object
let mainWindow;
const windows = new Map();

// Enable live reload for Electron in development
const isDev = process.argv.includes('--dev');

// Initialize Claude API (you'll need to set CLAUDE_API_KEY in environment)
const anthropic = new Anthropic.Anthropic({
  apiKey: process.env.CLAUDE_API_KEY || store.get('claudeApiKey'),
});

// OCR Worker

// Security: Enable sandbox for all renderers
app.enableSandbox();

// AI Assistant Class
class MicAIAssistant {
  constructor() {
    this.conversationHistory = [];
    this.pageContext = {};
    this.learningData = new Map();
    this.maxHistoryLength = 20;
  }

  async processCommand(command, context = {}) {
    try {
      // Add user message to history
      this.addToHistory('user', command);

      // Prepare context for Claude
      const systemPrompt = this.buildSystemPrompt(context);

      // Call Claude API
      const message = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 2048,
        temperature: 0.7,
        system: systemPrompt,
        messages: this.conversationHistory,
      });

      const response = message.content[0].text;

      // Add Claude's response to history
      this.addToHistory('assistant', response);

      // Parse response for actions
      const actions = this.parseActions(response);

      return {
        success: true,
        response: response,
        actions: actions,
      };
    } catch (error) {
      console.error('Claude API Error:', error);

      // Fallback to local processing if API fails
      return this.fallbackResponse(command, context);
    }
  }

  buildSystemPrompt(context) {
    let prompt = `You are Mic, an AI assistant integrated into a web browser. You help users automate web tasks, fill forms, transfer data between applications, and provide intelligent assistance.

Current Context:
- Current URL: ${context.url || 'Not specified'}
- Page Title: ${context.title || 'Not specified'}
- Available Form Fields: ${JSON.stringify(context.formFields || [])}
- Open Tabs: ${JSON.stringify(context.tabs || [])}

Capabilities:
1. Analyze web pages and understand their structure
2. Fill forms with appropriate data
3. Transfer data between different web applications
4. Generate reports from page data
5. Provide step-by-step guidance for complex tasks
6. Execute browser automation commands

When responding, if you need to perform an action, include it in this format:
[ACTION: action_name, parameters: {param1: value1, param2: value2}]

Available actions:
- fill_form: Fill form fields with data
- click_element: Click on a page element
- navigate_to: Navigate to a URL
- extract_data: Extract data from the page
- transfer_data: Transfer data to another tab
- generate_report: Create a report from current data
- scan_document: Initiate document scanning`;

    // Add learned page patterns if available
    if (this.pageContext[context.url]) {
      prompt += `\n\nLearned patterns for this page:\n${JSON.stringify(
        this.pageContext[context.url]
      )}`;
    }

    return prompt;
  }

  parseActions(response) {
    const actions = [];
    const actionRegex = /\[ACTION:\s*(\w+),\s*parameters:\s*({[^}]+})\]/g;
    let match;

    while ((match = actionRegex.exec(response)) !== null) {
      try {
        actions.push({
          action: match[1],
          parameters: JSON.parse(match[2]),
        });
      } catch (e) {
        console.error('Error parsing action:', e);
      }
    }

    return actions;
  }

  addToHistory(role, content) {
    this.conversationHistory.push({ role, content });

    // Limit history length to prevent token overflow
    if (this.conversationHistory.length > this.maxHistoryLength) {
      // Keep system messages and recent history
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
    }
  }

  async analyzePageStructure(pageData) {
    try {
      const analysis = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 1024,
        temperature: 0.3,
        system:
          'You are a web page analyzer. Analyze the provided HTML structure and identify forms, data fields, workflows, and interaction patterns. Return a structured JSON analysis.',
        messages: [
          {
            role: 'user',
            content: `Analyze this page structure:\n${JSON.stringify(pageData)}`,
          },
        ],
      });

      const result = analysis.content[0].text;

      // Store learning data
      this.pageContext[pageData.url] = {
        analyzed: new Date().toISOString(),
        structure: result,
      };

      return {
        success: true,
        analysis: result,
      };
    } catch (error) {
      console.error('Page analysis error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  fallbackResponse(command, _context) {
    // Local fallback logic when API is unavailable
    const lowerCommand = command.toLowerCase();

    if (lowerCommand.includes('fill') || lowerCommand.includes('populate')) {
      return {
        success: true,
        response: "I'll fill the form with appropriate data. Please review before submitting.",
        actions: [
          {
            action: 'fill_form',
            parameters: { auto: true },
          },
        ],
      };
    }

    if (lowerCommand.includes('scan')) {
      return {
        success: true,
        response: 'Opening the document scanner. Please select or capture your document.',
        actions: [
          {
            action: 'scan_document',
            parameters: {},
          },
        ],
      };
    }

    if (lowerCommand.includes('transfer')) {
      return {
        success: true,
        response:
          "I'll help you transfer data between tabs. Please select the source and destination.",
        actions: [
          {
            action: 'transfer_data',
            parameters: {},
          },
        ],
      };
    }

    return {
      success: true,
      response: 'I understand you want to: ' + command + '. Let me help you with that.',
      actions: [],
    };
  }

  clearHistory() {
    this.conversationHistory = [];
    this.pageContext = {};
  }
}

// OCR Processing Class
class OCRProcessor {
  constructor() {
    this.worker = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      this.worker = await Tesseract.createWorker({
        logger: (m) => {
          console.log('OCR Progress:', m);
          // Send progress to renderer
          if (mainWindow) {
            mainWindow.webContents.send('ocr-progress', m);
          }
        },
      });

      await this.worker.loadLanguage('eng');
      await this.worker.initialize('eng');

      // Configure OCR parameters for better accuracy
      await this.worker.setParameters({
        tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
        preserve_interword_spaces: '1',
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
      });

      this.initialized = true;
      console.log('OCR engine initialized successfully');
    } catch (error) {
      console.error('OCR initialization failed:', error);
      throw error;
    }
  }

  async processDocument(imagePath, documentType = 'auto') {
    try {
      await this.initialize();

      // Preprocess image for better OCR accuracy
      const processedPath = await this.preprocessImage(imagePath);

      // Perform OCR
      const { data } = await this.worker.recognize(processedPath);

      // Parse based on document type
      let extractedData = {};

      if (documentType === 'drivers_license' || documentType === 'auto') {
        extractedData = this.parseDriversLicense(data.text);
      } else if (documentType === 'id_card') {
        extractedData = this.parseIDCard(data.text);
      } else if (documentType === 'form') {
        extractedData = this.parseGenericForm(data.text);
      } else {
        extractedData = this.parseGenericText(data.text);
      }

      // Use Claude to improve extraction accuracy
      const enhancedData = await this.enhanceWithAI(data.text, documentType);

      // Merge AI-enhanced data
      if (enhancedData.success) {
        extractedData = { ...extractedData, ...enhancedData.data };
      }

      // Clean up temporary processed image
      if (processedPath !== imagePath) {
        fs.unlinkSync(processedPath);
      }

      return {
        success: true,
        rawText: data.text,
        confidence: data.confidence,
        extractedData: extractedData,
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
  }

  async preprocessImage(imagePath) {
    try {
      const outputPath = path.join(app.getPath('temp'), `processed_${Date.now()}.png`);

      // Use sharp for image preprocessing
      await sharp(imagePath)
        .greyscale() // Convert to grayscale
        .normalize() // Normalize contrast
        .sharpen() // Sharpen text
        .threshold(128) // Apply threshold for better text recognition
        .toFile(outputPath);

      return outputPath;
    } catch (error) {
      console.log('Image preprocessing failed, using original:', error);
      return imagePath;
    }
  }

  parseDriversLicense(text) {
    const extracted = {};

    // Common patterns for driver's license fields
    const patterns = {
      licenseNumber: /(?:DL|License|LIC)[\s#:]*([A-Z0-9-]+)/i,
      name: /(?:Name|FN|LN)[\s:]*([A-Z][a-z]+)\s+([A-Z][a-z]+)/i,
      dob: new RegExp('(?:DOB|Birth|Born)[\\s:]*(\\d{1,2}[-/]\\d{1,2}[-/]\\d{2,4})', 'i'),
      expiration: new RegExp('(?:EXP|Expires?)[\\s:]*(\\d{1,2}[-/]\\d{1,2}[-/]\\d{2,4})', 'i'),
      address: /(?:Address|ADDR)[\s:]*(.+?)(?:\n|$)/i,
      state: /(?:State|ST)[\s:]*([A-Z]{2})/i,
      zip: /(?:ZIP|Postal)[\s:]*(\d{5}(?:-\d{4})?)/i,
    };

    // Extract fields using patterns
    for (const [field, pattern] of Object.entries(patterns)) {
      const match = text.match(pattern);
      if (match) {
        if (field === 'name' && match[1] && match[2]) {
          extracted.firstName = match[1];
          extracted.lastName = match[2];
          extracted.fullName = `${match[1]} ${match[2]}`;
        } else if (match[1]) {
          extracted[field] = match[1].trim();
        }
      }
    }

    return extracted;
  }

  parseIDCard(text) {
    // Similar to driver's license but with different patterns
    return this.parseDriversLicense(text);
  }

  parseGenericForm(text) {
    const extracted = {};

    // Look for label:value patterns
    const lines = text.split('\n');
    for (const line of lines) {
      const match = line.match(/^([^:]+):\s*(.+)$/);
      if (match) {
        const label = match[1].trim().toLowerCase().replace(/\s+/g, '_');
        extracted[label] = match[2].trim();
      }
    }

    return extracted;
  }

  parseGenericText(text) {
    // Return structured data from generic text
    return {
      fullText: text,
      lines: text.split('\n').filter((line) => line.trim()),
      wordCount: text.split(/\s+/).length,
      extractedAt: new Date().toISOString(),
    };
  }

  async enhanceWithAI(ocrText, documentType) {
    try {
      const prompt = `Extract structured data from this ${documentType} OCR text. Return only the extracted fields as JSON:

OCR Text:
${ocrText}

Expected fields for ${documentType}:
- Full Name (firstName, lastName)
- License/ID Number
- Date of Birth
- Expiration Date
- Address
- City, State, ZIP

Return format: {"firstName": "...", "lastName": "...", ...}`;

      const response = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 512,
        temperature: 0.1,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const jsonStr = response.content[0].text;

      // Try to parse JSON from response
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          data: data,
        };
      }

      return { success: false };
    } catch (error) {
      console.error('AI enhancement failed:', error);
      return { success: false };
    }
  }

  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.initialized = false;
    }
  }
}

// Initialize AI and OCR processors
const micAI = new MicAIAssistant();
const ocrProcessor = new OCRProcessor();

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
    // Cleanup OCR worker
    ocrProcessor.terminate();
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

  // Initialize OCR on startup
  ocrProcessor.initialize().catch(console.error);
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
          label: 'Scan Document',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            mainWindow.webContents.send('open-scanner');
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
        { type: 'separator' },
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
          label: 'Toggle Developer Tools',
          accelerator: 'F12',
          click: () => {
            mainWindow.webContents.toggleDevTools();
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
          label: 'Analyze Current Page',
          click: () => {
            mainWindow.webContents.send('analyze-page');
          },
        },
        { type: 'separator' },
        {
          label: 'Configure API Key',
          click: async () => {
            const result = await dialog.showMessageBox(mainWindow, {
              type: 'question',
              buttons: ['Cancel', 'Set Key'],
              title: 'Configure Claude API Key',
              message: 'Enter your Anthropic Claude API key',
              detail: 'This will be stored securely on your device',
            });

            if (result.response === 1) {
              // In production, use a secure input dialog
              mainWindow.webContents.send('configure-api-key');
            }
          },
        },
        {
          label: 'Clear AI History',
          click: () => {
            micAI.clearHistory();
            mainWindow.webContents.send('ai-history-cleared');
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
                'AI-Powered Browser with Claude Integration and OCR\n\nPowered by:\n• Claude 3 Opus (Anthropic)\n• Tesseract.js OCR Engine\n\n© 2024 Your Company',
              buttons: ['OK'],
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
        { label: 'About Mic Browser', role: 'about' },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'Cmd+Q', click: () => app.quit() },
      ],
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function initializeIPC() {
  // AI Request Handler
  ipcMain.handle('ai-request', async (event, request) => {
    try {
      // Get current page context from renderer
      const pageContext = request.context || {};

      // Process with Claude
      const result = await micAI.processCommand(request.command, pageContext);

      // Execute any actions returned by Claude
      if (result.actions && result.actions.length > 0) {
        for (const action of result.actions) {
          mainWindow.webContents.send('execute-action', action);
        }
      }

      return result;
    } catch (error) {
      console.error('AI request error:', error);
      return {
        success: false,
        error: error.message,
        fallback: true,
        response:
          "I'm having trouble connecting to my AI service. Please check your API key or try again later.",
      };
    }
  });

  // Page Analysis Handler
  ipcMain.handle('analyze-page', async (event, pageData) => {
    try {
      const result = await micAI.analyzePageStructure(pageData);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // OCR Document Scanning Handler
  ipcMain.handle('scan-document', async (event, options = {}) => {
    try {
      let imagePath;

      if (options.path) {
        imagePath = options.path;
      } else {
        // Show file picker
        const result = await dialog.showOpenDialog(mainWindow, {
          properties: ['openFile'],
          filters: [
            { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff'] },
            { name: 'PDF Files', extensions: ['pdf'] },
          ],
        });

        if (result.canceled) {
          return { success: false, canceled: true };
        }

        imagePath = result.filePaths[0];
      }

      // Process with OCR
      const ocrResult = await ocrProcessor.processDocument(
        imagePath,
        options.documentType || 'auto'
      );

      return ocrResult;
    } catch (error) {
      console.error('Scan document error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // OCR Progress Handler
  ipcMain.handle('get-ocr-progress', () => {
    // Return current OCR progress if needed
    return { status: 'ready' };
  });

  // Settings handlers
  ipcMain.handle('get-setting', (event, key) => {
    return store.get(key);
  });

  ipcMain.handle('set-setting', (event, key, value) => {
    store.set(key, value);

    // Update API key if it's being changed
    if (key === 'claudeApiKey') {
      anthropic.apiKey = value;
    }

    return true;
  });

  // Data transfer between tabs
  ipcMain.handle('transfer-data', (event, data) => {
    mainWindow.webContents.send('data-received', data);
    return { success: true };
  });

  // Save extracted data
  ipcMain.handle('save-extracted-data', async (event, data) => {
    try {
      const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: 'extracted-data.json',
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'CSV Files', extensions: ['csv'] },
        ],
      });

      if (!result.canceled) {
        const ext = path.extname(result.filePath);

        if (ext === '.csv') {
          // Convert to CSV
          const csv = Object.entries(data.extractedData)
            .map(([key, value]) => `"${key}","${value}"`)
            .join('\n');
          fs.writeFileSync(result.filePath, `Field,Value\n${csv}`);
        } else {
          // Save as JSON
          fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2));
        }

        return { success: true, path: result.filePath };
      }

      return { success: false, canceled: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
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
  // Cleanup OCR worker
  ocrProcessor.terminate();

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle certificate errors
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (isDev) {
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});

// Export for testing
module.exports = { createWindow, micAI, ocrProcessor };
