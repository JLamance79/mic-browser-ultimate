/**
 * Comprehensive Integration Test for MIC Browser Ultimate
 * Tests all recently added features: Auto-Updater, Crash Reporting, Native Notifications
 */

const { app, BrowserWindow, ipcMain } = require('electron');

class ComprehensiveIntegrationTester {
    constructor() {
        this.results = {
            autoUpdater: { passed: 0, failed: 0, details: [] },
            crashReporting: { passed: 0, failed: 0, details: [] },
            notifications: { passed: 0, failed: 0, details: [] },
            integration: { passed: 0, failed: 0, details: [] }
        };
        this.mainWindow = null;
    }

    log(system, message, type = 'info') {
        const timestamp = new Date().toISOString();
        const emoji = type === 'pass' ? '✅' : type === 'fail' ? '❌' : type === 'warn' ? '⚠️' : 'ℹ️';
        console.log(`[${timestamp}] [${system}] ${emoji} ${message}`);
        
        this.results[system].details.push({ message, type, timestamp });
        if (type === 'pass') this.results[system].passed++;
        if (type === 'fail') this.results[system].failed++;
    }

    async createWindow() {
        this.mainWindow = new BrowserWindow({
            width: 1400,
            height: 900,
            show: false, // Don't show window during testing
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: require('path').join(__dirname, 'preload.js')
            }
        });

        await this.mainWindow.loadFile('index.html');
        this.log('integration', 'Test window created and loaded', 'pass');
    }

    async runAllTests() {
        console.log('🧪 Starting Comprehensive Integration Tests for MIC Browser Ultimate\\n');

        try {
            // Create test window
            await this.createWindow();
            
            // Test all systems
            await this.testAutoUpdater();
            await this.testCrashReporting();
            await this.testNotifications();
            await this.testSystemIntegration();
            
        } catch (error) {
            this.log('integration', `Test suite error: ${error.message}`, 'fail');
        }

        this.printResults();
        return this.calculateOverallSuccess();
    }

    async testAutoUpdater() {
        this.log('autoUpdater', '=== Testing Auto-Updater System ===', 'info');

        try {
            // Test IPC handler availability
            const testResult = await this.testIpcHandler('auto-updater:get-settings');
            if (testResult.success) {
                this.log('autoUpdater', 'Auto-updater IPC handlers available', 'pass');
                this.log('autoUpdater', `Settings loaded: autoDownload=${testResult.settings?.autoDownload}`, 'info');
            } else {
                this.log('autoUpdater', 'Auto-updater IPC handlers not available', 'fail');
            }

            // Test settings management
            const updateSettingsResult = await this.testIpcHandler('auto-updater:update-settings', {
                autoDownload: true,
                notifyUser: true
            });
            if (updateSettingsResult.success) {
                this.log('autoUpdater', 'Settings update functionality working', 'pass');
            } else {
                this.log('autoUpdater', 'Settings update failed', 'fail');
            }

            // Test status check
            const statusResult = await this.testIpcHandler('auto-updater:get-status');
            if (statusResult.success) {
                this.log('autoUpdater', `Auto-updater status: ${statusResult.status || 'unknown'}`, 'pass');
            } else {
                this.log('autoUpdater', 'Status check failed', 'fail');
            }

        } catch (error) {
            this.log('autoUpdater', `Auto-updater test failed: ${error.message}`, 'fail');
        }
    }

    async testCrashReporting() {
        this.log('crashReporting', '=== Testing Crash Reporting System ===', 'info');

        try {
            // Test IPC handler availability
            const settingsResult = await this.testIpcHandler('crash-reporting:get-settings');
            if (settingsResult.success) {
                this.log('crashReporting', 'Crash reporting IPC handlers available', 'pass');
                this.log('crashReporting', `Privacy mode: ${settingsResult.settings?.privacyMode || false}`, 'info');
            } else {
                this.log('crashReporting', 'Crash reporting IPC handlers not available', 'fail');
            }

            // Test analytics endpoint
            const analyticsResult = await this.testIpcHandler('crash-reporting:get-analytics', { days: 7 });
            if (analyticsResult.success) {
                this.log('crashReporting', 'Analytics system functional', 'pass');
            } else {
                this.log('crashReporting', 'Analytics system failed', 'fail');
            }

            // Test reports retrieval
            const reportsResult = await this.testIpcHandler('crash-reporting:get-reports');
            if (reportsResult.success) {
                this.log('crashReporting', `Reports retrieved: ${reportsResult.reports?.length || 0} reports`, 'pass');
            } else {
                this.log('crashReporting', 'Reports retrieval failed', 'fail');
            }

        } catch (error) {
            this.log('crashReporting', `Crash reporting test failed: ${error.message}`, 'fail');
        }
    }

    async testNotifications() {
        this.log('notifications', '=== Testing Native Notification System ===', 'info');

        try {
            // Test system info
            const infoResult = await this.testIpcHandler('notification-get-info');
            if (infoResult.success) {
                this.log('notifications', `Notification support: ${infoResult.info?.supported}`, infoResult.info?.supported ? 'pass' : 'warn');
                this.log('notifications', `Active notifications: ${infoResult.info?.activeCount || 0}`, 'info');
            } else {
                this.log('notifications', 'Notification info retrieval failed', 'fail');
            }

            // Test settings
            const settingsResult = await this.testIpcHandler('notification-get-settings');
            if (settingsResult.success) {
                this.log('notifications', 'Notification settings available', 'pass');
                this.log('notifications', `Sound enabled: ${settingsResult.settings?.soundEnabled}`, 'info');
            } else {
                this.log('notifications', 'Notification settings failed', 'fail');
            }

            // Test notification creation
            const testNotificationResult = await this.testIpcHandler('notification-show-system', 
                'Integration Test', 
                'Testing notification system functionality'
            );
            if (testNotificationResult.success) {
                this.log('notifications', 'Test notification sent successfully', 'pass');
                
                // Clean up test notification
                setTimeout(async () => {
                    if (testNotificationResult.notificationId) {
                        await this.testIpcHandler('notification-close', testNotificationResult.notificationId);
                    }
                }, 2000);
            } else {
                this.log('notifications', 'Test notification failed', 'fail');
            }

            // Test different notification types
            const notificationTypes = [
                { method: 'notification-show-security', args: ['Security Test', 'Testing security notifications'], name: 'Security' },
                { method: 'notification-show-update', args: ['Update Test', 'Testing update notifications'], name: 'Update' },
                { method: 'notification-show-success', args: ['Success Test', 'Testing success notifications'], name: 'Success' }
            ];

            for (const type of notificationTypes) {
                const result = await this.testIpcHandler(type.method, ...type.args);
                if (result.success) {
                    this.log('notifications', `${type.name} notification type working`, 'pass');
                    
                    // Clean up
                    setTimeout(async () => {
                        if (result.notificationId) {
                            await this.testIpcHandler('notification-close', result.notificationId);
                        }
                    }, 1000);
                } else {
                    this.log('notifications', `${type.name} notification type failed`, 'fail');
                }
            }

        } catch (error) {
            this.log('notifications', `Notification test failed: ${error.message}`, 'fail');
        }
    }

    async testSystemIntegration() {
        this.log('integration', '=== Testing System Integration ===', 'info');

        try {
            // Test if all systems are loaded in global scope
            const systems = ['autoUpdaterManager', 'crashReporter', 'notificationManager'];
            let loadedSystems = 0;

            for (const system of systems) {
                if (global[system]) {
                    this.log('integration', `${system} globally available`, 'pass');
                    loadedSystems++;
                } else {
                    this.log('integration', `${system} not globally available`, 'warn');
                }
            }

            if (loadedSystems === systems.length) {
                this.log('integration', 'All systems properly initialized', 'pass');
            } else {
                this.log('integration', `Only ${loadedSystems}/${systems.length} systems initialized`, 'warn');
            }

            // Test web contents loading
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                const isLoading = this.mainWindow.webContents.isLoading();
                this.log('integration', `Window loading status: ${!isLoading ? 'completed' : 'in progress'}`, !isLoading ? 'pass' : 'info');
            }

            // Test preload script execution
            try {
                const preloadResult = await this.mainWindow.webContents.executeJavaScript(`
                    window.electronAPI ? 'available' : 'missing'
                `);
                
                if (preloadResult === 'available') {
                    this.log('integration', 'Preload API bridge functional', 'pass');
                } else {
                    this.log('integration', 'Preload API bridge missing', 'fail');
                }
            } catch (error) {
                this.log('integration', `Preload API test failed: ${error.message}`, 'fail');
            }

            // Test API availability
            try {
                const apiTest = await this.mainWindow.webContents.executeJavaScript(`
                    ({
                        notifications: !!window.electronAPI?.notifications,
                        crashReporting: !!window.electronAPI?.crashReporting,
                        autoUpdater: !!window.electronAPI?.autoUpdater
                    })
                `);
                
                Object.entries(apiTest).forEach(([api, available]) => {
                    this.log('integration', `${api} API ${available ? 'available' : 'missing'}`, available ? 'pass' : 'fail');
                });
            } catch (error) {
                this.log('integration', `API availability test failed: ${error.message}`, 'fail');
            }

        } catch (error) {
            this.log('integration', `Integration test failed: ${error.message}`, 'fail');
        }
    }

    async testIpcHandler(channel, ...args) {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve({ success: false, error: 'Timeout' });
            }, 5000);

            // Create a one-time IPC handler for the test
            const testId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            ipcMain.once(`test-response-${testId}`, (event, result) => {
                clearTimeout(timeout);
                resolve(result);
            });

            // Send test request to main process
            this.mainWindow.webContents.send('test-ipc-request', {
                testId,
                channel,
                args
            });
        });
    }

    calculateOverallSuccess() {
        const totalPassed = Object.values(this.results).reduce((sum, system) => sum + system.passed, 0);
        const totalFailed = Object.values(this.results).reduce((sum, system) => sum + system.failed, 0);
        return totalFailed === 0 && totalPassed > 0;
    }

    printResults() {
        console.log('\\n=== COMPREHENSIVE TEST RESULTS ===');
        
        Object.entries(this.results).forEach(([system, results]) => {
            const total = results.passed + results.failed;
            const successRate = total > 0 ? Math.round((results.passed / total) * 100) : 0;
            
            console.log(`\\n${system.toUpperCase()}:`);
            console.log(`  Total Tests: ${total}`);
            console.log(`  Passed: ${results.passed}`);
            console.log(`  Failed: ${results.failed}`);
            console.log(`  Success Rate: ${successRate}%`);
        });

        const overallPassed = Object.values(this.results).reduce((sum, system) => sum + system.passed, 0);
        const overallFailed = Object.values(this.results).reduce((sum, system) => sum + system.failed, 0);
        const overallTotal = overallPassed + overallFailed;
        const overallSuccessRate = overallTotal > 0 ? Math.round((overallPassed / overallTotal) * 100) : 0;

        console.log(`\\n=== OVERALL RESULTS ===`);
        console.log(`Total Tests: ${overallTotal}`);
        console.log(`Passed: ${overallPassed}`);
        console.log(`Failed: ${overallFailed}`);
        console.log(`Success Rate: ${overallSuccessRate}%`);

        if (overallFailed === 0 && overallPassed > 0) {
            console.log('\\n🎉 ALL SYSTEMS FULLY FUNCTIONAL! 🎉');
            console.log('✅ Auto-Updater System: Ready for production');
            console.log('✅ Crash Reporting System: Ready for production');
            console.log('✅ Native Notification System: Ready for production');
            console.log('✅ System Integration: Complete and working');
        } else {
            console.log(`\\n⚠️ ${overallFailed} tests failed. Review details above.`);
        }
    }
}

// Setup test IPC handler for the browser window
function setupTestIpcHandlers() {
    ipcMain.on('test-ipc-request', async (event, { testId, channel, args }) => {
        try {
            const result = await ipcMain.invoke(channel, ...args);
            event.reply(`test-response-${testId}`, { success: true, ...result });
        } catch (error) {
            event.reply(`test-response-${testId}`, { success: false, error: error.message });
        }
    });
}

// Initialize and run tests
app.whenReady().then(async () => {
    console.log('🧪 Initializing Comprehensive Integration Test Suite\\n');
    
    setupTestIpcHandlers();
    
    const tester = new ComprehensiveIntegrationTester();
    const success = await tester.runAllTests();
    
    // Clean up and exit
    setTimeout(() => {
        if (tester.mainWindow && !tester.mainWindow.isDestroyed()) {
            tester.mainWindow.close();
        }
        process.exit(success ? 0 : 1);
    }, 3000);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});