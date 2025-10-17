// =================================================================
// 🚀 DEBUG SYSTEMS AUTO-INITIALIZER
// =================================================================
// Automatically initializes all debugging systems when the app loads

console.log('🚀 Debug Systems Auto-Initializer Loading...');

// Wait for DOM and all scripts to load
function initializeDebugSystems() {
    console.log('🔧 Initializing Debug Systems...');
    
    // Initialize Debug Console Manager
    if (window.DebugConsoleManager && !window.debugConsole) {
        try {
            console.log('🐛 Initializing Debug Console Manager...');
            window.debugConsole = new DebugConsoleManager();
            console.log('✅ Debug Console Manager initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Debug Console Manager:', error);
        }
    }
    
    // Initialize Breakpoint Manager
    if (window.BreakpointManager && !window.breakpointManager) {
        try {
            console.log('🎯 Initializing Breakpoint Manager...');
            window.breakpointManager = new BreakpointManager();
            
            // Also create the quick API shortcut
            window.bp = {
                add: (name, options) => window.breakpointManager.addBreakpoint(name, options),
                remove: (name) => window.breakpointManager.removeBreakpoint(name),
                list: () => window.breakpointManager.getAllBreakpoints(),
                clear: () => window.breakpointManager.clearAllBreakpoints(),
                enable: (name) => window.breakpointManager.enableBreakpoint(name),
                disable: (name) => window.breakpointManager.disableBreakpoint(name),
                export: () => window.breakpointManager.exportBreakpoints(),
                import: (data) => window.breakpointManager.importBreakpoints(data),
                templates: () => window.breakpointManager.getTemplates()
            };
            
            console.log('✅ Breakpoint Manager initialized with quick API (bp)');
        } catch (error) {
            console.error('❌ Failed to initialize Breakpoint Manager:', error);
        }
    }
    
    // Initialize Performance Monitor
    if (window.PerformanceMonitor && !window.performanceMonitor) {
        try {
            console.log('📊 Initializing Performance Monitor...');
            window.performanceMonitor = new PerformanceMonitor();
            console.log('✅ Performance Monitor initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Performance Monitor:', error);
        }
    }
    
    // Set up keyboard shortcuts
    setupDebugKeyboardShortcuts();
    
    // Show status
    showDebugSystemsStatus();
}

// Set up keyboard shortcuts for debugging
function setupDebugKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
        // Ctrl+Shift+D - Toggle Debug Console
        if (event.ctrlKey && event.shiftKey && event.key === 'D') {
            event.preventDefault();
            if (window.debugConsole) {
                window.debugConsole.toggle();
                console.log('🐛 Debug Console toggled');
            } else {
                console.log('⚠️ Debug Console not available');
            }
        }
        
        // Ctrl+Shift+P - Toggle Performance Monitor
        if (event.ctrlKey && event.shiftKey && event.key === 'P') {
            event.preventDefault();
            if (window.performanceMonitor) {
                window.performanceMonitor.toggleDashboard();
                console.log('📊 Performance Monitor toggled');
            } else {
                console.log('⚠️ Performance Monitor not available');
            }
        }
        
        // Ctrl+Shift+B - Show Breakpoints
        if (event.ctrlKey && event.shiftKey && event.key === 'B') {
            event.preventDefault();
            if (window.breakpointManager) {
                const breakpoints = window.breakpointManager.getAllBreakpoints();
                console.log('🎯 Current Breakpoints:', breakpoints);
            } else {
                console.log('⚠️ Breakpoint Manager not available');
            }
        }
    });
    
    console.log('⌨️ Debug keyboard shortcuts enabled:');
    console.log('   • Ctrl+Shift+D: Toggle Debug Console');
    console.log('   • Ctrl+Shift+P: Toggle Performance Monitor');
    console.log('   • Ctrl+Shift+B: Show Breakpoints');
}

// Show the status of all debug systems
function showDebugSystemsStatus() {
    console.log('\n🎯 DEBUG SYSTEMS STATUS:');
    console.log('========================');
    
    const systems = [
        { name: 'Debug Console', obj: window.debugConsole, shortcut: 'Ctrl+Shift+D' },
        { name: 'Breakpoint Manager', obj: window.breakpointManager || window.bp, shortcut: 'bp.add()' },
        { name: 'Performance Monitor', obj: window.performanceMonitor, shortcut: 'Ctrl+Shift+P' }
    ];
    
    let activeCount = 0;
    
    systems.forEach(system => {
        const status = system.obj ? '✅ ACTIVE' : '❌ INACTIVE';
        console.log(`• ${system.name}: ${status} ${system.obj ? `(${system.shortcut})` : ''}`);
        if (system.obj) activeCount++;
    });
    
    console.log(`\n📊 ${activeCount}/3 debug systems are active`);
    
    if (activeCount === 3) {
        console.log('🎉 All debug systems ready! Try the comprehensive test now.');
    } else {
        console.log('⚠️ Some systems failed to initialize. Check console errors above.');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDebugSystems);
} else {
    // DOM already loaded, initialize immediately
    setTimeout(initializeDebugSystems, 100);
}

console.log('🚀 Debug Systems Auto-Initializer Loaded - will initialize when DOM is ready');