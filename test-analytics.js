#!/usr/bin/env node

/**
 * Analytics Test Script
 * Tests the Google Analytics integration to ensure events are being tracked
 */

const ua = require('universal-analytics');

// Test analytics configuration
const ga = ua('UA-XXXXXXXX-X'); // Replace with your actual tracking ID

console.log('🧪 Testing Analytics Integration...');

// Test basic event tracking
try {
    // Test app startup event
    ga.event('Test', 'Analytics', 'Working').send();
    console.log('✅ Basic event tracking works');

    // Test custom events similar to main app
    ga.event('Feature', 'TestInitialized', 'Success').send();
    console.log('✅ Feature tracking works');

    // Test usage tracking
    ga.event('Usage', 'TestAction', 'TestType').send();
    console.log('✅ Usage tracking works');

    console.log('\n📊 Analytics Events Tracked:');
    console.log('- Test/Analytics/Working');
    console.log('- Feature/TestInitialized/Success');
    console.log('- Usage/TestAction/TestType');

    console.log('\n🎉 Analytics integration is working correctly!');
    console.log('⚠️  Remember to:');
    console.log('1. Replace UA-XXXXXXXX-X with your actual Google Analytics tracking ID');
    console.log('2. Set up your Google Analytics property at https://analytics.google.com/');
    console.log('3. Configure event tracking in your GA dashboard');

} catch (error) {
    console.error('❌ Analytics test failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure universal-analytics is installed: npm install universal-analytics');
    console.log('2. Check your internet connection');
    console.log('3. Verify your Google Analytics tracking ID is correct');
}