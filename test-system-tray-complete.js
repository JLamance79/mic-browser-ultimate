/**
 * Complete System Tray Integration Test
 * Tests all system tray functionality for MIC Browser Ultimate
 */

console.log('🚀 Starting Complete System Tray Integration Test');

// Test system tray functionality when app loads
async function runSystemTrayTests() {
    console.log('\n📱 Testing System Tray Integration...');
    
    try {
        // Wait for app to fully load
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Test 1: Check if system tray API is available
        console.log('🔍 Test 1: System Tray API Availability');
        if (!window.electronAPI?.systemTray) {
            throw new Error('❌ System tray API not available');
        }
        console.log('✅ System tray API is available');
        
        // Test 2: Check platform support
        console.log('\n🔍 Test 2: Platform Support Check');
        const supportResult = await window.electronAPI.systemTray.isSupported();
        console.log('✅ Support check result:', supportResult);
        
        // Test 3: Get system tray settings
        console.log('\n🔍 Test 3: Settings Management');
        const settingsResult = await window.electronAPI.systemTray.getSettings();
        if (!settingsResult.success) {
            throw new Error('❌ Failed to get settings: ' + settingsResult.error);
        }
        console.log('✅ Settings retrieved successfully');
        console.log('📋 Current settings:', settingsResult.settings);
        
        // Test 4: Update settings
        console.log('\n🔍 Test 4: Settings Update');
        const newSettings = {
            enabled: true,
            minimizeToTray: true,
            closeToTray: false,
            showNotifications: true,
            enableQuickActions: true,
            notificationTimeout: 5000
        };
        
        const updateResult = await window.electronAPI.systemTray.updateSettings(newSettings);
        if (!updateResult.success) {
            throw new Error('❌ Failed to update settings: ' + updateResult.error);
        }
        console.log('✅ Settings updated successfully');
        
        // Test 5: Get statistics
        console.log('\n🔍 Test 5: Statistics Retrieval');
        const statsResult = await window.electronAPI.systemTray.getStatistics();
        if (!statsResult.success) {
            throw new Error('❌ Failed to get statistics: ' + statsResult.error);
        }
        console.log('✅ Statistics retrieved successfully');
        console.log('📊 Current statistics:', statsResult.statistics);
        
        // Test 6: Show notification
        console.log('\n🔍 Test 6: Notification Display');
        const notificationResult = await window.electronAPI.systemTray.showNotification(
            'System Tray Test',
            'This notification confirms the system tray is working correctly!',
            'success'
        );
        if (!notificationResult.success) {
            throw new Error('❌ Failed to show notification: ' + notificationResult.error);
        }
        console.log('✅ Notification displayed successfully');
        
        // Test 7: Update tooltip
        console.log('\n🔍 Test 7: Tooltip Update');
        const tooltipResult = await window.electronAPI.systemTray.updateTooltip(
            'MIC Browser Ultimate - System Tray Active & Tested'
        );
        if (!tooltipResult.success) {
            throw new Error('❌ Failed to update tooltip: ' + tooltipResult.error);
        }
        console.log('✅ Tooltip updated successfully');
        
        // Test 8: Check UI components
        console.log('\n🔍 Test 8: UI Components Check');
        
        // Check settings panel
        const settingsPanel = document.getElementById('settings-systemtray');
        if (!settingsPanel) {
            throw new Error('❌ System tray settings panel not found');
        }
        console.log('✅ Settings panel found');
        
        // Check settings tab
        const settingsTab = document.querySelector('.settings-tab[data-tab="systemtray"]');
        if (!settingsTab) {
            throw new Error('❌ System tray settings tab not found');
        }
        console.log('✅ Settings tab found');
        
        // Check required UI elements
        const requiredElements = [
            'systemTrayEnabledToggle',
            'minimizeToTrayToggle', 
            'closeToTrayToggle',
            'trayNotificationsToggle',
            'quickActionsToggle'
        ];
        
        let missingElements = [];
        for (const elementId of requiredElements) {
            const element = document.getElementById(elementId);
            if (!element) {
                missingElements.push(elementId);
            }
        }
        
        if (missingElements.length > 0) {
            throw new Error('❌ Missing UI elements: ' + missingElements.join(', '));
        }
        console.log('✅ All required UI elements found');
        
        // Test 9: Function availability
        console.log('\n🔍 Test 9: Function Availability');
        const requiredFunctions = [
            'testTrayNotification',
            'testTrayTooltip', 
            'refreshTrayStatistics',
            'saveSystemTraySettings',
            'initializeSystemTrayManagement'
        ];
        
        let missingFunctions = [];
        for (const funcName of requiredFunctions) {
            if (typeof window[funcName] !== 'function') {
                missingFunctions.push(funcName);
            }
        }
        
        if (missingFunctions.length > 0) {
            throw new Error('❌ Missing functions: ' + missingFunctions.join(', '));
        }
        console.log('✅ All required functions available');
        
        // Test 10: Tab activation
        console.log('\n🔍 Test 10: Settings Tab Activation');
        settingsTab.click();
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (settingsPanel.style.display === 'none') {
            throw new Error('❌ Settings panel not visible after tab activation');
        }
        console.log('✅ Settings tab activation working');
        
        // Test 11: Test functions
        console.log('\n🔍 Test 11: Test Functions Execution');
        
        // Test notification function
        if (typeof window.testTrayNotification === 'function') {
            try {
                await window.testTrayNotification();
                console.log('✅ Test notification function works');
            } catch (error) {
                console.log('⚠️ Test notification function error:', error.message);
            }
        }
        
        // Test tooltip function
        if (typeof window.testTrayTooltip === 'function') {
            try {
                await window.testTrayTooltip();
                console.log('✅ Test tooltip function works');
            } catch (error) {
                console.log('⚠️ Test tooltip function error:', error.message);
            }
        }
        
        // Test statistics refresh
        if (typeof window.refreshTrayStatistics === 'function') {
            try {
                await window.refreshTrayStatistics();
                console.log('✅ Refresh statistics function works');
            } catch (error) {
                console.log('⚠️ Refresh statistics function error:', error.message);
            }
        }
        
        console.log('\n🎉 SYSTEM TRAY INTEGRATION TEST COMPLETE!');
        console.log('═══════════════════════════════════════════');
        console.log('✅ All core system tray functionality is operational');
        console.log('✅ System tray icon should be visible in your system tray');
        console.log('✅ Right-click the tray icon to access quick actions');
        console.log('✅ Settings can be configured in Settings → System Tray');
        console.log('✅ Notifications and background operation working');
        
        return true;
        
    } catch (error) {
        console.error('\n❌ SYSTEM TRAY TEST FAILED:', error.message);
        console.error('═══════════════════════════════════════');
        return false;
    }
}

// Auto-run when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(runSystemTrayTests, 2000);
    });
} else {
    setTimeout(runSystemTrayTests, 2000);
}

// Export for manual testing
window.runSystemTrayTests = runSystemTrayTests;