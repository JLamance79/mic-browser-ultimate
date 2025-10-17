# Native Notification System Documentation

## Overview

The Native Notification System provides comprehensive cross-platform native notification capabilities for MIC Browser Ultimate. This system integrates deeply with operating system notification centers while maintaining strict privacy controls and user preferences.

## Features

### 🔔 Core Notification Capabilities
- **Native System Integration**: Full integration with Windows, macOS, and Linux notification systems
- **Cross-Platform Support**: Consistent API across all supported platforms
- **Rich Notification Types**: System, security, updates, chat, downloads, errors, and success notifications
- **Interactive Notifications**: Support for action buttons and click handlers
- **Notification Templates**: Pre-configured templates for different notification types
- **Sound Management**: Customizable sound settings per category
- **Badge Support**: App icon badge notifications (macOS)

### 🛡️ Privacy and Security
- **Privacy-First Design**: User consent required for all notification features
- **Granular Controls**: Per-category enable/disable settings
- **Privacy Mode**: Hide sensitive content in notifications
- **Local Data Only**: All notification history stored locally
- **Opt-Out Options**: Complete opt-out capabilities for all features
- **No External Tracking**: No data sent to external servers

### ⚙️ Advanced Features
- **Notification History**: Local storage of notification history with search
- **Concurrent Limiting**: Configurable maximum concurrent notifications
- **Auto-Close Timers**: Customizable auto-close duration
- **Sound Customization**: Per-category sound enable/disable
- **System Integration**: Platform-specific features (Jump Lists, Dock badges, etc.)
- **Development Support**: Special handling for development vs production modes

## Architecture

### Component Structure
```
NativeNotificationManager.js     # Core notification system
├── NotificationTemplates        # Predefined notification templates
├── CategoryManager             # Notification category handling
├── HistoryManager             # Notification history management
├── SettingsManager            # User preference management
└── PlatformIntegration        # OS-specific features
```

### Integration Points
- **Main Process**: `NativeNotificationManager` initialization and IPC handlers
- **Preload Script**: Secure API bridge for renderer process
- **Renderer Process**: Settings UI and notification management
- **Settings Panel**: Comprehensive user preference controls

## API Reference

### Core Notification Methods

#### `showNotification(options)`
Show a custom notification with full options.

```javascript
const result = await window.electronAPI.notifications.show({
    title: "Custom Notification",
    body: "This is a custom notification message",
    icon: "/path/to/icon.png",
    urgency: "normal", // low, normal, critical
    category: "system",
    template: "system",
    actions: [
        { text: "View", action: { type: "app" } },
        { text: "Dismiss", action: { type: "close" } }
    ],
    clickAction: { type: "url", url: "https://example.com" },
    silent: false,
    tag: "unique-tag"
});
```

#### Predefined Notification Types

##### System Notifications
```javascript
await window.electronAPI.notifications.showSystem(
    "System Update",
    "MIC Browser Ultimate has been updated to version 2.0.0"
);
```

##### Security Alerts
```javascript
await window.electronAPI.notifications.showSecurity(
    "Security Alert",
    "Suspicious activity detected on your account",
    { urgency: "critical" }
);
```

##### Update Notifications
```javascript
await window.electronAPI.notifications.showUpdate(
    "Update Available",
    "Version 2.1.0 is now available for download"
);
```

##### Chat Messages
```javascript
await window.electronAPI.notifications.showChat(
    "New Message",
    "You have a new message from AI Assistant"
);
```

##### Download Notifications
```javascript
await window.electronAPI.notifications.showDownload(
    "Download Complete",
    "document.pdf has been downloaded successfully"
);
```

##### Error Notifications
```javascript
await window.electronAPI.notifications.showError(
    "Operation Failed",
    "Failed to save document. Please try again."
);
```

##### Success Notifications
```javascript
await window.electronAPI.notifications.showSuccess(
    "Operation Complete",
    "Document has been saved successfully"
);
```

### Notification Management

#### Close Notifications
```javascript
// Close specific notification
await window.electronAPI.notifications.close(notificationId);

// Close all notifications
await window.electronAPI.notifications.closeAll();
```

#### Settings Management
```javascript
// Get current settings
const result = await window.electronAPI.notifications.getSettings();
console.log(result.settings);

// Update settings
await window.electronAPI.notifications.updateSettings({
    enabled: true,
    soundEnabled: true,
    privacyMode: false,
    duration: 5000,
    categories: {
        system: { enabled: true, sound: true },
        security: { enabled: true, sound: true }
    }
});
```

#### History Management
```javascript
// Get notification history
const result = await window.electronAPI.notifications.getHistory();
console.log(result.history);

// Mark notification as read
await window.electronAPI.notifications.markAsRead(notificationId);

// Clear all history
await window.electronAPI.notifications.clearHistory();
```

#### System Information
```javascript
const result = await window.electronAPI.notifications.getInfo();
console.log({
    supported: result.info.supported,
    enabled: result.info.enabled,
    activeCount: result.info.activeCount,
    unreadCount: result.info.unreadCount
});
```

### Event Listeners

#### Notification Events
```javascript
// Listen for notification clicks
window.electronAPI.notifications.onClicked((event, data) => {
    console.log('Notification clicked:', data.notificationId);
});

// Listen for notification closure
window.electronAPI.notifications.onClosed((event, data) => {
    console.log('Notification closed:', data.notificationId);
});

// Listen for notification actions
window.electronAPI.notifications.onAction((event, data) => {
    console.log('Notification action:', data.actionIndex);
});

// Listen for settings updates
window.electronAPI.notifications.onSettingsUpdated((event, settings) => {
    console.log('Settings updated:', settings);
});

// Listen for history updates
window.electronAPI.notifications.onHistoryUpdated((event) => {
    console.log('History updated');
});
```

#### Cleanup
```javascript
// Remove all notification event listeners
window.electronAPI.notifications.removeAllListeners();
```

## Configuration

### Default Settings
```javascript
{
    enabled: true,
    soundEnabled: true,
    badgeEnabled: true,
    urgentEnabled: true,
    position: 'topRight',
    duration: 5000,
    maxConcurrent: 5,
    enableHistory: true,
    enableActionButtons: true,
    enableSystemIntegration: true,
    privacyMode: false,
    categories: {
        system: { enabled: true, sound: true },
        security: { enabled: true, sound: true },
        updates: { enabled: true, sound: false },
        chat: { enabled: true, sound: true },
        downloads: { enabled: true, sound: false },
        errors: { enabled: true, sound: true },
        achievements: { enabled: true, sound: false }
    }
}
```

### Category Configuration
Each notification category can be individually configured:

- **enabled**: Whether notifications for this category are shown
- **sound**: Whether sounds are played for this category

### Duration Settings
- **0**: Never auto-close
- **3000**: 3 seconds
- **5000**: 5 seconds (default)
- **10000**: 10 seconds
- **15000**: 15 seconds
- **30000**: 30 seconds

## Platform-Specific Features

### Windows
- **Toast Notifications**: Full Windows 10/11 toast notification support
- **Action Center Integration**: Notifications appear in Windows Action Center
- **App User Model ID**: Proper app identification for notification grouping
- **Progress Bar**: Taskbar progress indication support

### macOS
- **Notification Center**: Full macOS Notification Center integration
- **Badge Notifications**: Dock icon badge count
- **Sounds**: System sound integration
- **Critical Alerts**: Support for critical alert permissions

### Linux
- **libnotify**: Standard Linux notification support
- **Desktop Environment**: Integration with GNOME, KDE, etc.
- **Icon Support**: Custom notification icons
- **Sound Support**: Desktop environment sound integration

## Security Considerations

### Data Privacy
- **Local Storage Only**: All notification data stored locally
- **No External Communication**: No data sent to external servers
- **User Consent**: Explicit user consent required for all features
- **Privacy Mode**: Sensitive content can be hidden

### Permission Model
- **Opt-In by Default**: Users must explicitly enable notifications
- **Granular Control**: Per-category permission controls
- **Easy Opt-Out**: Simple disable options for all features
- **Transparent Settings**: Clear indication of what data is collected

### Security Features
- **Input Validation**: All notification content validated and sanitized
- **XSS Prevention**: Protection against cross-site scripting in notifications
- **Permission Checks**: Runtime permission validation
- **Safe Defaults**: Secure default configuration

## Troubleshooting

### Common Issues

#### Notifications Not Appearing
1. **Check System Support**:
   ```javascript
   const info = await window.electronAPI.notifications.getInfo();
   console.log('Supported:', info.supported);
   ```

2. **Verify Settings**:
   - Check if notifications are enabled in app settings
   - Verify category-specific settings
   - Check system notification permissions

3. **Platform-Specific Checks**:
   - **Windows**: Ensure Windows notifications are enabled
   - **macOS**: Check Notification Center permissions
   - **Linux**: Verify libnotify installation

#### Sounds Not Playing
1. **Check Sound Settings**:
   - Verify global sound setting is enabled
   - Check category-specific sound settings
   - Ensure system volume is not muted

2. **Platform Audio**:
   - Verify system sound settings
   - Check application audio permissions

#### History Not Saving
1. **Check History Setting**:
   ```javascript
   const settings = await window.electronAPI.notifications.getSettings();
   console.log('History enabled:', settings.enableHistory);
   ```

2. **Storage Permissions**:
   - Verify app has write permissions to user data directory
   - Check available disk space

### Debug Mode
Enable debug logging by setting the environment variable:
```bash
DEBUG_NOTIFICATIONS=true
```

### Error Reporting
All notification errors are logged to the console and can be captured through the crash reporting system.

## Best Practices

### Notification Design
1. **Clear Titles**: Use descriptive, concise titles
2. **Helpful Content**: Provide actionable information in the body
3. **Appropriate Urgency**: Use correct urgency levels
4. **Consistent Categories**: Use appropriate categories for proper filtering

### User Experience
1. **Respect User Preferences**: Always honor user notification settings
2. **Provide Controls**: Give users granular control over notifications
3. **Avoid Spam**: Don't overwhelm users with too many notifications
4. **Test Thoroughly**: Test notifications on all target platforms

### Performance
1. **Limit Concurrent**: Respect maximum concurrent notification limits
2. **Clean Up**: Properly clean up notification history
3. **Efficient Storage**: Use appropriate data retention policies
4. **Resource Management**: Monitor notification system resource usage

## Development Guidelines

### Testing Notifications
```javascript
// Test notification in development
async function testNotification() {
    await window.electronAPI.notifications.showSystem(
        "Development Test",
        "Testing notification system",
        { urgency: "low" }
    );
}
```

### Error Handling
```javascript
try {
    const result = await window.electronAPI.notifications.showSystem(title, body);
    if (!result.success) {
        console.error('Notification failed:', result.error);
    }
} catch (error) {
    console.error('Notification error:', error);
}
```

### Integration with Other Systems
```javascript
// Integrate with crash reporting
if (crashDetected) {
    await window.electronAPI.notifications.showError(
        "Application Error",
        "An error has been detected and reported"
    );
}

// Integrate with auto-updater
if (updateAvailable) {
    await window.electronAPI.notifications.showUpdate(
        "Update Available",
        `Version ${newVersion} is ready to install`
    );
}
```

## Future Enhancements

### Planned Features
- **Rich Media**: Support for images and videos in notifications
- **Scheduled Notifications**: Ability to schedule notifications for later
- **Notification Groups**: Grouping related notifications
- **Custom Templates**: User-defined notification templates
- **Analytics**: Notification interaction analytics
- **Sync Across Devices**: Cross-device notification synchronization

### Platform Roadmap
- **Enhanced Windows Integration**: Windows Timeline integration
- **macOS Extensions**: Notification service extensions
- **Linux Desktop**: Enhanced desktop environment integration
- **Mobile Notifications**: Future mobile platform support

## Support

### Documentation
- **API Reference**: Complete API documentation
- **Examples**: Comprehensive usage examples
- **Platform Guides**: Platform-specific implementation guides

### Community
- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: Community discussions and support
- **Contributing**: Guidelines for contributing to the notification system

---

**Note**: This notification system is designed with privacy and user control as top priorities. All features respect user preferences and provide transparent control over notification behavior.