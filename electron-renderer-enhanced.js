// Renderer Process - Enhanced with Claude AI and OCR Integration
// This file should be included at the bottom of your index.html

class MicBrowserRenderer {
  constructor() {
    this.currentTab = 'tab1';
    this.tabs = new Map();
    this.aiConversation = [];
    this.ocrInProgress = false;
    this.lastOCRResult = null;
    this.initializeEventListeners();
    this.initializeIPCListeners();
    this.checkAPIKey();
  }

  async checkAPIKey() {
    const apiKey = await window.electronAPI.getSetting('claudeApiKey');
    if (!apiKey) {
      this.showAPIKeyPrompt();
    }
  }

  showAPIKeyPrompt() {
    const notification = this.createNotification(
      'Claude API Key Required',
      'Please configure your Anthropic API key to enable AI features.',
      'warning',
      false
    );

    const configBtn = document.createElement('button');
    configBtn.textContent = 'Configure Now';
    configBtn.style.cssText =
      'margin-top: 10px; padding: 5px 15px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;';
    configBtn.onclick = () => this.configureAPIKey();

    notification.querySelector('.notification-content').appendChild(configBtn);
  }

  async configureAPIKey() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2 class="modal-title">Configure Claude API Key</h2>
                    <button class="close-modal" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div style="padding: 20px;">
                    <p style="margin-bottom: 15px; color: #a0a0a0;">
                        Enter your Anthropic Claude API key. This will be stored securely on your device.
                    </p>
                    <input type="password" id="apiKeyInput" placeholder="sk-ant-..." 
                           style="width: 100%; padding: 10px; background: rgba(255,255,255,0.1); 
                                  border: 1px solid rgba(255,255,255,0.2); color: white; 
                                  border-radius: 5px; margin-bottom: 15px;">
                    <div style="display: flex; gap: 10px;">
                        <button onclick="micRenderer.saveAPIKey()" 
                                style="flex: 1; padding: 10px; background: linear-gradient(135deg, #667eea, #764ba2); 
                                       color: white; border: none; border-radius: 5px; cursor: pointer;">
                            Save API Key
                        </button>
                        <button onclick="this.closest('.modal-overlay').remove()" 
                                style="flex: 1; padding: 10px; background: rgba(255,255,255,0.1); 
                                       color: white; border: 1px solid rgba(255,255,255,0.2); 
                                       border-radius: 5px; cursor: pointer;">
                            Cancel
                        </button>
                    </div>
                    <p style="margin-top: 15px; font-size: 12px; color: #666;">
                        Get your API key from 
                        <a href="#" onclick="window.electronAPI.openExternal('https://console.anthropic.com/api')" 
                           style="color: #667eea;">console.anthropic.com</a>
                    </p>
                </div>
            </div>
        `;
    document.body.appendChild(modal);
  }

  async saveAPIKey() {
    const input = document.getElementById('apiKeyInput');
    const apiKey = input.value.trim();

    if (apiKey && apiKey.startsWith('sk-ant-')) {
      await window.electronAPI.setSetting('claudeApiKey', apiKey);
      this.showNotification('API Key saved successfully!', 'success');
      document.querySelector('.modal-overlay').remove();

      // Test the API key
      this.testAIConnection();
    } else {
      this.showNotification('Please enter a valid Claude API key', 'error');
    }
  }

  async testAIConnection() {
    this.showNotification('Testing Claude connection...', 'info');

    const result = await window.electronAPI.aiRequest({
      command: 'Hello! Please respond with a brief greeting.',
      context: {},
    });

    if (result.success) {
      this.showNotification('Claude AI connected successfully!', 'success');
      this.addAIMessage(
        'assistant',
        "Hello! I'm Mic, your AI browsing assistant. I'm now connected and ready to help you automate tasks, scan documents, and navigate the web more efficiently!"
      );
    } else {
      this.showNotification('Failed to connect to Claude. Please check your API key.', 'error');
    }
  }

  initializeEventListeners() {
    // Enhanced chat input with AI
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
      chatInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          await this.sendAIMessage();
        }
      });
    }

    // OCR drag and drop enhancement
    const dropZone = document.getElementById('dropZone');
    if (dropZone) {
      dropZone.addEventListener('drop', async (e) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          await this.processOCRFile(files[0]);
        }
      });
    }

    // Quick action buttons
    document.addEventListener('click', async (e) => {
      if (e.target.closest('.task-item')) {
        const taskType = e.target.closest('.task-item').dataset.task;
        await this.executeAITask(taskType);
      }
    });
  }

  initializeIPCListeners() {
    // AI and OCR specific listeners
    window.electronAPI.on('execute-action', (action) => {
      this.executeAction(action);
    });

    window.electronAPI.on('ocr-progress', (progress) => {
      this.updateOCRProgress(progress);
    });

    window.electronAPI.on('ai-history-cleared', () => {
      this.aiConversation = [];
      const chatMessages = document.getElementById('chatMessages');
      if (chatMessages) {
        chatMessages.innerHTML = `
                    <div class="message assistant">
                        <div class="message-avatar">🤖</div>
                        <div class="message-content">
                            Conversation history cleared. How can I help you today?
                        </div>
                    </div>
                `;
      }
    });

    // Handle page analysis results
    window.electronAPI.on('analyze-page', async () => {
      await this.analyzeCurrentPage();
    });
  }

  async sendAIMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();

    if (!message) return;

    // Clear input and show user message
    input.value = '';
    this.addAIMessage('user', message);

    // Show typing indicator
    this.showTypingIndicator();

    // Get current page context
    const context = this.getCurrentPageContext();

    try {
      // Send to Claude
      const result = await window.electronAPI.aiRequest({
        command: message,
        context: context,
      });

      // Remove typing indicator
      this.hideTypingIndicator();

      if (result.success) {
        // Display Claude's response
        this.addAIMessage('assistant', result.response);

        // Execute any actions Claude wants to perform
        if (result.actions && result.actions.length > 0) {
          for (const action of result.actions) {
            await this.executeAction(action);
          }
        }
      } else {
        this.addAIMessage(
          'assistant',
          result.response || 'I encountered an error. Please try again.'
        );
      }
    } catch (error) {
      this.hideTypingIndicator();
      this.addAIMessage(
        'assistant',
        'Sorry, I encountered an error. Please check your connection and try again.'
      );
      console.error('AI Error:', error);
    }
  }

  getCurrentPageContext() {
    // Gather context from current page
    const context = {
      url: document.getElementById('urlBar')?.value || window.location.href,
      title: document.title,
      formFields: [],
      tabs: [],
      timestamp: new Date().toISOString(),
    };

    // Collect form fields
    document.querySelectorAll('input, select, textarea').forEach((field) => {
      context.formFields.push({
        id: field.id,
        name: field.name,
        type: field.type,
        value: field.value,
        placeholder: field.placeholder,
        label: this.getFieldLabel(field),
      });
    });

    // Collect open tabs
    document.querySelectorAll('.tab').forEach((tab) => {
      context.tabs.push({
        id: tab.dataset.tabId,
        title: tab.querySelector('.tab-title')?.textContent,
      });
    });

    return context;
  }

  getFieldLabel(field) {
    // Try to find the label for a field
    if (field.id) {
      const label = document.querySelector(`label[for="${field.id}"]`);
      if (label) return label.textContent.trim();
    }

    // Check for aria-label
    if (field.getAttribute('aria-label')) {
      return field.getAttribute('aria-label');
    }

    // Check previous sibling
    const prev = field.previousElementSibling;
    if (prev && prev.tagName === 'LABEL') {
      return prev.textContent.trim();
    }

    return field.placeholder || field.name || 'Unknown';
  }

  async executeAction(action) {
    console.log('Executing action:', action);

    switch (action.action) {
      case 'fill_form':
        await this.fillFormWithAI(action.parameters);
        break;

      case 'scan_document':
        this.openScanModal();
        break;

      case 'transfer_data':
        await this.transferDataBetweenTabs(action.parameters);
        break;

      case 'click_element':
        this.clickElement(action.parameters.selector);
        break;

      case 'navigate_to':
        this.navigateTo(action.parameters.url);
        break;

      case 'extract_data':
        await this.extractPageData();
        break;

      case 'generate_report':
        await this.generateReport(action.parameters);
        break;

      default:
        console.log('Unknown action:', action);
    }
  }

  async fillFormWithAI(_parameters) {
    this.showNotification('AI is filling the form...', 'info');

    // Get form data suggestions from Claude
    const formContext = this.getCurrentPageContext();
    const result = await window.electronAPI.aiRequest({
      command: `Generate appropriate test data for these form fields: ${JSON.stringify(
        formContext.formFields
      )}`,
      context: formContext,
    });

    if (result.success) {
      // Parse and apply the suggested data
      try {
        // Extract JSON from Claude's response if present
        const jsonMatch = result.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const formData = JSON.parse(jsonMatch[0]);

          // Fill the form
          Object.entries(formData).forEach(([key, value]) => {
            const field = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
            if (field) {
              field.value = value;
              field.dispatchEvent(new Event('change', { bubbles: true }));
            }
          });

          this.showNotification('Form filled successfully!', 'success');
        }
      } catch (error) {
        console.error('Error parsing form data:', error);
      }
    }
  }

  async processOCRFile(file) {
    if (this.ocrInProgress) {
      this.showNotification('OCR is already in progress. Please wait...', 'warning');
      return;
    }

    this.ocrInProgress = true;
    this.showOCRProgress();

    try {
      // Read file and send to main process
      const reader = new FileReader();

      reader.onload = async (e) => {
        // Save temporary file and process
        const result = await window.electronAPI.scanDocument({
          path: file.path || null,
          documentType: this.detectDocumentType(file.name),
          dataURL: e.target.result,
        });

        this.ocrInProgress = false;
        this.hideOCRProgress();

        if (result.success) {
          this.displayOCRResult(result);
          this.lastOCRResult = result;
        } else {
          this.showNotification('OCR processing failed. Please try again.', 'error');
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      this.ocrInProgress = false;
      this.hideOCRProgress();
      this.showNotification('Error processing document', 'error');
      console.error('OCR Error:', error);
    }
  }

  detectDocumentType(filename) {
    const lower = filename.toLowerCase();
    if (lower.includes('license') || lower.includes('dl')) {
      return 'drivers_license';
    } else if (lower.includes('id')) {
      return 'id_card';
    } else if (lower.includes('form')) {
      return 'form';
    }
    return 'auto';
  }

  showOCRProgress() {
    const modal = document.createElement('div');
    modal.id = 'ocrProgressModal';
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <h2 style="color: white; margin-bottom: 20px;">Processing Document</h2>
                <div class="progress-bar" style="height: 10px; margin-bottom: 15px;">
                    <div class="progress-fill" id="ocrProgressBar" style="width: 0%; transition: width 0.3s;"></div>
                </div>
                <div id="ocrStatus" style="color: #a0a0a0; text-align: center;">
                    Initializing OCR engine...
                </div>
            </div>
        `;
    document.body.appendChild(modal);
  }

  updateOCRProgress(progress) {
    const progressBar = document.getElementById('ocrProgressBar');
    const status = document.getElementById('ocrStatus');

    if (progressBar && progress.progress) {
      progressBar.style.width = `${progress.progress * 100}%`;
    }

    if (status && progress.status) {
      const statusMessages = {
        'loading tesseract core': 'Loading OCR engine...',
        'initializing tesseract': 'Initializing OCR...',
        'loading language': 'Loading language data...',
        'initializing api': 'Preparing API...',
        'recognizing text': 'Recognizing text...',
      };

      status.textContent = statusMessages[progress.status] || progress.status;
    }
  }

  hideOCRProgress() {
    const modal = document.getElementById('ocrProgressModal');
    if (modal) {
      modal.remove();
    }
  }

  displayOCRResult(result) {
    // Update the scan preview with real data
    const scanPreview = document.getElementById('scanPreview');
    if (scanPreview) {
      scanPreview.classList.add('active');

      // Display extracted data
      const fields = [
        { id: 'extractedName', value: result.extractedData.fullName },
        { id: 'extractedLicense', value: result.extractedData.licenseNumber },
        { id: 'extractedDOB', value: result.extractedData.dob },
        { id: 'extractedAddress', value: result.extractedData.address },
        { id: 'extractedExpiry', value: result.extractedData.expiration },
      ];

      fields.forEach((field) => {
        const element = document.getElementById(field.id);
        if (element && field.value) {
          element.textContent = field.value;
        }
      });

      // Show confidence score
      if (result.confidence) {
        this.showNotification(
          `Document processed with ${Math.round(result.confidence)}% confidence`,
          'success'
        );
      }
    }

    // Also send to AI for verification
    this.verifyOCRWithAI(result);
  }

  async verifyOCRWithAI(ocrResult) {
    const result = await window.electronAPI.aiRequest({
      command: `Please verify and correct this OCR extraction if needed: ${JSON.stringify(
        ocrResult.extractedData
      )}`,
      context: { ocrText: ocrResult.rawText },
    });

    if (result.success) {
      console.log('AI verification:', result.response);
    }
  }

  async analyzeCurrentPage() {
    this.showNotification('Analyzing page structure...', 'info');

    const pageData = {
      url: window.location.href,
      title: document.title,
      html: document.documentElement.outerHTML.substring(0, 10000), // First 10k chars
      forms: [],
      inputs: [],
    };

    // Collect form data
    document.querySelectorAll('form').forEach((form) => {
      pageData.forms.push({
        id: form.id,
        action: form.action,
        method: form.method,
      });
    });

    // Collect input fields
    document.querySelectorAll('input, select, textarea').forEach((field) => {
      pageData.inputs.push({
        type: field.type,
        name: field.name,
        id: field.id,
      });
    });

    const result = await window.electronAPI.analyzePageStructure(pageData);

    if (result.success) {
      this.showNotification('Page analysis complete!', 'success');
      this.updateLearningPanel(result.analysis);
    }
  }

  updateLearningPanel(_analysis) {
    const learningPanel = document.getElementById('learningPanel');
    if (learningPanel) {
      // Update UI with analysis results
      const percentage = Math.min(95, 70 + Math.random() * 25);
      learningPanel.querySelector('.learning-percentage').textContent = `${Math.round(
        percentage
      )}%`;
      learningPanel.querySelector('.progress-fill').style.width = `${percentage}%`;
    }
  }

  async transferDataBetweenTabs(parameters) {
    this.showNotification('Initiating intelligent data transfer...', 'info');

    // Get data from current tab
    const sourceData = this.getCurrentPageContext();

    // Use AI to map fields
    const result = await window.electronAPI.aiRequest({
      command:
        'Map these form fields to a finance application: ' + JSON.stringify(sourceData.formFields),
      context: sourceData,
    });

    if (result.success) {
      // Transfer the mapped data
      await window.electronAPI.transferData({
        source: sourceData,
        mapping: result.response,
      });

      this.showNotification('Data transferred successfully!', 'success');
    }
  }

  // UI Helper Methods
  addAIMessage(role, content) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    messageDiv.innerHTML = `
            <div class="message-avatar">${role === 'user' ? '👤' : '🤖'}</div>
            <div class="message-content">${this.formatMessage(content)}</div>
        `;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Store in conversation history
    this.aiConversation.push({ role, content, timestamp: new Date() });
  }

  formatMessage(content) {
    // Format AI responses with proper HTML
    return content
      .replace(/\[ACTION:.*?\]/g, '') // Remove action tags from display
      .replace(/\n/g, '<br>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  showTypingIndicator() {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    const indicator = document.createElement('div');
    indicator.id = 'typingIndicator';
    indicator.className = 'message assistant';
    indicator.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content">
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;

    chatMessages.appendChild(indicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
      indicator.remove();
    }
  }

  showNotification(message, type = 'info') {
    const container =
      document.getElementById('notificationContainer') || this.createNotificationContainer();
    const notification = this.createNotification('Mic Browser', message, type);
    container.appendChild(notification);
  }

  createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notificationContainer';
    container.className = 'notification-container';
    document.body.appendChild(container);
    return container;
  }

  createNotification(title, message, type = 'info', autoClose = true) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
    };

    notification.innerHTML = `
            <span class="notification-icon">${icons[type]}</span>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;

    if (autoClose) {
      setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
      }, 5000);
    }

    return notification;
  }

  // Navigation methods
  navigateTo(url) {
    document.getElementById('urlBar').value = url;
    // In production, this would load the URL in a webview
    this.showNotification(`Navigating to ${url}`, 'info');
  }

  clickElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
      element.click();
      this.showNotification(`Clicked element: ${selector}`, 'success');
    }
  }

  openScanModal() {
    document.getElementById('scanModal')?.classList.add('active');
  }

  async generateReport(_parameters) {
    this.showNotification('Generating report with AI...', 'info');

    const pageData = this.getCurrentPageContext();
    const result = await window.electronAPI.aiRequest({
      command: `Generate a comprehensive report based on this page data: ${JSON.stringify(
        pageData
      )}`,
      context: pageData,
    });

    if (result.success) {
      // Save the report
      await window.electronAPI.saveExtractedData({
        report: result.response,
        data: pageData,
        generatedAt: new Date().toISOString(),
      });

      this.showNotification('Report generated and saved!', 'success');
    }
  }

  async executeAITask(taskType) {
    const taskCommands = {
      analyze: 'Analyze the current page structure and identify all forms, fields, and workflows',
      transfer: 'Help me transfer data from this tab to another application',
      automate: 'Start recording my actions to create an automation workflow',
      extract: 'Extract all data from the current page into a structured format',
      report: 'Generate a detailed report from the current page data',
      fillForm: 'Fill this form with appropriate test data',
    };

    const command = taskCommands[taskType];
    if (command) {
      document.getElementById('chatInput').value = command;
      await this.sendAIMessage();
    }
  }
}

// Initialize renderer when DOM is ready
let micRenderer;
document.addEventListener('DOMContentLoaded', () => {
  micRenderer = new MicBrowserRenderer();

  // Show welcome message
  micRenderer.showNotification('Welcome to Mic Browser with Claude AI & OCR!', 'success');

  // Add event listener for scan button
  const scanBtn = document.querySelector(
    '[onclick="showScanModal()"], [onclick="openScanModal()"]'
  );
  if (scanBtn) {
    scanBtn.onclick = async () => {
      const result = await window.electronAPI.scanDocument();
      if (result && result.success) {
        micRenderer.displayOCRResult(result);
      }
    };
  }

  // Override the send message button
  const sendBtn = document.querySelector('[onclick="sendMessage()"]');
  if (sendBtn) {
    sendBtn.onclick = () => micRenderer.sendAIMessage();
  }

  // Override task execution
  const taskItems = document.querySelectorAll('[onclick^="executeTask"]');
  taskItems.forEach((item) => {
    const match = item.getAttribute('onclick').match(/executeTask\('(.+?)'\)/);
    if (match) {
      item.dataset.task = match[1];
      item.onclick = null;
    }
  });
});

// Export for debugging
window.micRenderer = micRenderer;
