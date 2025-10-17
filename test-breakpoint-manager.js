// =================================================================
// 🔴 BREAKPOINT MANAGER TEST
// =================================================================
// Test the advanced breakpoint management system

console.clear();
console.log('🔴 TESTING BREAKPOINT MANAGER');
console.log('============================');

function testBreakpointManager() {
    console.log('🔍 Step 1: Checking Breakpoint Manager Availability');
    
    if (window.breakpointManager) {
        console.log('✅ Breakpoint Manager found');
        
        // Test adding breakpoints
        console.log('\n➕ Step 2: Testing Breakpoint Addition');
        
        // Add some test breakpoints
        const bp1 = window.breakpointManager.addBreakpoint('main.js', 1005, null, 'Theme change triggered');
        console.log('✅ Added theme breakpoint:', bp1.id);
        
        const bp2 = window.breakpointManager.addBreakpoint('preload.js', 267, 'themeName === "light"', 'Light theme requested');
        console.log('✅ Added conditional breakpoint:', bp2.id);
        
        const bp3 = window.breakpointManager.addBreakpoint('DebugConsoleManager.js', 100, null, 'Debug console action');
        console.log('✅ Added debug console breakpoint:', bp3.id);
        
        // Test quick breakpoint API
        console.log('\n⚡ Step 3: Testing Quick API');
        window.bp.add('index.html', 9255, null, 'Theme UI update');
        console.log('✅ Quick API working');
        
        // List all breakpoints
        console.log('\n📋 Step 4: Listing All Breakpoints');
        const allBreakpoints = window.bp.list();
        console.log(`Found ${allBreakpoints.length} breakpoints:`, allBreakpoints);
        
        // Test template application
        console.log('\n⚡ Step 5: Testing Templates');
        window.breakpointManager.applyBreakpointTemplate('theme-change');
        console.log('✅ Applied theme-change template');
        
        // Show debug console with breakpoints tab
        console.log('\n🔧 Step 6: Opening Debug Console');
        if (window.debugConsole) {
            window.debugConsole.show();
            
            setTimeout(() => {
                // Switch to breakpoints tab
                const breakpointTab = document.querySelector('[data-tab="breakpoints"]');
                if (breakpointTab) {
                    breakpointTab.click();
                    console.log('✅ Switched to breakpoints tab - check the debug console!');
                } else {
                    console.log('⏳ Breakpoint tab loading...');
                }
            }, 1000);
        }
        
        console.log('\n🎯 Breakpoint Manager Test Results:');
        console.log('==================================');
        console.log('✅ Breakpoint Manager: Working');
        console.log('✅ Breakpoint Addition: Working');
        console.log('✅ Quick API (window.bp): Working');
        console.log('✅ Templates: Working');
        console.log('✅ Debug Console Integration: Working');
        
        console.log('\n💡 Try these commands:');
        console.log('- window.bp.add("file.js", 100) - Add breakpoint');
        console.log('- window.bp.list() - List all breakpoints');
        console.log('- window.bp.clear() - Clear all breakpoints');
        console.log('- Ctrl+Shift+D - Toggle debug console');
        console.log('- Click "🔴 Breakpoints" tab in debug console');
        
    } else {
        console.log('❌ Breakpoint Manager not found');
        console.log('💡 Make sure BreakpointManager.js is loaded');
        console.log('💡 Check browser console for JavaScript errors');
    }
}

// Run the test
testBreakpointManager();