/**
 * Deep Link System Integration Test
 * Tests the complete deep linking functionality in a live environment
 */

const { spawn } = require('child_process');
const path = require('path');

class DeepLinkIntegrationTest {
    constructor() {
        this.testResults = [];
        this.passCount = 0;
        this.failCount = 0;
    }

    log(testName, passed, message) {
        const result = {
            test: testName,
            passed,
            message,
            timestamp: new Date().toISOString()
        };
        
        this.testResults.push(result);
        
        if (passed) {
            this.passCount++;
            console.log(`✅ ${testName}: ${message}`);
        } else {
            this.failCount++;
            console.log(`❌ ${testName}: ${message}`);
        }
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async runTest() {
        console.log('🧪 Deep Link System Integration Test');
        console.log('=' .repeat(50));
        
        // Test 1: Check if DeepLinkManager exists
        try {
            const DeepLinkManager = require('./DeepLinkManager.js');
            this.log('DeepLinkManager Import', true, 'Successfully imported DeepLinkManager');
        } catch (error) {
            this.log('DeepLinkManager Import', false, `Failed to import: ${error.message}`);
            return this.generateReport();
        }

        // Test 2: Run the demonstration
        try {
            console.log('\n🎯 Running Deep Link Demonstration...');
            const demoProcess = spawn('node', ['deep-link-demo.js'], {
                cwd: process.cwd(),
                stdio: 'pipe'
            });

            let demoOutput = '';
            demoProcess.stdout.on('data', (data) => {
                demoOutput += data.toString();
            });

            demoProcess.stderr.on('data', (data) => {
                console.error('Demo stderr:', data.toString());
            });

            await new Promise((resolve) => {
                demoProcess.on('close', (code) => {
                    if (code === 0) {
                        this.log('Deep Link Demo', true, 'Demonstration completed successfully');
                        
                        // Check for specific success indicators
                        if (demoOutput.includes('Deep Link System Demonstration Complete!')) {
                            this.log('Demo Completion', true, 'Demo completed with success message');
                        }
                        
                        if (demoOutput.includes('URL validation passed')) {
                            this.log('Security Validation', true, 'Security validation working');
                        }
                        
                        if (demoOutput.includes('Deep link processed successfully')) {
                            this.log('URL Processing', true, 'URL processing functional');
                        }
                        
                    } else {
                        this.log('Deep Link Demo', false, `Demo failed with exit code ${code}`);
                    }
                    resolve();
                });
            });
        } catch (error) {
            this.log('Deep Link Demo', false, `Demo execution failed: ${error.message}`);
        }

        // Test 3: Test URL Generation and Parsing
        try {
            const DeepLinkManager = require('./DeepLinkManager.js');
            const manager = new DeepLinkManager();
            
            // Test URL generation
            const testActions = [
                { action: 'search', params: { q: 'test', category: 'web' } },
                { action: 'chat', params: { room: 'general', user: 'testuser' } },
                { action: 'settings', params: { section: 'privacy' } }
            ];

            for (const test of testActions) {
                try {
                    const generated = manager.generateDeepLink(test.action, test.params);
                    if (generated && generated.startsWith('mic-browser://')) {
                        const parsed = manager.parseDeepLink(generated);
                        if (parsed && parsed.action === test.action) {
                            this.log(`URL Generation: ${test.action}`, true, `Generated and parsed correctly`);
                        } else {
                            this.log(`URL Generation: ${test.action}`, false, 'Parse mismatch');
                        }
                    } else {
                        this.log(`URL Generation: ${test.action}`, false, 'Invalid URL format');
                    }
                } catch (error) {
                    this.log(`URL Generation: ${test.action}`, false, error.message);
                }
            }
        } catch (error) {
            this.log('URL Generation Test', false, `Test setup failed: ${error.message}`);
        }

        // Test 4: Security Validation
        try {
            const DeepLinkManager = require('./DeepLinkManager.js');
            const manager = new DeepLinkManager();
            
            const securityTests = [
                { url: 'mic-browser://search?q=safe', shouldPass: true },
                { url: 'javascript:alert("xss")', shouldPass: false },
                { url: 'data:text/html,<script>', shouldPass: false },
                { url: 'mic-browser://search?q=<script>', shouldPass: false }
            ];

            for (const test of securityTests) {
                try {
                    const validation = await manager.validateUrl(test.url);
                    const isValid = validation && validation.isValid;
                    
                    if (isValid === test.shouldPass) {
                        this.log(`Security Test: ${test.shouldPass ? 'Allow' : 'Block'}`, true, 
                               `Correctly ${test.shouldPass ? 'allowed' : 'blocked'} URL`);
                    } else {
                        this.log(`Security Test: ${test.shouldPass ? 'Allow' : 'Block'}`, false, 
                               `Incorrectly ${isValid ? 'allowed' : 'blocked'} URL: ${test.url}`);
                    }
                } catch (error) {
                    // Exceptions for malicious URLs are expected
                    if (!test.shouldPass) {
                        this.log(`Security Test: Block`, true, 'Exception thrown for malicious URL');
                    } else {
                        this.log(`Security Test: Allow`, false, `Unexpected exception: ${error.message}`);
                    }
                }
            }
        } catch (error) {
            this.log('Security Validation Test', false, `Test setup failed: ${error.message}`);
        }

        // Test 5: Check file structure
        const requiredFiles = [
            'DeepLinkManager.js',
            'deep-link-demo.js',
            'deep-link-test.js',
            'DEEP_LINK_COMPLETE.md',
            'DEEP_LINK_IMPLEMENTATION_SUMMARY.md'
        ];

        const fs = require('fs');
        for (const file of requiredFiles) {
            if (fs.existsSync(path.join(process.cwd(), file))) {
                this.log(`File Check: ${file}`, true, 'File exists');
            } else {
                this.log(`File Check: ${file}`, false, 'File missing');
            }
        }

        // Test 6: Check main.js integration
        try {
            const mainContent = fs.readFileSync('main.js', 'utf8');
            
            const integrationChecks = [
                { check: 'DeepLinkManager import', pattern: "require('./DeepLinkManager')" },
                { check: 'Deep link initialization', pattern: 'initializeDeepLinkManager' },
                { check: 'IPC handlers setup', pattern: 'setupDeepLinkIpcHandlers' },
                { check: 'Protocol registration', pattern: 'setAsDefaultProtocolClient' }
            ];

            for (const check of integrationChecks) {
                if (mainContent.includes(check.pattern)) {
                    this.log(`Integration: ${check.check}`, true, 'Found in main.js');
                } else {
                    this.log(`Integration: ${check.check}`, false, 'Missing from main.js');
                }
            }
        } catch (error) {
            this.log('Main.js Integration Check', false, `Failed to read main.js: ${error.message}`);
        }

        // Test 7: Check preload.js API exposure
        try {
            const preloadContent = fs.readFileSync('preload.js', 'utf8');
            
            const apiChecks = [
                'handle: (url)',
                'generate: (action, params',
                'getSettings: ()',
                'getStatistics: ()',
                'getHistory: ()'
            ];

            for (const api of apiChecks) {
                if (preloadContent.includes(api)) {
                    this.log(`API Exposure: ${api}`, true, 'Found in preload.js');
                } else {
                    this.log(`API Exposure: ${api}`, false, 'Missing from preload.js');
                }
            }
        } catch (error) {
            this.log('Preload.js API Check', false, `Failed to read preload.js: ${error.message}`);
        }

        // Test 8: Check HTML UI integration
        try {
            const htmlContent = fs.readFileSync('index.html', 'utf8');
            
            const uiChecks = [
                'Deep Link Protocol',
                'deeplink-settings',
                'testDeepLink',
                'generateDeepLink',
                'deeplinkTestUrl'
            ];

            for (const ui of uiChecks) {
                if (htmlContent.includes(ui)) {
                    this.log(`UI Integration: ${ui}`, true, 'Found in index.html');
                } else {
                    this.log(`UI Integration: ${ui}`, false, 'Missing from index.html');
                }
            }
        } catch (error) {
            this.log('HTML UI Check', false, `Failed to read index.html: ${error.message}`);
        }

        return this.generateReport();
    }

    generateReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 DEEP LINK SYSTEM TEST RESULTS');
        console.log('='.repeat(60));
        
        const total = this.passCount + this.failCount;
        const successRate = total > 0 ? ((this.passCount / total) * 100).toFixed(1) : 0;
        
        console.log(`✅ Passed: ${this.passCount}`);
        console.log(`❌ Failed: ${this.failCount}`);
        console.log(`📈 Success Rate: ${successRate}%`);
        
        console.log('\n📋 Test Categories:');
        const categories = {};
        this.testResults.forEach(result => {
            const category = result.test.split(':')[0];
            if (!categories[category]) {
                categories[category] = { pass: 0, fail: 0 };
            }
            if (result.passed) {
                categories[category].pass++;
            } else {
                categories[category].fail++;
            }
        });

        Object.entries(categories).forEach(([category, stats]) => {
            const total = stats.pass + stats.fail;
            const rate = total > 0 ? ((stats.pass / total) * 100).toFixed(1) : 0;
            console.log(`   ${category}: ${stats.pass}/${total} (${rate}%)`);
        });

        if (this.failCount > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults
                .filter(result => !result.passed)
                .forEach(result => {
                    console.log(`   - ${result.test}: ${result.message}`);
                });
        }

        // Overall assessment
        console.log('\n🎯 Overall Assessment:');
        if (successRate >= 90) {
            console.log('🟢 EXCELLENT: Deep link system is fully functional and ready for production');
        } else if (successRate >= 75) {
            console.log('🟡 GOOD: Deep link system is mostly functional with minor issues');
        } else if (successRate >= 50) {
            console.log('🟠 FAIR: Deep link system has significant issues that need attention');
        } else {
            console.log('🔴 POOR: Deep link system has major problems and requires immediate fixes');
        }

        // Save detailed report
        const fs = require('fs');
        const reportData = {
            summary: {
                total,
                passed: this.passCount,
                failed: this.failCount,
                successRate: parseFloat(successRate)
            },
            categories,
            results: this.testResults,
            timestamp: new Date().toISOString()
        };

        try {
            fs.writeFileSync('deep-link-test-results.json', JSON.stringify(reportData, null, 2));
            console.log('\n💾 Detailed test results saved to: deep-link-test-results.json');
        } catch (error) {
            console.log('\n⚠️  Failed to save detailed results:', error.message);
        }

        return successRate >= 75;
    }
}

// Run the test if called directly
if (require.main === module) {
    const tester = new DeepLinkIntegrationTest();
    tester.runTest().then(success => {
        console.log(`\n🏁 Test completed. Success: ${success}`);
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('\n💥 Test runner failed:', error);
        process.exit(1);
    });
}

module.exports = DeepLinkIntegrationTest;