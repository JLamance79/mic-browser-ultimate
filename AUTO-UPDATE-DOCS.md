# Auto-Update System Documentation

## 🚀 MIC Browser Ultimate Auto-Update System

The MIC Browser Ultimate features a comprehensive auto-update system built with `electron-updater` that provides seamless, automatic updates with a rich user interface and robust backend infrastructure.

## 📋 System Overview

### Components:
1. **Client-Side Updater** - Built into the Electron app
2. **Update Server** - Local/hosted server serving update files
3. **Build System** - Automated release generation
4. **UI Components** - User-friendly update interface
5. **Command Integration** - CLI commands for manual updates

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Electron App  │    │  Update Server   │    │ Release Builder │
│                 │    │                  │    │                 │
│ • Auto-updater  │◄──►│ • Version check  │◄───│ • Build process │
│ • Update UI     │    │ • File serving   │    │ • Release files │
│ • Progress      │    │ • Platform check │    │ • Checksums     │
│ • Commands      │    │ • Analytics      │    │ • Publishing    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🛠️ Setup and Configuration

### 1. Package Dependencies

```json
{
  "dependencies": {
    "electron-updater": "^6.6.2"
  },
  "devDependencies": {
    "electron-builder": "^24.13.3",
    "node-fetch": "^3.0.0"
  }
}
```

### 2. Package.json Configuration

```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/mic-browser-ultimate.git"
  },
  "build": {
    "appId": "com.micbrowser.ultimate",
    "productName": "MIC Browser Ultimate",
    "publish": [
      {
        "provider": "github",
        "owner": "yourusername",
        "repo": "mic-browser-ultimate"
      },
      {
        "provider": "generic",
        "url": "https://your-update-server.com/releases/"
      }
    ]
  }
}
```

### 3. Main Process Setup (main.js)

```javascript
const { autoUpdater } = require('electron-updater');

// Configure update server
autoUpdater.setFeedURL({
  provider: 'generic',
  url: 'http://localhost:3001'
});

// Event handlers
autoUpdater.on('update-available', (info) => {
  mainWindow.webContents.send('updater-update-available', info);
});

autoUpdater.on('download-progress', (progressObj) => {
  mainWindow.webContents.send('updater-download-progress', progressObj);
});

autoUpdater.on('update-downloaded', (info) => {
  mainWindow.webContents.send('updater-update-downloaded', info);
});
```

## 🔧 Usage Instructions

### Command Line Usage

```bash
# Check for updates manually
npm run test-updates

# Start update server
npm run update-server

# Build releases
npm run release              # All platforms
npm run release-win         # Windows only
npm run release-mac         # macOS only
npm run release-linux       # Linux only

# Publish releases
npm run release-publish     # Build and publish
```

### In-App Commands

```bash
# Using command palette (Ctrl+K) or URL bar
update                      # Check for updates
update check               # Same as above
update download           # Download available update
update install            # Install downloaded update

# Aliases
check-update              # Check for updates
upgrade                   # Check for updates
check-for-updates        # Check for updates
```

### Programmatic Usage

```javascript
// Check for updates
const result = await window.electronAPI.updater.checkForUpdates();

// Download update
await window.electronAPI.updater.downloadUpdate();

// Install and restart
await window.electronAPI.updater.quitAndInstall();

// Get version info
const versionInfo = await window.electronAPI.updater.getVersion();
```

## 🎨 User Interface Features

### Update Modal Components:
- **Version Comparison** - Current vs. New version badge
- **Release Notes** - What's new information
- **Progress Bar** - Download progress with speed/size
- **Action Buttons** - Later, Download, Restart & Update
- **Visual Feedback** - Color-coded status indicators

### UI States:
1. **Update Available** - Shows new version and release notes
2. **Downloading** - Progress bar with download metrics
3. **Ready to Install** - Restart button and install option
4. **Error State** - Error messages and retry options

## 🖥️ Update Server

### Server Features:
- **Health Check** - `/health` endpoint
- **Version Check** - `/update/:version` endpoint
- **Platform Support** - Windows, macOS, Linux
- **File Serving** - Static file serving for downloads
- **Demo Mode** - Creates test release files
- **CORS Support** - Cross-origin request handling

### API Endpoints:

```
GET /health                     # Server health check
GET /update/:version           # Generic update check
GET /update/{platform}/:version # Platform-specific updates
GET /latest                    # Latest release information
GET /releases                  # List all available releases
POST /upload                   # Upload new releases (CI/CD)
```

### Example Responses:

```javascript
// Update available
{
  "version": "1.0.1",
  "releaseDate": "2025-10-10T18:31:56.303Z",
  "url": "http://localhost:3001/releases/MIC Browser Ultimate Setup 1.0.1.exe",
  "sha512": "abcd1234...",
  "size": 150000000,
  "releaseNotes": "Bug fixes and improvements"
}

// No update (HTTP 204 No Content)
```

## 🏗️ Build and Release Process

### Automated Build Script (`build-release.js`):

1. **Preparation** - Clean directories, verify dependencies
2. **Building** - Compile for target platforms
3. **File Generation** - Create release files and checksums
4. **Version Files** - Generate YAML files for electron-updater
5. **Publishing** - Optional GitHub/generic server publishing

### Build Configuration:

```javascript
// Platform-specific builds
const buildCommands = {
  'win': 'npm run build-win',     // Windows NSIS installer
  'mac': 'npm run build-mac',     // macOS DMG
  'linux': 'npm run build-linux', // Linux AppImage
  'all': 'npm run build'          // All platforms
};
```

## 🧪 Testing and Validation

### Test Suite (`test-updates.js`):

- **Health Check** - Server availability
- **Update Detection** - Version comparison logic
- **Platform Support** - Cross-platform compatibility
- **File Serving** - Download URL validation
- **Error Handling** - Failure scenarios

### Test Results:
```
✅ Health check passed
✅ Update available (v1.0.1)
✅ Platform updates working (win32, darwin, linux)
✅ Latest release info retrieved
✅ File serving operational
```

## 🔐 Security Considerations

### Verification Features:
- **SHA512 Checksums** - File integrity verification
- **HTTPS Support** - Secure download channels
- **Signature Validation** - Code signing integration
- **Version Validation** - Semantic version checking

### Best Practices:
- Always use HTTPS in production
- Implement code signing for releases
- Validate checksums before installation
- Use secure update server hosting

## 📊 Monitoring and Analytics

### Metrics Tracked:
- Update check frequency
- Download success rates
- Installation completion
- Error occurrences
- Platform distribution

### Storage Integration:
```javascript
// Record update metrics
await storage.recordMetric('update_check', 1, {
  currentVersion: '1.0.0',
  availableVersion: '1.0.1',
  platform: process.platform
});
```

## 🚀 Production Deployment

### Server Hosting Options:
1. **GitHub Releases** - Free, integrated with repository
2. **AWS S3 + CloudFront** - Scalable, global distribution
3. **Azure Blob Storage** - Microsoft cloud integration
4. **Self-hosted** - Full control, custom logic

### Configuration Examples:

```javascript
// GitHub provider
{
  "provider": "github",
  "owner": "yourusername",
  "repo": "mic-browser-ultimate"
}

// Generic provider
{
  "provider": "generic",
  "url": "https://releases.yoursite.com/"
}
```

## 🔄 Update Flow Diagram

```
User Opens App
       ↓
Auto-check (30min intervals)
       ↓
Update Available? ──No──► Continue Normal Operation
       ↓ Yes
Show Update Modal
       ↓
User Clicks Download
       ↓
Download with Progress
       ↓
Download Complete
       ↓
Show Restart Button
       ↓
User Restarts ──► Install Update ──► Launch New Version
```

## 🛠️ Troubleshooting

### Common Issues:

1. **Update Server Not Accessible**
   - Check server is running: `npm run update-server`
   - Verify URL configuration in main.js
   - Check firewall/network settings

2. **No Updates Detected**
   - Verify version comparison logic
   - Check release files exist
   - Validate YAML file format

3. **Download Failures**
   - Check file permissions
   - Verify checksums match
   - Ensure sufficient disk space

4. **Installation Errors**
   - Run as administrator (Windows)
   - Check app not running multiple instances
   - Verify code signing certificates

### Debug Commands:

```bash
# Check server health
curl http://localhost:3001/health

# Test update endpoint
curl http://localhost:3001/update/1.0.0

# View server logs
npm run update-server

# Test update flow
npm run test-updates
```

## 📚 Additional Resources

- [electron-updater Documentation](https://www.electron.build/auto-update)
- [Electron Builder Guide](https://www.electron.build/)
- [Code Signing Guide](https://www.electron.build/code-signing)
- [GitHub Releases API](https://docs.github.com/en/rest/releases)

## 🎯 Future Enhancements

- **Delta Updates** - Download only changed files
- **Rollback Support** - Revert to previous version
- **Beta Channel** - Test updates before stable release
- **Silent Updates** - Background updates with user notification
- **Update Scheduling** - User-controlled update timing
- **Bandwidth Throttling** - Limit download speed
- **Multi-language Support** - Localized update messages

---

*This auto-update system provides a complete, production-ready solution for keeping MIC Browser Ultimate up-to-date with minimal user intervention while maintaining security and reliability.*