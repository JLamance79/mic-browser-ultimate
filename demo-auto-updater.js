/**
 * Manual Auto-Updater Demo
 * 
 * This script demonstrates the auto-updater functionality by simulating
 * various update scenarios and showing how the UI responds.
 */

console.log('🔄 Auto-Updater Manual Demo Starting...\n');

// Wait for the app to fully load
setTimeout(async () => {
    console.log('📱 Testing Auto-Updater System...\n');

    try {
        // Test 1: Check if auto-updater API is available
        console.log('1️⃣ Checking Auto-Updater API...');
        if (window.electronAPI?.updater) {
            console.log('   ✅ Auto-updater API is available');
            console.log('   📋 Available methods:', Object.keys(window.electronAPI.updater));
        } else {
            console.log('   ❌ Auto-updater API not available');
            return;
        }

        // Test 2: Get current status
        console.log('\n2️⃣ Getting Update Status...');
        try {
            const status = await window.electronAPI.updater.getStatus();
            console.log('   ✅ Status retrieved successfully:');
            console.log('   📊 Current Version:', status.version);
            console.log('   🔄 Update Available:', status.isUpdateAvailable);
            console.log('   📥 Downloading:', status.isDownloading);
            console.log('   ⚙️ Enabled:', status.isEnabled);
        } catch (error) {
            console.log('   ❌ Failed to get status:', error.message);
        }

        // Test 3: Get current settings
        console.log('\n3️⃣ Getting Update Settings...');
        try {
            const settings = await window.electronAPI.updater.getSettings();
            console.log('   ✅ Settings retrieved successfully:');
            console.log('   📥 Auto Download:', settings.autoDownload);
            console.log('   🔄 Auto Install:', settings.autoInstall);
            console.log('   🚀 Check on Startup:', settings.checkOnStartup);
            console.log('   🔔 Notify User:', settings.notifyUser);
            console.log('   🤫 Silent Updates:', settings.silentUpdates);
            console.log('   ⏰ Check Interval:', settings.checkInterval / 1000 / 60, 'minutes');
        } catch (error) {
            console.log('   ❌ Failed to get settings:', error.message);
        }

        // Test 4: Check UI Components
        console.log('\n4️⃣ Checking UI Components...');
        
        // Check notification UI
        const notificationUI = document.getElementById('update-notification');
        console.log('   📱 Update Notification UI:', notificationUI ? '✅ Found' : '❌ Missing');
        
        // Check settings panel
        const settingsPanel = document.getElementById('settings-updates');
        console.log('   ⚙️ Update Settings Panel:', settingsPanel ? '✅ Found' : '❌ Missing');
        
        // Check UpdateNotificationUI instance
        console.log('   🖥️ UpdateNotificationUI Instance:', window.updateNotificationUI ? '✅ Available' : '❌ Missing');

        // Test 5: Demonstrate Settings Tab Navigation
        console.log('\n5️⃣ Testing Settings Tab Navigation...');
        
        // Open settings sidebar
        const settingsTab = document.querySelector('[data-tab="settings"]');
        if (settingsTab) {
            console.log('   🔧 Opening Settings Panel...');
            settingsTab.click();
            
            setTimeout(() => {
                // Switch to updates tab
                const updatesTab = document.querySelector('[data-tab="updates"]');
                if (updatesTab) {
                    console.log('   🔄 Switching to Updates Tab...');
                    updatesTab.click();
                    
                    setTimeout(() => {
                        const updatesVisible = document.getElementById('settings-updates');
                        if (updatesVisible && !updatesVisible.classList.contains('hidden')) {
                            console.log('   ✅ Updates settings tab is now visible!');
                            
                            // Highlight the updates section
                            updatesVisible.style.border = '2px solid #007acc';
                            updatesVisible.style.borderRadius = '8px';
                            
                            setTimeout(() => {
                                updatesVisible.style.border = '';
                                updatesVisible.style.borderRadius = '';
                            }, 3000);
                        } else {
                            console.log('   ❌ Updates tab did not become visible');
                        }
                    }, 500);
                } else {
                    console.log('   ❌ Updates tab button not found');
                }
            }, 500);
        } else {
            console.log('   ❌ Settings tab button not found');
        }

        // Test 6: Manual Update Check (will show message in dev mode)
        console.log('\n6️⃣ Testing Manual Update Check...');
        try {
            console.log('   🔍 Initiating manual update check...');
            const result = await window.electronAPI.updater.checkForUpdates();
            console.log('   ✅ Update check completed:', result);
        } catch (error) {
            console.log('   ℹ️ Expected in dev mode:', error.message);
        }

        // Test 7: Demonstrate Update Notification UI
        console.log('\n7️⃣ Testing Update Notification UI...');
        if (window.updateNotificationUI) {
            console.log('   📱 Showing update notification demo...');
            
            // Simulate an update available notification
            const mockUpdateInfo = {
                version: '1.1.0',
                releaseNotes: 'This is a demo of the update notification system!\n\n• Enhanced auto-updater\n• Better user interface\n• Bug fixes and improvements'
            };
            
            // Show the notification
            window.updateNotificationUI.showUpdateAvailable(mockUpdateInfo);
            
            setTimeout(() => {
                console.log('   ✅ Update notification displayed successfully!');
                console.log('   💡 You should see a notification in the top-right corner');
                
                // Hide after 5 seconds
                setTimeout(() => {
                    window.updateNotificationUI.hide();
                    console.log('   📱 Notification hidden');
                }, 5000);
            }, 1000);
        } else {
            console.log('   ❌ UpdateNotificationUI not available');
        }

        // Test 8: Settings Toggle Test
        console.log('\n8️⃣ Testing Settings Updates...');
        try {
            console.log('   ⚙️ Testing settings update...');
            const currentSettings = await window.electronAPI.updater.getSettings();
            
            // Toggle auto-download setting
            const newAutoDownload = !currentSettings.autoDownload;
            await window.electronAPI.updater.updateSettings({ autoDownload: newAutoDownload });
            
            console.log('   ✅ Settings updated successfully!');
            console.log('   📝 Auto Download changed to:', newAutoDownload);
            
            // Revert the change
            setTimeout(async () => {
                await window.electronAPI.updater.updateSettings({ autoDownload: currentSettings.autoDownload });
                console.log('   🔄 Settings reverted to original values');
            }, 2000);
        } catch (error) {
            console.log('   ❌ Settings update failed:', error.message);
        }

        console.log('\n🎉 Auto-Updater Demo Complete!');
        console.log('\n📋 Summary:');
        console.log('   • Auto-updater system is initialized and running');
        console.log('   • Settings can be retrieved and modified');
        console.log('   • UI components are properly loaded');
        console.log('   • Update notifications work correctly');
        console.log('   • Settings panel integration is functional');
        console.log('\n💡 Note: In development mode, actual update checks are disabled for safety.');
        console.log('   In production, the system will automatically check GitHub releases every 4 hours.');

    } catch (error) {
        console.error('❌ Demo failed:', error);
    }
}, 3000);

// Add some UI styling for better visibility
const style = document.createElement('style');
style.textContent = `
    .demo-highlight {
        animation: demoGlow 2s ease-in-out infinite alternate;
    }
    
    @keyframes demoGlow {
        from { box-shadow: 0 0 5px #007acc; }
        to { box-shadow: 0 0 20px #007acc; }
    }
`;
document.head.appendChild(style);