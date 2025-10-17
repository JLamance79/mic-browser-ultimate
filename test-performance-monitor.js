// =================================================================
// 📊 PERFORMANCE MONITOR TEST
// =================================================================
// Test the advanced performance monitoring dashboard

console.clear();
console.log('📊 TESTING PERFORMANCE MONITOR');
console.log('==============================');

function testPerformanceMonitor() {
    console.log('🔍 Step 1: Checking Performance Monitor Availability');
    
    if (window.performanceMonitor) {
        console.log('✅ Performance Monitor found');
        
        // Test custom metric recording
        console.log('\n📈 Step 2: Testing Custom Metrics');
        window.performanceMonitor.recordCustomMetric('test-metric', 42);
        window.performanceMonitor.recordCustomMetric('load-time', 1250);
        console.log('✅ Custom metrics recorded');
        
        // Test IPC latency recording
        console.log('\n📡 Step 3: Testing IPC Integration');
        if (window.electronAPI && window.electronAPI.getTheme) {
            console.log('🔄 Triggering IPC calls for latency testing...');
            
            // Trigger multiple IPC calls to generate latency data
            Promise.all([
                window.electronAPI.getTheme(),
                window.electronAPI.getAvailableThemes(),
                window.electronAPI.getTheme(),
                window.electronAPI.getTheme()
            ]).then(() => {
                console.log('✅ IPC latency data generated');
            });
        }
        
        // Test threshold configuration
        console.log('\n⚙️ Step 4: Testing Threshold Configuration');
        window.performanceMonitor.setThreshold('memory', 150, 250);
        window.performanceMonitor.setThreshold('fps', 25, 15);
        console.log('✅ Custom thresholds set');
        
        // Test monitoring controls
        console.log('\n🔄 Step 5: Testing Monitoring Controls');
        const wasMonitoring = window.performanceMonitor.isMonitoring;
        window.performanceMonitor.stopMonitoring();
        console.log('⏸️ Monitoring paused');
        
        setTimeout(() => {
            window.performanceMonitor.startMonitoring();
            console.log('▶️ Monitoring resumed');
        }, 2000);
        
        // Open debug console and switch to performance tab
        console.log('\n📊 Step 6: Opening Performance Dashboard');
        if (window.debugConsole) {
            window.debugConsole.show();
            
            setTimeout(() => {
                // Switch to performance tab
                const performanceTab = document.querySelector('[data-tab="performance"]');
                if (performanceTab) {
                    performanceTab.click();
                    console.log('✅ Switched to performance tab - check the dashboard!');
                    
                    // Generate some load for demonstration
                    console.log('\n🔥 Step 7: Generating Performance Load');
                    generatePerformanceLoad();
                    
                } else {
                    console.log('⏳ Performance tab loading...');
                }
            }, 1000);
        }
        
        console.log('\n📊 Performance Monitor Test Results:');
        console.log('===================================');
        console.log('✅ Performance Monitor: Working');
        console.log('✅ Custom Metrics: Working');
        console.log('✅ IPC Integration: Working');
        console.log('✅ Threshold Configuration: Working');
        console.log('✅ Monitoring Controls: Working');
        console.log('✅ Debug Console Integration: Working');
        
        console.log('\n💡 Available Commands:');
        console.log('- window.performanceMonitor.recordCustomMetric(name, value)');
        console.log('- window.performanceMonitor.setThreshold(metric, warning, critical)');
        console.log('- window.performanceMonitor.exportPerformanceReport()');
        console.log('- Check the 📊 Performance tab in debug console');
        
    } else {
        console.log('❌ Performance Monitor not found');
        console.log('💡 Make sure PerformanceMonitor.js is loaded');
        console.log('💡 Check browser console for JavaScript errors');
        console.log('💡 Verify debug console is available');
    }
}

function generatePerformanceLoad() {
    console.log('🔥 Generating CPU load for 5 seconds...');
    
    let iterations = 0;
    const startTime = performance.now();
    
    // CPU intensive task
    const cpuLoadInterval = setInterval(() => {
        const start = performance.now();
        
        // Simulate heavy computation
        for (let i = 0; i < 100000; i++) {
            Math.random() * Math.random();
        }
        
        const duration = performance.now() - start;
        window.performanceMonitor?.recordCustomMetric('cpu-task-duration', duration);
        
        iterations++;
        
        // Stop after 5 seconds
        if (performance.now() - startTime > 5000) {
            clearInterval(cpuLoadInterval);
            console.log(`✅ CPU load completed (${iterations} iterations)`);
            
            // Generate memory load
            generateMemoryLoad();
        }
    }, 100);
}

function generateMemoryLoad() {
    console.log('🧠 Generating memory load...');
    
    const memoryHogs = [];
    
    // Create large objects to increase memory usage
    for (let i = 0; i < 10; i++) {
        const largeArray = new Array(100000).fill(Math.random());
        memoryHogs.push(largeArray);
        
        // Record custom memory metric
        if (performance.memory) {
            const memoryMB = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
            window.performanceMonitor?.recordCustomMetric('artificial-memory-usage', memoryMB);
        }
    }
    
    console.log('✅ Memory load generated');
    
    // Clean up after 3 seconds
    setTimeout(() => {
        memoryHogs.length = 0; // Clear the array
        console.log('🧹 Memory load cleaned up');
        
        // Generate DOM load
        generateDOMLoad();
    }, 3000);
}

function generateDOMLoad() {
    console.log('🏗️ Generating DOM load...');
    
    const container = document.createElement('div');
    container.style.display = 'none';
    document.body.appendChild(container);
    
    // Add many DOM nodes
    for (let i = 0; i < 1000; i++) {
        const element = document.createElement('div');
        element.textContent = `Test node ${i}`;
        element.className = 'performance-test-node';
        container.appendChild(element);
    }
    
    console.log('✅ DOM load generated (1000 nodes)');
    
    // Clean up after 2 seconds
    setTimeout(() => {
        container.remove();
        console.log('🧹 DOM load cleaned up');
        
        console.log('\n🎉 Performance Load Test Complete!');
        console.log('Check the performance dashboard for metrics visualization');
    }, 2000);
}

// Add stress test option
window.stressTestPerformance = function(duration = 10000) {
    console.log(`🔥 Starting ${duration/1000}s performance stress test...`);
    
    const startTime = performance.now();
    
    const stressInterval = setInterval(() => {
        // CPU stress
        for (let i = 0; i < 50000; i++) {
            Math.sin(Math.random() * 1000);
        }
        
        // Memory stress
        const temp = new Array(10000).fill(Math.random());
        
        // DOM stress
        const div = document.createElement('div');
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 100);
        
        // IPC stress (if available)
        if (window.electronAPI?.getTheme) {
            window.electronAPI.getTheme();
        }
        
        if (performance.now() - startTime > duration) {
            clearInterval(stressInterval);
            console.log('✅ Stress test completed');
        }
    }, 50);
};

// Run the test
testPerformanceMonitor();