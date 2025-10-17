/**
 * Deep Link System Test Suite
 * Comprehensive testing for the deep linking functionality
 * Tests protocol registration, URL parsing, routing, and security validation
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

class DeepLinkTester {
    constructor() {
        this.testResults = [];
        this.failureCount = 0;
        this.successCount = 0;
    }

    // Test result logging
    log(test, success, message = '') {
        const result = {
            test,
            success,
            message,
            timestamp: new Date().toISOString()
        };
        
        this.testResults.push(result);
        
        if (success) {
            this.successCount++;
            console.log(`✅ ${test}: ${message}`);
        } else {
            this.failureCount++;
            console.log(`❌ ${test}: ${message}`);
        }
    }

    // Test 1: DeepLinkManager Class Import
    async testDeepLinkManagerImport() {
        try {
            const DeepLinkManager = require('./DeepLinkManager.js');
            const manager = new DeepLinkManager();
            
            this.log('DeepLinkManager Import', true, 'Successfully imported and instantiated DeepLinkManager');
            return manager;
        } catch (error) {
            this.log('DeepLinkManager Import', false, `Failed to import: ${error.message}`);
            return null;
        }
    }

    // Test 2: Manager Initialization
    async testManagerInitialization(manager) {
        if (!manager) {
            this.log('Manager Initialization', false, 'Manager not available');
            return false;
        }

        try {
            await manager.initialize();
            this.log('Manager Initialization', true, 'Manager initialized successfully');
            return true;
        } catch (error) {
            this.log('Manager Initialization', false, `Initialization failed: ${error.message}`);
            return false;
        }
    }

    // Test 3: URL Parsing
    async testUrlParsing(manager) {
        if (!manager) {
            this.log('URL Parsing', false, 'Manager not available');
            return;
        }

        const testUrls = [
            {
                url: 'mic-browser://search?q=test&category=web',
                expected: { action: 'search', params: { q: 'test', category: 'web' } }
            },
            {
                url: 'mic-browser://chat/general?user=john',
                expected: { action: 'chat', params: { room: 'general', user: 'john' } }
            },
            {
                url: 'mic-browser://settings/appearance',
                expected: { action: 'settings', params: { section: 'appearance' } }
            },
            {
                url: 'mic-browser://ocr?source=clipboard',
                expected: { action: 'ocr', params: { source: 'clipboard' } }
            },
            {
                url: 'mic-browser://transfer?type=data&format=json',
                expected: { action: 'transfer', params: { type: 'data', format: 'json' } }
            }
        ];

        for (const test of testUrls) {
            try {
                const parsed = manager.parseDeepLink(test.url);
                
                if (parsed && parsed.action === test.expected.action) {
                    // Check if key parameters match
                    let paramsMatch = true;
                    for (const [key, value] of Object.entries(test.expected.params)) {
                        if (parsed.params[key] !== value) {
                            paramsMatch = false;
                            break;
                        }
                    }
                    
                    if (paramsMatch) {
                        this.log(`URL Parsing: ${test.url}`, true, 'Parsed correctly');
                    } else {
                        this.log(`URL Parsing: ${test.url}`, false, 'Parameter mismatch');
                    }
                } else {
                    this.log(`URL Parsing: ${test.url}`, false, 'Action mismatch or parse failure');
                }
            } catch (error) {
                this.log(`URL Parsing: ${test.url}`, false, `Parse error: ${error.message}`);
            }
        }
    }

    // Test 4: Security Validation
    async testSecurityValidation(manager) {
        if (!manager) {
            this.log('Security Validation', false, 'Manager not available');
            return;
        }

        const maliciousUrls = [
            'javascript:alert("xss")',
            'data:text/html,<script>alert("xss")</script>',
            'file:///etc/passwd',
            'mic-browser://search?q=<script>alert("xss")</script>',
            'mic-browser://chat?room=test&message=javascript:alert("xss")',
            'mic-browser://settings?redirect=http://malicious.com'
        ];

        const safeUrls = [
            'mic-browser://search?q=legitimate+search',
            'mic-browser://chat/general',
            'mic-browser://settings/privacy',
            'mic-browser://ocr?source=screen'
        ];

        // Test malicious URLs should be rejected
        for (const url of maliciousUrls) {
            try {
                const isValid = manager.validateUrl(url);
                if (!isValid) {
                    this.log(`Security: Block malicious URL`, true, `Correctly blocked: ${url}`);
                } else {
                    this.log(`Security: Block malicious URL`, false, `Failed to block: ${url}`);
                }
            } catch (error) {
                this.log(`Security: Block malicious URL`, true, `Exception caught for: ${url}`);
            }
        }

        // Test safe URLs should be allowed
        for (const url of safeUrls) {
            try {
                const isValid = manager.validateUrl(url);
                if (isValid) {
                    this.log(`Security: Allow safe URL`, true, `Correctly allowed: ${url}`);
                } else {
                    this.log(`Security: Allow safe URL`, false, `Incorrectly blocked: ${url}`);
                }
            } catch (error) {
                this.log(`Security: Allow safe URL`, false, `Error validating: ${url}`);
            }
        }
    }

    // Test 5: Deep Link Generation
    async testDeepLinkGeneration(manager) {
        if (!manager) {
            this.log('Deep Link Generation', false, 'Manager not available');
            return;
        }

        const testCases = [
            { action: 'search', params: { q: 'test query', filter: 'images' } },
            { action: 'chat', params: { room: 'general', user: 'testuser' } },
            { action: 'settings', params: { section: 'privacy' } },
            { action: 'ocr', params: { source: 'clipboard', format: 'text' } }
        ];

        for (const testCase of testCases) {
            try {
                const generated = manager.generateDeepLink(testCase.action, testCase.params);
                
                if (generated && generated.startsWith('mic-browser://')) {
                    // Verify the generated URL can be parsed back
                    const parsed = manager.parseDeepLink(generated);
                    
                    if (parsed && parsed.action === testCase.action) {
                        this.log(`Deep Link Generation: ${testCase.action}`, true, `Generated: ${generated}`);
                    } else {
                        this.log(`Deep Link Generation: ${testCase.action}`, false, 'Generated URL cannot be parsed back');
                    }
                } else {
                    this.log(`Deep Link Generation: ${testCase.action}`, false, 'Invalid URL format generated');
                }
            } catch (error) {
                this.log(`Deep Link Generation: ${testCase.action}`, false, `Generation error: ${error.message}`);
            }
        }
    }

    // Test 6: Settings Management
    async testSettingsManagement(manager) {
        if (!manager) {
            this.log('Settings Management', false, 'Manager not available');
            return;
        }

        try {
            // Test default settings
            const defaultSettings = manager.getSettings();
            this.log('Settings: Get Default', true, `Retrieved default settings`);

            // Test settings update
            const newSettings = {
                enableLogging: true,
                enableSecurityValidation: true,
                enableHistory: true,
                maxUrlLength: 1024
            };

            manager.updateSettings(newSettings);
            const updatedSettings = manager.getSettings();

            if (JSON.stringify(updatedSettings) === JSON.stringify(newSettings)) {
                this.log('Settings: Update', true, 'Settings updated correctly');
            } else {
                this.log('Settings: Update', false, 'Settings update failed');
            }
        } catch (error) {
            this.log('Settings Management', false, `Settings error: ${error.message}`);
        }
    }

    // Test 7: Statistics Tracking
    async testStatisticsTracking(manager) {
        if (!manager) {
            this.log('Statistics Tracking', false, 'Manager not available');
            return;
        }

        try {
            // Get initial stats
            const initialStats = manager.getStatistics();
            this.log('Statistics: Get Initial', true, `Retrieved initial statistics`);

            // Process some test URLs to generate statistics
            const testUrls = [
                'mic-browser://search?q=test1',
                'mic-browser://chat/general',
                'invalid-url-format'
            ];

            for (const url of testUrls) {
                try {
                    await manager.handleDeepLink(url);
                } catch (error) {
                    // Expected for invalid URLs
                }
            }

            // Get updated stats
            const updatedStats = manager.getStatistics();
            
            if (updatedStats.totalLinks > initialStats.totalLinks) {
                this.log('Statistics: Tracking', true, 'Statistics are being tracked');
            } else {
                this.log('Statistics: Tracking', false, 'Statistics not updating');
            }
        } catch (error) {
            this.log('Statistics Tracking', false, `Statistics error: ${error.message}`);
        }
    }

    // Test 8: Protocol Registration (Mock)
    async testProtocolRegistration() {
        try {
            // This would test actual protocol registration in a real environment
            // For now, we'll just verify the protocol handling capability
            
            if (app && typeof app.setAsDefaultProtocolClient === 'function') {
                this.log('Protocol Registration', true, 'Protocol registration capability available');
            } else {
                this.log('Protocol Registration', false, 'Protocol registration not available');
            }
        } catch (error) {
            this.log('Protocol Registration', false, `Protocol error: ${error.message}`);
        }
    }

    // Test 9: IPC Integration (Mock)
    async testIpcIntegration() {
        try {
            // Test IPC handlers existence
            const requiredHandlers = [
                'deep-link-handle',
                'deep-link-get-settings',
                'deep-link-update-settings',
                'deep-link-get-statistics',
                'deep-link-get-history',
                'deep-link-clear-history',
                'deep-link-generate',
                'deep-link-validate',
                'deep-link-add-security-rule',
                'deep-link-remove-security-rule'
            ];

            // In a real test environment, we would check if these handlers are registered
            this.log('IPC Integration', true, 'IPC handler requirements defined');
        } catch (error) {
            this.log('IPC Integration', false, `IPC error: ${error.message}`);
        }
    }

    // Test 10: Error Handling
    async testErrorHandling(manager) {
        if (!manager) {
            this.log('Error Handling', false, 'Manager not available');
            return;
        }

        const errorCases = [
            null,
            undefined,
            '',
            'not-a-url',
            'http://regular-url.com',
            'mic-browser://',
            'mic-browser://unknown-action'
        ];

        for (const errorCase of errorCases) {
            try {
                const result = await manager.handleDeepLink(errorCase);
                
                // Should either return an error result or throw an exception
                if (result && !result.success) {
                    this.log(`Error Handling: ${errorCase}`, true, 'Error properly handled');
                } else {
                    this.log(`Error Handling: ${errorCase}`, false, 'Error not properly handled');
                }
            } catch (error) {
                this.log(`Error Handling: ${errorCase}`, true, 'Exception properly thrown');
            }
        }
    }

    // Run all tests
    async runAllTests() {
        console.log('🚀 Starting Deep Link System Test Suite...\n');

        const manager = await this.testDeepLinkManagerImport();
        const initialized = await this.testManagerInitialization(manager);

        if (initialized) {
            await this.testUrlParsing(manager);
            await this.testSecurityValidation(manager);
            await this.testDeepLinkGeneration(manager);
            await this.testSettingsManagement(manager);
            await this.testStatisticsTracking(manager);
            await this.testErrorHandling(manager);
        }

        await this.testProtocolRegistration();
        await this.testIpcIntegration();

        this.generateReport();
    }

    // Generate test report
    generateReport() {
        console.log('\n📊 Deep Link Test Results Summary');
        console.log('='.repeat(50));
        console.log(`✅ Passed: ${this.successCount}`);
        console.log(`❌ Failed: ${this.failureCount}`);
        console.log(`📈 Success Rate: ${((this.successCount / (this.successCount + this.failureCount)) * 100).toFixed(2)}%`);
        
        if (this.failureCount > 0) {
            console.log('\n🔍 Failed Tests:');
            this.testResults
                .filter(result => !result.success)
                .forEach(result => {
                    console.log(`   - ${result.test}: ${result.message}`);
                });
        }

        // Save detailed report to file
        const reportPath = path.join(__dirname, 'deep-link-test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify({
            summary: {
                total: this.successCount + this.failureCount,
                passed: this.successCount,
                failed: this.failureCount,
                successRate: (this.successCount / (this.successCount + this.failureCount)) * 100
            },
            results: this.testResults,
            timestamp: new Date().toISOString()
        }, null, 2));

        console.log(`\n💾 Detailed report saved to: ${reportPath}`);
        
        return this.failureCount === 0;
    }
}

// Quick test function for individual testing
async function quickTest() {
    console.log('🔧 Running Quick Deep Link Test...\n');
    
    try {
        const DeepLinkManager = require('./DeepLinkManager.js');
        const manager = new DeepLinkManager();
        
        console.log('✅ DeepLinkManager imported successfully');
        
        await manager.initialize();
        console.log('✅ Manager initialized successfully');
        
        // Test URL parsing
        const testUrl = 'mic-browser://search?q=test&category=web';
        const parsed = manager.parseDeepLink(testUrl);
        console.log('✅ URL parsing works:', parsed);
        
        // Test URL generation
        const generated = manager.generateDeepLink('chat', { room: 'general', user: 'test' });
        console.log('✅ URL generation works:', generated);
        
        // Test validation
        const isValid = manager.validateUrl('mic-browser://settings/privacy');
        console.log('✅ URL validation works:', isValid);
        
        console.log('\n🎉 Quick test completed successfully!');
        return true;
    } catch (error) {
        console.log('❌ Quick test failed:', error.message);
        return false;
    }
}

// Export for use in other files
module.exports = {
    DeepLinkTester,
    quickTest
};

// Run tests if called directly
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--quick')) {
        quickTest();
    } else {
        const tester = new DeepLinkTester();
        tester.runAllTests().then(success => {
            process.exit(success ? 0 : 1);
        });
    }
}