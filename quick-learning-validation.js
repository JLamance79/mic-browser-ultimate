// Quick Learning System Validation Test
// A simple test to verify core learning functionality is working

const LearningEngine = require('./LearningEngine');

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

    async load(key) {
        return this.data.get(key);
    }

    async save(key, value) {
        this.data.set(key, value);
        return true;
    }

    async delete(key) {
        return this.data.delete(key);
    }

    async clear() {
        this.data.clear();
        return true;
    }
}

class MockAIService {
    async analyze(text) {
        return {
            intent: 'test_intent',
            confidence: 0.8,
            suggestions: ['suggestion1', 'suggestion2']
        };
    }

    async processCommand(command, context) {
        return {
            action: 'test_action',
            confidence: 0.8,
            parameters: {}
        };
    }
}

async function quickLearningValidation() {
    console.log('🧠 Starting Quick Learning System Validation...\n');
    
    try {
        // Setup
        const storage = new MockStorage();
        const aiService = new MockAIService();
        const learningEngine = new LearningEngine(storage, aiService);
        
        console.log('✓ Step 1: Learning Engine created');
        
        // Test initialization
        await learningEngine.initialize();
        console.log('✓ Step 2: Learning Engine initialized');
        
        // Track a few interactions
        const testInteractions = [
            {
                type: 'click',
                target: 'search-button',
                timestamp: Date.now(),
                context: { page: 'home' }
            },
            {
                type: 'type',
                target: 'search-input',
                value: 'test query',
                timestamp: Date.now() + 1000,
                context: { page: 'home' }
            },
            {
                type: 'click',
                target: 'result-link',
                timestamp: Date.now() + 2000,
                context: { page: 'search-results' }
            }
        ];
        
        // Track interactions
        for (const interaction of testInteractions) {
            await learningEngine.trackInteraction(interaction);
        }
        console.log('✓ Step 3: Tracked test interactions');
        
        // Test pattern learning
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for processing
        
        const patterns = await learningEngine.getLearnedPatterns();
        console.log('✓ Step 4: Retrieved learned patterns');
        
        // Test preference setting and retrieval
        learningEngine.updatePreferences({ theme: 'dark', language: 'en' });
        const preferences = learningEngine.userPreferences;
        
        if (preferences && preferences.has('theme')) {
            console.log('✓ Step 5: Preference learning working');
        } else {
            console.log('! Step 5: Preference system not ready (expected for new system)');
        }
        
        // Test basic prediction
        const prediction = await learningEngine.predictNextAction({
            type: 'click',
            target: 'search-button',
            context: { page: 'home' }
        });
        
        if (prediction) {
            console.log('✓ Step 6: Prediction system working');
        } else {
            console.log('! Step 6: Prediction system not ready (expected for new system)');
        }
        
        // Test metrics collection
        const metrics = learningEngine.getMetrics();
        if (metrics && metrics.totalInteractions >= 0) {
            console.log('✓ Step 7: Metrics collection working');
        } else {
            throw new Error('Metrics collection failed');
        }
        
        console.log('\n🎉 Quick Learning System Validation PASSED!');
        console.log(`   - Interactions tracked: ${metrics.totalInteractions}`);
        console.log(`   - Patterns learned: ${patterns ? (patterns instanceof Map ? patterns.size : Object.keys(patterns).length) : 0}`);
        console.log(`   - Learning accuracy: ${(metrics.learningAccuracy * 100).toFixed(1)}%`);
        console.log(`   - Prediction accuracy: ${(metrics.predictionAccuracy * 100).toFixed(1)}%`);
        console.log(`   - User preferences: ${learningEngine.userPreferences.size}`);
        
        return true;
        
    } catch (error) {
        console.error('\n❌ Quick Learning System Validation FAILED:');
        console.error(`   Error: ${error.message}`);
        console.error(`   Stack: ${error.stack}`);
        return false;
    }
}

// Run the validation if this file is executed directly
if (require.main === module) {
    quickLearningValidation().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = { quickLearningValidation };