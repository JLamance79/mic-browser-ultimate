// Learning Data Collection Integration
// Integrates learning data collection across all MIC Browser components

const { EventEmitter } = require('events');

class LearningIntegration extends EventEmitter {
  constructor(learningEngine) {
    super();
    this.learningEngine = learningEngine;
    this.integrations = new Map();
    this.dataCollectors = new Map();
    this.sessionManager = new SessionManager();
  }
  
  async initialize() {
    console.log('🔗 Initializing Learning Integration...');
    
    // Initialize session management
    await this.sessionManager.initialize();
    
    // Setup data collectors for each component
    this.setupDataCollectors();
    
    // Initialize component integrations
    await this.initializeIntegrations();
    
    console.log('✅ Learning Integration initialized');
  }
  
  setupDataCollectors() {
    // ChatAI data collector
    this.dataCollectors.set('chatai', new ChatAIDataCollector(this.learningEngine));
    
    // Voice Assistant data collector
    this.dataCollectors.set('voice', new VoiceAssistantDataCollector(this.learningEngine));
    
    // Workflow Recorder data collector
    this.dataCollectors.set('workflow', new WorkflowDataCollector(this.learningEngine));
    
    // OCR data collector
    this.dataCollectors.set('ocr', new OCRDataCollector(this.learningEngine));
    
    // UI interaction data collector
    this.dataCollectors.set('ui', new UIDataCollector(this.learningEngine));
    
    // Cross-tab transfer data collector
    this.dataCollectors.set('transfer', new TransferDataCollector(this.learningEngine));
  }
  
  async initializeIntegrations() {
    for (const [name, collector] of this.dataCollectors) {
      try {
        await collector.initialize();
        console.log(`📊 ${name} data collector initialized`);
      } catch (error) {
        console.error(`Error initializing ${name} data collector:`, error);
      }
    }
  }
  
  // Integration with existing components
  integrateWithChatAI(chatAI) {
    const collector = this.dataCollectors.get('chatai');
    if (collector && chatAI) {
      collector.attachToComponent(chatAI);
    }
  }
  
  integrateWithVoiceAssistant(voiceAssistant) {
    const collector = this.dataCollectors.get('voice');
    if (collector && voiceAssistant) {
      collector.attachToComponent(voiceAssistant);
    }
  }
  
  integrateWithWorkflowRecorder(workflowRecorder) {
    const collector = this.dataCollectors.get('workflow');
    if (collector && workflowRecorder) {
      collector.attachToComponent(workflowRecorder);
    }
  }
  
  integrateWithOCR(ocrProcessor) {
    const collector = this.dataCollectors.get('ocr');
    if (collector && ocrProcessor) {
      collector.attachToComponent(ocrProcessor);
    }
  }
  
  integrateWithUI(mainWindow) {
    const collector = this.dataCollectors.get('ui');
    if (collector && mainWindow) {
      collector.attachToComponent(mainWindow);
    }
  }
  
  integrateWithCrossTabTransfer(crossTabTransfer) {
    const collector = this.dataCollectors.get('transfer');
    if (collector && crossTabTransfer) {
      collector.attachToComponent(crossTabTransfer);
    }
  }
  
  // Generic interaction tracking
  async trackInteraction(interaction) {
    try {
      // Add session information
      const sessionId = this.sessionManager.getCurrentSessionId();
      const enhancedInteraction = {
        ...interaction,
        sessionId,
        timestamp: interaction.timestamp || Date.now(),
        userAgent: process.platform,
        version: process.env.npm_package_version || '1.0.0'
      };
      
      // Send to learning engine
      await this.learningEngine.trackInteraction(enhancedInteraction);
      
      // Emit for other listeners
      this.emit('interaction-tracked', enhancedInteraction);
      
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  }
  
  getDataCollector(component) {
    return this.dataCollectors.get(component);
  }
  
  getSessionManager() {
    return this.sessionManager;
  }

  // Additional methods for testing
  async collectComponentData(component, data) {
    const interaction = {
      type: 'component-data',
      component: component,
      data: data,
      timestamp: Date.now(),
      processed: true
    };

    await this.trackInteraction(interaction);
    return interaction;
  }

  async getCollectedData() {
    // Return collected data for testing
    return this.collectedData || [];
  }

  async getComponentData(component) {
    // Return data for specific component
    const allData = await this.getCollectedData();
    return allData.filter(item => item.component === component);
  }
}

// Session Management
class SessionManager {
  constructor() {
    this.currentSessionId = null;
    this.sessionStartTime = null;
    this.sessionData = {
      interactions: 0,
      components: new Set(),
      features: new Set()
    };
  }
  
  async initialize() {
    this.startNewSession();
  }
  
  startNewSession() {
    this.currentSessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    this.sessionData = {
      interactions: 0,
      components: new Set(),
      features: new Set()
    };
    
    console.log(`🎯 New learning session started: ${this.currentSessionId}`);
  }
  
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  getCurrentSessionId() {
    return this.currentSessionId;
  }
  
  updateSessionData(interaction) {
    this.sessionData.interactions++;
    this.sessionData.components.add(interaction.component);
    if (interaction.features) {
      interaction.features.forEach(feature => this.sessionData.features.add(feature));
    }
  }
  
  getSessionInfo() {
    return {
      sessionId: this.currentSessionId,
      startTime: this.sessionStartTime,
      duration: Date.now() - this.sessionStartTime,
      ...this.sessionData,
      components: Array.from(this.sessionData.components),
      features: Array.from(this.sessionData.features)
    };
  }
}

// Base Data Collector
class BaseDataCollector extends EventEmitter {
  constructor(learningEngine, componentName) {
    super();
    this.learningEngine = learningEngine;
    this.componentName = componentName;
    this.component = null;
    this.isAttached = false;
  }
  
  async initialize() {
    console.log(`📊 Initializing ${this.componentName} data collector`);
  }
  
  attachToComponent(component) {
    this.component = component;
    this.setupEventListeners();
    this.isAttached = true;
    console.log(`🔗 Data collector attached to ${this.componentName}`);
  }
  
  setupEventListeners() {
    // Override in subclasses
  }
  
  async trackInteraction(interactionData) {
    const interaction = {
      component: this.componentName,
      timestamp: Date.now(),
      ...interactionData
    };
    
    await this.learningEngine.trackInteraction(interaction);
  }
}

// ChatAI Data Collector
class ChatAIDataCollector extends BaseDataCollector {
  constructor(learningEngine) {
    super(learningEngine, 'chatai');
  }
  
  setupEventListeners() {
    if (!this.component) return;
    
    // Track message sending
    this.component.on('message-sent', (data) => {
      this.trackInteraction({
        action: 'message_sent',
        data: {
          messageLength: data.message?.length || 0,
          hasAttachments: Boolean(data.attachments),
          responseTime: data.responseTime
        },
        context: {
          roomId: data.roomId,
          messageType: data.type || 'user'
        },
        features: ['chat', 'communication']
      });
    });
    
    // Track AI responses
    this.component.on('ai-response', (data) => {
      this.trackInteraction({
        action: 'ai_response',
        data: {
          responseLength: data.response?.length || 0,
          confidence: data.confidence,
          processingTime: data.processingTime
        },
        context: {
          roomId: data.roomId,
          triggered: data.triggered
        },
        outcome: data.success ? 'success' : 'failed',
        features: ['ai', 'assistance']
      });
    });
    
    // Track user feedback on AI responses
    this.component.on('feedback-received', (data) => {
      this.trackInteraction({
        action: 'feedback_provided',
        data: {
          rating: data.rating,
          feedback: data.feedback
        },
        context: {
          messageId: data.messageId
        },
        satisfaction: data.rating,
        features: ['feedback', 'ai']
      });
    });
  }
}

// Voice Assistant Data Collector
class VoiceAssistantDataCollector extends BaseDataCollector {
  constructor(learningEngine) {
    super(learningEngine, 'voice');
  }
  
  setupEventListeners() {
    if (!this.component) return;
    
    // Track voice commands
    this.component.on('command-recognized', (data) => {
      this.trackInteraction({
        action: 'voice_command',
        data: {
          command: data.command,
          confidence: data.confidence,
          intent: data.intent
        },
        context: {
          noiseLevel: data.noiseLevel,
          language: data.language
        },
        features: ['voice', 'speech_recognition']
      });
    });
    
    // Track command execution
    this.component.on('command-executed', (data) => {
      this.trackInteraction({
        action: 'command_executed',
        data: {
          command: data.command,
          executionTime: data.executionTime
        },
        outcome: data.success ? 'success' : 'failed',
        features: ['voice', 'automation']
      });
    });
    
    // Track TTS usage
    this.component.on('speech-synthesized', (data) => {
      this.trackInteraction({
        action: 'tts_used',
        data: {
          textLength: data.text?.length || 0,
          voice: data.voice,
          rate: data.rate
        },
        features: ['voice', 'tts']
      });
    });
  }
}

// Workflow Data Collector
class WorkflowDataCollector extends BaseDataCollector {
  constructor(learningEngine) {
    super(learningEngine, 'workflow');
  }
  
  setupEventListeners() {
    if (!this.component) return;
    
    // Track workflow recording
    this.component.on('recording-started', (data) => {
      this.trackInteraction({
        action: 'recording_started',
        data: {
          workflowType: data.type
        },
        features: ['workflow', 'recording']
      });
    });
    
    // Track workflow execution
    this.component.on('workflow-executed', (data) => {
      this.trackInteraction({
        action: 'workflow_executed',
        data: {
          workflowId: data.workflowId,
          stepCount: data.steps?.length || 0,
          executionTime: data.executionTime,
          success: data.success
        },
        outcome: data.success ? 'success' : 'failed',
        features: ['workflow', 'automation']
      });
    });
    
    // Track pattern recognition
    this.component.on('pattern-detected', (data) => {
      this.trackInteraction({
        action: 'pattern_detected',
        data: {
          patternType: data.type,
          confidence: data.confidence
        },
        features: ['workflow', 'pattern_recognition']
      });
    });
  }
}

// OCR Data Collector
class OCRDataCollector extends BaseDataCollector {
  constructor(learningEngine) {
    super(learningEngine, 'ocr');
  }
  
  setupEventListeners() {
    if (!this.component) return;
    
    // Track OCR processing
    this.component.on('ocr-processed', (data) => {
      this.trackInteraction({
        action: 'ocr_processed',
        data: {
          imageSize: data.imageSize,
          textLength: data.extractedText?.length || 0,
          confidence: data.confidence,
          processingTime: data.processingTime,
          documentType: data.documentType
        },
        outcome: data.success ? 'success' : 'failed',
        features: ['ocr', 'document_processing']
      });
    });
    
    // Track AI enhancement
    this.component.on('ai-enhanced', (data) => {
      this.trackInteraction({
        action: 'ocr_ai_enhanced',
        data: {
          improvementScore: data.improvementScore,
          enhancementTime: data.enhancementTime
        },
        features: ['ocr', 'ai_enhancement']
      });
    });
  }
}

// UI Data Collector
class UIDataCollector extends BaseDataCollector {
  constructor(learningEngine) {
    super(learningEngine, 'ui');
  }
  
  setupEventListeners() {
    if (!this.component) return;
    
    // Listen to IPC events for UI interactions
    const { ipcMain } = require('electron');
    
    ipcMain.on('ui-interaction', (event, data) => {
      this.trackInteraction({
        action: data.action || 'interaction',
        data: {
          element: data.element,
          value: data.value,
          duration: data.duration
        },
        context: {
          page: data.page,
          section: data.section
        },
        features: ['ui', 'interaction']
      });
    });
    
    ipcMain.on('navigation', (event, data) => {
      this.trackInteraction({
        action: 'navigation',
        data: {
          from: data.from,
          to: data.to,
          method: data.method // click, shortcut, voice, etc.
        },
        features: ['ui', 'navigation']
      });
    });
    
    ipcMain.on('feature-used', (event, data) => {
      this.trackInteraction({
        action: 'feature_used',
        data: {
          feature: data.feature,
          method: data.method,
          success: data.success
        },
        outcome: data.success ? 'success' : 'failed',
        features: ['ui', data.feature]
      });
    });
  }
}

// Cross-Tab Transfer Data Collector
class TransferDataCollector extends BaseDataCollector {
  constructor(learningEngine) {
    super(learningEngine, 'transfer');
  }
  
  setupEventListeners() {
    if (!this.component) return;
    
    // Track data transfers
    this.component.on('transfer-initiated', (data) => {
      this.trackInteraction({
        action: 'transfer_initiated',
        data: {
          sourceType: data.sourceType,
          targetType: data.targetType,
          dataSize: data.dataSize
        },
        features: ['transfer', 'data_sync']
      });
    });
    
    this.component.on('transfer-completed', (data) => {
      this.trackInteraction({
        action: 'transfer_completed',
        data: {
          transferTime: data.transferTime,
          recordsTransferred: data.recordsTransferred,
          success: data.success
        },
        outcome: data.success ? 'success' : 'failed',
        features: ['transfer', 'data_sync']
      });
    });
  }
}

module.exports = {
  LearningIntegration,
  SessionManager,
  ChatAIDataCollector,
  VoiceAssistantDataCollector,
  WorkflowDataCollector,
  OCRDataCollector,
  UIDataCollector,
  TransferDataCollector
};