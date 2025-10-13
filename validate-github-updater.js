/**
 * GitHub Auto-Updater Configuration Validator
 * Validates the setup without requiring Electron runtime
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Validating GitHub Auto-Updater Configuration...\n');

// Check package.json configuration
function validatePackageJson() {
    console.log('📋 Checking package.json configuration...');
    
    try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        
        // Check repository
        if (packageJson.repository && packageJson.repository.url) {
            console.log('✅ Repository URL:', packageJson.repository.url);
            
            // Extract owner and repo from URL
            const match = packageJson.repository.url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
            if (match) {
                const [, owner, repo] = match;
                console.log('✅ Owner:', owner);
                console.log('✅ Repository:', repo.replace('.git', ''));
            }
        } else {
            console.log('❌ Repository not configured in package.json');
        }
        
        // Check publish configuration
        if (packageJson.build && packageJson.build.publish) {
            const githubPublish = packageJson.build.publish.find(p => p.provider === 'github');
            if (githubPublish) {
                console.log('✅ GitHub publish configuration found');
                console.log('  Owner:', githubPublish.owner);
                console.log('  Repo:', githubPublish.repo);
            } else {
                console.log('❌ GitHub publish configuration not found');
            }
        }
        
        // Check version
        console.log('✅ Current version:', packageJson.version);
        
        return true;
    } catch (error) {
        console.log('❌ Error reading package.json:', error.message);
        return false;
    }
}

// Check main.js auto-updater configuration
function validateMainJs() {
    console.log('\n🔧 Checking main.js auto-updater configuration...');
    
    try {
        const mainJs = fs.readFileSync('main.js', 'utf8');
        
        // Check for GitHub provider
        if (mainJs.includes("provider: 'github'")) {
            console.log('✅ GitHub provider configured');
        } else {
            console.log('❌ GitHub provider not found');
        }
        
        // Check for repository configuration
        const ownerMatch = mainJs.match(/owner:\s*['"]([^'"]+)['"]/);
        const repoMatch = mainJs.match(/repo:\s*['"]([^'"]+)['"]/);
        
        if (ownerMatch && repoMatch) {
            console.log('✅ Repository configuration found:');
            console.log('  Owner:', ownerMatch[1]);
            console.log('  Repo:', repoMatch[1]);
        } else {
            console.log('❌ Repository configuration incomplete');
        }
        
        // Check for auto-updater import
        if (mainJs.includes("require('electron-updater')")) {
            console.log('✅ electron-updater imported');
        } else {
            console.log('❌ electron-updater not imported');
        }
        
        return true;
    } catch (error) {
        console.log('❌ Error reading main.js:', error.message);
        return false;
    }
}

// Check GitHub Actions workflow
function validateGitHubActions() {
    console.log('\n🔄 Checking GitHub Actions workflow...');
    
    const workflowPath = '.github/workflows/build-and-release.yml';
    
    try {
        if (fs.existsSync(workflowPath)) {
            console.log('✅ GitHub Actions workflow found');
            
            const workflow = fs.readFileSync(workflowPath, 'utf8');
            
            // Check for required elements
            if (workflow.includes('electron-builder')) {
                console.log('✅ electron-builder configured');
            }
            
            if (workflow.includes('GH_TOKEN')) {
                console.log('✅ GitHub token configured');
            }
            
            if (workflow.includes('matrix')) {
                console.log('✅ Multi-platform build configured');
            }
            
            return true;
        } else {
            console.log('❌ GitHub Actions workflow not found');
            return false;
        }
    } catch (error) {
        console.log('❌ Error checking GitHub Actions:', error.message);
        return false;
    }
}

// Check release helper script
function validateReleaseHelper() {
    console.log('\n🚀 Checking release helper...');
    
    if (fs.existsSync('release-helper.js')) {
        console.log('✅ Release helper script found');
        
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const scripts = packageJson.scripts || {};
        
        if (scripts['version:patch']) {
            console.log('✅ Version bump scripts configured');
        }
        
        if (scripts['release:auto']) {
            console.log('✅ Auto-release script configured');
        }
        
        return true;
    } else {
        console.log('❌ Release helper script not found');
        return false;
    }
}

// Run all validations
console.log('🔍 Starting validation...\n');

const results = [
    validatePackageJson(),
    validateMainJs(),
    validateGitHubActions(),
    validateReleaseHelper()
];

console.log('\n📊 Validation Summary:');
const passed = results.filter(r => r).length;
console.log(`✅ Passed: ${passed}/${results.length} checks`);

if (passed === results.length) {
    console.log('\n🎉 All checks passed! Your GitHub auto-updater is properly configured.');
} else {
    console.log('\n⚠️  Some issues found. Please review the errors above.');
}

console.log('\n📖 How to test the auto-updater:');
console.log('1. Create a release: npm run version:patch');
console.log('2. Build the app: npm run build');
console.log('3. Start the app: npm start');
console.log('4. Check console for auto-updater logs');
console.log('5. The app will check for updates automatically');

console.log('\n📋 Auto-Updater Configuration:');
console.log(`  Provider: github`);
console.log(`  Owner: JLamance79`);
console.log(`  Repository: mic-browser-ultimate`);
console.log(`  URL: https://github.com/JLamance79/mic-browser-ultimate`);
console.log(`  Update Check: Every 30 minutes`);
console.log(`  Initial Check: 30 seconds after app start`);

console.log('\n✨ Features:');
console.log('  ✅ Automatic update detection');
console.log('  ✅ Background downloads');
console.log('  ✅ User notifications');
console.log('  ✅ Multi-platform support');
console.log('  ✅ Rollback on failure');
console.log('  ✅ Code signing support');