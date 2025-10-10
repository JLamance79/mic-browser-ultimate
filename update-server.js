/**
 * Simple Update Server for MIC Browser Ultimate
 * Serves update information and files for electron-updater
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

class UpdateServer {
    constructor(options = {}) {
        this.app = express();
        this.port = options.port || 3001;
        this.releasesDir = options.releasesDir || path.join(__dirname, 'releases');
        this.currentVersion = options.currentVersion || '1.0.0';
        
        this.setupMiddleware();
        this.setupRoutes();
        this.ensureDirectories();
    }

    setupMiddleware() {
        // Enable CORS for cross-origin requests
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            next();
        });

        // Parse JSON bodies
        this.app.use(express.json());
        
        // Serve static files from releases directory
        this.app.use('/releases', express.static(this.releasesDir));
        
        // Log requests
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
            next();
        });
    }

    setupRoutes() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                version: this.currentVersion
            });
        });

        // Update check endpoint for Windows (NSIS)
        this.app.get('/update/win32/:version', (req, res) => {
            const clientVersion = req.params.version;
            const updateInfo = this.getUpdateInfo('win32', clientVersion);
            
            if (updateInfo) {
                res.json(updateInfo);
            } else {
                res.status(204).send(); // No updates available
            }
        });

        // Update check endpoint for macOS
        this.app.get('/update/darwin/:version', (req, res) => {
            const clientVersion = req.params.version;
            const updateInfo = this.getUpdateInfo('darwin', clientVersion);
            
            if (updateInfo) {
                res.json(updateInfo);
            } else {
                res.status(204).send(); // No updates available
            }
        });

        // Update check endpoint for Linux
        this.app.get('/update/linux/:version', (req, res) => {
            const clientVersion = req.params.version;
            const updateInfo = this.getUpdateInfo('linux', clientVersion);
            
            if (updateInfo) {
                res.json(updateInfo);
            } else {
                res.status(204).send(); // No updates available
            }
        });

        // Generic update check (auto-detect platform)
        this.app.get('/update/:version', (req, res) => {
            const clientVersion = req.params.version;
            const userAgent = req.headers['user-agent'] || '';
            
            let platform = 'win32';
            if (userAgent.includes('Mac')) platform = 'darwin';
            else if (userAgent.includes('Linux')) platform = 'linux';
            
            const updateInfo = this.getUpdateInfo(platform, clientVersion);
            
            if (updateInfo) {
                res.json(updateInfo);
            } else {
                res.status(204).send();
            }
        });

        // Latest release info endpoint
        this.app.get('/latest', (req, res) => {
            const latestInfo = this.getLatestReleaseInfo();
            res.json(latestInfo);
        });

        // Upload new release (for CI/CD)
        this.app.post('/upload', (req, res) => {
            // This would handle file uploads in a production environment
            res.json({ message: 'Upload endpoint - implement file handling as needed' });
        });

        // List all releases
        this.app.get('/releases', (req, res) => {
            const releases = this.getAllReleases();
            res.json(releases);
        });
    }

    getUpdateInfo(platform, clientVersion) {
        try {
            const releaseFile = path.join(this.releasesDir, `latest-${platform}.yml`);
            
            if (!fs.existsSync(releaseFile)) {
                console.log(`No release file found for ${platform}: ${releaseFile}`);
                return null;
            }

            const releaseData = fs.readFileSync(releaseFile, 'utf8');
            const releaseInfo = this.parseYaml(releaseData);
            
            // Check if update is needed
            if (this.isNewerVersion(releaseInfo.version, clientVersion)) {
                return {
                    version: releaseInfo.version,
                    releaseDate: releaseInfo.releaseDate || new Date().toISOString(),
                    url: this.getDownloadUrl(platform, releaseInfo),
                    sha512: releaseInfo.sha512,
                    size: releaseInfo.size || 0,
                    releaseNotes: releaseInfo.releaseNotes || 'Update available'
                };
            }

            return null;
        } catch (error) {
            console.error('Error getting update info:', error);
            return null;
        }
    }

    getDownloadUrl(platform, releaseInfo) {
        const baseUrl = `http://localhost:${this.port}/releases`;
        
        switch (platform) {
            case 'win32':
                return `${baseUrl}/${releaseInfo.path || 'MIC Browser Ultimate Setup.exe'}`;
            case 'darwin':
                return `${baseUrl}/${releaseInfo.path || 'MIC Browser Ultimate.dmg'}`;
            case 'linux':
                return `${baseUrl}/${releaseInfo.path || 'MIC Browser Ultimate.AppImage'}`;
            default:
                return `${baseUrl}/${releaseInfo.path}`;
        }
    }

    isNewerVersion(serverVersion, clientVersion) {
        const serverParts = serverVersion.split('.').map(Number);
        const clientParts = clientVersion.split('.').map(Number);
        
        for (let i = 0; i < Math.max(serverParts.length, clientParts.length); i++) {
            const serverPart = serverParts[i] || 0;
            const clientPart = clientParts[i] || 0;
            
            if (serverPart > clientPart) return true;
            if (serverPart < clientPart) return false;
        }
        
        return false;
    }

    parseYaml(yamlContent) {
        // Simple YAML parser for electron-builder generated files
        const lines = yamlContent.split('\n');
        const result = {};
        
        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const colonIndex = trimmed.indexOf(':');
                if (colonIndex > 0) {
                    const key = trimmed.substring(0, colonIndex).trim();
                    const value = trimmed.substring(colonIndex + 1).trim();
                    result[key] = value.replace(/['"]/g, '');
                }
            }
        });
        
        return result;
    }

    getLatestReleaseInfo() {
        const platforms = ['win32', 'darwin', 'linux'];
        const releases = {};
        
        platforms.forEach(platform => {
            const updateInfo = this.getUpdateInfo(platform, '0.0.0');
            if (updateInfo) {
                releases[platform] = updateInfo;
            }
        });
        
        return {
            version: this.currentVersion,
            platforms: releases,
            timestamp: new Date().toISOString()
        };
    }

    getAllReleases() {
        try {
            const files = fs.readdirSync(this.releasesDir);
            const releases = files.filter(file => file.endsWith('.yml') || file.endsWith('.exe') || file.endsWith('.dmg') || file.endsWith('.AppImage'));
            
            return {
                releases: releases,
                count: releases.length,
                directory: this.releasesDir
            };
        } catch (error) {
            return {
                releases: [],
                count: 0,
                error: error.message
            };
        }
    }

    ensureDirectories() {
        if (!fs.existsSync(this.releasesDir)) {
            fs.mkdirSync(this.releasesDir, { recursive: true });
            console.log(`Created releases directory: ${this.releasesDir}`);
        }
    }

    createDemoRelease() {
        // Create demo release files for testing
        const demoReleases = {
            'latest-win32.yml': `version: 1.0.1
files:
  - url: MIC Browser Ultimate Setup 1.0.1.exe
    sha512: abcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd123456
    size: 150000000
path: MIC Browser Ultimate Setup 1.0.1.exe
sha512: abcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd123456
releaseDate: ${new Date().toISOString()}`,
            
            'latest-darwin.yml': `version: 1.0.1
files:
  - url: MIC Browser Ultimate-1.0.1.dmg
    sha512: abcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd123456
    size: 180000000
path: MIC Browser Ultimate-1.0.1.dmg
sha512: abcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd123456
releaseDate: ${new Date().toISOString()}`,
            
            'latest-linux.yml': `version: 1.0.1
files:
  - url: MIC Browser Ultimate-1.0.1.AppImage
    sha512: abcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd123456
    size: 200000000
path: MIC Browser Ultimate-1.0.1.AppImage
sha512: abcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd123456
releaseDate: ${new Date().toISOString()}`
        };
        
        Object.entries(demoReleases).forEach(([filename, content]) => {
            const filePath = path.join(this.releasesDir, filename);
            fs.writeFileSync(filePath, content);
        });
        
        console.log('Demo release files created for testing');
    }

    start() {
        this.createDemoRelease(); // Create demo files for testing
        
        this.server = this.app.listen(this.port, () => {
            console.log(`🚀 Update server running on http://localhost:${this.port}`);
            console.log(`📁 Serving releases from: ${this.releasesDir}`);
            console.log(`📋 Available endpoints:`);
            console.log(`   GET /health - Health check`);
            console.log(`   GET /update/:version - Check for updates`);
            console.log(`   GET /update/{platform}/:version - Platform-specific updates`);
            console.log(`   GET /latest - Latest release info`);
            console.log(`   GET /releases - List all releases`);
        });
        
        return this.server;
    }

    stop() {
        if (this.server) {
            this.server.close();
            console.log('Update server stopped');
        }
    }
}

// Export for use as module
module.exports = UpdateServer;

// Run directly if this file is executed
if (require.main === module) {
    const server = new UpdateServer({
        port: process.env.UPDATE_PORT || 3001,
        currentVersion: '1.0.1'
    });
    
    server.start();
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\nShutting down update server...');
        server.stop();
        process.exit(0);
    });
}