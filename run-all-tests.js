/**
 * Comprehensive Test Runner and Summary for MIC Browser Ultimate
 * Runs all available Node.js compatible tests and provides a consolidated report
 */

const { spawn } = require('child_process');
const path = require('path');

class TestRunner {
    constructor() {
        this.testResults = new Map();
        this.testConfigs = [
            {
                name: 'Security Tests',
                file: 'test-security.js',
                critical: true,
                description: 'Comprehensive security component testing'
            },
            {
                name: 'Chat Integration Tests',
                file: 'test-chat-integration.js',
                critical: false,
                description: 'Chat system functionality verification'
            },
            {
                name: 'Learning System Tests',
                file: 'test-learning-system.js',
                critical: false,
                description: 'Machine learning and adaptive UI testing'
            },
            {
                name: 'Implementation Tests',
                file: 'test-implementations.js',
                critical: true,
                description: 'Core implementation and memory management'
            }
        ];
    }

    async runAllTests() {
        console.log('🧪 Starting Comprehensive Test Suite for MIC Browser Ultimate');
        console.log('='.repeat(80));
        
        for (const testConfig of this.testConfigs) {
            console.log(`\n🔄 Running ${testConfig.name}...`);
            const result = await this.runSingleTest(testConfig);
            this.testResults.set(testConfig.name, result);
            
            if (result.success) {
                console.log(`✅ ${testConfig.name} completed successfully`);
            } else {
                console.log(`❌ ${testConfig.name} failed`);
            }
        }
        
        this.generateComprehensiveReport();
    }

    async runSingleTest(testConfig) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const testProcess = spawn('node', [testConfig.file], {
                cwd: process.cwd(),
                stdio: 'pipe'
            });

            let stdout = '';
            let stderr = '';

            testProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            testProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            testProcess.on('close', (code) => {
                const endTime = Date.now();
                const duration = endTime - startTime;
                
                resolve({
                    success: code === 0,
                    exitCode: code,
                    duration,
                    stdout,
                    stderr,
                    config: testConfig
                });
            });

            // Timeout after 2 minutes
            setTimeout(() => {
                testProcess.kill('SIGKILL');
                resolve({
                    success: false,
                    exitCode: -1,
                    duration: 120000,
                    stdout,
                    stderr: stderr + '\\nTest timed out after 2 minutes',
                    config: testConfig
                });
            }, 120000);
        });
    }

    parseTestResults(stdout, testName) {
        const results = {
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            successRate: 0,
            details: []
        };

        try {
            // Parse security test results
            if (testName.includes('Security')) {
                const passedMatch = stdout.match(/Passed: (\d+)/);
                const failedMatch = stdout.match(/Failed: (\d+)/);
                const successRateMatch = stdout.match(/Success Rate: ([\d.]+)%/);
                
                if (passedMatch && failedMatch) {
                    results.passedTests = parseInt(passedMatch[1]);
                    results.failedTests = parseInt(failedMatch[1]);
                    results.totalTests = results.passedTests + results.failedTests;
                }
                
                if (successRateMatch) {
                    results.successRate = parseFloat(successRateMatch[1]);
                }
            }
            
            // Parse learning system results
            else if (testName.includes('Learning')) {
                const overallMatch = stdout.match(/Overall Results: (\d+)\/(\d+) tests passed \(([\d.]+)%\)/);
                
                if (overallMatch) {
                    results.passedTests = parseInt(overallMatch[1]);
                    results.totalTests = parseInt(overallMatch[2]);
                    results.failedTests = results.totalTests - results.passedTests;
                    results.successRate = parseFloat(overallMatch[3]);
                }
            }
            
            // Parse chat integration results (simple format)
            else if (testName.includes('Chat')) {
                if (stdout.includes('fully integrated and ready to use')) {
                    results.totalTests = 1;
                    results.passedTests = 1;
                    results.failedTests = 0;
                    results.successRate = 100;
                }
            }
            
            // Parse implementation results
            else if (testName.includes('Implementation')) {
                if (stdout.includes('All implementations have been successfully added')) {
                    results.totalTests = 1;
                    results.passedTests = 1;
                    results.failedTests = 0;
                    results.successRate = 100;
                }
            }
        } catch (error) {
            console.warn(`Warning: Could not parse results for ${testName}:`, error.message);
        }

        return results;
    }

    generateComprehensiveReport() {
        console.log('\\n' + '='.repeat(80));
        console.log('📊 COMPREHENSIVE TEST SUITE REPORT');
        console.log('='.repeat(80));
        
        let overallSuccess = true;
        let criticalFailures = 0;
        let totalDuration = 0;
        
        console.log('\\n📋 Test Suite Results:');
        console.log('-'.repeat(80));
        
        for (const [testName, result] of this.testResults) {
            const parsed = this.parseTestResults(result.stdout, testName);
            totalDuration += result.duration;
            
            const status = result.success ? '✅ PASS' : '❌ FAIL';
            const duration = `${Math.round(result.duration / 1000)}s`;
            const critical = result.config.critical ? '🔥 CRITICAL' : '⚪ NORMAL';
            
            console.log(`${status} ${testName.padEnd(25)} ${duration.padStart(6)} ${critical}`);
            
            if (parsed.totalTests > 0) {
                console.log(`     └─ ${parsed.passedTests}/${parsed.totalTests} tests passed (${parsed.successRate.toFixed(1)}%)`);
            }
            
            if (!result.success) {
                overallSuccess = false;
                if (result.config.critical) {
                    criticalFailures++;
                }
            }
        }
        
        console.log('\\n📊 Overall Statistics:');
        console.log('-'.repeat(80));
        console.log(`⏱️  Total Execution Time: ${Math.round(totalDuration / 1000)}s`);
        console.log(`🔥 Critical Failures: ${criticalFailures}`);
        console.log(`📈 Test Suites Status: ${overallSuccess ? '✅ ALL PASS' : '❌ SOME FAILURES'}`);
        
        // Component Status Summary
        console.log('\\n🔧 Component Status Summary:');
        console.log('-'.repeat(80));
        
        const componentStatus = {
            '🔐 Security System': this.getComponentStatus('Security'),
            '💬 Chat System': this.getComponentStatus('Chat'),
            '🧠 Learning System': this.getComponentStatus('Learning'),
            '⚙️ Core Implementation': this.getComponentStatus('Implementation')
        };
        
        for (const [component, status] of Object.entries(componentStatus)) {
            console.log(`${status.icon} ${component.padEnd(25)} ${status.description}`);
        }
        
        // Recommendations
        console.log('\\n💡 Recommendations:');
        console.log('-'.repeat(80));
        
        if (criticalFailures > 0) {
            console.log('🚨 URGENT: Address critical system failures before deployment');
        }
        
        const securityResult = this.testResults.get('Security Tests');
        if (securityResult) {
            const securityParsed = this.parseTestResults(securityResult.stdout, 'Security Tests');
            if (securityParsed.successRate >= 90) {
                console.log('✅ Security system is production-ready');
            } else {
                console.log('⚠️  Security system needs attention before production use');
            }
        }
        
        console.log('📝 Browser-specific tests require Electron environment to run');
        console.log('🔧 Learning system improvements are ongoing - functional but not optimal');
        
        console.log('\\n' + '='.repeat(80));
        console.log('🎉 TEST SUITE EXECUTION COMPLETE');
        console.log('='.repeat(80));
    }

    getComponentStatus(testType) {
        const result = this.testResults.get(`${testType} Tests`);
        if (!result) {
            return { icon: '⚪', description: 'Not tested' };
        }
        
        const parsed = this.parseTestResults(result.stdout, testType);
        
        if (result.success && parsed.successRate >= 95) {
            return { icon: '🟢', description: 'Excellent - Production Ready' };
        } else if (result.success && parsed.successRate >= 80) {
            return { icon: '🟡', description: 'Good - Minor Issues' };
        } else if (result.success) {
            return { icon: '🟠', description: 'Functional - Needs Improvement' };
        } else {
            return { icon: '🔴', description: 'Critical Issues - Needs Attention' };
        }
    }
}

// Run tests if called directly
if (require.main === module) {
    const runner = new TestRunner();
    runner.runAllTests().catch(console.error);
}

module.exports = TestRunner;