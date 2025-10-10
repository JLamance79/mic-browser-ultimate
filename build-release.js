#!/usr/bin/env node
/**
 * Build and Release Script for MIC Browser Ultimate
 * Automates the build, package, and release process
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class ReleaseBuilder {
    constructor() {
        this.projectRoot = path.resolve(__dirname);
        this.packageJson = require('./package.json');
        this.currentVersion = this.packageJson.version;
        this.distDir = path.join(this.projectRoot, 'dist');
        this.releasesDir = path.join(this.projectRoot, 'releases');
        
        console.log(`🏗️  MIC Browser Ultimate Release Builder v${this.currentVersion}`);
        console.log(`📁 Project root: ${this.projectRoot}`);
    }

    async buildRelease(options = {}) {
        const {
            platform = 'all',
            publish = false,
            draft = true,
            prerelease = false,
            skipBuild = false
        } = options;

        try {
            console.log(`\n🚀 Starting release build process...`);
            
            if (!skipBuild) {
                await this.prepareBuild();
                await this.buildApplication(platform);
            }
            
            await this.generateReleaseFiles();
            
            if (publish) {
                await this.publishRelease({ draft, prerelease });
            }
            
            console.log(`\n✅ Release build completed successfully!`);
            this.printBuildSummary();
            
        } catch (error) {
            console.error(`\n❌ Release build failed:`, error.message);
            process.exit(1);
        }
    }

    async prepareBuild() {
        console.log(`\n📋 Preparing build environment...`);
        
        // Ensure directories exist
        this.ensureDirectories();
        
        // Clean previous builds
        this.cleanBuildDirectories();
        
        // Update version if needed
        await this.updateVersion();
        
        // Verify dependencies
        await this.verifyDependencies();
        
        console.log(`✅ Build environment prepared`);
    }

    ensureDirectories() {
        const dirs = [this.distDir, this.releasesDir];
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`📁 Created directory: ${dir}`);
            }
        });
    }

    cleanBuildDirectories() {
        console.log(`🧹 Cleaning build directories...`);
        
        // Clean dist directory
        if (fs.existsSync(this.distDir)) {
            const files = fs.readdirSync(this.distDir);
            files.forEach(file => {
                const filePath = path.join(this.distDir, file);
                if (fs.lstatSync(filePath).isDirectory()) {
                    fs.rmSync(filePath, { recursive: true, force: true });
                } else {
                    fs.unlinkSync(filePath);
                }
            });
        }
    }

    async updateVersion() {
        // This could be extended to auto-increment version
        console.log(`📦 Current version: ${this.currentVersion}`);
    }

    async verifyDependencies() {
        console.log(`🔍 Verifying dependencies...`);
        
        try {
            execSync('npm ci', { stdio: 'pipe', cwd: this.projectRoot });
            console.log(`✅ Dependencies verified`);
        } catch (error) {
            console.log(`⚠️  Installing dependencies...`);
            execSync('npm install', { stdio: 'inherit', cwd: this.projectRoot });
        }
    }

    async buildApplication(platform) {
        console.log(`\n🔨 Building application for platform: ${platform}`);
        
        const buildCommands = {
            'win': 'npm run build-win',
            'mac': 'npm run build-mac',
            'linux': 'npm run build-linux',
            'all': 'npm run build'
        };
        
        const command = buildCommands[platform] || buildCommands.all;
        
        try {
            console.log(`Running: ${command}`);
            execSync(command, { 
                stdio: 'inherit', 
                cwd: this.projectRoot,
                env: { ...process.env, NODE_ENV: 'production' }
            });
            console.log(`✅ Build completed for ${platform}`);
        } catch (error) {
            throw new Error(`Build failed for ${platform}: ${error.message}`);
        }
    }

    async generateReleaseFiles() {
        console.log(`\n📄 Generating release files...`);
        
        // Copy built files to releases directory
        await this.copyBuiltFiles();
        
        // Generate version files for each platform
        await this.generateVersionFiles();
        
        // Generate checksums
        await this.generateChecksums();
        
        console.log(`✅ Release files generated`);
    }

    async copyBuiltFiles() {
        const distFiles = fs.readdirSync(this.distDir);
        
        distFiles.forEach(file => {
            const srcPath = path.join(this.distDir, file);
            const destPath = path.join(this.releasesDir, file);
            
            if (fs.lstatSync(srcPath).isFile()) {
                fs.copyFileSync(srcPath, destPath);
                console.log(`📋 Copied: ${file}`);
            }
        });
    }

    async generateVersionFiles() {
        const platforms = ['win32', 'darwin', 'linux'];
        const timestamp = new Date().toISOString();
        
        platforms.forEach(platform => {
            const releaseFile = this.findReleaseFile(platform);
            if (releaseFile) {
                const filePath = path.join(this.releasesDir, releaseFile);
                const fileStats = fs.statSync(filePath);
                const fileBuffer = fs.readFileSync(filePath);
                const sha512 = crypto.createHash('sha512').update(fileBuffer).digest('base64');
                
                const versionData = {
                    version: this.currentVersion,
                    files: [{
                        url: releaseFile,
                        sha512: sha512,
                        size: fileStats.size
                    }],
                    path: releaseFile,
                    sha512: sha512,
                    releaseDate: timestamp,
                    releaseNotes: this.generateReleaseNotes()
                };
                
                const yamlContent = this.objectToYaml(versionData);
                const yamlPath = path.join(this.releasesDir, `latest-${platform}.yml`);
                
                fs.writeFileSync(yamlPath, yamlContent);
                console.log(`📝 Generated: latest-${platform}.yml`);
            }
        });
    }

    findReleaseFile(platform) {
        const patterns = {
            'win32': /.*\.exe$/,
            'darwin': /.*\.dmg$/,
            'linux': /.*\.AppImage$/
        };
        
        const files = fs.readdirSync(this.releasesDir);
        return files.find(file => patterns[platform] && patterns[platform].test(file));
    }

    objectToYaml(obj) {
        let yaml = '';
        
        Object.entries(obj).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                yaml += `${key}:\n`;
                value.forEach(item => {
                    if (typeof item === 'object') {
                        yaml += `  - url: ${item.url}\n`;
                        yaml += `    sha512: ${item.sha512}\n`;
                        yaml += `    size: ${item.size}\n`;
                    } else {
                        yaml += `  - ${item}\n`;
                    }
                });
            } else {
                yaml += `${key}: ${value}\n`;
            }
        });
        
        return yaml;
    }

    generateReleaseNotes() {
        // In a real scenario, this could read from CHANGELOG.md or git commits
        return `
        🚀 What's New in v${this.currentVersion}:
        
        • Enhanced page analysis system with comprehensive scoring
        • Improved auto-updater with better progress tracking
        • Advanced command parsing with natural language support
        • Persistent storage system with LevelDB integration
        • Better security and performance optimizations
        • Bug fixes and stability improvements
        
        📊 Technical Improvements:
        • Updated Electron to latest version
        • Enhanced IPC communication layer
        • Improved error handling and logging
        • Better memory management
        `;
    }

    async generateChecksums() {
        console.log(`🔐 Generating checksums...`);
        
        const files = fs.readdirSync(this.releasesDir);
        const checksums = {};
        
        files.forEach(file => {
            if (!file.endsWith('.yml') && !file.endsWith('.json')) {
                const filePath = path.join(this.releasesDir, file);
                const fileBuffer = fs.readFileSync(filePath);
                const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');
                checksums[file] = sha256;
            }
        });
        
        const checksumPath = path.join(this.releasesDir, 'checksums.json');
        fs.writeFileSync(checksumPath, JSON.stringify(checksums, null, 2));
        console.log(`✅ Checksums generated`);
    }

    async publishRelease(options) {
        console.log(`\n🚀 Publishing release...`);
        
        const { draft, prerelease } = options;
        
        try {
            const publishCommand = draft ? 'npm run publish-github' : 'npm run publish';
            execSync(publishCommand, { 
                stdio: 'inherit', 
                cwd: this.projectRoot,
                env: { 
                    ...process.env,
                    PUBLISH_DRAFT: draft ? 'true' : 'false',
                    PUBLISH_PRERELEASE: prerelease ? 'true' : 'false'
                }
            });
            console.log(`✅ Release published`);
        } catch (error) {
            console.warn(`⚠️  Publish failed: ${error.message}`);
        }
    }

    printBuildSummary() {
        console.log(`\n📊 Build Summary:`);
        console.log(`   Version: ${this.currentVersion}`);
        console.log(`   Build directory: ${this.distDir}`);
        console.log(`   Release directory: ${this.releasesDir}`);
        
        if (fs.existsSync(this.releasesDir)) {
            const files = fs.readdirSync(this.releasesDir);
            console.log(`   Generated files: ${files.length}`);
            files.forEach(file => {
                const filePath = path.join(this.releasesDir, file);
                const stats = fs.statSync(filePath);
                const size = this.formatBytes(stats.size);
                console.log(`     • ${file} (${size})`);
            });
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {};
    
    // Parse command line arguments
    args.forEach(arg => {
        if (arg.startsWith('--platform=')) {
            options.platform = arg.split('=')[1];
        } else if (arg === '--publish') {
            options.publish = true;
        } else if (arg === '--no-draft') {
            options.draft = false;
        } else if (arg === '--prerelease') {
            options.prerelease = true;
        } else if (arg === '--skip-build') {
            options.skipBuild = true;
        }
    });
    
    const builder = new ReleaseBuilder();
    builder.buildRelease(options);
}

module.exports = ReleaseBuilder;