// =================================================================
// 🧪 DEBUG CONSOLE TEST
// =================================================================
// Run this in DevTools console to test the debug console

console.clear();
console.log('🧪 TESTING DEBUG CONSOLE FUNCTIONALITY');
console.log('=====================================');

function testDebugConsole() {
    console.log('🔍 Step 1: Checking Debug Console Availability');
    
    // Check if debug console exists
    if (window.debugConsole) {
        console.log('✅ Debug Console Manager found');
        
        // Show the debug console
        console.log('🔧 Opening debug console...');
        window.debugConsole.show();
        
        // Test adding some logs
        setTimeout(() => {
            console.log('📝 Testing log capture...');
            console.log('This is a test info log');
            console.warn('This is a test warning');
            console.error('This is a test error');
            
            // Test IPC monitoring if available
            if (window.electronAPI && window.electronAPI.getTheme) {
                console.log('🔄 Testing IPC monitoring...');
                window.electronAPI.getTheme().then(result => {
                    console.log('✅ IPC call monitored successfully');
                }).catch(error => {
                    console.log('❌ IPC call failed:', error);
                });
            }
            
            console.log('🎯 Debug console test completed!');
            console.log('💡 Try pressing Ctrl+Shift+D to toggle the debug console');
            console.log('💡 You can also click the 🔧 button in the bottom right');
            
        }, 1000);
        
    } else {
        console.log('❌ Debug Console Manager not found');
        console.log('💡 Make sure the app is running in development mode');
        console.log('💡 Check if DebugConsoleManager.js is loaded');
    }
}

// Run the test
testDebugConsole();