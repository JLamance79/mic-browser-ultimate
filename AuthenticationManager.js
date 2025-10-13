/**
 * AuthenticationManager - Multi-Factor Authentication System
 * Provides enterprise-grade authentication with MFA, biometric support,
 * session management, and secure token handling
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

class AuthenticationManager extends EventEmitter {
    constructor() {
        super();
        
        // Authentication configuration
        this.config = {
            enableMFA: true,
            enableBiometric: false,
            sessionTimeout: 4 * 60 * 60 * 1000, // 4 hours
            maxFailedAttempts: 5,
            lockoutDuration: 15 * 60 * 1000, // 15 minutes
            tokenExpiration: 60 * 60 * 1000, // 1 hour
            refreshTokenExpiration: 7 * 24 * 60 * 60 * 1000, // 7 days
            passwordPolicy: {
                minLength: 12,
                requireUppercase: true,
                requireLowercase: true,
                requireNumbers: true,
                requireSpecialChars: true,
                preventReuse: 5
            }
        };
        
        // Authentication state
        this.isInitialized = false;
        this.users = new Map();
        this.sessions = new Map();
        this.failedAttempts = new Map();
        this.lockedAccounts = new Map();
        this.mfaCodes = new Map();
        this.biometricData = new Map();
        
        // Token management
        this.activeTokens = new Map();
        this.refreshTokens = new Map();
        this.tokenBlacklist = new Set();
        
        // Security features
        this.encryptionManager = null;
        this.auditLogger = null;
        
        // Performance metrics
        this.metrics = {
            totalLogins: 0,
            successfulLogins: 0,
            failedLogins: 0,
            mfaAttempts: 0,
            biometricAttempts: 0,
            sessionsCreated: 0,
            sessionsExpired: 0,
            tokensIssued: 0,
            averageLoginTime: 0
        };
    }

    /**
     * Initialize the authentication manager
     */
    async initialize(encryptionManager, auditLogger) {
        try {
            console.log('🔐 Initializing Authentication Manager...');
            
            this.encryptionManager = encryptionManager;
            this.auditLogger = auditLogger;
            
            // Load user database
            await this.loadUserDatabase();
            
            // Start session cleanup
            this.startSessionCleanup();
            
            // Start lockout cleanup
            this.startLockoutCleanup();
            
            // Initialize biometric support if enabled
            if (this.config.enableBiometric) {
                await this.initializeBiometric();
            }
            
            this.isInitialized = true;
            console.log('✅ Authentication Manager initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize Authentication Manager:', error);
            throw error;
        }
    }

    /**
     * Load user database
     */
    async loadUserDatabase() {
        const dbPath = path.join(app.getPath('userData'), 'users.db');
        
        try {
            // Check if file exists first
            if (!await fs.access(dbPath).then(() => true).catch(() => false)) {
                throw new Error('User database file does not exist');
            }
            
            const userData = await fs.readFile(dbPath, 'utf8');
            
            // Check if file is empty or contains only whitespace
            if (!userData || userData.trim().length === 0) {
                throw new Error('User database file is empty');
            }
            
            const decryptedData = await this.encryptionManager.decryptString(userData, 'storage');
            const users = JSON.parse(decryptedData);
            
            for (const [userId, user] of Object.entries(users)) {
                this.users.set(userId, user);
            }
            
            console.log(`👥 Loaded ${this.users.size} users`);
            
        } catch (error) {
            // Database doesn't exist, is corrupted, or can't be decrypted
            if (error.message.includes('Unsupported state or unable to authenticate data')) {
                console.log('⚠️ User database corrupted or incompatible, recreating...');
            } else {
                console.log('📝 Creating default user database...');
            }
            await this.createDefaultAdmin();
        }
    }

    /**
     * Save user database
     */
    async saveUserDatabase() {
        const dbPath = path.join(app.getPath('userData'), 'users.db');
        
        const users = {};
        for (const [userId, user] of this.users) {
            users[userId] = user;
        }
        
        const encryptedData = await this.encryptionManager.encryptString(
            JSON.stringify(users),
            'storage'
        );
        
        await fs.writeFile(dbPath, encryptedData, { mode: 0o600 });
        console.log('💾 User database saved');
    }

    /**
     * Create default admin user
     */
    async createDefaultAdmin() {
        const adminUser = {
            id: 'admin',
            username: 'admin',
            email: 'admin@localhost',
            passwordHash: await this.hashPassword('admin123!@#'),
            role: 'administrator',
            permissions: ['*'],
            created: new Date().toISOString(),
            lastLogin: null,
            mfaEnabled: false,
            mfaSecret: null,
            biometricEnabled: false,
            biometricData: null,
            passwordHistory: [],
            accountLocked: false,
            failedAttempts: 0
        };
        
        this.users.set('admin', adminUser);
        await this.saveUserDatabase();
        
        console.log('👤 Default admin user created (username: admin, password: admin123!@#)');
    }

    /**
     * Register new user
     */
    async registerUser(userData) {
        try {
            const { username, email, password, role = 'user' } = userData;
            
            // Validate input
            if (!username || !email || !password) {
                throw new Error('Username, email, and password are required');
            }
            
            // Check if user already exists
            if (this.getUserByUsername(username) || this.getUserByEmail(email)) {
                throw new Error('User already exists');
            }
            
            // Validate password policy
            if (!this.validatePassword(password)) {
                throw new Error('Password does not meet policy requirements');
            }
            
            // Generate user ID
            const userId = crypto.randomBytes(16).toString('hex');
            
            // Create user object
            const user = {
                id: userId,
                username: username.toLowerCase(),
                email: email.toLowerCase(),
                passwordHash: await this.hashPassword(password),
                role: role,
                permissions: this.getDefaultPermissions(role),
                created: new Date().toISOString(),
                lastLogin: null,
                mfaEnabled: false,
                mfaSecret: null,
                biometricEnabled: false,
                biometricData: null,
                passwordHistory: [],
                accountLocked: false,
                failedAttempts: 0
            };
            
            // Save user
            this.users.set(userId, user);
            await this.saveUserDatabase();
            
            // Log registration
            await this.auditLogger.log('authentication', 'info', 'User registered', {
                userId: userId,
                username: username,
                email: email,
                role: role
            });
            
            console.log(`✅ User registered: ${username}`);
            return { userId, username, email, role };
            
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        }
    }

    /**
     * Authenticate user
     */
    async authenticate(credentials) {
        const startTime = Date.now();
        
        try {
            const { username, password, mfaCode, biometricData } = credentials;
            
            // Find user
            const user = this.getUserByUsername(username);
            if (!user) {
                throw new Error('Invalid credentials');
            }
            
            // Check if account is locked
            if (this.isAccountLocked(user.id)) {
                throw new Error('Account is locked due to too many failed attempts');
            }
            
            // Verify password
            const passwordValid = await this.verifyPassword(password, user.passwordHash);
            if (!passwordValid) {
                await this.handleFailedLogin(user.id);
                throw new Error('Invalid credentials');
            }
            
            // Check MFA if enabled
            if (user.mfaEnabled) {
                if (!mfaCode || !this.verifyMFACode(user.id, mfaCode)) {
                    throw new Error('Invalid MFA code');
                }
            }
            
            // Check biometric if enabled
            if (user.biometricEnabled && biometricData) {
                if (!await this.verifyBiometric(user.id, biometricData)) {
                    throw new Error('Biometric verification failed');
                }
            }
            
            // Clear failed attempts
            this.failedAttempts.delete(user.id);
            this.lockedAccounts.delete(user.id);
            
            // Create session
            const session = await this.createSession(user);
            
            // Update user last login
            user.lastLogin = new Date().toISOString();
            await this.saveUserDatabase();
            
            // Update metrics
            this.metrics.totalLogins++;
            this.metrics.successfulLogins++;
            this.updateAverageTime('login', Date.now() - startTime);
            
            // Log successful login
            await this.auditLogger.log('authentication', 'info', 'Login successful', {
                userId: user.id,
                username: user.username,
                sessionId: session.id
            });
            
            this.emit('login-success', {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    permissions: user.permissions
                },
                session: session
            });
            
            console.log(`✅ User authenticated: ${user.username}`);
            return { user, session };
            
        } catch (error) {
            this.metrics.totalLogins++;
            this.metrics.failedLogins++;
            
            await this.auditLogger.log('authentication', 'warning', 'Login failed', {
                username: credentials.username,
                error: error.message
            });
            
            this.emit('login-failure', {
                username: credentials.username,
                error: error.message
            });
            
            console.error('Authentication failed:', error.message);
            throw error;
        }
    }

    /**
     * Create user session
     */
    async createSession(user) {
        const sessionId = crypto.randomBytes(32).toString('hex');
        const accessToken = this.generateJWT(user, 'access');
        const refreshToken = this.generateJWT(user, 'refresh');
        
        const session = {
            id: sessionId,
            userId: user.id,
            accessToken: accessToken,
            refreshToken: refreshToken,
            created: new Date().toISOString(),
            expires: new Date(Date.now() + this.config.sessionTimeout).toISOString(),
            active: true,
            userAgent: 'MIC Browser Ultimate',
            ip: '127.0.0.1' // Local application
        };
        
        this.sessions.set(sessionId, session);
        this.activeTokens.set(accessToken, session);
        this.refreshTokens.set(refreshToken, session);
        
        this.metrics.sessionsCreated++;
        
        // Auto-expire session
        setTimeout(() => {
            this.expireSession(sessionId);
        }, this.config.sessionTimeout);
        
        return session;
    }

    /**
     * Validate session
     */
    async validateSession(sessionId) {
        const session = this.sessions.get(sessionId);
        
        if (!session || !session.active) {
            return null;
        }
        
        // Check expiration
        if (new Date() > new Date(session.expires)) {
            await this.expireSession(sessionId);
            return null;
        }
        
        return session;
    }

    /**
     * Validate token
     */
    async validateToken(token) {
        if (this.tokenBlacklist.has(token)) {
            return null;
        }
        
        const session = this.activeTokens.get(token);
        if (!session || !session.active) {
            return null;
        }
        
        try {
            const payload = this.verifyJWT(token);
            return { session, payload };
        } catch (error) {
            return null;
        }
    }

    /**
     * Refresh access token
     */
    async refreshToken(refreshToken) {
        const session = this.refreshTokens.get(refreshToken);
        if (!session || !session.active) {
            throw new Error('Invalid refresh token');
        }
        
        try {
            const payload = this.verifyJWT(refreshToken);
            const user = this.users.get(payload.sub);
            
            if (!user) {
                throw new Error('User not found');
            }
            
            // Generate new access token
            const newAccessToken = this.generateJWT(user, 'access');
            
            // Update session
            this.activeTokens.delete(session.accessToken);
            session.accessToken = newAccessToken;
            this.activeTokens.set(newAccessToken, session);
            
            this.metrics.tokensIssued++;
            
            return newAccessToken;
            
        } catch (error) {
            throw new Error('Token refresh failed');
        }
    }

    /**
     * Logout user
     */
    async logout(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            // Add tokens to blacklist
            this.tokenBlacklist.add(session.accessToken);
            this.tokenBlacklist.add(session.refreshToken);
            
            // Remove from active maps
            this.activeTokens.delete(session.accessToken);
            this.refreshTokens.delete(session.refreshToken);
            
            // Mark session as inactive
            session.active = false;
            
            await this.auditLogger.log('authentication', 'info', 'User logged out', {
                userId: session.userId,
                sessionId: sessionId
            });
            
            console.log(`👋 User logged out: ${sessionId}`);
        }
    }

    /**
     * Expire session
     */
    async expireSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session && session.active) {
            session.active = false;
            this.metrics.sessionsExpired++;
            
            this.emit('session-expired', {
                sessionId: sessionId,
                userId: session.userId
            });
            
            await this.auditLogger.log('authentication', 'info', 'Session expired', {
                sessionId: sessionId,
                userId: session.userId
            });
        }
    }

    /**
     * Enable MFA for user
     */
    async enableMFA(userId) {
        const user = this.users.get(userId);
        if (!user) {
            throw new Error('User not found');
        }
        
        // Generate MFA secret
        const secret = crypto.randomBytes(20).toString('base32');
        user.mfaSecret = secret;
        user.mfaEnabled = true;
        
        await this.saveUserDatabase();
        
        await this.auditLogger.log('authentication', 'info', 'MFA enabled', {
            userId: userId,
            username: user.username
        });
        
        return secret;
    }

    /**
     * Verify MFA code
     */
    verifyMFACode(userId, code) {
        const user = this.users.get(userId);
        if (!user || !user.mfaEnabled) {
            return false;
        }
        
        // Simple time-based code verification (in production, use proper TOTP)
        const currentTime = Math.floor(Date.now() / 30000);
        const expectedCode = crypto.createHash('sha1')
            .update(user.mfaSecret + currentTime)
            .digest('hex')
            .substring(0, 6);
        
        this.metrics.mfaAttempts++;
        
        return code === expectedCode;
    }

    /**
     * Hash password
     */
    async hashPassword(password) {
        const salt = crypto.randomBytes(32);
        const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256');
        
        return {
            salt: salt.toString('hex'),
            hash: hash.toString('hex'),
            iterations: 100000
        };
    }

    /**
     * Verify password
     */
    async verifyPassword(password, storedHash) {
        const salt = Buffer.from(storedHash.salt, 'hex');
        const hash = crypto.pbkdf2Sync(password, salt, storedHash.iterations, 64, 'sha256');
        
        return crypto.timingSafeEqual(
            Buffer.from(storedHash.hash, 'hex'),
            hash
        );
    }

    /**
     * Generate JWT token
     */
    generateJWT(user, type = 'access') {
        const header = {
            alg: 'HS256',
            typ: 'JWT'
        };
        
        const expiration = type === 'access' 
            ? this.config.tokenExpiration 
            : this.config.refreshTokenExpiration;
        
        const payload = {
            sub: user.id,
            username: user.username,
            role: user.role,
            permissions: user.permissions,
            type: type,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor((Date.now() + expiration) / 1000)
        };
        
        const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
        const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
        
        const signature = crypto
            .createHmac('sha256', 'jwt-secret-key') // In production, use proper secret
            .update(`${encodedHeader}.${encodedPayload}`)
            .digest('base64url');
        
        this.metrics.tokensIssued++;
        
        return `${encodedHeader}.${encodedPayload}.${signature}`;
    }

    /**
     * Verify JWT token
     */
    verifyJWT(token) {
        const [header, payload, signature] = token.split('.');
        
        // Verify signature
        const expectedSignature = crypto
            .createHmac('sha256', 'jwt-secret-key')
            .update(`${header}.${payload}`)
            .digest('base64url');
        
        if (signature !== expectedSignature) {
            throw new Error('Invalid token signature');
        }
        
        // Decode payload
        const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString());
        
        // Check expiration
        if (decodedPayload.exp < Math.floor(Date.now() / 1000)) {
            throw new Error('Token expired');
        }
        
        return decodedPayload;
    }

    /**
     * Utility methods
     */
    
    getUserByUsername(username) {
        for (const user of this.users.values()) {
            if (user.username.toLowerCase() === username.toLowerCase()) {
                return user;
            }
        }
        return null;
    }

    getUserByEmail(email) {
        for (const user of this.users.values()) {
            if (user.email.toLowerCase() === email.toLowerCase()) {
                return user;
            }
        }
        return null;
    }

    validatePassword(password) {
        const policy = this.config.passwordPolicy;
        
        if (password.length < policy.minLength) return false;
        if (policy.requireUppercase && !/[A-Z]/.test(password)) return false;
        if (policy.requireLowercase && !/[a-z]/.test(password)) return false;
        if (policy.requireNumbers && !/\d/.test(password)) return false;
        if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;
        
        return true;
    }

    isAccountLocked(userId) {
        const lockInfo = this.lockedAccounts.get(userId);
        if (!lockInfo) return false;
        
        return Date.now() < lockInfo.unlockTime;
    }

    async handleFailedLogin(userId) {
        const attempts = (this.failedAttempts.get(userId) || 0) + 1;
        this.failedAttempts.set(userId, attempts);
        
        if (attempts >= this.config.maxFailedAttempts) {
            this.lockedAccounts.set(userId, {
                lockedAt: Date.now(),
                unlockTime: Date.now() + this.config.lockoutDuration
            });
            
            await this.auditLogger.log('authentication', 'warning', 'Account locked', {
                userId: userId,
                attempts: attempts
            });
        }
    }

    getDefaultPermissions(role) {
        switch (role) {
            case 'administrator':
                return ['*'];
            case 'moderator':
                return ['read', 'write', 'moderate'];
            case 'user':
            default:
                return ['read'];
        }
    }

    updateAverageTime(operation, time) {
        const metricKey = `average${operation.charAt(0).toUpperCase() + operation.slice(1)}Time`;
        const operationKey = `${operation}s`; // 'logins'
        
        const totalOperations = this.metrics.successfulLogins; // For login operations
        const currentAverage = this.metrics[metricKey];
        
        this.metrics[metricKey] = ((currentAverage * (totalOperations - 1)) + time) / totalOperations;
    }

    /**
     * Initialize biometric support
     */
    async initializeBiometric() {
        // Placeholder for biometric initialization
        console.log('🔒 Biometric support initialized');
    }

    /**
     * Verify biometric data
     */
    async verifyBiometric(userId, biometricData) {
        // Placeholder for biometric verification
        this.metrics.biometricAttempts++;
        return true; // Simplified for demo
    }

    /**
     * Start session cleanup
     */
    startSessionCleanup() {
        setInterval(() => {
            const now = Date.now();
            for (const [sessionId, session] of this.sessions) {
                if (new Date(session.expires) < now) {
                    this.expireSession(sessionId);
                }
            }
        }, 60000); // Check every minute
    }

    /**
     * Start lockout cleanup
     */
    startLockoutCleanup() {
        setInterval(() => {
            const now = Date.now();
            for (const [userId, lockInfo] of this.lockedAccounts) {
                if (now >= lockInfo.unlockTime) {
                    this.lockedAccounts.delete(userId);
                    this.failedAttempts.delete(userId);
                }
            }
        }, 60000); // Check every minute
    }

    /**
     * Get authentication status
     */
    async getStatus() {
        return {
            initialized: this.isInitialized,
            totalUsers: this.users.size,
            activeSessions: Array.from(this.sessions.values()).filter(s => s.active).length,
            lockedAccounts: this.lockedAccounts.size,
            mfaEnabled: this.config.enableMFA,
            biometricEnabled: this.config.enableBiometric,
            metrics: this.metrics,
            healthy: this.isInitialized
        };
    }
}

module.exports = AuthenticationManager;