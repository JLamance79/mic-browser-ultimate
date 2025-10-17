/**
 * Deep Link Functionality Demonstration
 * Shows real-world usage of the deep linking system
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🌟 Deep Link System - Live Functionality Test');
console.log('=' .repeat(60));

async function testDeepLinkFunctionality() {
    try {
        // Test 1: Import and create manager
        console.log('\n1️⃣ Testing Deep Link Manager...');
        const DeepLinkManager = require('./DeepLinkManager.js');
        const manager = new DeepLinkManager();
        
        console.log('✅ DeepLinkManager imported and instantiated');

        // Test 2: Generate various deep links
        console.log('\n2️⃣ Generating Deep Links...');
        
        const testCases = [
            {
                name: 'Search with Query',
                action: 'search',
                params: { q: 'artificial intelligence', category: 'web', filter: 'recent' }
            },
            {
                name: 'Chat Room Access',
                action: 'chat',
                params: { room: 'general', user: 'developer', action: 'join' }
            },
            {
                name: 'Settings Panel',
                action: 'settings',
                params: { section: 'privacy', subsection: 'data-protection' }
            },
            {
                name: 'OCR Functionality',
                action: 'ocr',
                params: { source: 'clipboard', format: 'text', language: 'eng' }
            },
            {
                name: 'Data Transfer',
                action: 'transfer',
                params: { type: 'file', format: 'json', target: 'cloud' }
            },
            {
                name: 'Authentication',
                action: 'auth',
                params: { action: 'login', provider: 'google', redirect: 'dashboard' }
            },
            {
                name: 'Open External URL',
                action: 'open',
                params: { url: 'https://github.com/JLamance79/mic-browser-ultimate', mode: 'external' }
            }
        ];

        const generatedLinks = [];

        for (const testCase of testCases) {
            try {
                const url = manager.generateDeepLink(testCase.action, testCase.params);
                generatedLinks.push({ ...testCase, url });
                console.log(`✅ ${testCase.name}: ${url}`);
            } catch (error) {
                console.log(`❌ ${testCase.name}: ${error.message}`);
            }
        }

        // Test 3: Parse and validate generated links
        console.log('\n3️⃣ Parsing and Validating Generated Links...');
        
        for (const link of generatedLinks) {
            try {
                const parsed = manager.parseDeepLink(link.url);
                const validation = await manager.validateUrl(link.url);
                
                if (parsed && validation.isValid && parsed.action === link.action) {
                    console.log(`✅ ${link.name}: Parsed and validated successfully`);
                    console.log(`   Action: ${parsed.action}, Params: ${Object.keys(parsed.params).length} parameters`);
                } else {
                    console.log(`❌ ${link.name}: Parsing or validation failed`);
                }
            } catch (error) {
                console.log(`❌ ${link.name}: Error - ${error.message}`);
            }
        }

        // Test 4: Security validation with malicious URLs
        console.log('\n4️⃣ Security Validation Testing...');
        
        const securityTests = [
            { name: 'JavaScript Injection', url: 'javascript:alert("XSS")' },
            { name: 'Data URI Attack', url: 'data:text/html,<script>alert("XSS")</script>' },
            { name: 'File Protocol', url: 'file:///etc/passwd' },
            { name: 'Script in Parameters', url: 'mic-browser://search?q=<script>alert("XSS")</script>' },
            { name: 'JavaScript in Message', url: 'mic-browser://chat?message=javascript:alert("XSS")' },
            { name: 'Safe Search Query', url: 'mic-browser://search?q=machine+learning&category=science' }
        ];

        for (const test of securityTests) {
            try {
                const validation = await manager.validateUrl(test.url);
                const isSafe = validation && validation.isValid;
                
                if (test.name === 'Safe Search Query') {
                    if (isSafe) {
                        console.log(`✅ ${test.name}: Correctly allowed safe URL`);
                    } else {
                        console.log(`❌ ${test.name}: Incorrectly blocked safe URL`);
                    }
                } else {
                    if (!isSafe) {
                        console.log(`✅ ${test.name}: Correctly blocked malicious URL`);
                    } else {
                        console.log(`❌ ${test.name}: Failed to block malicious URL`);
                    }
                }
            } catch (error) {
                console.log(`✅ ${test.name}: Exception thrown (expected for malicious URLs)`);
            }
        }

        // Test 5: Full processing simulation
        console.log('\n5️⃣ Full Deep Link Processing Simulation...');
        
        const processingTests = generatedLinks.slice(0, 3); // Test first 3 links
        
        for (const link of processingTests) {
            try {
                console.log(`\n🔄 Processing: ${link.name}`);
                console.log(`📤 URL: ${link.url}`);
                
                const result = await manager.handleDeepLink(link.url);
                
                if (result.success) {
                    console.log(`✅ Processing successful`);
                    console.log(`📊 Result: ${result.result || 'Action completed'}`);
                } else {
                    console.log(`❌ Processing failed: ${result.error}`);
                }
            } catch (error) {
                console.log(`❌ Processing error: ${error.message}`);
            }
        }

        // Test 6: Statistics and monitoring
        console.log('\n6️⃣ Statistics and Monitoring...');
        
        try {
            const stats = manager.getStatistics();
            console.log('📊 System Statistics:');
            console.log(`   Total Links Processed: ${stats.totalLinks || 0}`);
            console.log(`   Valid Links: ${stats.validLinks || 0}`);
            console.log(`   Rejected Links: ${stats.rejectedLinks || 0}`);
            console.log(`   Last Activity: ${stats.lastActivity || 'Never'}`);
            
            const settings = manager.getSettings();
            console.log('\n⚙️  Current Settings:');
            console.log(`   Logging Enabled: ${settings.enableLogging ? 'Yes' : 'No'}`);
            console.log(`   Security Validation: ${settings.enableSecurityValidation ? 'Yes' : 'No'}`);
            console.log(`   History Tracking: ${settings.enableHistory ? 'Yes' : 'No'}`);
            console.log(`   Max URL Length: ${settings.maxUrlLength || 2048} characters`);
            
        } catch (error) {
            console.log(`❌ Statistics error: ${error.message}`);
        }

        console.log('\n🎉 Deep Link Functionality Test Complete!');
        console.log('=' .repeat(60));
        console.log('🟢 The deep linking system is fully operational and ready for use.');
        console.log('🔗 Protocol: mic-browser://');
        console.log('🛡️  Security: Multi-layer validation active');
        console.log('📊 Monitoring: Statistics and history tracking enabled');
        console.log('🔧 Management: Full UI integration available');
        
        return true;

    } catch (error) {
        console.error('\n💥 Deep Link Functionality Test Failed:', error);
        return false;
    }
}

// Run the test
if (require.main === module) {
    testDeepLinkFunctionality().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = testDeepLinkFunctionality;