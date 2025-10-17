// Quick diagnostic to check what systems are actually loaded
console.log('🔍 QUICK SYSTEM CHECK');
console.log('===================');

console.log('Available window objects:');
console.log('• debugConsole:', !!window.debugConsole);
console.log('• breakpointManager:', !!window.breakpointManager);
console.log('• performanceMonitor:', !!window.performanceMonitor);
console.log('• bp (quick API):', !!window.bp);
console.log('• electronAPI:', !!window.electronAPI);

// Check if debug console manager class is available
console.log('\n🐛 Debug Console Details:');
if (window.debugConsole) {
    console.log('✅ Debug Console Manager is loaded');
    try {
        console.log('• Methods available:', Object.getOwnPropertyNames(window.debugConsole).filter(name => typeof window.debugConsole[name] === 'function'));
    } catch (e) {
        console.log('• Error accessing methods:', e.message);
    }
} else {
    console.log('❌ Debug Console Manager not found');
    // Check if DebugConsoleManager class exists
    if (window.DebugConsoleManager) {
        console.log('⚠️ DebugConsoleManager class found but not instantiated');
    }
}

// Check breakpoint manager
console.log('\n🎯 Breakpoint Manager Details:');
if (window.breakpointManager) {
    console.log('✅ Breakpoint Manager is loaded');
} else if (window.bp) {
    console.log('✅ Quick Breakpoint API (bp) is loaded');
} else {
    console.log('❌ Breakpoint Manager not found');
    if (window.BreakpointManager) {
        console.log('⚠️ BreakpointManager class found but not instantiated');
    }
}

// Check performance monitor
console.log('\n📊 Performance Monitor Details:');
if (window.performanceMonitor) {
    console.log('✅ Performance Monitor is loaded');
    try {
        console.log('• Monitoring status:', window.performanceMonitor.isMonitoring);
    } catch (e) {
        console.log('• Error accessing monitoring status:', e.message);
    }
} else {
    console.log('❌ Performance Monitor not found');
    if (window.PerformanceMonitor) {
        console.log('⚠️ PerformanceMonitor class found but not instantiated');
    }
}

// Check for debug console UI elements
console.log('\n🎨 UI Elements Check:');
const debugConsoleUI = document.getElementById('debug-console');
const performanceDashboard = document.getElementById('performance-dashboard');
console.log('• Debug Console UI element:', !!debugConsoleUI);
console.log('• Performance Dashboard element:', !!performanceDashboard);

// Check if classes are available but need initialization
console.log('\n🔧 Available Classes:');
console.log('• DebugConsoleManager:', !!window.DebugConsoleManager);
console.log('• BreakpointManager:', !!window.BreakpointManager);
console.log('• PerformanceMonitor:', !!window.PerformanceMonitor);

// Try to initialize if classes exist but instances don't
if (!window.debugConsole && window.DebugConsoleManager) {
    console.log('\n🔧 Attempting to initialize Debug Console...');
    try {
        window.debugConsole = new DebugConsoleManager();
        console.log('✅ Debug Console initialized successfully');
    } catch (error) {
        console.log('❌ Failed to initialize Debug Console:', error.message);
    }
}

if (!window.breakpointManager && window.BreakpointManager) {
    console.log('\n🔧 Attempting to initialize Breakpoint Manager...');
    try {
        window.breakpointManager = new BreakpointManager();
        console.log('✅ Breakpoint Manager initialized successfully');
    } catch (error) {
        console.log('❌ Failed to initialize Breakpoint Manager:', error.message);
    }
}

if (!window.performanceMonitor && window.PerformanceMonitor) {
    console.log('\n🔧 Attempting to initialize Performance Monitor...');
    try {
        window.performanceMonitor = new PerformanceMonitor();
        console.log('✅ Performance Monitor initialized successfully');
    } catch (error) {
        console.log('❌ Failed to initialize Performance Monitor:', error.message);
    }
}

console.log('\n🎯 SUMMARY:');
const systems = [
    { name: 'Debug Console', available: !!window.debugConsole },
    { name: 'Breakpoint Manager', available: !!(window.breakpointManager || window.bp) },
    { name: 'Performance Monitor', available: !!window.performanceMonitor }
];

systems.forEach(system => {
    const status = system.available ? '✅ WORKING' : '❌ NOT WORKING';
    console.log(`• ${system.name}: ${status}`);
});

const workingSystems = systems.filter(s => s.available).length;
console.log(`\n📊 ${workingSystems}/3 systems are working`);

if (workingSystems === 3) {
    console.log('🎉 All debugging systems are ready! You can now run the comprehensive test.');
} else {
    console.log('⚠️ Some systems need initialization. Check the details above.');
}