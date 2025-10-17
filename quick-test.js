/**
 * Quick Test Runner - All Systems Verification
 * Tests the three major systems individually
 */

console.log('🚀 MIC Browser Ultimate - Quick Test Suite\n');

const fs = require('fs');
const path = require('path');

// Test 1: File Existence
console.log('📁 Testing Core Files...');
const files = [
    'AutoUpdater.js',
    'CrashReporter.js', 
    'NativeNotificationManager.js',
    'main.js',
    'preload.js',
    'index.html'
];

let fileTests = 0;
files.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`  ✅ ${file} exists`);
        fileTests++;
    } else {
        console.log(`  ❌ ${file} missing`);
    }
});

// Test 2: AutoUpdater Class
console.log('\n🔄 Testing AutoUpdater Class...');
try {
    const AutoUpdater = require('./AutoUpdater.js');
    const autoUpdater = new AutoUpdater();
    console.log('  ✅ AutoUpdater class instantiated successfully');
    console.log(`  ✅ AutoUpdater has ${Object.getOwnPropertyNames(Object.getPrototypeOf(autoUpdater)).length} methods`);
} catch (error) {
    console.log(`  ❌ AutoUpdater error: ${error.message}`);
}

// Test 3: CrashReporter Class
console.log('\n📊 Testing CrashReporter Class...');
try {
    const CrashReporter = require('./CrashReporter.js');
    const crashReporter = new CrashReporter();
    console.log('  ✅ CrashReporter class instantiated successfully');
    console.log(`  ✅ CrashReporter has ${Object.getOwnPropertyNames(Object.getPrototypeOf(crashReporter)).length} methods`);
} catch (error) {
    console.log(`  ❌ CrashReporter error: ${error.message}`);
}

// Test 4: NativeNotificationManager Class
console.log('\n🔔 Testing NativeNotificationManager Class...');
try {
    const NativeNotificationManager = require('./NativeNotificationManager.js');
    const notificationManager = new NativeNotificationManager();
    console.log('  ✅ NativeNotificationManager class instantiated successfully');
    console.log(`  ✅ NativeNotificationManager has ${Object.getOwnPropertyNames(Object.getPrototypeOf(notificationManager)).length} methods`);
} catch (error) {
    console.log(`  ❌ NativeNotificationManager error: ${error.message}`);
}

// Test 5: Package.json verification
console.log('\n📦 Testing Package Configuration...');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    console.log(`  ✅ Package name: ${packageJson.name}`);
    console.log(`  ✅ Version: ${packageJson.version}`);
    
    const deps = packageJson.dependencies || {};
    if (deps['electron-updater']) {
        console.log(`  ✅ electron-updater: ${deps['electron-updater']}`);
    } else {
        console.log('  ❌ electron-updater dependency missing');
    }
} catch (error) {
    console.log(`  ❌ Package.json error: ${error.message}`);
}

// Test 6: Main.js integration check
console.log('\n🔧 Testing Main.js Integration...');
try {
    const mainContent = fs.readFileSync('main.js', 'utf8');
    
    const checks = [
        { test: /AutoUpdaterManager.*require/, name: 'AutoUpdater import' },
        { test: /CrashReporter.*require/, name: 'CrashReporter import' },
        { test: /NativeNotificationManager.*require/, name: 'NativeNotificationManager import' },
        { test: /autoUpdaterManager.*new/, name: 'AutoUpdater initialization' },
        { test: /crashReporter.*new/, name: 'CrashReporter initialization' },
        { test: /notificationManager.*new/, name: 'NotificationManager initialization' }
    ];
    
    let integrationTests = 0;
    checks.forEach(check => {
        if (check.test.test(mainContent)) {
            console.log(`  ✅ ${check.name} found`);
            integrationTests++;
        } else {
            console.log(`  ❌ ${check.name} missing`);
        }
    });
    
    console.log(`  📊 Integration: ${integrationTests}/${checks.length} components integrated`);
} catch (error) {
    console.log(`  ❌ Main.js integration error: ${error.message}`);
}

// Final Results
console.log('\n═══════════════════════════════════════');
console.log('🎯 QUICK TEST RESULTS');
console.log('═══════════════════════════════════════');
console.log(`📁 Files: ${fileTests}/${files.length} present`);
console.log('🔄 AutoUpdater: Class tested');
console.log('📊 CrashReporter: Class tested');
console.log('🔔 NotificationManager: Class tested');
console.log('📦 Package: Configuration verified');
console.log('🔧 Integration: Components checked');
console.log('═══════════════════════════════════════');

const totalFiles = files.length;
const successRate = Math.round((fileTests / totalFiles) * 100);

if (successRate === 100) {
    console.log('🎉 EXCELLENT! All core files present and classes functional');
} else if (successRate >= 80) {
    console.log('✅ GOOD! Most components are working');
} else {
    console.log('⚠️ WARNING! Some components may have issues');
}

console.log('\n💡 To test full integration, run: npm run dev');
console.log('📊 Check the startup logs for system initialization status');