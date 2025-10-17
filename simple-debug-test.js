// =================================================================
// ✨ SIMPLE DEBUG SYSTEMS TEST
// =================================================================
// Quick test to verify all debugging systems are working

console.clear();
console.log('✨ SIMPLE DEBUG SYSTEMS TEST');
console.log('============================\n');

// Check what's available
console.log('🔍 System Status:');
console.log('• debugConsole:', !!window.debugConsole);
console.log('• breakpointManager:', !!window.breakpointManager);
console.log('• bp (quick API):', !!window.bp);
console.log('• performanceMonitor:', !!window.performanceMonitor);

if (window.debugConsole && window.breakpointManager && window.performanceMonitor) {
    console.log('\n🎉 ALL SYSTEMS READY! Running quick tests...\n');
    
    // Test Debug Console
    console.log('🐛 Testing Debug Console...');
    try {
        window.debugConsole.log('Hello from debug console!', 'info');
        console.log('✅ Debug Console logging works');
    } catch (error) {
        console.log('❌ Debug Console error:', error.message);
    }
    
    // Test Breakpoint Manager
    console.log('\n🎯 Testing Breakpoint Manager...');
    try {
        window.bp.add('test-bp', { line: 42, condition: 'x > 10' });
        const breakpoints = window.bp.list();
        console.log(`✅ Breakpoint system works - ${breakpoints.length} breakpoint(s)`);
        window.bp.remove('test-bp');
    } catch (error) {
        console.log('❌ Breakpoint Manager error:', error.message);
    }
    
    // Test Performance Monitor
    console.log('\n📊 Testing Performance Monitor...');
    try {
        window.performanceMonitor.recordCustomMetric('test-metric', 123);
        console.log('✅ Performance Monitor metrics work');
    } catch (error) {
        console.log('❌ Performance Monitor error:', error.message);
    }
    
    console.log('\n🎮 KEYBOARD SHORTCUTS:');
    console.log('• Ctrl+Shift+D: Toggle Debug Console');
    console.log('• Ctrl+Shift+P: Toggle Performance Monitor');
    console.log('• Ctrl+Shift+B: Show Breakpoints');
    
    console.log('\n🚀 QUICK API EXAMPLES:');
    console.log('• bp.add("myBreakpoint", {line: 10})');
    console.log('• bp.list()');
    console.log('• performanceMonitor.recordCustomMetric("test", 100)');
    console.log('• debugConsole.log("message", "info")');
    
    console.log('\n✨ All systems are ready! Try the comprehensive test now:');
    
} else {
    console.log('\n⚠️ Some systems are missing. Status:');
    if (!window.debugConsole) console.log('❌ Debug Console not available');
    if (!window.breakpointManager) console.log('❌ Breakpoint Manager not available');  
    if (!window.performanceMonitor) console.log('❌ Performance Monitor not available');
    
    console.log('\n🔧 Try refreshing the page or check console for initialization errors.');
}