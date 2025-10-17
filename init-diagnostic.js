// Quick initialization diagnostic script
// This will help identify what's causing the workflow initialization to hang

console.log('🔍 Initialization Diagnostic Script Loaded');

// Add debugging to the delay function
if (window.app && window.app.delay) {
    const originalDelay = window.app.delay;
    window.app.delay = async function(ms) {
        console.log(`⏳ Delaying for ${ms}ms...`);
        const result = await originalDelay.call(this, ms);
        console.log(`✅ Delay completed (${ms}ms)`);
        return result;
    };
}

// Monitor for any unhandled errors (with throttling)
let initErrorCount = 0;
let initLastErrorTime = 0;

window.addEventListener('error', (event) => {
    const now = Date.now();
    
    if (now - initLastErrorTime > 1000) {
        initErrorCount = 0;
        initLastErrorTime = now;
    }
    
    if (initErrorCount < 3) {
        console.error('💥 JavaScript Error during initialization:', {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error
        });
        initErrorCount++;
    }
});

// Monitor for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('💥 Unhandled Promise Rejection during initialization:', event.reason);
});

// Check if we're stuck in a specific step
let lastProgressUpdate = Date.now();
let progressCheckInterval = setInterval(() => {
    const now = Date.now();
    if (now - lastProgressUpdate > 5000) { // 5 seconds without progress (more aggressive)
        console.error('⚠️ Initialization appears stuck - no progress updates in 8 seconds');
        console.error('Last progress update was:', new Date(lastProgressUpdate).toLocaleTimeString());
        
        // Emergency recovery
        console.log('🆘 Starting emergency recovery...');
        
        // Force hide loading screen
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('active');
        }
        
        // Initialize minimal app state
        if (window.app) {
            if (!window.app.workflows) {
                window.app.workflows = new Map();
            }
            if (!window.app.aiContext) {
                window.app.aiContext = new Map();
                window.app.aiContext.set('status', 'emergency-recovered');
            }
            
            // Try to complete setup
            try {
                if (window.app.setupRealtimeFeatures) window.app.setupRealtimeFeatures();
                if (window.app.settings && window.app.settings.refreshSettingsUI) window.app.settings.refreshSettingsUI();
                if (window.app.applySettingsToFeatures) window.app.applySettingsToFeatures();
            } catch (error) {
                console.log('Some features failed to initialize:', error.message);
            }
            
            if (window.app.showNotification) {
                window.app.showNotification('Auto-recovery completed - app is ready!', 'success');
            }
        }
        
        clearInterval(progressCheckInterval);
        console.log('✅ Emergency recovery completed automatically');
    }
}, 1000);

// Hook into progress updates
const originalUpdateProgress = window.updateLoadingProgress;
if (originalUpdateProgress) {
    window.updateLoadingProgress = function(progress) {
        console.log(`📊 Progress Update: ${progress}`);
        lastProgressUpdate = Date.now();
        return originalUpdateProgress.call(this, progress);
    };
}

console.log('🔍 Diagnostic hooks installed - monitoring initialization...');