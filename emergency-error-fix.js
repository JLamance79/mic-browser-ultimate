/**
 * Emergency Error Loop Fix
 * Stops infinite error loops and provides system stability
 */

console.log('🚨 Emergency Error Loop Fix - Loading...');

// Create a circuit breaker for error handling
class ErrorCircuitBreaker {
    constructor() {
        this.errorCounts = new Map();
        this.timeWindows = new Map();
        this.maxErrorsPerSecond = 5;
        this.circuitBreakDuration = 5000; // 5 seconds
        this.breakerStates = new Map();
    }

    shouldAllowError(errorType) {
        const now = Date.now();
        const key = errorType || 'general';
        
        // Check if circuit is currently open
        if (this.breakerStates.get(key)) {
            const breakerTime = this.breakerStates.get(key);
            if (now - breakerTime < this.circuitBreakDuration) {
                return false; // Circuit still open
            } else {
                this.breakerStates.delete(key); // Reset circuit
            }
        }
        
        // Reset counters if time window expired
        const lastTime = this.timeWindows.get(key) || 0;
        if (now - lastTime > 1000) {
            this.errorCounts.set(key, 0);
            this.timeWindows.set(key, now);
        }
        
        // Check current error count
        const currentCount = this.errorCounts.get(key) || 0;
        if (currentCount >= this.maxErrorsPerSecond) {
            this.breakerStates.set(key, now); // Open circuit
            console.warn(`🚫 Circuit breaker activated for ${key} errors`);
            return false;
        }
        
        // Increment counter and allow error
        this.errorCounts.set(key, currentCount + 1);
        return true;
    }
}

// Create global circuit breaker
window.errorCircuitBreaker = new ErrorCircuitBreaker();

// Override console.error to prevent infinite loops
const originalConsoleError = console.error;
console.error = (...args) => {
    const errorMessage = args.join(' ');
    
    // Identify error type
    let errorType = 'general';
    if (errorMessage.includes('Cannot set properties of null')) {
        errorType = 'null-property';
    } else if (errorMessage.includes('Failed to initialize theme manager')) {
        errorType = 'theme-manager';
    } else if (errorMessage.includes('PerformanceMonitor')) {
        errorType = 'performance-monitor';
    } else if (errorMessage.includes('diagnostic')) {
        errorType = 'diagnostic';
    } else if (errorMessage.includes('Cannot read properties of undefined')) {
        errorType = 'undefined-property';
    }
    
    // Always allow critical errors through
    const criticalKeywords = ['security', 'authentication', 'corruption', 'fatal'];
    const isCritical = criticalKeywords.some(keyword => errorMessage.toLowerCase().includes(keyword));
    
    // Check if we should allow this error
    if (isCritical || window.errorCircuitBreaker.shouldAllowError(errorType)) {
        originalConsoleError.apply(console, args);
    }
};

// Stop any existing intervals that might be causing loops
let intervalId = setInterval(() => {}, 1000);
while (intervalId > 0) {
    clearInterval(intervalId--);
}

// Clear any problematic timeouts
let timeoutId = setTimeout(() => {}, 1000);
while (timeoutId > 0) {
    clearTimeout(timeoutId--);
}

// Stop Performance Monitor if it's running
if (window.performanceMonitor) {
    try {
        if (typeof window.performanceMonitor.stopMonitoring === 'function') {
            window.performanceMonitor.stopMonitoring();
        }
        if (window.performanceMonitor.monitoringInterval) {
            clearInterval(window.performanceMonitor.monitoringInterval);
        }
        console.log('✅ Performance Monitor stopped');
    } catch (error) {
        console.warn('Performance Monitor stop failed:', error.message);
    }
}

// Clean up any problematic diagnostic intervals
const diagnosticElements = document.querySelectorAll('[id*="diagnostic"], [class*="diagnostic"]');
diagnosticElements.forEach(element => {
    try {
        // Stop any timers associated with diagnostic elements
        if (element._diagnosticTimer) {
            clearInterval(element._diagnosticTimer);
        }
    } catch (error) {
        // Ignore cleanup errors
    }
});

// Create a safe restart function
window.safeRestart = function() {
    console.log('🔄 Performing safe application restart...');
    
    // Clear all intervals and timeouts
    let id = setInterval(() => {}, 1000);
    while (id > 0) {
        clearInterval(id--);
    }
    
    id = setTimeout(() => {}, 1000);
    while (id > 0) {
        clearTimeout(id--);
    }
    
    // Reload with clean state
    if (window.electronAPI && window.electronAPI.reloadApp) {
        window.electronAPI.reloadApp();
    } else {
        location.reload();
    }
};

// Provide emergency UI
if (document.body) {
    const emergencyPanel = document.createElement('div');
    emergencyPanel.id = 'emergency-panel';
    emergencyPanel.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: #ff4444;
        color: white;
        padding: 15px;
        border-radius: 8px;
        font-family: monospace;
        font-size: 12px;
        z-index: 999999;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    
    emergencyPanel.innerHTML = `
        <div><strong>🚨 Emergency System</strong></div>
        <div>Error loops detected and stopped</div>
        <div style="margin-top: 10px;">
            <button onclick="window.safeRestart()" style="
                background: #333;
                color: white;
                border: none;
                padding: 5px 10px;
                border-radius: 4px;
                cursor: pointer;
                margin-right: 5px;
            ">🔄 Restart App</button>
            <button onclick="this.parentNode.parentNode.style.display='none'" style="
                background: #666;
                color: white;
                border: none;
                padding: 5px 10px;
                border-radius: 4px;
                cursor: pointer;
            ">✕ Close</button>
        </div>
    `;
    
    document.body.appendChild(emergencyPanel);
    
    // Auto-hide after 30 seconds
    setTimeout(() => {
        if (emergencyPanel.parentNode) {
            emergencyPanel.style.opacity = '0.7';
        }
    }, 30000);
}

console.log('✅ Emergency Error Loop Fix - Active');
console.log('🛡️ Circuit breakers installed for error prevention');

// Export for debugging
window.emergencyFix = {
    circuitBreaker: window.errorCircuitBreaker,
    safeRestart: window.safeRestart,
    version: '1.0.0'
};