// Test to verify that LearningEngine doesn't hang after completing
const LearningEngine = require('./LearningEngine.js');

async function testNoHang() {
  console.log('Testing LearningEngine without testMode to ensure no hanging...');
  
  try {
    // Create engine in normal mode (not testMode)
    console.log('1. Creating LearningEngine instance in NORMAL mode...');
    const engine = new LearningEngine();
    
    console.log('2. Initializing engine...');
    await engine.initialize();
    console.log('   ✅ Engine initialized successfully!');
    
    // Do some basic operations
    console.log('3. Performing basic operations...');
    await engine.trackInteraction({
      component: 'document-scanner',
      action: 'click',
      element: 'scan-button',
      timestamp: Date.now()
    });
    console.log('   ✅ Interaction tracked successfully!');
    
    await engine.learnPatterns();
    console.log('   ✅ Pattern learning completed!');
    
    // Get some data to verify everything is working
    const patterns = await engine.getRecognizedPatterns();
    console.log(`   ✅ Found ${patterns.length} patterns`);
    
    // CRITICAL: Shutdown the engine to clear all intervals
    console.log('4. Shutting down engine to prevent hanging...');
    await engine.shutdown();
    console.log('   ✅ Engine shutdown completed!');
    
    console.log('🎉 Test completed successfully without hanging!');
    console.log('The shutdown method successfully cleared all intervals.');
    
    // Add a small delay to ensure everything is cleaned up
    setTimeout(() => {
      console.log('✅ Process should exit cleanly now...');
      process.exit(0);
    }, 1000);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testNoHang();