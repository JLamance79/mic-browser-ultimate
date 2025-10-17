// =================================================================
// 🔧 DEBUG CONSOLE DIAGNOSTIC & VERIFICATION
// =================================================================
// Comprehensive test to verify debug console functionality

console.clear();
console.log('🔧 DEBUG CONSOLE DIAGNOSTIC');
console.log('===========================');

// Step 1: Check Environment
console.log('\n📋 Step 1: Environment Check');
console.log('-----------------------------');
console.log('Development mode:', window.isDev);
console.log('Document ready state:', document.readyState);
console.log('DebugConsoleManager class available:', typeof window.DebugConsoleManager);
console.log('Debug console instance:', typeof window.debugConsole);

// Step 2: Check Script Loading
console.log('\n📜 Step 2: Script Loading Check');
console.log('-------------------------------');
const scripts = Array.from(document.querySelectorAll('script[src]')).map(s => s.src);
const debugScriptLoaded = scripts.some(src => src.includes('DebugConsoleManager.js'));
console.log('DebugConsoleManager.js loaded:', debugScriptLoaded);
console.log('All loaded scripts:', scripts.filter(s => s.includes('.js')).map(s => s.split('/').pop()));

// Step 3: Manual Initialization (if needed)
console.log('\n🔧 Step 3: Manual Initialization');
console.log('---------------------------------');

if (!window.debugConsole && window.DebugConsoleManager) {
    console.log('⚙️ Manually initializing debug console...');
    try {
        window.debugConsole = new window.DebugConsoleManager();
        console.log('✅ Manual initialization successful');
    } catch (error) {
        console.log('❌ Manual initialization failed:', error);
    }
}

// Step 4: Functionality Test
console.log('\n🧪 Step 4: Functionality Test');
console.log('------------------------------');

if (window.debugConsole) {
    console.log('✅ Debug console available');
    
    // Test show/hide
    try {
        console.log('🔄 Testing show functionality...');
        window.debugConsole.show();
        console.log('✅ Show method worked');
        
        setTimeout(() => {
            console.log('🔄 Testing hide functionality...');
            window.debugConsole.hide();
            console.log('✅ Hide method worked');
            
            setTimeout(() => {
                console.log('🔄 Showing debug console again...');
                window.debugConsole.show();
                console.log('✅ Debug console is now visible');
                
                // Test log capture
                console.log('📝 Testing log capture...');
                console.log('This should appear in debug console');
                console.warn('This is a warning message');
                console.error('This is an error message');
                
            }, 1000);
        }, 2000);
        
    } catch (error) {
        console.log('❌ Functionality test failed:', error);
    }
    
} else {
    console.log('❌ Debug console not available');
    
    // Troubleshooting steps
    console.log('\n🔍 Troubleshooting Steps:');
    console.log('-------------------------');
    console.log('1. Check if app is in development mode');
    console.log('2. Verify DebugConsoleManager.js is loaded');
    console.log('3. Check browser console for JavaScript errors');
    console.log('4. Try manual initialization above');
}

// Step 5: Keyboard Shortcut Test
console.log('\n⌨️ Step 5: Keyboard Shortcut');
console.log('----------------------------');
console.log('Press Ctrl+Shift+D to test keyboard toggle');

// Step 6: Visual Element Check
console.log('\n👁️ Step 6: Visual Elements');
console.log('--------------------------');
setTimeout(() => {
    const debugConsoleEl = document.getElementById('debug-console');
    const debugToggleEl = document.getElementById('debug-toggle');
    
    console.log('Debug console DOM element:', !!debugConsoleEl);
    console.log('Debug toggle button:', !!debugToggleEl);
    
    if (debugToggleEl) {
        console.log('✅ Toggle button found - you can click the 🔧 button');
        debugToggleEl.style.border = '2px solid #ff0000';
        debugToggleEl.style.animation = 'pulse 1s infinite';
        
        // Add pulse animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
        
        setTimeout(() => {
            debugToggleEl.style.border = '';
            debugToggleEl.style.animation = '';
        }, 3000);
    }
}, 500);

console.log('\n🎯 DIAGNOSTIC COMPLETE');
console.log('======================');
console.log('If debug console is working, you should see it at the bottom of the screen');
console.log('If not, check the troubleshooting steps above');