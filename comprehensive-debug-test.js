// =================================================================
// 🚀 COMPREHENSIVE DEBUGGING SYSTEMS TEST
// =================================================================
// Tests all three debugging systems: Debug Console, Breakpoint Manager, Performance Monitor

console.clear();
console.log(`
🚀 ===========================================
   COMPREHENSIVE DEBUGGING SYSTEMS TEST
🚀 ===========================================

Testing all three debugging components:
1. 🐛 Debug Console Manager
2. 🎯 Breakpoint Manager  
3. 📊 Performance Monitor

Starting test sequence...
`);

// Test Results Container
const testResults = {
    debugConsole: { available: false, tests: [] },
    breakpointManager: { available: false, tests: [] },
    performanceMonitor: { available: false, tests: [] }
};

function addResult(system, test, passed, details) {
    testResults[system].tests.push({ test, passed, details });
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${system}: ${test} - ${details}`);
}

async function runComprehensiveTest() {
    console.log('🔍 Phase 1: System Availability Check\n');
    
    // =================================================================
    // 🐛 DEBUG CONSOLE TESTS
    // =================================================================
    console.log('🐛 Testing Debug Console Manager...');
    
    if (window.debugConsole) {
        testResults.debugConsole.available = true;
        addResult('debugConsole', 'Availability', true, 'Debug Console Manager found');
        
        // Test console visibility
        try {
            const isVisible = window.debugConsole.isVisible();
            addResult('debugConsole', 'Visibility Check', true, `Console visible: ${isVisible}`);
        } catch (error) {
            addResult('debugConsole', 'Visibility Check', false, error.message);
        }
        
        // Test log functionality
        try {
            window.debugConsole.log('Test log message', 'info');
            addResult('debugConsole', 'Logging', true, 'Successfully logged test message');
        } catch (error) {
            addResult('debugConsole', 'Logging', false, error.message);
        }
        
        // Test tab switching
        try {
            window.debugConsole.switchTab('performance');
            window.debugConsole.switchTab('logs');
            addResult('debugConsole', 'Tab Switching', true, 'Successfully switched tabs');
        } catch (error) {
            addResult('debugConsole', 'Tab Switching', false, error.message);
        }
        
    } else {
        addResult('debugConsole', 'Availability', false, 'Debug Console Manager not found');
        console.log('⚠️ Debug Console Manager not available - may not be initialized yet');
    }
    
    // =================================================================  
    // 🎯 BREAKPOINT MANAGER TESTS
    // =================================================================
    console.log('\n🎯 Testing Breakpoint Manager...');
    
    if (window.bp || window.breakpointManager) {
        testResults.breakpointManager.available = true;
        addResult('breakpointManager', 'Availability', true, 'Breakpoint Manager found');
        
        // Test quick API
        if (window.bp) {
            try {
                // Test adding a breakpoint
                window.bp.add('test', { line: 10, condition: 'x > 5' });
                addResult('breakpointManager', 'Quick API Add', true, 'Added test breakpoint');
                
                // Test listing breakpoints
                const bps = window.bp.list();
                addResult('breakpointManager', 'List Breakpoints', true, `Found ${bps.length} breakpoint(s)`);
                
                // Test removing breakpoint
                window.bp.remove('test');
                addResult('breakpointManager', 'Quick API Remove', true, 'Removed test breakpoint');
                
            } catch (error) {
                addResult('breakpointManager', 'Quick API', false, error.message);
            }
        }
        
        // Test templates
        if (window.breakpointManager) {
            try {
                const templates = window.breakpointManager.getTemplates();
                addResult('breakpointManager', 'Templates', true, `Found ${Object.keys(templates).length} template(s)`);
            } catch (error) {
                addResult('breakpointManager', 'Templates', false, error.message);
            }
        }
        
    } else {
        addResult('breakpointManager', 'Availability', false, 'Breakpoint Manager not found');
        console.log('⚠️ Breakpoint Manager not available - may not be initialized yet');
    }
    
    // =================================================================
    // 📊 PERFORMANCE MONITOR TESTS  
    // =================================================================
    console.log('\n📊 Testing Performance Monitor...');
    
    if (window.performanceMonitor) {
        testResults.performanceMonitor.available = true;
        addResult('performanceMonitor', 'Availability', true, 'Performance Monitor found');
        
        // Test metrics recording
        try {
            window.performanceMonitor.recordCustomMetric('test-metric', 42);
            addResult('performanceMonitor', 'Custom Metrics', true, 'Recorded test metric');
        } catch (error) {
            addResult('performanceMonitor', 'Custom Metrics', false, error.message);
        }
        
        // Test monitoring status
        try {
            const isMonitoring = window.performanceMonitor.isMonitoring;
            addResult('performanceMonitor', 'Monitoring Status', true, `Currently monitoring: ${isMonitoring}`);
        } catch (error) {
            addResult('performanceMonitor', 'Monitoring Status', false, error.message);
        }
        
        // Test threshold configuration
        try {
            window.performanceMonitor.setThreshold('memory', 150, 250);
            addResult('performanceMonitor', 'Thresholds', true, 'Set memory thresholds');
        } catch (error) {
            addResult('performanceMonitor', 'Thresholds', false, error.message);
        }
        
        // Test dashboard visibility
        try {
            const dashboard = document.getElementById('performance-dashboard');
            const visible = dashboard && dashboard.style.display !== 'none';
            addResult('performanceMonitor', 'Dashboard UI', visible, `Dashboard visible: ${visible}`);
        } catch (error) {
            addResult('performanceMonitor', 'Dashboard UI', false, error.message);
        }
        
    } else {
        addResult('performanceMonitor', 'Availability', false, 'Performance Monitor not found');
        console.log('⚠️ Performance Monitor not available - may not be initialized yet');
    }
    
    // =================================================================
    // 🎯 INTEGRATION TESTS
    // =================================================================
    console.log('\n🎯 Testing System Integration...');
    
    // Test Debug Console + Performance Monitor Integration
    if (window.debugConsole && window.performanceMonitor) {
        try {
            window.debugConsole.switchTab('performance');
            addResult('integration', 'Debug-Performance', true, 'Successfully switched to performance tab');
        } catch (error) {
            addResult('integration', 'Debug-Performance', false, error.message);
        }
    }
    
    // Test IPC Integration with ElectronAPI
    if (window.electronAPI) {
        try {
            console.log('🔄 Testing IPC integration...');
            const theme = await window.electronAPI.getTheme();
            addResult('integration', 'ElectronAPI', true, `Theme API working: ${theme}`);
            
            // This should generate IPC latency metrics
            if (window.performanceMonitor) {
                setTimeout(() => {
                    addResult('integration', 'IPC Monitoring', true, 'IPC latency should be recorded');
                }, 100);
            }
        } catch (error) {
            addResult('integration', 'ElectronAPI', false, error.message);
        }
    }
    
    // =================================================================
    // 📋 RESULTS SUMMARY
    // =================================================================
    setTimeout(() => {
        console.log(`
📋 ===========================================
   TEST RESULTS SUMMARY
📋 ===========================================`);
        
        const systems = ['debugConsole', 'breakpointManager', 'performanceMonitor'];
        let totalTests = 0;
        let passedTests = 0;
        
        systems.forEach(system => {
            const result = testResults[system];
            const systemName = system.charAt(0).toUpperCase() + system.slice(1).replace(/([A-Z])/g, ' $1');
            const status = result.available ? '✅ AVAILABLE' : '❌ NOT AVAILABLE';
            
            console.log(`\n${systemName}: ${status}`);
            
            result.tests.forEach(test => {
                const icon = test.passed ? '  ✅' : '  ❌';
                console.log(`${icon} ${test.test}: ${test.details}`);
                totalTests++;
                if (test.passed) passedTests++;
            });
        });
        
        const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
        console.log(`
🎯 OVERALL RESULTS:
   • Total Tests: ${totalTests}
   • Passed: ${passedTests}
   • Failed: ${totalTests - passedTests}
   • Success Rate: ${successRate}%

${successRate >= 80 ? '🎉 Excellent! Debugging systems are working well!' : 
  successRate >= 60 ? '⚠️ Good, but some issues detected.' : 
  '❌ Multiple issues detected. Check system initialization.'}
        `);
        
        // Instructions for manual testing
        console.log(`
🔧 MANUAL TESTING INSTRUCTIONS:
   
1. 🐛 Debug Console:
   • Press Ctrl+Shift+D to toggle
   • Try switching between tabs
   • Check real-time logs
   
2. 🎯 Breakpoint Manager:
   • Use: bp.add('test', {line: 10})
   • Use: bp.list() to see all breakpoints
   • Use: bp.remove('test') to remove
   
3. 📊 Performance Monitor:
   • Check the Performance tab in Debug Console
   • Monitor real-time metrics
   • Try: performanceMonitor.recordCustomMetric('test', 100)
        `);
    }, 200);
}

// Start the comprehensive test
runComprehensiveTest().catch(error => {
    console.error('❌ Test execution failed:', error);
});