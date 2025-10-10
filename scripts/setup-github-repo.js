#!/usr/bin/env node

/**
 * Git Repository Initialization Script
 * This script helps initialize the GitHub repository with proper settings
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Initializing MIC Browser Ultimate GitHub Repository...\n');

function runCommand(command, description) {
    try {
        console.log(`📋 ${description}...`);
        const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
        console.log(`✅ ${description} completed`);
        return output.trim();
    } catch (error) {
        console.error(`❌ Failed to ${description.toLowerCase()}`);
        console.error(`Error: ${error.message}`);
        return null;
    }
}

function checkGitRepository() {
    console.log('🔍 Checking Git repository status...');
    
    try {
        const status = execSync('git status --porcelain', { encoding: 'utf8' });
        const remotes = execSync('git remote -v', { encoding: 'utf8' });
        
        console.log('📊 Repository Status:');
        if (status.trim()) {
            console.log('   📄 Uncommitted changes detected');
        } else {
            console.log('   ✅ Working directory clean');
        }
        
        if (remotes.includes('origin')) {
            console.log('   🔗 Remote origin configured');
        } else {
            console.log('   ⚠️  No remote origin found');
        }
        
        return true;
    } catch (error) {
        console.log('   ❌ Not a Git repository or Git not available');
        return false;
    }
}

function validatePackageJson() {
    console.log('\n📦 Validating package.json configuration...');
    
    try {
        const packagePath = path.join(process.cwd(), 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        const checks = [
            { key: 'name', value: packageJson.name, expected: 'mic-browser-ultimate' },
            { key: 'repository.url', value: packageJson.repository?.url, required: true },
            { key: 'build.appId', value: packageJson.build?.appId, required: true },
            { key: 'scripts.build:ci', value: packageJson.scripts?.['build:ci'], required: true }
        ];
        
        let allValid = true;
        checks.forEach(check => {
            if (check.expected && check.value !== check.expected) {
                console.log(`   ⚠️  ${check.key}: Expected "${check.expected}", got "${check.value}"`);
                allValid = false;
            } else if (check.required && !check.value) {
                console.log(`   ❌ ${check.key}: Missing required field`);
                allValid = false;
            } else {
                console.log(`   ✅ ${check.key}: OK`);
            }
        });
        
        return allValid;
    } catch (error) {
        console.error('   ❌ Failed to read or parse package.json');
        return false;
    }
}

function createGitHubReadyCommit() {
    console.log('\n📝 Preparing GitHub-ready commit...');
    
    const commands = [
        'git add .',
        'git commit -m "feat: setup GitHub repository with automated builds and releases"'
    ];
    
    commands.forEach(command => {
        runCommand(command, `Executing: ${command}`);
    });
}

function showNextSteps() {
    console.log('\n🎯 Next Steps:');
    console.log('');
    console.log('1. 🏗️  Create GitHub Repository:');
    console.log('   • Go to https://github.com/new');
    console.log('   • Repository name: mic-browser-ultimate');
    console.log('   • Description: Advanced Cross-Platform Browser with AI-Powered Analysis');
    console.log('   • Make it public (recommended for open source)');
    console.log('');
    console.log('2. 🔗 Connect Local Repository:');
    console.log('   git remote add origin https://github.com/yourusername/mic-browser-ultimate.git');
    console.log('   git branch -M main');
    console.log('   git push -u origin main');
    console.log('');
    console.log('3. ⚙️  Configure GitHub Secrets:');
    console.log('   • Go to Settings → Secrets and variables → Actions');
    console.log('   • Add secret: GH_TOKEN (Personal Access Token)');
    console.log('   • Scope: repo, write:packages');
    console.log('');
    console.log('4. 🏷️  Create First Release:');
    console.log('   git tag -a v1.0.0 -m "Initial release"');
    console.log('   git push origin v1.0.0');
    console.log('');
    console.log('5. 🔍 Monitor Build:');
    console.log('   • Check Actions tab in your repository');
    console.log('   • Verify builds complete successfully');
    console.log('   • Download artifacts from successful builds');
    console.log('');
    console.log('📚 For detailed instructions, see: SETUP_GUIDE.md');
    console.log('🤝 For contributing guidelines, see: CONTRIBUTING.md');
    console.log('');
    console.log('✨ Your repository is ready for GitHub! 🚀');
}

// Main execution
async function main() {
    const isGitRepo = checkGitRepository();
    const isValidPackage = validatePackageJson();
    
    if (!isGitRepo) {
        console.log('\n⚠️  Initializing Git repository...');
        runCommand('git init', 'Initialize Git repository');
        runCommand('git branch -M main', 'Set default branch to main');
    }
    
    if (isValidPackage) {
        console.log('\n✅ Package configuration is valid');
    } else {
        console.log('\n⚠️  Please review package.json configuration');
    }
    
    // Create commit with all repository files
    createGitHubReadyCommit();
    
    // Show next steps
    showNextSteps();
}

// Run the script
main().catch(error => {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
});