/**
 * DeepLinkManager.js
 * 
 * Comprehensive deep linking system for MIC Browser Ultimate
 * Handles custom protocol registration, URL parsing, routing, and security validation
 * 
 * Features:
 * - Custom mic-browser:// protocol handling
 * - Secure URL parsing and validation
 * - Application feature routing
 * - Protocol registration management
 * - Security controls and allowlist management
 * - Deep link history and analytics
 * 
 * @version 1.0.0
 */

const { app, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');
const crypto = require('crypto');

class DeepLinkManager {
    constructor(options = {}) {
        this.protocol = options.protocol || 'mic-browser';
        this.isInitialized = false;
        
        // Configuration
        this.config = {
            protocol: this.protocol,
            enableSecurityValidation: options.enableSecurityValidation !== false,
            enableLogging: options.enableLogging !== false,
            allowedDomains: options.allowedDomains || [],
            maxUrlLength: options.maxUrlLength || 2048,
            enableHistory: options.enableHistory !== false,
            historyLimit: options.historyLimit || 1000,
            ...options
        };

        // Internal state
        this.linkHistory = [];
        this.registeredRoutes = new Map();
        this.securityRules = new Set();
        this.statistics = {
            totalLinks: 0,
            validLinks: 0,
            rejectedLinks: 0,
            lastActivity: null
        };

        // Event handlers
        this.eventHandlers = new Map();
        
        // Initialize security rules
        this.initializeSecurityRules();
        
        console.log('[DeepLinkManager] Initialized with protocol:', this.protocol);
    }

    /**
     * Initialize the deep link manager
     */
    async initialize() {
        try {
            console.log('[DeepLinkManager] Initializing deep link system...');

            // Register default routes
            this.registerDefaultRoutes();

            // Set up protocol handling
            await this.registerProtocolHandler();

            // Load saved settings and history
            await this.loadSettings();
            await this.loadHistory();

            // Set up event listeners
            this.setupEventListeners();

            this.isInitialized = true;
            console.log('[DeepLinkManager] Deep link system initialized successfully');

            return true;
        } catch (error) {
            console.error('[DeepLinkManager] Failed to initialize:', error);
            throw error;
        }
    }

    /**
     * Register the custom protocol handler
     */
    async registerProtocolHandler() {
        try {
            // Check if already registered
            if (app.isDefaultProtocolClient(this.protocol)) {
                console.log(`[DeepLinkManager] Protocol ${this.protocol}:// already registered`);
                return true;
            }

            // Register the protocol
            const success = app.setAsDefaultProtocolClient(this.protocol);
            if (success) {
                console.log(`[DeepLinkManager] Successfully registered protocol: ${this.protocol}://`);
            } else {
                console.warn(`[DeepLinkManager] Failed to register protocol: ${this.protocol}://`);
            }

            return success;
        } catch (error) {
            console.error('[DeepLinkManager] Error registering protocol:', error);
            return false;
        }
    }

    /**
     * Unregister the protocol handler
     */
    unregisterProtocolHandler() {
        try {
            if (app.isDefaultProtocolClient(this.protocol)) {
                const success = app.removeAsDefaultProtocolClient(this.protocol);
                console.log(`[DeepLinkManager] Protocol ${this.protocol}:// unregistered:`, success);
                return success;
            }
            return true;
        } catch (error) {
            console.error('[DeepLinkManager] Error unregistering protocol:', error);
            return false;
        }
    }

    /**
     * Handle incoming deep link
     */
    async handleDeepLink(url) {
        try {
            console.log('[DeepLinkManager] Processing deep link:', url);
            
            this.statistics.totalLinks++;
            this.statistics.lastActivity = new Date();

            // Validate the URL
            const validation = await this.validateUrl(url);
            if (!validation.isValid) {
                console.warn('[DeepLinkManager] URL validation failed:', validation.reason);
                this.statistics.rejectedLinks++;
                this.emit('link-rejected', { url, reason: validation.reason });
                return { success: false, error: validation.reason };
            }

            // Parse the URL
            const parsedUrl = this.parseDeepLink(url);
            if (!parsedUrl) {
                console.error('[DeepLinkManager] Failed to parse URL:', url);
                this.statistics.rejectedLinks++;
                return { success: false, error: 'Invalid URL format' };
            }

            // Route the request
            const result = await this.routeDeepLink(parsedUrl);
            
            if (result.success) {
                this.statistics.validLinks++;
                
                // Add to history
                if (this.config.enableHistory) {
                    this.addToHistory(url, parsedUrl, result);
                }

                this.emit('link-handled', { url, parsedUrl, result });
            } else {
                this.statistics.rejectedLinks++;
                this.emit('link-failed', { url, parsedUrl, result });
            }

            return result;

        } catch (error) {
            console.error('[DeepLinkManager] Error handling deep link:', error);
            this.statistics.rejectedLinks++;
            return { success: false, error: error.message };
        }
    }

    /**
     * Parse deep link URL
     */
    parseDeepLink(urlString) {
        try {
            const parsedUrl = new URL(urlString);
            
            // Validate protocol
            if (parsedUrl.protocol !== `${this.protocol}:`) {
                return null;
            }

            // Extract components
            const action = parsedUrl.hostname || parsedUrl.pathname.split('/')[1];
            const path = parsedUrl.pathname;
            const params = Object.fromEntries(parsedUrl.searchParams);
            const hash = parsedUrl.hash ? parsedUrl.hash.substring(1) : null;

            return {
                original: urlString,
                protocol: parsedUrl.protocol,
                action: action,
                path: path,
                params: params,
                hash: hash,
                timestamp: new Date()
            };

        } catch (error) {
            console.error('[DeepLinkManager] Error parsing URL:', error);
            return null;
        }
    }

    /**
     * Route deep link to appropriate handler
     */
    async routeDeepLink(parsedUrl) {
        try {
            const { action, path, params } = parsedUrl;
            
            console.log(`[DeepLinkManager] Routing action: ${action}`);

            // Check if we have a registered route
            if (this.registeredRoutes.has(action)) {
                const routeHandler = this.registeredRoutes.get(action);
                return await routeHandler(parsedUrl);
            }

            // Handle built-in routes
            switch (action) {
                case 'open':
                    return await this.handleOpenAction(parsedUrl);
                
                case 'chat':
                    return await this.handleChatAction(parsedUrl);
                
                case 'search':
                    return await this.handleSearchAction(parsedUrl);
                
                case 'settings':
                    return await this.handleSettingsAction(parsedUrl);
                
                case 'ocr':
                    return await this.handleOCRAction(parsedUrl);
                
                case 'transfer':
                    return await this.handleTransferAction(parsedUrl);
                
                case 'auth':
                    return await this.handleAuthAction(parsedUrl);
                
                default:
                    console.warn('[DeepLinkManager] Unknown action:', action);
                    return { 
                        success: false, 
                        error: `Unknown action: ${action}`,
                        suggestions: Array.from(this.registeredRoutes.keys())
                    };
            }

        } catch (error) {
            console.error('[DeepLinkManager] Error routing deep link:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Register a custom route handler
     */
    registerRoute(action, handler) {
        if (typeof handler !== 'function') {
            throw new Error('Route handler must be a function');
        }
        
        this.registeredRoutes.set(action, handler);
        console.log(`[DeepLinkManager] Registered route: ${action}`);
    }

    /**
     * Register default routes
     */
    registerDefaultRoutes() {
        // These are handled in the switch statement in routeDeepLink
        console.log('[DeepLinkManager] Default routes registered');
    }

    /**
     * Handle 'open' action - open URL in browser
     */
    async handleOpenAction(parsedUrl) {
        try {
            const targetUrl = parsedUrl.params.url;
            if (!targetUrl) {
                return { success: false, error: 'Missing URL parameter' };
            }

            // Validate the target URL
            if (!this.isValidExternalUrl(targetUrl)) {
                return { success: false, error: 'Invalid external URL' };
            }

            // Open in browser
            await shell.openExternal(targetUrl);
            
            return { 
                success: true, 
                action: 'open',
                target: targetUrl,
                message: 'URL opened successfully'
            };

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Handle 'chat' action - navigate to chat
     */
    async handleChatAction(parsedUrl) {
        try {
            const room = parsedUrl.params.room;
            const message = parsedUrl.params.message;

            const result = {
                success: true,
                action: 'chat',
                data: { room, message },
                message: 'Chat navigation triggered'
            };

            this.emit('navigate-to-chat', { room, message });
            return result;

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Handle 'search' action - perform search
     */
    async handleSearchAction(parsedUrl) {
        try {
            const query = parsedUrl.params.q || parsedUrl.params.query;
            if (!query) {
                return { success: false, error: 'Missing search query' };
            }

            const result = {
                success: true,
                action: 'search',
                data: { query },
                message: 'Search triggered'
            };

            this.emit('perform-search', { query });
            return result;

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Handle 'settings' action - open settings
     */
    async handleSettingsAction(parsedUrl) {
        try {
            const section = parsedUrl.params.section;
            
            const result = {
                success: true,
                action: 'settings',
                data: { section },
                message: 'Settings navigation triggered'
            };

            this.emit('navigate-to-settings', { section });
            return result;

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Handle 'ocr' action - OCR functionality
     */
    async handleOCRAction(parsedUrl) {
        try {
            const filePath = parsedUrl.params.file;
            const language = parsedUrl.params.lang || 'en';

            const result = {
                success: true,
                action: 'ocr',
                data: { filePath, language },
                message: 'OCR processing triggered'
            };

            this.emit('trigger-ocr', { filePath, language });
            return result;

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Handle 'transfer' action - data transfer
     */
    async handleTransferAction(parsedUrl) {
        try {
            const transferId = parsedUrl.params.id;
            const action = parsedUrl.params.action || 'receive';

            const result = {
                success: true,
                action: 'transfer',
                data: { transferId, action },
                message: 'Data transfer triggered'
            };

            this.emit('handle-transfer', { transferId, action });
            return result;

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Handle 'auth' action - authentication
     */
    async handleAuthAction(parsedUrl) {
        try {
            const token = parsedUrl.params.token;
            const action = parsedUrl.params.action || 'login';

            if (!token && action === 'login') {
                return { success: false, error: 'Missing authentication token' };
            }

            const result = {
                success: true,
                action: 'auth',
                data: { token, action },
                message: 'Authentication triggered'
            };

            this.emit('handle-auth', { token, action });
            return result;

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Validate incoming URL
     */
    async validateUrl(urlString) {
        try {
            // Basic validations
            if (!urlString || typeof urlString !== 'string') {
                return { isValid: false, reason: 'Invalid URL format' };
            }

            if (urlString.length > this.config.maxUrlLength) {
                return { isValid: false, reason: 'URL too long' };
            }

            // Protocol validation
            if (!urlString.startsWith(`${this.protocol}:`)) {
                return { isValid: false, reason: 'Invalid protocol' };
            }

            // Security validation
            if (this.config.enableSecurityValidation) {
                const securityCheck = await this.performSecurityValidation(urlString);
                if (!securityCheck.isValid) {
                    return securityCheck;
                }
            }

            return { isValid: true };

        } catch (error) {
            return { isValid: false, reason: error.message };
        }
    }

    /**
     * Perform security validation
     */
    async performSecurityValidation(urlString) {
        try {
            // Check against security rules
            for (const rule of this.securityRules) {
                if (rule.test(urlString)) {
                    return { isValid: false, reason: 'URL blocked by security rule' };
                }
            }

            // Check for suspicious patterns
            const suspiciousPatterns = [
                /javascript:/i,
                /data:/i,
                /file:/i,
                /<script/i,
                /eval\(/i,
                /\.exe$/i,
                /\.bat$/i,
                /\.cmd$/i
            ];

            for (const pattern of suspiciousPatterns) {
                if (pattern.test(urlString)) {
                    return { isValid: false, reason: 'Suspicious content detected' };
                }
            }

            return { isValid: true };

        } catch (error) {
            return { isValid: false, reason: error.message };
        }
    }

    /**
     * Initialize security rules
     */
    initializeSecurityRules() {
        // Add default security rules
        this.securityRules.add(/[<>'"]/); // Prevent XSS-like content
        this.securityRules.add(/\.\./); // Prevent directory traversal
        
        console.log('[DeepLinkManager] Security rules initialized');
    }

    /**
     * Add security rule
     */
    addSecurityRule(pattern) {
        if (pattern instanceof RegExp) {
            this.securityRules.add(pattern);
        } else if (typeof pattern === 'string') {
            this.securityRules.add(new RegExp(pattern, 'i'));
        }
    }

    /**
     * Validate external URL
     */
    isValidExternalUrl(urlString) {
        try {
            const url = new URL(urlString);
            return ['http:', 'https:'].includes(url.protocol);
        } catch {
            return false;
        }
    }

    /**
     * Add link to history
     */
    addToHistory(url, parsedUrl, result) {
        try {
            const historyEntry = {
                id: crypto.randomUUID(),
                url: url,
                parsedUrl: parsedUrl,
                result: result,
                timestamp: new Date(),
                success: result.success
            };

            this.linkHistory.unshift(historyEntry);

            // Trim history if needed
            if (this.linkHistory.length > this.config.historyLimit) {
                this.linkHistory = this.linkHistory.slice(0, this.config.historyLimit);
            }

            console.log('[DeepLinkManager] Added to history:', url);

        } catch (error) {
            console.error('[DeepLinkManager] Error adding to history:', error);
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for second instance events (Windows/Linux)
        app.on('second-instance', (event, commandLine, workingDirectory) => {
            // Find protocol URL in command line
            const protocolUrl = commandLine.find(arg => arg.startsWith(`${this.protocol}:`));
            if (protocolUrl) {
                this.handleDeepLink(protocolUrl);
            }
        });

        // Listen for open-url events (macOS)
        app.on('open-url', (event, url) => {
            event.preventDefault();
            this.handleDeepLink(url);
        });

        console.log('[DeepLinkManager] Event listeners set up');
    }

    /**
     * Event emitter functionality
     */
    on(event, callback) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(callback);
    }

    emit(event, data) {
        if (this.eventHandlers.has(event)) {
            this.eventHandlers.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[DeepLinkManager] Event handler error for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Get link history
     */
    getHistory() {
        return this.linkHistory;
    }

    /**
     * Get statistics
     */
    getStatistics() {
        return { ...this.statistics };
    }

    /**
     * Get current settings
     */
    getSettings() {
        return { ...this.config };
    }

    /**
     * Update settings
     */
    async updateSettings(newSettings) {
        try {
            this.config = { ...this.config, ...newSettings };
            await this.saveSettings();
            console.log('[DeepLinkManager] Settings updated');
            return true;
        } catch (error) {
            console.error('[DeepLinkManager] Error updating settings:', error);
            return false;
        }
    }

    /**
     * Generate deep link URL
     */
    generateDeepLink(action, params = {}) {
        try {
            const url = new URL(`${this.protocol}://${action}`);
            
            Object.entries(params).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    url.searchParams.set(key, value.toString());
                }
            });

            return url.toString();
        } catch (error) {
            console.error('[DeepLinkManager] Error generating deep link:', error);
            return null;
        }
    }

    /**
     * Load settings from storage
     */
    async loadSettings() {
        try {
            // Implementation would load from persistent storage
            console.log('[DeepLinkManager] Settings loaded');
        } catch (error) {
            console.error('[DeepLinkManager] Error loading settings:', error);
        }
    }

    /**
     * Save settings to storage
     */
    async saveSettings() {
        try {
            // Implementation would save to persistent storage
            console.log('[DeepLinkManager] Settings saved');
        } catch (error) {
            console.error('[DeepLinkManager] Error saving settings:', error);
        }
    }

    /**
     * Load history from storage
     */
    async loadHistory() {
        try {
            // Implementation would load from persistent storage
            console.log('[DeepLinkManager] History loaded');
        } catch (error) {
            console.error('[DeepLinkManager] Error loading history:', error);
        }
    }

    /**
     * Clear history
     */
    clearHistory() {
        this.linkHistory = [];
        console.log('[DeepLinkManager] History cleared');
    }

    /**
     * Cleanup and shutdown
     */
    async destroy() {
        try {
            console.log('[DeepLinkManager] Shutting down...');
            
            // Unregister protocol
            this.unregisterProtocolHandler();
            
            // Clear event handlers
            this.eventHandlers.clear();
            
            // Save final state
            await this.saveSettings();
            
            this.isInitialized = false;
            console.log('[DeepLinkManager] Shutdown complete');
            
        } catch (error) {
            console.error('[DeepLinkManager] Error during shutdown:', error);
        }
    }
}

module.exports = DeepLinkManager;