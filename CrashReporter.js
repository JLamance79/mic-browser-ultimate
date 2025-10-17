/**
 * CrashReporter.js - Production Crash Reporting and Monitoring System
 * 
 * This module provides comprehensive crash reporting for MIC Browser Ultimate
 * with privacy-focused data collection, automatic error detection, and
 * production monitoring capabilities.
 * 
 * Features:
 * - Automatic crash detection and reporting
 * - Privacy-safe data collection
 * - Performance monitoring and metrics
 * - User consent and opt-out controls
 * - Local crash logs with rotation
 * - Anonymous crash reporting to improve stability
 * - Integration with analytics and telemetry
 * 
 * @version 1.0.0
 * @author MIC Browser Ultimate Team
 */

const { app, crashReporter, dialog, BrowserWindow } = require('electron');
const { EventEmitter } = require('events');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const crypto = require('crypto');

class CrashReportingSystem extends EventEmitter {
    constructor() {
        super();
        this.isEnabled = false;
        this.settings = {
            enabled: true,
            collectAnonymousData: true,
            collectSystemInfo: true,
            collectPerformanceData: true,
            sendCrashReports: false, // Opt-in for external reporting
            localLogging: true,
            maxLogFiles: 50,
            maxLogSizeBytes: 10 * 1024 * 1024, // 10MB per log
            reportingEndpoint: null, // Will be set in production
            retentionDays: 30
        };
        
        this.crashLogDir = null;
        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();
        this.crashCount = 0;
        this.performanceMetrics = {
            memoryUsage: [],
            cpuUsage: [],
            errors: [],
            warnings: []
        };
        
        this.isProduction = process.env.NODE_ENV === 'production';
        this.crashReportingActive = false;
        
        this.init();
    }

    /**
     * Initialize the crash reporting system
     */
    async init() {
        console.log('[CrashReporter] Initializing crash reporting system...');
        
        try {
            // Load settings
            await this.loadSettings();
            
            // Setup crash log directory
            await this.setupCrashLogDirectory();
            
            // Initialize Electron's crash reporter if enabled
            if (this.settings.enabled && this.isProduction) {
                this.initializeElectronCrashReporter();
            }
            
            // Setup process error handlers
            this.setupProcessErrorHandlers();
            
            // Start performance monitoring
            this.startPerformanceMonitoring();
            
            // Setup cleanup
            this.setupCleanup();
            
            console.log('[CrashReporter] Crash reporting system initialized');
            console.log('[CrashReporter] Settings:', {
                enabled: this.settings.enabled,
                production: this.isProduction,
                localLogging: this.settings.localLogging,
                anonymousData: this.settings.collectAnonymousData
            });
            
        } catch (error) {
            console.error('[CrashReporter] Failed to initialize:', error);
        }
    }

    /**
     * Generate a unique session ID
     */
    generateSessionId() {
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substring(2, 15);
        return `session_${timestamp}_${random}`;
    }

    /**
     * Setup crash log directory
     */
    async setupCrashLogDirectory() {
        try {
            this.crashLogDir = path.join(app.getPath('userData'), 'crash-logs');
            await fs.mkdir(this.crashLogDir, { recursive: true });
            console.log('[CrashReporter] Crash log directory:', this.crashLogDir);
        } catch (error) {
            console.error('[CrashReporter] Failed to create crash log directory:', error);
        }
    }

    /**
     * Initialize Electron's built-in crash reporter
     */
    initializeElectronCrashReporter() {
        try {
            const crashReporterConfig = {
                productName: 'MIC Browser Ultimate',
                companyName: 'MIC Browser Ultimate Team',
                submitURL: this.settings.reportingEndpoint || '', // External crash reporting service
                uploadToServer: this.settings.sendCrashReports && !!this.settings.reportingEndpoint,
                ignoreSystemCrashHandler: false,
                extra: {
                    sessionId: this.sessionId,
                    version: app.getVersion(),
                    platform: process.platform,
                    arch: process.arch,
                    nodeVersion: process.version,
                    electronVersion: process.versions.electron,
                    // Anonymous system info
                    totalMemory: this.settings.collectSystemInfo ? os.totalmem() : 0,
                    cpuCount: this.settings.collectSystemInfo ? os.cpus().length : 0
                }
            };

            crashReporter.start(crashReporterConfig);
            this.crashReportingActive = true;
            console.log('[CrashReporter] Electron crash reporter started');
            
        } catch (error) {
            console.error('[CrashReporter] Failed to start Electron crash reporter:', error);
        }
    }

    /**
     * Setup process-level error handlers
     */
    setupProcessErrorHandlers() {
        // Uncaught exceptions
        process.on('uncaughtException', (error) => {
            this.handleCrash('uncaughtException', error, {
                fatal: true,
                source: 'main-process'
            });
        });

        // Unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            this.handleCrash('unhandledRejection', reason, {
                fatal: false,
                source: 'main-process',
                promise: promise.toString()
            });
        });

        // Handle app crashes
        app.on('gpu-process-crashed', (event, killed) => {
            this.handleCrash('gpu-process-crashed', new Error('GPU process crashed'), {
                fatal: false,
                killed: killed,
                source: 'gpu-process'
            });
        });

        app.on('renderer-process-crashed', (event, webContents, killed) => {
            this.handleCrash('renderer-process-crashed', new Error('Renderer process crashed'), {
                fatal: false,
                killed: killed,
                source: 'renderer-process',
                url: webContents.getURL()
            });
        });

        app.on('child-process-gone', (event, details) => {
            this.handleCrash('child-process-gone', new Error('Child process gone'), {
                fatal: false,
                source: 'child-process',
                details: details
            });
        });

        console.log('[CrashReporter] Process error handlers setup complete');
    }

    /**
     * Handle a crash event
     */
    async handleCrash(type, error, metadata = {}) {
        this.crashCount++;
        
        console.error(`[CrashReporter] ${type}:`, error);
        
        try {
            const crashReport = await this.generateCrashReport(type, error, metadata);
            
            // Save to local log
            if (this.settings.localLogging) {
                await this.saveCrashLog(crashReport);
            }
            
            // Emit event for other systems
            this.emit('crash', crashReport);
            
            // Show user notification if enabled and not silent
            if (this.settings.enabled && !metadata.silent) {
                this.showCrashNotification(crashReport);
            }
            
            // Send to external service if enabled
            if (this.settings.sendCrashReports && this.settings.reportingEndpoint) {
                this.sendCrashReport(crashReport);
            }
            
        } catch (reportError) {
            console.error('[CrashReporter] Failed to handle crash:', reportError);
        }
    }

    /**
     * Generate a comprehensive crash report
     */
    async generateCrashReport(type, error, metadata = {}) {
        const timestamp = new Date().toISOString();
        const uptime = Date.now() - this.startTime;
        
        const crashReport = {
            id: crypto.randomUUID(),
            timestamp: timestamp,
            sessionId: this.sessionId,
            type: type,
            error: {
                name: error.name || 'Unknown',
                message: error.message || 'No message',
                stack: this.settings.collectAnonymousData ? error.stack : '[Redacted]'
            },
            metadata: metadata,
            system: this.settings.collectSystemInfo ? await this.getSystemInfo() : {},
            performance: this.settings.collectPerformanceData ? this.getPerformanceSnapshot() : {},
            application: {
                version: app.getVersion(),
                uptime: uptime,
                crashCount: this.crashCount,
                isPackaged: app.isPackaged,
                platform: process.platform,
                arch: process.arch
            },
            environment: {
                nodeVersion: process.version,
                electronVersion: process.versions.electron,
                chromeVersion: process.versions.chrome,
                v8Version: process.versions.v8
            }
        };

        return crashReport;
    }

    /**
     * Get system information (privacy-safe)
     */
    async getSystemInfo() {
        try {
            const memInfo = process.memoryUsage();
            
            return {
                platform: os.platform(),
                arch: os.arch(),
                release: os.release(),
                totalMemory: os.totalmem(),
                freeMemory: os.freemem(),
                cpuCount: os.cpus().length,
                loadAverage: os.loadavg(),
                processMemory: {
                    rss: memInfo.rss,
                    heapUsed: memInfo.heapUsed,
                    heapTotal: memInfo.heapTotal,
                    external: memInfo.external
                }
            };
        } catch (error) {
            console.error('[CrashReporter] Failed to get system info:', error);
            return {};
        }
    }

    /**
     * Get performance snapshot
     */
    getPerformanceSnapshot() {
        return {
            memoryUsage: this.performanceMetrics.memoryUsage.slice(-10), // Last 10 samples
            cpuUsage: this.performanceMetrics.cpuUsage.slice(-10),
            errorCount: this.performanceMetrics.errors.length,
            warningCount: this.performanceMetrics.warnings.length,
            recentErrors: this.performanceMetrics.errors.slice(-5) // Last 5 errors
        };
    }

    /**
     * Save crash log to local file
     */
    async saveCrashLog(crashReport) {
        try {
            if (!this.crashLogDir) return;
            
            const filename = `crash-${crashReport.timestamp.replace(/[:.]/g, '-')}-${crashReport.id.substring(0, 8)}.json`;
            const filepath = path.join(this.crashLogDir, filename);
            
            await fs.writeFile(filepath, JSON.stringify(crashReport, null, 2));
            console.log('[CrashReporter] Crash log saved:', filepath);
            
            // Clean up old logs
            await this.cleanupOldLogs();
            
        } catch (error) {
            console.error('[CrashReporter] Failed to save crash log:', error);
        }
    }

    /**
     * Clean up old crash logs
     */
    async cleanupOldLogs() {
        try {
            const files = await fs.readdir(this.crashLogDir);
            const crashLogs = files.filter(file => file.startsWith('crash-') && file.endsWith('.json'));
            
            if (crashLogs.length > this.settings.maxLogFiles) {
                // Sort by modification time and remove oldest
                const fileStats = await Promise.all(
                    crashLogs.map(async file => {
                        const stat = await fs.stat(path.join(this.crashLogDir, file));
                        return { file, mtime: stat.mtime };
                    })
                );
                
                fileStats.sort((a, b) => a.mtime - b.mtime);
                const filesToDelete = fileStats.slice(0, crashLogs.length - this.settings.maxLogFiles);
                
                for (const { file } of filesToDelete) {
                    await fs.unlink(path.join(this.crashLogDir, file));
                    console.log('[CrashReporter] Deleted old crash log:', file);
                }
            }
            
        } catch (error) {
            console.error('[CrashReporter] Failed to cleanup old logs:', error);
        }
    }

    /**
     * Show crash notification to user
     */
    showCrashNotification(crashReport) {
        try {
            const options = {
                type: 'error',
                title: 'Application Error',
                message: `MIC Browser Ultimate encountered an error and has recovered.`,
                detail: `Error: ${crashReport.error.name}\n\nThe error has been logged and will help improve the application. You can continue using the application normally.`,
                buttons: ['OK', 'View Details', 'Report Issue'],
                defaultId: 0,
                cancelId: 0
            };

            dialog.showMessageBox(BrowserWindow.getFocusedWindow(), options).then(result => {
                switch (result.response) {
                    case 1: // View Details
                        this.showCrashDetails(crashReport);
                        break;
                    case 2: // Report Issue
                        this.openIssueReporter(crashReport);
                        break;
                }
            });
            
        } catch (error) {
            console.error('[CrashReporter] Failed to show crash notification:', error);
        }
    }

    /**
     * Show crash details dialog
     */
    showCrashDetails(crashReport) {
        const details = `Crash Report Details:

ID: ${crashReport.id}
Type: ${crashReport.type}
Time: ${crashReport.timestamp}
Version: ${crashReport.application.version}
Platform: ${crashReport.application.platform}

Error: ${crashReport.error.name}
Message: ${crashReport.error.message}

Uptime: ${Math.round(crashReport.application.uptime / 1000)} seconds
Crash Count: ${crashReport.application.crashCount}

This information helps us improve the application stability.`;

        dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
            type: 'info',
            title: 'Crash Report Details',
            message: 'Technical Details',
            detail: details,
            buttons: ['OK', 'Copy to Clipboard'],
            defaultId: 0
        }).then(result => {
            if (result.response === 1) {
                require('electron').clipboard.writeText(details);
            }
        });
    }

    /**
     * Open issue reporter
     */
    openIssueReporter(crashReport) {
        const issueUrl = `https://github.com/JLamance79/mic-browser-ultimate/issues/new?` +
            `title=Crash Report: ${encodeURIComponent(crashReport.error.name)}&` +
            `body=${encodeURIComponent(`**Crash Report ID:** ${crashReport.id}\n**Type:** ${crashReport.type}\n**Error:** ${crashReport.error.message}\n\n**Steps to reproduce:**\n1. \n2. \n3. \n\n**Additional context:**\nAdd any additional context about the problem here.`)}`;
        
        require('electron').shell.openExternal(issueUrl);
    }

    /**
     * Send crash report to external service
     */
    async sendCrashReport(crashReport) {
        if (!this.settings.reportingEndpoint) return;
        
        try {
            // Remove sensitive information for external reporting
            const sanitizedReport = {
                ...crashReport,
                sessionId: crypto.createHash('sha256').update(crashReport.sessionId).digest('hex').substring(0, 16),
                error: {
                    ...crashReport.error,
                    stack: this.settings.collectAnonymousData ? crashReport.error.stack : '[Redacted]'
                }
            };
            
            // In a real implementation, you would send this to your crash reporting service
            console.log('[CrashReporter] Would send crash report to:', this.settings.reportingEndpoint);
            // Example: fetch(this.settings.reportingEndpoint, { method: 'POST', body: JSON.stringify(sanitizedReport) });
            
        } catch (error) {
            console.error('[CrashReporter] Failed to send crash report:', error);
        }
    }

    /**
     * Start performance monitoring
     */
    startPerformanceMonitoring() {
        if (!this.settings.collectPerformanceData) return;
        
        const monitorInterval = setInterval(() => {
            try {
                const memUsage = process.memoryUsage();
                const cpuUsage = process.cpuUsage();
                
                this.performanceMetrics.memoryUsage.push({
                    timestamp: Date.now(),
                    heapUsed: memUsage.heapUsed,
                    heapTotal: memUsage.heapTotal,
                    rss: memUsage.rss
                });
                
                this.performanceMetrics.cpuUsage.push({
                    timestamp: Date.now(),
                    user: cpuUsage.user,
                    system: cpuUsage.system
                });
                
                // Keep only last 100 samples
                if (this.performanceMetrics.memoryUsage.length > 100) {
                    this.performanceMetrics.memoryUsage = this.performanceMetrics.memoryUsage.slice(-100);
                }
                if (this.performanceMetrics.cpuUsage.length > 100) {
                    this.performanceMetrics.cpuUsage = this.performanceMetrics.cpuUsage.slice(-100);
                }
                
            } catch (error) {
                console.error('[CrashReporter] Performance monitoring error:', error);
            }
        }, 30000); // Every 30 seconds
        
        this.performanceMonitorInterval = monitorInterval;
        console.log('[CrashReporter] Performance monitoring started');
    }

    /**
     * Log an error for tracking
     */
    logError(error, context = {}) {
        const errorEntry = {
            timestamp: Date.now(),
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack
            },
            context: context
        };
        
        this.performanceMetrics.errors.push(errorEntry);
        
        // Keep only last 50 errors
        if (this.performanceMetrics.errors.length > 50) {
            this.performanceMetrics.errors = this.performanceMetrics.errors.slice(-50);
        }
        
        console.error('[CrashReporter] Error logged:', error.message);
    }

    /**
     * Log a warning for tracking
     */
    logWarning(message, context = {}) {
        const warningEntry = {
            timestamp: Date.now(),
            message: message,
            context: context
        };
        
        this.performanceMetrics.warnings.push(warningEntry);
        
        // Keep only last 50 warnings
        if (this.performanceMetrics.warnings.length > 50) {
            this.performanceMetrics.warnings = this.performanceMetrics.warnings.slice(-50);
        }
        
        console.warn('[CrashReporter] Warning logged:', message);
    }

    /**
     * Load settings from persistent storage
     */
    async loadSettings() {
        try {
            const settingsPath = path.join(app.getPath('userData'), 'crash-reporter-settings.json');
            const data = await fs.readFile(settingsPath, 'utf8');
            const savedSettings = JSON.parse(data);
            this.settings = { ...this.settings, ...savedSettings };
            console.log('[CrashReporter] Settings loaded');
        } catch (error) {
            console.log('[CrashReporter] No saved settings found, using defaults');
            await this.saveSettings();
        }
    }

    /**
     * Save settings to persistent storage
     */
    async saveSettings() {
        try {
            const settingsPath = path.join(app.getPath('userData'), 'crash-reporter-settings.json');
            await fs.writeFile(settingsPath, JSON.stringify(this.settings, null, 2));
            console.log('[CrashReporter] Settings saved');
        } catch (error) {
            console.error('[CrashReporter] Failed to save settings:', error);
        }
    }

    /**
     * Update settings
     */
    async updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        await this.saveSettings();
        
        // Restart crash reporter if needed
        if (newSettings.enabled !== undefined || newSettings.sendCrashReports !== undefined) {
            if (this.settings.enabled && !this.crashReportingActive && this.isProduction) {
                this.initializeElectronCrashReporter();
            }
        }
        
        this.emit('settings-updated', this.settings);
        console.log('[CrashReporter] Settings updated');
    }

    /**
     * Get crash statistics
     */
    async getCrashStatistics() {
        try {
            if (!this.crashLogDir) return { totalCrashes: 0, recentCrashes: [] };
            
            const files = await fs.readdir(this.crashLogDir);
            const crashLogs = files.filter(file => file.startsWith('crash-') && file.endsWith('.json'));
            
            const recentCrashes = [];
            const now = Date.now();
            const dayMs = 24 * 60 * 60 * 1000;
            
            for (const file of crashLogs.slice(-10)) { // Last 10 crashes
                try {
                    const filePath = path.join(this.crashLogDir, file);
                    const content = await fs.readFile(filePath, 'utf8');
                    const crash = JSON.parse(content);
                    
                    const crashTime = new Date(crash.timestamp).getTime();
                    if (now - crashTime < 7 * dayMs) { // Last 7 days
                        recentCrashes.push({
                            id: crash.id,
                            timestamp: crash.timestamp,
                            type: crash.type,
                            error: crash.error.name,
                            message: crash.error.message
                        });
                    }
                } catch (error) {
                    console.error('[CrashReporter] Failed to read crash log:', file, error);
                }
            }
            
            return {
                totalCrashes: crashLogs.length,
                sessionCrashes: this.crashCount,
                recentCrashes: recentCrashes.reverse(), // Most recent first
                uptime: Date.now() - this.startTime,
                sessionId: this.sessionId
            };
            
        } catch (error) {
            console.error('[CrashReporter] Failed to get crash statistics:', error);
            return { totalCrashes: 0, recentCrashes: [] };
        }
    }

    /**
     * Setup cleanup handlers
     */
    setupCleanup() {
        const cleanup = async () => {
            if (this.performanceMonitorInterval) {
                clearInterval(this.performanceMonitorInterval);
            }
            console.log('[CrashReporter] Cleanup complete');
        };

        app.on('before-quit', cleanup);
        process.on('exit', cleanup);
    }

    /**
     * Get current settings
     */
    getSettings() {
        return { ...this.settings };
    }

    /**
     * Get current status
     */
    getStatus() {
        return {
            enabled: this.settings.enabled,
            crashReportingActive: this.crashReportingActive,
            sessionId: this.sessionId,
            uptime: Date.now() - this.startTime,
            crashCount: this.crashCount,
            isProduction: this.isProduction,
            performanceMonitoring: this.settings.collectPerformanceData
        };
    }

    /**
     * Destroy the crash reporter
     */
    destroy() {
        if (this.performanceMonitorInterval) {
            clearInterval(this.performanceMonitorInterval);
        }
        this.removeAllListeners();
        console.log('[CrashReporter] Destroyed');
    }
}

module.exports = CrashReportingSystem;