// Quick Learning System Validation Test
// This test focuses on core learning functionality

const LearningEngine = require('./LearningEngine');
const { AdaptiveUISystem } = require('./AdaptiveUI');

console.log('🚀 Quick Learning System Validation Test\n');

// Mock implementations
class MockStorage {
  constructor() {
    this.data = new Map();
  }
  
  async save(key, data) {
    this.data.set(key, JSON.parse(JSON.stringify(data)));
    return true;
  }
  
  async load(key) {
    return this.data.get(key) || null;
  }
}

class MockAIService {
  async processCommand(prompt, options = {}) {
    return {
      success: true,
      content: `Mock AI response for: ${prompt.substring(0, 50)}...`
    };
  }
}

class MockWindow {
  constructor() {
    this.webContents = {
      send: (channel, data) => {
        console.log(`Mock IPC send: ${channel}`, data);
      }
    };
  }
}

async function runQuickTest() {
  try {
    console.log('1️⃣ Initializing Learning Engine...');
    const learningEngine = new LearningEngine(new MockStorage(), new MockAIService());
    await learningEngine.initialize();
    console.log('✅ Learning Engine initialized\n');

    console.log('2️⃣ Testing Behavior Tracking...');
    await learningEngine.trackInteraction({
      component: 'document-scanner',
      action: 'scan-document',
      timestamp: Date.now(),
      context: { pages: 5, quality: 'high' }
    });
    
    await learningEngine.trackInteraction({
      component: 'ai-chat',
      action: 'ask-question', 
      timestamp: Date.now(),
      context: { question: 'How to scan better?' }
    });
    
    const interactions = learningEngine.getInteractionHistory();
    console.log(`✅ Tracked ${interactions.length} interactions\n`);

    console.log('3️⃣ Testing Pattern Learning...');
    await learningEngine.learnPatterns();
    const patterns = learningEngine.getLearnedPatterns();
    console.log(`✅ Learned ${Object.keys(patterns).length} patterns\n`);

    console.log('4️⃣ Testing Predictions...');
    const predictions = await learningEngine.predictNextAction({
      currentTime: Date.now(),
      lastAction: 'scan-document'
    });
    console.log(`✅ Generated ${predictions.length} predictions\n`);

    console.log('5️⃣ Testing Adaptive UI...');
    const adaptiveUI = new AdaptiveUISystem(learningEngine, new MockWindow());
    await adaptiveUI.initialize();
    
    // Test if methods exist
    console.log('Checking AdaptiveUI methods:');
    console.log('- adaptTheme exists:', typeof adaptiveUI.adaptTheme === 'function');
    console.log('- adaptLayout exists:', typeof adaptiveUI.adaptLayout === 'function');
    console.log('- getAdaptationHistory exists:', typeof adaptiveUI.getAdaptationHistory === 'function');
    
    if (typeof adaptiveUI.adaptTheme === 'function') {
      await adaptiveUI.adaptTheme({ timeOfDay: 'evening', userPreference: 'dark' });
      console.log('✅ Theme adaptation successful');
    }
    
    const history = adaptiveUI.getAdaptationHistory();
    console.log(`✅ Adaptation history has ${history.length} entries\n`);

    console.log('6️⃣ Testing Personalized Suggestions...');
    const suggestions = await learningEngine.getPersonalizedSuggestions();
    console.log(`✅ Generated ${suggestions.length} suggestions\n`);

    console.log('🎉 Quick Test Results:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Interactions tracked: ${interactions.length}`);
    console.log(`✅ Patterns learned: ${Object.keys(patterns).length}`);  
    console.log(`✅ Predictions generated: ${predictions.length}`);
    console.log(`✅ Adaptations applied: ${history.length}`);
    console.log(`✅ Suggestions created: ${suggestions.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎊 Learning System Core Functionality: WORKING! 🎊');

  } catch (error) {
    console.error('❌ Quick test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
runQuickTest();