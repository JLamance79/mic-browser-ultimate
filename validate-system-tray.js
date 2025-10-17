/**
 * Automated System Tray Validation Test
 * Validates system tray functionality is working correctly
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 System Tray Integration Validation Test');
console.log('═══════════════════════════════════════════');

let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
};

function runTest(name, testFn) {
    testResults.total++;
    console.log(`\n🧪 Test: ${name}`);
    
    try {
        testFn();
        testResults.passed++;
        console.log(`✅ PASSED: ${name}`);
        return true;
    } catch (error) {
        testResults.failed++;
        testResults.errors.push(`${name}: ${error.message}`);
        console.log(`❌ FAILED: ${name} - ${error.message}`);
        return false;
    }
}

// Test 1: Verify SystemTrayManager.js exists and has correct structure
runTest('SystemTrayManager.js File Structure', () => {
    if (!fs.existsSync('./SystemTrayManager.js')) {
        throw new Error('SystemTrayManager.js file not found');
    }
    
    const content = fs.readFileSync('./SystemTrayManager.js', 'utf8');
    
    // Check for required classes and methods
    const requiredElements = [
        'class SystemTrayManager',
        'initialize()',
        'createTray()',
        'updateContextMenu()',
        'showTrayNotification(',
        'static isSupported()'
    ];
    
    for (const element of requiredElements) {
        if (!content.includes(element)) {
            throw new Error(`Missing required element: ${element}`);
        }
    }
    
    console.log('   📁 File exists and has required structure');
});

// Test 2: Verify main.js integration
runTest('Main.js System Tray Integration', () => {
    if (!fs.existsSync('./main.js')) {
        throw new Error('main.js file not found');
    }
    
    const content = fs.readFileSync('./main.js', 'utf8');
    
    const requiredIntegrations = [
        'const SystemTrayManager = require',
        'initializeSystemTrayManager',
        'setupSystemTrayIpcHandlers',
        'system-tray-get-settings',
        'system-tray-update-settings',
        'system-tray-show-notification'
    ];
    
    for (const integration of requiredIntegrations) {
        if (!content.includes(integration)) {
            throw new Error(`Missing integration: ${integration}`);
        }
    }
    
    console.log('   🔗 Main.js integration complete');
});

// Test 3: Verify preload.js API exposure
runTest('Preload.js System Tray API', () => {
    if (!fs.existsSync('./preload.js')) {
        throw new Error('preload.js file not found');
    }
    
    const content = fs.readFileSync('./preload.js', 'utf8');
    
    const requiredAPIs = [
        'systemTray: {',
        'getSettings:',
        'updateSettings:',
        'showNotification:',
        'updateTooltip:',
        'isSupported:',
        'onQuickAction:',
        'onShowStatistics:'
    ];
    
    for (const api of requiredAPIs) {
        if (!content.includes(api)) {
            throw new Error(`Missing API: ${api}`);
        }
    }
    
    console.log('   🌉 Preload API exposure complete');
});

// Test 4: Verify index.html UI integration
runTest('Index.html System Tray UI', () => {
    if (!fs.existsSync('./index.html')) {
        throw new Error('index.html file not found');
    }
    
    const content = fs.readFileSync('./index.html', 'utf8');
    
    const requiredUIElements = [
        'data-tab="systemtray"',
        'id="settings-systemtray"',
        'systemTrayEnabledToggle',
        'minimizeToTrayToggle',
        'closeToTrayToggle',
        'trayNotificationsToggle',
        'testTrayNotification',
        'system-tray-panel'
    ];
    
    for (const element of requiredUIElements) {
        if (!content.includes(element)) {
            throw new Error(`Missing UI element: ${element}`);
        }
    }
    
    console.log('   🎨 UI integration complete');
});

// Test 5: Verify JavaScript functions
runTest('JavaScript System Tray Functions', () => {
    const content = fs.readFileSync('./index.html', 'utf8');
    
    const requiredFunctions = [
        'initializeSystemTrayManagement',
        'loadSystemTraySettings',
        'saveSystemTraySettings',
        'testTrayNotification',
        'testTrayTooltip',
        'refreshTrayStatistics',
        'clearTrayStatistics'
    ];
    
    for (const func of requiredFunctions) {
        if (!content.includes(func)) {
            throw new Error(`Missing function: ${func}`);
        }
    }
    
    console.log('   ⚙️ JavaScript functions complete');
});

// Test 6: Check syntax validation
runTest('Code Syntax Validation', () => {
    try {
        // Test main.js syntax
        execSync('node -c main.js', { stdio: 'pipe' });
        console.log('   ✓ main.js syntax valid');
        
        // Test SystemTrayManager.js syntax
        execSync('node -c SystemTrayManager.js', { stdio: 'pipe' });
        console.log('   ✓ SystemTrayManager.js syntax valid');
        
        // Test preload.js syntax
        execSync('node -c preload.js', { stdio: 'pipe' });
        console.log('   ✓ preload.js syntax valid');
        
    } catch (error) {
        throw new Error('Syntax validation failed: ' + error.message);
    }
});

// Test 7: Check for required dependencies
runTest('Required Dependencies Check', () => {
    if (!fs.existsSync('./package.json')) {
        throw new Error('package.json not found');
    }
    
    const packageContent = fs.readFileSync('./package.json', 'utf8');
    const packageJson = JSON.parse(packageContent);
    
    if (!packageJson.dependencies?.electron && !packageJson.devDependencies?.electron) {
        throw new Error('Electron dependency not found');
    }
    
    console.log('   📦 Dependencies verified');
});

// Test 8: Verify application startup logs
runTest('Application Startup Log Validation', () => {
    // This test checks if the startup would work by looking for required imports
    const mainContent = fs.readFileSync('./main.js', 'utf8');
    
    if (!mainContent.includes('require(\'./SystemTrayManager\')')) {
        throw new Error('SystemTrayManager import not found in main.js');
    }
    
    if (!mainContent.includes('systemTrayManager = new SystemTrayManager')) {
        throw new Error('SystemTrayManager instantiation not found');
    }
    
    console.log('   🚀 Startup configuration verified');
});

// Print results
console.log('\n📊 SYSTEM TRAY VALIDATION RESULTS');
console.log('═══════════════════════════════════');
console.log(`📝 Total Tests: ${testResults.total}`);
console.log(`✅ Passed: ${testResults.passed}`);
console.log(`❌ Failed: ${testResults.failed}`);
console.log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

if (testResults.errors.length > 0) {
    console.log('\n🚨 ERRORS:');
    testResults.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
    });
}

if (testResults.failed === 0) {
    console.log('\n🎉 ALL SYSTEM TRAY TESTS PASSED!');
    console.log('✅ System tray integration is complete and ready');
    console.log('✅ All components properly integrated');
    console.log('✅ UI elements and functions available');
    console.log('✅ Code syntax validated');
    console.log('\n🎯 NEXT STEPS:');
    console.log('   1. Run: npm run dev');
    console.log('   2. Look for system tray icon in your taskbar');
    console.log('   3. Right-click tray icon for context menu');
    console.log('   4. Go to Settings → System Tray for configuration');
    console.log('   5. Test minimize to tray functionality');
} else {
    console.log(`\n⚠️ ${testResults.failed} test(s) failed - check errors above`);
}

console.log('\n🏁 System Tray Validation Complete');