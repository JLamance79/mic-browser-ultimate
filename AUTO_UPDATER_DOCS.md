# Auto-Updater System Documentation

## Overview

The MIC Browser Ultimate Auto-Updater system provides seamless, automatic updates to ensure users always have the latest features and security improvements. The system is built on top of `electron-updater` and provides a comprehensive set of features for managing application updates.

## Features

### Core Features
- **Automatic Update Checking**: Configurable periodic checks for new releases
- **Background Downloads**: Silent download of updates without interrupting user workflow
- **User Notifications**: Customizable notifications for update availability and progress
- **Manual Updates**: User-controlled update checking and installation
- **Settings Management**: Comprehensive preferences for update behavior
- **Progress Tracking**: Real-time download progress with visual indicators
- **Release Notes**: Display of changelog and release information
- **Error Handling**: Robust error recovery and user feedback
- **Security**: Signed updates with verification for security

### Update Channels
- **Stable Releases**: Production-ready versions (default)
- **Pre-release/Beta**: Early access to new features (optional)
- **Development**: Latest development builds (development only)

## Architecture

### Components

1. **AutoUpdater.js** - Main auto-updater logic and configuration
2. **UpdateNotificationUI.js** - User interface for update notifications
3. **Settings Integration** - Update preferences in main settings panel
4. **IPC Communication** - Secure communication between main and renderer processes

### Data Flow

```
Main Process (AutoUpdater.js)
    ↓
Periodic Check / Manual Check
    ↓
GitHub Releases API / Update Server
    ↓
Update Available? → User Notification
    ↓
Download Update (Background)
    ↓
Update Ready → User Choice
    ↓
Install & Restart
```

## Configuration

### Update Sources

The auto-updater is configured to check for updates from:

1. **GitHub Releases** (Primary)
   - Repository: `JLamance79/mic-browser-ultimate`
   - Automatic release detection
   - Asset verification

2. **Generic Update Server** (Fallback)
   - Custom update server endpoint
   - Configurable in `package.json`

### Build Configuration

In `package.json`:

```json
{
  "build": {
    "publish": [
      {
        "provider": "github",
        "owner": "JLamance79",
        "repo": "mic-browser-ultimate",
        "releaseType": "release"
      },
      {
        "provider": "generic",
        "url": "https://your-update-server.com/releases/"
      }
    ]
  }
}
```

## User Settings

### Available Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `autoDownload` | `true` | Automatically download updates when available |
| `autoInstall` | `false` | Install updates automatically on application quit |
| `checkOnStartup` | `true` | Check for updates when application starts |
| `checkInterval` | `4 hours` | How often to check for updates automatically |
| `notifyUser` | `true` | Show notifications when updates are available |
| `silentUpdates` | `false` | Download and install updates without user interaction |
| `allowPrerelease` | `false` | Include beta/pre-release versions in update checks |

### Settings Storage

Settings are stored in:
- **Windows**: `%APPDATA%\mic-browser-ultimate\auto-update-settings.json`
- **macOS**: `~/Library/Application Support/mic-browser-ultimate/auto-update-settings.json`
- **Linux**: `~/.config/mic-browser-ultimate/auto-update-settings.json`

## API Reference

### Main Process (AutoUpdater.js)

#### Methods

```javascript
// Initialize the auto-updater
await autoUpdater.initialize()

// Check for updates manually
await autoUpdater.checkForUpdates(manual = false)

// Download update
await autoUpdater.downloadUpdate()

// Install update and restart
autoUpdater.quitAndInstall()

// Update settings
await autoUpdater.updateSettings(newSettings)

// Get current status
const status = autoUpdater.getStatus()

// Enable/disable auto-updater
autoUpdater.setEnabled(enabled)
```

#### Events

```javascript
// Update checking started
autoUpdater.on('checking-for-update', () => {})

// Update available
autoUpdater.on('update-available', (info) => {})

// No update available
autoUpdater.on('update-not-available', (info) => {})

// Download progress
autoUpdater.on('download-progress', (progressObj) => {})

// Update downloaded and ready
autoUpdater.on('update-downloaded', (info) => {})

// Error occurred
autoUpdater.on('error', (error) => {})
```

### Renderer Process (UpdateNotificationUI.js)

#### Methods

```javascript
// Show update notification
updateNotificationUI.show()

// Hide update notification
updateNotificationUI.hide()

// Download update
await updateNotificationUI.downloadUpdate()

// Install update
await updateNotificationUI.installUpdate()

// Check for updates manually
await updateNotificationUI.checkForUpdates()

// Show/hide settings dialog
updateNotificationUI.showSettings()
updateNotificationUI.hideSettings()
```

### IPC API (Preload.js)

```javascript
// Check for updates
await window.electronAPI.updater.checkForUpdates()

// Download update
await window.electronAPI.updater.downloadUpdate()

// Install update and restart
await window.electronAPI.updater.quitAndInstall()

// Get update status
const status = await window.electronAPI.updater.getStatus()

// Get/update settings
const settings = await window.electronAPI.updater.getSettings()
await window.electronAPI.updater.updateSettings(newSettings)

// Listen for update events
window.electronAPI.updater.onUpdateEvent((event, data) => {
  console.log('Update event:', event, data)
})
```

## User Interface

### Update Notification

The update notification appears in the top-right corner of the application and includes:

- **Update information**: Version numbers, release notes
- **Action buttons**: Download, Install, Later, Settings
- **Progress indicator**: Download progress with percentage
- **Settings access**: Direct link to update preferences

### Settings Panel

The update settings are integrated into the main settings panel under the "Updates" tab:

- **Toggle switches**: For all boolean settings
- **Dropdown menus**: For interval selection
- **Action buttons**: Manual check, history, restart
- **Status information**: Current version, last check, update status

## Development

### Testing Updates

#### Development Mode

In development mode, the auto-updater is disabled by default to prevent interference with development workflow. To test updates:

1. **Create test builds**:
   ```bash
   npm run build
   ```

2. **Test update flow**:
   ```bash
   # Set environment to enable updates in dev
   NODE_ENV=production npm run dev
   ```

3. **Mock update server**: Use a local server to simulate updates

#### Production Testing

1. **Create release builds**:
   ```bash
   npm run build:release
   ```

2. **Test GitHub releases**: Create test releases in GitHub
3. **Verify update signatures**: Ensure code signing works correctly

### Release Process

1. **Version bump**: Update version in `package.json`
2. **Build release**: `npm run build:release`
3. **Create GitHub release**: Upload assets to GitHub
4. **Verify update**: Test update flow from previous version

### Code Signing

For security, all updates should be code signed:

#### Windows
```bash
# Configure code signing certificate
export CSC_LINK="path/to/certificate.p12"
export CSC_KEY_PASSWORD="certificate_password"
```

#### macOS
```bash
# Configure Apple Developer ID
export CSC_IDENTITY_AUTO_DISCOVERY=true
export APPLE_ID="your-apple-id"
export APPLE_ID_PASSWORD="app-specific-password"
```

## Troubleshooting

### Common Issues

#### Update Check Fails
- **Network connectivity**: Check internet connection
- **GitHub API limits**: Verify API rate limits
- **Firewall/proxy**: Check network restrictions

#### Download Fails
- **Insufficient disk space**: Free up storage
- **Permissions**: Check write permissions
- **Network interruption**: Retry download

#### Installation Fails
- **Administrator privileges**: Run as administrator (Windows)
- **File locks**: Close all application instances
- **Antivirus interference**: Whitelist application

### Debugging

#### Enable Debug Logs
```javascript
// In development
autoUpdater.logger = console
autoUpdater.logger.transports.file.level = 'debug'
```

#### Check Update Status
```javascript
// Get detailed status information
const status = await window.electronAPI.updater.getStatus()
console.log('Update status:', status)
```

#### Manual Update Check
Use the "Check for Updates" button in settings to trigger manual checks and see detailed error messages.

### Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `ERR_UPDATER_INVALID_RELEASE_FEED` | Invalid update feed URL | Check repository configuration |
| `ERR_UPDATER_NO_PUBLISHED_VERSIONS` | No releases found | Verify GitHub releases exist |
| `ERR_UPDATER_DOWNLOAD_FAILED` | Download failed | Check network and retry |
| `ERR_UPDATER_INSTALL_FAILED` | Installation failed | Check permissions and restart |

## Security Considerations

### Update Verification
- All updates are verified using cryptographic signatures
- Updates are only downloaded from trusted sources
- Man-in-the-middle attack protection

### Permissions
- Updates require appropriate system permissions
- User consent for installation (unless silent mode)
- Secure storage of update files

### Privacy
- No personal data is transmitted during update checks
- Only version and platform information is shared
- Update preferences are stored locally

## Best Practices

### For Users
1. Keep auto-updates enabled for security
2. Restart promptly when updates are ready
3. Review release notes for important changes
4. Backup important data before major updates

### For Developers
1. Test updates thoroughly before release
2. Provide detailed release notes
3. Use semantic versioning
4. Sign all releases for security
5. Monitor update success rates

## FAQ

### Q: How often does the app check for updates?
A: By default, every 4 hours. This can be configured in settings from 1 hour to 24 hours.

### Q: Can I disable automatic updates?
A: Yes, you can disable auto-download and auto-install in the update settings. Manual checking will still be available.

### Q: Are my settings preserved during updates?
A: Yes, all user settings and data are preserved during updates.

### Q: What happens if an update fails?
A: The app will continue running the current version. You can retry the update manually or wait for the next automatic check.

### Q: Can I roll back to a previous version?
A: Currently, rollback is not supported. However, you can download and install previous versions manually.

### Q: Do updates work offline?
A: No, an internet connection is required to check for and download updates. Installation can proceed offline once downloaded.

## Support

For update-related issues:

1. **Check Settings**: Verify update settings are configured correctly
2. **Manual Check**: Use "Check for Updates" button for detailed error messages
3. **Logs**: Check application logs for update-related errors
4. **GitHub Issues**: Report bugs on the project repository
5. **Documentation**: Refer to this guide for troubleshooting steps

---

**Last Updated**: October 2025  
**Version**: 1.0.0  
**Author**: MIC Browser Ultimate Team