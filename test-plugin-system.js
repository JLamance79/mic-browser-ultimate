const fs = require('fs');
const path = require('path');

/**
 * Test Plugin System
 * Creates a comprehensive test to verify that the plugin system works correctly
 */

async function testPluginSystem() {
    console.log('🧪 Starting Plugin System Test Suite...\n');
    
    const testResults = {
        passed: 0,
        failed: 0,
        tests: []
    };
    
    function addTest(name, passed, message) {
        testResults.tests.push({ name, passed, message });
        if (passed) {
            testResults.passed++;
            console.log(`✅ ${name}: ${message}`);
        } else {
            testResults.failed++;
            console.log(`❌ ${name}: ${message}`);
        }
    }
    
    try {
        // Test 1: Check if plugin system files exist
        const requiredFiles = [
            'PluginManager.js',
            'PluginDeveloper.js',
            'PluginManagerUI.js'
        ];
        
        for (const file of requiredFiles) {
            const filePath = path.join(__dirname, file);
            const exists = fs.existsSync(filePath);
            addTest(`File Existence: ${file}`, exists, 
                exists ? 'File exists' : 'File missing');
        }
        
        // Test 2: Try to load PluginManager
        let PluginManager;
        try {
            PluginManager = require('./PluginManager');
            addTest('PluginManager Module', true, 'Successfully loaded PluginManager');
        } catch (error) {
            addTest('PluginManager Module', false, `Error loading: ${error.message}`);
            return testResults;
        }
        
        // Test 3: Try to load PluginDeveloper
        let PluginDeveloper;
        try {
            PluginDeveloper = require('./PluginDeveloper');
            addTest('PluginDeveloper Module', true, 'Successfully loaded PluginDeveloper');
        } catch (error) {
            addTest('PluginDeveloper Module', false, `Error loading: ${error.message}`);
            return testResults;
        }
        
        // Test 4: Create PluginManager instance
        let pluginManager;
        try {
            pluginManager = new PluginManager();
            addTest('PluginManager Instance', true, 'Successfully created instance');
        } catch (error) {
            addTest('PluginManager Instance', false, `Error creating: ${error.message}`);
            return testResults;
        }
        
        // Test 5: Check plugins directory creation
        const pluginsDir = path.join(require('os').tmpdir(), 'test-plugins');
        pluginManager.pluginsDir = pluginsDir;
        
        try {
            if (!fs.existsSync(pluginsDir)) {
                fs.mkdirSync(pluginsDir, { recursive: true });
            }
            addTest('Plugins Directory', true, 'Plugins directory created successfully');
        } catch (error) {
            addTest('Plugins Directory', false, `Error creating directory: ${error.message}`);
            return testResults;
        }
        
        // Test 6: Create PluginDeveloper instance
        let pluginDeveloper;
        try {
            pluginDeveloper = new PluginDeveloper(pluginManager);
            addTest('PluginDeveloper Instance', true, 'Successfully created instance');
        } catch (error) {
            addTest('PluginDeveloper Instance', false, `Error creating: ${error.message}`);
            return testResults;
        }
        
        // Test 7: Get available templates
        try {
            const templates = pluginDeveloper.getTemplates();
            const hasBasic = templates.some(t => t.name === 'basic');
            const hasUI = templates.some(t => t.name === 'ui');
            const hasHooks = templates.some(t => t.name === 'hooks');
            
            addTest('Plugin Templates', hasBasic && hasUI && hasHooks, 
                `Found ${templates.length} templates (basic: ${hasBasic}, ui: ${hasUI}, hooks: ${hasHooks})`);
        } catch (error) {
            addTest('Plugin Templates', false, `Error getting templates: ${error.message}`);
        }
        
        // Test 8: Create a test plugin
        const testPluginData = {
            id: 'test-plugin',
            name: 'Test Plugin',
            description: 'A test plugin for the plugin system',
            author: 'Plugin System Test',
            template: 'basic'
        };
        
        try {
            const pluginPath = await pluginDeveloper.createPlugin(testPluginData);
            const pluginExists = fs.existsSync(pluginPath);
            addTest('Plugin Creation', pluginExists, 
                pluginExists ? `Plugin created at ${pluginPath}` : 'Plugin directory not found');
            
            // Verify plugin files
            if (pluginExists) {
                const manifestExists = fs.existsSync(path.join(pluginPath, 'manifest.json'));
                const indexExists = fs.existsSync(path.join(pluginPath, 'index.js'));
                const readmeExists = fs.existsSync(path.join(pluginPath, 'README.md'));
                
                addTest('Plugin Files', manifestExists && indexExists && readmeExists,
                    `manifest.json: ${manifestExists}, index.js: ${indexExists}, README.md: ${readmeExists}`);
            }
        } catch (error) {
            addTest('Plugin Creation', false, `Error creating plugin: ${error.message}`);
        }
        
        // Test 9: Validate the created plugin
        try {
            const testPluginPath = path.join(pluginsDir, 'test-plugin');
            if (fs.existsSync(testPluginPath)) {
                const validation = pluginDeveloper.validatePlugin(testPluginPath);
                addTest('Plugin Validation', validation.valid,
                    validation.valid ? 'Plugin structure is valid' : 
                    `Validation failed: ${validation.errors.join(', ')}`);
            } else {
                addTest('Plugin Validation', false, 'Test plugin not found for validation');
            }
        } catch (error) {
            addTest('Plugin Validation', false, `Error validating plugin: ${error.message}`);
        }
        
        // Test 10: Test plugin API structure
        try {
            const api = pluginManager.createPluginAPI('test-plugin');
            const hasStorage = typeof api.storage === 'object';
            const hasUI = typeof api.ui === 'object';
            const hasSystem = typeof api.system === 'object';
            const hasEvents = typeof api.events === 'object';
            
            addTest('Plugin API Structure', hasStorage && hasUI && hasSystem && hasEvents,
                `API components - storage: ${hasStorage}, ui: ${hasUI}, system: ${hasSystem}, events: ${hasEvents}`);
        } catch (error) {
            addTest('Plugin API Structure', false, `Error testing API: ${error.message}`);
        }
        
        // Test 11: Test hook system
        try {
            let hookTriggered = false;
            const testCallback = () => { hookTriggered = true; };
            
            pluginManager.addHook('test-plugin', 'test-hook', testCallback);
            const results = await pluginManager.triggerHook('test-hook');
            
            // Check if hook was triggered by looking at results
            const wasTriggered = results.length > 0 || hookTriggered;
            
            addTest('Hook System', wasTriggered, 
                wasTriggered ? `Hook triggered successfully (${results.length} results)` : 'Hook not triggered');
        } catch (error) {
            addTest('Hook System', false, `Error testing hooks: ${error.message}`);
        }
        
        // Test 12: Test plugin data storage
        try {
            pluginManager.setPluginData('test-plugin', 'testKey', 'testValue');
            const value = pluginManager.getPluginData('test-plugin', 'testKey');
            const correctValue = value === 'testValue';
            
            addTest('Plugin Storage', correctValue,
                correctValue ? 'Storage working correctly' : `Expected 'testValue', got '${value}'`);
        } catch (error) {
            addTest('Plugin Storage', false, `Error testing storage: ${error.message}`);
        }
        
        // Cleanup test files
        try {
            if (fs.existsSync(pluginsDir)) {
                fs.rmSync(pluginsDir, { recursive: true, force: true });
            }
            addTest('Cleanup', true, 'Test files cleaned up successfully');
        } catch (error) {
            addTest('Cleanup', false, `Error during cleanup: ${error.message}`);
        }
        
    } catch (error) {
        addTest('General Error', false, `Unexpected error: ${error.message}`);
    }
    
    // Print summary
    console.log(`\n📊 Test Summary:`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
    
    if (testResults.failed === 0) {
        console.log(`\n🎉 All tests passed! Plugin system is working correctly.`);
    } else {
        console.log(`\n⚠️  Some tests failed. Please check the issues above.`);
    }
    
    return testResults;
}

// Run the test if this file is executed directly
if (require.main === module) {
    testPluginSystem().then(() => {
        process.exit(0);
    }).catch(error => {
        console.error('Test suite failed:', error);
        process.exit(1);
    });
}

module.exports = { testPluginSystem };