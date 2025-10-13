/**
 * Test Auto-Updater GitHub Configuration
 * Verifies that the auto-updater is properly configured for GitHub releases
 */

const { autoUpdater } = require('electron-updater');
const path = require('path');

console.log('🧪 Testing Auto-Updater GitHub Configuration...\n');

// Test configuration
const testConfig = {
    provider: 'github',
    owner: 'JLamance79',
    repo: 'mic-browser-ultimate'
};

console.log('📋 Configuration:');
console.log(`  Provider: ${testConfig.provider}`);
console.log(`  Owner: ${testConfig.owner}`);
console.log(`  Repository: ${testConfig.repo}`);
console.log(`  URL: https://github.com/${testConfig.owner}/${testConfig.repo}`);

// Configure auto-updater for testing
autoUpdater.setFeedURL(testConfig);

// Enable verbose logging
autoUpdater.logger = console;
if (autoUpdater.logger.transports && autoUpdater.logger.transports.file) {
    autoUpdater.logger.transports.file.level = 'info';
}

console.log('\n🔍 Testing GitHub API access...');

// Test event handlers
autoUpdater.on('checking-for-update', () => {
    console.log('✅ Checking for updates...');
});

autoUpdater.on('update-available', (info) => {
    console.log('✅ Update available:', info);
    console.log(`  Version: ${info.version}`);
    console.log(`  Release Date: ${info.releaseDate}`);
    console.log(`  Download URL: ${info.files?.[0]?.url || 'N/A'}`);
});

autoUpdater.on('update-not-available', (info) => {
    console.log('ℹ️  Update not available - app is up to date');
    console.log(`  Current version: ${info.version || 'Unknown'}`);
});

autoUpdater.on('error', (err) => {
    console.error('❌ Auto-updater error:', err.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('  1. Make sure the repository exists and is public');
    console.log('  2. Ensure there are GitHub releases available');
    console.log('  3. Check that the repository name is correct');
    console.log('  4. Verify GitHub API is accessible');
});

autoUpdater.on('download-progress', (progressObj) => {
    console.log(`📥 Download progress: ${Math.round(progressObj.percent)}%`);
});

autoUpdater.on('update-downloaded', (info) => {
    console.log('✅ Update downloaded successfully!');
    console.log('  Ready to install on restart');
});

// Start the test
console.log('\n🚀 Starting update check...');

async function runTest() {
    try {
        const result = await autoUpdater.checkForUpdates();
        
        if (result) {
            console.log('\n📊 Update Check Result:');
            console.log(`  Update Available: ${result.updateInfo ? 'Yes' : 'No'}`);
            if (result.updateInfo) {
                console.log(`  Latest Version: ${result.updateInfo.version}`);
                console.log(`  Current Version: ${process.env.npm_package_version || 'Unknown'}`);
                console.log(`  Release Notes: ${result.updateInfo.releaseNotes || 'N/A'}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Update check failed:', error.message);
        
        // Provide helpful error messages
        if (error.message.includes('404')) {
            console.log('\n💡 This likely means:');
            console.log('  - Repository not found or is private');
            console.log('  - No releases have been published yet');
            console.log('  - Repository name might be incorrect');
        } else if (error.message.includes('ENOTFOUND')) {
            console.log('\n💡 This likely means:');
            console.log('  - Network connectivity issues');
            console.log('  - GitHub API is not accessible');
        }
    }
    
    console.log('\n📖 Next Steps:');
    console.log('  1. Create a release: npm run version:patch');
    console.log('  2. Push the tag: git push origin v<version>');
    console.log('  3. GitHub Actions will build and publish the release');
    console.log('  4. Auto-updater will detect the new release');
    
    process.exit(0);
}

// Give some time for event listeners to be set up
setTimeout(runTest, 1000);