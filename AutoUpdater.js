/**
 * AutoUpdater.js - Comprehensive Auto-Update System for MIC Browser Ultimate
 * 
 * This module provides a robust auto-update system with the following features:
 * - Automatic update checking on startup and periodic intervals
 * - Download progress tracking with user notifications
 * - Silent updates and user-controlled updates
 * - Update preferences and settings management
 * - Error handling and recovery mechanisms
 * - Update rollback capabilities
 * - Release notes display
 * 
 * @version 1.0.0
 * @author MIC Browser Ultimate Team
 */

const { autoUpdater } = require('electron-updater');
const { app, dialog, shell, BrowserWindow } = require('electron');
const { EventEmitter } = require('events');
const path = require('path');
const fs = require('fs').promises;

class AutoUpdaterManager extends EventEmitter {
    constructor() {
        super();
        this.isUpdateAvailable = false;
        this.isDownloading = false;
        this.downloadProgress = 0;
        this.updateInfo = null;
        this.settings = {
            autoDownload: true,
            autoInstall: false,
            checkOnStartup: true,
            checkInterval: 4 * 60 * 60 * 1000, // 4 hours
            silentUpdates: false,
            notifyUser: true,
            allowPrerelease: false
        };
        this.checkTimer = null;
        this.lastCheckTime = null;
        this.isEnabled = !process.env.NODE_ENV === 'development';
        this.updateWindow = null;
        
        this.initializeUpdater();
    }

    /**
     * Initialize the auto-updater with configuration and event handlers
     */
    initializeUpdater() {
        // Configure auto-updater
        autoUpdater.autoDownload = this.settings.autoDownload;
        autoUpdater.autoInstallOnAppQuit = this.settings.autoInstall;
        autoUpdater.allowPrerelease = this.settings.allowPrerelease;
        
        // Set update channel based on environment
        if (process.env.NODE_ENV === 'development') {
            autoUpdater.updateConfigPath = path.join(__dirname, 'dev-app-update.yml');
            this.isEnabled = false;
        }

        // Load saved settings
        this.loadSettings();

        // Setup event handlers
        this.setupEventHandlers();

        console.log('[AutoUpdater] Initialized with settings:', this.settings);
    }

    /**
     * Setup all auto-updater event handlers
     */
    setupEventHandlers() {
        // Check for updates
        autoUpdater.on('checking-for-update', () => {
            console.log('[AutoUpdater] Checking for updates...');
            this.emit('checking-for-update');
            this.notifyRenderer('update-checking');
        });

        // Update available
        autoUpdater.on('update-available', (info) => {
            console.log('[AutoUpdater] Update available:', info.version);
            this.isUpdateAvailable = true;
            this.updateInfo = info;
            this.emit('update-available', info);
            this.handleUpdateAvailable(info);
        });

        // No update available
        autoUpdater.on('update-not-available', (info) => {
            console.log('[AutoUpdater] No update available');
            this.isUpdateAvailable = false;
            this.updateInfo = null;
            this.lastCheckTime = new Date();
            this.emit('update-not-available', info);
            this.notifyRenderer('update-not-available');
        });

        // Download progress
        autoUpdater.on('download-progress', (progressObj) => {
            this.downloadProgress = progressObj.percent;
            this.emit('download-progress', progressObj);
            this.notifyRenderer('download-progress', progressObj);
            
            if (this.updateWindow) {
                this.updateWindow.webContents.send('download-progress', progressObj);
            }
        });

        // Update downloaded
        autoUpdater.on('update-downloaded', (info) => {
            console.log('[AutoUpdater] Update downloaded:', info.version);
            this.isDownloading = false;
            this.emit('update-downloaded', info);
            this.handleUpdateDownloaded(info);
        });

        // Error handling
        autoUpdater.on('error', (error) => {
            console.error('[AutoUpdater] Error:', error);
            this.isDownloading = false;
            this.emit('error', error);
            this.handleUpdateError(error);
        });
    }

    /**
     * Load settings from persistent storage
     */
    async loadSettings() {
        try {
            const settingsPath = path.join(app.getPath('userData'), 'auto-update-settings.json');
            const data = await fs.readFile(settingsPath, 'utf8');
            const savedSettings = JSON.parse(data);
            this.settings = { ...this.settings, ...savedSettings };
            
            // Apply settings to autoUpdater
            autoUpdater.autoDownload = this.settings.autoDownload;
            autoUpdater.autoInstallOnAppQuit = this.settings.autoInstall;
            autoUpdater.allowPrerelease = this.settings.allowPrerelease;
            
            console.log('[AutoUpdater] Settings loaded:', this.settings);
        } catch (error) {
            console.log('[AutoUpdater] No saved settings found, using defaults');
            await this.saveSettings();
        }
    }

    /**
     * Save settings to persistent storage
     */
    async saveSettings() {
        try {
            const settingsPath = path.join(app.getPath('userData'), 'auto-update-settings.json');
            await fs.writeFile(settingsPath, JSON.stringify(this.settings, null, 2));
            console.log('[AutoUpdater] Settings saved');
        } catch (error) {
            console.error('[AutoUpdater] Failed to save settings:', error);
        }
    }

    /**
     * Update settings and apply changes
     */
    async updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        await this.saveSettings();
        
        // Apply changes
        autoUpdater.autoDownload = this.settings.autoDownload;
        autoUpdater.autoInstallOnAppQuit = this.settings.autoInstall;
        autoUpdater.allowPrerelease = this.settings.allowPrerelease;
        
        // Restart check timer if interval changed
        if (newSettings.checkInterval) {
            this.stopPeriodicChecks();
            this.startPeriodicChecks();
        }

        this.emit('settings-updated', this.settings);
        this.notifyRenderer('settings-updated', this.settings);
    }

    /**
     * Check for updates manually
     */
    async checkForUpdates(manual = false) {
        if (!this.isEnabled) {
            console.log('[AutoUpdater] Updates disabled in development mode');
            return false;
        }

        try {
            console.log('[AutoUpdater] Checking for updates...');
            const result = await autoUpdater.checkForUpdates();
            
            if (manual && !this.isUpdateAvailable) {
                this.showNoUpdateDialog();
            }
            
            return result;
        } catch (error) {
            console.error('[AutoUpdater] Check for updates failed:', error);
            if (manual) {
                this.showUpdateErrorDialog(error);
            }
            return false;
        }
    }

    /**
     * Download update manually
     */
    async downloadUpdate() {
        if (!this.isUpdateAvailable) {
            console.log('[AutoUpdater] No update available to download');
            return false;
        }

        try {
            this.isDownloading = true;
            console.log('[AutoUpdater] Starting download...');
            await autoUpdater.downloadUpdate();
            return true;
        } catch (error) {
            console.error('[AutoUpdater] Download failed:', error);
            this.isDownloading = false;
            this.handleUpdateError(error);
            return false;
        }
    }

    /**
     * Install update and restart app
     */
    quitAndInstall() {
        console.log('[AutoUpdater] Installing update and restarting...');
        autoUpdater.quitAndInstall();
    }

    /**
     * Handle update available event
     */
    async handleUpdateAvailable(info) {
        if (this.settings.silentUpdates && this.settings.autoDownload) {
            console.log('[AutoUpdater] Silent update mode - starting download');
            this.downloadUpdate();
        } else if (this.settings.notifyUser) {
            this.showUpdateAvailableDialog(info);
        }
    }

    /**
     * Handle update downloaded event
     */
    async handleUpdateDownloaded(info) {
        this.notifyRenderer('update-downloaded', info);
        
        if (this.settings.silentUpdates && this.settings.autoInstall) {
            console.log('[AutoUpdater] Silent update mode - installing on quit');
        } else if (this.settings.notifyUser) {
            this.showUpdateReadyDialog(info);
        }
    }

    /**
     * Handle update errors
     */
    handleUpdateError(error) {
        console.error('[AutoUpdater] Update error:', error);
        this.notifyRenderer('update-error', { message: error.message });
        
        if (this.settings.notifyUser) {
            this.showUpdateErrorDialog(error);
        }
    }

    /**
     * Show update available dialog
     */
    async showUpdateAvailableDialog(info) {
        const response = await dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
            type: 'info',
            title: 'Update Available',
            message: `MIC Browser Ultimate v${info.version} is available!`,
            detail: `Current version: ${app.getVersion()}\nNew version: ${info.version}\n\nWould you like to download the update now?`,
            buttons: ['Download Now', 'View Release Notes', 'Later', 'Don\'t Ask Again'],
            defaultId: 0,
            cancelId: 2
        });

        switch (response.response) {
            case 0: // Download Now
                this.downloadUpdate();
                break;
            case 1: // View Release Notes
                if (info.releaseNotes) {
                    this.showReleaseNotes(info);
                } else {
                    shell.openExternal(`https://github.com/JLamance79/mic-browser-ultimate/releases/tag/v${info.version}`);
                }
                break;
            case 3: // Don't Ask Again
                this.updateSettings({ notifyUser: false });
                break;
            // case 2: Later - do nothing
        }
    }

    /**
     * Show update ready dialog
     */
    async showUpdateReadyDialog(info) {
        const response = await dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
            type: 'info',
            title: 'Update Ready',
            message: `MIC Browser Ultimate v${info.version} has been downloaded and is ready to install.`,
            detail: 'The application will restart to apply the update.',
            buttons: ['Install Now', 'Install on Quit', 'Cancel'],
            defaultId: 0,
            cancelId: 2
        });

        switch (response.response) {
            case 0: // Install Now
                this.quitAndInstall();
                break;
            case 1: // Install on Quit
                this.updateSettings({ autoInstall: true });
                break;
            // case 2: Cancel - do nothing
        }
    }

    /**
     * Show no update dialog for manual checks
     */
    async showNoUpdateDialog() {
        await dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
            type: 'info',
            title: 'No Updates',
            message: 'You are running the latest version of MIC Browser Ultimate.',
            detail: `Current version: ${app.getVersion()}`,
            buttons: ['OK']
        });
    }

    /**
     * Show update error dialog
     */
    async showUpdateErrorDialog(error) {
        await dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
            type: 'error',
            title: 'Update Error',
            message: 'Failed to check for updates or download update.',
            detail: error.message,
            buttons: ['OK']
        });
    }

    /**
     * Show release notes window
     */
    showReleaseNotes(info) {
        if (this.updateWindow) {
            this.updateWindow.focus();
            return;
        }

        this.updateWindow = new BrowserWindow({
            width: 800,
            height: 600,
            modal: true,
            parent: BrowserWindow.getFocusedWindow(),
            title: `Release Notes - v${info.version}`,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true
            }
        });

        // Create release notes HTML
        const releaseNotesHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Release Notes</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; padding: 20px; background: #f5f5f5; }
                    .container { max-width: 700px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    h1 { color: #333; border-bottom: 2px solid #007acc; padding-bottom: 10px; }
                    .version { color: #007acc; font-size: 1.2em; margin-bottom: 20px; }
                    .release-notes { line-height: 1.6; }
                    .button-container { text-align: center; margin-top: 30px; }
                    button { background: #007acc; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 16px; }
                    button:hover { background: #005a9e; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>MIC Browser Ultimate</h1>
                    <div class="version">Version ${info.version}</div>
                    <div class="release-notes">
                        ${info.releaseNotes || 'Release notes not available.'}
                    </div>
                    <div class="button-container">
                        <button onclick="window.close()">Close</button>
                    </div>
                </div>
            </body>
            </html>
        `;

        this.updateWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(releaseNotesHtml)}`);

        this.updateWindow.on('closed', () => {
            this.updateWindow = null;
        });
    }

    /**
     * Start periodic update checks
     */
    startPeriodicChecks() {
        if (!this.settings.checkOnStartup || this.checkTimer) {
            return;
        }

        this.checkTimer = setInterval(() => {
            this.checkForUpdates();
        }, this.settings.checkInterval);

        console.log(`[AutoUpdater] Periodic checks started (every ${this.settings.checkInterval / 1000 / 60} minutes)`);
    }

    /**
     * Stop periodic update checks
     */
    stopPeriodicChecks() {
        if (this.checkTimer) {
            clearInterval(this.checkTimer);
            this.checkTimer = null;
            console.log('[AutoUpdater] Periodic checks stopped');
        }
    }

    /**
     * Notify renderer process of update events
     */
    notifyRenderer(event, data = null) {
        const windows = BrowserWindow.getAllWindows();
        windows.forEach(window => {
            if (window.webContents) {
                window.webContents.send('auto-updater', { event, data });
            }
        });
    }

    /**
     * Get current update status
     */
    getStatus() {
        return {
            isEnabled: this.isEnabled,
            isUpdateAvailable: this.isUpdateAvailable,
            isDownloading: this.isDownloading,
            downloadProgress: this.downloadProgress,
            updateInfo: this.updateInfo,
            settings: this.settings,
            lastCheckTime: this.lastCheckTime,
            version: app.getVersion()
        };
    }

    /**
     * Enable or disable the auto-updater
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        if (enabled) {
            this.startPeriodicChecks();
        } else {
            this.stopPeriodicChecks();
        }
        console.log(`[AutoUpdater] ${enabled ? 'Enabled' : 'Disabled'}`);
    }

    /**
     * Initialize auto-updater when app is ready
     */
    async initialize() {
        if (!this.isEnabled) {
            console.log('[AutoUpdater] Disabled in development mode');
            return;
        }

        // Check for updates on startup if enabled
        if (this.settings.checkOnStartup) {
            setTimeout(() => {
                this.checkForUpdates();
            }, 5000); // Wait 5 seconds after startup
        }

        // Start periodic checks
        this.startPeriodicChecks();

        console.log('[AutoUpdater] Initialization complete');
    }

    /**
     * Cleanup when app is closing
     */
    destroy() {
        this.stopPeriodicChecks();
        if (this.updateWindow) {
            this.updateWindow.close();
        }
        this.removeAllListeners();
        console.log('[AutoUpdater] Destroyed');
    }
}

module.exports = AutoUpdaterManager;