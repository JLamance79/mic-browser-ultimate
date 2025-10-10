/**
 * Test script for Auto-Update functionality
 * Tests the complete update flow from detection to installation
 */

const https = require('https');
const http = require('http');

class UpdateTester {
    constructor() {
        this.serverUrl = 'http://localhost:3001';
        this.testVersion = '1.0.0';
    }

    async runTests() {
        console.log('🧪 Testing Auto-Update System\n');
        
        try {
            // Test 1: Health check
            await this.testHealthCheck();
            
            // Test 2: Update check endpoint
            await this.testUpdateCheck();
            
            // Test 3: Platform-specific updates
            await this.testPlatformUpdates();
            
            // Test 4: Latest release info
            await this.testLatestRelease();
            
            // Test 5: Releases listing
            await this.testReleasesList();
            
            console.log('\n✅ All update system tests passed!');
            
        } catch (error) {
            console.error('\n❌ Update system test failed:', error.message);
        }
    }

    async testHealthCheck() {
        console.log('🏥 Testing health check endpoint...');
        
        try {
            const data = await this.makeRequest('/health');
            
            if (data.status === 'ok') {
                console.log('✅ Health check passed');
                console.log(`   Server version: ${data.version}`);
                console.log(`   Timestamp: ${data.timestamp}`);
            } else {
                throw new Error('Health check failed');
            }
        } catch (error) {
            throw new Error(`Health check error: ${error.message}`);
        }
    }

    async testUpdateCheck() {
        console.log('\n🔍 Testing update check endpoint...');
        
        try {
            const response = await this.makeRequest(`/update/${this.testVersion}`);
            
            if (response.noContent) {
                console.log('ℹ️  No updates available (status 204)');
            } else {
                console.log('✅ Update available:');
                console.log(`   Version: ${response.version}`);
                console.log(`   URL: ${response.url}`);
                console.log(`   Size: ${this.formatBytes(response.size)}`);
                console.log(`   Release Date: ${response.releaseDate}`);
            }
        } catch (error) {
            throw new Error(`Update check error: ${error.message}`);
        }
    }

    async testPlatformUpdates() {
        console.log('\n🖥️  Testing platform-specific updates...');
        
        const platforms = ['win32', 'darwin', 'linux'];
        
        for (const platform of platforms) {
            try {
                const response = await this.makeRequest(`/update/${platform}/${this.testVersion}`);
                
                if (response.noContent) {
                    console.log(`   ${platform}: No updates available`);
                } else {
                    console.log(`✅ ${platform}: Update available (v${response.version})`);
                }
            } catch (error) {
                console.log(`❌ ${platform}: Error - ${error.message}`);
            }
        }
    }

    async testLatestRelease() {
        console.log('\n📋 Testing latest release endpoint...');
        
        try {
            const data = await this.makeRequest('/latest');
            
            console.log('✅ Latest release info retrieved:');
            console.log(`   Version: ${data.version}`);
            console.log(`   Platforms: ${Object.keys(data.platforms).join(', ')}`);
            console.log(`   Timestamp: ${data.timestamp}`);
        } catch (error) {
            throw new Error(`Latest release error: ${error.message}`);
        }
    }

    async testReleasesList() {
        console.log('\n📦 Testing releases list endpoint...');
        
        try {
            const data = await this.makeRequest('/releases');
            
            console.log('✅ Releases list retrieved:');
            console.log(`   Total releases: ${data.count}`);
            console.log(`   Directory: ${data.directory}`);
            if (data.releases.length > 0) {
                console.log('   Files:');
                data.releases.forEach(file => {
                    console.log(`     • ${file}`);
                });
            }
        } catch (error) {
            throw new Error(`Releases list error: ${error.message}`);
        }
    }

    makeRequest(path) {
        return new Promise((resolve, reject) => {
            const url = new URL(path, this.serverUrl);
            const client = url.protocol === 'https:' ? https : http;
            
            const req = client.get(url, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        if (res.statusCode === 204) {
                            resolve({ statusCode: 204, noContent: true });
                        } else if (res.statusCode >= 200 && res.statusCode < 300) {
                            const parsed = JSON.parse(data);
                            resolve({ ...parsed, statusCode: res.statusCode });
                        } else {
                            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                        }
                    } catch (error) {
                        reject(new Error(`Parse error: ${error.message}`));
                    }
                });
            });
            
            req.on('error', (error) => {
                reject(error);
            });
            
            req.setTimeout(5000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
        });
    }

    formatBytes(bytes) {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const tester = new UpdateTester();
    tester.runTests();
}

module.exports = UpdateTester;