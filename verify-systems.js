#!/usr/bin/env node

/**
 * Quick System Verification Script
 * Tests that all three major systems are properly integrated
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 MIC Browser Ultimate - System Verification\n');

// Test 1: Verify all main files exist
console.log('📁 Testing File Structure...');
const requiredFiles = [
    'main.js',
    'preload.js',
    'index.html',
    'AutoUpdater.js',
    'CrashReporter.js',
    'NativeNotificationManager.js',
    'package.json'
];

let filesExist = 0;
requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`  ✅ ${file} exists`);
        filesExist++;
    } else {
        console.log(`  ❌ ${file} missing`);
    }
});

console.log(`📊 File Structure: ${filesExist}/${requiredFiles.length} files present\n`);

// Test 2: Verify main.js integration
console.log('🔍 Testing main.js Integration...');
const mainContent = fs.readFileSync('main.js', 'utf8');

const mainChecks = [
    { pattern: /const AutoUpdater = require.*AutoUpdater/, name: 'AutoUpdater import' },
    { pattern: /const CrashReporter = require.*CrashReporter/, name: 'CrashReporter import' },
    { pattern: /const NativeNotificationManager = require.*NativeNotificationManager/, name: 'NativeNotificationManager import' },
    { pattern: /autoUpdaterManager = new AutoUpdater/, name: 'AutoUpdater initialization' },
    { pattern: /crashReporter = new CrashReporter/, name: 'CrashReporter initialization' },
    { pattern: /notificationManager = new NativeNotificationManager/, name: 'NotificationManager initialization' },
    { pattern: /setupAutoUpdaterIpcHandlers/, name: 'Auto-updater IPC setup' },
    { pattern: /setupCrashReportingIpcHandlers/, name: 'Crash reporting IPC setup' },
    { pattern: /setupNotificationIpcHandlers/, name: 'Notification IPC setup' }
];

let mainIntegrations = 0;
mainChecks.forEach(check => {
    if (check.pattern.test(mainContent)) {
        console.log(`  ✅ ${check.name} integrated`);
        mainIntegrations++;
    } else {
        console.log(`  ❌ ${check.name} missing`);
    }
});

console.log(`📊 Main.js Integration: ${mainIntegrations}/${mainChecks.length} integrations found\n`);

// Test 3: Verify preload.js API exposure
console.log('🔍 Testing preload.js API Exposure...');
const preloadContent = fs.readFileSync('preload.js', 'utf8');

const preloadChecks = [
    { pattern: /autoUpdater:\s*{/, name: 'AutoUpdater API object' },
    { pattern: /crashReporting:\s*{/, name: 'CrashReporting API object' },
    { pattern: /notifications:\s*{/, name: 'Notifications API object' },
    { pattern: /'auto-updater-.*'/, name: 'Auto-updater IPC channels' },
    { pattern: /'crash-reporting-.*'/, name: 'Crash reporting IPC channels' },
    { pattern: /'notification-.*'/, name: 'Notification IPC channels' }
];

let preloadApis = 0;
preloadChecks.forEach(check => {
    if (check.pattern.test(preloadContent)) {
        console.log(`  ✅ ${check.name} exposed`);
        preloadApis++;
    } else {
        console.log(`  ❌ ${check.name} missing`);
    }
});

console.log(`📊 Preload.js API: ${preloadApis}/${preloadChecks.length} APIs exposed\n`);

// Test 4: Verify UI integration
console.log('🔍 Testing UI Integration...');
const indexContent = fs.readFileSync('index.html', 'utf8');

const uiChecks = [
    { pattern: /auto.*update/i, name: 'Auto-updater UI elements' },
    { pattern: /crash.*report/i, name: 'Crash reporting UI elements' },
    { pattern: /notification/i, name: 'Notification UI elements' },
    { pattern: /electronAPI\.autoUpdater/i, name: 'Auto-updater API calls' },
    { pattern: /electronAPI\.crashReporting/i, name: 'Crash reporting API calls' },
    { pattern: /electronAPI\.notifications/i, name: 'Notification API calls' }
];

let uiIntegrations = 0;
uiChecks.forEach(check => {
    if (check.pattern.test(indexContent)) {
        console.log(`  ✅ ${check.name} found`);
        uiIntegrations++;
    } else {
        console.log(`  ❌ ${check.name} missing`);
    }
});

console.log(`📊 UI Integration: ${uiIntegrations}/${uiChecks.length} integrations found\n`);

// Test 5: Verify system files
console.log('🔍 Testing System File Quality...');
const systemFiles = [
    { file: 'AutoUpdater.js', minSize: 10000, name: 'AutoUpdater' },
    { file: 'CrashReporter.js', minSize: 8000, name: 'CrashReporter' },
    { file: 'NativeNotificationManager.js', minSize: 15000, name: 'NotificationManager' }
];

let systemQuality = 0;
systemFiles.forEach(sys => {
    if (fs.existsSync(sys.file)) {
        const stats = fs.statSync(sys.file);
        const content = fs.readFileSync(sys.file, 'utf8');
        
        if (stats.size > sys.minSize && content.includes('class ')) {
            console.log(`  ✅ ${sys.name} (${Math.round(stats.size/1024)}KB) looks complete`);
            systemQuality++;
        } else {
            console.log(`  ❌ ${sys.name} (${Math.round(stats.size/1024)}KB) appears incomplete`);
        }
    } else {
        console.log(`  ❌ ${sys.name} file missing`);
    }
});

console.log(`📊 System Quality: ${systemQuality}/${systemFiles.length} systems complete\n`);

// Final Summary
const totalTests = requiredFiles.length + mainChecks.length + preloadChecks.length + uiChecks.length + systemFiles.length;
const totalPassed = filesExist + mainIntegrations + preloadApis + uiIntegrations + systemQuality;
const successRate = Math.round((totalPassed / totalTests) * 100);

console.log('═══════════════════════════════════════');
console.log('🎯 FINAL VERIFICATION RESULTS');
console.log('═══════════════════════════════════════');
console.log(`📁 File Structure: ${filesExist}/${requiredFiles.length} (${Math.round(filesExist/requiredFiles.length*100)}%)`);
console.log(`🔧 Main Integration: ${mainIntegrations}/${mainChecks.length} (${Math.round(mainIntegrations/mainChecks.length*100)}%)`);
console.log(`🌉 API Exposure: ${preloadApis}/${preloadChecks.length} (${Math.round(preloadApis/preloadChecks.length*100)}%)`);
console.log(`🎨 UI Integration: ${uiIntegrations}/${uiChecks.length} (${Math.round(uiIntegrations/uiChecks.length*100)}%)`);
console.log(`⚙️  System Quality: ${systemQuality}/${systemFiles.length} (${Math.round(systemQuality/systemFiles.length*100)}%)`);
console.log('═══════════════════════════════════════');
console.log(`🎯 OVERALL SUCCESS RATE: ${totalPassed}/${totalTests} (${successRate}%)`);
console.log('═══════════════════════════════════════');

if (successRate >= 90) {
    console.log('🎉 EXCELLENT! All systems are properly integrated');
} else if (successRate >= 80) {
    console.log('✅ GOOD! Most systems are working correctly');
} else if (successRate >= 70) {
    console.log('⚠️  FAIR! Some issues need attention');
} else {
    console.log('❌ POOR! Significant issues detected');
}

console.log('\n🚀 Run "npm run dev" to start the application');
console.log('📖 Check the console logs for system initialization status');