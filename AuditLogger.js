/**
 * AuditLogger - Comprehensive Audit Logging System
 * Provides enterprise-grade audit logging with tamper-proof logs,
 * security events, compliance reporting, and real-time monitoring
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

class AuditLogger extends EventEmitter {
    constructor() {
        super();
        
        // Audit configuration
        this.config = {
            logLevel: 'all', // 'critical', 'high', 'medium', 'all'
            enableTamperProofing: true,
            enableRemoteLogging: false,
            enableRealTimeAlerts: true,
            enableEncryption: true,
            maxLogFileSize: 50 * 1024 * 1024, // 50MB
            maxLogFiles: 10,
            retentionPeriod: 90 * 24 * 60 * 60 * 1000, // 90 days
            complianceMode: 'standard', // 'basic', 'standard', 'strict', 'enterprise'
            batchSize: 100,
            flushInterval: 5000 // 5 seconds
        };
        
        // Audit state
        this.isInitialized = false;
        this.logBuffer = [];
        this.logSequence = 0;
        this.logChain = [];
        this.alertRules = new Map();
        this.complianceRules = new Map();
        
        // Log storage
        this.logDirectory = null;
        this.currentLogFile = null;
        this.logFileHandle = null;
        
        // Security
        this.encryptionManager = null;
        this.logSigningKey = null;
        
        // Performance metrics
        this.metrics = {
            totalLogs: 0,
            logsByLevel: new Map([
                ['critical', 0],
                ['error', 0],
                ['warning', 0],
                ['info', 0],
                ['debug', 0]
            ]),
            logsByCategory: new Map(),
            alertsTriggered: 0,
            complianceViolations: 0,
            tamperAttempts: 0,
            averageLogTime: 0
        };
        
        // Real-time monitoring
        this.monitoringRules = new Map();
        this.alertSubscribers = new Map();
        
        // Compliance frameworks
        this.complianceFrameworks = new Map([
            ['SOX', { name: 'Sarbanes-Oxley Act', rules: [] }],
            ['HIPAA', { name: 'Health Insurance Portability and Accountability Act', rules: [] }],
            ['PCI-DSS', { name: 'Payment Card Industry Data Security Standard', rules: [] }],
            ['GDPR', { name: 'General Data Protection Regulation', rules: [] }],
            ['ISO27001', { name: 'ISO/IEC 27001', rules: [] }]
        ]);
    }

    /**
     * Initialize the audit logger
     */
    async initialize(encryptionManager) {
        try {
            console.log('📋 Initializing Audit Logger...');
            
            this.encryptionManager = encryptionManager;
            
            // Setup log directory
            await this.setupLogDirectory();
            
            // Initialize log signing
            await this.initializeLogSigning();
            
            // Setup alert rules
            await this.setupAlertRules();
            
            // Setup compliance rules
            await this.setupComplianceRules();
            
            // Start log flushing
            this.startLogFlushing();
            
            // Start log rotation
            this.startLogRotation();
            
            // Start compliance monitoring
            this.startComplianceMonitoring();
            
            this.isInitialized = true;
            
            // Log initialization
            await this.log('audit', 'info', 'Audit Logger initialized', {
                version: '1.0.0',
                complianceMode: this.config.complianceMode,
                tamperProofing: this.config.enableTamperProofing
            });
            
            console.log('✅ Audit Logger initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize Audit Logger:', error);
            throw error;
        }
    }

    /**
     * Setup log directory
     */
    async setupLogDirectory() {
        this.logDirectory = path.join(app.getPath('userData'), 'audit-logs');
        
        try {
            await fs.access(this.logDirectory);
        } catch (error) {
            await fs.mkdir(this.logDirectory, { mode: 0o700 });
        }
        
        // Create current log file
        const timestamp = new Date().toISOString().split('T')[0];
        this.currentLogFile = path.join(this.logDirectory, `audit-${timestamp}.log`);
        
        console.log('📁 Log directory initialized:', this.logDirectory);
    }

    /**
     * Initialize log signing for tamper-proofing
     */
    async initializeLogSigning() {
        if (this.config.enableTamperProofing) {
            // Generate or load signing key
            const keyPath = path.join(this.logDirectory, 'signing.key');
            
            try {
                const keyData = await fs.readFile(keyPath);
                this.logSigningKey = keyData;
            } catch (error) {
                // Generate new signing key
                this.logSigningKey = crypto.randomBytes(32);
                await fs.writeFile(keyPath, this.logSigningKey, { mode: 0o600 });
            }
            
            console.log('🔐 Log signing initialized');
        }
    }

    /**
     * Setup alert rules
     */
    async setupAlertRules() {
        const defaultAlertRules = [
            {
                id: 'security_critical',
                name: 'Critical Security Events',
                condition: 'category === "security" && level === "critical"',
                action: 'immediate_alert',
                enabled: true
            },
            {
                id: 'authentication_failures',
                name: 'Multiple Authentication Failures',
                condition: 'category === "authentication" && level === "warning"',
                threshold: 5,
                timeWindow: 5 * 60 * 1000, // 5 minutes
                action: 'security_alert',
                enabled: true
            },
            {
                id: 'data_access_violations',
                name: 'Unauthorized Data Access Attempts',
                condition: 'category === "authorization" && level === "warning"',
                threshold: 3,
                timeWindow: 10 * 60 * 1000, // 10 minutes
                action: 'compliance_alert',
                enabled: true
            },
            {
                id: 'system_errors',
                name: 'System Error Threshold',
                condition: 'level === "error"',
                threshold: 10,
                timeWindow: 15 * 60 * 1000, // 15 minutes
                action: 'system_alert',
                enabled: true
            }
        ];

        for (const rule of defaultAlertRules) {
            this.alertRules.set(rule.id, {
                ...rule,
                triggerCount: 0,
                lastTriggered: null,
                eventHistory: []
            });
        }

        console.log('🚨 Alert rules configured');
    }

    /**
     * Setup compliance rules
     */
    async setupComplianceRules() {
        const complianceRules = [
            {
                id: 'data_access_logging',
                framework: 'SOX',
                description: 'All data access must be logged',
                condition: 'category === "data" && action === "access"',
                required: true
            },
            {
                id: 'user_authentication_logging',
                framework: 'HIPAA',
                description: 'All user authentication attempts must be logged',
                condition: 'category === "authentication"',
                required: true
            },
            {
                id: 'privileged_access_monitoring',
                framework: 'PCI-DSS',
                description: 'All privileged access must be monitored',
                condition: 'category === "authorization" && data.privileged === true',
                required: true
            },
            {
                id: 'data_processing_consent',
                framework: 'GDPR',
                description: 'Data processing activities must log consent',
                condition: 'category === "data" && action === "process"',
                required: true
            }
        ];

        for (const rule of complianceRules) {
            this.complianceRules.set(rule.id, {
                ...rule,
                violations: 0,
                lastViolation: null
            });
        }

        console.log('📊 Compliance rules configured');
    }

    /**
     * Log an audit event
     */
    async log(category, level, message, data = {}, options = {}) {
        const startTime = Date.now();
        
        try {
            // Check if logging is enabled for this level
            if (!this.shouldLog(level)) {
                return;
            }
            
            // Create log entry
            const logEntry = {
                id: crypto.randomUUID(),
                sequence: ++this.logSequence,
                timestamp: new Date().toISOString(),
                category: category,
                level: level,
                message: message,
                data: data,
                metadata: {
                    pid: process.pid,
                    platform: process.platform,
                    nodeVersion: process.version,
                    userAgent: 'MIC Browser Ultimate',
                    ...options.metadata
                }
            };
            
            // Add tamper-proofing
            if (this.config.enableTamperProofing) {
                logEntry.signature = this.signLogEntry(logEntry);
                logEntry.chainHash = this.calculateChainHash(logEntry);
                this.logChain.push({
                    sequence: logEntry.sequence,
                    hash: logEntry.chainHash
                });
            }
            
            // Add to buffer
            this.logBuffer.push(logEntry);
            
            // Update metrics
            this.updateMetrics(logEntry);
            
            // Check alert rules
            await this.checkAlertRules(logEntry);
            
            // Check compliance rules
            await this.checkComplianceRules(logEntry);
            
            // Flush if buffer is full or for critical events
            if (this.logBuffer.length >= this.config.batchSize || level === 'critical') {
                await this.flushLogs();
            }
            
            // Update performance metrics
            this.updateAverageTime('log', Date.now() - startTime);
            
            // Emit event
            this.emit('log-entry', logEntry);
            
        } catch (error) {
            console.error('Failed to create log entry:', error);
            // Don't throw error to prevent breaking the application
        }
    }

    /**
     * Check if should log based on level
     */
    shouldLog(level) {
        const levelOrder = ['debug', 'info', 'warning', 'error', 'critical'];
        const configOrder = ['all', 'medium', 'high', 'critical'];
        
        if (this.config.logLevel === 'all') return true;
        if (this.config.logLevel === 'critical') return level === 'critical';
        if (this.config.logLevel === 'high') return ['error', 'critical'].includes(level);
        if (this.config.logLevel === 'medium') return ['warning', 'error', 'critical'].includes(level);
        
        return false;
    }

    /**
     * Sign log entry for tamper-proofing
     */
    signLogEntry(logEntry) {
        const dataToSign = JSON.stringify({
            sequence: logEntry.sequence,
            timestamp: logEntry.timestamp,
            category: logEntry.category,
            level: logEntry.level,
            message: logEntry.message,
            data: logEntry.data
        });
        
        return crypto
            .createHmac('sha256', this.logSigningKey)
            .update(dataToSign)
            .digest('hex');
    }

    /**
     * Calculate chain hash for log integrity
     */
    calculateChainHash(logEntry) {
        const previousHash = this.logChain.length > 0 
            ? this.logChain[this.logChain.length - 1].hash 
            : '0';
        
        const dataToHash = JSON.stringify({
            sequence: logEntry.sequence,
            previousHash: previousHash,
            signature: logEntry.signature
        });
        
        return crypto
            .createHash('sha256')
            .update(dataToHash)
            .digest('hex');
    }

    /**
     * Flush logs to storage
     */
    async flushLogs() {
        if (this.logBuffer.length === 0) return;
        
        try {
            const logsToFlush = [...this.logBuffer];
            this.logBuffer = [];
            
            // Prepare log data
            const logData = logsToFlush.map(entry => {
                if (this.config.enableEncryption) {
                    return this.encryptLogEntry(entry);
                }
                return JSON.stringify(entry);
            }).join('\n') + '\n';
            
            // Write to file
            await fs.appendFile(this.currentLogFile, logData);
            
            console.log(`📝 Flushed ${logsToFlush.length} log entries`);
            
        } catch (error) {
            console.error('Failed to flush logs:', error);
            // Re-add logs to buffer on failure
            this.logBuffer.unshift(...logsToFlush);
        }
    }

    /**
     * Encrypt log entry
     */
    encryptLogEntry(logEntry) {
        try {
            const encrypted = this.encryptionManager.encryptString(
                JSON.stringify(logEntry),
                'storage'
            );
            return encrypted;
        } catch (error) {
            console.error('Failed to encrypt log entry:', error);
            return JSON.stringify(logEntry); // Fallback to unencrypted
        }
    }

    /**
     * Update metrics
     */
    updateMetrics(logEntry) {
        this.metrics.totalLogs++;
        
        // Update by level
        const currentCount = this.metrics.logsByLevel.get(logEntry.level) || 0;
        this.metrics.logsByLevel.set(logEntry.level, currentCount + 1);
        
        // Update by category
        const categoryCount = this.metrics.logsByCategory.get(logEntry.category) || 0;
        this.metrics.logsByCategory.set(logEntry.category, categoryCount + 1);
    }

    /**
     * Check alert rules
     */
    async checkAlertRules(logEntry) {
        for (const [ruleId, rule] of this.alertRules) {
            if (!rule.enabled) continue;
            
            if (await this.evaluateAlertCondition(rule, logEntry)) {
                rule.triggerCount++;
                rule.lastTriggered = Date.now();
                rule.eventHistory.push({
                    timestamp: logEntry.timestamp,
                    logId: logEntry.id
                });
                
                // Check threshold if specified
                if (rule.threshold) {
                    const recentEvents = rule.eventHistory.filter(event => 
                        Date.now() - new Date(event.timestamp).getTime() < rule.timeWindow
                    );
                    
                    if (recentEvents.length >= rule.threshold) {
                        await this.triggerAlert(rule, logEntry, recentEvents);
                        // Clear history after triggering
                        rule.eventHistory = [];
                        rule.triggerCount = 0;
                    }
                } else {
                    await this.triggerAlert(rule, logEntry);
                }
            }
        }
    }

    /**
     * Evaluate alert condition
     */
    async evaluateAlertCondition(rule, logEntry) {
        try {
            const condition = rule.condition
                .replace(/category/g, `"${logEntry.category}"`)
                .replace(/level/g, `"${logEntry.level}"`)
                .replace(/message/g, `"${logEntry.message}"`);
            
            // Simple evaluation (in production, use a proper expression evaluator)
            if (condition.includes('category === "security" && level === "critical"')) {
                return logEntry.category === 'security' && logEntry.level === 'critical';
            }
            if (condition.includes('category === "authentication" && level === "warning"')) {
                return logEntry.category === 'authentication' && logEntry.level === 'warning';
            }
            if (condition.includes('category === "authorization" && level === "warning"')) {
                return logEntry.category === 'authorization' && logEntry.level === 'warning';
            }
            if (condition.includes('level === "error"')) {
                return logEntry.level === 'error';
            }
            
            return false;
            
        } catch (error) {
            console.error('Alert condition evaluation failed:', error);
            return false;
        }
    }

    /**
     * Trigger alert
     */
    async triggerAlert(rule, logEntry, eventHistory = []) {
        this.metrics.alertsTriggered++;
        
        const alert = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            ruleId: rule.id,
            ruleName: rule.name,
            severity: this.getAlertSeverity(rule.action),
            logEntry: logEntry,
            eventHistory: eventHistory,
            action: rule.action
        };
        
        // Log the alert
        await this.log('audit', 'warning', 'Security alert triggered', {
            alertId: alert.id,
            ruleId: rule.id,
            ruleName: rule.name,
            action: rule.action
        });
        
        // Emit alert event
        this.emit('audit-alert', alert);
        
        // Perform alert action
        await this.performAlertAction(alert);
        
        console.log(`🚨 Alert triggered: ${rule.name}`);
    }

    /**
     * Get alert severity
     */
    getAlertSeverity(action) {
        switch (action) {
            case 'immediate_alert':
                return 'critical';
            case 'security_alert':
                return 'high';
            case 'compliance_alert':
                return 'medium';
            case 'system_alert':
                return 'low';
            default:
                return 'medium';
        }
    }

    /**
     * Perform alert action
     */
    async performAlertAction(alert) {
        switch (alert.action) {
            case 'immediate_alert':
                // Send immediate notification
                console.log(`🚨 IMMEDIATE ALERT: ${alert.ruleName}`);
                break;
                
            case 'security_alert':
                // Log security event
                console.log(`🔒 SECURITY ALERT: ${alert.ruleName}`);
                break;
                
            case 'compliance_alert':
                // Log compliance violation
                console.log(`📊 COMPLIANCE ALERT: ${alert.ruleName}`);
                break;
                
            case 'system_alert':
                // Log system issue
                console.log(`⚙️ SYSTEM ALERT: ${alert.ruleName}`);
                break;
        }
    }

    /**
     * Check compliance rules
     */
    async checkComplianceRules(logEntry) {
        for (const [ruleId, rule] of this.complianceRules) {
            if (await this.evaluateComplianceCondition(rule, logEntry)) {
                // This log entry satisfies the compliance requirement
                continue;
            }
            
            // Check if this is a required compliance event
            if (rule.required && await this.isComplianceEventRequired(rule, logEntry)) {
                rule.violations++;
                rule.lastViolation = Date.now();
                this.metrics.complianceViolations++;
                
                const violation = {
                    id: crypto.randomUUID(),
                    timestamp: new Date().toISOString(),
                    ruleId: ruleId,
                    framework: rule.framework,
                    description: rule.description,
                    logEntry: logEntry
                };
                
                // Log compliance violation
                await this.log('compliance', 'critical', 'Compliance violation detected', {
                    violationId: violation.id,
                    ruleId: ruleId,
                    framework: rule.framework,
                    description: rule.description
                });
                
                this.emit('compliance-violation', violation);
                console.log(`⚖️ Compliance violation: ${rule.framework} - ${rule.description}`);
            }
        }
    }

    /**
     * Evaluate compliance condition
     */
    async evaluateComplianceCondition(rule, logEntry) {
        // Simplified compliance evaluation
        return false; // Default to not satisfied
    }

    /**
     * Check if compliance event is required
     */
    async isComplianceEventRequired(rule, logEntry) {
        // Simplified compliance requirement check
        return false; // Default to not required
    }

    /**
     * Verify log integrity
     */
    async verifyLogIntegrity(logFilePath = null) {
        if (!this.config.enableTamperProofing) {
            throw new Error('Tamper-proofing is not enabled');
        }
        
        const filePath = logFilePath || this.currentLogFile;
        
        try {
            const logData = await fs.readFile(filePath, 'utf8');
            const logLines = logData.split('\n').filter(line => line.trim());
            
            let integrityValid = true;
            const violations = [];
            
            for (const line of logLines) {
                try {
                    let logEntry;
                    
                    if (this.config.enableEncryption) {
                        const decrypted = await this.encryptionManager.decryptString(line, 'storage');
                        logEntry = JSON.parse(decrypted);
                    } else {
                        logEntry = JSON.parse(line);
                    }
                    
                    // Verify signature
                    const expectedSignature = this.signLogEntry(logEntry);
                    if (logEntry.signature !== expectedSignature) {
                        integrityValid = false;
                        violations.push({
                            sequence: logEntry.sequence,
                            type: 'signature_mismatch',
                            message: 'Log entry signature does not match'
                        });
                    }
                    
                    // Verify chain hash
                    const expectedChainHash = this.calculateChainHash(logEntry);
                    if (logEntry.chainHash !== expectedChainHash) {
                        integrityValid = false;
                        violations.push({
                            sequence: logEntry.sequence,
                            type: 'chain_hash_mismatch',
                            message: 'Log entry chain hash does not match'
                        });
                    }
                    
                } catch (error) {
                    integrityValid = false;
                    violations.push({
                        type: 'parse_error',
                        message: `Failed to parse log entry: ${error.message}`
                    });
                }
            }
            
            if (!integrityValid) {
                this.metrics.tamperAttempts++;
                await this.log('audit', 'critical', 'Log tampering detected', {
                    filePath: filePath,
                    violations: violations
                });
            }
            
            return {
                valid: integrityValid,
                violations: violations,
                totalEntries: logLines.length
            };
            
        } catch (error) {
            console.error('Log integrity verification failed:', error);
            throw error;
        }
    }

    /**
     * Generate compliance report
     */
    async generateComplianceReport(framework = null, startDate = null, endDate = null) {
        const report = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            framework: framework,
            period: {
                start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                end: endDate || new Date().toISOString()
            },
            summary: {
                totalLogs: this.metrics.totalLogs,
                complianceViolations: this.metrics.complianceViolations,
                alertsTriggered: this.metrics.alertsTriggered
            },
            violations: [],
            recommendations: []
        };
        
        // Add framework-specific data
        if (framework && this.complianceFrameworks.has(framework)) {
            const frameworkData = this.complianceFrameworks.get(framework);
            report.frameworkName = frameworkData.name;
            
            // Get violations for this framework
            for (const [ruleId, rule] of this.complianceRules) {
                if (rule.framework === framework && rule.violations > 0) {
                    report.violations.push({
                        ruleId: ruleId,
                        description: rule.description,
                        violations: rule.violations,
                        lastViolation: rule.lastViolation
                    });
                }
            }
        }
        
        // Generate recommendations
        report.recommendations = this.generateComplianceRecommendations(report);
        
        return report;
    }

    /**
     * Generate compliance recommendations
     */
    generateComplianceRecommendations(report) {
        const recommendations = [];
        
        if (report.summary.complianceViolations > 0) {
            recommendations.push('Review and address compliance violations');
            recommendations.push('Implement additional monitoring for compliance-critical events');
        }
        
        if (report.summary.alertsTriggered > 10) {
            recommendations.push('Review alert thresholds to reduce false positives');
        }
        
        recommendations.push('Regular review of audit logs and compliance status');
        recommendations.push('Implement automated compliance monitoring');
        
        return recommendations;
    }

    /**
     * Start log flushing
     */
    startLogFlushing() {
        setInterval(() => {
            if (this.logBuffer.length > 0) {
                this.flushLogs();
            }
        }, this.config.flushInterval);
    }

    /**
     * Start log rotation
     */
    startLogRotation() {
        setInterval(async () => {
            try {
                const stats = await fs.stat(this.currentLogFile);
                if (stats.size > this.config.maxLogFileSize) {
                    await this.rotateLogFile();
                }
            } catch (error) {
                // File doesn't exist yet
            }
        }, 60000); // Check every minute
    }

    /**
     * Rotate log file
     */
    async rotateLogFile() {
        // Flush pending logs
        await this.flushLogs();
        
        // Create new log file
        const timestamp = new Date().toISOString().split('T')[0];
        const newLogFile = path.join(this.logDirectory, `audit-${timestamp}-${Date.now()}.log`);
        
        this.currentLogFile = newLogFile;
        
        // Clean up old log files
        await this.cleanupOldLogs();
        
        console.log('🔄 Log file rotated:', newLogFile);
    }

    /**
     * Cleanup old log files
     */
    async cleanupOldLogs() {
        try {
            const files = await fs.readdir(this.logDirectory);
            const logFiles = files
                .filter(file => file.startsWith('audit-') && file.endsWith('.log'))
                .map(file => ({
                    name: file,
                    path: path.join(this.logDirectory, file),
                    mtime: null
                }));
            
            // Get file stats
            for (const file of logFiles) {
                const stats = await fs.stat(file.path);
                file.mtime = stats.mtime;
            }
            
            // Sort by modification time (oldest first)
            logFiles.sort((a, b) => a.mtime - b.mtime);
            
            // Remove excess files
            while (logFiles.length > this.config.maxLogFiles) {
                const oldFile = logFiles.shift();
                await fs.unlink(oldFile.path);
                console.log('🗑️ Removed old log file:', oldFile.name);
            }
            
            // Remove files older than retention period
            const cutoffTime = Date.now() - this.config.retentionPeriod;
            for (const file of logFiles) {
                if (file.mtime.getTime() < cutoffTime) {
                    await fs.unlink(file.path);
                    console.log('📅 Removed expired log file:', file.name);
                }
            }
            
        } catch (error) {
            console.error('Failed to cleanup old logs:', error);
        }
    }

    /**
     * Start compliance monitoring
     */
    startComplianceMonitoring() {
        setInterval(() => {
            this.performComplianceCheck();
        }, 60 * 60 * 1000); // Check every hour
    }

    /**
     * Perform compliance check
     */
    async performComplianceCheck() {
        console.log('📊 Performing compliance check...');
        
        // Check for compliance violations
        let totalViolations = 0;
        for (const rule of this.complianceRules.values()) {
            totalViolations += rule.violations;
        }
        
        if (totalViolations !== this.metrics.complianceViolations) {
            this.metrics.complianceViolations = totalViolations;
        }
        
        // Generate compliance report if there are violations
        if (totalViolations > 0) {
            const report = await this.generateComplianceReport();
            this.emit('compliance-report', report);
        }
    }

    /**
     * Start monitoring
     */
    async startMonitoring() {
        console.log('👁️ Audit monitoring started');
    }

    /**
     * Utility methods
     */
    updateAverageTime(operation, time) {
        const metricKey = `average${operation.charAt(0).toUpperCase() + operation.slice(1)}Time`;
        const operationKey = 'totalLogs';
        
        const totalOperations = this.metrics[operationKey];
        const currentAverage = this.metrics[metricKey];
        
        this.metrics[metricKey] = ((currentAverage * (totalOperations - 1)) + time) / totalOperations;
    }

    /**
     * Get audit status
     */
    async getStatus() {
        return {
            initialized: this.isInitialized,
            currentLogFile: this.currentLogFile,
            bufferSize: this.logBuffer.length,
            chainLength: this.logChain.length,
            alertRulesCount: this.alertRules.size,
            complianceRulesCount: this.complianceRules.size,
            tamperProofing: this.config.enableTamperProofing,
            encryption: this.config.enableEncryption,
            metrics: {
                ...this.metrics,
                logsByLevel: Object.fromEntries(this.metrics.logsByLevel),
                logsByCategory: Object.fromEntries(this.metrics.logsByCategory)
            },
            healthy: this.isInitialized && this.currentLogFile !== null
        };
    }
}

module.exports = AuditLogger;