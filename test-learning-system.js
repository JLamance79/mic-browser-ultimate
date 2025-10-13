const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;

// Import learning system components
const LearningEngine = require('./LearningEngine');
const { LearningIntegration } = require('./LearningIntegration');
const { AdaptiveUISystem } = require('./AdaptiveUI');

// Mock storage for testing
class MockStorage {
    constructor() {
        this.data = new Map();
    }

    async get(key) {
        return this.data.get(key);
    }

    async set(key, value) {
        this.data.set(key, value);
        return true;
    }

    async getSetting(key, defaultValue = null) {
        return this.data.get(key) || defaultValue;
    }

    async setSetting(key, value) {
        this.data.set(key, value);
        return true;
    }

    async delete(key) {
        this.data.delete(key);
        return true;
    }

    async deleteSetting(key) {
        this.data.delete(key);
        return true;
    }

    async clear() {
        this.data.clear();
        return true;
    }

    async keys() {
        return Array.from(this.data.keys());
    }
}

// Mock AI service for testing
class MockAIService {
    async analyze(text, context = {}) {
        return {
            intent: 'test_intent',
            confidence: 0.85,
            suggestions: ['test suggestion 1', 'test suggestion 2'],
            context: context
        };
    }

    async generateSuggestions(patterns, context = {}) {
        return [
            'Based on your usage, try using keyboard shortcuts',
            'You might find the voice commands helpful',
            'Consider creating a workflow for this repeated task'
        ];
    }
}

class LearningSystemTester {
    constructor() {
        this.testResults = [];
        this.storage = new MockStorage();
        this.aiService = new MockAIService();
        this.learningEngine = null;
        this.learningIntegration = null;
        this.adaptiveUI = null;
    }

    async runAllTests() {
        console.log('🧪 Starting Learning System Tests...\n');

        try {
            await this.setupTestEnvironment();
            
            // Core functionality tests
            await this.testLearningEngineInitialization();
            await this.testBehaviorTracking();
            await this.testPatternRecognition();
            await this.testPreferenceLearning();
            await this.testPredictionModels();
            await this.testAdaptiveUI();
            await this.testLearningIntegration();
            await this.testDataPersistence();
            await this.testPrivacyControls();
            await this.testPerformance();

            // Integration tests
            await this.testComponentIntegration();
            await this.testRealWorldScenarios();

            this.printTestResults();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error);
            this.testResults.push({
                name: 'Test Suite Execution',
                passed: false,
                error: error.message
            });
        }
    }

    async setupTestEnvironment() {
        console.log('🔧 Setting up test environment...');
        
        // Initialize learning engine
        this.learningEngine = new LearningEngine(this.storage, this.aiService);
        await this.learningEngine.initialize();

        // Initialize learning integration
        this.learningIntegration = new LearningIntegration(this.learningEngine);

        // Mock browser window for adaptive UI
        const mockWindow = {
            webContents: {
                send: (channel, data) => console.log(`Mock IPC send: ${channel}`, data)
            }
        };
        this.adaptiveUI = new AdaptiveUISystem(this.learningEngine, mockWindow);
        await this.adaptiveUI.initialize();

        console.log('✅ Test environment ready\n');
    }

    async testLearningEngineInitialization() {
        const testName = 'Learning Engine Initialization';
        console.log(`🧪 Testing: ${testName}`);

        try {
            // Test that learning engine initializes properly
            const isInitialized = this.learningEngine && this.learningEngine.behaviorTracker;
            
            if (!isInitialized) {
                throw new Error('Learning engine not properly initialized');
            }

            // Test that all required modules are loaded
            const hasPatternRecognizer = !!this.learningEngine.patternRecognizer;
            const hasPreferenceEngine = !!this.learningEngine.preferenceEngine;
            const hasPredictionModel = !!this.learningEngine.predictionModel;
            const hasAdaptationEngine = !!this.learningEngine.adaptationEngine;

            if (!hasPatternRecognizer || !hasPreferenceEngine || !hasPredictionModel || !hasAdaptationEngine) {
                throw new Error('Not all learning modules loaded correctly');
            }

            this.testResults.push({ name: testName, passed: true });
            console.log('✅ Learning Engine initialized successfully\n');

        } catch (error) {
            this.testResults.push({ name: testName, passed: false, error: error.message });
            console.log(`❌ ${testName} failed: ${error.message}\n`);
        }
    }

    async testBehaviorTracking() {
        const testName = 'Behavior Tracking';
        console.log(`🧪 Testing: ${testName}`);

        try {
            // Track some test interactions
            const interactions = [
                {
                    type: 'click',
                    component: 'button',
                    element: 'scan-document',
                    context: { page: 'main', tab: 'active' }
                },
                {
                    type: 'navigate',
                    component: 'browser',
                    url: 'https://example.com',
                    context: { source: 'url-bar' }
                },
                {
                    type: 'ai-request',
                    component: 'chat',
                    query: 'help me scan a document',
                    context: { intent: 'document-processing' }
                }
            ];

            // Track interactions
            for (const interaction of interactions) {
                await this.learningEngine.trackInteraction(interaction);
            }

            // Verify interactions were stored
            const trackedData = await this.learningEngine.getInteractionHistory();
            
            if (trackedData.length !== interactions.length) {
                throw new Error(`Expected ${interactions.length} interactions, got ${trackedData.length}`);
            }

            // Verify interaction data integrity
            const lastInteraction = trackedData[trackedData.length - 1];
            if (!lastInteraction.timestamp || !lastInteraction.sessionId) {
                throw new Error('Interaction missing required metadata');
            }

            this.testResults.push({ name: testName, passed: true });
            console.log('✅ Behavior tracking working correctly\n');

        } catch (error) {
            this.testResults.push({ name: testName, passed: false, error: error.message });
            console.log(`❌ ${testName} failed: ${error.message}\n`);
        }
    }

    async testPatternRecognition() {
        const testName = 'Pattern Recognition';
        console.log(`🧪 Testing: ${testName}`);

        try {
            // Create a sequence of related actions to test pattern recognition
            const sequenceActions = [
                { type: 'click', element: 'scan-button' },
                { type: 'file-select', format: 'pdf' },
                { type: 'ocr-process', language: 'eng' },
                { type: 'text-extract', success: true },
                { type: 'ai-analyze', query: 'summarize document' }
            ];

            // Track the sequence multiple times to establish a pattern
            for (let i = 0; i < 3; i++) {
                for (const action of sequenceActions) {
                    await this.learningEngine.trackInteraction({
                        ...action,
                        component: 'document-scanner',
                        context: { session: `test-${i}` }
                    });
                }
                // Small delay between sequences
                await new Promise(resolve => setTimeout(resolve, 10));
            }

            // Trigger pattern learning
            await this.learningEngine.learnPatterns();

            // Check if patterns were recognized
            const patterns = await this.learningEngine.getRecognizedPatterns();
            
            if (!patterns || patterns.length === 0) {
                throw new Error('No patterns were recognized');
            }

            // Look for document scanning workflow pattern
            const scanPattern = patterns.find(p => 
                p.type === 'sequence' && 
                p.actions.some(a => a.element === 'scan-button')
            );

            if (!scanPattern) {
                throw new Error('Expected document scanning pattern not found');
            }

            this.testResults.push({ name: testName, passed: true });
            console.log('✅ Pattern recognition working correctly\n');

        } catch (error) {
            this.testResults.push({ name: testName, passed: false, error: error.message });
            console.log(`❌ ${testName} failed: ${error.message}\n`);
        }
    }

    async testPreferenceLearning() {
        const testName = 'Preference Learning';
        console.log(`🧪 Testing: ${testName}`);

        try {
            // Simulate user preferences through repeated actions
            const preferenceActions = [
                // User consistently uses dark theme
                { type: 'setting-change', setting: 'theme', value: 'dark', component: 'ui' },
                { type: 'setting-change', setting: 'theme', value: 'dark', component: 'ui' },
                
                // User prefers OCR in English
                { type: 'ocr-language-select', language: 'eng', component: 'ocr' },
                { type: 'ocr-language-select', language: 'eng', component: 'ocr' },
                { type: 'ocr-language-select', language: 'eng', component: 'ocr' },
                
                // User frequently uses voice commands
                { type: 'voice-command', command: 'scan document', component: 'voice' },
                { type: 'voice-command', command: 'new tab', component: 'voice' },
                { type: 'voice-command', command: 'help', component: 'voice' }
            ];

            // Track preference-related interactions
            for (const action of preferenceActions) {
                await this.learningEngine.trackInteraction(action);
            }

            // Learn user preferences
            await this.learningEngine.learnPreferences();

            // Check learned preferences
            const preferences = await this.learningEngine.getUserPreferences();
            
            if (!preferences || Object.keys(preferences).length === 0) {
                throw new Error('No preferences were learned');
            }

            // Verify specific preferences
            if (preferences.ui?.theme !== 'dark') {
                throw new Error('Dark theme preference not learned correctly');
            }

            if (preferences.ocr?.defaultLanguage !== 'eng') {
                throw new Error('OCR language preference not learned correctly');
            }

            this.testResults.push({ name: testName, passed: true });
            console.log('✅ Preference learning working correctly\n');

        } catch (error) {
            this.testResults.push({ name: testName, passed: false, error: error.message });
            console.log(`❌ ${testName} failed: ${error.message}\n`);
        }
    }

    async testPredictionModels() {
        const testName = 'Prediction Models';
        console.log(`🧪 Testing: ${testName}`);

        try {
            // Create predictable patterns
            const contexts = [
                { page: 'home', time: '09:00', lastAction: 'app-start' },
                { page: 'home', time: '09:01', lastAction: 'app-start' },
                { page: 'home', time: '09:02', lastAction: 'app-start' }
            ];

            // Track interactions that follow patterns
            for (let i = 0; i < contexts.length; i++) {
                await this.learningEngine.trackInteraction({
                    type: 'navigate',
                    component: 'browser',
                    url: 'https://docs.google.com',
                    context: contexts[i]
                });
            }

            // Train prediction models
            await this.learningEngine.learnPatterns();

            // Test prediction
            const testContext = { 
                page: 'home', 
                time: '09:03', 
                lastAction: 'app-start' 
            };

            const prediction = await this.learningEngine.predictNextAction(testContext);

            if (!prediction) {
                throw new Error('No prediction generated');
            }

            if (!prediction.action || !prediction.confidence) {
                throw new Error('Prediction missing required fields');
            }

            if (prediction.confidence < 0 || prediction.confidence > 1) {
                throw new Error('Prediction confidence out of valid range');
            }

            this.testResults.push({ name: testName, passed: true });
            console.log('✅ Prediction models working correctly\n');

        } catch (error) {
            this.testResults.push({ name: testName, passed: false, error: error.message });
            console.log(`❌ ${testName} failed: ${error.message}\n`);
        }
    }

    async testAdaptiveUI() {
        const testName = 'Adaptive UI';
        console.log(`🧪 Testing: ${testName}`);

        try {
            // Test theme adaptation
            await this.adaptiveUI.adaptTheme({
                timeOfDay: 'evening',
                userPreference: 'dark',
                ambientLight: 'low'
            });

            // Test layout adaptation
            await this.adaptiveUI.adaptLayout({
                screenSize: 'large',
                userBehavior: 'power-user',
                frequentFeatures: ['document-scan', 'ai-chat', 'voice-commands']
            });

            // Test shortcut adaptation
            await this.adaptiveUI.adaptShortcuts({
                frequentActions: [
                    { action: 'scan-document', frequency: 15 },
                    { action: 'new-tab', frequency: 12 },
                    { action: 'voice-command', frequency: 8 }
                ]
            });

            // Verify adaptations were processed
            const adaptationHistory = this.adaptiveUI.getAdaptationHistory();
            
            if (!adaptationHistory || adaptationHistory.length === 0) {
                throw new Error('No UI adaptations were recorded');
            }

            // Check for expected adaptation types
            const hasThemeAdaptation = adaptationHistory.some(a => a.type === 'theme');
            const hasLayoutAdaptation = adaptationHistory.some(a => a.type === 'layout');
            const hasShortcutAdaptation = adaptationHistory.some(a => a.type === 'shortcuts');

            if (!hasThemeAdaptation || !hasLayoutAdaptation || !hasShortcutAdaptation) {
                throw new Error('Not all adaptation types were processed');
            }

            this.testResults.push({ name: testName, passed: true });
            console.log('✅ Adaptive UI working correctly\n');

        } catch (error) {
            this.testResults.push({ name: testName, passed: false, error: error.message });
            console.log(`❌ ${testName} failed: ${error.message}\n`);
        }
    }

    async testLearningIntegration() {
        const testName = 'Learning Integration';
        console.log(`🧪 Testing: ${testName}`);

        try {
            // Test data collection from different components
            const componentData = [
                { component: 'ChatAI', data: { query: 'help me', response: 'assistance provided' } },
                { component: 'VoiceAssistant', data: { command: 'scan document', executed: true } },
                { component: 'OCR', data: { language: 'eng', confidence: 0.92, words: 150 } },
                { component: 'Workflow', data: { name: 'document-process', steps: 5, success: true } }
            ];

            // Process component data through learning integration
            for (const compData of componentData) {
                await this.learningIntegration.collectComponentData(
                    compData.component, 
                    compData.data
                );
            }

            // Verify data was collected and processed
            const collectedData = await this.learningIntegration.getCollectedData();
            
            if (!collectedData || collectedData.length !== componentData.length) {
                throw new Error('Not all component data was collected');
            }

            // Check data integrity
            for (const data of collectedData) {
                if (!data.timestamp || !data.component || !data.processed) {
                    throw new Error('Collected data missing required fields');
                }
            }

            this.testResults.push({ name: testName, passed: true });
            console.log('✅ Learning integration working correctly\n');

        } catch (error) {
            this.testResults.push({ name: testName, passed: false, error: error.message });
            console.log(`❌ ${testName} failed: ${error.message}\n`);
        }
    }

    async testDataPersistence() {
        const testName = 'Data Persistence';
        console.log(`🧪 Testing: ${testName}`);

        try {
            // Track some interactions
            await this.learningEngine.trackInteraction({
                type: 'test-interaction',
                component: 'test',
                data: 'test-data-persistence'
            });

            // Learn patterns and preferences
            await this.learningEngine.learnPatterns();
            await this.learningEngine.learnPreferences();

            // Save learning data
            await this.learningEngine.saveLearningData();

            // Create new learning engine instance and load data
            const newLearningEngine = new LearningEngine(this.storage, this.aiService);
            await newLearningEngine.initialize();
            await newLearningEngine.loadLearningData();

            // Verify data was persisted and loaded
            const originalHistory = await this.learningEngine.getInteractionHistory();
            const loadedHistory = await newLearningEngine.getInteractionHistory();

            if (originalHistory.length !== loadedHistory.length) {
                throw new Error('Interaction history not properly persisted');
            }

            const originalPatterns = await this.learningEngine.getRecognizedPatterns();
            const loadedPatterns = await newLearningEngine.getRecognizedPatterns();

            if (originalPatterns.length !== loadedPatterns.length) {
                throw new Error('Recognized patterns not properly persisted');
            }

            this.testResults.push({ name: testName, passed: true });
            console.log('✅ Data persistence working correctly\n');

        } catch (error) {
            this.testResults.push({ name: testName, passed: false, error: error.message });
            console.log(`❌ ${testName} failed: ${error.message}\n`);
        }
    }

    async testPrivacyControls() {
        const testName = 'Privacy Controls';
        console.log(`🧪 Testing: ${testName}`);

        try {
            // Test privacy mode toggle
            await this.learningEngine.togglePrivacyMode(true);
            
            // Track interaction in privacy mode
            await this.learningEngine.trackInteraction({
                type: 'private-interaction',
                component: 'test',
                sensitiveData: 'should-not-be-stored'
            });

            // Verify sensitive data is not stored
            const history = await this.learningEngine.getInteractionHistory();
            const privateInteraction = history.find(h => h.type === 'private-interaction');
            
            if (privateInteraction && privateInteraction.sensitiveData) {
                throw new Error('Sensitive data stored despite privacy mode');
            }

            // Test data clearing
            await this.learningEngine.clearLearningData();
            const clearedHistory = await this.learningEngine.getInteractionHistory();
            
            if (clearedHistory.length > 0) {
                throw new Error('Learning data not properly cleared');
            }

            // Test opt-out functionality
            await this.learningEngine.setLearningEnabled(false);
            
            await this.learningEngine.trackInteraction({
                type: 'opt-out-test',
                component: 'test'
            });

            const optOutHistory = await this.learningEngine.getInteractionHistory();
            const optOutInteraction = optOutHistory.find(h => h.type === 'opt-out-test');
            
            if (optOutInteraction) {
                throw new Error('Interaction tracked despite learning being disabled');
            }

            this.testResults.push({ name: testName, passed: true });
            console.log('✅ Privacy controls working correctly\n');

        } catch (error) {
            this.testResults.push({ name: testName, passed: false, error: error.message });
            console.log(`❌ ${testName} failed: ${error.message}\n`);
        }
    }

    async testPerformance() {
        const testName = 'Performance';
        console.log(`🧪 Testing: ${testName}`);

        try {
            const startTime = Date.now();
            const interactionCount = 1000;

            // Track many interactions to test performance
            const promises = [];
            for (let i = 0; i < interactionCount; i++) {
                promises.push(this.learningEngine.trackInteraction({
                    type: 'performance-test',
                    component: 'test',
                    index: i
                }));
            }

            await Promise.all(promises);

            const trackingTime = Date.now() - startTime;
            console.log(`📊 Tracked ${interactionCount} interactions in ${trackingTime}ms`);

            // Test pattern learning performance
            const patternStartTime = Date.now();
            await this.learningEngine.learnPatterns();
            const patternTime = Date.now() - patternStartTime;
            console.log(`📊 Pattern learning completed in ${patternTime}ms`);

            // Test prediction performance
            const predictionStartTime = Date.now();
            for (let i = 0; i < 100; i++) {
                await this.learningEngine.predictNextAction({ test: 'context' });
            }
            const predictionTime = Date.now() - predictionStartTime;
            console.log(`📊 100 predictions completed in ${predictionTime}ms`);

            // Performance thresholds
            if (trackingTime > 5000) { // 5 seconds for 1000 interactions
                throw new Error(`Tracking performance too slow: ${trackingTime}ms`);
            }

            if (patternTime > 2000) { // 2 seconds for pattern learning
                throw new Error(`Pattern learning too slow: ${patternTime}ms`);
            }

            if (predictionTime > 1000) { // 1 second for 100 predictions
                throw new Error(`Prediction performance too slow: ${predictionTime}ms`);
            }

            this.testResults.push({ name: testName, passed: true });
            console.log('✅ Performance tests passed\n');

        } catch (error) {
            this.testResults.push({ name: testName, passed: false, error: error.message });
            console.log(`❌ ${testName} failed: ${error.message}\n`);
        }
    }

    async testComponentIntegration() {
        const testName = 'Component Integration';
        console.log(`🧪 Testing: ${testName}`);

        try {
            // Test integration with different components
            const integrationTests = [
                {
                    component: 'ChatAI',
                    interaction: { type: 'ai-query', query: 'help me scan a document' },
                    expectedLearning: 'document-processing-intent'
                },
                {
                    component: 'VoiceAssistant',
                    interaction: { type: 'voice-command', command: 'open new tab' },
                    expectedLearning: 'voice-navigation-pattern'
                },
                {
                    component: 'WorkflowRecorder',
                    interaction: { type: 'workflow-execution', name: 'data-transfer' },
                    expectedLearning: 'automation-usage-pattern'
                }
            ];

            for (const test of integrationTests) {
                // Simulate component interaction
                await this.learningIntegration.collectComponentData(
                    test.component,
                    test.interaction
                );

                // Verify integration processed the data
                const componentData = await this.learningIntegration.getComponentData(test.component);
                
                if (!componentData || componentData.length === 0) {
                    throw new Error(`${test.component} integration failed`);
                }
            }

            // Test cross-component learning
            await this.learningEngine.learnPatterns();
            const patterns = await this.learningEngine.getRecognizedPatterns();
            
            // Should have patterns from multiple components
            const componentTypes = new Set(
                patterns.map(p => p.component).filter(Boolean)
            );
            
            if (componentTypes.size < 2) {
                throw new Error('Cross-component learning not working properly');
            }

            this.testResults.push({ name: testName, passed: true });
            console.log('✅ Component integration working correctly\n');

        } catch (error) {
            this.testResults.push({ name: testName, passed: false, error: error.message });
            console.log(`❌ ${testName} failed: ${error.message}\n`);
        }
    }

    async testRealWorldScenarios() {
        const testName = 'Real World Scenarios';
        console.log(`🧪 Testing: ${testName}`);

        try {
            // Scenario 1: Document processing workflow
            console.log('📝 Testing document processing scenario...');
            
            const docProcessingSteps = [
                { type: 'click', element: 'scan-button', component: 'ui' },
                { type: 'file-select', format: 'pdf', component: 'ui' },
                { type: 'ocr-start', language: 'eng', component: 'ocr' },
                { type: 'ocr-complete', words: 250, confidence: 0.89, component: 'ocr' },
                { type: 'ai-analyze', query: 'summarize document', component: 'chat' },
                { type: 'ai-response', summary: 'Document summary...', component: 'chat' }
            ];

            for (const step of docProcessingSteps) {
                await this.learningEngine.trackInteraction(step);
                await new Promise(resolve => setTimeout(resolve, 10)); // Realistic timing
            }

            // Scenario 2: Voice-driven navigation
            console.log('🎤 Testing voice navigation scenario...');
            
            const voiceNavigationSteps = [
                { type: 'voice-start', component: 'voice' },
                { type: 'voice-command', command: 'open new tab', component: 'voice' },
                { type: 'tab-create', component: 'browser' },
                { type: 'voice-command', command: 'go to github.com', component: 'voice' },
                { type: 'navigate', url: 'https://github.com', component: 'browser' }
            ];

            for (const step of voiceNavigationSteps) {
                await this.learningEngine.trackInteraction(step);
                await new Promise(resolve => setTimeout(resolve, 10));
            }

            // Learn from scenarios
            await this.learningEngine.learnPatterns();
            await this.learningEngine.learnPreferences();

            // Test scenario-based predictions
            const docScenarioPrediction = await this.learningEngine.predictNextAction({
                currentContext: { element: 'scan-button', action: 'click' }
            });

            const voiceScenarioPrediction = await this.learningEngine.predictNextAction({
                currentContext: { component: 'voice', action: 'voice-start' }
            });

            if (!docScenarioPrediction || !voiceScenarioPrediction) {
                throw new Error('Scenario-based predictions not generated');
            }

            // Test personalized suggestions
            const suggestions = await this.learningEngine.getPersonalizedSuggestions({
                context: 'document-processing'
            });

            if (!suggestions || suggestions.length === 0) {
                throw new Error('No personalized suggestions generated');
            }

            this.testResults.push({ name: testName, passed: true });
            console.log('✅ Real world scenarios working correctly\n');

        } catch (error) {
            this.testResults.push({ name: testName, passed: false, error: error.message });
            console.log(`❌ ${testName} failed: ${error.message}\n`);
        }
    }

    printTestResults() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 LEARNING SYSTEM TEST RESULTS');
        console.log('='.repeat(60));

        const passed = this.testResults.filter(r => r.passed).length;
        const total = this.testResults.length;
        const passRate = ((passed / total) * 100).toFixed(1);

        console.log(`\n📈 Overall Results: ${passed}/${total} tests passed (${passRate}%)\n`);

        this.testResults.forEach(result => {
            const status = result.passed ? '✅ PASS' : '❌ FAIL';
            console.log(`${status} ${result.name}`);
            if (!result.passed && result.error) {
                console.log(`    Error: ${result.error}`);
            }
        });

        console.log('\n' + '='.repeat(60));

        if (passed === total) {
            console.log('🎉 All tests passed! Learning system is working correctly.');
        } else {
            console.log(`⚠️  ${total - passed} test(s) failed. Please review the errors above.`);
        }

        console.log('='.repeat(60) + '\n');
    }

    // Helper method to wait for async operations
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const tester = new LearningSystemTester();
    tester.runAllTests().then(() => {
        console.log('🏁 Test suite completed');
        process.exit(0);
    }).catch(error => {
        console.error('💥 Test suite crashed:', error);
        process.exit(1);
    });
}

module.exports = LearningSystemTester;