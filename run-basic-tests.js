/**
 * Test Runner for MIC Browser Ultimate Basic Functionality
 * This script helps execute the test suite in the running Electron application
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function colorLog(message, color = 'reset') {
    console.log(colors[color] + message + colors.reset);
}

// Test instructions
function displayTestInstructions() {
    console.log('\n' + '='.repeat(60));
    colorLog('🧪 MIC Browser Ultimate - Basic Functionality Test', 'cyan');
    console.log('='.repeat(60));
    
    colorLog('\n📋 Test Checklist:', 'yellow');
    colorLog('  ✅ 1. Application Launch', 'green');
    colorLog('  🔄 2. Tab Creation/Closing', 'blue');
    colorLog('  🔄 3. Navigation Functionality', 'blue');
    colorLog('  🔄 4. Mic Assistant Modal', 'blue');
    colorLog('  🔄 5. Scanner Modal', 'blue');
    colorLog('  🔄 6. Settings Persistence', 'blue');
    
    colorLog('\n🚀 How to run the tests:', 'yellow');
    colorLog('  1. Make sure MIC Browser Ultimate is running', 'reset');
    colorLog('  2. Open Developer Tools (F12 or Ctrl+Shift+I)', 'reset');
    colorLog('  3. Go to the Console tab', 'reset');
    colorLog('  4. Copy and paste the test script below:', 'reset');
    
    console.log('\n' + '-'.repeat(60));
    colorLog('📄 Test Script (Copy this to browser console):', 'magenta');
    console.log('-'.repeat(60));
    
    // Read and display the test script
    try {
        const testScript = fs.readFileSync(path.join(__dirname, 'test-basic-functionality.js'), 'utf8');
        console.log(testScript);
    } catch (error) {
        colorLog('❌ Error reading test script: ' + error.message, 'red');
    }
    
    console.log('\n' + '-'.repeat(60));
    colorLog('📖 Alternative: Quick Manual Test Steps', 'yellow');
    console.log('-'.repeat(60));
    
    colorLog('\n1️⃣ Application Launch Test:', 'cyan');
    console.log('   • Check if the app window opened without errors');
    console.log('   • Verify all UI elements are visible (tabs, URL bar, buttons)');
    
    colorLog('\n2️⃣ Tab Creation/Closing Test:', 'cyan');
    console.log('   • Click the "+" button to create a new tab');
    console.log('   • Verify new tab appears in tab bar');
    console.log('   • Click the "×" on a tab to close it');
    console.log('   • Verify tab is removed from tab bar');
    
    colorLog('\n3️⃣ Navigation Test:', 'cyan');
    console.log('   • Enter "https://www.example.com" in the URL bar');
    console.log('   • Press Enter to navigate');
    console.log('   • Verify page loads in webview');
    console.log('   • Test back/forward buttons');
    
    colorLog('\n4️⃣ Mic Assistant Test:', 'cyan');
    console.log('   • Look for chat/AI interface elements');
    console.log('   • Try to open/close the assistant modal');
    console.log('   • Check if chat functionality works');
    
    colorLog('\n5️⃣ Scanner Modal Test:', 'cyan');
    console.log('   • Look for scanner/QR code functionality');
    console.log('   • Try to open the scanner modal');
    console.log('   • Verify QR code generation works');
    
    colorLog('\n6️⃣ Settings Persistence Test:', 'cyan');
    console.log('   • Change a setting in the app');
    console.log('   • Restart the application');
    console.log('   • Verify the setting was saved');
    
    colorLog('\n🎯 Expected Results:', 'green');
    console.log('   • All tests should pass');
    console.log('   • No console errors should appear');
    console.log('   • App should remain responsive throughout testing');
    
    console.log('\n' + '='.repeat(60));
    colorLog('✨ Ready to test! Open the app and follow the steps above.', 'green');
    console.log('='.repeat(60) + '\n');
}

// Check if app is running
function checkAppStatus() {
    colorLog('\n🔍 Checking if MIC Browser Ultimate is running...', 'yellow');
    
    // Simple check for common Electron processes
    const { exec } = require('child_process');
    
    exec('tasklist /fi "imagename eq electron.exe"', (error, stdout, stderr) => {
        if (error) {
            colorLog('❌ Error checking process list', 'red');
            return;
        }
        
        if (stdout.includes('electron.exe')) {
            colorLog('✅ MIC Browser Ultimate appears to be running', 'green');
            colorLog('📝 You can now run the tests in the browser console', 'cyan');
        } else {
            colorLog('⚠️  MIC Browser Ultimate doesn\'t appear to be running', 'yellow');
            colorLog('💡 Start it with: npm start', 'blue');
        }
    });
}

// Main execution
function main() {
    colorLog('🧪 MIC Browser Ultimate Test Runner', 'bright');
    
    checkAppStatus();
    displayTestInstructions();
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = {
    displayTestInstructions,
    checkAppStatus,
    main
};