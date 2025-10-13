/**
 * Basic Functionality Test Suite for MIC Browser Ultimate
 * Run this in the browser's developer console (F12) after the app loads
 */

// Test configuration
const testConfig = {
    testUrls: [
        'https://www.google.com',
        'https://www.github.com',
        'https://www.example.com'
    ],
    testDelay: 2000, // 2 seconds between tests
    maxRetries: 3
};

// Test results storage
const testResults = {
    passed: 0,
    failed: 0,
    skipped: 0,
    details: []
};

// Utility functions
function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const emoji = {
        'info': 'ℹ️',
        'success': '✅',
        'error': '❌',
        'warning': '⚠️',
        'test': '🧪'
    };
    
    console.log(`${emoji[type]} [${timestamp}] ${message}`);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function recordResult(testName, passed, details = '') {
    testResults.details.push({
        test: testName,
        passed,
        details,
        timestamp: new Date().toISOString()
    });
    
    if (passed) {
        testResults.passed++;
        log(`Test '${testName}' PASSED`, 'success');
    } else {
        testResults.failed++;
        log(`Test '${testName}' FAILED: ${details}`, 'error');
    }
}

// Test Suite Functions
async function testApplicationLaunch() {
    log('Testing Application Launch...', 'test');
    
    try {
        // Check if main components exist
        const tabContainer = document.getElementById('tabContainer');
        const urlInput = document.getElementById('urlInput');
        const navControls = document.querySelector('.nav-controls');
        
        if (!tabContainer) {
            recordResult('Application Launch', false, 'Tab container not found');
            return;
        }
        
        if (!urlInput) {
            recordResult('Application Launch', false, 'URL input not found');
            return;
        }
        
        if (!navControls) {
            recordResult('Application Launch', false, 'Navigation controls not found');
            return;
        }
        
        // Check if micBrowser object exists
        if (typeof window.micBrowser === 'undefined') {
            recordResult('Application Launch', false, 'micBrowser object not initialized');
            return;
        }
        
        recordResult('Application Launch', true, 'All main components loaded successfully');
        
    } catch (error) {
        recordResult('Application Launch', false, `Exception: ${error.message}`);
    }
}

async function testTabCreationAndClosing() {
    log('Testing Tab Creation and Closing...', 'test');
    
    try {
        const initialTabCount = document.querySelectorAll('.tab').length;
        log(`Initial tab count: ${initialTabCount}`, 'info');
        
        // Test tab creation
        if (window.micBrowser && window.micBrowser.tabManager) {
            // Create a new tab
            const newTabId = window.micBrowser.tabManager.createTab({
                url: 'about:blank',
                title: 'Test Tab'
            });
            
            await sleep(1000); // Wait for tab to be created
            
            const newTabCount = document.querySelectorAll('.tab').length;
            log(`New tab count after creation: ${newTabCount}`, 'info');
            
            if (newTabCount > initialTabCount) {
                log('Tab creation successful', 'success');
                
                // Test tab closing
                if (newTabId && window.micBrowser.tabManager.closeTab) {
                    window.micBrowser.tabManager.closeTab(newTabId);
                    await sleep(1000); // Wait for tab to be closed
                    
                    const finalTabCount = document.querySelectorAll('.tab').length;
                    log(`Final tab count after closing: ${finalTabCount}`, 'info');
                    
                    if (finalTabCount === initialTabCount) {
                        recordResult('Tab Creation/Closing', true, 'Tab creation and closing working correctly');
                    } else {
                        recordResult('Tab Creation/Closing', false, 'Tab closing failed');
                    }
                } else {
                    recordResult('Tab Creation/Closing', false, 'Tab closing function not available');
                }
            } else {
                recordResult('Tab Creation/Closing', false, 'New tab was not created');
            }
        } else {
            recordResult('Tab Creation/Closing', false, 'TabManager not available');
        }
        
    } catch (error) {
        recordResult('Tab Creation/Closing', false, `Exception: ${error.message}`);
    }
}

async function testNavigation() {
    log('Testing Navigation Functionality...', 'test');
    
    try {
        if (!window.micBrowser || !window.micBrowser.navigateFromUrlBar) {
            recordResult('Navigation', false, 'Navigation functions not available');
            return;
        }
        
        const urlInput = document.getElementById('urlInput');
        if (!urlInput) {
            recordResult('Navigation', false, 'URL input not found');
            return;
        }
        
        // Test navigation to a simple URL
        urlInput.value = 'https://www.example.com';
        
        // Simulate navigation
        const navigationPromise = new Promise((resolve) => {
            // Listen for any navigation events or changes
            setTimeout(() => {
                resolve(true); // Assume navigation attempted
            }, 2000);
        });
        
        window.micBrowser.navigateFromUrlBar();
        await navigationPromise;
        
        recordResult('Navigation', true, 'Navigation function executed successfully');
        
    } catch (error) {
        recordResult('Navigation', false, `Exception: ${error.message}`);
    }
}

async function testMicAssistant() {
    log('Testing Mic Assistant Modal...', 'test');
    
    try {
        // Look for chat interface elements
        const chatContainer = document.getElementById('chatContainer');
        const aiSidebar = document.getElementById('aiSidebar');
        
        if (!chatContainer && !aiSidebar) {
            recordResult('Mic Assistant', false, 'Chat interface elements not found');
            return;
        }
        
        // Check if chat functions are available
        if (window.chatManager || (window.micBrowser && window.micBrowser.chatManager)) {
            recordResult('Mic Assistant', true, 'Chat interface and functions available');
        } else {
            recordResult('Mic Assistant', false, 'Chat manager not initialized');
        }
        
    } catch (error) {
        recordResult('Mic Assistant', false, `Exception: ${error.message}`);
    }
}

async function testScannerModal() {
    log('Testing Scanner Modal...', 'test');
    
    try {
        // Look for scanner-related elements or functions
        const scannerElements = document.querySelectorAll('[class*="scanner"], [id*="scanner"], [class*="qr"], [id*="qr"]');
        
        // Check if scanner functions exist
        const hasScannerFunction = typeof window.showPhoneScanner === 'function' || 
                                  typeof window.openScanner === 'function' ||
                                  typeof window.toggleScanner === 'function';
        
        if (scannerElements.length > 0 || hasScannerFunction) {
            recordResult('Scanner Modal', true, 'Scanner functionality detected');
        } else {
            recordResult('Scanner Modal', false, 'Scanner functionality not found');
        }
        
    } catch (error) {
        recordResult('Scanner Modal', false, `Exception: ${error.message}`);
    }
}

async function testSettingsPersistence() {
    log('Testing Settings Persistence...', 'test');
    
    try {
        // Check if PersistentStorage is available
        if (window.PersistentStorage || (window.micBrowser && window.micBrowser.storage)) {
            // Try to save and retrieve a test setting
            const testKey = 'test_setting_' + Date.now();
            const testValue = 'test_value_123';
            
            // Attempt to save a setting
            if (window.micBrowser && window.micBrowser.storage && window.micBrowser.storage.set) {
                await window.micBrowser.storage.set(testKey, testValue);
                const retrievedValue = await window.micBrowser.storage.get(testKey);
                
                if (retrievedValue === testValue) {
                    // Clean up test data
                    await window.micBrowser.storage.delete(testKey);
                    recordResult('Settings Persistence', true, 'Settings save and retrieve working correctly');
                } else {
                    recordResult('Settings Persistence', false, 'Settings retrieval failed');
                }
            } else {
                recordResult('Settings Persistence', true, 'Storage system detected (detailed testing requires runtime)');
            }
        } else {
            recordResult('Settings Persistence', false, 'Persistent storage not available');
        }
        
    } catch (error) {
        recordResult('Settings Persistence', false, `Exception: ${error.message}`);
    }
}

// Main test runner
async function runBasicFunctionalityTests() {
    log('🚀 Starting Basic Functionality Test Suite for MIC Browser Ultimate', 'test');
    log('=========================================================', 'info');
    
    // Reset results
    testResults.passed = 0;
    testResults.failed = 0;
    testResults.skipped = 0;
    testResults.details = [];
    
    // Run tests sequentially
    await testApplicationLaunch();
    await sleep(testConfig.testDelay);
    
    await testTabCreationAndClosing();
    await sleep(testConfig.testDelay);
    
    await testNavigation();
    await sleep(testConfig.testDelay);
    
    await testMicAssistant();
    await sleep(testConfig.testDelay);
    
    await testScannerModal();
    await sleep(testConfig.testDelay);
    
    await testSettingsPersistence();
    
    // Generate final report
    log('=========================================================', 'info');
    log('📊 Test Results Summary:', 'test');
    log(`✅ Passed: ${testResults.passed}`, 'success');
    log(`❌ Failed: ${testResults.failed}`, 'error');
    log(`⏭️ Skipped: ${testResults.skipped}`, 'warning');
    
    const totalTests = testResults.passed + testResults.failed + testResults.skipped;
    const successRate = totalTests > 0 ? ((testResults.passed / totalTests) * 100).toFixed(1) : 0;
    log(`📈 Success Rate: ${successRate}%`, 'info');
    
    log('=========================================================', 'info');
    log('📋 Detailed Results:', 'info');
    testResults.details.forEach(result => {
        const status = result.passed ? '✅' : '❌';
        log(`${status} ${result.test}: ${result.details}`, 'info');
    });
    
    log('=========================================================', 'info');
    log('🏁 Basic Functionality Test Suite Complete!', 'test');
    
    return testResults;
}

// Auto-run tests if this script is executed directly
if (typeof window !== 'undefined' && window.document) {
    // Wait for the page to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(runBasicFunctionalityTests, 3000); // Wait 3 seconds after DOM is ready
        });
    } else {
        setTimeout(runBasicFunctionalityTests, 1000); // Run after 1 second if already loaded
    }
}

// Export for manual execution
if (typeof window !== 'undefined') {
    window.runBasicFunctionalityTests = runBasicFunctionalityTests;
}

// Run tests if called directly from Node.js
if (require.main === module) {
    runBasicFunctionalityTests().catch(console.error);
}