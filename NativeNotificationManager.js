/**
 * NativeNotificationManager.js - Cross-Platform Native Notification System
 * 
 * This module provides comprehensive native notification capabilities for MIC Browser Ultimate
 * with cross-platform support, privacy controls, and system integration.
 * 
 * Features:
 * - Native system notifications with OS integration
 * - Cross-platform support (Windows, macOS, Linux)
 * - Notification templates and customization
 * - Privacy-focused notification management
 * - User preference controls and opt-out options
 * - Notification history and management
 * - Integration with system notification centers
 * - Sound and visual customization
 * - Priority and urgency levels
 * - Interactive notification actions
 * 
 * @version 1.0.0
 * @author MIC Browser Ultimate Team
 */

const { Notification, app, shell, nativeImage } = require('electron');
const { EventEmitter } = require('events');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

class NativeNotificationManager extends EventEmitter {
    constructor() {
        super();
        this.systemSupported = Notification.isSupported();
        this.isEnabled = false;
        this.notifications = new Map(); // Active notifications
        this.history = []; // Notification history
        this.maxHistorySize = 100;
        
        // Default settings
        this.settings = {
            enabled: true,
            soundEnabled: true,
            badgeEnabled: true,
            urgentEnabled: true,
            position: 'topRight', // topRight, topLeft, bottomRight, bottomLeft
            duration: 5000, // Auto-close duration in ms (0 = no auto-close)
            maxConcurrent: 5,
            enableHistory: true,
            enableActionButtons: true,
            enableSystemIntegration: true,
            privacyMode: false, // Hide sensitive content in privacy mode
            categories: {
                system: { enabled: true, sound: true },
                security: { enabled: true, sound: true },
                updates: { enabled: true, sound: false },
                chat: { enabled: true, sound: true },
                downloads: { enabled: true, sound: false },
                errors: { enabled: true, sound: true },
                achievements: { enabled: true, sound: false }
            }
        };
        
        this.settingsFile = null;
        this.templates = this.initializeTemplates();
    }

    /**
     * Initialize notification templates
     */
    initializeTemplates() {
        return {
            system: {
                icon: this.getDefaultIcon(),
                urgency: 'normal',
                category: 'system',
                sound: 'default'
            },
            security: {
                icon: this.getSecurityIcon(),
                urgency: 'critical',
                category: 'security',
                sound: 'alert'
            },
            update: {
                icon: this.getUpdateIcon(),
                urgency: 'low',
                category: 'updates',
                sound: 'none'
            },
            chat: {
                icon: this.getChatIcon(),
                urgency: 'normal',
                category: 'chat',
                sound: 'message'
            },
            download: {
                icon: this.getDownloadIcon(),
                urgency: 'low',
                category: 'downloads',
                sound: 'none'
            },
            error: {
                icon: this.getErrorIcon(),
                urgency: 'critical',
                category: 'errors',
                sound: 'error'
            },
            success: {
                icon: this.getSuccessIcon(),
                urgency: 'low',
                category: 'achievements',
                sound: 'success'
            }
        };
    }

    /**
     * Initialize the notification manager
     */
    async init() {
        console.log('[NotificationManager] Initializing native notification system...');
        
        try {
            // Set up settings file path
            const userDataPath = app.getPath('userData');
            this.settingsFile = path.join(userDataPath, 'notification-settings.json');
            
            // Load settings
            await this.loadSettings();
            
            // Check system support
            if (!this.systemSupported) {
                console.warn('[NotificationManager] Native notifications not supported on this system');
                return false;
            }
            
            // Request notification permissions (if needed)
            await this.requestPermissions();
            
            // Initialize notification center integration
            this.setupSystemIntegration();
            
            // Set up cleanup handlers
            this.setupCleanupHandlers();
            
            this.isEnabled = this.settings.enabled;
            console.log('[NotificationManager] Native notification system initialized');
            this.emit('initialized');
            
            return true;
        } catch (error) {
            console.error('[NotificationManager] Failed to initialize:', error);
            this.emit('error', error);
            return false;
        }
    }

    /**
     * Request notification permissions
     */
    async requestPermissions() {
        if (process.platform === 'darwin') {
            // macOS requires explicit permission request
            try {
                const permission = await app.requestSingleInstanceLock();
                console.log('[NotificationManager] macOS permissions requested');
            } catch (error) {
                console.warn('[NotificationManager] Permission request failed:', error);
            }
        }
        
        // For other platforms, permissions are typically granted by default
        return true;
    }

    /**
     * Setup system integration
     */
    setupSystemIntegration() {
        if (!this.settings.enableSystemIntegration) return;
        
        // Set up app user model ID for Windows
        if (process.platform === 'win32') {
            app.setAppUserModelId('com.mic-browser-ultimate.app');
        }
        
        // Set up notification center integration
        if (process.platform === 'darwin') {
            // macOS notification center integration
            app.dock?.setBadge('');
        }
        
        console.log('[NotificationManager] System integration configured');
    }

    /**
     * Setup cleanup handlers
     */
    setupCleanupHandlers() {
        // Clean up notifications on app exit
        app.on('before-quit', () => {
            this.closeAllNotifications();
        });
        
        // Auto-cleanup old notifications
        setInterval(() => {
            this.cleanupOldNotifications();
        }, 60000); // Check every minute
    }

    /**
     * Show a native notification
     */
    async showNotification(options) {
        if (!this.isEnabled || !this.systemSupported) {
            console.log('[NotificationManager] Notifications disabled or unsupported');
            return null;
        }
        
        try {
            // Validate and prepare options
            const notificationOptions = await this.prepareNotificationOptions(options);
            
            // Check category settings
            if (!this.isCategoryEnabled(notificationOptions.category)) {
                console.log('[NotificationManager] Category disabled:', notificationOptions.category);
                return null;
            }
            
            // Limit concurrent notifications
            if (this.notifications.size >= this.settings.maxConcurrent) {
                this.closeOldestNotification();
            }
            
            // Create notification
            const notification = new Notification(notificationOptions);
            const notificationId = this.generateNotificationId();
            
            // Store notification
            this.notifications.set(notificationId, {
                notification,
                options: notificationOptions,
                timestamp: Date.now(),
                id: notificationId
            });
            
            // Set up event handlers
            this.setupNotificationHandlers(notification, notificationId, notificationOptions);
            
            // Show notification
            notification.show();
            
            // Add to history
            this.addToHistory(notificationOptions, notificationId);
            
            // Auto-close if duration is set
            if (this.settings.duration > 0) {
                setTimeout(() => {
                    this.closeNotification(notificationId);
                }, this.settings.duration);
            }
            
            console.log('[NotificationManager] Notification shown:', notificationOptions.title);
            this.emit('notification-shown', notificationId, notificationOptions);
            
            return notificationId;
        } catch (error) {
            console.error('[NotificationManager] Failed to show notification:', error);
            this.emit('error', error);
            return null;
        }
    }

    /**
     * Prepare notification options
     */
    async prepareNotificationOptions(options) {
        const template = this.templates[options.template] || this.templates.system;
        
        const prepared = {
            title: options.title || 'MIC Browser Ultimate',
            body: options.body || '',
            icon: options.icon || template.icon,
            silent: options.silent !== undefined ? options.silent : !this.shouldPlaySound(options.category),
            urgency: options.urgency || template.urgency,
            category: options.category || template.category,
            tag: options.tag || null,
            actions: options.actions || [],
            ...options
        };
        
        // Apply privacy mode if enabled
        if (this.settings.privacyMode && options.sensitive) {
            prepared.body = 'New notification (privacy mode enabled)';
        }
        
        // Platform-specific adjustments
        if (process.platform === 'win32') {
            // Windows-specific options
            prepared.toastXml = options.toastXml || null;
        }
        
        return prepared;
    }

    /**
     * Setup notification event handlers
     */
    setupNotificationHandlers(notification, notificationId, options) {
        notification.on('click', () => {
            console.log('[NotificationManager] Notification clicked:', notificationId);
            this.emit('notification-clicked', notificationId, options);
            
            // Handle click action
            if (options.clickAction) {
                this.handleNotificationAction(options.clickAction);
            }
            
            // Focus app window
            this.focusAppWindow();
            
            // Close notification
            this.closeNotification(notificationId);
        });
        
        notification.on('close', () => {
            console.log('[NotificationManager] Notification closed:', notificationId);
            this.notifications.delete(notificationId);
            this.emit('notification-closed', notificationId);
        });
        
        notification.on('action', (index) => {
            console.log('[NotificationManager] Notification action triggered:', index);
            if (options.actions && options.actions[index]) {
                this.handleNotificationAction(options.actions[index].action);
            }
            this.emit('notification-action', notificationId, index);
        });
        
        notification.on('failed', (error) => {
            console.error('[NotificationManager] Notification failed:', error);
            this.notifications.delete(notificationId);
            this.emit('notification-failed', notificationId, error);
        });
    }

    /**
     * Handle notification actions
     */
    handleNotificationAction(action) {
        if (!action) return;
        
        switch (action.type) {
            case 'url':
                shell.openExternal(action.url);
                break;
            case 'app':
                this.focusAppWindow();
                break;
            case 'command':
                this.emit('notification-command', action.command, action.data);
                break;
            default:
                console.warn('[NotificationManager] Unknown action type:', action.type);
        }
    }

    /**
     * Focus application window
     */
    focusAppWindow() {
        const { BrowserWindow } = require('electron');
        const windows = BrowserWindow.getAllWindows();
        if (windows.length > 0) {
            const mainWindow = windows[0];
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }
            mainWindow.focus();
            mainWindow.show();
        }
    }

    /**
     * Close a specific notification
     */
    closeNotification(notificationId) {
        const notificationData = this.notifications.get(notificationId);
        if (notificationData) {
            notificationData.notification.close();
            this.notifications.delete(notificationId);
        }
    }

    /**
     * Close all notifications
     */
    closeAllNotifications() {
        for (const [id, data] of this.notifications) {
            data.notification.close();
        }
        this.notifications.clear();
        console.log('[NotificationManager] All notifications closed');
    }

    /**
     * Close oldest notification
     */
    closeOldestNotification() {
        let oldestId = null;
        let oldestTime = Date.now();
        
        for (const [id, data] of this.notifications) {
            if (data.timestamp < oldestTime) {
                oldestTime = data.timestamp;
                oldestId = id;
            }
        }
        
        if (oldestId) {
            this.closeNotification(oldestId);
        }
    }

    /**
     * Cleanup old notifications from history
     */
    cleanupOldNotifications() {
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        const cutoff = Date.now() - maxAge;
        
        this.history = this.history.filter(item => item.timestamp > cutoff);
        
        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history = this.history.slice(-this.maxHistorySize);
        }
    }

    /**
     * Add notification to history
     */
    addToHistory(options, notificationId) {
        if (!this.settings.enableHistory) return;
        
        this.history.push({
            id: notificationId,
            title: options.title,
            body: options.body,
            category: options.category,
            timestamp: Date.now(),
            read: false
        });
        
        this.emit('history-updated');
    }

    /**
     * Check if category is enabled
     */
    isCategoryEnabled(category) {
        const categorySettings = this.settings.categories[category];
        return categorySettings ? categorySettings.enabled : true;
    }

    /**
     * Check if sound should play for category
     */
    shouldPlaySound(category) {
        if (!this.settings.soundEnabled) return false;
        
        const categorySettings = this.settings.categories[category];
        return categorySettings ? categorySettings.sound : false;
    }

    /**
     * Generate unique notification ID
     */
    generateNotificationId() {
        return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Predefined notification methods
     */
    async showSystemNotification(title, body, options = {}) {
        return this.showNotification({
            template: 'system',
            title,
            body,
            category: 'system',
            ...options
        });
    }

    async showSecurityAlert(title, body, options = {}) {
        return this.showNotification({
            template: 'security',
            title,
            body,
            category: 'security',
            urgency: 'critical',
            sensitive: true,
            ...options
        });
    }

    async showUpdateNotification(title, body, options = {}) {
        return this.showNotification({
            template: 'update',
            title,
            body,
            category: 'updates',
            ...options
        });
    }

    async showChatMessage(title, body, options = {}) {
        return this.showNotification({
            template: 'chat',
            title,
            body,
            category: 'chat',
            ...options
        });
    }

    async showDownloadComplete(title, body, options = {}) {
        return this.showNotification({
            template: 'download',
            title,
            body,
            category: 'downloads',
            ...options
        });
    }

    async showError(title, body, options = {}) {
        return this.showNotification({
            template: 'error',
            title,
            body,
            category: 'errors',
            urgency: 'critical',
            ...options
        });
    }

    async showSuccess(title, body, options = {}) {
        return this.showNotification({
            template: 'success',
            title,
            body,
            category: 'achievements',
            ...options
        });
    }

    /**
     * Settings management
     */
    async loadSettings() {
        try {
            if (await this.fileExists(this.settingsFile)) {
                const data = await fs.readFile(this.settingsFile, 'utf8');
                const savedSettings = JSON.parse(data);
                this.settings = { ...this.settings, ...savedSettings };
                console.log('[NotificationManager] Settings loaded');
            }
        } catch (error) {
            console.warn('[NotificationManager] Failed to load settings:', error);
        }
    }

    async saveSettings() {
        try {
            await fs.writeFile(this.settingsFile, JSON.stringify(this.settings, null, 2));
            console.log('[NotificationManager] Settings saved');
            this.emit('settings-saved');
        } catch (error) {
            console.error('[NotificationManager] Failed to save settings:', error);
            this.emit('error', error);
        }
    }

    async updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.isEnabled = this.settings.enabled;
        await this.saveSettings();
        this.emit('settings-updated', this.settings);
    }

    getSettings() {
        return { ...this.settings };
    }

    /**
     * History management
     */
    getHistory() {
        return [...this.history];
    }

    markAsRead(notificationId) {
        const item = this.history.find(h => h.id === notificationId);
        if (item) {
            item.read = true;
            this.emit('history-updated');
        }
    }

    clearHistory() {
        this.history = [];
        this.emit('history-updated');
    }

    /**
     * Icon management
     */
    getDefaultIcon() {
        return path.join(__dirname, 'assets', 'icons', 'notification-default.png');
    }

    getSecurityIcon() {
        return path.join(__dirname, 'assets', 'icons', 'notification-security.png');
    }

    getUpdateIcon() {
        return path.join(__dirname, 'assets', 'icons', 'notification-update.png');
    }

    getChatIcon() {
        return path.join(__dirname, 'assets', 'icons', 'notification-chat.png');
    }

    getDownloadIcon() {
        return path.join(__dirname, 'assets', 'icons', 'notification-download.png');
    }

    getErrorIcon() {
        return path.join(__dirname, 'assets', 'icons', 'notification-error.png');
    }

    getSuccessIcon() {
        return path.join(__dirname, 'assets', 'icons', 'notification-success.png');
    }

    /**
     * Utility methods
     */
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    isSupported() {
        return Notification.isSupported();
    }

    isNotificationEnabled() {
        return this.isEnabled && Notification.isSupported();
    }

    getActiveNotificationCount() {
        return this.notifications.size;
    }

    getUnreadCount() {
        return this.history.filter(item => !item.read).length;
    }

    /**
     * Platform-specific features
     */
    setBadgeCount(count) {
        if (process.platform === 'darwin' && this.settings.badgeEnabled) {
            app.dock?.setBadge(count > 0 ? count.toString() : '');
        }
    }

    flashWindow() {
        const { BrowserWindow } = require('electron');
        const windows = BrowserWindow.getAllWindows();
        if (windows.length > 0 && process.platform === 'win32') {
            windows[0].flashFrame(true);
        }
    }

    /**
     * Cleanup and shutdown
     */
    destroy() {
        this.closeAllNotifications();
        this.removeAllListeners();
        console.log('[NotificationManager] Notification manager destroyed');
    }
}

module.exports = NativeNotificationManager;