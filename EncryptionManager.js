/**
 * EncryptionManager - Advanced Encryption System
 * Provides enterprise-grade encryption with AES-256-GCM, key derivation,
 * secure key management, and cryptographic operations
 */

const crypto = require('crypto');
const { EventEmitter } = require('events');
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

class EncryptionManager extends EventEmitter {
    constructor() {
        super();
        
        // Encryption configuration
        this.config = {
            algorithm: 'aes-256-gcm',
            keyDerivation: 'pbkdf2',
            keyIterations: 100000,
            saltLength: 32,
            ivLength: 16,
            tagLength: 16,
            keyLength: 32,
            keyRotationInterval: 7 * 24 * 60 * 60 * 1000, // 7 days
            enableKeyRotation: true,
            enableHardwareAcceleration: true
        };
        
        // Key management
        this.masterKey = null;
        this.encryptionKeys = new Map();
        this.keyHistory = new Map();
        this.keyRotationTimer = null;
        
        // Encryption state
        this.isInitialized = false;
        this.keyStore = null;
        this.secureMemo = new Map(); // Secure memoization cache
        
        // Performance metrics
        this.metrics = {
            encryptionOperations: 0,
            decryptionOperations: 0,
            keyRotations: 0,
            keyDerivations: 0,
            totalBytesEncrypted: 0,
            totalBytesDecrypted: 0,
            averageEncryptionTime: 0,
            averageDecryptionTime: 0
        };
    }

    /**
     * Initialize the encryption manager
     */
    async initialize() {
        try {
            console.log('🔐 Initializing Encryption Manager...');
            
            // Initialize key store
            await this.initializeKeyStore();
            
            // Load or generate master key
            await this.initializeMasterKey();
            
            // Initialize encryption keys
            await this.initializeEncryptionKeys();
            
            // Set initialized flag before verification
            this.isInitialized = true;
            
            // Verify encryption functionality
            await this.verifyEncryption();
            
            // Start key rotation if enabled
            if (this.config.enableKeyRotation) {
                this.startKeyRotation();
            }
            console.log('✅ Encryption Manager initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize Encryption Manager:', error);
            throw error;
        }
    }

    /**
     * Initialize secure key store
     */
    async initializeKeyStore() {
        const keyStorePath = path.join(app.getPath('userData'), 'keys');
        
        try {
            await fs.access(keyStorePath);
        } catch (error) {
            // Create key store directory
            await fs.mkdir(keyStorePath, { mode: 0o700 });
        }
        
        this.keyStore = keyStorePath;
        console.log('🗝️ Key store initialized');
    }

    /**
     * Initialize or load master key
     */
    async initializeMasterKey() {
        const masterKeyPath = path.join(this.keyStore, 'master.key');
        
        try {
            // Try to load existing master key
            const keyData = await fs.readFile(masterKeyPath);
            const parsedData = JSON.parse(keyData.toString());
            
            // Verify key integrity
            if (this.verifyKeyIntegrity(parsedData)) {
                this.masterKey = parsedData;
                console.log('🔑 Master key loaded');
            } else {
                throw new Error('Master key integrity verification failed');
            }
            
        } catch (error) {
            // Generate new master key
            console.log('🔧 Generating new master key...');
            await this.generateMasterKey();
            await this.saveMasterKey(masterKeyPath);
        }
    }

    /**
     * Generate new master key
     */
    async generateMasterKey() {
        const salt = crypto.randomBytes(this.config.saltLength);
        const keyMaterial = crypto.randomBytes(64); // 512 bits of entropy
        
        // Derive master key using PBKDF2
        const derivedKey = crypto.pbkdf2Sync(
            keyMaterial,
            salt,
            this.config.keyIterations,
            this.config.keyLength,
            'sha256'
        );
        
        this.masterKey = {
            key: derivedKey,
            salt: salt,
            algorithm: this.config.keyDerivation,
            iterations: this.config.keyIterations,
            created: new Date().toISOString(),
            version: 1,
            checksum: this.calculateChecksum(derivedKey)
        };
        
        console.log('✅ Master key generated');
    }

    /**
     * Save master key securely
     */
    async saveMasterKey(filePath) {
        const keyData = {
            ...this.masterKey,
            key: this.masterKey.key.toString('base64'),
            salt: this.masterKey.salt.toString('base64')
        };
        
        await fs.writeFile(filePath, JSON.stringify(keyData), { mode: 0o600 });
        console.log('💾 Master key saved securely');
    }

    /**
     * Initialize encryption keys
     */
    async initializeEncryptionKeys() {
        // Generate application encryption key
        const appKey = await this.deriveKey('application', this.masterKey.key);
        this.encryptionKeys.set('application', appKey);
        
        // Generate data encryption key
        const dataKey = await this.deriveKey('data', this.masterKey.key);
        this.encryptionKeys.set('data', dataKey);
        
        // Generate session encryption key
        const sessionKey = await this.deriveKey('session', this.masterKey.key);
        this.encryptionKeys.set('session', sessionKey);
        
        // Generate storage encryption key
        const storageKey = await this.deriveKey('storage', this.masterKey.key);
        this.encryptionKeys.set('storage', storageKey);
        
        console.log('🔐 Encryption keys initialized');
    }

    /**
     * Derive encryption key for specific purpose
     */
    async deriveKey(purpose, masterKey, salt = null) {
        if (!salt) {
            salt = crypto.randomBytes(this.config.saltLength);
        }
        
        const info = Buffer.from(purpose, 'utf8');
        const derivedKey = crypto.pbkdf2Sync(
            masterKey,
            Buffer.concat([salt, info]),
            this.config.keyIterations,
            this.config.keyLength,
            'sha256'
        );
        
        this.metrics.keyDerivations++;
        
        return {
            key: derivedKey,
            salt: salt,
            purpose: purpose,
            created: new Date().toISOString(),
            checksum: this.calculateChecksum(derivedKey)
        };
    }

    /**
     * Encrypt data with specified key type
     */
    async encrypt(data, keyType = 'data', options = {}) {
        const startTime = Date.now();
        
        try {
            if (!this.isInitialized) {
                throw new Error('Encryption manager not initialized');
            }
            
            const encryptionKey = this.encryptionKeys.get(keyType);
            if (!encryptionKey) {
                throw new Error(`Encryption key '${keyType}' not found`);
            }
            
            // Convert data to buffer
            const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
            
            // Generate random IV
            const iv = crypto.randomBytes(this.config.ivLength);
            
            // Create cipher
            const cipher = crypto.createCipheriv(this.config.algorithm, encryptionKey.key, iv);
            cipher.setAAD(Buffer.from(keyType)); // Additional authenticated data
            
            // Encrypt data
            const encrypted = Buffer.concat([
                cipher.update(dataBuffer),
                cipher.final()
            ]);
            
            // Get authentication tag
            const tag = cipher.getAuthTag();
            
            // Create encrypted package
            const encryptedPackage = {
                algorithm: this.config.algorithm,
                keyType: keyType,
                iv: iv.toString('base64'),
                tag: tag.toString('base64'),
                data: encrypted.toString('base64'),
                timestamp: new Date().toISOString(),
                checksum: this.calculateChecksum(encrypted)
            };
            
            // Update metrics
            this.metrics.encryptionOperations++;
            this.metrics.totalBytesEncrypted += dataBuffer.length;
            this.updateAverageTime('encryption', Date.now() - startTime);
            
            return encryptedPackage;
            
        } catch (error) {
            console.error('Encryption failed:', error);
            throw new Error(`Encryption failed: ${error.message}`);
        }
    }

    /**
     * Decrypt data with specified key type
     */
    async decrypt(encryptedPackage, keyType = null) {
        const startTime = Date.now();
        
        try {
            if (!this.isInitialized) {
                throw new Error('Encryption manager not initialized');
            }
            
            // Validate encrypted package
            if (!this.validateEncryptedPackage(encryptedPackage)) {
                throw new Error('Invalid encrypted package');
            }
            
            const useKeyType = keyType || encryptedPackage.keyType;
            const encryptionKey = this.encryptionKeys.get(useKeyType);
            
            if (!encryptionKey) {
                throw new Error(`Encryption key '${useKeyType}' not found`);
            }
            
            // Extract components
            const iv = Buffer.from(encryptedPackage.iv, 'base64');
            const tag = Buffer.from(encryptedPackage.tag, 'base64');
            const encrypted = Buffer.from(encryptedPackage.data, 'base64');
            
            // Verify checksum
            const calculatedChecksum = this.calculateChecksum(encrypted);
            if (calculatedChecksum !== encryptedPackage.checksum) {
                throw new Error('Data integrity check failed');
            }
            
            // Create decipher
            const decipher = crypto.createDecipheriv(encryptedPackage.algorithm, encryptionKey.key, iv);
            decipher.setAuthTag(tag);
            decipher.setAAD(Buffer.from(useKeyType)); // Additional authenticated data
            
            // Decrypt data
            const decrypted = Buffer.concat([
                decipher.update(encrypted),
                decipher.final()
            ]);
            
            // Update metrics
            this.metrics.decryptionOperations++;
            this.metrics.totalBytesDecrypted += decrypted.length;
            this.updateAverageTime('decryption', Date.now() - startTime);
            
            return decrypted;
            
        } catch (error) {
            console.error('Decryption failed:', error);
            throw new Error(`Decryption failed: ${error.message}`);
        }
    }

    /**
     * Encrypt string data (convenience method)
     */
    async encryptString(text, keyType = 'data') {
        const encryptedPackage = await this.encrypt(text, keyType);
        return JSON.stringify(encryptedPackage);
    }

    /**
     * Decrypt string data (convenience method)
     */
    async decryptString(encryptedText, keyType = null) {
        const encryptedPackage = JSON.parse(encryptedText);
        const decrypted = await this.decrypt(encryptedPackage, keyType);
        return decrypted.toString('utf8');
    }

    /**
     * Generate secure hash
     */
    generateHash(data, algorithm = 'sha256') {
        const hash = crypto.createHash(algorithm);
        hash.update(data);
        return hash.digest('hex');
    }

    /**
     * Generate HMAC
     */
    generateHMAC(data, keyType = 'data', algorithm = 'sha256') {
        const encryptionKey = this.encryptionKeys.get(keyType);
        if (!encryptionKey) {
            throw new Error(`Encryption key '${keyType}' not found`);
        }
        
        const hmac = crypto.createHmac(algorithm, encryptionKey.key);
        hmac.update(data);
        return hmac.digest('hex');
    }

    /**
     * Verify HMAC
     */
    verifyHMAC(data, signature, keyType = 'data', algorithm = 'sha256') {
        const calculatedHMAC = this.generateHMAC(data, keyType, algorithm);
        return crypto.timingSafeEqual(
            Buffer.from(signature, 'hex'),
            Buffer.from(calculatedHMAC, 'hex')
        );
    }

    /**
     * Start automatic key rotation
     */
    startKeyRotation() {
        if (this.keyRotationTimer) {
            clearInterval(this.keyRotationTimer);
        }
        
        this.keyRotationTimer = setInterval(() => {
            this.rotateKeys();
        }, this.config.keyRotationInterval);
        
        console.log('🔄 Key rotation started');
    }

    /**
     * Rotate encryption keys
     */
    async rotateKeys() {
        try {
            console.log('🔄 Starting key rotation...');
            
            // Backup current keys
            const keyBackup = new Map(this.encryptionKeys);
            
            // Generate new keys
            for (const [keyType] of this.encryptionKeys) {
                const newKey = await this.deriveKey(keyType, this.masterKey.key);
                
                // Store old key in history
                if (!this.keyHistory.has(keyType)) {
                    this.keyHistory.set(keyType, []);
                }
                this.keyHistory.get(keyType).push({
                    key: this.encryptionKeys.get(keyType),
                    rotatedAt: new Date().toISOString()
                });
                
                // Limit key history to 5 keys
                if (this.keyHistory.get(keyType).length > 5) {
                    this.keyHistory.get(keyType).shift();
                }
                
                // Set new key
                this.encryptionKeys.set(keyType, newKey);
            }
            
            this.metrics.keyRotations++;
            this.emit('key-rotation', {
                timestamp: new Date().toISOString(),
                keysRotated: Array.from(this.encryptionKeys.keys())
            });
            
            console.log('✅ Key rotation completed');
            
        } catch (error) {
            console.error('❌ Key rotation failed:', error);
            this.emit('key-rotation-error', { error: error.message });
        }
    }

    /**
     * Verify encryption functionality
     */
    async verifyEncryption() {
        const testData = 'Encryption verification test data';
        
        try {
            const encrypted = await this.encrypt(testData);
            const decrypted = await this.decrypt(encrypted);
            
            if (decrypted.toString() !== testData) {
                throw new Error('Encryption verification failed');
            }
            
            console.log('✅ Encryption verification passed');
            
        } catch (error) {
            console.error('❌ Encryption verification failed:', error);
            throw error;
        }
    }

    /**
     * Utility methods
     */
    
    calculateChecksum(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    verifyKeyIntegrity(keyData) {
        try {
            const key = Buffer.from(keyData.key, 'base64');
            const calculatedChecksum = this.calculateChecksum(key);
            return calculatedChecksum === keyData.checksum;
        } catch (error) {
            return false;
        }
    }

    validateEncryptedPackage(pkg) {
        return pkg &&
               typeof pkg === 'object' &&
               pkg.algorithm &&
               pkg.keyType &&
               pkg.iv &&
               pkg.tag &&
               pkg.data &&
               pkg.checksum;
    }

    updateAverageTime(operation, time) {
        const metricKey = `average${operation.charAt(0).toUpperCase() + operation.slice(1)}Time`;
        const operationKey = `${operation}Operations`;
        
        const totalOperations = this.metrics[operationKey];
        const currentAverage = this.metrics[metricKey];
        
        this.metrics[metricKey] = ((currentAverage * (totalOperations - 1)) + time) / totalOperations;
    }

    /**
     * Get encryption status
     */
    async getStatus() {
        return {
            initialized: this.isInitialized,
            algorithm: this.config.algorithm,
            keysLoaded: this.encryptionKeys.size,
            keyRotationEnabled: this.config.enableKeyRotation,
            metrics: this.metrics,
            healthy: this.isInitialized && this.encryptionKeys.size > 0
        };
    }

    /**
     * Clean up resources
     */
    async cleanup() {
        if (this.keyRotationTimer) {
            clearInterval(this.keyRotationTimer);
            this.keyRotationTimer = null;
        }
        
        // Clear sensitive data from memory
        this.masterKey = null;
        this.encryptionKeys.clear();
        this.secureMemo.clear();
        
        console.log('🧹 Encryption Manager cleaned up');
    }
}

module.exports = EncryptionManager;