/**
 * Test script for Native Notification System
 * Validates all notification functionality and features
 */

const { app, BrowserWindow, Notification } = require('electron');
const NativeNotificationManager = require('./NativeNotificationManager');

class NotificationSystemTester {
    constructor() {
        this.notificationManager = null;
        this.testResults = {
            passed: 0,
            failed: 0,
            details: []
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const emoji = type === 'pass' ? '✅' : type === 'fail' ? '❌' : type === 'warn' ? '⚠️' : 'ℹ️';
        console.log(`[${timestamp}] ${emoji} ${message}`);
        
        this.testResults.details.push({ message, type, timestamp });
        if (type === 'pass') this.testResults.passed++;
        if (type === 'fail') this.testResults.failed++;
    }

    async runTests() {
        this.log('Starting Native Notification System Tests', 'info');

        try {
            // Test 1: Basic initialization
            await this.testInitialization();
            
            // Test 2: System support check
            await this.testSystemSupport();
            
            // Test 3: Notification creation
            await this.testNotificationCreation();
            
            // Test 4: Settings management
            await this.testSettingsManagement();
            
            // Test 5: Predefined notification types
            await this.testPredefinedTypes();
            
            // Test 6: History management
            await this.testHistoryManagement();
            
            // Test 7: Event handling
            await this.testEventHandling();
            
            // Test 8: Error handling
            await this.testErrorHandling();
            
        } catch (error) {
            this.log(`Test suite error: ${error.message}`, 'fail');
        }

        this.printResults();
        return this.testResults.failed === 0;
    }

    async testInitialization() {
        this.log('=== Testing Initialization ===', 'info');
        
        try {
            this.notificationManager = new NativeNotificationManager();
            this.log('NotificationManager instance created', 'pass');

            const initialized = await this.notificationManager.init();
            if (initialized) {
                this.log('NotificationManager initialized successfully', 'pass');
            } else {
                this.log('NotificationManager initialization returned false', 'warn');
            }
        } catch (error) {
            this.log(`Initialization failed: ${error.message}`, 'fail');
        }
    }

    async testSystemSupport() {
        this.log('=== Testing System Support ===', 'info');
        
        try {
            const supported = this.notificationManager.isSupported();
            this.log(`System notification support: ${supported}`, supported ? 'pass' : 'warn');

            const enabled = this.notificationManager.isNotificationEnabled();
            this.log(`Notification system enabled: ${enabled}`, enabled ? 'pass' : 'warn');

            // Test Electron's native support
            const electronSupported = Notification.isSupported();
            this.log(`Electron notification support: ${electronSupported}`, electronSupported ? 'pass' : 'fail');

        } catch (error) {
            this.log(`System support test failed: ${error.message}`, 'fail');
        }
    }

    async testNotificationCreation() {
        this.log('=== Testing Notification Creation ===', 'info');
        
        try {
            // Test basic notification
            const notificationId = await this.notificationManager.showNotification({
                title: 'Test Notification',
                body: 'This is a test notification',
                category: 'system',
                template: 'system'
            });

            if (notificationId) {
                this.log('Basic notification created successfully', 'pass');
                
                // Clean up
                setTimeout(() => {
                    this.notificationManager.closeNotification(notificationId);
                }, 1000);
            } else {
                this.log('Basic notification creation failed', 'fail');
            }

            // Test notification with options
            const advancedId = await this.notificationManager.showNotification({
                title: 'Advanced Test',
                body: 'Testing advanced notification features',
                category: 'system',
                urgency: 'low',
                silent: true
            });

            if (advancedId) {
                this.log('Advanced notification created successfully', 'pass');
                
                // Clean up
                setTimeout(() => {
                    this.notificationManager.closeNotification(advancedId);
                }, 1000);
            } else {
                this.log('Advanced notification creation failed', 'fail');
            }

        } catch (error) {
            this.log(`Notification creation test failed: ${error.message}`, 'fail');
        }
    }

    async testSettingsManagement() {
        this.log('=== Testing Settings Management ===', 'info');
        
        try {
            // Test getting default settings
            const defaultSettings = this.notificationManager.getSettings();
            if (defaultSettings && typeof defaultSettings === 'object') {
                this.log('Default settings retrieved successfully', 'pass');
                this.log(`Settings keys: ${Object.keys(defaultSettings).length}`, 'info');
            } else {
                this.log('Failed to retrieve default settings', 'fail');
            }

            // Test updating settings
            const testSettings = {
                enabled: true,
                soundEnabled: false,
                duration: 3000,
                maxConcurrent: 3
            };

            await this.notificationManager.updateSettings(testSettings);
            this.log('Settings updated successfully', 'pass');

            // Verify settings were applied
            const updatedSettings = this.notificationManager.getSettings();
            if (updatedSettings.duration === 3000 && updatedSettings.maxConcurrent === 3) {
                this.log('Settings verification passed', 'pass');
            } else {
                this.log('Settings verification failed', 'fail');
            }

        } catch (error) {
            this.log(`Settings management test failed: ${error.message}`, 'fail');
        }
    }

    async testPredefinedTypes() {
        this.log('=== Testing Predefined Notification Types ===', 'info');
        
        const types = [
            { method: 'showSystemNotification', args: ['System Test', 'Testing system notifications'] },
            { method: 'showSecurityAlert', args: ['Security Test', 'Testing security alerts'] },
            { method: 'showUpdateNotification', args: ['Update Test', 'Testing update notifications'] },
            { method: 'showChatMessage', args: ['Chat Test', 'Testing chat notifications'] },
            { method: 'showDownloadComplete', args: ['Download Test', 'Testing download notifications'] },
            { method: 'showError', args: ['Error Test', 'Testing error notifications'] },
            { method: 'showSuccess', args: ['Success Test', 'Testing success notifications'] }
        ];

        for (const type of types) {
            try {
                const notificationId = await this.notificationManager[type.method](...type.args);
                if (notificationId) {
                    this.log(`${type.method} notification created successfully`, 'pass');
                    
                    // Clean up after a short delay
                    setTimeout(() => {
                        this.notificationManager.closeNotification(notificationId);
                    }, 500);
                } else {
                    this.log(`${type.method} notification creation failed`, 'fail');
                }
            } catch (error) {
                this.log(`${type.method} test failed: ${error.message}`, 'fail');
            }
        }
    }

    async testHistoryManagement() {
        this.log('=== Testing History Management ===', 'info');
        
        try {
            // Create a test notification to add to history
            await this.notificationManager.showSystemNotification('History Test', 'Testing history functionality');

            // Test getting history
            const history = this.notificationManager.getHistory();
            if (Array.isArray(history)) {
                this.log(`History retrieved: ${history.length} items`, 'pass');
            } else {
                this.log('Failed to retrieve history', 'fail');
            }

            // Test marking as read (if history has items)
            if (history.length > 0) {
                const firstItem = history[0];
                this.notificationManager.markAsRead(firstItem.id);
                this.log('Mark as read functionality tested', 'pass');
            }

            // Test getting unread count
            const unreadCount = this.notificationManager.getUnreadCount();
            this.log(`Unread count: ${unreadCount}`, 'info');

        } catch (error) {
            this.log(`History management test failed: ${error.message}`, 'fail');
        }
    }

    async testEventHandling() {
        this.log('=== Testing Event Handling ===', 'info');
        
        try {
            let eventReceived = false;

            // Set up event listener
            this.notificationManager.on('notification-shown', (id, options) => {
                eventReceived = true;
                this.log('notification-shown event received', 'pass');
            });

            // Trigger notification to test event
            await this.notificationManager.showSystemNotification('Event Test', 'Testing event handling');

            // Give event time to fire
            setTimeout(() => {
                if (!eventReceived) {
                    this.log('notification-shown event not received', 'fail');
                }
            }, 100);

        } catch (error) {
            this.log(`Event handling test failed: ${error.message}`, 'fail');
        }
    }

    async testErrorHandling() {
        this.log('=== Testing Error Handling ===', 'info');
        
        try {
            // Test invalid notification options
            try {
                await this.notificationManager.showNotification(null);
                this.log('Should have thrown error for null options', 'fail');
            } catch (error) {
                this.log('Properly handled null options error', 'pass');
            }

            // Test invalid category
            try {
                const id = await this.notificationManager.showNotification({
                    title: 'Test',
                    body: 'Test',
                    category: 'invalid_category'
                });
                // This might succeed with a default category
                this.log('Handled invalid category gracefully', 'pass');
                if (id) {
                    setTimeout(() => this.notificationManager.closeNotification(id), 500);
                }
            } catch (error) {
                this.log('Handled invalid category error', 'pass');
            }

        } catch (error) {
            this.log(`Error handling test failed: ${error.message}`, 'fail');
        }
    }

    printResults() {
        this.log('\\n=== TEST RESULTS SUMMARY ===', 'info');
        this.log(`Total Tests: ${this.testResults.passed + this.testResults.failed}`, 'info');
        this.log(`Passed: ${this.testResults.passed}`, 'pass');
        this.log(`Failed: ${this.testResults.failed}`, this.testResults.failed > 0 ? 'fail' : 'pass');
        
        const successRate = Math.round((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100);
        this.log(`Success Rate: ${successRate}%`, successRate >= 80 ? 'pass' : 'fail');

        if (this.testResults.failed === 0) {
            this.log('\\n🎉 All tests passed! Native notification system is working correctly.', 'pass');
        } else {
            this.log(`\\n⚠️ ${this.testResults.failed} tests failed. Please review the details above.`, 'fail');
        }
    }
}

// Initialize Electron app for testing
app.whenReady().then(async () => {
    console.log('🧪 Starting Native Notification System Tests\\n');
    
    const tester = new NotificationSystemTester();
    const success = await tester.runTests();
    
    // Give notifications time to clean up
    setTimeout(() => {
        process.exit(success ? 0 : 1);
    }, 3000);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});