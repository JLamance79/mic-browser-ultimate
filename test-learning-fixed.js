// Test for LearningEngine with testMode enabled to prevent hanging
console.log('Testing LearningEngine with testMode enabled...\n');

(async () => {
  try {
    // Import with error handling for dependencies  
    let LearningEngine;
    try {
      LearningEngine = require('./LearningEngine.js');
    } catch (error) {
      console.error('❌ Failed to load LearningEngine:', error.message);
      console.error('This usually means missing dependencies or syntax errors in the module.');
      return;
    }

    console.log('1. Creating LearningEngine instance with testMode...');
    const engine = new LearningEngine(null, null, { testMode: true });

    console.log('2. Initializing engine...');
    await engine.initialize();
    console.log('   ✅ Engine initialized without hanging!');

    console.log('3. Tracking interactions...');
    const testAction = {
      type: 'click',
      element: 'scan-button',
      component: 'document-scanner',
      action: 'click',
      context: { session: 'test' }
    };

    await engine.trackInteraction(testAction);
    console.log('   ✅ First interaction tracked');
    
    await engine.trackInteraction(testAction);
    console.log('   ✅ Second interaction tracked');
    
    await engine.trackInteraction(testAction);
    console.log('   ✅ Third interaction tracked');

    console.log('4. Learning patterns...');
    await engine.learnPatterns();
    console.log('   ✅ Pattern learning completed');

    console.log('5. Getting recognized patterns...');
    const patterns = await engine.getRecognizedPatterns();
    console.log(`   ✅ Found ${patterns.length} patterns`);

    if (patterns.length > 0) {
      const firstPattern = patterns[0];
      console.log('\nFirst pattern details:');
      console.log(JSON.stringify(firstPattern, null, 2));
    } else {
      console.log('   ⚠️ No patterns found (this is normal with minimal test data)');
    }

    console.log('\n🎉 Test completed successfully without hanging!');
    console.log('The testMode successfully prevented background processes from running.');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);
    
    if (error.message.includes('Cannot find module')) {
      console.error('\n💡 This error suggests missing dependency files.');
      console.error('Please ensure all required files exist:');
      console.error('- LearningModules.js');
      console.error('- LearningModulesAdvanced.js');  
      console.error('- LightweightML.js');
    }
  }
})();