/**
 * Field Mapping Algorithms Test Suite
 * Tests the comprehensive field mapping capabilities in CrossTabDataTransfer
 */

class FieldMappingTest {
    constructor() {
        this.testResults = [];
        this.CrossTabDataTransfer = null;
    }

    async runTests() {
        console.log('🔗 Starting Field Mapping Algorithms Test Suite...\n');
        
        try {
            // Load the CrossTabDataTransfer
            const CrossTabDataTransfer = require('./CrossTabDataTransfer.js');
            this.CrossTabDataTransfer = new CrossTabDataTransfer(null, null);
            
            console.log('✅ CrossTabDataTransfer loaded successfully');
            
            // Test 1: Basic Field Mapping
            await this.testBasicFieldMapping();
            
            // Test 2: Exact Name Matching
            await this.testExactNameMatching();
            
            // Test 3: Fuzzy Name Matching
            await this.testFuzzyNameMatching();
            
            // Test 4: Semantic Pattern Matching
            await this.testSemanticPatternMatching();
            
            // Test 5: Type Compatibility
            await this.testTypeCompatibility();
            
            // Test 6: Field Transformations
            await this.testFieldTransformations();
            
            // Test 7: Custom Mapping Rules
            await this.testCustomMappingRules();
            
            // Test 8: Complex Data Structure Mapping
            await this.testComplexDataMapping();
            
            // Test 9: Array Data Mapping
            await this.testArrayDataMapping();
            
            // Test 10: Mapping Confidence Calculation
            await this.testMappingConfidence();
            
            this.printResults();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
            console.error(error.stack);
        }
    }

    async testBasicFieldMapping() {
        console.log('🔗 Testing Basic Field Mapping...');
        
        try {
            const sourceData = {
                userName: 'john_doe',
                emailAddr: 'john@example.com',
                phoneNum: '555-1234',
                userAge: 30
            };
            
            const targetSchema = {
                fields: [
                    { name: 'username', type: 'string' },
                    { name: 'email', type: 'string' },
                    { name: 'phone', type: 'string' },
                    { name: 'age', type: 'number' }
                ]
            };
            
            const result = await this.CrossTabDataTransfer.mapFieldsBetweenTabs(sourceData, targetSchema);
            
            if (result && result.mappedData && result.mappingConfidence > 0) {
                this.addResult('Basic Field Mapping', true, `Mapped with ${result.mappingConfidence} confidence`);
                console.log('   ✅ Mapping successful:', result.mappingConfidence);
                console.log('   📊 Mapped data:', result.mappedData);
            } else {
                this.addResult('Basic Field Mapping', false, 'No mapping result');
            }
            
        } catch (error) {
            this.addResult('Basic Field Mapping', false, error.message);
            console.log('   ❌ Error:', error.message);
        }
    }

    async testExactNameMatching() {
        console.log('🎯 Testing Exact Name Matching...');
        
        try {
            const sourceSchema = {
                fields: [
                    { name: 'email', type: 'string' },
                    { name: 'name', type: 'string' },
                    { name: 'age', type: 'number' }
                ]
            };
            
            const targetSchema = {
                fields: [
                    { name: 'email', type: 'string' },
                    { name: 'name', type: 'string' },
                    { name: 'age', type: 'number' }
                ]
            };
            
            const exactMappings = this.CrossTabDataTransfer.generateExactMapping(sourceSchema, targetSchema);
            
            if (exactMappings.length === 3 && exactMappings.every(m => m.confidence === 1.0)) {
                this.addResult('Exact Name Matching', true, `Found ${exactMappings.length} exact matches`);
                console.log('   ✅ Exact matches:', exactMappings.length);
            } else {
                this.addResult('Exact Name Matching', false, `Expected 3 exact matches, got ${exactMappings.length}`);
            }
            
        } catch (error) {
            this.addResult('Exact Name Matching', false, error.message);
            console.log('   ❌ Error:', error.message);
        }
    }

    async testFuzzyNameMatching() {
        console.log('🔍 Testing Fuzzy Name Matching...');
        
        try {
            const sourceSchema = {
                fields: [
                    { name: 'firstName', type: 'string' },
                    { name: 'lastName', type: 'string' },
                    { name: 'emailAddress', type: 'string' }
                ]
            };
            
            const targetSchema = {
                fields: [
                    { name: 'first_name', type: 'string' },
                    { name: 'last_name', type: 'string' },
                    { name: 'email_addr', type: 'string' }
                ]
            };
            
            const fuzzyMappings = this.CrossTabDataTransfer.generateFuzzyMapping(sourceSchema, targetSchema, []);
            
            if (fuzzyMappings.length > 0) {
                this.addResult('Fuzzy Name Matching', true, `Found ${fuzzyMappings.length} fuzzy matches`);
                console.log('   ✅ Fuzzy matches:', fuzzyMappings.length);
                fuzzyMappings.forEach(mapping => {
                    console.log(`     - ${mapping.source} → ${mapping.target} (${mapping.confidence})`);
                });
            } else {
                this.addResult('Fuzzy Name Matching', false, 'No fuzzy matches found');
            }
            
        } catch (error) {
            this.addResult('Fuzzy Name Matching', false, error.message);
            console.log('   ❌ Error:', error.message);
        }
    }

    async testSemanticPatternMatching() {
        console.log('🧠 Testing Semantic Pattern Matching...');
        
        try {
            const sourceSchema = {
                fields: [
                    { name: 'userEmail', type: 'string' },
                    { name: 'userPhone', type: 'string' },
                    { name: 'userAddress', type: 'string' }
                ]
            };
            
            const targetSchema = {
                fields: [
                    { name: 'email_field', type: 'string' },
                    { name: 'phone_number', type: 'string' },
                    { name: 'street_address', type: 'string' }
                ]
            };
            
            const semanticMappings = this.CrossTabDataTransfer.generateSemanticMapping(sourceSchema, targetSchema, []);
            
            if (semanticMappings.length > 0) {
                this.addResult('Semantic Pattern Matching', true, `Found ${semanticMappings.length} semantic matches`);
                console.log('   ✅ Semantic matches:', semanticMappings.length);
                semanticMappings.forEach(mapping => {
                    console.log(`     - ${mapping.source} → ${mapping.target} (${mapping.pattern})`);
                });
            } else {
                this.addResult('Semantic Pattern Matching', false, 'No semantic matches found');
            }
            
        } catch (error) {
            this.addResult('Semantic Pattern Matching', false, error.message);
            console.log('   ❌ Error:', error.message);
        }
    }

    async testTypeCompatibility() {
        console.log('🔄 Testing Type Compatibility...');
        
        try {
            const testCases = [
                { type1: 'string', type2: 'string', expected: 1.0 },
                { type1: 'string', type2: 'text', expected: 0.7 },
                { type1: 'number', type2: 'integer', expected: 0.7 },
                { type1: 'string', type2: 'number', expected: 0.1 }
            ];
            
            let passedTests = 0;
            testCases.forEach(testCase => {
                const compatibility = this.CrossTabDataTransfer.calculateTypeCompatibility(testCase.type1, testCase.type2);
                if (compatibility === testCase.expected) {
                    passedTests++;
                }
                console.log(`     - ${testCase.type1} → ${testCase.type2}: ${compatibility}`);
            });
            
            if (passedTests === testCases.length) {
                this.addResult('Type Compatibility', true, `All ${testCases.length} compatibility tests passed`);
                console.log('   ✅ Type compatibility tests passed');
            } else {
                this.addResult('Type Compatibility', false, `${passedTests}/${testCases.length} tests passed`);
            }
            
        } catch (error) {
            this.addResult('Type Compatibility', false, error.message);
            console.log('   ❌ Error:', error.message);
        }
    }

    async testFieldTransformations() {
        console.log('🔧 Testing Field Transformations...');
        
        try {
            const testCases = [
                { value: '123', transformation: 'parseNumber', expected: 123 },
                { value: 123, transformation: 'toString', expected: '123' },
                { value: 'true', transformation: 'parseBoolean', expected: true },
                { value: true, transformation: 'booleanToString', expected: 'true' }
            ];
            
            let passedTests = 0;
            testCases.forEach(testCase => {
                const result = this.CrossTabDataTransfer.applyFieldTransformation(testCase.value, testCase.transformation);
                if (result === testCase.expected) {
                    passedTests++;
                }
                console.log(`     - ${testCase.transformation}: ${testCase.value} → ${result}`);
            });
            
            if (passedTests === testCases.length) {
                this.addResult('Field Transformations', true, `All ${testCases.length} transformation tests passed`);
                console.log('   ✅ Field transformation tests passed');
            } else {
                this.addResult('Field Transformations', false, `${passedTests}/${testCases.length} tests passed`);
            }
            
        } catch (error) {
            this.addResult('Field Transformations', false, error.message);
            console.log('   ❌ Error:', error.message);
        }
    }

    async testCustomMappingRules() {
        console.log('⚙️ Testing Custom Mapping Rules...');
        
        try {
            const sourceSchema = {
                fields: [
                    { name: 'legacy_id', type: 'string' },
                    { name: 'old_status', type: 'string' }
                ]
            };
            
            const targetSchema = {
                fields: [
                    { name: 'new_identifier', type: 'string' },
                    { name: 'current_status', type: 'string' }
                ]
            };
            
            const customMappings = [
                { source: 'legacy_id', target: 'new_identifier', confidence: 1.0 },
                { source: 'old_status', target: 'current_status', confidence: 0.9 }
            ];
            
            const mappings = this.CrossTabDataTransfer.applyCustomMappings(sourceSchema, targetSchema, customMappings);
            
            if (mappings.length === 2) {
                this.addResult('Custom Mapping Rules', true, `Applied ${mappings.length} custom mappings`);
                console.log('   ✅ Custom mappings applied:', mappings.length);
            } else {
                this.addResult('Custom Mapping Rules', false, `Expected 2 mappings, got ${mappings.length}`);
            }
            
        } catch (error) {
            this.addResult('Custom Mapping Rules', false, error.message);
            console.log('   ❌ Error:', error.message);
        }
    }

    async testComplexDataMapping() {
        console.log('🏗️ Testing Complex Data Structure Mapping...');
        
        try {
            const complexData = {
                user: {
                    personalInfo: {
                        firstName: 'John',
                        lastName: 'Doe',
                        email: 'john@example.com'
                    },
                    preferences: {
                        theme: 'dark',
                        language: 'en'
                    }
                },
                metadata: {
                    createdAt: '2024-01-01',
                    version: '1.0'
                }
            };
            
            const flattenedData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                theme: 'dark',
                language: 'en',
                createdAt: '2024-01-01',
                version: '1.0'
            };
            
            const targetSchema = {
                fields: [
                    { name: 'first_name', type: 'string' },
                    { name: 'last_name', type: 'string' },
                    { name: 'email_address', type: 'string' },
                    { name: 'ui_theme', type: 'string' },
                    { name: 'locale', type: 'string' }
                ]
            };
            
            const result = await this.CrossTabDataTransfer.mapFieldsBetweenTabs(flattenedData, targetSchema);
            
            if (result && result.mappedData) {
                this.addResult('Complex Data Mapping', true, `Complex mapping successful`);
                console.log('   ✅ Complex data mapped successfully');
                console.log('   📊 Mapped fields:', Object.keys(result.mappedData).length);
            } else {
                this.addResult('Complex Data Mapping', false, 'Complex mapping failed');
            }
            
        } catch (error) {
            this.addResult('Complex Data Mapping', false, error.message);
            console.log('   ❌ Error:', error.message);
        }
    }

    async testArrayDataMapping() {
        console.log('📋 Testing Array Data Mapping...');
        
        try {
            const arrayData = [
                { name: 'John', email: 'john@example.com', age: 30 },
                { name: 'Jane', email: 'jane@example.com', age: 25 },
                { name: 'Bob', email: 'bob@example.com', age: 35 }
            ];
            
            const targetSchema = {
                fields: [
                    { name: 'full_name', type: 'string' },
                    { name: 'email_addr', type: 'string' },
                    { name: 'user_age', type: 'number' }
                ]
            };
            
            const result = await this.CrossTabDataTransfer.mapFieldsBetweenTabs(arrayData, targetSchema);
            
            if (result && Array.isArray(result.mappedData) && result.mappedData.length === 3) {
                this.addResult('Array Data Mapping', true, `Mapped ${result.mappedData.length} array items`);
                console.log('   ✅ Array data mapped successfully');
                console.log('   📊 Array items:', result.mappedData.length);
            } else {
                this.addResult('Array Data Mapping', false, 'Array mapping failed');
            }
            
        } catch (error) {
            this.addResult('Array Data Mapping', false, error.message);
            console.log('   ❌ Error:', error.message);
        }
    }

    async testMappingConfidence() {
        console.log('📊 Testing Mapping Confidence Calculation...');
        
        try {
            const mappings = [
                { source: 'name', target: 'full_name', confidence: 1.0, method: 'exact' },
                { source: 'email', target: 'email_addr', confidence: 0.8, method: 'fuzzy' },
                { source: 'age', target: 'user_age', confidence: 0.9, method: 'semantic' }
            ];
            
            const sourceSchema = {
                fields: [
                    { name: 'name', type: 'string' },
                    { name: 'email', type: 'string' },
                    { name: 'age', type: 'number' },
                    { name: 'phone', type: 'string' } // unmapped
                ]
            };
            
            const targetSchema = {
                fields: [
                    { name: 'full_name', type: 'string' },
                    { name: 'email_addr', type: 'string' },
                    { name: 'user_age', type: 'number' }
                ]
            };
            
            const confidence = this.CrossTabDataTransfer.calculateMappingConfidence(mappings, sourceSchema, targetSchema);
            
            if (confidence > 0 && confidence <= 1) {
                this.addResult('Mapping Confidence', true, `Confidence calculated: ${confidence}`);
                console.log('   ✅ Mapping confidence:', confidence);
            } else {
                this.addResult('Mapping Confidence', false, `Invalid confidence: ${confidence}`);
            }
            
        } catch (error) {
            this.addResult('Mapping Confidence', false, error.message);
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
        console.log('\n📊 Field Mapping Algorithms Test Results:');
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
            console.log('🎉 ALL FIELD MAPPING TESTS PASSED! System is fully functional!');
        } else {
            console.log('⚠️  Some field mapping tests failed. Check implementation.');
        }
    }
}

// Run the tests
const tester = new FieldMappingTest();
tester.runTests().then(() => {
    console.log('\n✅ Field Mapping Algorithms test completed!');
    process.exit(0);
}).catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
});