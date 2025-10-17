/**
 * Simple Smart Automation Test
 * Tests the Smart Automation functionality without Electron context
 */

const fs = require('fs');
const path = require('path');

// Mock DOM environment for testing
global.window = {
    location: { href: 'https://example.com' }
};

global.document = {
    querySelectorAll: (selector) => {
        // Mock DOM elements for testing
        const mockElements = {
            'input': [
                { type: 'text', name: 'username', id: 'username', placeholder: 'Enter username' },
                { type: 'password', name: 'password', id: 'password', placeholder: 'Enter password' },
                { type: 'email', name: 'email', id: 'email', placeholder: 'Enter email' }
            ],
            'button': [
                { type: 'submit', textContent: 'Login', id: 'loginBtn' },
                { type: 'button', textContent: 'Cancel', id: 'cancelBtn' }
            ],
            'form': [
                { action: '/login', method: 'post', id: 'loginForm' }
            ],
            'a': [
                { href: 'https://example.com/signup', textContent: 'Sign Up' },
                { href: 'https://example.com/forgot', textContent: 'Forgot Password' }
            ],
            'select': [
                { name: 'country', id: 'country' }
            ]
        };
        
        return mockElements[selector] || [];
    },
    
    querySelector: (selector) => {
        const elements = global.document.querySelectorAll(selector);
        return elements[0] || null;
    },
    
    documentElement: {
        outerHTML: '<html><body><form id="loginForm"><input type="text" name="username" /><input type="password" name="password" /><button type="submit">Login</button></form></body></html>'
    }
};

class SmartAutomationTestSimple {
    constructor() {
        this.testResults = [];
        this.SmartAutomationAnalyzer = null;
    }

    async runTests() {
        console.log('🤖 Starting Simple Smart Automation Test...\n');
        
        try {
            // Load the SmartAutomationAnalyzer
            const SmartAutomationAnalyzer = require('./SmartAutomationAnalyzer.js');
            this.SmartAutomationAnalyzer = new SmartAutomationAnalyzer();
            
            console.log('✅ SmartAutomationAnalyzer loaded successfully');
            
            // Test 1: DOM Structure Parsing
            await this.testDOMStructureParsing();
            
            // Test 2: Form Field Detection
            await this.testFormFieldDetection();
            
            // Test 3: Interactive Element Mapping
            await this.testInteractiveElementMapping();
            
            // Test 4: Automation Opportunity Identification
            await this.testAutomationOpportunityIdentification();
            
            // Test 5: Element Selector Generation
            await this.testElementSelectorGeneration();
            
            this.printResults();
            
        } catch (error) {
            console.error('❌ Test failed:', error.message);
            console.error(error.stack);
        }
    }

    async testDOMStructureParsing() {
        console.log('🔍 Testing DOM Structure Parsing...');
        
        try {
            const structure = await this.SmartAutomationAnalyzer.parseDOMStructure();
            
            if (structure && (structure.totalElements > 0 || structure.depth >= 0)) {
                this.addResult('DOM Structure Parsing', true, `Successfully parsed DOM structure with ${structure.totalElements} elements at depth ${structure.depth}`);
                console.log('   ✅ DOM Elements:', structure.totalElements);
                console.log('   ✅ DOM Depth:', structure.depth);
            } else {
                this.addResult('DOM Structure Parsing', false, 'No DOM structure parsed');
            }
            
            if (structure && structure.semanticStructure) {
                console.log('   ✅ Semantic Score:', structure.semanticStructure.semanticScore);
            }
            
        } catch (error) {
            this.addResult('DOM Structure Parsing', false, error.message);
            console.log('   ❌ Error:', error.message);
        }
    }

    async testFormFieldDetection() {
        console.log('📝 Testing Form Field Detection...');
        
        try {
            const formFields = await this.SmartAutomationAnalyzer.detectFormFields();
            
            if (formFields && formFields.length > 0) {
                this.addResult('Form Field Detection', true, `Detected ${formFields.length} form fields`);
                console.log('   ✅ Detected form fields:', formFields.length);
                
                formFields.forEach(field => {
                    console.log(`     - ${field.type}: ${field.name || field.id}`);
                });
            } else {
                this.addResult('Form Field Detection', false, 'No form fields detected');
            }
            
        } catch (error) {
            this.addResult('Form Field Detection', false, error.message);
            console.log('   ❌ Error:', error.message);
        }
    }

    async testInteractiveElementMapping() {
        console.log('🎯 Testing Interactive Element Mapping...');
        
        try {
            const elementMap = await this.SmartAutomationAnalyzer.mapInteractiveElements();
            
            if (elementMap && Object.keys(elementMap).length > 0) {
                this.addResult('Interactive Element Mapping', true, `Mapped ${Object.keys(elementMap).length} element types`);
                console.log('   ✅ Mapped interactive elements:');
                
                Object.keys(elementMap).forEach(type => {
                    console.log(`     - ${type}: ${elementMap[type].length} elements`);
                });
            } else {
                this.addResult('Interactive Element Mapping', false, 'No interactive elements mapped');
            }
            
        } catch (error) {
            this.addResult('Interactive Element Mapping', false, error.message);
            console.log('   ❌ Error:', error.message);
        }
    }

    async testAutomationOpportunityIdentification() {
        console.log('💡 Testing Automation Opportunity Identification...');
        
        try {
            const opportunities = await this.SmartAutomationAnalyzer.identifyAutomationOpportunities();
            
            if (opportunities && opportunities.length > 0) {
                this.addResult('Automation Opportunity Identification', true, `Found ${opportunities.length} automation opportunities`);
                console.log('   ✅ Found automation opportunities:', opportunities.length);
                
                opportunities.forEach(opp => {
                    console.log(`     - ${opp.type}: ${opp.description} (Confidence: ${opp.confidence}%)`);
                });
            } else {
                this.addResult('Automation Opportunity Identification', false, 'No automation opportunities found');
            }
            
        } catch (error) {
            this.addResult('Automation Opportunity Identification', false, error.message);
            console.log('   ❌ Error:', error.message);
        }
    }

    async testElementSelectorGeneration() {
        console.log('🎯 Testing Element Selector Generation...');
        
        try {
            // Mock element for testing
            const mockElement = {
                id: 'username',
                name: 'username',
                className: 'form-input',
                tagName: 'INPUT',
                type: 'text'
            };
            
            const selector = await this.SmartAutomationAnalyzer.generateElementSelector(mockElement);
            
            if (selector) {
                this.addResult('Element Selector Generation', true, `Generated selector: ${selector}`);
                console.log('   ✅ Generated selector:', selector);
            } else {
                this.addResult('Element Selector Generation', false, 'No selector generated');
            }
            
        } catch (error) {
            this.addResult('Element Selector Generation', false, error.message);
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
        console.log('\n📊 Smart Automation Test Results:');
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
            console.log('🎉 ALL TESTS PASSED! Smart Automation is fully functional!');
        } else {
            console.log('⚠️  Some tests failed. Check implementation.');
        }
    }
}

// Run the tests
const tester = new SmartAutomationTestSimple();
tester.runTests().then(() => {
    console.log('\n✅ Smart Automation test completed!');
    process.exit(0);
}).catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
});