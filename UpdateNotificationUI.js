/**
 * UpdateNotificationUI.js - Update Notification User Interface
 * 
 * This module provides a comprehensive UI system for handling auto-update notifications
 * including progress tracking, user controls, and settings management.
 * 
 * Features:
 * - Update available notifications
 * - Download progress display
 * - User controls for downloading and installing
 * - Update settings dialog
 * - Release notes display
 * - Error handling and user feedback
 * 
 * @version 1.0.0
 * @author MIC Browser Ultimate Team
 */

class UpdateNotificationUI {
    constructor() {
        this.isVisible = false;
        this.currentStatus = null;
        this.settings = null;
        this.container = null;
        this.progressBar = null;
        this.statusText = null;
        
        this.init();
    }

    /**
     * Initialize the update notification UI
     */
    async init() {
        console.log('[UpdateNotificationUI] Initializing...');
        
        // Create UI elements
        this.createNotificationContainer();
        this.createSettingsDialog();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load initial status and settings
        await this.loadStatus();
        
        console.log('[UpdateNotificationUI] Initialized');
    }

    /**
     * Create the main notification container
     */
    createNotificationContainer() {
        // Create main container
        this.container = document.createElement('div');
        this.container.id = 'update-notification';
        this.container.className = 'update-notification hidden';
        
        this.container.innerHTML = `
            <div class="update-notification-content">
                <div class="update-header">
                    <div class="update-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="currentColor"/>
                        </svg>
                    </div>
                    <div class="update-title">Update Available</div>
                    <button class="update-close" onclick="updateNotificationUI.hide()">×</button>
                </div>
                
                <div class="update-body">
                    <div class="update-status">
                        <div class="status-text" id="update-status-text">Checking for updates...</div>
                        <div class="version-info" id="update-version-info"></div>
                    </div>
                    
                    <div class="update-progress hidden" id="update-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" id="update-progress-fill"></div>
                        </div>
                        <div class="progress-text" id="update-progress-text">0%</div>
                    </div>
                    
                    <div class="update-actions" id="update-actions">
                        <button class="btn btn-primary" id="update-download-btn" onclick="updateNotificationUI.downloadUpdate()">
                            Download Update
                        </button>
                        <button class="btn btn-secondary" id="update-later-btn" onclick="updateNotificationUI.hide()">
                            Later
                        </button>
                        <button class="btn btn-secondary" id="update-settings-btn" onclick="updateNotificationUI.showSettings()">
                            Settings
                        </button>
                    </div>
                    
                    <div class="update-details hidden" id="update-details">
                        <div class="details-toggle" onclick="updateNotificationUI.toggleDetails()">
                            <span>Release Notes</span>
                            <span class="toggle-arrow">▼</span>
                        </div>
                        <div class="details-content" id="update-details-content"></div>
                    </div>
                </div>
            </div>
        `;
        
        // Add styles
        this.addStyles();
        
        // Append to body
        document.body.appendChild(this.container);
        
        // Cache element references
        this.statusText = document.getElementById('update-status-text');
        this.versionInfo = document.getElementById('update-version-info');
        this.progressContainer = document.getElementById('update-progress');
        this.progressFill = document.getElementById('update-progress-fill');
        this.progressText = document.getElementById('update-progress-text');
        this.actionsContainer = document.getElementById('update-actions');
        this.detailsContainer = document.getElementById('update-details');
        this.detailsContent = document.getElementById('update-details-content');
    }

    /**
     * Create the settings dialog
     */
    createSettingsDialog() {
        const settingsDialog = document.createElement('div');
        settingsDialog.id = 'update-settings-dialog';
        settingsDialog.className = 'update-settings-dialog hidden';
        
        settingsDialog.innerHTML = `
            <div class="settings-dialog-content">
                <div class="settings-header">
                    <h3>Auto-Update Settings</h3>
                    <button class="settings-close" onclick="updateNotificationUI.hideSettings()">×</button>
                </div>
                
                <div class="settings-body">
                    <div class="setting-group">
                        <label class="setting-label">
                            <input type="checkbox" id="auto-download-setting"> 
                            Automatically download updates
                        </label>
                        <div class="setting-description">Updates will be downloaded in the background when available.</div>
                    </div>
                    
                    <div class="setting-group">
                        <label class="setting-label">
                            <input type="checkbox" id="auto-install-setting"> 
                            Install updates on quit
                        </label>
                        <div class="setting-description">Updates will be installed when you close the application.</div>
                    </div>
                    
                    <div class="setting-group">
                        <label class="setting-label">
                            <input type="checkbox" id="check-startup-setting"> 
                            Check for updates on startup
                        </label>
                        <div class="setting-description">Automatically check for updates when the application starts.</div>
                    </div>
                    
                    <div class="setting-group">
                        <label class="setting-label">
                            <input type="checkbox" id="notify-user-setting"> 
                            Show update notifications
                        </label>
                        <div class="setting-description">Display notifications when updates are available.</div>
                    </div>
                    
                    <div class="setting-group">
                        <label class="setting-label">
                            <input type="checkbox" id="silent-updates-setting"> 
                            Silent updates
                        </label>
                        <div class="setting-description">Download and install updates silently without user interaction.</div>
                    </div>
                    
                    <div class="setting-group">
                        <label class="setting-label">
                            <input type="checkbox" id="prerelease-setting"> 
                            Include pre-release versions
                        </label>
                        <div class="setting-description">Check for beta and pre-release versions in addition to stable releases.</div>
                    </div>
                    
                    <div class="setting-group">
                        <label class="setting-label">Check interval:</label>
                        <select id="check-interval-setting">
                            <option value="3600000">1 hour</option>
                            <option value="7200000">2 hours</option>
                            <option value="14400000" selected>4 hours</option>
                            <option value="28800000">8 hours</option>
                            <option value="86400000">24 hours</option>
                        </select>
                        <div class="setting-description">How often to check for updates automatically.</div>
                    </div>
                </div>
                
                <div class="settings-actions">
                    <button class="btn btn-primary" onclick="updateNotificationUI.saveSettings()">Save Settings</button>
                    <button class="btn btn-secondary" onclick="updateNotificationUI.hideSettings()">Cancel</button>
                    <button class="btn btn-secondary" onclick="updateNotificationUI.checkForUpdates()">Check Now</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(settingsDialog);
        this.settingsDialog = settingsDialog;
    }

    /**
     * Add CSS styles for the update notification UI
     */
    addStyles() {
        const styles = document.createElement('style');
        styles.textContent = `
            .update-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 400px;
                background: #fff;
                border: 1px solid #ddd;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                transition: all 0.3s ease;
            }
            
            .update-notification.hidden {
                display: none;
            }
            
            .update-notification-content {
                padding: 16px;
            }
            
            .update-header {
                display: flex;
                align-items: center;
                margin-bottom: 12px;
            }
            
            .update-icon {
                color: #007acc;
                margin-right: 8px;
            }
            
            .update-title {
                flex: 1;
                font-weight: 600;
                font-size: 16px;
                color: #333;
            }
            
            .update-close {
                background: none;
                border: none;
                font-size: 20px;
                cursor: pointer;
                color: #666;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .update-close:hover {
                color: #333;
            }
            
            .status-text {
                font-size: 14px;
                color: #333;
                margin-bottom: 4px;
            }
            
            .version-info {
                font-size: 12px;
                color: #666;
                margin-bottom: 12px;
            }
            
            .update-progress {
                margin: 12px 0;
            }
            
            .progress-bar {
                background: #f0f0f0;
                border-radius: 4px;
                height: 8px;
                overflow: hidden;
                margin-bottom: 4px;
            }
            
            .progress-fill {
                background: #007acc;
                height: 100%;
                transition: width 0.3s ease;
                width: 0%;
            }
            
            .progress-text {
                font-size: 12px;
                color: #666;
                text-align: center;
            }
            
            .update-actions {
                display: flex;
                gap: 8px;
                margin-top: 12px;
            }
            
            .btn {
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                transition: background-color 0.2s;
            }
            
            .btn-primary {
                background: #007acc;
                color: white;
            }
            
            .btn-primary:hover {
                background: #005a9e;
            }
            
            .btn-secondary {
                background: #f0f0f0;
                color: #333;
            }
            
            .btn-secondary:hover {
                background: #e0e0e0;
            }
            
            .update-details {
                margin-top: 12px;
                border-top: 1px solid #eee;
                padding-top: 12px;
            }
            
            .details-toggle {
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 14px;
                color: #007acc;
                margin-bottom: 8px;
            }
            
            .details-toggle:hover {
                color: #005a9e;
            }
            
            .details-content {
                font-size: 12px;
                color: #666;
                line-height: 1.4;
                max-height: 200px;
                overflow-y: auto;
            }
            
            .hidden {
                display: none !important;
            }
            
            /* Settings Dialog Styles */
            .update-settings-dialog {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                z-index: 10001;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .settings-dialog-content {
                background: white;
                border-radius: 8px;
                padding: 24px;
                width: 500px;
                max-height: 80vh;
                overflow-y: auto;
            }
            
            .settings-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                border-bottom: 1px solid #eee;
                padding-bottom: 12px;
            }
            
            .settings-header h3 {
                margin: 0;
                color: #333;
            }
            
            .settings-close {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #666;
            }
            
            .setting-group {
                margin-bottom: 16px;
            }
            
            .setting-label {
                display: flex;
                align-items: center;
                font-size: 14px;
                color: #333;
                cursor: pointer;
                margin-bottom: 4px;
            }
            
            .setting-label input[type="checkbox"] {
                margin-right: 8px;
            }
            
            .setting-label select {
                margin-left: 8px;
                padding: 4px 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
            }
            
            .setting-description {
                font-size: 12px;
                color: #666;
                margin-left: 20px;
                line-height: 1.3;
            }
            
            .settings-actions {
                display: flex;
                gap: 8px;
                margin-top: 20px;
                padding-top: 16px;
                border-top: 1px solid #eee;
                justify-content: flex-end;
            }
            
            /* Dark mode support */
            @media (prefers-color-scheme: dark) {
                .update-notification {
                    background: #2d2d2d;
                    border-color: #555;
                }
                
                .update-title, .status-text {
                    color: #fff;
                }
                
                .version-info, .progress-text, .details-content {
                    color: #ccc;
                }
                
                .btn-secondary {
                    background: #555;
                    color: #fff;
                }
                
                .btn-secondary:hover {
                    background: #666;
                }
                
                .settings-dialog-content {
                    background: #2d2d2d;
                }
                
                .settings-header h3, .setting-label {
                    color: #fff;
                }
                
                .setting-description {
                    color: #ccc;
                }
                
                .settings-header, .settings-actions, .update-details {
                    border-color: #555;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    /**
     * Setup event listeners for auto-updater events
     */
    setupEventListeners() {
        if (!window.electronAPI?.updater) {
            console.error('[UpdateNotificationUI] electronAPI.updater not available');
            return;
        }

        // Listen for auto-updater events
        window.electronAPI.updater.onUpdateEvent((event, data) => {
            console.log('[UpdateNotificationUI] Update event:', data.event, data.data);
            this.handleUpdateEvent(data.event, data.data);
        });

        // Legacy event listeners for compatibility
        window.electronAPI.updater.onUpdateChecking(() => {
            this.handleUpdateEvent('update-checking');
        });

        window.electronAPI.updater.onUpdateAvailable((event, info) => {
            this.handleUpdateEvent('update-available', info);
        });

        window.electronAPI.updater.onUpdateNotAvailable(() => {
            this.handleUpdateEvent('update-not-available');
        });

        window.electronAPI.updater.onDownloadProgress((event, progress) => {
            this.handleUpdateEvent('download-progress', progress);
        });

        window.electronAPI.updater.onUpdateDownloaded((event, info) => {
            this.handleUpdateEvent('update-downloaded', info);
        });

        window.electronAPI.updater.onUpdateError((event, error) => {
            this.handleUpdateEvent('update-error', error);
        });
    }

    /**
     * Handle update events from the main process
     */
    handleUpdateEvent(event, data) {
        console.log('[UpdateNotificationUI] Handling event:', event, data);

        switch (event) {
            case 'checking-for-update':
                this.showCheckingStatus();
                break;
            case 'update-available':
                this.showUpdateAvailable(data);
                break;
            case 'update-not-available':
                this.hideIfManualCheck();
                break;
            case 'download-progress':
                this.updateDownloadProgress(data);
                break;
            case 'update-downloaded':
                this.showUpdateReady(data);
                break;
            case 'update-error':
                this.showError(data);
                break;
        }
    }

    /**
     * Load current status and settings
     */
    async loadStatus() {
        try {
            if (window.electronAPI?.updater) {
                this.currentStatus = await window.electronAPI.updater.getStatus();
                this.settings = await window.electronAPI.updater.getSettings();
                console.log('[UpdateNotificationUI] Status loaded:', this.currentStatus);
            }
        } catch (error) {
            console.error('[UpdateNotificationUI] Failed to load status:', error);
        }
    }

    /**
     * Show checking for updates status
     */
    showCheckingStatus() {
        this.statusText.textContent = 'Checking for updates...';
        this.versionInfo.textContent = '';
        this.progressContainer.classList.add('hidden');
        this.actionsContainer.innerHTML = `
            <button class="btn btn-secondary" onclick="updateNotificationUI.hide()">Cancel</button>
        `;
        this.show();
    }

    /**
     * Show update available notification
     */
    showUpdateAvailable(info) {
        this.statusText.textContent = `New version ${info.version} is available!`;
        this.versionInfo.textContent = `Current: ${this.currentStatus?.version || 'Unknown'} → New: ${info.version}`;
        
        this.progressContainer.classList.add('hidden');
        this.actionsContainer.innerHTML = `
            <button class="btn btn-primary" onclick="updateNotificationUI.downloadUpdate()">
                Download Update
            </button>
            <button class="btn btn-secondary" onclick="updateNotificationUI.hide()">
                Later
            </button>
            <button class="btn btn-secondary" onclick="updateNotificationUI.showSettings()">
                Settings
            </button>
        `;

        // Show release notes if available
        if (info.releaseNotes) {
            this.detailsContent.innerHTML = info.releaseNotes;
            this.detailsContainer.classList.remove('hidden');
        }

        this.show();
    }

    /**
     * Update download progress
     */
    updateDownloadProgress(progress) {
        this.statusText.textContent = 'Downloading update...';
        this.progressContainer.classList.remove('hidden');
        this.progressFill.style.width = `${progress.percent}%`;
        this.progressText.textContent = `${Math.round(progress.percent)}%`;
        
        this.actionsContainer.innerHTML = `
            <button class="btn btn-secondary" onclick="updateNotificationUI.hide()">
                Hide
            </button>
        `;
        
        this.show();
    }

    /**
     * Show update ready notification
     */
    showUpdateReady(info) {
        this.statusText.textContent = 'Update downloaded and ready to install!';
        this.versionInfo.textContent = `Version ${info.version} is ready to install`;
        this.progressContainer.classList.add('hidden');
        
        this.actionsContainer.innerHTML = `
            <button class="btn btn-primary" onclick="updateNotificationUI.installUpdate()">
                Restart & Install
            </button>
            <button class="btn btn-secondary" onclick="updateNotificationUI.hide()">
                Install Later
            </button>
        `;
        
        this.show();
    }

    /**
     * Show error notification
     */
    showError(error) {
        this.statusText.textContent = 'Update failed';
        this.versionInfo.textContent = error.message || 'An error occurred while checking for updates';
        this.progressContainer.classList.add('hidden');
        
        this.actionsContainer.innerHTML = `
            <button class="btn btn-primary" onclick="updateNotificationUI.checkForUpdates()">
                Try Again
            </button>
            <button class="btn btn-secondary" onclick="updateNotificationUI.hide()">
                Close
            </button>
        `;
        
        this.show();
    }

    /**
     * Hide notification if this was a manual check with no updates
     */
    hideIfManualCheck() {
        // Only hide if the notification is currently visible
        if (this.isVisible) {
            setTimeout(() => this.hide(), 2000);
        }
    }

    /**
     * Show the notification
     */
    show() {
        this.container.classList.remove('hidden');
        this.isVisible = true;
    }

    /**
     * Hide the notification
     */
    hide() {
        this.container.classList.add('hidden');
        this.isVisible = false;
    }

    /**
     * Download update
     */
    async downloadUpdate() {
        try {
            await window.electronAPI.updater.downloadUpdate();
        } catch (error) {
            console.error('[UpdateNotificationUI] Download failed:', error);
            this.showError(error);
        }
    }

    /**
     * Install update
     */
    async installUpdate() {
        try {
            await window.electronAPI.updater.quitAndInstall();
        } catch (error) {
            console.error('[UpdateNotificationUI] Install failed:', error);
        }
    }

    /**
     * Check for updates manually
     */
    async checkForUpdates() {
        try {
            this.showCheckingStatus();
            await window.electronAPI.updater.checkForUpdates();
        } catch (error) {
            console.error('[UpdateNotificationUI] Check failed:', error);
            this.showError(error);
        }
    }

    /**
     * Show settings dialog
     */
    async showSettings() {
        await this.loadSettings();
        this.settingsDialog.classList.remove('hidden');
    }

    /**
     * Hide settings dialog
     */
    hideSettings() {
        this.settingsDialog.classList.add('hidden');
    }

    /**
     * Load settings into the dialog
     */
    async loadSettings() {
        try {
            this.settings = await window.electronAPI.updater.getSettings();
            
            document.getElementById('auto-download-setting').checked = this.settings.autoDownload;
            document.getElementById('auto-install-setting').checked = this.settings.autoInstall;
            document.getElementById('check-startup-setting').checked = this.settings.checkOnStartup;
            document.getElementById('notify-user-setting').checked = this.settings.notifyUser;
            document.getElementById('silent-updates-setting').checked = this.settings.silentUpdates;
            document.getElementById('prerelease-setting').checked = this.settings.allowPrerelease;
            document.getElementById('check-interval-setting').value = this.settings.checkInterval.toString();
        } catch (error) {
            console.error('[UpdateNotificationUI] Failed to load settings:', error);
        }
    }

    /**
     * Save settings
     */
    async saveSettings() {
        try {
            const newSettings = {
                autoDownload: document.getElementById('auto-download-setting').checked,
                autoInstall: document.getElementById('auto-install-setting').checked,
                checkOnStartup: document.getElementById('check-startup-setting').checked,
                notifyUser: document.getElementById('notify-user-setting').checked,
                silentUpdates: document.getElementById('silent-updates-setting').checked,
                allowPrerelease: document.getElementById('prerelease-setting').checked,
                checkInterval: parseInt(document.getElementById('check-interval-setting').value)
            };

            await window.electronAPI.updater.updateSettings(newSettings);
            this.settings = newSettings;
            this.hideSettings();
            
            console.log('[UpdateNotificationUI] Settings saved:', newSettings);
        } catch (error) {
            console.error('[UpdateNotificationUI] Failed to save settings:', error);
        }
    }

    /**
     * Toggle release notes details
     */
    toggleDetails() {
        const content = this.detailsContent;
        const arrow = this.detailsContainer.querySelector('.toggle-arrow');
        
        if (content.style.display === 'none' || content.style.display === '') {
            content.style.display = 'block';
            arrow.textContent = '▲';
        } else {
            content.style.display = 'none';
            arrow.textContent = '▼';
        }
    }

    /**
     * Get current status
     */
    getStatus() {
        return {
            isVisible: this.isVisible,
            currentStatus: this.currentStatus,
            settings: this.settings
        };
    }
}

// Initialize the update notification UI when DOM is ready
let updateNotificationUI;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        updateNotificationUI = new UpdateNotificationUI();
    });
} else {
    updateNotificationUI = new UpdateNotificationUI();
}

// Export for global access
window.updateNotificationUI = updateNotificationUI;