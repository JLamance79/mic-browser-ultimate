# GitHub Auto-Updater Setup

## Overview

MIC Browser Ultimate is now configured to use GitHub releases for automatic updates. This provides a reliable, secure way to distribute updates to users without requiring a separate update server.

## Configuration

### Auto-Updater Setup
The auto-updater is configured in `main.js`:

```javascript
autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'JLamance79',
    repo: 'mic-browser-ultimate'
});
```

### Package.json Configuration
The `package.json` includes publish configuration for GitHub:

```json
"publish": [
  {
    "provider": "github",
    "owner": "JLamance79",
    "repo": "mic-browser-ultimate",
    "releaseType": "release"
  }
]
```

## How It Works

### 1. **Update Detection**
- App checks GitHub releases every 30 minutes
- Compares current version with latest release
- Notifies user if update is available

### 2. **Update Process**
- User is prompted about available update
- Update downloads in background
- App restarts to apply update
- Automatic rollback if update fails

### 3. **Release Creation**
- GitHub Actions builds app for all platforms
- Creates GitHub release with binaries
- Auto-updater detects new release
- Users get notified automatically

## Creating Releases

### Using Release Helper Script

```bash
# Patch version (1.0.0 -> 1.0.1)
npm run version:patch

# Minor version (1.0.0 -> 1.1.0)
npm run version:minor

# Major version (1.0.0 -> 2.0.0)
npm run version:major

# Custom version
node release-helper.js version 1.5.0

# Build and publish automatically
npm run release:auto
```

### Manual Release Process

1. **Update Version**
   ```bash
   npm version patch  # or minor/major
   ```

2. **Create Git Tag**
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

3. **GitHub Actions Builds**
   - Automatically triggers on tag push
   - Builds for Windows, macOS, Linux
   - Creates GitHub release

4. **Auto-Updater Detects**
   - Users get update notification
   - Downloads and installs automatically

## GitHub Actions Workflow

The `.github/workflows/build-and-release.yml` file handles:

- **Multi-platform builds** (Windows, macOS, Linux)
- **Artifact uploading**
- **Release creation**
- **Asset publishing**

### Workflow Triggers
- **Tag Push**: `git push origin v*`
- **Manual Trigger**: GitHub Actions tab

## Testing the Setup

### Test Auto-Updater Configuration
```bash
node test-github-updater.js
```

This script:
- Verifies GitHub API access
- Checks for available updates
- Tests update download process
- Provides troubleshooting info

### Test Update Process
1. Create a test release
2. Run the app
3. Check console for update logs
4. Verify update notification appears

## File Structure

```
├── .github/
│   └── workflows/
│       └── build-and-release.yml    # GitHub Actions workflow
├── main.js                          # Auto-updater configuration
├── package.json                     # Publish configuration
├── release-helper.js                # Release automation script
└── test-github-updater.js          # Testing script
```

## Security Features

### Code Signing
- Windows: Authenticode signing
- macOS: Apple Developer ID
- Ensures update authenticity

### Update Verification
- Checksum verification
- Digital signature validation
- Rollback on failure

### Secure Downloads
- HTTPS-only downloads
- GitHub's CDN infrastructure
- Integrity checks

## Monitoring & Logging

### Auto-Updater Events
- `checking-for-update`
- `update-available`
- `update-not-available`
- `error`
- `download-progress`
- `update-downloaded`

### Logging Configuration
```javascript
autoUpdater.logger = console;
autoUpdater.logger.transports.file.level = 'info';
```

## Troubleshooting

### Common Issues

**404 Error - Repository Not Found**
- Verify repository name and owner
- Ensure repository is public
- Check if releases exist

**Network Errors**
- Check internet connectivity
- Verify GitHub API access
- Check firewall settings

**Update Not Detected**
- Ensure version number is higher
- Check release is published (not draft)
- Verify package.json version matches

**Download Failures**
- Check available disk space
- Verify file permissions
- Check antivirus interference

### Debug Commands

```bash
# Test GitHub API access
node test-github-updater.js

# Check current configuration
node release-helper.js current

# Verbose logging
DEBUG=electron-updater npm start
```

## Best Practices

### Version Management
- Use semantic versioning (semver)
- Include release notes
- Test releases before publishing

### Release Notes
- Document breaking changes
- List new features
- Include bug fixes

### Security
- Sign releases with valid certificates
- Use secure development practices
- Regularly update dependencies

## Integration with MIC Browser

The auto-updater is fully integrated with the MIC Browser Ultimate interface:

- **Status Indicators**: Shows update availability in UI
- **Progress Bars**: Displays download progress
- **User Notifications**: Clean update prompts
- **Background Updates**: Non-intrusive update process

## Environment Variables

```env
# GitHub token for private repositories (optional)
GH_TOKEN=your_github_token_here

# Code signing certificates (for production)
CSC_LINK=path_to_certificate.p12
CSC_KEY_PASSWORD=certificate_password
```

## Platform-Specific Notes

### Windows
- `.exe` installer with auto-update support
- Requires admin privileges for installation
- NSIS installer with custom UI

### macOS
- `.dmg` and `.zip` formats supported
- Notarization required for distribution
- Automatic quarantine handling

### Linux
- AppImage with built-in updater
- `.deb` and `.rpm` packages
- No admin privileges required

## Support

If you encounter issues with the auto-updater:

1. Check the console logs
2. Run the test script
3. Verify GitHub repository access
4. Check release configuration
5. Review GitHub Actions logs

The auto-updater provides a seamless update experience for MIC Browser Ultimate users while maintaining security and reliability.