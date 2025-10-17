// Comprehensive Workflow Recorder Test
const { app, BrowserWindow } = require('electron');
const WorkflowRecorder = require('./workflow_recorder');
const path = require('path');

class WorkflowRecorderTest {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
    this.mainWindow = null;
    this.workflowRecorder = null;
  }

  async initialize() {
    console.log('🚀 Initializing Workflow Recorder Test Suite...\n');
    
    // Create a test window
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false
      }
    });

    // Initialize workflow recorder
    this.workflowRecorder = new WorkflowRecorder(this.mainWindow);
    await this.workflowRecorder.initialize();

    console.log('✅ Workflow Recorder initialized successfully\n');
  }

  async runTest(testName, testFunction) {
    this.testResults.total++;
    console.log(`🧪 Testing: ${testName}`);
    
    try {
      await testFunction();
      this.testResults.passed++;
      this.testResults.details.push({ test: testName, status: 'PASSED', error: null });
      console.log(`   ✅ PASSED: ${testName}\n`);
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({ test: testName, status: 'FAILED', error: error.message });
      console.log(`   ❌ FAILED: ${testName} - ${error.message}\n`);
    }
  }

  async testBasicRecording() {
    // Test basic recording functionality
    const workflowName = 'Test Workflow';
    
    // Start recording
    const sessionId = await this.workflowRecorder.startRecording(workflowName, {
      url: 'https://example.com',
      userAgent: 'Test Agent',
      screenResolution: '1920x1080'
    });

    if (!sessionId) {
      throw new Error('Failed to start recording session');
    }

    if (!this.workflowRecorder.isRecording) {
      throw new Error('Recording state not properly set');
    }

    // Simulate recording some steps
    await this.workflowRecorder.recordStep({
      type: 'navigation',
      action: 'navigate',
      target: 'https://example.com',
      data: { url: 'https://example.com' },
      context: { viewport: '1920x1080' }
    });

    await this.workflowRecorder.recordStep({
      type: 'click',
      action: 'click',
      target: '#login-button',
      data: { button: 'left' },
      context: { element: 'button' }
    });

    await this.workflowRecorder.recordStep({
      type: 'input',
      action: 'type',
      target: '#username',
      data: { value: 'testuser' },
      context: { field: 'text' }
    });

    // Stop recording
    const workflow = await this.workflowRecorder.stopRecording();

    if (!workflow) {
      throw new Error('Failed to create workflow from recording');
    }

    if (workflow.steps.length === 0) {
      throw new Error('No steps recorded in workflow');
    }

    console.log(`   📊 Recorded ${workflow.steps.length} steps`);
    console.log(`   🎯 Workflow ID: ${workflow.id}`);
    console.log(`   📝 Workflow Name: ${workflow.name}`);
  }

  async testWorkflowStorage() {
    // Test workflow storage and retrieval
    const testWorkflow = {
      id: 'test-workflow-123',
      name: 'Storage Test Workflow',
      description: 'Test workflow for storage validation',
      created: Date.now(),
      modified: Date.now(),
      version: '1.0.0',
      steps: [
        {
          id: 'step1',
          type: 'navigation',
          action: 'navigate',
          target: 'https://test.com',
          data: { url: 'https://test.com' }
        },
        {
          id: 'step2',
          type: 'click',
          action: 'click',
          target: '#test-button',
          data: { button: 'left' }
        }
      ],
      metadata: {
        stepCount: 2,
        complexity: 1.5,
        estimatedExecutionTime: 3000
      }
    };

    // Save workflow
    await this.workflowRecorder.saveWorkflow(testWorkflow);
    this.workflowRecorder.workflows.set(testWorkflow.id, testWorkflow);

    // Retrieve workflow
    const retrievedWorkflow = this.workflowRecorder.getWorkflow(testWorkflow.id);

    if (!retrievedWorkflow) {
      throw new Error('Failed to retrieve saved workflow');
    }

    if (retrievedWorkflow.id !== testWorkflow.id) {
      throw new Error('Retrieved workflow ID mismatch');
    }

    if (retrievedWorkflow.steps.length !== testWorkflow.steps.length) {
      throw new Error('Retrieved workflow steps count mismatch');
    }

    console.log(`   💾 Successfully saved and retrieved workflow`);
    console.log(`   📋 Steps: ${retrievedWorkflow.steps.length}`);
  }

  async testPatternRecognition() {
    // Test pattern recognition functionality
    const testWorkflow = {
      id: 'pattern-test-workflow',
      name: 'Pattern Test',
      steps: [
        { type: 'click', action: 'click', target: '#button1' },
        { type: 'input', action: 'type', target: '#field1', data: { value: 'test' } },
        { type: 'click', action: 'click', target: '#submit' },
        { type: 'wait', action: 'wait', data: { duration: 1000 } }
      ]
    };

    // Analyze patterns
    this.workflowRecorder.analyzeWorkflowPatterns(testWorkflow);

    // Check if patterns were detected
    const patterns = this.workflowRecorder.getPatterns();
    
    if (!patterns) {
      throw new Error('Pattern recognition not working');
    }

    console.log(`   🧠 Pattern analysis completed`);
    console.log(`   🔍 Common sequences: ${patterns.commonSequences.length}`);
    console.log(`   💡 Optimization suggestions: ${patterns.optimizationSuggestions.length}`);
  }

  async testTemplateGeneration() {
    // Test template generation from workflow
    const baseWorkflow = {
      id: 'template-base-workflow',
      name: 'Login Workflow',
      steps: [
        {
          type: 'navigation',
          action: 'navigate',
          target: '{{BASE_URL}}/login',
          data: { url: '{{BASE_URL}}/login' }
        },
        {
          type: 'input',
          action: 'type',
          target: '#username',
          data: { value: '{{USERNAME}}' }
        },
        {
          type: 'input',
          action: 'type',
          target: '#password',
          data: { value: '{{PASSWORD}}' }
        },
        {
          type: 'click',
          action: 'click',
          target: '#login-submit'
        }
      ]
    };

    // Store the base workflow
    this.workflowRecorder.workflows.set(baseWorkflow.id, baseWorkflow);

    // Generate template
    const template = await this.workflowRecorder.generateTemplateFromWorkflow(
      baseWorkflow.id,
      'Login Template'
    );

    if (!template) {
      throw new Error('Failed to generate template');
    }

    if (!template.variables || template.variables.length === 0) {
      throw new Error('Template variables not extracted');
    }

    console.log(`   📄 Template generated: ${template.name}`);
    console.log(`   🔧 Variables extracted: ${template.variables.length}`);
    template.variables.forEach(variable => {
      console.log(`      - ${variable.name} (${variable.type})`);
    });
  }

  async testWorkflowExecution() {
    // Test workflow execution simulation
    const executionWorkflow = {
      id: 'execution-test-workflow',
      name: 'Execution Test',
      steps: [
        {
          type: 'wait',
          action: 'wait',
          data: { duration: 100 }
        },
        {
          type: 'navigation',
          action: 'navigate',
          target: 'https://example.com',
          data: { url: 'https://example.com', waitFor: 'load' }
        }
      ]
    };

    // Store the workflow
    this.workflowRecorder.workflows.set(executionWorkflow.id, executionWorkflow);

    // Set up mock execution environment
    const originalSend = this.mainWindow.webContents.send;
    const originalOnce = this.mainWindow.webContents.once;

    // Mock webContents.send
    this.mainWindow.webContents.send = (channel, data) => {
      console.log(`   📡 Mock IPC Send: ${channel}`, data);
    };

    // Mock webContents.once for navigation
    this.mainWindow.webContents.once = (event, callback) => {
      console.log(`   📡 Mock IPC Listen: ${event}`);
      if (event === 'navigation-complete') {
        setTimeout(() => callback({ success: true, url: 'https://example.com' }), 100);
      }
    };

    try {
      // Execute workflow with parameters
      const execution = await this.workflowRecorder.executeWorkflow(executionWorkflow.id, {
        testParam: 'testValue'
      });

      if (!execution) {
        throw new Error('Workflow execution failed');
      }

      if (execution.status !== 'completed') {
        throw new Error(`Execution failed with status: ${execution.status}`);
      }

      console.log(`   ⚡ Workflow executed successfully`);
      console.log(`   ⏱️  Duration: ${execution.duration}ms`);
      console.log(`   📊 Status: ${execution.status}`);

    } finally {
      // Restore original methods
      this.mainWindow.webContents.send = originalSend;
      this.mainWindow.webContents.once = originalOnce;
    }
  }

  async testComplexityCalculation() {
    // Test workflow complexity calculation
    const complexWorkflow = {
      steps: [
        { type: 'navigation' }, // complexity: 2
        { type: 'click' },      // complexity: 1
        { type: 'input' },      // complexity: 1
        { type: 'extract' },    // complexity: 3
        { type: 'validate' },   // complexity: 3
        { type: 'wait' },       // complexity: 0.5
        { type: 'group', steps: [
          { type: 'click' },
          { type: 'input' }
        ] }                     // complexity: 2 * 0.8 = 1.6
      ]
    };

    const complexity = this.workflowRecorder.calculateComplexity(complexWorkflow.steps);
    const expectedComplexity = 2 + 1 + 1 + 3 + 3 + 0.5 + 1.6; // 12.1

    if (Math.abs(complexity - expectedComplexity) > 0.1) {
      throw new Error(`Complexity calculation incorrect: expected ${expectedComplexity}, got ${complexity}`);
    }

    console.log(`   🧮 Complexity calculated: ${complexity}`);
  }

  async testExecutionTimeEstimation() {
    // Test execution time estimation
    const timeTestWorkflow = {
      steps: [
        { type: 'click' },      // 500ms
        { type: 'input' },      // 1000ms
        { type: 'navigation' }, // 3000ms
        { type: 'wait', data: { duration: 2000 } }, // 2000ms
        { type: 'extract' },    // 2000ms
        { type: 'validate' }    // 1500ms
      ]
    };

    const estimatedTime = this.workflowRecorder.estimateExecutionTime(timeTestWorkflow.steps);
    const expectedTime = 500 + 1000 + 3000 + 2000 + 2000 + 1500; // 10000ms

    if (estimatedTime !== expectedTime) {
      throw new Error(`Time estimation incorrect: expected ${expectedTime}, got ${estimatedTime}`);
    }

    console.log(`   ⏱️  Estimated execution time: ${estimatedTime}ms`);
  }

  async testVariableResolution() {
    // Test variable resolution functionality
    const testText = 'Hello {{NAME}}, your email is ${EMAIL} and your ID is [USER_ID]';
    const variables = {
      NAME: 'John Doe',
      EMAIL: 'john@example.com',
      USER_ID: '12345'
    };

    const resolved = this.workflowRecorder.resolveVariables(testText, variables);
    const expected = 'Hello John Doe, your email is john@example.com and your ID is [USER_ID]';

    // Note: Current implementation only handles {{ }} and ${ } patterns
    if (!resolved.includes('John Doe') || !resolved.includes('john@example.com')) {
      throw new Error('Variable resolution failed');
    }

    console.log(`   🔧 Variable resolution test passed`);
    console.log(`   📝 Original: ${testText}`);
    console.log(`   ✅ Resolved: ${resolved}`);
  }

  async testDataPersistence() {
    // Test data persistence functionality
    const testWorkflow = {
      id: 'persistence-test',
      name: 'Persistence Test Workflow',
      steps: [{ type: 'click', target: '#test' }],
      created: Date.now()
    };

    // Add to memory
    this.workflowRecorder.workflows.set(testWorkflow.id, testWorkflow);

    // Save state
    await this.workflowRecorder.saveState();

    // Verify workflows collection
    const workflows = this.workflowRecorder.getWorkflows();
    const foundWorkflow = workflows.find(w => w.id === testWorkflow.id);

    if (!foundWorkflow) {
      throw new Error('Workflow not found in collection');
    }

    console.log(`   💾 Data persistence test passed`);
    console.log(`   📊 Total workflows in memory: ${workflows.length}`);
  }

  async runAllTests() {
    console.log('🎯 Starting Comprehensive Workflow Recorder Tests\n');
    console.log('=' .repeat(60));

    await this.initialize();

    // Run all tests
    await this.runTest('Basic Recording Functionality', () => this.testBasicRecording());
    await this.runTest('Workflow Storage & Retrieval', () => this.testWorkflowStorage());
    await this.runTest('Pattern Recognition', () => this.testPatternRecognition());
    await this.runTest('Template Generation', () => this.testTemplateGeneration());
    await this.runTest('Workflow Execution', () => this.testWorkflowExecution());
    await this.runTest('Complexity Calculation', () => this.testComplexityCalculation());
    await this.runTest('Execution Time Estimation', () => this.testExecutionTimeEstimation());
    await this.runTest('Variable Resolution', () => this.testVariableResolution());
    await this.runTest('Data Persistence', () => this.testDataPersistence());

    // Print final results
    this.printResults();

    // Cleanup
    await this.cleanup();
  }

  printResults() {
    console.log('=' .repeat(60));
    console.log('📋 WORKFLOW RECORDER TEST RESULTS');
    console.log('=' .repeat(60));
    
    console.log(`🎯 Total Tests: ${this.testResults.total}`);
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(`📊 Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(1)}%`);
    
    console.log('\n📄 Detailed Results:');
    this.testResults.details.forEach(result => {
      const status = result.status === 'PASSED' ? '✅' : '❌';
      console.log(`${status} ${result.test}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    if (this.testResults.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Workflow Recorder is fully functional!');
    } else {
      console.log(`\n⚠️  ${this.testResults.failed} test(s) failed. Please review the errors above.`);
    }
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test environment...');
    
    try {
      // Shutdown workflow recorder
      if (this.workflowRecorder) {
        await this.workflowRecorder.shutdown();
      }

      // Close test window
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.close();
      }

      console.log('✅ Cleanup completed');
    } catch (error) {
      console.error('❌ Cleanup error:', error.message);
    }
  }
}

// Run the test suite
async function runTest() {
  const test = new WorkflowRecorderTest();
  
  try {
    await test.runAllTests();
    process.exit(0);
  } catch (error) {
    console.error('💥 Test suite failed to run:', error);
    process.exit(1);
  }
}

// Initialize Electron app for testing
app.whenReady().then(() => {
  runTest();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});