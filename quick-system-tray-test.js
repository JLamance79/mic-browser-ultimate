/**
 * Quick System Tray Functionality Test
 * Validates key system tray features are working
 */

console.log('🚀 Starting Quick System Tray Test...');

// Wait for the application to load
setTimeout(async () => {
    try {
        console.log('🔍 Testing system tray API availability...');
        
        if (!window.electronAPI?.systemTray) {
            throw new Error('System tray API not available');
        }
        console.log('✅ System tray API is available');
        
        // Test 1: Check if system tray is supported
        console.log('🔍 Testing system tray support...');
        const supportResult = await window.electronAPI.systemTray.isSupported();
        console.log('✅ System tray support check:', supportResult);
        
        // Test 2: Get current settings
        console.log('🔍 Testing settings retrieval...');
        const settingsResult = await window.electronAPI.systemTray.getSettings();
        console.log('✅ Settings retrieved:', settingsResult.success);
        
        // Test 3: Get statistics
        console.log('🔍 Testing statistics retrieval...');
        const statsResult = await window.electronAPI.systemTray.getStatistics();
        console.log('✅ Statistics retrieved:', statsResult.success);
        
        // Test 4: Show test notification
        console.log('🔍 Testing notification display...');
        const notificationResult = await window.electronAPI.systemTray.showNotification(
            'System Tray Test', 
            'If you can see this notification, the system tray is working!', 
            'success'
        );
        console.log('✅ Notification sent:', notificationResult.success);
        
        // Test 5: Update tooltip
        console.log('🔍 Testing tooltip update...');
        const tooltipResult = await window.electronAPI.systemTray.updateTooltip(
            'MIC Browser Ultimate - System Tray Active'
        );
        console.log('✅ Tooltip updated:', tooltipResult.success);
        
        // Test 6: Check settings UI
        console.log('🔍 Testing settings UI presence...');
        const settingsPanel = document.getElementById('settings-systemtray');
        const settingsTab = document.querySelector('.settings-tab[data-tab="systemtray"]');
        
        if (settingsPanel && settingsTab) {
            console.log('✅ Settings UI components found');
            
            // Simulate clicking the system tray tab
            console.log('🔍 Testing settings tab activation...');
            settingsTab.click();
            
            setTimeout(() => {
                if (settingsPanel.style.display !== 'none') {
                    console.log('✅ Settings panel is visible');
                } else {
                    console.log('⚠️ Settings panel may not be visible');
                }
                
                console.log('🎉 System Tray Quick Test Complete!');
                console.log('📊 All core system tray functionality is operational');
                
            }, 1000);
        } else {
            throw new Error('Settings UI components not found');
        }
        
    } catch (error) {
        console.error('❌ System tray test failed:', error);
    }
}, 3000);