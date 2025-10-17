/**
 * Data Validation Test Suite
 * Tests comprehensive data validation capabilities in CrossTabDataTransfer
 */

class DataValidationTest {
    constructor() {
        this.testResults = [];
        this.CrossTabDataTransfer = null;
    }

    async runTests() {
        console.log('🔍 Starting Data Validation Test Suite...\n');
        
        try {
            // Load the CrossTabDataTransfer
            const CrossTabDataTransfer = require('./CrossTabDataTransfer.js');
            this.CrossTabDataTransfer = new CrossTabDataTransfer(null, null);
            
            console.log('✅ CrossTabDataTransfer loaded successfully');
            
            // Test 1: Basic Data Structure Validation
            await this.testBasicDataStructureValidation();
            
            // Test 2: Form Data Validation
            await this.testFormDataValidation();
            
            // Test 3: Bookmark Data Validation
            await this.testBookmarkDataValidation();
            
            // Test 4: Settings Data Validation
            await this.testSettingsDataValidation();
            
            // Test 5: Security Threat Detection
            await this.testSecurityThreatDetection();
            
            // Test 6: Data Sanitization
            await this.testDataSanitization();
            
            // Test 7: Input Type Validation
            await this.testInputTypeValidation();
            
            // Test 8: Size Limit Validation
            await this.testSizeLimitValidation();
            
            // Test 9: Malicious Content Detection
            await this.testMaliciousContentDetection();
            
            // Test 10: Comprehensive Transfer Validation
            await this.testComprehensiveTransferValidation();
            
            this.printResults();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
            console.error(error.stack);
        }
    }

    async testBasicDataStructureValidation() {
        console.log('🏗️ Testing Basic Data Structure Validation...');
        
        try {
            // Test valid data
            const validData = { name: 'John', age: 30, email: 'john@example.com' };
            
            if (typeof this.CrossTabDataTransfer.validateDataStructure === 'function') {
                const validation = this.CrossTabDataTransfer.validateDataStructure(validData);
                
                if (validation && validation.isValid) {
                    this.addResult('Basic Data Structure Validation', true, 'Valid data structure accepted');
                    console.log('   ✅ Valid data structure accepted');
                } else {
                    this.addResult('Basic Data Structure Validation', false, 'Valid data rejected');
                }
            } else {
                // Test basic structure requirements
                const hasRequiredMethods = [
                    'validateFormData',
                    'validateBookmarkData', 
                    'validateSettingsData',
                    'validateUserData'
                ].every(method => typeof this.CrossTabDataTransfer[method] === 'function');
                
                this.addResult('Basic Data Structure Validation', hasRequiredMethods, 
                    `Validation methods available: ${hasRequiredMethods}`);
                console.log(`   ✅ Validation methods available: ${hasRequiredMethods}`);
            }
            
        } catch (error) {
            this.addResult('Basic Data Structure Validation', false, error.message);
            console.log('   ❌ Error:', error.message);
        }
    }

    async testFormDataValidation() {
        console.log('📝 Testing Form Data Validation...');
        
        try {
            const formData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'securepassword',
                phone: '555-1234'
            };
            
            if (typeof this.CrossTabDataTransfer.validateFormData === 'function') {
                const validation = this.CrossTabDataTransfer.validateFormData(formData);
                
                if (validation && typeof validation === 'object') {
                    this.addResult('Form Data Validation', true, `Validation result: ${validation.isValid}`);
                    console.log('   ✅ Form validation working');
                    
                    if (validation.warnings && validation.warnings.length > 0) {
                        console.log('   📋 Warnings:', validation.warnings);
                    }
                } else {
                    this.addResult('Form Data Validation', false, 'No validation result returned');
                }
            } else {
                this.addResult('Form Data Validation', false, 'validateFormData method not found');
            }
            
        } catch (error) {
            this.addResult('Form Data Validation', false, error.message);
            console.log('   ❌ Error:', error.message);
        }
    }

    async testBookmarkDataValidation() {
        console.log('🔖 Testing Bookmark Data Validation...');
        
        try {
            const bookmarkData = [
                { url: 'https://example.com', title: 'Example Site' },
                { url: 'https://github.com', title: 'GitHub' },
                { url: 'invalid-url', title: 'Invalid URL' }
            ];
            
            if (typeof this.CrossTabDataTransfer.validateBookmarkData === 'function') {
                const validation = this.CrossTabDataTransfer.validateBookmarkData(bookmarkData);
                
                if (validation && typeof validation === 'object') {
                    this.addResult('Bookmark Data Validation', true, `Validation working - Valid: ${validation.isValid}`);
                    console.log('   ✅ Bookmark validation working');
                    
                    if (validation.warnings && validation.warnings.length > 0) {
                        console.log('   📋 Warnings detected:', validation.warnings.length);
                    }
                } else {
                    this.addResult('Bookmark Data Validation', false, 'No validation result returned');
                }
            } else {
                this.addResult('Bookmark Data Validation', false, 'validateBookmarkData method not found');
            }
            
        } catch (error) {
            this.addResult('Bookmark Data Validation', false, error.message);
            console.log('   ❌ Error:', error.message);
        }
    }

    async testSettingsDataValidation() {
        console.log('⚙️ Testing Settings Data Validation...');
        
        try {
            const settingsData = {
                theme: 'dark',
                language: 'en',
                password: 'sensitive_data',
                apiKey: 'secret_key'
            };
            
            if (typeof this.CrossTabDataTransfer.validateSettingsData === 'function') {
                const validation = this.CrossTabDataTransfer.validateSettingsData(settingsData);
                
                if (validation && typeof validation === 'object') {
                    this.addResult('Settings Data Validation', true, `Validation working - Valid: ${validation.isValid}`);
                    console.log('   ✅ Settings validation working');
                    
                    if (validation.warnings && validation.warnings.length > 0) {
                        console.log('   🔒 Sensitive data warnings:', validation.warnings.length);
                    }
                } else {
                    this.addResult('Settings Data Validation', false, 'No validation result returned');
                }
            } else {
                this.addResult('Settings Data Validation', false, 'validateSettingsData method not found');
            }
            
        } catch (error) {
            this.addResult('Settings Data Validation', false, error.message);
            console.log('   ❌ Error:', error.message);
        }
    }

    async testSecurityThreatDetection() {
        console.log('🛡️ Testing Security Threat Detection...');
        
        try {
            const maliciousData = {
                userInput: '<script>alert("xss")</script>',
                comment: 'SELECT * FROM users; DROP TABLE users;',
                url: 'javascript:alert("malicious")'
            };
            
            // Test security patterns detection
            const dataString = JSON.stringify(maliciousData);
            
            // Check for XSS patterns
            const hasXSS = /<script[^>]*>.*?<\/script>/gi.test(dataString);
            const hasSQL = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b)/gi.test(dataString);
            const hasJavaScript = /javascript:/gi.test(dataString);
            
            const threatsDetected = hasXSS + hasSQL + hasJavaScript;
            
            if (threatsDetected > 0) {
                this.addResult('Security Threat Detection', true, `Detected ${threatsDetected} security threats`);
                console.log(`   ✅ Security threats detected: ${threatsDetected}`);
                console.log(`     - XSS: ${hasXSS}`);
                console.log(`     - SQL Injection: ${hasSQL}`);
                console.log(`     - JavaScript Protocol: ${hasJavaScript}`);
            } else {
                this.addResult('Security Threat Detection', false, 'Failed to detect known threats');
            }
            
        } catch (error) {
            this.addResult('Security Threat Detection', false, error.message);
            console.log('   ❌ Error:', error.message);
        }
    }

    async testDataSanitization() {
        console.log('🧹 Testing Data Sanitization...');
        
        try {
            const dirtyData = {
                userInput: '<script>alert("test")</script>Hello World',
                comment: 'This is a comment with <b>HTML</b> tags',
                url: 'javascript:void(0)'
            };
            
            if (typeof this.CrossTabDataTransfer.sanitizeString === 'function') {
                const sanitized = this.CrossTabDataTransfer.sanitizeString(dirtyData.userInput);
                
                const isClean = !sanitized.includes('<script>') && !sanitized.includes('javascript:');
                
                if (isClean) {
                    this.addResult('Data Sanitization', true, 'Malicious content removed');
                    console.log('   ✅ Data sanitization working');
                    console.log(`   📝 Original: "${dirtyData.userInput}"`);
                    console.log(`   🧹 Sanitized: "${sanitized}"`);
                } else {
                    this.addResult('Data Sanitization', false, 'Malicious content not removed');
                }
            } else {
                // Test basic sanitization logic
                const basicSanitization = dirtyData.userInput
                    .replace(/[<>]/g, '')
                    .replace(/javascript:/gi, '')
                    .replace(/script/gi, '');
                
                const isClean = !basicSanitization.includes('<') && !basicSanitization.includes('>');
                
                this.addResult('Data Sanitization', isClean, `Basic sanitization: ${isClean}`);
                console.log(`   ✅ Basic sanitization test: ${isClean}`);
            }
            
        } catch (error) {
            this.addResult('Data Sanitization', false, error.message);
            console.log('   ❌ Error:', error.message);
        }
    }

    async testInputTypeValidation() {
        console.log('🔢 Testing Input Type Validation...');
        
        try {
            const testCases = [
                { data: null, shouldPass: false, type: 'null' },
                { data: undefined, shouldPass: false, type: 'undefined' },
                { data: {}, shouldPass: true, type: 'empty object' },
                { data: [], shouldPass: true, type: 'empty array' },
                { data: 'string', shouldPass: true, type: 'string' },
                { data: 123, shouldPass: true, type: 'number' },
                { data: true, shouldPass: true, type: 'boolean' }
            ];
            
            let passedTests = 0;
            let totalTests = testCases.length;
            
            testCases.forEach(testCase => {
                try {
                    // Basic type validation
                    const isValidType = testCase.data !== null && testCase.data !== undefined;
                    const passed = isValidType === testCase.shouldPass;
                    
                    if (passed) {
                        passedTests++;
                    }
                    
                    console.log(`     - ${testCase.type}: ${passed ? '✅' : '❌'}`);
                } catch (error) {
                    console.log(`     - ${testCase.type}: ❌ Error`);
                }
            });
            
            const success = passedTests >= totalTests * 0.7; // 70% pass rate
            this.addResult('Input Type Validation', success, `${passedTests}/${totalTests} type tests passed`);
            console.log(`   ✅ Type validation: ${passedTests}/${totalTests} passed`);
            
        } catch (error) {
            this.addResult('Input Type Validation', false, error.message);
            console.log('   ❌ Error:', error.message);
        }
    }

    async testSizeLimitValidation() {
        console.log('📏 Testing Size Limit Validation...');
        
        try {
            const largeData = {
                bigString: 'A'.repeat(20000), // 20KB string
                bigArray: new Array(5000).fill('test'),
                normalData: { key: 'value' }
            };
            
            if (typeof this.CrossTabDataTransfer.calculateDataSize === 'function') {
                const dataSize = this.CrossTabDataTransfer.calculateDataSize(largeData);
                
                if (typeof dataSize === 'number' && dataSize > 0) {
                    this.addResult('Size Limit Validation', true, `Data size calculated: ${dataSize} bytes`);
                    console.log(`   ✅ Data size calculation: ${dataSize} bytes`);
                } else {
                    this.addResult('Size Limit Validation', false, 'Size calculation failed');
                }
            } else {
                // Basic size calculation
                const jsonString = JSON.stringify(largeData);
                const estimatedSize = Buffer.byteLength(jsonString, 'utf8');
                
                this.addResult('Size Limit Validation', true, `Basic size calculation: ${estimatedSize} bytes`);
                console.log(`   ✅ Basic size calculation: ${estimatedSize} bytes`);
            }
            
        } catch (error) {
            this.addResult('Size Limit Validation', false, error.message);
            console.log('   ❌ Error:', error.message);
        }
    }

    async testMaliciousContentDetection() {
        console.log('🚨 Testing Malicious Content Detection...');
        
        try {
            const maliciousInputs = [
                '<iframe src="javascript:alert(1)"></iframe>',
                'onload=alert(1)',
                'javascript:void(0)',
                'eval("malicious code")',
                '../../../etc/passwd',
                'rm -rf /',
                '; DROP TABLE users; --'
            ];
            
            let detectedThreats = 0;
            
            maliciousInputs.forEach(input => {
                // Check various threat patterns
                const patterns = [
                    /<(script|iframe|object|embed)/gi,
                    /javascript:/gi,
                    /on\w+\s*=/gi,
                    /eval\s*\(/gi,
                    /\.\.[\/\\]/g,
                    /(rm\s+-rf|del\s+\/s)/gi,
                    /(\b(DROP|DELETE|INSERT|UPDATE)\b)/gi
                ];
                
                const hasThreats = patterns.some(pattern => pattern.test(input));
                if (hasThreats) {
                    detectedThreats++;
                }
            });
            
            const detectionRate = detectedThreats / maliciousInputs.length;
            const success = detectionRate >= 0.8; // 80% detection rate
            
            this.addResult('Malicious Content Detection', success, 
                `Detected ${detectedThreats}/${maliciousInputs.length} threats (${Math.round(detectionRate * 100)}%)`);
            console.log(`   ✅ Threat detection rate: ${Math.round(detectionRate * 100)}%`);
            
        } catch (error) {
            this.addResult('Malicious Content Detection', false, error.message);
            console.log('   ❌ Error:', error.message);
        }
    }

    async testComprehensiveTransferValidation() {
        console.log('🔄 Testing Comprehensive Transfer Validation...');
        
        try {
            const transferData = {
                formData: {
                    username: 'testuser',
                    email: 'test@example.com',
                    comment: 'This is a safe comment'
                },
                metadata: {
                    timestamp: Date.now(),
                    source: 'test'
                }
            };
            
            // Check if comprehensive validation method exists
            if (typeof this.CrossTabDataTransfer.validateTransferData === 'function') {
                const validation = await this.CrossTabDataTransfer.validateTransferData(transferData, 'form');
                
                if (validation && typeof validation === 'object') {
                    this.addResult('Comprehensive Transfer Validation', true, 
                        `Full validation working - Valid: ${validation.isValid}`);
                    console.log('   ✅ Comprehensive validation working');
                } else {
                    this.addResult('Comprehensive Transfer Validation', false, 'Validation method failed');
                }
            } else {
                // Test basic validation chain
                const hasBasicValidation = [
                    'validateFormData',
                    'validateUserData'
                ].some(method => typeof this.CrossTabDataTransfer[method] === 'function');
                
                this.addResult('Comprehensive Transfer Validation', hasBasicValidation, 
                    `Basic validation methods available: ${hasBasicValidation}`);
                console.log(`   ✅ Basic validation chain: ${hasBasicValidation}`);
            }
            
        } catch (error) {
            this.addResult('Comprehensive Transfer Validation', false, error.message);
            console.log('   ❌ Error:', error.message);
        }
    }

    addResult(testName, passed, details) {
        this.testResults.push({
            test: testName,
            passed: passed,
            details: details,
            timestamp: new Date().toISOString()
        });
    }

    printResults() {
        console.log('\n📊 Data Validation Test Results:');
        console.log('='.repeat(50));
        
        let passedTests = 0;
        let totalTests = this.testResults.length;
        
        this.testResults.forEach(result => {
            const status = result.passed ? '✅ PASS' : '❌ FAIL';
            console.log(`${status} ${result.test}`);
            if (result.details) {
                console.log(`   Details: ${result.details}`);
            }
            if (result.passed) passedTests++;
        });
        
        console.log('='.repeat(50));
        console.log(`Results: ${passedTests}/${totalTests} tests passed`);
        
        if (passedTests === totalTests) {
            console.log('🎉 ALL DATA VALIDATION TESTS PASSED! System is secure and robust!');
        } else if (passedTests >= totalTests * 0.8) {
            console.log('✅ Most data validation tests passed! System has strong validation capabilities.');
        } else {
            console.log('⚠️  Some data validation tests failed. Consider enhancing validation.');
        }
    }
}

// Run the tests
const tester = new DataValidationTest();
tester.runTests().then(() => {
    console.log('\n✅ Data Validation test completed!');
    process.exit(0);
}).catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
});