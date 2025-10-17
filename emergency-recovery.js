// Emergency recovery script - run this in DevTools console if app gets stuck
// This will bypass the hanging initialization and force the app to complete loading

console.log('🆘 Emergency Recovery Script - Bypassing Initialization Hang');

// Force hide loading screen immediately
const loadingOverlay = document.getElementById('loadingOverlay');
if (loadingOverlay) {
    loadingOverlay.classList.remove('active');
    console.log('✅ Loading screen hidden');
}

// Skip remaining initialization if app exists
if (window.app) {
    console.log('📱 Found app instance, forcing completion...');
    
    // Initialize minimal required objects
    if (!window.app.workflows) {
        window.app.workflows = new Map();
        console.log('✅ Emergency workflows Map created');
    }
    
    if (!window.app.aiContext) {
        window.app.aiContext = new Map();
        window.app.aiContext.set('status', 'emergency-mode');
        console.log('✅ Emergency AI context created');
    }
    
    // Force completion
    try {
        if (window.app.setupRealtimeFeatures) {
            window.app.setupRealtimeFeatures();
        }
        if (window.app.settings && window.app.settings.refreshSettingsUI) {
            window.app.settings.refreshSettingsUI();
        }
        if (window.app.applySettingsToFeatures) {
            window.app.applySettingsToFeatures();
        }
    } catch (error) {
        console.log('⚠️ Some features failed to initialize:', error.message);
    }
    
    // Show success notification
    if (window.app.showNotification) {
        window.app.showNotification('Emergency recovery completed - app is ready!', 'success');
    }
    
    console.log('✅ Emergency recovery completed');
} else {
    console.error('❌ App instance not found');
}

// Instructions for user
console.log(`
🔧 EMERGENCY RECOVERY COMPLETED

If you're still seeing issues:
1. Press F12 to open DevTools
2. Go to Console tab  
3. Paste this entire script and press Enter
4. The app should bypass the hang and load normally

The app is now in emergency mode - basic functionality should work.
`);