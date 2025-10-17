/**
 * Auto-Updater Test Script
 * Tests the auto-updater functionality in MIC Browser Ultimate
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');

// Test the auto-updater functionality
async function testAutoUpdater() {
    console.log('🧪 Starting Auto-Updater Tests...\n');

    let testWindow;
    let testResults = {
        passed: 0,
        failed: 0,
        tests: []
    };

    function logTest(name, passed, message = '') {
        const status = passed ? '✅ PASS' : '❌ FAIL';
        console.log(`${status}: ${name}${message ? ' - ' + message : ''}`);
        testResults.tests.push({ name, passed, message });
        if (passed) testResults.passed++;
        else testResults.failed++;
    }

    try {
        // Wait for app to be ready
        await app.whenReady();

        // Create a test window
        testWindow = new BrowserWindow({
            width: 800,
            height: 600,
            show: false,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js')
            }
        });

        await testWindow.loadFile('index.html');

        // Test 1: Check if auto-updater API is available
        const apiAvailable = await testWindow.webContents.executeJavaScript(`
            typeof window.electronAPI?.updater === 'object'
        `);
        logTest('Auto-updater API availability', apiAvailable);

        // Test 2: Check if status can be retrieved
        try {
            const status = await testWindow.webContents.executeJavaScript(`
                window.electronAPI.updater.getStatus()
            `);
            logTest('Status retrieval', status && typeof status === 'object', `Version: ${status?.version}`);
        } catch (error) {
            logTest('Status retrieval', false, error.message);
        }

        // Test 3: Check if settings can be retrieved
        try {
            const settings = await testWindow.webContents.executeJavaScript(`
                window.electronAPI.updater.getSettings()
            `);
            logTest('Settings retrieval', settings && typeof settings === 'object', 
                    `Auto-download: ${settings?.autoDownload}`);
        } catch (error) {
            logTest('Settings retrieval', false, error.message);
        }

        // Test 4: Check if update notification UI exists
        const uiExists = await testWindow.webContents.executeJavaScript(`
            !!document.getElementById('update-notification')
        `);
        logTest('Update notification UI exists', uiExists);

        // Test 5: Check if settings panel exists
        const settingsExists = await testWindow.webContents.executeJavaScript(`
            !!document.getElementById('settings-updates')
        `);
        logTest('Update settings panel exists', settingsExists);

        // Test 6: Check if UpdateNotificationUI is initialized
        const uiInitialized = await testWindow.webContents.executeJavaScript(`
            typeof window.updateNotificationUI === 'object'
        `);
        logTest('UpdateNotificationUI initialized', uiInitialized);

        // Test 7: Test manual update check (will fail in dev mode, but should not crash)
        try {
            const checkResult = await testWindow.webContents.executeJavaScript(`
                window.electronAPI.updater.checkForUpdates().catch(e => ({ error: e.message }))
            `);
            logTest('Manual update check', !checkResult?.error, 
                    checkResult?.error || 'Check completed successfully');
        } catch (error) {
            logTest('Manual update check', false, error.message);
        }

        // Test 8: Test settings update
        try {
            const updateResult = await testWindow.webContents.executeJavaScript(`
                window.electronAPI.updater.updateSettings({ autoDownload: false })
                    .then(s => ({ success: true, settings: s }))
                    .catch(e => ({ error: e.message }))
            `);
            logTest('Settings update', updateResult?.success, 
                    updateResult?.error || `Auto-download: ${updateResult?.settings?.autoDownload}`);
        } catch (error) {
            logTest('Settings update', false, error.message);
        }

        // Test 9: Test update notification UI methods
        try {
            const uiMethods = await testWindow.webContents.executeJavaScript(`
                const ui = window.updateNotificationUI;
                if (!ui) throw new Error('UpdateNotificationUI not available');
                
                const methods = ['show', 'hide', 'getStatus'];
                const available = methods.filter(method => typeof ui[method] === 'function');
                
                ({ available, total: methods.length })
            `);
            logTest('Update UI methods available', 
                    uiMethods?.available?.length === uiMethods?.total,
                    `${uiMethods?.available?.length}/${uiMethods?.total} methods available`);
        } catch (error) {
            logTest('Update UI methods available', false, error.message);
        }

        // Test 10: Test CSS styles are loaded
        const stylesLoaded = await testWindow.webContents.executeJavaScript(`
            const styles = window.getComputedStyle(document.body);
            const hasUpdateStyles = document.styleSheets.length > 0;
            hasUpdateStyles
        `);
        logTest('Update styles loaded', stylesLoaded);

    } catch (error) {
        console.error('❌ Test setup failed:', error);
        logTest('Test setup', false, error.message);
    }

    // Print results
    console.log('\\n📊 Test Results:');
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);

    if (testResults.failed > 0) {
        console.log('\\n❌ Failed Tests:');
        testResults.tests
            .filter(test => !test.passed)
            .forEach(test => console.log(`   • ${test.name}: ${test.message}`));
    }

    // Cleanup
    if (testWindow) {
        testWindow.close();
    }

    console.log('\\n🧪 Auto-Updater Tests Complete');
    
    // Exit after tests
    setTimeout(() => {
        app.quit();
    }, 1000);
}

// Run tests when app is ready
app.whenReady().then(() => {
    setTimeout(testAutoUpdater, 2000); // Wait for main app to initialize
});

app.on('window-all-closed', () => {
    app.quit();
});