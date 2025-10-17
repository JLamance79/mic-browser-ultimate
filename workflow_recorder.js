// Advanced Workflow Recorder & Execution Engine
const { EventEmitter } = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class WorkflowRecorder extends EventEmitter {
  constructor(mainWindow) {
    super();
    this.mainWindow = mainWindow;

    // Recording state
    this.isRecording = false;
    this.currentWorkflow = null;
    this.recordingSession = null;

    // Workflow storage
    this.workflows = new Map();
    this.templates = new Map();
    this.executions = new Map();

    // AI-powered features
    this.patternRecognition = {
      commonSequences: new Map(),
      userPatterns: new Map(),
      optimizationSuggestions: [],
    };

    // Smart recording settings
    this.recordingSettings = {
      captureClicks: true,
      captureTyping: true,
      captureNavigation: true,
      captureScrolling: false,
      captureHovers: false,
      ignoreSystem: true,
      smartGrouping: true,
      autoOptimize: true,
    };

    // Execution engine
    this.executor = {
      running: new Map(),
      queue: [],
      parallel: new Map(),
      retryAttempts: 3,
      timeoutMs: 30000,
    };

    this.initialize();
  }

  async initialize() {
    try {
      // Load existing workflows
      await this.loadWorkflows();

      // Initialize pattern recognition
      this.initializePatternRecognition();

      // Setup execution engine
      this.setupExecutionEngine();

      // Load workflow templates
      await this.loadTemplates();

      console.log('✅ Workflow Recorder initialized');
      this.emit('initialized');
    } catch (error) {
      console.error('❌ Workflow Recorder initialization failed:', error);
      throw error;
    }
  }

  // Recording Functions
  async startRecording(workflowName, options = {}) {
    if (this.isRecording) {
      throw new Error('Already recording a workflow');
    }

    this.isRecording = true;
    this.recordingSession = {
      id: crypto.randomBytes(16).toString('hex'),
      name: workflowName,
      startTime: Date.now(),
      steps: [],
      context: {
        url: options.url || 'unknown',
        userAgent: options.userAgent || 'unknown',
        screenResolution: options.screenResolution || 'unknown',
      },
      settings: { ...this.recordingSettings, ...options.settings },
    };

    // Start capturing events
    await this.startEventCapture();

    this.emit('recording-started', {
      sessionId: this.recordingSession.id,
      workflowName: workflowName,
    });

    console.log(`🔴 Started recording workflow: ${workflowName}`);
    return this.recordingSession.id;
  }

  async stopRecording() {
    if (!this.isRecording) {
      throw new Error('Not currently recording');
    }

    this.isRecording = false;

    // Stop event capture
    await this.stopEventCapture();

    // Process and optimize recorded steps
    const workflow = await this.processRecording();

    // Store the workflow
    this.workflows.set(workflow.id, workflow);
    await this.saveWorkflow(workflow);

    // Analyze for patterns
    this.analyzeWorkflowPatterns(workflow);

    const sessionId = this.recordingSession.id;
    this.recordingSession = null;

    this.emit('recording-stopped', {
      sessionId: sessionId,
      workflow: workflow,
    });

    console.log(`⏹️ Stopped recording. Created workflow: ${workflow.name}`);
    return workflow;
  }

  async recordStep(step) {
    if (!this.isRecording) return;

    const recordedStep = {
      id: crypto.randomBytes(8).toString('hex'),
      timestamp: Date.now(),
      type: step.type,
      action: step.action,
      target: step.target,
      data: step.data,
      context: step.context,
      screenshot: step.screenshot || null,
      validation: step.validation || null,
    };

    // Apply smart filtering
    if (this.shouldRecordStep(recordedStep)) {
      this.recordingSession.steps.push(recordedStep);

      // Real-time optimization
      if (this.recordingSettings.autoOptimize) {
        this.optimizeCurrentRecording();
      }

      this.emit('step-recorded', recordedStep);
    }
  }

  shouldRecordStep(step) {
    // Filter out irrelevant steps
    const ignoredActions = ['mousemove', 'mouseenter', 'mouseleave'];
    if (this.recordingSettings.ignoreSystem && ignoredActions.includes(step.action)) {
      return false;
    }

    // Smart duplicate detection
    const lastStep = this.recordingSession.steps[this.recordingSession.steps.length - 1];
    if (lastStep && this.isDuplicateStep(lastStep, step)) {
      return false;
    }

    return true;
  }

  isDuplicateStep(step1, step2) {
    return (
      step1.type === step2.type &&
      step1.action === step2.action &&
      step1.target === step2.target &&
      Date.now() - step1.timestamp < 1000
    ); // Within 1 second
  }

  // Workflow Processing
  async processRecording() {
    const session = this.recordingSession;

    // Create workflow object
    const workflow = {
      id: session.id,
      name: session.name,
      description: await this.generateDescription(session.steps),
      created: session.startTime,
      modified: Date.now(),
      version: '1.0.0',
      steps: session.steps,
      context: session.context,
      metadata: {
        duration: Date.now() - session.startTime,
        stepCount: session.steps.length,
        complexity: this.calculateComplexity(session.steps),
        estimatedExecutionTime: this.estimateExecutionTime(session.steps),
      },
      settings: session.settings,
      tags: await this.generateTags(session.steps),
      category: await this.categorizeWorkflow(session.steps),
    };

    // Apply optimizations
    workflow.steps = await this.optimizeSteps(workflow.steps);

    // Add validation rules
    workflow.validation = this.generateValidationRules(workflow.steps);

    // Generate variable extraction
    workflow.variables = this.extractVariables(workflow.steps);

    return workflow;
  }

  async optimizeSteps(steps) {
    let optimized = [...steps];

    // Remove redundant steps
    optimized = this.removeRedundantSteps(optimized);

    // Group related actions
    optimized = this.groupRelatedActions(optimized);

    // Add smart waits
    optimized = this.addSmartWaits(optimized);

    // Optimize selectors
    optimized = await this.optimizeSelectors(optimized);

    return optimized;
  }

  removeRedundantSteps(steps) {
    const filtered = [];
    const seen = new Set();

    for (const step of steps) {
      const key = `${step.type}-${step.action}-${step.target}`;

      if (step.action === 'type' && seen.has(key)) {
        // Merge typing actions on same element
        const lastStep = filtered[filtered.length - 1];
        if (lastStep.target === step.target) {
          lastStep.data.value += step.data.value;
          continue;
        }
      }

      filtered.push(step);
      seen.add(key);
    }

    return filtered;
  }

  groupRelatedActions(steps) {
    const grouped = [];
    let currentGroup = null;

    for (const step of steps) {
      if (this.canGroupWithPrevious(step, currentGroup)) {
        currentGroup.steps.push(step);
      } else {
        if (currentGroup) {
          grouped.push(currentGroup);
        }

        currentGroup = {
          type: 'group',
          name: this.generateGroupName(step),
          steps: [step],
          parallel: false,
        };
      }
    }

    if (currentGroup) {
      grouped.push(currentGroup);
    }

    return grouped.length > 1 ? grouped : steps;
  }

  canGroupWithPrevious(step, currentGroup) {
    if (!currentGroup || currentGroup.steps.length === 0) return false;

    const lastStep = currentGroup.steps[currentGroup.steps.length - 1];

    // Group form filling actions
    if (step.type === 'input' && lastStep.type === 'input') {
      return this.areInSameForm(step.target, lastStep.target);
    }

    // Group navigation actions
    if (step.type === 'navigation' && lastStep.type === 'navigation') {
      return step.timestamp - lastStep.timestamp < 5000; // Within 5 seconds
    }

    return false;
  }

  addSmartWaits(steps) {
    const enhanced = [];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const nextStep = steps[i + 1];

      enhanced.push(step);

      // Add wait after navigation
      if (step.action === 'click' && step.target?.includes('a[href')) {
        enhanced.push({
          type: 'wait',
          action: 'wait_for_navigation',
          timeout: 10000,
          condition: 'page_load',
        });
      }

      // Add wait for dynamic content
      if (nextStep && this.needsWaitBetween(step, nextStep)) {
        enhanced.push({
          type: 'wait',
          action: 'wait_for_element',
          target: nextStep.target,
          timeout: 5000,
          condition: 'visible',
        });
      }
    }

    return enhanced;
  }

  needsWaitBetween(step1, step2) {
    // Wait if clicking something that might load content
    if (step1.action === 'click' && step2.type === 'input') {
      return true;
    }

    // Wait if submitting forms
    if (step1.action === 'click' && step1.target?.includes('submit')) {
      return true;
    }

    return false;
  }

  async optimizeSelectors(steps) {
    for (const step of steps) {
      if (step.target) {
        step.target = await this.optimizeSelector(step.target, step.context);
      }
    }
    return steps;
  }

  async optimizeSelector(selector, context) {
    // Create robust selectors that are less likely to break
    const optimizations = [
      // Prefer data attributes
      (selector) => selector.replace(/id="([^"]+)"/, '[data-testid="$1"], [id="$1"]'),

      // Make class selectors more flexible
      (selector) => selector.replace(/\.([a-zA-Z0-9_-]+)/, '[class*="$1"]'),

      // Add fallbacks for text-based selectors
      (selector) => {
        if (context?.textContent) {
          return `${selector}, :contains("${context.textContent}")`;
        }
        return selector;
      },
    ];

    let optimized = selector;
    for (const optimization of optimizations) {
      optimized = optimization(optimized);
    }

    return optimized;
  }

  // Execution Functions
  async executeWorkflow(workflowId, parameters = {}) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const execution = {
      id: crypto.randomBytes(16).toString('hex'),
      workflowId: workflowId,
      startTime: Date.now(),
      parameters: parameters,
      status: 'running',
      currentStep: 0,
      results: {},
      errors: [],
      screenshots: [],
    };

    this.executions.set(execution.id, execution);
    this.executor.running.set(execution.id, execution);

    try {
      this.emit('execution-started', execution);

      const result = await this.runWorkflowSteps(workflow, execution);

      execution.status = 'completed';
      execution.endTime = Date.now();
      execution.duration = execution.endTime - execution.startTime;
      execution.results = result;

      this.emit('execution-completed', execution);
      console.log(`✅ Workflow executed successfully: ${workflow.name}`);

      return execution;
    } catch (error) {
      execution.status = 'failed';
      execution.endTime = Date.now();
      execution.error = error.message;
      execution.errors.push({
        step: execution.currentStep,
        error: error.message,
        timestamp: Date.now(),
      });

      this.emit('execution-failed', execution);
      console.error(`❌ Workflow execution failed: ${workflow.name}`, error);

      throw error;
    } finally {
      this.executor.running.delete(execution.id);
    }
  }

  async runWorkflowSteps(workflow, execution) {
    const results = {};

    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      execution.currentStep = i;

      this.emit('step-executing', { execution, step });

      try {
        const stepResult = await this.executeStep(step, execution);
        results[`step_${i}`] = stepResult;

        // Update execution progress
        this.emit('execution-progress', {
          executionId: execution.id,
          progress: (i + 1) / workflow.steps.length,
          currentStep: i + 1,
          totalSteps: workflow.steps.length,
        });
      } catch (error) {
        // Try recovery strategies
        const recovered = await this.attemptRecovery(step, error, execution);
        if (!recovered) {
          throw error;
        }
      }
    }

    return results;
  }

  async executeStep(step, execution) {
    switch (step.type) {
      case 'navigation':
        return await this.executeNavigation(step, execution);
      case 'click':
        return await this.executeClick(step, execution);
      case 'input':
        return await this.executeInput(step, execution);
      case 'wait':
        return await this.executeWait(step, execution);
      case 'extract':
        return await this.executeExtract(step, execution);
      case 'validate':
        return await this.executeValidate(step, execution);
      case 'group':
        return await this.executeGroup(step, execution);
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  async executeNavigation(step, execution) {
    const url = this.resolveVariables(step.data.url, execution.parameters);

    // Send navigation command to main window
    this.mainWindow.webContents.send('execute-navigation', {
      url: url,
      waitFor: step.data.waitFor || 'load',
    });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Navigation timeout'));
      }, 10000);

      this.mainWindow.webContents.once('navigation-complete', (result) => {
        clearTimeout(timeout);
        resolve(result);
      });
    });
  }

  async executeClick(step, execution) {
    const selector = this.resolveVariables(step.target, execution.parameters);

    this.mainWindow.webContents.send('execute-click', {
      selector: selector,
      options: step.data || {},
    });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Click timeout'));
      }, 5000);

      this.mainWindow.webContents.once('click-complete', (result) => {
        clearTimeout(timeout);
        if (result.success) {
          resolve(result);
        } else {
          reject(new Error(result.error));
        }
      });
    });
  }

  async executeInput(step, execution) {
    const selector = this.resolveVariables(step.target, execution.parameters);
    const value = this.resolveVariables(step.data.value, execution.parameters);

    this.mainWindow.webContents.send('execute-input', {
      selector: selector,
      value: value,
      options: {
        clear: step.data.clear !== false,
        validate: step.data.validate || false,
      },
    });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Input timeout'));
      }, 5000);

      this.mainWindow.webContents.once('input-complete', (result) => {
        clearTimeout(timeout);
        if (result.success) {
          resolve(result);
        } else {
          reject(new Error(result.error));
        }
      });
    });
  }

  async executeWait(step) {
    const duration = step.data.duration || 1000;
    const condition = step.data.condition;

    if (condition) {
      return await this.waitForCondition(condition, step.data);
    } else {
      await new Promise((resolve) => setTimeout(resolve, duration));
      return { waited: duration };
    }
  }

  async waitForCondition(condition, options) {
    const timeout = options.timeout || 10000;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const result = await this.checkCondition(condition, options);
      if (result) {
        return { condition: condition, result: result };
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    throw new Error(`Wait condition timeout: ${condition}`);
  }

  async checkCondition(condition, options) {
    switch (condition) {
      case 'element_visible':
        return await this.isElementVisible(options.selector);
      case 'page_load':
        return await this.isPageLoaded();
      case 'text_present':
        return await this.isTextPresent(options.text);
      default:
        return true;
    }
  }

  // Pattern Recognition & AI Features
  analyzeWorkflowPatterns(workflow) {
    // Analyze step patterns
    const patterns = this.extractStepPatterns(workflow.steps);

    // Update pattern database
    for (const pattern of patterns) {
      const existing = this.patternRecognition.commonSequences.get(pattern.signature);
      if (existing) {
        existing.frequency++;
        existing.lastSeen = Date.now();
      } else {
        this.patternRecognition.commonSequences.set(pattern.signature, {
          pattern: pattern,
          frequency: 1,
          firstSeen: Date.now(),
          lastSeen: Date.now(),
        });
      }
    }

    // Generate optimization suggestions
    this.generateOptimizationSuggestions(workflow);
  }

  extractStepPatterns(steps) {
    const patterns = [];

    // Look for common sequences (2-5 steps)
    for (let len = 2; len <= 5 && len <= steps.length; len++) {
      for (let i = 0; i <= steps.length - len; i++) {
        const sequence = steps.slice(i, i + len);
        const signature = this.createPatternSignature(sequence);

        patterns.push({
          signature: signature,
          steps: sequence,
          length: len,
          position: i,
        });
      }
    }

    return patterns;
  }

  createPatternSignature(steps) {
    return steps.map((step) => `${step.type}:${step.action}`).join('-');
  }

  generateOptimizationSuggestions(workflow) {
    const suggestions = [];

    // Check for parallel execution opportunities
    const parallelizable = this.findParallelizableSteps(workflow.steps);
    if (parallelizable.length > 0) {
      suggestions.push({
        type: 'parallelization',
        message: `${parallelizable.length} steps can be run in parallel`,
        impact: 'high',
        steps: parallelizable,
      });
    }

    // Check for redundant operations
    const redundant = this.findRedundantOperations(workflow.steps);
    if (redundant.length > 0) {
      suggestions.push({
        type: 'redundancy',
        message: `${redundant.length} redundant operations found`,
        impact: 'medium',
        steps: redundant,
      });
    }

    // Add to optimization suggestions
    this.patternRecognition.optimizationSuggestions.push(...suggestions);

    this.emit('optimization-suggestions', {
      workflowId: workflow.id,
      suggestions: suggestions,
    });
  }

  // Template System
  async generateTemplateFromWorkflow(workflowId, templateName) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const template = {
      id: crypto.randomBytes(16).toString('hex'),
      name: templateName,
      description: `Template generated from ${workflow.name}`,
      category: workflow.category,
      baseWorkflowId: workflowId,
      variables: this.extractTemplateVariables(workflow),
      steps: this.templatizeSteps(workflow.steps),
      metadata: {
        created: Date.now(),
        usage: 0,
        rating: 0,
      },
    };

    this.templates.set(template.id, template);
    await this.saveTemplate(template);

    return template;
  }

  extractTemplateVariables(workflow) {
    const variables = [];
    const variablePatterns = [
      /{{([^}]+)}}/g, // Mustache-style variables
      /\$\{([^}]+)\}/g, // ES6-style variables
      /\[([A-Z_]+)\]/g, // Placeholder-style variables
    ];

    const stepStr = JSON.stringify(workflow.steps);
    for (const pattern of variablePatterns) {
      let match;
      while ((match = pattern.exec(stepStr)) !== null) {
        const varName = match[1];
        if (!variables.find((v) => v.name === varName)) {
          variables.push({
            name: varName,
            type: this.guessVariableType(varName),
            required: true,
            description: `Variable for ${varName}`,
          });
        }
      }
    }

    return variables;
  }

  guessVariableType(varName) {
    const name = varName.toLowerCase();
    if (name.includes('email')) return 'email';
    if (name.includes('url') || name.includes('link')) return 'url';
    if (name.includes('phone')) return 'phone';
    if (name.includes('date')) return 'date';
    if (name.includes('number') || name.includes('amount')) return 'number';
    return 'text';
  }

  // Utility Functions
  resolveVariables(text, variables) {
    if (!text || typeof text !== 'string') return text;

    let resolved = text;

    // Replace variable patterns
    resolved = resolved.replace(/{{([^}]+)}}/g, (match, varName) => {
      return variables[varName] || match;
    });

    resolved = resolved.replace(/\$\{([^}]+)\}/g, (match, varName) => {
      return variables[varName] || match;
    });

    return resolved;
  }

  calculateComplexity(steps) {
    let complexity = 0;

    for (const step of steps) {
      switch (step.type) {
        case 'click':
        case 'input':
          complexity += 1;
          break;
        case 'navigation':
          complexity += 2;
          break;
        case 'wait':
          complexity += 0.5;
          break;
        case 'extract':
        case 'validate':
          complexity += 3;
          break;
        case 'group':
          complexity += step.steps ? step.steps.length * 0.8 : 2;
          break;
        default:
          complexity += 1;
      }
    }

    return Math.round(complexity * 10) / 10;
  }

  estimateExecutionTime(steps) {
    let totalTime = 0;

    for (const step of steps) {
      switch (step.type) {
        case 'click':
          totalTime += 500; // 0.5 seconds
          break;
        case 'input':
          totalTime += 1000; // 1 second
          break;
        case 'navigation':
          totalTime += 3000; // 3 seconds
          break;
        case 'wait':
          totalTime += step.data?.duration || 1000;
          break;
        case 'extract':
          totalTime += 2000; // 2 seconds
          break;
        case 'validate':
          totalTime += 1500; // 1.5 seconds
          break;
        case 'group':
          totalTime += step.steps ? this.estimateExecutionTime(step.steps) : 2000;
          break;
        default:
          totalTime += 1000;
      }
    }

    return totalTime;
  }

  // Storage Functions
  async saveWorkflow(workflow) {
    const workflowsDir = path.join(process.cwd(), 'data', 'workflows');
    await fs.mkdir(workflowsDir, { recursive: true });

    const filePath = path.join(workflowsDir, `${workflow.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(workflow, null, 2));
  }

  async loadWorkflows() {
    try {
      const workflowsDir = path.join(process.cwd(), 'data', 'workflows');
      const files = await fs.readdir(workflowsDir);

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(workflowsDir, file);
          const data = await fs.readFile(filePath, 'utf8');
          const workflow = JSON.parse(data);
          this.workflows.set(workflow.id, workflow);
        }
      }

      console.log(`📁 Loaded ${this.workflows.size} workflows`);
    } catch (error) {
      console.log('📁 No existing workflows found');
    }
  }

  async saveTemplate(template) {
    const templatesDir = path.join(process.cwd(), 'data', 'templates');
    await fs.mkdir(templatesDir, { recursive: true });

    const filePath = path.join(templatesDir, `${template.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(template, null, 2));
  }

  async loadTemplates() {
    try {
      const templatesDir = path.join(process.cwd(), 'data', 'templates');
      const files = await fs.readdir(templatesDir);

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(templatesDir, file);
          const data = await fs.readFile(filePath, 'utf8');
          const template = JSON.parse(data);
          this.templates.set(template.id, template);
        }
      }

      console.log(`📋 Loaded ${this.templates.size} templates`);
    } catch (error) {
      console.log('📋 No existing templates found');
    }
  }

  // API for external access
  getWorkflows() {
    return Array.from(this.workflows.values());
  }

  getWorkflow(id) {
    return this.workflows.get(id);
  }

  getTemplates() {
    return Array.from(this.templates.values());
  }

  getExecutions() {
    return Array.from(this.executions.values());
  }

  getPatterns() {
    return {
      commonSequences: Array.from(this.patternRecognition.commonSequences.values()),
      optimizationSuggestions: this.patternRecognition.optimizationSuggestions,
    };
  }

  async shutdown() {
    // Stop any running executions
    for (const [id, execution] of this.executor.running) {
      execution.status = 'cancelled';
      this.executor.running.delete(id);
    }

    // Save current state
    await this.saveState();

    console.log('🔄 Workflow Recorder shutdown complete');
  }

  async saveState() {
    // Save patterns and settings
    const state = {
      patterns: this.patternRecognition,
      settings: this.recordingSettings,
      timestamp: Date.now(),
    };

    const stateDir = path.join(process.cwd(), 'data');
    await fs.mkdir(stateDir, { recursive: true });
    await fs.writeFile(path.join(stateDir, 'workflow-state.json'), JSON.stringify(state, null, 2));
  }

  // Missing initialization methods
  initializePatternRecognition() {
    // Initialize AI pattern recognition system
    this.patternRecognition.learningRate = 0.1;
    this.patternRecognition.minConfidence = 0.7;
    this.patternRecognition.maxPatterns = 1000;
    
    console.log('🧠 Pattern recognition system initialized');
  }

  setupExecutionEngine() {
    // Initialize execution engine settings
    this.executor.concurrentLimit = 5;
    this.executor.defaultTimeout = 30000;
    this.executor.retryDelay = 1000;
    
    console.log('⚡ Execution engine configured');
  }

  async startEventCapture() {
    // Start capturing browser events for recording
    if (!this.mainWindow || !this.mainWindow.webContents) {
      console.log('📡 Event capture ready (mock mode)');
      return;
    }

    // Set up event listeners for the main window
    this.mainWindow.webContents.on('did-finish-load', () => {
      this.capturePageLoad();
    });

    console.log('📡 Event capture started');
  }

  async stopEventCapture() {
    // Stop capturing events
    if (this.mainWindow && this.mainWindow.webContents) {
      this.mainWindow.webContents.removeAllListeners('did-finish-load');
    }
    
    console.log('🛑 Event capture stopped');
  }

  capturePageLoad() {
    if (this.isRecording && this.recordingSession) {
      this.recordStep({
        type: 'navigation',
        action: 'page_load',
        target: this.mainWindow.webContents.getURL(),
        data: { 
          url: this.mainWindow.webContents.getURL(),
          title: this.mainWindow.webContents.getTitle()
        },
        context: { 
          timestamp: Date.now(),
          automatic: true
        }
      });
    }
  }

  optimizeCurrentRecording() {
    // Real-time optimization during recording
    if (!this.recordingSession || this.recordingSession.steps.length < 2) {
      return;
    }

    const steps = this.recordingSession.steps;
    const lastTwoSteps = steps.slice(-2);
    
    // Check for immediate duplicates
    if (this.isDuplicateStep(lastTwoSteps[0], lastTwoSteps[1])) {
      steps.pop(); // Remove the duplicate
      console.log('🔧 Removed duplicate step during recording');
    }
  }

  async generateDescription(steps) {
    // Generate workflow description from steps
    const actionCounts = {};
    steps.forEach(step => {
      actionCounts[step.type] = (actionCounts[step.type] || 0) + 1;
    });

    const descriptions = [];
    if (actionCounts.navigation) descriptions.push(`${actionCounts.navigation} navigation(s)`);
    if (actionCounts.click) descriptions.push(`${actionCounts.click} click(s)`);
    if (actionCounts.input) descriptions.push(`${actionCounts.input} input(s)`);
    if (actionCounts.wait) descriptions.push(`${actionCounts.wait} wait(s)`);

    return `Workflow with ${descriptions.join(', ')}`;
  }

  async generateTags(steps) {
    // Generate tags based on step types and patterns
    const tags = new Set();
    
    steps.forEach(step => {
      tags.add(step.type);
      if (step.target && step.target.includes('form')) tags.add('form');
      if (step.target && step.target.includes('button')) tags.add('button');
      if (step.data && step.data.url) tags.add('navigation');
    });

    return Array.from(tags);
  }

  async categorizeWorkflow(steps) {
    // Categorize workflow based on step patterns
    const hasNavigation = steps.some(s => s.type === 'navigation');
    const hasInput = steps.some(s => s.type === 'input');
    const hasClick = steps.some(s => s.type === 'click');

    if (hasNavigation && hasInput) return 'form-filling';
    if (hasNavigation) return 'navigation';
    if (hasInput) return 'data-entry';
    if (hasClick) return 'interaction';
    return 'general';
  }

  generateValidationRules(steps) {
    // Generate validation rules for workflow steps
    return {
      requiredElements: steps
        .filter(s => s.target)
        .map(s => s.target),
      expectedDuration: this.estimateExecutionTime(steps),
      criticalSteps: steps
        .filter(s => s.type === 'navigation' || s.type === 'click')
        .map((s, i) => i)
    };
  }

  extractVariables(steps) {
    // Extract variables from workflow steps
    const variables = [];
    const variablePattern = /{{([^}]+)}}/g;
    
    steps.forEach(step => {
      const stepStr = JSON.stringify(step);
      let match;
      while ((match = variablePattern.exec(stepStr)) !== null) {
        if (!variables.includes(match[1])) {
          variables.push(match[1]);
        }
      }
    });

    return variables;
  }

  areInSameForm(selector1, selector2) {
    // Check if two selectors are in the same form
    const formSelectors = ['form', '[role="form"]', '.form'];
    return formSelectors.some(formSel => 
      selector1.includes(formSel) && selector2.includes(formSel)
    );
  }

  generateGroupName(step) {
    // Generate a name for a group of steps
    switch (step.type) {
      case 'input': return 'Form Filling';
      case 'navigation': return 'Navigation';
      case 'click': return 'User Interaction';
      default: return 'Action Group';
    }
  }

  extractStepPatterns(steps) {
    // Extract patterns from workflow steps
    const patterns = [];
    
    for (let i = 0; i < steps.length - 1; i++) {
      const pattern = {
        sequence: [steps[i].type, steps[i + 1].type],
        signature: `${steps[i].type}->${steps[i + 1].type}`,
        context: {
          first: steps[i],
          second: steps[i + 1]
        }
      };
      patterns.push(pattern);
    }

    return patterns;
  }

  createPatternSignature(steps) {
    // Create a signature for a pattern
    return steps.map(s => s.type).join('->');
  }

  generateOptimizationSuggestions(workflow) {
    // Generate suggestions to optimize the workflow
    const suggestions = [];
    
    // Check for redundant waits
    const waits = workflow.steps.filter(s => s.type === 'wait');
    if (waits.length > 3) {
      suggestions.push({
        type: 'optimization',
        message: 'Consider reducing wait times or using smart waits',
        impact: 'performance'
      });
    }

    // Check for complex selectors
    const complexSelectors = workflow.steps.filter(s => 
      s.target && s.target.length > 50
    );
    if (complexSelectors.length > 0) {
      suggestions.push({
        type: 'reliability',
        message: 'Some selectors are complex and may be brittle',
        impact: 'reliability'
      });
    }

    this.patternRecognition.optimizationSuggestions = suggestions;
  }

  templatizeSteps(steps) {
    // Convert steps to template format with variables
    return steps.map(step => {
      const templatedStep = { ...step };
      
      // Replace common values with variables
      if (step.data && step.data.value) {
        templatedStep.data = { ...step.data };
        templatedStep.data.value = `{{${step.type.toUpperCase()}_VALUE}}`;
      }
      
      if (step.data && step.data.url) {
        templatedStep.data = { ...step.data };
        templatedStep.data.url = `{{BASE_URL}}${step.data.url}`;
      }
      
      return templatedStep;
    });
  }

  async attemptRecovery(step, error, execution) {
    // Attempt to recover from execution errors
    console.log(`🔄 Attempting recovery for step: ${step.type}`);
    
    // Simple retry logic
    if (execution.retryCount < this.executor.retryAttempts) {
      execution.retryCount = (execution.retryCount || 0) + 1;
      
      // Wait before retry
      await new Promise(resolve => 
        setTimeout(resolve, this.executor.retryDelay * execution.retryCount)
      );
      
      try {
        return await this.executeStep(step, execution);
      } catch (retryError) {
        console.log(`❌ Retry ${execution.retryCount} failed`);
        return false;
      }
    }
    
    return false;
  }

  async executeExtract(step, execution) {
    // Execute data extraction step
    const selector = this.resolveVariables(step.target, execution.parameters);
    
    console.log(`📊 Extracting data from: ${selector}`);
    
    // Mock extraction for testing
    return {
      success: true,
      data: 'extracted_data',
      selector: selector
    };
  }

  async executeValidate(step, execution) {
    // Execute validation step
    const condition = step.data.condition;
    
    console.log(`✅ Validating condition: ${condition}`);
    
    // Mock validation for testing
    return {
      success: true,
      condition: condition,
      result: true
    };
  }

  async executeGroup(step, execution) {
    // Execute a group of steps
    console.log(`📋 Executing group: ${step.steps.length} steps`);
    
    const results = [];
    for (const substep of step.steps) {
      const result = await this.executeStep(substep, execution);
      results.push(result);
    }
    
    return {
      success: true,
      groupResults: results
    };
  }

  async isElementVisible(selector) {
    // Check if element is visible (mock implementation)
    console.log(`👁️ Checking visibility of: ${selector}`);
    return true; // Mock response
  }

  async isPageLoaded() {
    // Check if page is loaded (mock implementation)
    console.log(`📄 Checking page load status`);
    return true; // Mock response
  }

  async isTextPresent(text) {
    // Check if text is present (mock implementation)
    console.log(`🔍 Checking for text: ${text}`);
    return true; // Mock response
  }
}

module.exports = WorkflowRecorder;
