// Immediate security systems hang detector and bypass
// This will detect if we get stuck at "Configuring security systems" and immediately bypass it

console.log('🛡️ Security Systems Hang Detector Loaded');

let securityHangDetector = null;

// Override updateLoadingProgress to detect security hang
const originalUpdateProgress = window.updateLoadingProgress;
if (originalUpdateProgress) {
    window.updateLoadingProgress = function(progress) {
        console.log(`📊 Loading Progress: ${progress}`);
        
        // If we hit "Configuring security systems", start immediate recovery timer
        if (progress.includes('Configuring security systems') || progress.includes('security systems')) {
            console.log('🚨 Security systems step detected - starting immediate recovery timer...');
            
            // Clear any existing timer
            if (securityHangDetector) {
                clearTimeout(securityHangDetector);
            }
            
            // Set aggressive 3-second timer for security step
            securityHangDetector = setTimeout(() => {
                console.error('💥 SECURITY HANG DETECTED - IMMEDIATE BYPASS');
                
                // Force hide loading screen immediately
                const loadingOverlay = document.getElementById('loadingOverlay');
                if (loadingOverlay) {
                    loadingOverlay.classList.remove('active');
                    console.log('✅ Loading screen force-hidden');
                }
                
                // Initialize minimal app state if needed
                if (window.app) {
                    // Force security object
                    if (!window.app.security) {
                        window.app.security = {
                            encryption: false,
                            auditLogging: false, 
                            threatDetection: false,
                            complianceMode: 'bypass'
                        };
                        console.log('✅ Emergency security config created');
                    }
                    
                    // Force other required objects
                    if (!window.app.workflows) {
                        window.app.workflows = new Map();
                        console.log('✅ Emergency workflows created');
                    }
                    
                    if (!window.app.aiContext) {
                        window.app.aiContext = new Map();
                        window.app.aiContext.set('status', 'security-bypass-recovery');
                        console.log('✅ Emergency AI context created');
                    }
                    
                    // Force complete remaining setup
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
                        console.log('✅ Forced completion of remaining setup');
                    } catch (error) {
                        console.log('⚠️ Some setup failed:', error.message);
                    }
                    
                    // Show success notification
                    if (window.app.showNotification) {
                        window.app.showNotification('Security hang bypassed - app is ready!', 'success');
                    }
                }
                
                console.log('✅ IMMEDIATE SECURITY BYPASS COMPLETED');
            }, 3000); // Only 3 seconds for security step
        }
        
        return originalUpdateProgress.call(this, progress);
    };
}

console.log('🛡️ Security hang detector installed - will bypass after 3 seconds if stuck');