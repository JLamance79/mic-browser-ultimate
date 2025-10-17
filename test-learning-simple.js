// Simple test for LearningEngine without background processes
const { EventEmitter } = require('events');

// Mock the missing dependencies for testing
const mockBehaviorTracker = {
  initialize: async () => console.log('Mock BehaviorTracker initialized'),
  record: async (interaction) => console.log('Recorded:', interaction.action),
  getInteractionHistory: () => []
};

const mockPatternRecognizer = {
  initialize: async () => console.log('Mock PatternRecognizer initialized'),
  findSequencePatterns: async (interactions) => {
    console.log(`Processing ${interactions.length} interactions for sequence patterns`);
    return [{
      type: 'sequence',
      pattern: [{ component: 'document-scanner', action: 'click' }],
      occurrences: 3,
      confidence: 0.8
    }];
  },
  findTemporalPatterns: async () => [],
  findContextPatterns: async () => [],
  findUsagePatterns: async () => [],
  startRealTimeDetection: () => console.log('Real-time detection started'),
  analyzeRealTimePatterns: async () => []
};

const mockPreferenceEngine = {
  initialize: async () => console.log('Mock PreferenceEngine initialized'),
  startMonitoring: () => console.log('Preference monitoring started')
};

const mockPredictionModel = {
  initialize: async () => console.log('Mock PredictionModel initialized'),
  updateWithPatterns: async () => console.log('Prediction model updated'),
  startContinuousLearning: () => console.log('Continuous learning started')
};

const mockAdaptationEngine = {
  initialize: async () => console.log('Mock AdaptationEngine initialized')
};

const mockMLModels = {
  initialize: async () => console.log('Mock ML Models initialized')
};

// Simplified Learning Engine for testing
class TestLearningEngine extends EventEmitter {
  constructor() {
    super();
    this.behaviorTracker = mockBehaviorTracker;
    this.patternRecognizer = mockPatternRecognizer;
    this.preferenceEngine = mockPreferenceEngine;
    this.predictionModel = mockPredictionModel;
    this.adaptationEngine = mockAdaptationEngine;
    this.mlModels = mockMLModels;
    
    this.behaviorHistory = [];
    this.learnedPatterns = new Map();
    this.initialized = false;
  }

  async initialize() {
    console.log('🧠 Initializing Test Learning Engine...');
    
    await this.behaviorTracker.initialize();
    await this.patternRecognizer.initialize();
    await this.preferenceEngine.initialize();
    await this.predictionModel.initialize();
    await this.adaptationEngine.initialize();
    await this.mlModels.initialize();
    
    // DON'T START BACKGROUND PROCESSES IN TEST MODE
    console.log('⚠️ Skipping background processes for testing');
    
    this.initialized = true;
    console.log('✅ Test Learning Engine initialized successfully');
    this.emit('initialized');
  }

  async trackInteraction(interaction) {
    if (!this.initialized) return;
    
    const standardized = {
      ...interaction,
      id: this.generateInteractionId(),
      timestamp: Date.now(),
      sessionId: 'test-session'
    };
    
    await this.behaviorTracker.record(standardized);
    this.behaviorHistory.push(standardized);
    
    console.log('✅ Interaction tracked:', standardized.action);
  }

  async learnPatterns() {
    if (!this.initialized) return;
    
    console.log('🔍 Learning patterns from behavior...');
    
    if (this.behaviorHistory.length < 2) {
      console.log('Not enough interactions for pattern learning');
      return;
    }
    
    const patterns = await this.patternRecognizer.findSequencePatterns(this.behaviorHistory);
    
    patterns.forEach((pattern, index) => {
      this.learnedPatterns.set(`pattern_${index}`, pattern);
    });
    
    console.log(`✅ Learned ${patterns.length} patterns`);
    return patterns;
  }

  async getRecognizedPatterns() {
    const patterns = [];
    for (const [key, pattern] of this.learnedPatterns) {
      patterns.push(pattern);
    }
    return patterns;
  }

  generateInteractionId() {
    return `test_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  }
}

// Test the engine
async function runTest() {
  try {
    console.log('Starting Learning Engine Test...\n');
    
    const engine = new TestLearningEngine();
    
    console.log('1. Initializing engine...');
    await engine.initialize();
    
    console.log('\n2. Tracking interactions...');
    const testAction = {
      type: 'click',
      element: 'scan-button',
      component: 'document-scanner',
      action: 'click',
      context: { session: 'test' }
    };
    
    await engine.trackInteraction(testAction);
    await engine.trackInteraction(testAction);
    await engine.trackInteraction(testAction);
    
    console.log('\n3. Learning patterns...');
    await engine.learnPatterns();
    
    console.log('\n4. Getting recognized patterns...');
    const patterns = await engine.getRecognizedPatterns();
    console.log('Found', patterns.length, 'patterns');
    
    if (patterns.length > 0) {
      console.log('\nFirst pattern:', JSON.stringify(patterns[0], null, 2));
    }
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

if (require.main === module) {
  runTest();
}

module.exports = { TestLearningEngine };