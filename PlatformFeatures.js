/**
 * Platform-Specific Features Manager for MIC Browser Ultimate
 * Handles Windows, macOS, and Linux native integrations
 */

const { app, BrowserWindow, Menu, Tray, nativeImage, shell } = require('electron');
const path = require('path');
const os = require('os');

class PlatformFeatures {
    constructor(mainWindow) {
        this.mainWindow = mainWindow;
        this.platform = process.platform;
        this.tray = null;
        this.touchBar = null;
        this.jumpList = [];
        
        this.initializePlatformFeatures();
    }

    initializePlatformFeatures() {
        console.log(`🖥️  Initializing platform features for: ${this.platform}`);
        
        switch (this.platform) {
            case 'win32':
                this.setupWindowsFeatures();
                break;
            case 'darwin':
                this.setupMacOSFeatures();
                break;
            case 'linux':
                this.setupLinuxFeatures();
                break;
            default:
                console.log('Platform-specific features not available for this OS');
        }
    }

    // Windows-specific features
    setupWindowsFeatures() {
        console.log('🪟 Setting up Windows features...');
        
        // Jump List support
        this.setupWindowsJumpList();
        
        // Thumbnail toolbar
        this.setupWindowsThumbnailToolbar();
        
        // Windows notifications
        this.setupWindowsNotifications();
        
        // System tray integration
        this.setupWindowsTray();
        
        // Progress bar in taskbar
        this.setupWindowsProgressBar();
        
        console.log('✅ Windows features initialized');
    }

    setupWindowsJumpList() {
        const jumpList = [
            {
                type: 'custom',
                name: 'Quick Actions',
                items: [
                    {
                        type: 'task',
                        title: 'New Tab',
                        description: 'Open a new tab',
                        program: process.execPath,
                        args: '--new-tab',
                        iconPath: process.execPath,
                        iconIndex: 0
                    },
                    {
                        type: 'task',
                        title: 'Scan Document',
                        description: 'Open document scanner',
                        program: process.execPath,
                        args: '--scan-document',
                        iconPath: process.execPath,
                        iconIndex: 0
                    },
                    {
                        type: 'task',
                        title: 'Voice Assistant',
                        description: 'Start voice assistant',
                        program: process.execPath,
                        args: '--voice-assistant',
                        iconPath: process.execPath,
                        iconIndex: 0
                    }
                ]
            },
            {
                type: 'recent' // Recent documents will be added automatically
            },
            {
                type: 'tasks',
                items: [
                    {
                        type: 'task',
                        title: 'Check for Updates',
                        description: 'Check for application updates',
                        program: process.execPath,
                        args: '--check-updates'
                    }
                ]
            }
        ];

        try {
            app.setJumpList(jumpList);
            console.log('✅ Windows Jump List configured');
        } catch (error) {
            console.error('❌ Failed to set Jump List:', error);
        }
    }

    setupWindowsThumbnailToolbar() {
        if (!this.mainWindow) return;

        const iconPath = path.join(__dirname, 'assets', 'icons');
        
        const thumbnailButtons = [
            {
                tooltip: 'New Tab',
                icon: nativeImage.createFromPath(path.join(iconPath, 'new-tab.png')),
                click: () => {
                    this.mainWindow.webContents.send('thumbnail-action', 'new-tab');
                }
            },
            {
                tooltip: 'Previous Tab',
                icon: nativeImage.createFromPath(path.join(iconPath, 'prev-tab.png')),
                click: () => {
                    this.mainWindow.webContents.send('thumbnail-action', 'prev-tab');
                }
            },
            {
                tooltip: 'Next Tab',
                icon: nativeImage.createFromPath(path.join(iconPath, 'next-tab.png')),
                click: () => {
                    this.mainWindow.webContents.send('thumbnail-action', 'next-tab');
                }
            },
            {
                tooltip: 'Voice Assistant',
                icon: nativeImage.createFromPath(path.join(iconPath, 'voice.png')),
                click: () => {
                    this.mainWindow.webContents.send('thumbnail-action', 'voice-assistant');
                }
            }
        ];

        this.mainWindow.on('ready-to-show', () => {
            try {
                this.mainWindow.setThumbnailToolbar(thumbnailButtons);
                console.log('✅ Windows thumbnail toolbar configured');
            } catch (error) {
                console.error('❌ Failed to set thumbnail toolbar:', error);
            }
        });
    }

    setupWindowsNotifications() {
        // Windows notifications are handled by the main notification system
        // but we can set Windows-specific options here
        
        // Set app user model ID for proper notification grouping
        if (app.setAppUserModelId) {
            app.setAppUserModelId('com.micbrowser.ultimate');
        }
        
        console.log('✅ Windows notifications configured');
    }

    setupWindowsTray() {
        const iconPath = path.join(__dirname, 'assets', 'icons', 'tray-icon.png');
        
        try {
            this.tray = new Tray(nativeImage.createFromPath(iconPath));
            
            const contextMenu = Menu.buildFromTemplate([
                {
                    label: 'MIC Browser Ultimate',
                    type: 'normal',
                    enabled: false
                },
                { type: 'separator' },
                {
                    label: 'Show Window',
                    click: () => {
                        this.mainWindow.show();
                        this.mainWindow.focus();
                    }
                },
                {
                    label: 'New Tab',
                    click: () => {
                        this.mainWindow.webContents.send('tray-action', 'new-tab');
                    }
                },
                {
                    label: 'Scan Document',
                    click: () => {
                        this.mainWindow.webContents.send('tray-action', 'scan-document');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Settings',
                    click: () => {
                        this.mainWindow.webContents.send('tray-action', 'settings');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Quit',
                    click: () => {
                        app.quit();
                    }
                }
            ]);
            
            this.tray.setContextMenu(contextMenu);
            this.tray.setToolTip('MIC Browser Ultimate');
            
            this.tray.on('click', () => {
                this.mainWindow.isVisible() ? this.mainWindow.hide() : this.mainWindow.show();
            });
            
            console.log('✅ Windows system tray configured');
        } catch (error) {
            console.error('❌ Failed to create system tray:', error);
        }
    }

    setupWindowsProgressBar() {
        // Progress bar methods for Windows taskbar
        this.setProgressBar = (progress) => {
            if (this.mainWindow && progress >= 0 && progress <= 1) {
                this.mainWindow.setProgressBar(progress);
            }
        };

        this.clearProgressBar = () => {
            if (this.mainWindow) {
                this.mainWindow.setProgressBar(-1);
            }
        };

        console.log('✅ Windows progress bar configured');
    }

    // macOS-specific features
    setupMacOSFeatures() {
        console.log('🍎 Setting up macOS features...');
        
        // Touch Bar support
        this.setupMacOSTouchBar();
        
        // Dock integration
        this.setupMacOSDock();
        
        // Native notifications
        this.setupMacOSNotifications();
        
        // Menu bar integration
        this.setupMacOSMenuBar();
        
        console.log('✅ macOS features initialized');
    }

    setupMacOSTouchBar() {
        if (!this.mainWindow) return;

        try {
            const { TouchBar } = require('electron');
            const { TouchBarButton, TouchBarSpacer } = TouchBar;

            const touchBar = new TouchBar({
                items: [
                    new TouchBarButton({
                        label: '🆕 New Tab',
                        backgroundColor: '#3b82f6',
                        click: () => {
                            this.mainWindow.webContents.send('touchbar-action', 'new-tab');
                        }
                    }),
                    new TouchBarSpacer({ size: 'small' }),
                    new TouchBarButton({
                        label: '📄 Scan',
                        backgroundColor: '#10b981',
                        click: () => {
                            this.mainWindow.webContents.send('touchbar-action', 'scan-document');
                        }
                    }),
                    new TouchBarSpacer({ size: 'small' }),
                    new TouchBarButton({
                        label: '🎤 Voice',
                        backgroundColor: '#f59e0b',
                        click: () => {
                            this.mainWindow.webContents.send('touchbar-action', 'voice-assistant');
                        }
                    }),
                    new TouchBarSpacer({ size: 'small' }),
                    new TouchBarButton({
                        label: '🔍 Analyze',
                        backgroundColor: '#8b5cf6',
                        click: () => {
                            this.mainWindow.webContents.send('touchbar-action', 'analyze-page');
                        }
                    }),
                    new TouchBarSpacer({ size: 'flexible' }),
                    new TouchBarButton({
                        label: '⚙️ Settings',
                        click: () => {
                            this.mainWindow.webContents.send('touchbar-action', 'settings');
                        }
                    })
                ]
            });

            this.mainWindow.setTouchBar(touchBar);
            this.touchBar = touchBar;
            console.log('✅ macOS Touch Bar configured');
        } catch (error) {
            console.error('❌ Failed to set up Touch Bar:', error);
        }
    }

    setupMacOSDock() {
        // Dock menu
        const dockMenu = Menu.buildFromTemplate([
            {
                label: 'New Tab',
                click: () => {
                    this.mainWindow.webContents.send('dock-action', 'new-tab');
                }
            },
            {
                label: 'Scan Document',
                click: () => {
                    this.mainWindow.webContents.send('dock-action', 'scan-document');
                }
            },
            {
                label: 'Voice Assistant',
                click: () => {
                    this.mainWindow.webContents.send('dock-action', 'voice-assistant');
                }
            }
        ]);

        app.dock.setMenu(dockMenu);

        // Dock badge (for notifications count)
        this.setBadgeCount = (count) => {
            app.dock.setBadge(count > 0 ? count.toString() : '');
        };

        // Dock bounce
        this.bounceDock = (type = 'informational') => {
            app.dock.bounce(type);
        };

        console.log('✅ macOS Dock integration configured');
    }

    setupMacOSNotifications() {
        // macOS-specific notification settings
        console.log('✅ macOS notifications configured');
    }

    setupMacOSMenuBar() {
        // Application menu for macOS
        const template = [
            {
                label: app.getName(),
                submenu: [
                    { role: 'about' },
                    { type: 'separator' },
                    {
                        label: 'Preferences',
                        accelerator: 'Cmd+,',
                        click: () => {
                            this.mainWindow.webContents.send('menu-action', 'preferences');
                        }
                    },
                    { type: 'separator' },
                    { role: 'services' },
                    { type: 'separator' },
                    { role: 'hide' },
                    { role: 'hideothers' },
                    { role: 'unhide' },
                    { type: 'separator' },
                    { role: 'quit' }
                ]
            },
            {
                label: 'File',
                submenu: [
                    {
                        label: 'New Tab',
                        accelerator: 'Cmd+T',
                        click: () => {
                            this.mainWindow.webContents.send('menu-action', 'new-tab');
                        }
                    },
                    {
                        label: 'Close Tab',
                        accelerator: 'Cmd+W',
                        click: () => {
                            this.mainWindow.webContents.send('menu-action', 'close-tab');
                        }
                    }
                ]
            },
            {
                label: 'Tools',
                submenu: [
                    {
                        label: 'Scan Document',
                        accelerator: 'Cmd+Shift+S',
                        click: () => {
                            this.mainWindow.webContents.send('menu-action', 'scan-document');
                        }
                    },
                    {
                        label: 'Voice Assistant',
                        accelerator: 'Cmd+Shift+V',
                        click: () => {
                            this.mainWindow.webContents.send('menu-action', 'voice-assistant');
                        }
                    },
                    {
                        label: 'Analyze Page',
                        accelerator: 'Cmd+Shift+A',
                        click: () => {
                            this.mainWindow.webContents.send('menu-action', 'analyze-page');
                        }
                    }
                ]
            },
            {
                label: 'Window',
                submenu: [
                    { role: 'minimize' },
                    { role: 'close' },
                    { role: 'zoom' },
                    { type: 'separator' },
                    { role: 'front' }
                ]
            }
        ];

        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
        
        console.log('✅ macOS menu bar configured');
    }

    // Linux-specific features
    setupLinuxFeatures() {
        console.log('🐧 Setting up Linux features...');
        
        // Unity launcher integration
        this.setupLinuxUnityLauncher();
        
        // Desktop notifications
        this.setupLinuxNotifications();
        
        // App indicators
        this.setupLinuxAppIndicators();
        
        // System tray
        this.setupLinuxTray();
        
        console.log('✅ Linux features initialized');
    }

    setupLinuxUnityLauncher() {
        // Unity launcher quicklist
        if (app.setJumpList) {
            const jumpList = [
                {
                    type: 'custom',
                    name: 'Actions',
                    items: [
                        {
                            type: 'task',
                            title: 'New Tab',
                            description: 'Open a new tab',
                            program: process.execPath,
                            args: '--new-tab'
                        },
                        {
                            type: 'task',
                            title: 'Scan Document',
                            description: 'Open document scanner',
                            program: process.execPath,
                            args: '--scan-document'
                        }
                    ]
                }
            ];

            try {
                app.setJumpList(jumpList);
                console.log('✅ Linux Unity launcher configured');
            } catch (error) {
                console.log('ℹ️  Unity launcher not available');
            }
        }
    }

    setupLinuxNotifications() {
        // Linux desktop notifications
        console.log('✅ Linux notifications configured');
    }

    setupLinuxAppIndicators() {
        // System tray/app indicator for Linux
        this.setupLinuxTray();
    }

    setupLinuxTray() {
        const iconPath = path.join(__dirname, 'assets', 'icons', 'tray-icon.png');
        
        try {
            this.tray = new Tray(nativeImage.createFromPath(iconPath));
            
            const contextMenu = Menu.buildFromTemplate([
                {
                    label: 'MIC Browser Ultimate',
                    type: 'normal',
                    enabled: false
                },
                { type: 'separator' },
                {
                    label: 'Show Window',
                    click: () => {
                        this.mainWindow.show();
                        this.mainWindow.focus();
                    }
                },
                {
                    label: 'New Tab',
                    click: () => {
                        this.mainWindow.webContents.send('tray-action', 'new-tab');
                    }
                },
                {
                    label: 'Scan Document',
                    click: () => {
                        this.mainWindow.webContents.send('tray-action', 'scan-document');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Quit',
                    click: () => {
                        app.quit();
                    }
                }
            ]);
            
            this.tray.setContextMenu(contextMenu);
            this.tray.setToolTip('MIC Browser Ultimate');
            
            console.log('✅ Linux system tray configured');
        } catch (error) {
            console.error('❌ Failed to create system tray:', error);
        }
    }

    // Common utility methods
    showNotification(title, body, options = {}) {
        const notification = {
            title,
            body,
            icon: path.join(__dirname, 'assets', 'icons', 'notification-icon.png'),
            ...options
        };

        // Platform-specific notification enhancements
        if (this.platform === 'win32') {
            notification.toastXml = this.generateWindowsToastXml(title, body);
        } else if (this.platform === 'darwin') {
            notification.sound = 'default';
        }

        return new Notification(notification);
    }

    generateWindowsToastXml(title, body) {
        return `
        <toast>
            <visual>
                <binding template="ToastGeneric">
                    <text>${title}</text>
                    <text>${body}</text>
                    <image placement="appLogoOverride" src="${path.join(__dirname, 'assets', 'icons', 'notification-icon.png')}" />
                </binding>
            </visual>
            <actions>
                <action content="View" arguments="view" />
                <action content="Dismiss" arguments="dismiss" />
            </actions>
        </toast>`;
    }

    updateProgress(progress) {
        if (this.platform === 'win32') {
            this.setProgressBar(progress);
        } else if (this.platform === 'darwin') {
            // macOS dock progress
            if (app.dock) {
                app.dock.setBadge(Math.round(progress * 100) + '%');
            }
        }
    }

    clearProgress() {
        if (this.platform === 'win32') {
            this.clearProgressBar();
        } else if (this.platform === 'darwin') {
            if (app.dock) {
                app.dock.setBadge('');
            }
        }
    }

    destroy() {
        if (this.tray) {
            this.tray.destroy();
            this.tray = null;
        }
        
        if (this.platform === 'win32') {
            app.setJumpList(null);
        }
        
        console.log('🧹 Platform features cleaned up');
    }
}

module.exports = PlatformFeatures;