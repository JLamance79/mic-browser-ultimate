// Advanced Voice Assistant with Natural Language Processing
const { EventEmitter } = require('events');
const crypto = require('crypto');

class VoiceAssistant extends EventEmitter {
  constructor(mainWindow, aiSystem) {
    super();
    this.mainWindow = mainWindow;
    this.aiSystem = aiSystem;

    // Voice recognition state
    this.isListening = false;
    this.isProcessing = false;
    this.currentSession = null;

    // Voice settings
    this.settings = {
      language: 'en-US',
      continuous: false,
      interimResults: true,
      maxAlternatives: 3,
      confidenceThreshold: 0.7,
      timeoutMs: 10000,
      wakeWord: 'hey mic',
      wakeWordEnabled: false,
    };

    // Command processing
    this.commandPatterns = new Map();
    this.contextualCommands = new Map();
    this.conversationHistory = [];

    // Natural language understanding
    this.nluEngine = {
      intents: new Map(),
      entities: new Map(),
      contextStack: [],
      confidence: new Map(),
    };

    // Voice synthesis
    this.ttsSettings = {
      voice: null,
      rate: 1.0,
      pitch: 1.0,
      volume: 0.8,
      enabled: true,
    };

    // Session management
    this.sessions = new Map();
    this.metrics = {
      commandsProcessed: 0,
      successfulCommands: 0,
      averageConfidence: 0,
      totalListeningTime: 0,
    };

    this.initialize();
  }

  async initialize() {
    try {
      // Initialize speech recognition
      await this.initializeSpeechRecognition();

      // Initialize text-to-speech
      await this.initializeTextToSpeech();

      // Load command patterns
      this.loadCommandPatterns();

      // Initialize NLU engine
      this.initializeNLU();

      // Setup continuous listening if enabled
      if (this.settings.wakeWordEnabled) {
        this.startWakeWordDetection();
      }

      console.log('✅ Voice Assistant initialized');
      this.emit('initialized');
    } catch (error) {
      console.error('❌ Voice Assistant initialization failed:', error);
      throw error;
    }
  }

  // Speech Recognition Setup
  async initializeSpeechRecognition() {
    // Send command to renderer to initialize speech recognition
    return new Promise((resolve, reject) => {
      this.mainWindow.webContents.send('init-speech-recognition', this.settings);

      this.mainWindow.webContents.once('speech-recognition-ready', (result) => {
        if (result.success) {
          this.setupSpeechHandlers();
          resolve();
        } else {
          reject(new Error(result.error));
        }
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        reject(new Error('Speech recognition initialization timeout'));
      }, 5000);
    });
  }

  setupSpeechHandlers() {
    // Handle speech results from renderer
    this.mainWindow.webContents.on('speech-result', (event, result) => {
      this.handleSpeechResult(result);
    });

    this.mainWindow.webContents.on('speech-error', (event, error) => {
      this.handleSpeechError(error);
    });

    this.mainWindow.webContents.on('speech-start', () => {
      this.handleSpeechStart();
    });

    this.mainWindow.webContents.on('speech-end', () => {
      this.handleSpeechEnd();
    });
  }

  // Text-to-Speech Setup
  async initializeTextToSpeech() {
    return new Promise((resolve, reject) => {
      this.mainWindow.webContents.send('init-text-to-speech', this.ttsSettings);

      this.mainWindow.webContents.once('text-to-speech-ready', (result) => {
        if (result.success) {
          this.availableVoices = result.voices || [];

          // Set default voice if not specified
          if (!this.ttsSettings.voice && this.availableVoices.length > 0) {
            this.ttsSettings.voice =
              this.availableVoices.find(
                (v) => v.name.includes('Microsoft') || v.name.includes('Google')
              ) || this.availableVoices[0];
          }

          resolve();
        } else {
          reject(new Error(result.error));
        }
      });

      setTimeout(() => {
        reject(new Error('Text-to-speech initialization timeout'));
      }, 5000);
    });
  }

  // Voice Command Processing
  async startListening(options = {}) {
    if (this.isListening) {
      console.log('Already listening');
      return;
    }

    const sessionId = crypto.randomBytes(8).toString('hex');
    this.currentSession = {
      id: sessionId,
      startTime: Date.now(),
      options: { ...this.settings, ...options },
      results: [],
      status: 'listening',
    };

    this.sessions.set(sessionId, this.currentSession);
    this.isListening = true;

    // Send command to start listening
    this.mainWindow.webContents.send('start-listening', this.currentSession.options);

    this.emit('listening-started', { sessionId });
    console.log(`🎤 Started listening (Session: ${sessionId})`);

    // Auto-stop after timeout
    if (this.currentSession.options.timeoutMs) {
      setTimeout(() => {
        if (this.isListening && this.currentSession?.id === sessionId) {
          this.stopListening();
        }
      }, this.currentSession.options.timeoutMs);
    }

    return sessionId;
  }

  async stopListening() {
    if (!this.isListening) {
      return;
    }

    this.isListening = false;

    // Send command to stop listening
    this.mainWindow.webContents.send('stop-listening');

    if (this.currentSession) {
      this.currentSession.endTime = Date.now();
      this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;
      this.currentSession.status = 'completed';

      this.metrics.totalListeningTime += this.currentSession.duration;
    }

    this.emit('listening-stopped', {
      sessionId: this.currentSession?.id,
      duration: this.currentSession?.duration,
    });

    console.log(`⏹️ Stopped listening`);
    this.currentSession = null;
  }

  async handleSpeechResult(result) {
    if (!this.currentSession) return;

    this.currentSession.results.push({
      transcript: result.transcript,
      confidence: result.confidence,
      isFinal: result.isFinal,
      timestamp: Date.now(),
    });

    this.emit('speech-recognized', {
      sessionId: this.currentSession.id,
      transcript: result.transcript,
      confidence: result.confidence,
      isFinal: result.isFinal,
    });

    // Process final results
    if (result.isFinal) {
      await this.processSpeechCommand(result.transcript, result.confidence);
    }
  }

  async processSpeechCommand(transcript, confidence) {
    if (confidence < this.settings.confidenceThreshold) {
      console.log(`⚠️ Low confidence speech: ${transcript} (${confidence})`);
      await this.speak("I didn't catch that clearly. Could you repeat?");
      return;
    }

    this.isProcessing = true;
    this.metrics.commandsProcessed++;

    try {
      // Add to conversation history
      this.conversationHistory.push({
        type: 'user_speech',
        content: transcript,
        confidence: confidence,
        timestamp: Date.now(),
      });

      // Parse command with NLU
      const nluResult = await this.parseNaturalLanguage(transcript);

      // Execute command
      const response = await this.executeVoiceCommand(nluResult);

      // Speak response if enabled
      if (this.ttsSettings.enabled && response.speak) {
        await this.speak(response.message);
      }

      // Send to UI
      this.emit('command-processed', {
        transcript: transcript,
        nlu: nluResult,
        response: response,
      });

      this.metrics.successfulCommands++;
      this.updateAverageConfidence(confidence);
    } catch (error) {
      console.error('Voice command processing error:', error);
      await this.speak('Sorry, I encountered an error processing that command.');

      this.emit('command-error', {
        transcript: transcript,
        error: error.message,
      });
    } finally {
      this.isProcessing = false;
    }
  }

  // Natural Language Understanding
  async parseNaturalLanguage(text) {
    const nluResult = {
      originalText: text,
      normalizedText: this.normalizeText(text),
      intent: null,
      entities: [],
      context: this.getConversationContext(),
      confidence: 0,
    };

    // Intent recognition
    nluResult.intent = await this.recognizeIntent(nluResult.normalizedText);

    // Entity extraction
    nluResult.entities = this.extractEntities(nluResult.normalizedText);

    // Calculate overall confidence
    nluResult.confidence = this.calculateNLUConfidence(nluResult);

    return nluResult;
  }

  normalizeText(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async recognizeIntent(text) {
    // Check built-in patterns first
    for (const [pattern, intent] of this.commandPatterns) {
      if (pattern.test(text)) {
        return {
          name: intent.name,
          confidence: intent.confidence || 0.9,
          method: 'pattern',
        };
      }
    }

    // Use AI for complex intent recognition
    if (this.aiSystem) {
      try {
        const prompt = `Classify this voice command intent:

Command: "${text}"

Available intents:
- navigate: Go to websites, pages, or URLs
- fill_form: Fill out forms or input fields
- click: Click buttons, links, or elements
- scan: Scan documents or images
- transfer: Transfer data between applications
- analyze: Analyze pages or data
- search: Search for information
- control: Control browser functions
- workflow: Execute or create workflows
- other: Other actions

Return JSON: {"intent": "intent_name", "confidence": 0.9, "reasoning": "why"}`;

        const response = await this.aiSystem.processCommand(prompt, {
          type: 'intent_classification',
          maxTokens: 200,
        });

        if (response.success) {
          const aiResult = this.extractJSONFromResponse(response.content);
          if (aiResult) {
            return {
              name: aiResult.intent,
              confidence: aiResult.confidence,
              reasoning: aiResult.reasoning,
              method: 'ai',
            };
          }
        }
      } catch (error) {
        console.error('AI intent recognition failed:', error);
      }
    }

    // Fallback to keyword matching
    return this.fallbackIntentRecognition(text);
  }

  fallbackIntentRecognition(text) {
    const keywordIntents = {
      navigate: ['go to', 'navigate', 'open', 'visit', 'load'],
      fill_form: ['fill', 'populate', 'enter', 'type', 'input'],
      click: ['click', 'press', 'tap', 'select', 'choose'],
      scan: ['scan', 'capture', 'read', 'ocr'],
      transfer: ['transfer', 'copy', 'move', 'send'],
      analyze: ['analyze', 'examine', 'study', 'check'],
      search: ['search', 'find', 'look for', 'locate'],
      workflow: ['workflow', 'automate', 'record', 'execute'],
    };

    for (const [intent, keywords] of Object.entries(keywordIntents)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          return {
            name: intent,
            confidence: 0.7,
            method: 'keyword',
          };
        }
      }
    }

    return {
      name: 'unknown',
      confidence: 0.3,
      method: 'fallback',
    };
  }

  extractEntities(text) {
    const entities = [];

    // URL patterns
    const urlPattern = /https?:\/\/[^\s]+/g;
    const urls = text.match(urlPattern) || [];
    urls.forEach((url) => {
      entities.push({
        type: 'url',
        value: url,
        confidence: 0.95,
      });
    });

    // Email patterns
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = text.match(emailPattern) || [];
    emails.forEach((email) => {
      entities.push({
        type: 'email',
        value: email,
        confidence: 0.9,
      });
    });

    // Number patterns
    const numberPattern = /\b\d+(?:\.\d+)?\b/g;
    const numbers = text.match(numberPattern) || [];
    numbers.forEach((number) => {
      entities.push({
        type: 'number',
        value: parseFloat(number),
        confidence: 0.8,
      });
    });

    // Form field references
    const fieldPattern = /(?:field|input|box|form)\s+(?:named|called|labeled)\s+([\w\s]+)/gi;
    let match;
    while ((match = fieldPattern.exec(text)) !== null) {
      entities.push({
        type: 'form_field',
        value: match[1].trim(),
        confidence: 0.8,
      });
    }

    return entities;
  }

  // Command Execution
  async executeVoiceCommand(nluResult) {
    const { intent, entities, originalText } = nluResult;

    console.log(`🎯 Executing voice command: ${intent.name} (${intent.confidence})`);

    switch (intent.name) {
      case 'navigate':
        return await this.executeNavigateCommand(entities, originalText);
      case 'fill_form':
        return await this.executeFillFormCommand(entities, originalText);
      case 'click':
        return await this.executeClickCommand(entities, originalText);
      case 'scan':
        return await this.executeScanCommand(entities, originalText);
      case 'transfer':
        return await this.executeTransferCommand(entities, originalText);
      case 'analyze':
        return await this.executeAnalyzeCommand(entities, originalText);
      case 'search':
        return await this.executeSearchCommand(entities, originalText);
      case 'workflow':
        return await this.executeWorkflowCommand(entities, originalText);
      case 'control':
        return await this.executeControlCommand(entities, originalText);
      default:
        return await this.executeGenericCommand(nluResult);
    }
  }

  async executeNavigateCommand(entities, originalText) {
    // Look for URLs in entities
    const urlEntity = entities.find((e) => e.type === 'url');
    if (urlEntity) {
      this.mainWindow.webContents.send('voice-navigate', { url: urlEntity.value });
      return {
        success: true,
        message: `Navigating to ${urlEntity.value}`,
        speak: true,
      };
    }

    // Use AI to extract navigation intent
    if (this.aiSystem) {
      const prompt = `Extract navigation target from: "${originalText}"
            
Return JSON: {"url": "https://example.com", "reasoning": "why"}`;

      const response = await this.aiSystem.processCommand(prompt, {
        type: 'navigation_extraction',
        maxTokens: 150,
      });

      if (response.success) {
        const aiResult = this.extractJSONFromResponse(response.content);
        if (aiResult?.url) {
          this.mainWindow.webContents.send('voice-navigate', { url: aiResult.url });
          return {
            success: true,
            message: `Navigating to ${aiResult.url}`,
            speak: true,
          };
        }
      }
    }

    return {
      success: false,
      message: "I couldn't determine where you want to navigate. Could you be more specific?",
      speak: true,
    };
  }

  async executeFillFormCommand(entities, originalText) {
    // Send to AI system for form filling
    this.mainWindow.webContents.send('voice-fill-form', {
      command: originalText,
      entities: entities,
    });

    return {
      success: true,
      message: "I'll fill the form for you",
      speak: true,
    };
  }

  async executeClickCommand(entities, originalText) {
    // Use AI to determine what to click
    if (this.aiSystem) {
      const prompt = `Determine what element to click based on: "${originalText}"
            
Return JSON: {"selector": "css_selector", "text": "button_text", "reasoning": "why"}`;

      const response = await this.aiSystem.processCommand(prompt, {
        type: 'click_extraction',
        maxTokens: 150,
      });

      if (response.success) {
        const aiResult = this.extractJSONFromResponse(response.content);
        if (aiResult) {
          this.mainWindow.webContents.send('voice-click', aiResult);
          return {
            success: true,
            message: `Clicking ${aiResult.text || aiResult.selector}`,
            speak: true,
          };
        }
      }
    }

    return {
      success: false,
      message: "I couldn't determine what to click. Could you be more specific?",
      speak: true,
    };
  }

  async executeScanCommand() {
    this.mainWindow.webContents.send('voice-scan-document');

    return {
      success: true,
      message: 'Opening document scanner',
      speak: true,
    };
  }

  async executeTransferCommand(command, entities) {
    this.mainWindow.webContents.send('voice-transfer-data', {
      command,
      entities,
    });

    return {
      success: true,
      message: 'Initiating data transfer',
      speak: true,
    };
  }

  async executeAnalyzeCommand() {
    this.mainWindow.webContents.send('voice-analyze-page');

    return {
      success: true,
      message: 'Analyzing the current page',
      speak: true,
    };
  }

  async executeSearchCommand(entities, originalText) {
    // Extract search query
    const searchQuery = originalText.replace(/^(search|find|look for)\s+/i, '');

    this.mainWindow.webContents.send('voice-search', {
      query: searchQuery,
    });

    return {
      success: true,
      message: `Searching for ${searchQuery}`,
      speak: true,
    };
  }

  async executeWorkflowCommand(entities, originalText) {
    this.mainWindow.webContents.send('voice-workflow', {
      command: originalText,
      entities: entities,
    });

    return {
      success: true,
      message: 'Processing workflow command',
      speak: true,
    };
  }

  async executeControlCommand(entities, originalText) {
    // Browser control commands
    if (originalText.includes('reload') || originalText.includes('refresh')) {
      this.mainWindow.webContents.send('voice-reload-page');
      return { success: true, message: 'Reloading page', speak: true };
    }

    if (originalText.includes('back')) {
      this.mainWindow.webContents.send('voice-go-back');
      return { success: true, message: 'Going back', speak: true };
    }

    if (originalText.includes('forward')) {
      this.mainWindow.webContents.send('voice-go-forward');
      return { success: true, message: 'Going forward', speak: true };
    }

    return {
      success: false,
      message: "I didn't recognize that browser control command",
      speak: true,
    };
  }

  async executeGenericCommand(nluResult) {
    // Send to AI system for generic processing
    if (this.aiSystem) {
      const response = await this.aiSystem.processCommand(nluResult.originalText, {
        type: 'voice_command',
        context: nluResult.context,
      });

      if (response.success) {
        return {
          success: true,
          message: response.content,
          speak: true,
          actions: response.actions,
        };
      }
    }

    return {
      success: false,
      message: "I'm not sure how to help with that. Could you try rephrasing?",
      speak: true,
    };
  }

  // Text-to-Speech
  async speak(text, options = {}) {
    if (!this.ttsSettings.enabled) return;

    const speechOptions = {
      text: text,
      voice: options.voice || this.ttsSettings.voice,
      rate: options.rate || this.ttsSettings.rate,
      pitch: options.pitch || this.ttsSettings.pitch,
      volume: options.volume || this.ttsSettings.volume,
    };

    return new Promise((resolve, reject) => {
      this.mainWindow.webContents.send('speak-text', speechOptions);

      this.mainWindow.webContents.once('speech-complete', resolve);
      this.mainWindow.webContents.once('speech-error', reject);

      // Timeout after 30 seconds
      setTimeout(() => {
        reject(new Error('Speech timeout'));
      }, 30000);
    });
  }

  // Command Pattern Management
  loadCommandPatterns() {
    // Navigation patterns
    this.commandPatterns.set(/go to|navigate to|open|visit/i, {
      name: 'navigate',
      confidence: 0.9,
    });

    // Form filling patterns
    this.commandPatterns.set(/fill (the |this )?form|populate (the |this )?form|enter data/i, {
      name: 'fill_form',
      confidence: 0.9,
    });

    // Clicking patterns
    this.commandPatterns.set(/click (the |on )?|press (the )?|tap (the )?/i, {
      name: 'click',
      confidence: 0.8,
    });

    // Scanning patterns
    this.commandPatterns.set(/scan|capture|read document|ocr/i, { name: 'scan', confidence: 0.95 });

    // Transfer patterns
    this.commandPatterns.set(/transfer|copy|move|send data/i, {
      name: 'transfer',
      confidence: 0.9,
    });

    // Analysis patterns
    this.commandPatterns.set(/analyze|examine|study|check (the |this )?page/i, {
      name: 'analyze',
      confidence: 0.9,
    });

    // Workflow patterns
    this.commandPatterns.set(/workflow|automate|record|execute/i, {
      name: 'workflow',
      confidence: 0.85,
    });

    console.log(`📝 Loaded ${this.commandPatterns.size} command patterns`);
  }

  // Wake Word Detection
  startWakeWordDetection() {
    if (!this.settings.wakeWordEnabled) return;

    this.mainWindow.webContents.send('start-wake-word-detection', {
      wakeWord: this.settings.wakeWord,
      sensitivity: 0.8,
    });

    this.mainWindow.webContents.on('wake-word-detected', () => {
      this.handleWakeWord();
    });

    console.log(`👂 Wake word detection started: "${this.settings.wakeWord}"`);
  }

  async handleWakeWord() {
    console.log('🔊 Wake word detected');
    this.emit('wake-word-detected');

    // Start listening for command
    await this.startListening({
      continuous: false,
      timeoutMs: 8000,
    });

    // Provide audio feedback
    if (this.ttsSettings.enabled) {
      await this.speak('Yes?', { rate: 1.2 });
    }
  }

  // Context Management
  getConversationContext() {
    return {
      recentCommands: this.conversationHistory.slice(-5),
      currentPage: this.getCurrentPageContext(),
      activeWorkflows: this.getActiveWorkflows(),
      timestamp: Date.now(),
    };
  }

  getCurrentPageContext() {
    // This would be provided by the main window
    return {
      url: 'current-url',
      title: 'current-title',
      hasForm: false,
      elements: [],
    };
  }

  getActiveWorkflows() {
    // This would be provided by the workflow system
    return [];
  }

  // Utility Functions
  calculateNLUConfidence(nluResult) {
    let confidence = 0;

    // Intent confidence (weighted 60%)
    if (nluResult.intent) {
      confidence += nluResult.intent.confidence * 0.6;
    }

    // Entity confidence (weighted 30%)
    if (nluResult.entities.length > 0) {
      const entityConfidence =
        nluResult.entities.reduce((sum, entity) => sum + entity.confidence, 0) /
        nluResult.entities.length;
      confidence += entityConfidence * 0.3;
    }

    // Context relevance (weighted 10%)
    confidence += 0.1; // Base context relevance

    return Math.min(confidence, 1.0);
  }

  updateAverageConfidence(newConfidence) {
    const totalCommands = this.metrics.commandsProcessed;
    this.metrics.averageConfidence =
      (this.metrics.averageConfidence * (totalCommands - 1) + newConfidence) / totalCommands;
  }

  extractJSONFromResponse(text) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (error) {
      return null;
    }
  }

  // Event Handlers
  handleSpeechStart() {
    this.emit('speech-started');
  }

  handleSpeechEnd() {
    this.emit('speech-ended');
  }

  handleSpeechError(error) {
    console.error('Speech recognition error:', error);
    this.emit('speech-error', error);

    if (this.isListening) {
      this.stopListening();
    }
  }

  // API Methods
  getSettings() {
    return { ...this.settings };
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };

    // Apply settings to active components
    if (this.isListening) {
      this.mainWindow.webContents.send('update-speech-settings', this.settings);
    }

    this.emit('settings-updated', this.settings);
  }

  getTTSSettings() {
    return { ...this.ttsSettings };
  }

  updateTTSSettings(newSettings) {
    this.ttsSettings = { ...this.ttsSettings, ...newSettings };

    this.mainWindow.webContents.send('update-tts-settings', this.ttsSettings);
    this.emit('tts-settings-updated', this.ttsSettings);
  }

  getAvailableVoices() {
    return this.availableVoices || [];
  }

  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.successfulCommands / this.metrics.commandsProcessed,
      averageSessionDuration: this.metrics.totalListeningTime / this.sessions.size,
    };
  }

  getSessions() {
    return Array.from(this.sessions.values());
  }

  getConversationHistory() {
    return this.conversationHistory;
  }

  clearConversationHistory() {
    this.conversationHistory = [];
    this.emit('conversation-cleared');
  }

  // NLU Management
  addCustomIntent(name, patterns, confidence = 0.8) {
    this.nluEngine.intents.set(name, {
      patterns: patterns,
      confidence: confidence,
      usage: 0,
    });

    // Add to command patterns
    patterns.forEach((pattern) => {
      this.commandPatterns.set(new RegExp(pattern, 'i'), {
        name: name,
        confidence: confidence,
      });
    });

    this.emit('intent-added', { name, patterns });
  }

  removeCustomIntent(name) {
    this.nluEngine.intents.delete(name);

    // Remove from command patterns
    for (const [pattern, intent] of this.commandPatterns) {
      if (intent.name === name) {
        this.commandPatterns.delete(pattern);
      }
    }

    this.emit('intent-removed', { name });
  }

  // Initialization Methods
  initializeNLU() {
    // Initialize built-in intents
    this.nluEngine.intents.set('navigate', {
      patterns: ['go to *', 'navigate to *', 'open *', 'visit *'],
      confidence: 0.9,
      usage: 0,
    });

    this.nluEngine.intents.set('fill_form', {
      patterns: ['fill form', 'populate form', 'enter data'],
      confidence: 0.9,
      usage: 0,
    });

    console.log('🧠 NLU engine initialized');
  }

  async shutdown() {
    if (this.isListening) {
      await this.stopListening();
    }

    // Clean up any active sessions
    this.sessions.clear();

    console.log('🔄 Voice Assistant shutdown complete');
  }
}

module.exports = VoiceAssistant;
