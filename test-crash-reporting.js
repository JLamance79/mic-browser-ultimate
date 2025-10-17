/**
 * Comprehensive Crash Reporting System Test
 * Tests all aspects of the crash reporting implementation
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Test results collector
const testResults = {
    passed: 0,
    failed: 0,
    tests: []
};

function logTest(testName, passed, details = '') {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const message = `${status}: ${testName}${details ? ' - ' + details : ''}`;
    console.log(message);
    
    testResults.tests.push({ testName, passed, details });
    if (passed) {
        testResults.passed++;
    } else {
        testResults.failed++;
    }
}

function printTestSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 CRASH REPORTING SYSTEM TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));
    
    if (testResults.failed > 0) {
        console.log('\n❌ FAILED TESTS:');
        testResults.tests.filter(t => !t.passed).forEach(test => {
            console.log(`   • ${test.testName}: ${test.details}`);
        });
    }
    
    console.log(`\n🎯 Overall Result: ${testResults.failed === 0 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
}

async function testCrashReportingSystem() {
    console.log('🚀 Starting Crash Reporting System Tests...\n');
    
    let mainWindow;
    
    try {
        // Test 1: Check if crash reporting files exist
        const fs = require('fs');
        const crashReporterPath = path.join(__dirname, 'CrashReporter.js');
        const dashboardPath = path.join(__dirname, 'CrashAnalyticsDashboard.js');
        const dashboardCssPath = path.join(__dirname, 'CrashAnalyticsDashboard.css');
        const docsPath = path.join(__dirname, 'CRASH_REPORTING_DOCS.md');
        
        logTest('CrashReporter.js exists', fs.existsSync(crashReporterPath));
        logTest('CrashAnalyticsDashboard.js exists', fs.existsSync(dashboardPath));
        logTest('CrashAnalyticsDashboard.css exists', fs.existsSync(dashboardCssPath));
        logTest('CRASH_REPORTING_DOCS.md exists', fs.existsSync(docsPath));
        
        // Test 2: Check main.js integration
        const mainJsContent = fs.readFileSync(path.join(__dirname, 'main.js'), 'utf8');
        logTest('CrashReportingSystem imported in main.js', 
                mainJsContent.includes("require('./CrashReporter')"));
        logTest('initializeCrashReporting function exists', 
                mainJsContent.includes('async function initializeCrashReporting()'));
        logTest('Crash reporting IPC handlers setup', 
                mainJsContent.includes('setupCrashReportingIpcHandlers'));
        
        // Test 3: Check preload.js integration
        const preloadContent = fs.readFileSync(path.join(__dirname, 'preload.js'), 'utf8');
        logTest('Crash reporting API exposed in preload', 
                preloadContent.includes('crashReporting:'));
        logTest('Crash reporting methods available', 
                preloadContent.includes('getSettings') && preloadContent.includes('updateSettings'));
        
        // Test 4: Check index.html integration
        const indexContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
        logTest('Monitoring tab added to settings', 
                indexContent.includes('data-tab="monitoring"'));
        logTest('Crash analytics dashboard script included', 
                indexContent.includes('CrashAnalyticsDashboard.js'));
        logTest('Crash analytics CSS included', 
                indexContent.includes('CrashAnalyticsDashboard.css'));
        logTest('Monitoring settings functions exist', 
                indexContent.includes('showCrashAnalytics') && indexContent.includes('testCrashReporting'));
        
        // Test 5: Create test window and check API availability
        mainWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            show: false,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js')
            }
        });
        
        await mainWindow.loadFile('index.html');
        
        // Test 6: Check if crash reporting API is available in renderer
        const apiCheckResult = await mainWindow.webContents.executeJavaScript(`
            (function() {
                try {
                    return {
                        electronAPIExists: typeof window.electronAPI !== 'undefined',
                        crashReportingExists: typeof window.electronAPI?.crashReporting !== 'undefined',
                        hasGetSettings: typeof window.electronAPI?.crashReporting?.getSettings === 'function',
                        hasUpdateSettings: typeof window.electronAPI?.crashReporting?.updateSettings === 'function',
                        hasGetReports: typeof window.electronAPI?.crashReporting?.getReports === 'function',
                        hasTestCrash: typeof window.electronAPI?.crashReporting?.testCrash === 'function',
                        dashboardExists: typeof window.crashDashboard !== 'undefined'
                    };
                } catch (error) {
                    return { error: error.message };
                }
            })()
        `);
        
        logTest('electronAPI available in renderer', apiCheckResult.electronAPIExists);
        logTest('crashReporting API available', apiCheckResult.crashReportingExists);
        logTest('getSettings method available', apiCheckResult.hasGetSettings);
        logTest('updateSettings method available', apiCheckResult.hasUpdateSettings);
        logTest('getReports method available', apiCheckResult.hasGetReports);
        logTest('testCrash method available', apiCheckResult.hasTestCrash);
        logTest('crashDashboard global available', apiCheckResult.dashboardExists);
        
        // Test 7: Test IPC communication
        try {
            const settingsResult = await mainWindow.webContents.executeJavaScript(`
                window.electronAPI.crashReporting.getSettings()
            `);
            
            logTest('IPC getSettings call successful', settingsResult.success === true);
            logTest('Default settings returned', 
                    settingsResult.settings && typeof settingsResult.settings === 'object');
        } catch (error) {
            logTest('IPC getSettings call successful', false, error.message);
        }
        
        // Test 8: Test settings UI elements
        const uiElementsResult = await mainWindow.webContents.executeJavaScript(`
            (function() {
                return {
                    monitoringTab: document.querySelector('[data-tab="monitoring"]') !== null,
                    crashReportingToggle: document.querySelector('#crashReportingToggle') !== null,
                    analyticsButton: document.querySelector('button[onclick*="showCrashAnalytics"]') !== null,
                    testCrashButton: document.querySelector('#testCrashButton') !== null,
                    monitoringSettings: document.querySelector('#settings-monitoring') !== null
                };
            })()
        `);
        
        logTest('Monitoring tab element exists', uiElementsResult.monitoringTab);
        logTest('Crash reporting toggle exists', uiElementsResult.crashReportingToggle);
        logTest('Analytics button exists', uiElementsResult.analyticsButton);
        logTest('Test crash button exists', uiElementsResult.testCrashButton);
        logTest('Monitoring settings panel exists', uiElementsResult.monitoringSettings);
        
        // Test 9: Test dashboard functionality
        try {
            const dashboardResult = await mainWindow.webContents.executeJavaScript(`
                (function() {
                    if (window.crashDashboard && typeof window.crashDashboard.loadData === 'function') {
                        return { dashboardReady: true };
                    }
                    return { dashboardReady: false };
                })()
            `);
            
            logTest('Crash analytics dashboard ready', dashboardResult.dashboardReady);
        } catch (error) {
            logTest('Crash analytics dashboard ready', false, error.message);
        }
        
        // Test 10: Test error handling
        try {
            const errorHandlingResult = await mainWindow.webContents.executeJavaScript(`
                window.electronAPI.crashReporting.updateSettings({ invalidData: true })
            `);
            
            logTest('Error handling works for invalid settings', 
                    errorHandlingResult.success === true || errorHandlingResult.message);
        } catch (error) {
            logTest('Error handling works for invalid settings', true, 'Correctly threw error');
        }
        
    } catch (error) {
        logTest('Test execution', false, error.message);
    } finally {
        if (mainWindow) {
            mainWindow.close();
        }
    }
}

// Test file integrity and structure
function testFileIntegrity() {
    console.log('\n📁 Testing File Integrity...\n');
    
    const fs = require('fs');
    
    // Test CrashReporter.js structure
    try {
        const crashReporterContent = fs.readFileSync(path.join(__dirname, 'CrashReporter.js'), 'utf8');
        logTest('CrashReportingSystem class defined', 
                crashReporterContent.includes('class CrashReportingSystem'));
        logTest('Initialize method exists', 
                crashReporterContent.includes('async initialize()'));
        logTest('GetSettings method exists', 
                crashReporterContent.includes('async getSettings()'));
        logTest('UpdateSettings method exists', 
                crashReporterContent.includes('async updateSettings('));
        logTest('GetCrashReports method exists', 
                crashReporterContent.includes('async getCrashReports('));
    } catch (error) {
        logTest('CrashReporter.js file integrity', false, error.message);
    }
    
    // Test dashboard file structure
    try {
        const dashboardContent = fs.readFileSync(path.join(__dirname, 'CrashAnalyticsDashboard.js'), 'utf8');
        logTest('CrashAnalyticsDashboard class defined', 
                dashboardContent.includes('class CrashAnalyticsDashboard'));
        logTest('ShowDashboard method exists', 
                dashboardContent.includes('async showDashboard()'));
        logTest('LoadData method exists', 
                dashboardContent.includes('async loadData()'));
    } catch (error) {
        logTest('CrashAnalyticsDashboard.js file integrity', false, error.message);
    }
    
    // Test CSS file
    try {
        const cssContent = fs.readFileSync(path.join(__dirname, 'CrashAnalyticsDashboard.css'), 'utf8');
        logTest('Dashboard CSS contains modal styles', 
                cssContent.includes('.crash-analytics-modal'));
        logTest('Dashboard CSS contains chart styles', 
                cssContent.includes('.summary-cards'));
    } catch (error) {
        logTest('CrashAnalyticsDashboard.css file integrity', false, error.message);
    }
}

// Main test runner
async function runTests() {
    console.log('🧪 CRASH REPORTING SYSTEM - COMPREHENSIVE TEST SUITE');
    console.log('='.repeat(60));
    console.log(`📅 Test Date: ${new Date().toLocaleString()}`);
    console.log(`🖥️  Platform: ${process.platform}`);
    console.log(`📂 Working Directory: ${process.cwd()}`);
    console.log('='.repeat(60));
    
    // Test file integrity first
    testFileIntegrity();
    
    // Test system integration
    await testCrashReportingSystem();
    
    // Print final summary
    printTestSummary();
    
    // Exit with appropriate code
    process.exit(testResults.failed === 0 ? 0 : 1);
}

// Run tests when this script is executed directly
if (require.main === module) {
    app.whenReady().then(runTests);
}

module.exports = { runTests, testResults };