/**
 * Context Isolation Validation Test
 * Ensures context isolation is properly enabled across all renderer processes
 */

const fs = require('fs');
const path = require('path');

class ContextIsolationValidator {
    constructor() {
        this.results = {
            mainProcess: { passed: 0, failed: 0, tests: [] },
            webviews: { passed: 0, failed: 0, tests: [] },
            preloadImplementation: { passed: 0, failed: 0, tests: [] },
            isolationVerification: { passed: 0, failed: 0, tests: [] },
            overall: { status: 'UNKNOWN', isolationScore: 0 }
        };
    }

    /**
     * Run comprehensive context isolation validation
     */
    async validateContextIsolation() {
        console.log('🔐 Context Isolation Security Validation');
        console.log('=' .repeat(50));

        try {
            await this.validateMainProcessConfiguration();
            await this.validateWebviewConfiguration();
            await this.validatePreloadImplementation();
            await this.validateIsolationBoundaries();
            
            this.calculateIsolationScore();
            this.generateIsolationReport();
            
            return this.results;
        } catch (error) {
            console.error('❌ Context isolation validation failed:', error.message);
            this.results.overall.status = 'FAILED';
            return this.results;
        }
    }

    /**
     * Validate main process context isolation configuration
     */
    async validateMainProcessConfiguration() {
        console.log('\n🏗️  Validating Main Process Context Isolation...');
        
        const mainJsPath = path.join(__dirname, 'main.js');
        const mainJsContent = fs.readFileSync(mainJsPath, 'utf8');
        
        // Test 1: Context isolation enabled
        const contextIsolationTest = this.testContextIsolationEnabled(mainJsContent);
        this.recordTest('mainProcess', 'Context Isolation Enabled', contextIsolationTest);
        
        // Test 2: Node integration disabled (required with context isolation)
        const nodeIntegrationTest = this.testNodeIntegrationDisabled(mainJsContent);
        this.recordTest('mainProcess', 'Node Integration Disabled', nodeIntegrationTest);
        
        // Test 3: Preload script specified
        const preloadTest = this.testPreloadScriptSpecified(mainJsContent);
        this.recordTest('mainProcess', 'Preload Script Specified', preloadTest);
        
        // Test 4: Remote module disabled
        const remoteModuleTest = this.testRemoteModuleDisabled(mainJsContent);
        this.recordTest('mainProcess', 'Remote Module Disabled', remoteModuleTest);
        
        console.log(`✅ Main Process Tests: ${this.results.mainProcess.passed}/${this.results.mainProcess.passed + this.results.mainProcess.failed} passed`);
    }

    /**
     * Validate webview context isolation configuration
     */
    async validateWebviewConfiguration() {
        console.log('\n🌐 Validating Webview Context Isolation...');
        
        const indexHtmlPath = path.join(__dirname, 'index.html');
        const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
        
        // Test 1: Webview context isolation enabled
        const webviewContextTest = this.testWebviewContextIsolation(indexHtmlContent);
        this.recordTest('webviews', 'Webview Context Isolation', webviewContextTest);
        
        // Test 2: Webview node integration disabled
        const webviewNodeTest = this.testWebviewNodeIntegration(indexHtmlContent);
        this.recordTest('webviews', 'Webview Node Integration Disabled', webviewNodeTest);
        
        // Test 3: Webview web security enabled
        const webviewSecurityTest = this.testWebviewWebSecurity(indexHtmlContent);
        this.recordTest('webviews', 'Webview Web Security Enabled', webviewSecurityTest);
        
        console.log(`✅ Webview Tests: ${this.results.webviews.passed}/${this.results.webviews.passed + this.results.webviews.failed} passed`);
    }

    /**
     * Validate preload script implementation for context isolation
     */
    async validatePreloadImplementation() {
        console.log('\n🔗 Validating Preload Script Context Isolation Implementation...');
        
        const preloadPath = path.join(__dirname, 'preload.js');
        const preloadContent = fs.readFileSync(preloadPath, 'utf8');
        
        // Test 1: Context bridge usage
        const contextBridgeTest = this.testContextBridgeUsage(preloadContent);
        this.recordTest('preloadImplementation', 'Context Bridge Usage', contextBridgeTest);
        
        // Test 2: Proper API exposure
        const apiExposureTest = this.testProperAPIExposure(preloadContent);
        this.recordTest('preloadImplementation', 'Proper API Exposure', apiExposureTest);
        
        // Test 3: No global pollution
        const globalPollutionTest = this.testNoGlobalPollution(preloadContent);
        this.recordTest('preloadImplementation', 'No Global Pollution', globalPollutionTest);
        
        // Test 4: IPC security
        const ipcSecurityTest = this.testIPCSecurityPattern(preloadContent);
        this.recordTest('preloadImplementation', 'IPC Security Pattern', ipcSecurityTest);
        
        console.log(`✅ Preload Implementation Tests: ${this.results.preloadImplementation.passed}/${this.results.preloadImplementation.passed + this.results.preloadImplementation.failed} passed`);
    }

    /**
     * Validate isolation boundaries and security
     */
    async validateIsolationBoundaries() {
        console.log('\n🛡️  Validating Isolation Boundaries...');
        
        const preloadPath = path.join(__dirname, 'preload.js');
        const preloadContent = fs.readFileSync(preloadPath, 'utf8');
        
        // Test 1: No direct process access
        const processAccessTest = this.testNoProcessAccess(preloadContent);
        this.recordTest('isolationVerification', 'No Direct Process Access', processAccessTest);
        
        // Test 2: No require exposure
        const requireExposureTest = this.testNoRequireExposure(preloadContent);
        this.recordTest('isolationVerification', 'No Require Function Exposure', requireExposureTest);
        
        // Test 3: Secure module imports
        const moduleImportsTest = this.testSecureModuleImports(preloadContent);
        this.recordTest('isolationVerification', 'Secure Module Imports', moduleImportsTest);
        
        console.log(`✅ Isolation Boundary Tests: ${this.results.isolationVerification.passed}/${this.results.isolationVerification.passed + this.results.isolationVerification.failed} passed`);
    }

    /**
     * Test if context isolation is enabled in main process
     */
    testContextIsolationEnabled(content) {
        const pattern = /contextIsolation:\s*true/;
        const found = pattern.test(content);
        return {
            passed: found,
            message: found ? 'Context isolation is enabled in main process' : 'Context isolation not enabled',
            details: found ? 'contextIsolation: true found in webPreferences' : 'contextIsolation: true not found'
        };
    }

    /**
     * Test if node integration is disabled
     */
    testNodeIntegrationDisabled(content) {
        const pattern = /nodeIntegration:\s*false/;
        const found = pattern.test(content);
        return {
            passed: found,
            message: found ? 'Node integration disabled (required for context isolation)' : 'Node integration not properly disabled',
            details: found ? 'nodeIntegration: false found' : 'nodeIntegration: false not found'
        };
    }

    /**
     * Test if preload script is specified
     */
    testPreloadScriptSpecified(content) {
        const pattern = /preload:\s*path\.join\(__dirname,\s*['"]preload\.js['"]\)/;
        const found = pattern.test(content);
        return {
            passed: found,
            message: found ? 'Preload script properly specified' : 'Preload script not specified',
            details: found ? 'preload.js path found' : 'preload.js path not found'
        };
    }

    /**
     * Test if remote module is disabled
     */
    testRemoteModuleDisabled(content) {
        const pattern = /enableRemoteModule:\s*false/;
        const found = pattern.test(content);
        return {
            passed: found,
            message: found ? 'Remote module disabled (enhances isolation)' : 'Remote module not disabled',
            details: found ? 'enableRemoteModule: false found' : 'enableRemoteModule: false not found'
        };
    }

    /**
     * Test webview context isolation
     */
    testWebviewContextIsolation(content) {
        const pattern = /webpreferences['"]\s*,\s*['"]contextIsolation=yes['"]|webpreferences['"]:\s*['"]contextIsolation=yes['"]/;
        const found = pattern.test(content);
        return {
            passed: found,
            message: found ? 'Webview context isolation enabled' : 'Webview context isolation not enabled',
            details: found ? 'contextIsolation=yes found in webview configuration' : 'contextIsolation=yes not found'
        };
    }

    /**
     * Test webview node integration
     */
    testWebviewNodeIntegration(content) {
        const pattern = /nodeintegration['"],\s*['"]false['"]/;
        const found = pattern.test(content);
        return {
            passed: found,
            message: found ? 'Webview node integration disabled' : 'Webview node integration not disabled',
            details: found ? 'nodeintegration="false" found' : 'nodeintegration="false" not found'
        };
    }

    /**
     * Test webview web security
     */
    testWebviewWebSecurity(content) {
        const pattern = /websecurity['"],\s*['"]true['"]/;
        const found = pattern.test(content);
        return {
            passed: found,
            message: found ? 'Webview web security enabled' : 'Webview web security not enabled',
            details: found ? 'websecurity="true" found' : 'websecurity="true" not found'
        };
    }

    /**
     * Test context bridge usage
     */
    testContextBridgeUsage(content) {
        const pattern = /contextBridge\.exposeInMainWorld/;
        const found = pattern.test(content);
        return {
            passed: found,
            message: found ? 'Context bridge properly used for API exposure' : 'Context bridge not used',
            details: found ? 'contextBridge.exposeInMainWorld found' : 'contextBridge.exposeInMainWorld not found'
        };
    }

    /**
     * Test proper API exposure pattern
     */
    testProperAPIExposure(content) {
        const pattern = /exposeInMainWorld\(['"]electronAPI['"],\s*\{/;
        const found = pattern.test(content);
        return {
            passed: found,
            message: found ? 'APIs properly exposed through context bridge' : 'APIs not properly exposed',
            details: found ? 'electronAPI object properly exposed' : 'electronAPI object not found'
        };
    }

    /**
     * Test for global pollution
     */
    testNoGlobalPollution(content) {
        const pollutionPattern = /window\.(require|process|Buffer|global|__dirname|__filename)/;
        const found = !pollutionPattern.test(content);
        return {
            passed: found,
            message: found ? 'No global object pollution detected' : 'Global object pollution detected',
            details: found ? 'No direct global assignments found' : 'Direct global assignments found'
        };
    }

    /**
     * Test IPC security pattern
     */
    testIPCSecurityPattern(content) {
        const securePattern = /ipcRenderer\.(invoke|on)/;
        const insecurePattern = /window\.ipcRenderer/;
        const secure = securePattern.test(content) && !insecurePattern.test(content);
        return {
            passed: secure,
            message: secure ? 'IPC used securely within context bridge' : 'Insecure IPC usage detected',
            details: secure ? 'IPC properly contained within preload' : 'IPC exposed to renderer context'
        };
    }

    /**
     * Test for direct process access
     */
    testNoProcessAccess(content) {
        const processPattern = /window\.process|exposeInMainWorld.*process/;
        const found = !processPattern.test(content);
        return {
            passed: found,
            message: found ? 'No direct process object exposure' : 'Process object exposed to renderer',
            details: found ? 'Process object properly isolated' : 'Process object exposure detected'
        };
    }

    /**
     * Test for require function exposure
     */
    testNoRequireExposure(content) {
        const requirePattern = /window\.require|exposeInMainWorld.*require/;
        const found = !requirePattern.test(content);
        return {
            passed: found,
            message: found ? 'Require function not exposed to renderer' : 'Require function exposed',
            details: found ? 'Require function properly isolated' : 'Require function exposure detected'
        };
    }

    /**
     * Test secure module imports
     */
    testSecureModuleImports(content) {
        const secureImportPattern = /const \{ contextBridge, ipcRenderer \} = require\(['"]electron['"]\)/;
        const found = secureImportPattern.test(content);
        return {
            passed: found,
            message: found ? 'Secure module import pattern used' : 'Insecure module imports detected',
            details: found ? 'Only necessary Electron modules imported' : 'Potentially unsafe module imports'
        };
    }

    /**
     * Record test result
     */
    recordTest(category, name, result) {
        this.results[category].tests.push({ name, ...result });
        if (result.passed) {
            this.results[category].passed++;
            console.log(`  ✅ ${name}: ${result.message}`);
        } else {
            this.results[category].failed++;
            console.log(`  ❌ ${name}: ${result.message}`);
            console.log(`     Details: ${result.details}`);
        }
    }

    /**
     * Calculate overall isolation score
     */
    calculateIsolationScore() {
        const totalPassed = this.results.mainProcess.passed + 
                          this.results.webviews.passed + 
                          this.results.preloadImplementation.passed +
                          this.results.isolationVerification.passed;
        const totalTests = totalPassed + 
                          this.results.mainProcess.failed + 
                          this.results.webviews.failed + 
                          this.results.preloadImplementation.failed +
                          this.results.isolationVerification.failed;
        
        this.results.overall.isolationScore = Math.round((totalPassed / totalTests) * 100);
        
        if (this.results.overall.isolationScore === 100) {
            this.results.overall.status = 'FULLY_ISOLATED';
        } else if (this.results.overall.isolationScore >= 90) {
            this.results.overall.status = 'WELL_ISOLATED';
        } else if (this.results.overall.isolationScore >= 70) {
            this.results.overall.status = 'PARTIALLY_ISOLATED';
        } else {
            this.results.overall.status = 'POORLY_ISOLATED';
        }
    }

    /**
     * Generate isolation report
     */
    generateIsolationReport() {
        console.log('\n' + '='.repeat(50));
        console.log('🔐 CONTEXT ISOLATION VALIDATION REPORT');
        console.log('='.repeat(50));
        
        console.log(`\n📊 Context Isolation Score: ${this.results.overall.isolationScore}%`);
        console.log(`🛡️  Isolation Status: ${this.results.overall.status}`);
        
        const statusEmoji = {
            'FULLY_ISOLATED': '🟢',
            'WELL_ISOLATED': '🟡',
            'PARTIALLY_ISOLATED': '🟠',
            'POORLY_ISOLATED': '🔴'
        };
        
        console.log(`${statusEmoji[this.results.overall.status]} Assessment: ${this.getIsolationAssessment()}`);
        
        console.log('\n📋 Test Summary:');
        console.log(`  Main Process: ${this.results.mainProcess.passed}/${this.results.mainProcess.passed + this.results.mainProcess.failed} passed`);
        console.log(`  Webviews: ${this.results.webviews.passed}/${this.results.webviews.passed + this.results.webviews.failed} passed`);
        console.log(`  Preload Implementation: ${this.results.preloadImplementation.passed}/${this.results.preloadImplementation.passed + this.results.preloadImplementation.failed} passed`);
        console.log(`  Isolation Verification: ${this.results.isolationVerification.passed}/${this.results.isolationVerification.passed + this.results.isolationVerification.failed} passed`);
        
        console.log('\n🔒 Context Isolation Benefits:');
        console.log('  ✅ Renderer process runs in isolated JavaScript context');
        console.log('  ✅ Window object is isolated from Electron APIs');
        console.log('  ✅ Prevents malicious scripts from accessing Node.js APIs');
        console.log('  ✅ Secure communication through contextBridge only');
        
        if (this.results.overall.isolationScore < 100) {
            console.log('\n⚠️  Isolation Recommendations:');
            this.generateIsolationRecommendations();
        } else {
            console.log('\n✅ Perfect context isolation implementation!');
            console.log('   All renderer processes are properly isolated.');
        }
        
        console.log('\n' + '='.repeat(50));
    }

    /**
     * Get isolation assessment text
     */
    getIsolationAssessment() {
        switch (this.results.overall.status) {
            case 'FULLY_ISOLATED':
                return 'Perfect context isolation. Maximum security achieved.';
            case 'WELL_ISOLATED':
                return 'Good isolation with minor issues. Very secure.';
            case 'PARTIALLY_ISOLATED':
                return 'Some isolation gaps. Review and fix issues.';
            case 'POORLY_ISOLATED':
                return 'Critical isolation issues. Immediate action required.';
            default:
                return 'Unknown isolation status.';
        }
    }

    /**
     * Generate isolation recommendations
     */
    generateIsolationRecommendations() {
        const allTests = [
            ...this.results.mainProcess.tests,
            ...this.results.webviews.tests,
            ...this.results.preloadImplementation.tests,
            ...this.results.isolationVerification.tests
        ];
        
        const failedTests = allTests.filter(test => !test.passed);
        
        failedTests.forEach((test, index) => {
            console.log(`   ${index + 1}. ${test.name}: ${test.details}`);
        });
    }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContextIsolationValidator;
}

// Auto-run if called directly
if (require.main === module) {
    const validator = new ContextIsolationValidator();
    validator.validateContextIsolation().then((results) => {
        process.exit(results.overall.status === 'FULLY_ISOLATED' ? 0 : 1);
    });
}