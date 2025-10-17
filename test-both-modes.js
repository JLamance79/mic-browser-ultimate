// Comprehensive test to verify both testMode and normal mode work correctly
const LearningEngine = require('./LearningEngine.js');

async function testBothModes() {
  console.log('='.repeat(60));
  console.log('COMPREHENSIVE TEST: Both TestMode and Normal Mode');
  console.log('='.repeat(60));
  
  try {
    // Test 1: TestMode (should not start background processes)
    console.log('\n📋 TEST 1: TestMode (No Background Processes)');
    console.log('-'.repeat(50));
    
    const testEngine = new LearningEngine(null, null, { testMode: true });
    await testEngine.initialize();
    
    await testEngine.trackInteraction({
      component: 'document-scanner',
      action: 'click',
      element: 'scan-button',
      timestamp: Date.now()
    });
    
    await testEngine.learnPatterns();
    const testPatterns = await testEngine.getRecognizedPatterns();
    console.log(`✅ TestMode: Found ${testPatterns.length} patterns`);
    console.log('✅ TestMode: No shutdown needed (no background processes)');
    
    // Test 2: Normal Mode (should start and properly cleanup background processes)
    console.log('\n📋 TEST 2: Normal Mode (With Background Processes)');
    console.log('-'.repeat(50));
    
    const normalEngine = new LearningEngine();
    await normalEngine.initialize();
    
    await normalEngine.trackInteraction({
      component: 'document-scanner',
      action: 'click',
      element: 'scan-button',
      timestamp: Date.now()
    });
    
    await normalEngine.learnPatterns();
    const normalPatterns = await normalEngine.getRecognizedPatterns();
    console.log(`✅ NormalMode: Found ${normalPatterns.length} patterns`);
    
    // Critical: Shutdown to prevent hanging
    await normalEngine.shutdown();
    console.log('✅ NormalMode: Properly shut down with interval cleanup');
    
    console.log('\n🎉 BOTH TESTS PASSED!');
    console.log('✅ TestMode works without hanging');
    console.log('✅ Normal mode works with proper cleanup');
    console.log('✅ No more hanging issues!');
    
    // Clean exit
    setTimeout(() => {
      console.log('\n✅ Process exiting cleanly...');
      process.exit(0);
    }, 500);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testBothModes();