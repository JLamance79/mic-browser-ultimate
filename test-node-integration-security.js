/**
 * Node Integration Security Validation Test
 * Ensures Node.js integration is properly disabled in renderer processes
 */

const fs = require('fs');
const path = require('path');

class NodeIntegrationSecurityValidator {
    constructor() {
        this.results = {
            mainProcess: { passed: 0, failed: 0, tests: [] },
            webviews: { passed: 0, failed: 0, tests: [] },
            preloadSecurity: { passed: 0, failed: 0, tests: [] },
            overall: { status: 'UNKNOWN', securityScore: 0 }
        };
    }

    /**
     * Run comprehensive Node integration security validation
     */
    async validateSecurity() {
        console.log('🔒 Node Integration Security Validation');
        console.log('=' .repeat(50));

        try {
            await this.validateMainProcessConfiguration();
            await this.validateWebviewConfiguration();
            await this.validatePreloadSecurity();
            
            this.calculateSecurityScore();
            this.generateSecurityReport();
            
            return this.results;
        } catch (error) {
            console.error('❌ Security validation failed:', error.message);
            this.results.overall.status = 'FAILED';
            return this.results;
        }
    }

    /**
     * Validate main process webPreferences configuration
     */
    async validateMainProcessConfiguration() {
        console.log('\n📋 Validating Main Process Configuration...');
        
        const mainJsPath = path.join(__dirname, 'main.js');
        const mainJsContent = fs.readFileSync(mainJsPath, 'utf8');
        
        // Test 1: Node integration disabled
        const nodeIntegrationTest = this.testNodeIntegrationDisabled(mainJsContent);
        this.recordTest('mainProcess', 'Node Integration Disabled', nodeIntegrationTest);
        
        // Test 2: Context isolation enabled
        const contextIsolationTest = this.testContextIsolationEnabled(mainJsContent);
        this.recordTest('mainProcess', 'Context Isolation Enabled', contextIsolationTest);
        
        // Test 3: Remote module disabled
        const remoteModuleTest = this.testRemoteModuleDisabled(mainJsContent);
        this.recordTest('mainProcess', 'Remote Module Disabled', remoteModuleTest);
        
        // Test 4: Web security enabled
        const webSecurityTest = this.testWebSecurityEnabled(mainJsContent);
        this.recordTest('mainProcess', 'Web Security Enabled', webSecurityTest);
        
        // Test 5: Preload script configured
        const preloadTest = this.testPreloadConfigured(mainJsContent);
        this.recordTest('mainProcess', 'Preload Script Configured', preloadTest);
        
        // Test 6: Webview tag properly configured
        const webviewTagTest = this.testWebviewTagConfiguration(mainJsContent);
        this.recordTest('mainProcess', 'Webview Tag Configuration', webviewTagTest);
        
        console.log(`✅ Main Process Tests: ${this.results.mainProcess.passed}/${this.results.mainProcess.passed + this.results.mainProcess.failed} passed`);
    }

    /**
     * Validate webview security configuration
     */
    async validateWebviewConfiguration() {
        console.log('\n🌐 Validating Webview Configuration...');
        
        const indexHtmlPath = path.join(__dirname, 'index.html');
        const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
        
        // Test 1: Webview node integration disabled
        const webviewNodeTest = this.testWebviewNodeIntegrationDisabled(indexHtmlContent);
        this.recordTest('webviews', 'Webview Node Integration Disabled', webviewNodeTest);
        
        // Test 2: Webview web security enabled
        const webviewSecurityTest = this.testWebviewWebSecurityEnabled(indexHtmlContent);
        this.recordTest('webviews', 'Webview Web Security Enabled', webviewSecurityTest);
        
        // Test 3: Webview disable web security is false
        const webviewDisableSecurityTest = this.testWebviewDisableWebSecurityFalse(indexHtmlContent);
        this.recordTest('webviews', 'Webview Disable Web Security False', webviewDisableSecurityTest);
        
        console.log(`✅ Webview Tests: ${this.results.webviews.passed}/${this.results.webviews.passed + this.results.webviews.failed} passed`);
    }

    /**
     * Validate preload script security
     */
    async validatePreloadSecurity() {
        console.log('\n🔗 Validating Preload Script Security...');
        
        const preloadPath = path.join(__dirname, 'preload.js');
        const preloadContent = fs.readFileSync(preloadPath, 'utf8');
        
        // Test 1: Context bridge usage
        const contextBridgeTest = this.testContextBridgeUsage(preloadContent);
        this.recordTest('preloadSecurity', 'Context Bridge Usage', contextBridgeTest);
        
        // Test 2: No direct Node.js exposure
        const nodeExposureTest = this.testNoDirectNodeExposure(preloadContent);
        this.recordTest('preloadSecurity', 'No Direct Node.js Exposure', nodeExposureTest);
        
        // Test 3: IPC renderer secure usage
        const ipcSecurityTest = this.testIPCRendererSecurity(preloadContent);
        this.recordTest('preloadSecurity', 'IPC Renderer Security', ipcSecurityTest);
        
        console.log(`✅ Preload Security Tests: ${this.results.preloadSecurity.passed}/${this.results.preloadSecurity.passed + this.results.preloadSecurity.failed} passed`);
    }

    /**
     * Test if Node integration is disabled
     */
    testNodeIntegrationDisabled(content) {
        const nodeIntegrationPattern = /nodeIntegration:\s*false/;
        const found = nodeIntegrationPattern.test(content);
        return {
            passed: found,
            message: found ? 'Node integration is disabled' : 'Node integration not properly disabled',
            details: found ? 'nodeIntegration: false found in webPreferences' : 'nodeIntegration: false not found'
        };
    }

    /**
     * Test if context isolation is enabled
     */
    testContextIsolationEnabled(content) {
        const contextIsolationPattern = /contextIsolation:\s*true/;
        const found = contextIsolationPattern.test(content);
        return {
            passed: found,
            message: found ? 'Context isolation is enabled' : 'Context isolation not enabled',
            details: found ? 'contextIsolation: true found in webPreferences' : 'contextIsolation: true not found'
        };
    }

    /**
     * Test if remote module is disabled
     */
    testRemoteModuleDisabled(content) {
        const remoteModulePattern = /enableRemoteModule:\s*false/;
        const found = remoteModulePattern.test(content);
        return {
            passed: found,
            message: found ? 'Remote module is disabled' : 'Remote module not properly disabled',
            details: found ? 'enableRemoteModule: false found in webPreferences' : 'enableRemoteModule: false not found'
        };
    }

    /**
     * Test if web security is enabled
     */
    testWebSecurityEnabled(content) {
        const webSecurityPattern = /webSecurity:\s*true/;
        const found = webSecurityPattern.test(content);
        return {
            passed: found,
            message: found ? 'Web security is enabled' : 'Web security not enabled',
            details: found ? 'webSecurity: true found in webPreferences' : 'webSecurity: true not found'
        };
    }

    /**
     * Test if preload script is configured
     */
    testPreloadConfigured(content) {
        const preloadPattern = /preload:\s*path\.join\(__dirname,\s*['"]preload\.js['"]\)/;
        const found = preloadPattern.test(content);
        return {
            passed: found,
            message: found ? 'Preload script is configured' : 'Preload script not configured',
            details: found ? 'preload.js path found in webPreferences' : 'preload.js path not found'
        };
    }

    /**
     * Test webview tag configuration
     */
    testWebviewTagConfiguration(content) {
        const webviewTagPattern = /webviewTag:\s*true/;
        const found = webviewTagPattern.test(content);
        return {
            passed: found,
            message: found ? 'Webview tag is properly configured' : 'Webview tag not configured',
            details: found ? 'webviewTag: true found in webPreferences' : 'webviewTag: true not found'
        };
    }

    /**
     * Test webview node integration
     */
    testWebviewNodeIntegrationDisabled(content) {
        const webviewNodePattern = /webview\.setAttribute\(['"]nodeintegration['"],\s*['"]false['"]\)/;
        const found = webviewNodePattern.test(content);
        return {
            passed: found,
            message: found ? 'Webview node integration is disabled' : 'Webview node integration not disabled',
            details: found ? 'nodeintegration="false" found in webview creation' : 'nodeintegration="false" not found'
        };
    }

    /**
     * Test webview web security
     */
    testWebviewWebSecurityEnabled(content) {
        const webviewSecurityPattern = /webview\.setAttribute\(['"]websecurity['"],\s*['"]true['"]\)/;
        const found = webviewSecurityPattern.test(content);
        return {
            passed: found,
            message: found ? 'Webview web security is enabled' : 'Webview web security not enabled',
            details: found ? 'websecurity="true" found in webview creation' : 'websecurity="true" not found'
        };
    }

    /**
     * Test webview disable web security is false
     */
    testWebviewDisableWebSecurityFalse(content) {
        const webviewDisableSecurityPattern = /webview\.setAttribute\(['"]disablewebsecurity['"],\s*['"]false['"]\)/;
        const found = webviewDisableSecurityPattern.test(content);
        return {
            passed: found,
            message: found ? 'Webview disable web security is false' : 'Webview disable web security not properly set',
            details: found ? 'disablewebsecurity="false" found in webview creation' : 'disablewebsecurity="false" not found'
        };
    }

    /**
     * Test context bridge usage in preload
     */
    testContextBridgeUsage(content) {
        const contextBridgePattern = /contextBridge\.exposeInMainWorld/;
        const found = contextBridgePattern.test(content);
        return {
            passed: found,
            message: found ? 'Context bridge is used for secure API exposure' : 'Context bridge not used',
            details: found ? 'contextBridge.exposeInMainWorld found' : 'contextBridge.exposeInMainWorld not found'
        };
    }

    /**
     * Test for direct Node.js exposure
     */
    testNoDirectNodeExposure(content) {
        const directNodePattern = /window\.(require|process|Buffer|global)/;
        const found = !directNodePattern.test(content);
        return {
            passed: found,
            message: found ? 'No direct Node.js objects exposed to renderer' : 'Direct Node.js objects exposed',
            details: found ? 'No direct Node.js exposure detected' : 'Direct Node.js exposure found'
        };
    }

    /**
     * Test IPC renderer security
     */
    testIPCRendererSecurity(content) {
        const ipcPattern = /ipcRenderer\.(invoke|on)/;
        const directIpcPattern = /window\.ipcRenderer/;
        const secureUsage = ipcPattern.test(content) && !directIpcPattern.test(content);
        return {
            passed: secureUsage,
            message: secureUsage ? 'IPC renderer used securely' : 'IPC renderer not used securely',
            details: secureUsage ? 'IPC used within contextBridge only' : 'Direct IPC exposure detected'
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
     * Calculate overall security score
     */
    calculateSecurityScore() {
        const totalPassed = this.results.mainProcess.passed + 
                          this.results.webviews.passed + 
                          this.results.preloadSecurity.passed;
        const totalTests = totalPassed + 
                          this.results.mainProcess.failed + 
                          this.results.webviews.failed + 
                          this.results.preloadSecurity.failed;
        
        this.results.overall.securityScore = Math.round((totalPassed / totalTests) * 100);
        
        if (this.results.overall.securityScore === 100) {
            this.results.overall.status = 'SECURE';
        } else if (this.results.overall.securityScore >= 80) {
            this.results.overall.status = 'MOSTLY_SECURE';
        } else if (this.results.overall.securityScore >= 60) {
            this.results.overall.status = 'PARTIALLY_SECURE';
        } else {
            this.results.overall.status = 'INSECURE';
        }
    }

    /**
     * Generate security report
     */
    generateSecurityReport() {
        console.log('\n' + '='.repeat(50));
        console.log('🛡️  NODE INTEGRATION SECURITY REPORT');
        console.log('='.repeat(50));
        
        console.log(`\n📊 Overall Security Score: ${this.results.overall.securityScore}%`);
        console.log(`🔒 Security Status: ${this.results.overall.status}`);
        
        const statusEmoji = {
            'SECURE': '🟢',
            'MOSTLY_SECURE': '🟡', 
            'PARTIALLY_SECURE': '🟠',
            'INSECURE': '🔴'
        };
        
        console.log(`${statusEmoji[this.results.overall.status]} Assessment: ${this.getSecurityAssessment()}`);
        
        console.log('\n📋 Test Summary:');
        console.log(`  Main Process: ${this.results.mainProcess.passed}/${this.results.mainProcess.passed + this.results.mainProcess.failed} passed`);
        console.log(`  Webviews: ${this.results.webviews.passed}/${this.results.webviews.passed + this.results.webviews.failed} passed`);
        console.log(`  Preload Security: ${this.results.preloadSecurity.passed}/${this.results.preloadSecurity.passed + this.results.preloadSecurity.failed} passed`);
        
        if (this.results.overall.securityScore < 100) {
            console.log('\n⚠️  Security Recommendations:');
            this.generateRecommendations();
        } else {
            console.log('\n✅ All security checks passed!');
            console.log('   Node integration is properly disabled in all renderer processes.');
        }
        
        console.log('\n' + '='.repeat(50));
    }

    /**
     * Get security assessment text
     */
    getSecurityAssessment() {
        switch (this.results.overall.status) {
            case 'SECURE':
                return 'Node integration is properly disabled. Excellent security posture.';
            case 'MOSTLY_SECURE':
                return 'Good security with minor issues. Review recommendations.';
            case 'PARTIALLY_SECURE':
                return 'Some security concerns. Address failed tests promptly.';
            case 'INSECURE':
                return 'Critical security issues detected. Immediate action required.';
            default:
                return 'Unknown security status.';
        }
    }

    /**
     * Generate security recommendations
     */
    generateRecommendations() {
        const allTests = [
            ...this.results.mainProcess.tests,
            ...this.results.webviews.tests,
            ...this.results.preloadSecurity.tests
        ];
        
        const failedTests = allTests.filter(test => !test.passed);
        
        failedTests.forEach((test, index) => {
            console.log(`   ${index + 1}. ${test.name}: ${test.details}`);
        });
    }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NodeIntegrationSecurityValidator;
}

// Auto-run if called directly
if (require.main === module) {
    const validator = new NodeIntegrationSecurityValidator();
    validator.validateSecurity().then((results) => {
        process.exit(results.overall.status === 'SECURE' ? 0 : 1);
    });
}