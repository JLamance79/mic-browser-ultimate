// Diagnostic script to check what's happening during app initialization
// Place this in the renderer process (index.html) to debug loading issues

console.log('🔍 Diagnostic script loaded');

// Override the loading update function to track progress
const originalConsole = console.log;
console.log = function(...args) {
    originalConsole.apply(console, ['[DIAG]', new Date().toISOString(), ...args]);
};

// Track initialization progress
let initSteps = [];

// Hook into the main app initialization
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    
    // Track loading progress updates
    const originalUpdateProgress = window.updateLoadingProgress;
    if (originalUpdateProgress) {
        window.updateLoadingProgress = function(progress) {
            console.log(`Loading progress: ${progress}`);
            initSteps.push({
                step: progress,
                timestamp: Date.now()
            });
            return originalUpdateProgress.call(this, progress);
        };
    }
    
    // Check if app class exists
    setTimeout(() => {
        console.log('Checking for MICBrowser app instance...');
        if (window.app) {
            console.log('✅ App instance found:', typeof window.app);
            
            // Hook into component initialization
            const originalInit = window.app.initializeComponents;
            if (originalInit) {
                window.app.initializeComponents = async function() {
                    console.log('🚀 Starting component initialization...');
                    try {
                        const result = await originalInit.call(this);
                        console.log('✅ Component initialization completed');
                        return result;
                    } catch (error) {
                        console.error('❌ Component initialization failed:', error);
                        throw error;
                    }
                };
            }
            
            // Hook into individual component inits
            const componentMethods = [
                'initializeAI',
                'initializeChat', 
                'initializeVoice',
                'initializeWorkflows',
                'initializeSecurity'
            ];
            
            componentMethods.forEach(method => {
                const original = window.app[method];
                if (original) {
                    window.app[method] = async function() {
                        console.log(`🔄 Starting ${method}...`);
                        const start = Date.now();
                        try {
                            const result = await original.call(this);
                            console.log(`✅ ${method} completed in ${Date.now() - start}ms`);
                            return result;
                        } catch (error) {
                            console.error(`❌ ${method} failed:`, error);
                            throw error;
                        }
                    };
                }
            });
            
        } else {
            console.error('❌ App instance not found');
        }
    }, 100);
});

// Track any uncaught errors (with throttling to prevent loops)
let errorCount = 0;
let lastErrorTime = 0;
const MAX_ERRORS_PER_SECOND = 5;

window.addEventListener('error', (event) => {
    const now = Date.now();
    
    // Reset counter every second
    if (now - lastErrorTime > 1000) {
        errorCount = 0;
        lastErrorTime = now;
    }
    
    // Only log if we haven't exceeded the limit
    if (errorCount < MAX_ERRORS_PER_SECOND) {
        console.error('💥 Uncaught error:', event.error);
        console.error('Error details:', {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
        });
        errorCount++;
    } else if (errorCount === MAX_ERRORS_PER_SECOND) {
        console.warn('🚫 Error logging throttled - too many errors detected');
        errorCount++;
    }
});

// Track unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('💥 Unhandled promise rejection:', event.reason);
});

// Export diagnostic data for inspection
window.getDiagnosticData = function() {
    return {
        initSteps,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        location: window.location.href
    };
};

console.log('🔍 Diagnostic hooks installed');