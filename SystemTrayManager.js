/**
 * System Tray Manager for MIC Browser Ultimate
 * Provides system tray integration for background operation
 * Includes context menu, notifications, and quick actions
 */

const { Tray, Menu, nativeImage, app, BrowserWindow, shell } = require('electron');
const path = require('path');
const fs = require('fs');

class SystemTrayManager {
    constructor(mainWindow) {
        this.mainWindow = mainWindow;
        this.tray = null;
        this.isQuitting = false;
        this.settings = {
            enableTray: true,
            minimizeToTray: true,
            closeToTray: true,
            startMinimized: false,
            showNotifications: true,
            quickActions: {
                search: true,
                chat: true,
                ocr: true,
                settings: true
            }
        };
        
        this.statistics = {
            trayClicks: 0,
            menuItemClicks: 0,
            quickActions: 0,
            lastAccessed: null
        };

        console.log('[SystemTray] Initializing system tray manager...');
    }

    /**
     * Initialize the system tray
     */
    async initialize() {
        try {
            // Load settings
            await this.loadSettings();
            
            if (!this.settings.enableTray) {
                console.log('[SystemTray] System tray disabled in settings');
                return false;
            }

            // Create tray icon
            this.createTray();
            
            // Setup event handlers
            this.setupEventHandlers();
            
            // Setup window management
            this.setupWindowManagement();
            
            console.log('[SystemTray] System tray initialized successfully');
            return true;

        } catch (error) {
            console.error('[SystemTray] Failed to initialize:', error);
            return false;
        }
    }

    /**
     * Create the system tray icon and menu
     */
    createTray() {
        try {
            // Create tray icon
            const iconPath = this.getTrayIcon();
            this.tray = new Tray(iconPath);
            
            // Set tooltip
            this.tray.setToolTip('MIC Browser Ultimate');
            
            // Create context menu
            this.updateContextMenu();
            
            console.log('[SystemTray] Tray icon created');

        } catch (error) {
            console.error('[SystemTray] Failed to create tray:', error);
            throw error;
        }
    }

    /**
     * Get appropriate tray icon based on platform
     */
    getTrayIcon() {
        const platform = process.platform;
        let iconName;

        if (platform === 'darwin') {
            // macOS prefers template icons
            iconName = 'tray-iconTemplate.png';
        } else if (platform === 'win32') {
            // Windows ICO format
            iconName = 'tray-icon.ico';
        } else {
            // Linux PNG
            iconName = 'tray-icon.png';
        }

        const iconPath = path.join(__dirname, 'assets', 'icons', iconName);
        
        // If specific icon doesn't exist, create a simple one
        if (!fs.existsSync(iconPath)) {
            return this.createFallbackIcon();
        }

        return nativeImage.createFromPath(iconPath);
    }

    /**
     * Create a fallback icon if none exists
     */
    createFallbackIcon() {
        try {
            // Create a simple 16x16 icon programmatically
            const canvas = require('canvas');
            const canvasInstance = canvas.createCanvas(16, 16);
            const ctx = canvasInstance.getContext('2d');
            
            // Draw a simple icon
            ctx.fillStyle = '#2196F3';
            ctx.fillRect(0, 0, 16, 16);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(2, 2, 12, 12);
            ctx.fillStyle = '#2196F3';
            ctx.fillText('M', 4, 12);
            
            const buffer = canvasInstance.toBuffer('image/png');
            return nativeImage.createFromBuffer(buffer);

        } catch (error) {
            // Final fallback - use empty image
            console.warn('[SystemTray] Using empty fallback icon:', error.message);
            return nativeImage.createEmpty();
        }
    }

    /**
     * Update the context menu
     */
    updateContextMenu() {
        const template = [
            {
                label: 'Show MIC Browser',
                click: () => this.showWindow()
            },
            {
                type: 'separator'
            }
        ];

        // Add quick actions if enabled
        if (this.settings.quickActions.search) {
            template.push({
                label: 'Quick Search',
                submenu: [
                    {
                        label: 'Search Web',
                        click: () => this.triggerQuickAction('search', { type: 'web' })
                    },
                    {
                        label: 'Search Images',
                        click: () => this.triggerQuickAction('search', { type: 'images' })
                    },
                    {
                        label: 'Search News',
                        click: () => this.triggerQuickAction('search', { type: 'news' })
                    }
                ]
            });
        }

        if (this.settings.quickActions.chat) {
            template.push({
                label: 'Quick Chat',
                submenu: [
                    {
                        label: 'Open General Chat',
                        click: () => this.triggerQuickAction('chat', { room: 'general' })
                    },
                    {
                        label: 'Open Support Chat',
                        click: () => this.triggerQuickAction('chat', { room: 'support' })
                    }
                ]
            });
        }

        if (this.settings.quickActions.ocr) {
            template.push({
                label: 'OCR Actions',
                submenu: [
                    {
                        label: 'OCR from Clipboard',
                        click: () => this.triggerQuickAction('ocr', { source: 'clipboard' })
                    },
                    {
                        label: 'OCR from Screen',
                        click: () => this.triggerQuickAction('ocr', { source: 'screen' })
                    }
                ]
            });
        }

        // Add separator before system actions
        template.push({ type: 'separator' });

        // System actions
        template.push({
            label: 'Statistics',
            click: () => this.showStatistics()
        });

        if (this.settings.quickActions.settings) {
            template.push({
                label: 'Settings',
                click: () => this.openSettings()
            });
        }

        template.push({
            label: 'About',
            click: () => this.showAbout()
        });

        template.push({ type: 'separator' });

        template.push({
            label: 'Quit',
            click: () => this.quitApplication()
        });

        const contextMenu = Menu.buildFromTemplate(template);
        this.tray.setContextMenu(contextMenu);
    }

    /**
     * Setup event handlers for tray interactions
     */
    setupEventHandlers() {
        // Left click to show/hide window
        this.tray.on('click', () => {
            this.statistics.trayClicks++;
            this.statistics.lastAccessed = new Date().toISOString();
            
            if (this.mainWindow.isVisible()) {
                if (this.mainWindow.isFocused()) {
                    this.hideWindow();
                } else {
                    this.showWindow();
                }
            } else {
                this.showWindow();
            }
        });

        // Double click to show window
        this.tray.on('double-click', () => {
            this.showWindow();
        });

        // Right click shows context menu (handled automatically)
        this.tray.on('right-click', () => {
            this.statistics.menuItemClicks++;
        });

        // Handle tray balloon clicks (Windows)
        this.tray.on('balloon-click', () => {
            this.showWindow();
        });
    }

    /**
     * Setup window management for tray integration
     */
    setupWindowManagement() {
        if (!this.mainWindow) return;

        // Handle window close
        this.mainWindow.on('close', (event) => {
            if (!this.isQuitting && this.settings.closeToTray) {
                event.preventDefault();
                this.hideWindow();
                
                if (this.settings.showNotifications) {
                    this.showTrayNotification(
                        'MIC Browser Ultimate',
                        'Application minimized to system tray',
                        'info'
                    );
                }
            }
        });

        // Handle window minimize
        this.mainWindow.on('minimize', (event) => {
            if (this.settings.minimizeToTray) {
                event.preventDefault();
                this.hideWindow();
            }
        });

        // Handle window show
        this.mainWindow.on('show', () => {
            if (this.tray) {
                this.updateTrayTooltip('MIC Browser Ultimate - Active');
            }
        });

        // Handle window hide
        this.mainWindow.on('hide', () => {
            if (this.tray) {
                this.updateTrayTooltip('MIC Browser Ultimate - Background');
            }
        });
    }

    /**
     * Show the main window
     */
    showWindow() {
        if (!this.mainWindow) return;

        if (this.mainWindow.isMinimized()) {
            this.mainWindow.restore();
        }
        
        this.mainWindow.show();
        this.mainWindow.focus();
        
        // Bring to front on all platforms
        if (process.platform === 'darwin') {
            app.dock.show();
        }
    }

    /**
     * Hide the main window
     */
    hideWindow() {
        if (!this.mainWindow) return;

        this.mainWindow.hide();
        
        // Hide dock icon on macOS
        if (process.platform === 'darwin') {
            app.dock.hide();
        }
    }

    /**
     * Trigger a quick action from the tray menu
     */
    triggerQuickAction(action, params = {}) {
        this.statistics.quickActions++;
        console.log(`[SystemTray] Quick action triggered: ${action}`, params);

        // Show window first
        this.showWindow();

        // Send action to renderer process
        if (this.mainWindow && this.mainWindow.webContents) {
            this.mainWindow.webContents.send('tray-quick-action', {
                action,
                params,
                timestamp: new Date().toISOString()
            });
        }

        // Also trigger via deep link if available
        const deepLinkUrl = this.generateDeepLinkForAction(action, params);
        if (deepLinkUrl && global.deepLinkManager) {
            global.deepLinkManager.handleDeepLink(deepLinkUrl);
        }
    }

    /**
     * Generate deep link URL for quick action
     */
    generateDeepLinkForAction(action, params) {
        try {
            const baseUrl = `mic-browser://${action}`;
            const queryParams = new URLSearchParams(params).toString();
            return queryParams ? `${baseUrl}?${queryParams}` : baseUrl;
        } catch (error) {
            console.error('[SystemTray] Failed to generate deep link:', error);
            return null;
        }
    }

    /**
     * Show application statistics
     */
    showStatistics() {
        const stats = {
            ...this.statistics,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            systemInfo: {
                platform: process.platform,
                arch: process.arch,
                nodeVersion: process.version
            }
        };

        this.showWindow();
        
        if (this.mainWindow && this.mainWindow.webContents) {
            this.mainWindow.webContents.send('show-tray-statistics', stats);
        }
    }

    /**
     * Open settings panel
     */
    openSettings() {
        this.showWindow();
        
        if (this.mainWindow && this.mainWindow.webContents) {
            this.mainWindow.webContents.send('open-settings', { section: 'system-tray' });
        }
    }

    /**
     * Show about dialog
     */
    showAbout() {
        const aboutInfo = {
            name: 'MIC Browser Ultimate',
            version: app.getVersion() || '1.0.0',
            description: 'Advanced browser with AI assistance and comprehensive features',
            author: 'MIC Browser Team',
            website: 'https://github.com/JLamance79/mic-browser-ultimate'
        };

        if (this.settings.showNotifications) {
            this.showTrayNotification(
                aboutInfo.name,
                `Version ${aboutInfo.version}\n${aboutInfo.description}`,
                'info'
            );
        }

        this.showWindow();
    }

    /**
     * Show a tray notification
     */
    showTrayNotification(title, body, type = 'info') {
        if (!this.tray || !this.settings.showNotifications) return;

        try {
            // Use different methods based on platform
            if (process.platform === 'win32') {
                // Windows balloon tooltip
                this.tray.displayBalloon({
                    title,
                    content: body,
                    icon: this.getTrayIcon()
                });
            } else {
                // macOS and Linux - update tooltip temporarily
                const originalTooltip = this.tray.getTitle();
                this.tray.setTitle(`${title}: ${body}`);
                
                setTimeout(() => {
                    this.tray.setTitle(originalTooltip || 'MIC Browser Ultimate');
                }, 3000);
            }
        } catch (error) {
            console.error('[SystemTray] Failed to show notification:', error);
        }
    }

    /**
     * Update tray tooltip
     */
    updateTrayTooltip(tooltip) {
        if (this.tray) {
            this.tray.setToolTip(tooltip);
        }
    }

    /**
     * Update tray icon based on status
     */
    updateTrayIcon(status = 'normal') {
        if (!this.tray) return;

        try {
            const icon = this.getTrayIcon();
            this.tray.setImage(icon);
        } catch (error) {
            console.error('[SystemTray] Failed to update tray icon:', error);
        }
    }

    /**
     * Quit the application
     */
    quitApplication() {
        console.log('[SystemTray] Quitting application...');
        this.isQuitting = true;
        
        // Save statistics before quitting
        this.saveSettings();
        
        app.quit();
    }

    /**
     * Load settings from storage
     */
    async loadSettings() {
        try {
            const settingsPath = this.getSettingsPath();
            
            if (fs.existsSync(settingsPath)) {
                const data = fs.readFileSync(settingsPath, 'utf8');
                const savedSettings = JSON.parse(data);
                
                // Merge with defaults
                this.settings = { ...this.settings, ...savedSettings.settings };
                this.statistics = { ...this.statistics, ...savedSettings.statistics };
            }
            
            console.log('[SystemTray] Settings loaded');
        } catch (error) {
            console.error('[SystemTray] Failed to load settings:', error);
        }
    }

    /**
     * Save settings to storage
     */
    async saveSettings() {
        try {
            const settingsPath = this.getSettingsPath();
            const settingsDir = path.dirname(settingsPath);
            
            // Ensure directory exists
            if (!fs.existsSync(settingsDir)) {
                fs.mkdirSync(settingsDir, { recursive: true });
            }
            
            const data = {
                settings: this.settings,
                statistics: this.statistics,
                lastSaved: new Date().toISOString()
            };
            
            fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2));
            console.log('[SystemTray] Settings saved');
        } catch (error) {
            console.error('[SystemTray] Failed to save settings:', error);
        }
    }

    /**
     * Get settings file path
     */
    getSettingsPath() {
        const userDataPath = app.getPath('userData');
        return path.join(userDataPath, 'system-tray-settings.json');
    }

    /**
     * Update settings
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        
        // Apply settings changes
        if (newSettings.enableTray !== undefined) {
            if (newSettings.enableTray && !this.tray) {
                this.createTray();
            } else if (!newSettings.enableTray && this.tray) {
                this.destroy();
            }
        }
        
        // Update context menu if quick actions changed
        if (newSettings.quickActions) {
            this.updateContextMenu();
        }
        
        this.saveSettings();
    }

    /**
     * Get current settings
     */
    getSettings() {
        return { ...this.settings };
    }

    /**
     * Get current statistics
     */
    getStatistics() {
        return {
            ...this.statistics,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage()
        };
    }

    /**
     * Destroy the system tray
     */
    destroy() {
        if (this.tray) {
            this.tray.destroy();
            this.tray = null;
            console.log('[SystemTray] System tray destroyed');
        }
    }

    /**
     * Check if tray is supported on current platform
     */
    static isSupported() {
        try {
            // System tray is supported on Windows, macOS, and most Linux distributions
            const os = require('os');
            const platform = os.platform();
            
            // Check if we're on a supported platform
            if (platform === 'win32' || platform === 'darwin') {
                return true;
            }
            
            // For Linux, check if we have a display environment
            if (platform === 'linux') {
                return !!(process.env.DISPLAY || process.env.WAYLAND_DISPLAY);
            }
            
            return false;
        } catch (error) {
            console.error('Error checking tray support:', error);
            return false;
        }
    }
}

module.exports = SystemTrayManager;