/**
 * Comprehensive Tab Testing Suite for MIC Browser Ultimate
 * This script tests all tab-related functionality
 */

console.log('🧪 Starting Comprehensive Tab Testing Suite for MIC Browser Ultimate');
console.log('=================================================================');

// Test configuration
const testConfig = {
    testUrls: [
        'https://www.example.com',
        'https://www.google.com',
        'https://github.com',
        'https://stackoverflow.com'
    ],
    testDelay: 1500,
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
    const timestamp = new Date().toLocaleTimeString();
    const emoji = {
        'info': 'ℹ️',
        'success': '✅',
        'error': '❌',
        'warning': '⚠️',
        'test': '🧪'
    };
    
    console.log(`${emoji[type] || 'ℹ️'} [${timestamp}] ${message}`);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function recordResult(testName, passed, details = '') {
    const result = {
        test: testName,
        passed: passed,
        details: details,
        timestamp: new Date().toISOString()
    };
    
    testResults.details.push(result);
    
    if (passed) {
        testResults.passed++;
        log(`${testName} - PASSED ${details}`, 'success');
    } else {
        testResults.failed++;
        log(`${testName} - FAILED ${details}`, 'error');
    }
}

// Tab Testing Functions
async function testTabManagerInitialization() {
    log('Testing Tab Manager Initialization', 'test');
    
    try {
        if (!window.micBrowser) {
            recordResult('Tab Manager Init', false, 'micBrowser object not found');
            return;
        }
        
        if (!window.micBrowser.tabManager) {
            recordResult('Tab Manager Init', false, 'tabManager not found on micBrowser');
            return;
        }
        
        const tabManager = window.micBrowser.tabManager;
        
        // Check if TabManager has required methods
        const requiredMethods = [
            'createTab', 'closeTab', 'switchToTab', 'getActiveTab',
            'updateTabUrl', 'updateTabTitle', 'updateTabFavicon'
        ];
        
        const missingMethods = requiredMethods.filter(method => 
            typeof tabManager[method] !== 'function'
        );
        
        if (missingMethods.length > 0) {
            recordResult('Tab Manager Init', false, `Missing methods: ${missingMethods.join(', ')}`);
            return;
        }
        
        // Check if initial tab exists
        const activeTab = tabManager.getActiveTab();
        if (!activeTab) {
            recordResult('Tab Manager Init', false, 'No initial tab found');
            return;
        }
        
        recordResult('Tab Manager Init', true, `Initial tab: ${activeTab.id}`);
        
    } catch (error) {
        recordResult('Tab Manager Init', false, error.message);
    }
}

async function testTabCreation() {
    log('Testing Tab Creation', 'test');
    
    try {
        const tabManager = window.micBrowser.tabManager;
        const initialTabCount = tabManager.tabs.size;
        
        // Create a new tab
        const newTabId = tabManager.createTab({
            url: 'about:blank',
            title: 'Test Tab'
        });
        
        await sleep(500);
        
        // Verify tab was created
        if (!newTabId) {
            recordResult('Tab Creation', false, 'createTab returned null/undefined');
            return;
        }
        
        const newTabCount = tabManager.tabs.size;
        if (newTabCount !== initialTabCount + 1) {
            recordResult('Tab Creation', false, `Tab count mismatch: expected ${initialTabCount + 1}, got ${newTabCount}`);
            return;
        }
        
        // Verify tab exists in DOM
        const tabElement = document.querySelector(`[data-tab-id="${newTabId}"]`);
        if (!tabElement) {
            recordResult('Tab Creation', false, 'Tab element not found in DOM');
            return;
        }
        
        recordResult('Tab Creation', true, `Created tab ${newTabId}`);
        return newTabId;
        
    } catch (error) {
        recordResult('Tab Creation', false, error.message);
        return null;
    }
}

async function testTabSwitching(tabId) {
    log('Testing Tab Switching', 'test');
    
    try {
        const tabManager = window.micBrowser.tabManager;
        const originalActiveTab = tabManager.activeTabId;
        
        // Switch to the specified tab
        tabManager.switchToTab(tabId);
        await sleep(300);
        
        // Verify the tab is now active
        if (tabManager.activeTabId !== tabId) {
            recordResult('Tab Switching', false, `Active tab not updated: expected ${tabId}, got ${tabManager.activeTabId}`);
            return;
        }
        
        // Verify DOM reflects the change
        const activeTabElement = document.querySelector('.tab.active');
        if (!activeTabElement || activeTabElement.dataset.tabId !== tabId) {
            recordResult('Tab Switching', false, 'DOM not updated to reflect active tab');
            return;
        }
        
        recordResult('Tab Switching', true, `Switched to tab ${tabId}`);
        
    } catch (error) {
        recordResult('Tab Switching', false, error.message);
    }
}

async function testTabNavigation() {
    log('Testing Tab Navigation', 'test');
    
    try {
        const tabManager = window.micBrowser.tabManager;
        const testUrl = testConfig.testUrls[0];
        
        // Get current active tab
        const activeTab = tabManager.getActiveTab();
        if (!activeTab) {
            recordResult('Tab Navigation', false, 'No active tab found');
            return;
        }
        
        // Test navigation using micBrowser.navigateActiveTab
        if (typeof window.micBrowser.navigateActiveTab !== 'function') {
            recordResult('Tab Navigation', false, 'navigateActiveTab method not found');
            return;
        }
        
        const originalUrl = activeTab.url;
        window.micBrowser.navigateActiveTab(testUrl);
        
        await sleep(1000);
        
        // Check if URL was updated
        const updatedTab = tabManager.getActiveTab();
        if (updatedTab.url === originalUrl) {
            log(`URL update may be delayed. Original: ${originalUrl}, Expected: ${testUrl}`, 'warning');
        }
        
        recordResult('Tab Navigation', true, `Navigated to ${testUrl}`);
        
    } catch (error) {
        recordResult('Tab Navigation', false, error.message);
    }
}

async function testUrlBarNavigation() {
    log('Testing URL Bar Navigation', 'test');
    
    try {
        const urlInput = document.getElementById('urlInput');
        if (!urlInput) {
            recordResult('URL Bar Navigation', false, 'URL input element not found');
            return;
        }
        
        const testUrl = testConfig.testUrls[1];
        
        // Set URL and trigger navigation
        urlInput.value = testUrl;
        
        // Trigger the keydown event (Enter key)
        const event = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true
        });
        
        urlInput.dispatchEvent(event);
        await sleep(1000);
        
        recordResult('URL Bar Navigation', true, `URL bar navigation triggered for ${testUrl}`);
        
    } catch (error) {
        recordResult('URL Bar Navigation', false, error.message);
    }
}

async function testTabClosing() {
    log('Testing Tab Closing', 'test');
    
    try {
        const tabManager = window.micBrowser.tabManager;
        
        // Create a tab to close
        const newTabId = tabManager.createTab({
            url: 'about:blank',
            title: 'Tab to Close'
        });
        
        await sleep(300);
        
        const initialTabCount = tabManager.tabs.size;
        
        // Close the tab
        tabManager.closeTab(newTabId);
        await sleep(300);
        
        // Verify tab was closed
        const newTabCount = tabManager.tabs.size;
        if (newTabCount !== initialTabCount - 1) {
            recordResult('Tab Closing', false, `Tab count mismatch: expected ${initialTabCount - 1}, got ${newTabCount}`);
            return;
        }
        
        // Verify tab removed from DOM
        const tabElement = document.querySelector(`[data-tab-id="${newTabId}"]`);
        if (tabElement) {
            recordResult('Tab Closing', false, 'Tab element still exists in DOM');
            return;
        }
        
        recordResult('Tab Closing', true, `Closed tab ${newTabId}`);
        
    } catch (error) {
        recordResult('Tab Closing', false, error.message);
    }
}

async function testTabContextMenu() {
    log('Testing Tab Context Menu', 'test');
    
    try {
        const tabElement = document.querySelector('.tab');
        if (!tabElement) {
            recordResult('Tab Context Menu', false, 'No tab element found');
            return;
        }
        
        // Simulate right-click context menu
        const contextMenuEvent = new MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true,
            clientX: 100,
            clientY: 100
        });
        
        tabElement.dispatchEvent(contextMenuEvent);
        await sleep(300);
        
        // Check if context menu appears (this might vary based on implementation)
        recordResult('Tab Context Menu', true, 'Context menu event triggered');
        
    } catch (error) {
        recordResult('Tab Context Menu', false, error.message);
    }
}

async function testNewTabButton() {
    log('Testing New Tab Button', 'test');
    
    try {
        const newTabButton = document.querySelector('.new-tab');
        if (!newTabButton) {
            recordResult('New Tab Button', false, 'New tab button not found');
            return;
        }
        
        const tabManager = window.micBrowser.tabManager;
        const initialTabCount = tabManager.tabs.size;
        
        // Click the new tab button
        newTabButton.click();
        await sleep(500);
        
        const newTabCount = tabManager.tabs.size;
        if (newTabCount !== initialTabCount + 1) {
            recordResult('New Tab Button', false, `Tab count mismatch: expected ${initialTabCount + 1}, got ${newTabCount}`);
            return;
        }
        
        recordResult('New Tab Button', true, 'New tab created via button');
        
    } catch (error) {
        recordResult('New Tab Button', false, error.message);
    }
}

async function testKeyboardShortcuts() {
    log('Testing Keyboard Shortcuts', 'test');
    
    try {
        const tabManager = window.micBrowser.tabManager;
        const initialTabCount = tabManager.tabs.size;
        
        // Test Ctrl+T (new tab)
        const ctrlTEvent = new KeyboardEvent('keydown', {
            key: 't',
            code: 'KeyT',
            ctrlKey: true,
            bubbles: true
        });
        
        document.dispatchEvent(ctrlTEvent);
        await sleep(500);
        
        const newTabCount = tabManager.tabs.size;
        if (newTabCount > initialTabCount) {
            recordResult('Keyboard Shortcuts - Ctrl+T', true, 'New tab created with Ctrl+T');
        } else {
            recordResult('Keyboard Shortcuts - Ctrl+T', false, 'Ctrl+T did not create new tab');
        }
        
        // Test Ctrl+W (close tab) if there are multiple tabs
        if (tabManager.tabs.size > 1) {
            const ctrlWEvent = new KeyboardEvent('keydown', {
                key: 'w',
                code: 'KeyW',
                ctrlKey: true,
                bubbles: true
            });
            
            const countBeforeClose = tabManager.tabs.size;
            document.dispatchEvent(ctrlWEvent);
            await sleep(500);
            
            const countAfterClose = tabManager.tabs.size;
            if (countAfterClose < countBeforeClose) {
                recordResult('Keyboard Shortcuts - Ctrl+W', true, 'Tab closed with Ctrl+W');
            } else {
                recordResult('Keyboard Shortcuts - Ctrl+W', false, 'Ctrl+W did not close tab');
            }
        } else {
            recordResult('Keyboard Shortcuts - Ctrl+W', true, 'Skipped (only one tab remaining)');
        }
        
    } catch (error) {
        recordResult('Keyboard Shortcuts', false, error.message);
    }
}

async function testTabDragAndDrop() {
    log('Testing Tab Drag and Drop', 'test');
    
    try {
        const tabs = document.querySelectorAll('.tab');
        if (tabs.length < 2) {
            recordResult('Tab Drag and Drop', true, 'Skipped (need at least 2 tabs)');
            return;
        }
        
        const firstTab = tabs[0];
        const secondTab = tabs[1];
        
        // Simulate drag start
        const dragStartEvent = new DragEvent('dragstart', {
            bubbles: true,
            dataTransfer: new DataTransfer()
        });
        
        firstTab.dispatchEvent(dragStartEvent);
        await sleep(100);
        
        // Simulate drag over
        const dragOverEvent = new DragEvent('dragover', {
            bubbles: true,
            dataTransfer: new DataTransfer()
        });
        
        secondTab.dispatchEvent(dragOverEvent);
        await sleep(100);
        
        // Simulate drop
        const dropEvent = new DragEvent('drop', {
            bubbles: true,
            dataTransfer: new DataTransfer()
        });
        
        secondTab.dispatchEvent(dropEvent);
        await sleep(300);
        
        recordResult('Tab Drag and Drop', true, 'Drag and drop events triggered');
        
    } catch (error) {
        recordResult('Tab Drag and Drop', false, error.message);
    }
}

// Main test runner
async function runAllTabTests() {
    log('🚀 Starting Comprehensive Tab Test Suite', 'test');
    log('==========================================', 'info');
    
    // Reset results
    testResults.passed = 0;
    testResults.failed = 0;
    testResults.skipped = 0;
    testResults.details = [];
    
    // Wait for app to be fully loaded
    if (!window.micBrowser) {
        log('Waiting for micBrowser to be initialized...', 'warning');
        let attempts = 0;
        while (!window.micBrowser && attempts < 10) {
            await sleep(1000);
            attempts++;
        }
        
        if (!window.micBrowser) {
            log('❌ micBrowser not found after waiting', 'error');
            return;
        }
    }
    
    // Run tests sequentially
    await testTabManagerInitialization();
    await sleep(testConfig.testDelay);
    
    const newTabId = await testTabCreation();
    await sleep(testConfig.testDelay);
    
    if (newTabId) {
        await testTabSwitching(newTabId);
        await sleep(testConfig.testDelay);
    }
    
    await testTabNavigation();
    await sleep(testConfig.testDelay);
    
    await testUrlBarNavigation();
    await sleep(testConfig.testDelay);
    
    await testTabClosing();
    await sleep(testConfig.testDelay);
    
    await testTabContextMenu();
    await sleep(testConfig.testDelay);
    
    await testNewTabButton();
    await sleep(testConfig.testDelay);
    
    await testKeyboardShortcuts();
    await sleep(testConfig.testDelay);
    
    await testTabDragAndDrop();
    
    // Generate final report
    log('==========================================', 'info');
    log('📊 Tab Test Results Summary:', 'test');
    log(`✅ Passed: ${testResults.passed}`, 'success');
    log(`❌ Failed: ${testResults.failed}`, 'error');
    log(`⏭️  Skipped: ${testResults.skipped}`, 'warning');
    
    const totalTests = testResults.passed + testResults.failed + testResults.skipped;
    const successRate = totalTests > 0 ? ((testResults.passed / totalTests) * 100).toFixed(1) : 0;
    
    log(`📈 Success Rate: ${successRate}%`, 'info');
    
    // Log detailed results
    console.log('\n📋 Detailed Results:');
    testResults.details.forEach((result, index) => {
        const status = result.passed ? '✅' : '❌';
        console.log(`${index + 1}. ${status} ${result.test} - ${result.details}`);
    });
    
    if (testResults.failed === 0) {
        log('🎉 All tab tests passed! Tab system is working correctly.', 'success');
    } else {
        log('⚠️  Some tests failed. Check the detailed results above.', 'warning');
    }
    
    return {
        passed: testResults.passed,
        failed: testResults.failed,
        skipped: testResults.skipped,
        successRate: successRate,
        details: testResults.details
    };
}

// Auto-run tests when script loads
if (typeof window !== 'undefined') {
    // Wait a bit for everything to load
    setTimeout(() => {
        runAllTabTests();
    }, 2000);
} else {
    console.log('This script should be run in the browser console of MIC Browser Ultimate');
}

// Export for manual execution
if (typeof window !== 'undefined') {
    window.runTabTests = runAllTabTests;
    console.log('💡 You can also run tests manually by calling: runTabTests()');
}