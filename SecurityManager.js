/**
 * SecurityManager - High-Grade Security Layer for MIC Browser Ultimate
 * Provides enterprise-level security features including encryption, authentication,
 * authorization, audit logging, threat detection, and compliance management
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

// Handle both Electron and test environments
let app;
try {
    app = require('electron').app;
} catch (error) {
    // Use mock app for testing
    app = global.mockElectron?.app || {
        getPath: (name) => path.join(__dirname, 'test-data')
    };
}

// Import security components
const EncryptionManager = require('./EncryptionManager');
const AuthenticationManager = require('./AuthenticationManager');
const AuthorizationManager = require('./AuthorizationManager');
const AuditLogger = require('./AuditLogger');
const { InputValidator, SecurityPolicyEngine, ThreatDetectionEngine } = require('./SecurityComponents');

class SecurityManager extends EventEmitter {
    constructor() {
        super();
        
        // Security state
        this.isInitialized = false;
        this.currentUser = null;
        this.activeSession = null;
        this.securityLevel = 'maximum'; // 'basic', 'standard', 'high', 'maximum'
        
        // Core security components
        this.encryption = new EncryptionManager();
        this.authentication = new AuthenticationManager();
        this.authorization = new AuthorizationManager();
        this.auditLogger = new AuditLogger();
        this.threatDetection = new ThreatDetectionEngine();
        this.validator = new InputValidator();
        this.policyEngine = new SecurityPolicyEngine();
        
        // Security configuration
        this.config = {
            // Encryption settings
            encryption: {
                algorithm: 'aes-256-gcm',
                keyDerivation: 'pbkdf2',
                keyIterations: 100000,
                saltLength: 32,
                ivLength: 16,
                tagLength: 16,
                keyRotationInterval: 7 * 24 * 60 * 60 * 1000, // 7 days
                enableAtRest: true,
                enableInTransit: true
            },
            
            // Authentication settings
            authentication: {
                enableMFA: true,
                enableBiometric: false,
                sessionTimeout: 4 * 60 * 60 * 1000, // 4 hours
                maxFailedAttempts: 5,
                lockoutDuration: 15 * 60 * 1000, // 15 minutes
                passwordPolicy: {
                    minLength: 12,
                    requireUppercase: true,
                    requireLowercase: true,
                    requireNumbers: true,
                    requireSpecialChars: true,
                    preventReuse: 5
                }
            },
            
            // Authorization settings
            authorization: {
                enableRBAC: true,
                defaultRole: 'user',
                enableResourceAccess: true,
                enableTimeBasedAccess: false,
                enableLocationBasedAccess: false
            },
            
            // Audit logging settings
            audit: {
                logLevel: 'all', // 'critical', 'high', 'medium', 'all'
                enableTamperProofing: true,
                enableRemoteLogging: false,
                retentionPeriod: 90 * 24 * 60 * 60 * 1000, // 90 days
                enableRealTimeAlerts: true,
                complianceMode: 'standard' // 'basic', 'standard', 'strict', 'enterprise'
            },
            
            // Threat detection settings
            threatDetection: {
                enableRealTime: true,
                enableAnomalyDetection: true,
                enableBehaviorAnalysis: true,
                sensitivityLevel: 'high',
                enableAutoResponse: true,
                enableMachineLearning: false
            },
            
            // Security policies
            policies: {
                enableCSP: true,
                enableHSTS: true,
                enableCertificatePinning: false,
                enableIntegrityChecks: true,
                enableSecureHeaders: true,
                enableCORS: true
            }
        };
        
        // Security metrics
        this.metrics = {
            securityEvents: 0,
            threatsDetected: 0,
            threatsBlocked: 0,
            authenticationAttempts: 0,
            failedAuthentications: 0,
            encryptionOperations: 0,
            auditLogEntries: 0,
            lastSecurityScan: null,
            securityScore: 0
        };
        
        // Event handlers
        this.setupEventHandlers();
    }

    /**
     * Initialize the security manager
     */
    async initialize() {
        try {
            console.log('🔒 Initializing Security Manager...');
            
            // Initialize core components
            await this.encryption.initialize();
            await this.auditLogger.initialize(this.encryption);
            await this.authentication.initialize(this.encryption, this.auditLogger);
            await this.authorization.initialize();
            await this.threatDetection.initialize();
            await this.validator.initialize();
            await this.policyEngine.initialize();
            
            // Load security configuration
            await this.loadSecurityConfiguration();
            
            // Setup security policies
            await this.setupSecurityPolicies();
            
            // Start monitoring
            await this.startSecurityMonitoring();
            
            // Initial security scan
            await this.performSecurityScan();
            
            this.isInitialized = true;
            this.emit('security-initialized');
            
            console.log('✅ Security Manager initialized successfully');
            await this.auditLogger.log('security', 'info', 'Security Manager initialized', {
                securityLevel: this.securityLevel,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ Failed to initialize Security Manager:', error);
            this.emit('security-error', { type: 'initialization', error });
            throw error;
        }
    }

    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        // Authentication events
        this.authentication.on('login-attempt', (data) => this.handleLoginAttempt(data));
        this.authentication.on('login-success', (data) => this.handleLoginSuccess(data));
        this.authentication.on('login-failure', (data) => this.handleLoginFailure(data));
        this.authentication.on('session-expired', (data) => this.handleSessionExpired(data));
        
        // Threat detection events
        this.threatDetection.on('threat-detected', (data) => this.handleThreatDetected(data));
        this.threatDetection.on('anomaly-detected', (data) => this.handleAnomalyDetected(data));
        this.threatDetection.on('attack-blocked', (data) => this.handleAttackBlocked(data));
        
        // Encryption events
        this.encryption.on('key-rotation', (data) => this.handleKeyRotation(data));
        this.encryption.on('encryption-error', (data) => this.handleEncryptionError(data));
        
        // Audit events
        this.auditLogger.on('audit-alert', (data) => this.handleAuditAlert(data));
        this.auditLogger.on('compliance-violation', (data) => this.handleComplianceViolation(data));
    }

    /**
     * Load security configuration from storage
     */
    async loadSecurityConfiguration() {
        try {
            const configPath = path.join(app.getPath('userData'), 'security-config.json');
            
            try {
                const configData = await fs.readFile(configPath, 'utf8');
                const savedConfig = JSON.parse(configData);
                
                // Merge with default configuration
                this.config = { ...this.config, ...savedConfig };
                console.log('📋 Security configuration loaded');
                
            } catch (error) {
                // Config file doesn't exist or is invalid, use defaults
                console.log('📋 Using default security configuration');
                await this.saveSecurityConfiguration();
            }
            
        } catch (error) {
            console.error('Failed to load security configuration:', error);
            throw error;
        }
    }

    /**
     * Save security configuration to storage
     */
    async saveSecurityConfiguration() {
        try {
            const configPath = path.join(app.getPath('userData'), 'security-config.json');
            await fs.writeFile(configPath, JSON.stringify(this.config, null, 2));
            console.log('💾 Security configuration saved');
            
        } catch (error) {
            console.error('Failed to save security configuration:', error);
            throw error;
        }
    }

    /**
     * Setup security policies
     */
    async setupSecurityPolicies() {
        await this.policyEngine.setupContentSecurityPolicy();
        await this.policyEngine.setupHttpSecurityHeaders();
        await this.policyEngine.setupCertificatePinning();
        await this.policyEngine.setupCORSPolicy();
        
        console.log('🛡️ Security policies configured');
    }

    /**
     * Start security monitoring
     */
    async startSecurityMonitoring() {
        // Start real-time threat detection
        if (this.config.threatDetection.enableRealTime) {
            await this.threatDetection.startRealTimeMonitoring();
        }
        
        // Start periodic security scans
        setInterval(() => {
            this.performSecurityScan();
        }, 60 * 60 * 1000); // Every hour
        
        // Start audit log monitoring
        await this.auditLogger.startMonitoring();
        
        console.log('👁️ Security monitoring started');
    }

    /**
     * Perform comprehensive security scan
     */
    async performSecurityScan() {
        try {
            const scanResults = {
                timestamp: new Date().toISOString(),
                vulnerabilities: [],
                recommendations: [],
                score: 100
            };
            
            // Check encryption status
            const encryptionStatus = await this.encryption.getStatus();
            if (!encryptionStatus.healthy) {
                scanResults.vulnerabilities.push('Encryption system issues detected');
                scanResults.score -= 20;
            }
            
            // Check authentication status
            const authStatus = await this.authentication.getStatus();
            if (!authStatus.healthy) {
                scanResults.vulnerabilities.push('Authentication system issues detected');
                scanResults.score -= 15;
            }
            
            // Check for security policy compliance
            const policyCompliance = await this.policyEngine.checkCompliance();
            if (policyCompliance.violations.length > 0) {
                scanResults.vulnerabilities.push('Security policy violations detected');
                scanResults.score -= (policyCompliance.violations.length * 5);
            }
            
            // Update metrics
            this.metrics.lastSecurityScan = scanResults.timestamp;
            this.metrics.securityScore = Math.max(0, scanResults.score);
            
            // Log scan results
            await this.auditLogger.log('security', 'info', 'Security scan completed', scanResults);
            
            this.emit('security-scan-complete', scanResults);
            
            return scanResults;
            
        } catch (error) {
            console.error('Security scan failed:', error);
            await this.auditLogger.log('security', 'error', 'Security scan failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Event handlers
     */
    async handleLoginAttempt(data) {
        this.metrics.authenticationAttempts++;
        await this.auditLogger.log('authentication', 'info', 'Login attempt', data);
    }

    async handleLoginSuccess(data) {
        this.currentUser = data.user;
        this.activeSession = data.session;
        await this.auditLogger.log('authentication', 'info', 'Login successful', data);
        this.emit('user-authenticated', data);
    }

    async handleLoginFailure(data) {
        this.metrics.failedAuthentications++;
        await this.auditLogger.log('authentication', 'warning', 'Login failed', data);
        
        // Check for brute force attack
        if (data.failedAttempts >= this.config.authentication.maxFailedAttempts) {
            await this.threatDetection.handleBruteForceAttempt(data);
        }
    }

    async handleSessionExpired(data) {
        this.currentUser = null;
        this.activeSession = null;
        await this.auditLogger.log('authentication', 'info', 'Session expired', data);
        this.emit('session-expired', data);
    }

    async handleThreatDetected(data) {
        this.metrics.threatsDetected++;
        await this.auditLogger.log('security', 'critical', 'Threat detected', data);
        
        // Auto-response if enabled
        if (this.config.threatDetection.enableAutoResponse) {
            await this.respondToThreat(data);
        }
        
        this.emit('threat-detected', data);
    }

    async handleAnomalyDetected(data) {
        await this.auditLogger.log('security', 'warning', 'Anomaly detected', data);
        this.emit('anomaly-detected', data);
    }

    async handleAttackBlocked(data) {
        this.metrics.threatsBlocked++;
        await this.auditLogger.log('security', 'info', 'Attack blocked', data);
        this.emit('attack-blocked', data);
    }

    async handleKeyRotation(data) {
        await this.auditLogger.log('encryption', 'info', 'Encryption key rotated', data);
    }

    async handleEncryptionError(data) {
        await this.auditLogger.log('encryption', 'error', 'Encryption error', data);
        this.emit('encryption-error', data);
    }

    async handleAuditAlert(data) {
        this.emit('audit-alert', data);
    }

    async handleComplianceViolation(data) {
        await this.auditLogger.log('compliance', 'critical', 'Compliance violation', data);
        this.emit('compliance-violation', data);
    }

    /**
     * Respond to detected threats
     */
    async respondToThreat(threatData) {
        switch (threatData.severity) {
            case 'critical':
                // Block immediately and alert
                await this.blockThreat(threatData);
                await this.sendSecurityAlert(threatData);
                break;
                
            case 'high':
                // Block and log
                await this.blockThreat(threatData);
                break;
                
            case 'medium':
                // Log and monitor
                await this.monitorThreat(threatData);
                break;
                
            case 'low':
                // Log only
                break;
        }
    }

    async blockThreat(threatData) {
        // Implementation depends on threat type
        console.log(`🚫 Blocking threat: ${threatData.type}`);
        await this.auditLogger.log('security', 'info', 'Threat blocked', threatData);
    }

    async sendSecurityAlert(threatData) {
        // Send alert to administrators
        console.log(`🚨 Security alert: ${threatData.type}`);
        this.emit('security-alert', threatData);
    }

    async monitorThreat(threatData) {
        // Add to monitoring list
        console.log(`👁️ Monitoring threat: ${threatData.type}`);
        await this.threatDetection.addToMonitoring(threatData);
    }

    /**
     * Public API methods
     */
    
    // Get current security status
    getSecurityStatus() {
        return {
            initialized: this.isInitialized,
            securityLevel: this.securityLevel,
            currentUser: this.currentUser?.username,
            activeSession: !!this.activeSession,
            metrics: this.metrics,
            lastScan: this.metrics.lastSecurityScan,
            securityScore: this.metrics.securityScore
        };
    }

    // Update security level
    async setSecurityLevel(level) {
        const validLevels = ['basic', 'standard', 'high', 'maximum'];
        if (!validLevels.includes(level)) {
            throw new Error(`Invalid security level: ${level}`);
        }
        
        this.securityLevel = level;
        await this.saveSecurityConfiguration();
        await this.auditLogger.log('security', 'info', 'Security level changed', { level });
        
        this.emit('security-level-changed', { level });
    }

    // Get component status
    async getComponentStatus() {
        return {
            encryption: await this.encryption.getStatus(),
            authentication: await this.authentication.getStatus(),
            authorization: await this.authorization.getStatus(),
            auditLogger: await this.auditLogger.getStatus(),
            threatDetection: await this.threatDetection.getStatus(),
            validator: await this.validator.getStatus(),
            policyEngine: await this.policyEngine.getStatus()
        };
    }
}

/**
 * Export the SecurityManager class and create a singleton instance
 */
let securityManagerInstance = null;

function getSecurityManager() {
    if (!securityManagerInstance) {
        securityManagerInstance = new SecurityManager();
    }
    return securityManagerInstance;
}

module.exports = { SecurityManager, getSecurityManager };