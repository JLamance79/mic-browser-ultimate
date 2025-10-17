/**
 * System Tray Integration Test Suite
 * Tests all system tray functionality for MIC Browser Ultimate
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
    timeout: 30000,
    testInterval: 2000,
    verbose: true
};

class SystemTrayIntegrationTest {
    constructor() {
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            errors: []
        };
        this.mainWindow = null;
        this.startTime = Date.now();
    }

    log(message, type = 'info') {
        if (!TEST_CONFIG.verbose && type === 'debug') return;
        const timestamp = new Date().toISOString();
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'debug' ? '🔍' : 'ℹ️';
        console.log(`${prefix} [${timestamp}] ${message}`);
    }

    async runTest(name, testFn) {
        this.results.total++;
        this.log(`\n🧪 Running test: ${name}`, 'info');
        
        try {
            await testFn();
            this.results.passed++;
            this.log(`✅ Test passed: ${name}`, 'success');
            return true;
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`${name}: ${error.message}`);
            this.log(`❌ Test failed: ${name} - ${error.message}`, 'error');
            return false;
        }
    }

    async createTestWindow() {
        return new Promise((resolve) => {
            this.mainWindow = new BrowserWindow({
                width: 1200,
                height: 800,
                show: false,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true,
                    preload: path.join(__dirname, 'preload.js')
                }
            });

            this.mainWindow.loadFile('index.html');
            
            this.mainWindow.webContents.once('did-finish-load', () => {
                resolve();
            });
        });
    }

    async testSystemTraySupport() {
        return new Promise((resolve, reject) => {
            this.mainWindow.webContents.executeJavaScript(`
                (async () => {
                    if (!window.electronAPI?.systemTray) {
                        throw new Error('System tray API not available');
                    }
                    
                    const result = await window.electronAPI.systemTray.isSupported();
                    if (!result.supported) {
                        throw new Error('System tray not supported on this platform');
                    }
                    
                    return result;
                })()
            `).then(result => {
                this.log(`System tray support: ${JSON.stringify(result)}`, 'debug');
                resolve();
            }).catch(reject);
        });
    }

    async testSystemTraySettings() {
        return new Promise((resolve, reject) => {
            this.mainWindow.webContents.executeJavaScript(`
                (async () => {
                    const settings = await window.electronAPI.systemTray.getSettings();
                    if (!settings.success) {
                        throw new Error('Failed to get system tray settings: ' + settings.error);
                    }
                    
                    // Test updating settings
                    const newSettings = {
                        enabled: true,
                        minimizeToTray: true,
                        closeToTray: false,
                        showNotifications: true,
                        enableQuickActions: true
                    };
                    
                    const updateResult = await window.electronAPI.systemTray.updateSettings(newSettings);
                    if (!updateResult.success) {
                        throw new Error('Failed to update system tray settings: ' + updateResult.error);
                    }
                    
                    return { original: settings, updated: updateResult };
                })()
            `).then(result => {
                this.log(`Settings test result: ${JSON.stringify(result)}`, 'debug');
                resolve();
            }).catch(reject);
        });
    }

    async testSystemTrayStatistics() {
        return new Promise((resolve, reject) => {
            this.mainWindow.webContents.executeJavaScript(`
                (async () => {
                    const stats = await window.electronAPI.systemTray.getStatistics();
                    if (!stats.success) {
                        throw new Error('Failed to get system tray statistics: ' + stats.error);
                    }
                    
                    // Verify statistics structure
                    const required = ['totalActions', 'notificationsSent', 'minimizeCount', 'restoreCount'];
                    for (const field of required) {
                        if (!(field in stats.statistics)) {
                            throw new Error('Missing statistics field: ' + field);
                        }
                    }
                    
                    return stats;
                })()
            `).then(result => {
                this.log(`Statistics test result: ${JSON.stringify(result)}`, 'debug');
                resolve();
            }).catch(reject);
        });
    }

    async testSystemTrayNotification() {
        return new Promise((resolve, reject) => {
            this.mainWindow.webContents.executeJavaScript(`
                (async () => {
                    const title = 'Test Notification';
                    const body = 'This is a test system tray notification';
                    const type = 'info';
                    
                    const result = await window.electronAPI.systemTray.showNotification(title, body, type);
                    if (!result.success) {
                        throw new Error('Failed to show system tray notification: ' + result.error);
                    }
                    
                    return result;
                })()
            `).then(result => {
                this.log(`Notification test result: ${JSON.stringify(result)}`, 'debug');
                resolve();
            }).catch(reject);
        });
    }

    async testSystemTrayTooltip() {
        return new Promise((resolve, reject) => {
            this.mainWindow.webContents.executeJavaScript(`
                (async () => {
                    const tooltip = 'MIC Browser Ultimate - System Tray Test';
                    
                    const result = await window.electronAPI.systemTray.updateTooltip(tooltip);
                    if (!result.success) {
                        throw new Error('Failed to update system tray tooltip: ' + result.error);
                    }
                    
                    return result;
                })()
            `).then(result => {
                this.log(`Tooltip test result: ${JSON.stringify(result)}`, 'debug');
                resolve();
            }).catch(reject);
        });
    }

    async testSystemTrayEventListeners() {
        return new Promise((resolve, reject) => {
            let eventReceived = false;
            
            this.mainWindow.webContents.executeJavaScript(`
                (async () => {
                    // Test quick action event listener
                    let quickActionReceived = false;
                    
                    window.electronAPI.systemTray.onQuickAction((action) => {
                        quickActionReceived = true;
                        window.testEventReceived = action;
                    });
                    
                    // Test statistics event listener
                    let statsEventReceived = false;
                    
                    window.electronAPI.systemTray.onShowStatistics(() => {
                        statsEventReceived = true;
                        window.testStatsEventReceived = true;
                    });
                    
                    return { quickActionListener: true, statsListener: true };
                })()
            `).then(result => {
                this.log(`Event listeners setup: ${JSON.stringify(result)}`, 'debug');
                resolve();
            }).catch(reject);
        });
    }

    async testSystemTraySettingsUI() {
        return new Promise((resolve, reject) => {
            this.mainWindow.webContents.executeJavaScript(`
                (async () => {
                    // Check if system tray settings panel exists
                    const settingsPanel = document.getElementById('settings-systemtray');
                    if (!settingsPanel) {
                        throw new Error('System tray settings panel not found');
                    }
                    
                    // Check if system tray tab exists
                    const settingsTab = document.querySelector('.settings-tab[data-tab="systemtray"]');
                    if (!settingsTab) {
                        throw new Error('System tray settings tab not found');
                    }
                    
                    // Check if required UI elements exist
                    const requiredElements = [
                        'systemTrayEnabledToggle',
                        'minimizeToTrayToggle',
                        'closeToTrayToggle',
                        'trayNotificationsToggle',
                        'quickActionsToggle'
                    ];
                    
                    const missing = [];
                    for (const elementId of requiredElements) {
                        if (!document.getElementById(elementId)) {
                            missing.push(elementId);
                        }
                    }
                    
                    if (missing.length > 0) {
                        throw new Error('Missing UI elements: ' + missing.join(', '));
                    }
                    
                    return { panel: true, tab: true, elements: requiredElements.length };
                })()
            `).then(result => {
                this.log(`Settings UI test result: ${JSON.stringify(result)}`, 'debug');
                resolve();
            }).catch(reject);
        });
    }

    async testSystemTrayFunctions() {
        return new Promise((resolve, reject) => {
            this.mainWindow.webContents.executeJavaScript(`
                (async () => {
                    // Test if system tray functions are available
                    const functions = [
                        'testTrayNotification',
                        'testTrayTooltip',
                        'toggleTrayVisibility',
                        'refreshTrayStatistics',
                        'clearTrayStatistics',
                        'initializeSystemTrayManagement',
                        'saveSystemTraySettings'
                    ];
                    
                    const available = [];
                    const missing = [];
                    
                    for (const funcName of functions) {
                        if (typeof window[funcName] === 'function') {
                            available.push(funcName);
                        } else {
                            missing.push(funcName);
                        }
                    }
                    
                    if (missing.length > 0) {
                        throw new Error('Missing system tray functions: ' + missing.join(', '));
                    }
                    
                    return { available: available.length, total: functions.length };
                })()
            `).then(result => {
                this.log(`Functions test result: ${JSON.stringify(result)}`, 'debug');
                resolve();
            }).catch(reject);
        });
    }

    async runAllTests() {
        this.log('🚀 Starting System Tray Integration Test Suite');
        this.log(`⚙️ Test Configuration: ${JSON.stringify(TEST_CONFIG)}`);
        
        try {
            // Create test window
            this.log('📱 Creating test window...');
            await this.createTestWindow();
            
            // Wait for initialization
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Run all tests
            await this.runTest('System Tray Support Check', () => this.testSystemTraySupport());
            await this.runTest('System Tray Settings Management', () => this.testSystemTraySettings());
            await this.runTest('System Tray Statistics', () => this.testSystemTrayStatistics());
            await this.runTest('System Tray Notification', () => this.testSystemTrayNotification());
            await this.runTest('System Tray Tooltip Update', () => this.testSystemTrayTooltip());
            await this.runTest('System Tray Event Listeners', () => this.testSystemTrayEventListeners());
            await this.runTest('System Tray Settings UI', () => this.testSystemTraySettingsUI());
            await this.runTest('System Tray JavaScript Functions', () => this.testSystemTrayFunctions());
            
        } catch (error) {
            this.log(`❌ Fatal error during testing: ${error.message}`, 'error');
            this.results.failed++;
            this.results.errors.push(`Fatal: ${error.message}`);
        }
        
        this.printResults();
    }

    printResults() {
        const duration = Date.now() - this.startTime;
        const successRate = this.results.total > 0 ? (this.results.passed / this.results.total * 100).toFixed(1) : 0;
        
        this.log('\n📊 SYSTEM TRAY INTEGRATION TEST RESULTS');
        this.log('═══════════════════════════════════════');
        this.log(`⏱️  Duration: ${duration}ms`);
        this.log(`📝 Total Tests: ${this.results.total}`);
        this.log(`✅ Passed: ${this.results.passed}`);
        this.log(`❌ Failed: ${this.results.failed}`);
        this.log(`📈 Success Rate: ${successRate}%`);
        
        if (this.results.errors.length > 0) {
            this.log('\n🚨 ERRORS:');
            this.results.errors.forEach((error, index) => {
                this.log(`   ${index + 1}. ${error}`, 'error');
            });
        }
        
        if (this.results.failed === 0) {
            this.log('\n🎉 All system tray integration tests passed!', 'success');
            this.log('🎯 System tray functionality is fully operational', 'success');
        } else {
            this.log(`\n⚠️  ${this.results.failed} test(s) failed. Check errors above.`, 'error');
        }
        
        this.log('\n🏁 System Tray Integration Test Suite Complete');
    }
}

// Export for use in other modules
module.exports = SystemTrayIntegrationTest;

// Run tests if called directly
if (require.main === module) {
    app.whenReady().then(async () => {
        const tester = new SystemTrayIntegrationTest();
        await tester.runAllTests();
        
        // Exit after tests
        setTimeout(() => {
            app.quit();
        }, 2000);
    });
}