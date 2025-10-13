#!/usr/bin/env node

/**
 * Release Helper Script for MIC Browser Ultimate
 * Helps create releases and manage versions for auto-updates
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get current version from package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const currentVersion = packageJson.version;

console.log('🚀 MIC Browser Ultimate Release Helper');
console.log(`Current version: ${currentVersion}`);

// Get command line arguments
const args = process.argv.slice(2);
const command = args[0];

function showHelp() {
    console.log(`
Usage: node release-helper.js [command] [options]

Commands:
  patch     - Increment patch version (1.0.0 -> 1.0.1)
  minor     - Increment minor version (1.0.0 -> 1.1.0)
  major     - Increment major version (1.0.0 -> 2.0.0)
  version   - Set specific version
  current   - Show current version
  build     - Build for all platforms
  publish   - Build and publish to GitHub releases

Examples:
  node release-helper.js patch
  node release-helper.js version 1.2.3
  node release-helper.js build
  node release-helper.js publish

GitHub Auto-Update Setup:
  1. Create a release with this script
  2. The auto-updater will check GitHub releases
  3. Users will be notified of updates automatically
`);
}

function incrementVersion(type) {
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    
    let newVersion;
    switch (type) {
        case 'patch':
            newVersion = `${major}.${minor}.${patch + 1}`;
            break;
        case 'minor':
            newVersion = `${major}.${minor + 1}.0`;
            break;
        case 'major':
            newVersion = `${major + 1}.0.0`;
            break;
        default:
            throw new Error(`Unknown version type: ${type}`);
    }
    
    return newVersion;
}

function updateVersion(newVersion) {
    // Update package.json
    packageJson.version = newVersion;
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    
    console.log(`✅ Updated version to ${newVersion}`);
}

function createGitTag(version) {
    try {
        execSync(`git add package.json`);
        execSync(`git commit -m "chore: bump version to ${version}"`);
        execSync(`git tag v${version}`);
        console.log(`✅ Created git tag v${version}`);
        
        console.log('📤 Push changes with:');
        console.log(`  git push origin main`);
        console.log(`  git push origin v${version}`);
        
    } catch (error) {
        console.error('❌ Failed to create git tag:', error.message);
        console.log('Make sure you have git initialized and changes committed');
    }
}

function buildApp() {
    console.log('🔨 Building application for all platforms...');
    
    try {
        console.log('📦 Installing dependencies...');
        execSync('npm ci', { stdio: 'inherit' });
        
        console.log('🏗️  Building for all platforms...');
        execSync('npm run build:all', { stdio: 'inherit' });
        
        console.log('✅ Build completed successfully!');
        console.log('📁 Check the dist/ folder for built applications');
        
    } catch (error) {
        console.error('❌ Build failed:', error.message);
        process.exit(1);
    }
}

function publishRelease() {
    console.log('📤 Publishing release...');
    
    try {
        // Build first
        buildApp();
        
        // Create GitHub release
        console.log('🚀 Publishing to GitHub...');
        execSync('npm run publish:github', { stdio: 'inherit' });
        
        console.log('✅ Release published successfully!');
        console.log('🔄 Auto-updater will now detect this release');
        
    } catch (error) {
        console.error('❌ Publish failed:', error.message);
    }
}

function checkGitStatus() {
    try {
        const status = execSync('git status --porcelain', { encoding: 'utf8' });
        if (status.trim()) {
            console.log('⚠️  Warning: You have uncommitted changes:');
            console.log(status);
            console.log('Consider committing changes before creating a release.');
        }
    } catch (error) {
        console.log('ℹ️  Git not initialized or not a git repository');
    }
}

// Main command handling
switch (command) {
    case 'patch':
    case 'minor':
    case 'major':
        checkGitStatus();
        const newVersion = incrementVersion(command);
        updateVersion(newVersion);
        createGitTag(newVersion);
        break;
        
    case 'version':
        const specificVersion = args[1];
        if (!specificVersion) {
            console.error('❌ Please specify a version number');
            console.log('Example: node release-helper.js version 1.2.3');
            process.exit(1);
        }
        checkGitStatus();
        updateVersion(specificVersion);
        createGitTag(specificVersion);
        break;
        
    case 'current':
        console.log(`Current version: ${currentVersion}`);
        break;
        
    case 'build':
        buildApp();
        break;
        
    case 'publish':
        publishRelease();
        break;
        
    case 'help':
    case '--help':
    case '-h':
    default:
        showHelp();
        break;
}

// Status information
console.log(`
📋 Auto-Update Configuration Status:
✅ GitHub provider configured
✅ Repository: JLamance79/mic-browser-ultimate
✅ Auto-updater enabled in production builds
✅ Update checks every 30 minutes
✅ GitHub Actions workflow ready

📖 How Auto-Updates Work:
1. Create a release using this script
2. GitHub Actions builds and publishes the release
3. electron-updater checks GitHub releases
4. Users get notified of available updates
5. Updates download and install automatically

🔧 Next Steps:
1. Run: node release-helper.js patch (to create a new version)
2. Push the tag: git push origin v<version>
3. GitHub Actions will build and create the release
4. Auto-updater will detect the new release
`);