/**
 * AuthorizationManager - Role-Based Access Control System
 * Provides enterprise-grade authorization with RBAC, permissions,
 * resource protection, and access control policies
 */

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

class AuthorizationManager extends EventEmitter {
    constructor() {
        super();
        
        // Authorization configuration
        this.config = {
            enableRBAC: true,
            enableResourceAccess: true,
            enableTimeBasedAccess: false,
            enableLocationBasedAccess: false,
            enableContextualAccess: true,
            defaultRole: 'user',
            inheritanceEnabled: true,
            cacheEnabled: true,
            cacheTimeout: 5 * 60 * 1000 // 5 minutes
        };
        
        // Authorization state
        this.isInitialized = false;
        this.roles = new Map();
        this.permissions = new Map();
        this.resources = new Map();
        this.policies = new Map();
        this.accessCache = new Map();
        
        // Role hierarchy
        this.roleHierarchy = new Map();
        
        // Access control lists
        this.userRoles = new Map();
        this.rolePermissions = new Map();
        this.resourcePermissions = new Map();
        
        // Contextual access
        this.contextualRules = new Map();
        this.timeBasedRules = new Map();
        this.locationBasedRules = new Map();
        
        // Performance metrics
        this.metrics = {
            authorizationChecks: 0,
            accessGranted: 0,
            accessDenied: 0,
            cacheHits: 0,
            cacheMisses: 0,
            policyEvaluations: 0,
            averageCheckTime: 0
        };
        
        // Security components
        this.encryptionManager = null;
        this.auditLogger = null;
    }

    /**
     * Initialize the authorization manager
     */
    async initialize(encryptionManager, auditLogger) {
        try {
            console.log('🛡️ Initializing Authorization Manager...');
            
            this.encryptionManager = encryptionManager;
            this.auditLogger = auditLogger;
            
            // Load authorization data
            await this.loadAuthorizationData();
            
            // Setup default roles and permissions
            await this.setupDefaultRBAC();
            
            // Setup default resources
            await this.setupDefaultResources();
            
            // Setup default policies
            await this.setupDefaultPolicies();
            
            // Start cache cleanup
            if (this.config.cacheEnabled) {
                this.startCacheCleanup();
            }
            
            this.isInitialized = true;
            console.log('✅ Authorization Manager initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize Authorization Manager:', error);
            throw error;
        }
    }

    /**
     * Load authorization data from storage
     */
    async loadAuthorizationData() {
        try {
            const authPath = path.join(app.getPath('userData'), 'authorization.db');
            
            try {
                const authData = await fs.readFile(authPath, 'utf8');
                const decryptedData = await this.encryptionManager.decryptString(authData, 'storage');
                const data = JSON.parse(decryptedData);
                
                // Load roles
                if (data.roles) {
                    for (const [roleId, role] of Object.entries(data.roles)) {
                        this.roles.set(roleId, role);
                    }
                }
                
                // Load permissions
                if (data.permissions) {
                    for (const [permId, permission] of Object.entries(data.permissions)) {
                        this.permissions.set(permId, permission);
                    }
                }
                
                // Load resources
                if (data.resources) {
                    for (const [resId, resource] of Object.entries(data.resources)) {
                        this.resources.set(resId, resource);
                    }
                }
                
                // Load policies
                if (data.policies) {
                    for (const [policyId, policy] of Object.entries(data.policies)) {
                        this.policies.set(policyId, policy);
                    }
                }
                
                console.log('📋 Authorization data loaded');
                
            } catch (error) {
                console.log('📝 Creating default authorization data...');
            }
            
        } catch (error) {
            console.error('Failed to load authorization data:', error);
            throw error;
        }
    }

    /**
     * Save authorization data to storage
     */
    async saveAuthorizationData() {
        try {
            const authPath = path.join(app.getPath('userData'), 'authorization.db');
            
            const data = {
                roles: Object.fromEntries(this.roles),
                permissions: Object.fromEntries(this.permissions),
                resources: Object.fromEntries(this.resources),
                policies: Object.fromEntries(this.policies),
                roleHierarchy: Object.fromEntries(this.roleHierarchy),
                userRoles: Object.fromEntries(this.userRoles),
                rolePermissions: Object.fromEntries(this.rolePermissions),
                resourcePermissions: Object.fromEntries(this.resourcePermissions)
            };
            
            const encryptedData = await this.encryptionManager.encryptString(
                JSON.stringify(data),
                'storage'
            );
            
            await fs.writeFile(authPath, encryptedData, { mode: 0o600 });
            console.log('💾 Authorization data saved');
            
        } catch (error) {
            console.error('Failed to save authorization data:', error);
            throw error;
        }
    }

    /**
     * Setup default RBAC structure
     */
    async setupDefaultRBAC() {
        // Define default roles
        const defaultRoles = [
            {
                id: 'guest',
                name: 'Guest',
                description: 'Basic guest access',
                level: 0,
                inherits: []
            },
            {
                id: 'user',
                name: 'User',
                description: 'Standard user access',
                level: 10,
                inherits: ['guest']
            },
            {
                id: 'moderator',
                name: 'Moderator',
                description: 'Content moderation access',
                level: 50,
                inherits: ['user']
            },
            {
                id: 'administrator',
                name: 'Administrator',
                description: 'Full system access',
                level: 100,
                inherits: ['moderator']
            },
            {
                id: 'super_admin',
                name: 'Super Administrator',
                description: 'Ultimate system access',
                level: 1000,
                inherits: ['administrator']
            }
        ];

        // Define default permissions
        const defaultPermissions = [
            // Basic permissions
            { id: 'read', name: 'Read', description: 'Read access to resources' },
            { id: 'write', name: 'Write', description: 'Write access to resources' },
            { id: 'update', name: 'Update', description: 'Update existing resources' },
            { id: 'delete', name: 'Delete', description: 'Delete resources' },
            
            // Application permissions
            { id: 'browse', name: 'Browse', description: 'Browse web content' },
            { id: 'download', name: 'Download', description: 'Download files' },
            { id: 'upload', name: 'Upload', description: 'Upload files' },
            { id: 'chat', name: 'Chat', description: 'Use chat features' },
            { id: 'ai_assist', name: 'AI Assist', description: 'Use AI assistance' },
            { id: 'ocr', name: 'OCR', description: 'Use OCR features' },
            { id: 'workflow', name: 'Workflow', description: 'Create and manage workflows' },
            
            // System permissions
            { id: 'settings', name: 'Settings', description: 'Modify application settings' },
            { id: 'security', name: 'Security', description: 'Manage security settings' },
            { id: 'users', name: 'Users', description: 'Manage users' },
            { id: 'audit', name: 'Audit', description: 'View audit logs' },
            { id: 'system', name: 'System', description: 'System administration' }
        ];

        // Create roles
        for (const role of defaultRoles) {
            if (!this.roles.has(role.id)) {
                this.roles.set(role.id, {
                    ...role,
                    created: new Date().toISOString(),
                    active: true
                });
            }
        }

        // Create permissions
        for (const permission of defaultPermissions) {
            if (!this.permissions.has(permission.id)) {
                this.permissions.set(permission.id, {
                    ...permission,
                    created: new Date().toISOString(),
                    active: true
                });
            }
        }

        // Setup role hierarchy
        for (const role of defaultRoles) {
            this.roleHierarchy.set(role.id, role.inherits || []);
        }

        // Assign default permissions to roles
        this.assignPermissionsToRole('guest', ['read', 'browse']);
        this.assignPermissionsToRole('user', ['read', 'write', 'browse', 'download', 'chat', 'ai_assist', 'ocr']);
        this.assignPermissionsToRole('moderator', ['read', 'write', 'update', 'browse', 'download', 'upload', 'chat', 'ai_assist', 'ocr', 'workflow']);
        this.assignPermissionsToRole('administrator', ['read', 'write', 'update', 'delete', 'browse', 'download', 'upload', 'chat', 'ai_assist', 'ocr', 'workflow', 'settings', 'users', 'audit']);
        this.assignPermissionsToRole('super_admin', ['*']); // All permissions

        console.log('🏗️ Default RBAC structure created');
    }

    /**
     * Setup default resources
     */
    async setupDefaultResources() {
        const defaultResources = [
            // Application resources
            { id: 'browser', name: 'Browser', type: 'application', category: 'core' },
            { id: 'chat', name: 'Chat System', type: 'feature', category: 'communication' },
            { id: 'ai', name: 'AI Assistant', type: 'feature', category: 'intelligence' },
            { id: 'ocr', name: 'OCR Engine', type: 'feature', category: 'analysis' },
            { id: 'workflow', name: 'Workflow Engine', type: 'feature', category: 'automation' },
            
            // Data resources
            { id: 'user_data', name: 'User Data', type: 'data', category: 'personal' },
            { id: 'system_data', name: 'System Data', type: 'data', category: 'system' },
            { id: 'logs', name: 'System Logs', type: 'data', category: 'audit' },
            
            // Configuration resources
            { id: 'settings', name: 'Application Settings', type: 'config', category: 'application' },
            { id: 'security_config', name: 'Security Configuration', type: 'config', category: 'security' },
            { id: 'user_config', name: 'User Configuration', type: 'config', category: 'personal' }
        ];

        for (const resource of defaultResources) {
            if (!this.resources.has(resource.id)) {
                this.resources.set(resource.id, {
                    ...resource,
                    created: new Date().toISOString(),
                    active: true,
                    permissions: []
                });
            }
        }

        console.log('📦 Default resources created');
    }

    /**
     * Setup default policies
     */
    async setupDefaultPolicies() {
        const defaultPolicies = [
            {
                id: 'admin_full_access',
                name: 'Administrator Full Access',
                description: 'Administrators have full access to all resources',
                type: 'role_based',
                rules: [
                    {
                        condition: 'role === "administrator" || role === "super_admin"',
                        action: 'allow',
                        resources: ['*'],
                        permissions: ['*']
                    }
                ]
            },
            {
                id: 'user_data_protection',
                name: 'User Data Protection',
                description: 'Users can only access their own data',
                type: 'resource_based',
                rules: [
                    {
                        condition: 'resource.type === "data" && resource.category === "personal"',
                        action: 'allow_if',
                        check: 'user.id === resource.owner'
                    }
                ]
            },
            {
                id: 'security_admin_only',
                name: 'Security Admin Only',
                description: 'Only administrators can modify security settings',
                type: 'permission_based',
                rules: [
                    {
                        condition: 'permission === "security"',
                        action: 'deny_unless',
                        check: 'role === "administrator" || role === "super_admin"'
                    }
                ]
            }
        ];

        for (const policy of defaultPolicies) {
            if (!this.policies.has(policy.id)) {
                this.policies.set(policy.id, {
                    ...policy,
                    created: new Date().toISOString(),
                    active: true
                });
            }
        }

        console.log('📋 Default policies created');
    }

    /**
     * Check if user has permission to access resource
     */
    async hasPermission(userId, permission, resource = null, context = {}) {
        const startTime = Date.now();
        
        try {
            this.metrics.authorizationChecks++;
            
            // Check cache first
            const cacheKey = `${userId}:${permission}:${resource || 'null'}`;
            if (this.config.cacheEnabled && this.accessCache.has(cacheKey)) {
                const cached = this.accessCache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.config.cacheTimeout) {
                    this.metrics.cacheHits++;
                    return cached.result;
                }
            }
            
            this.metrics.cacheMisses++;
            
            // Get user roles
            const userRoles = this.getUserRoles(userId);
            if (!userRoles || userRoles.length === 0) {
                const result = await this.evaluateGuestAccess(permission, resource, context);
                this.cacheResult(cacheKey, result);
                return result;
            }
            
            // Check role-based permissions
            let hasAccess = false;
            
            for (const roleId of userRoles) {
                // Check direct role permissions
                if (await this.checkRolePermission(roleId, permission, resource, context)) {
                    hasAccess = true;
                    break;
                }
                
                // Check inherited permissions
                if (this.config.inheritanceEnabled) {
                    const inheritedRoles = this.getInheritedRoles(roleId);
                    for (const inheritedRole of inheritedRoles) {
                        if (await this.checkRolePermission(inheritedRole, permission, resource, context)) {
                            hasAccess = true;
                            break;
                        }
                    }
                }
                
                if (hasAccess) break;
            }
            
            // Evaluate policies
            const policyResult = await this.evaluatePolicies(userId, permission, resource, context, userRoles);
            if (policyResult !== null) {
                hasAccess = policyResult;
            }
            
            // Update metrics
            if (hasAccess) {
                this.metrics.accessGranted++;
            } else {
                this.metrics.accessDenied++;
            }
            
            this.updateAverageTime('check', Date.now() - startTime);
            
            // Cache result
            this.cacheResult(cacheKey, hasAccess);
            
            // Log access attempt
            await this.auditLogger.log('authorization', hasAccess ? 'info' : 'warning', 
                `Access ${hasAccess ? 'granted' : 'denied'}`, {
                userId: userId,
                permission: permission,
                resource: resource,
                context: context,
                result: hasAccess
            });
            
            return hasAccess;
            
        } catch (error) {
            console.error('Permission check failed:', error);
            await this.auditLogger.log('authorization', 'error', 'Permission check failed', {
                userId: userId,
                permission: permission,
                resource: resource,
                error: error.message
            });
            
            // Fail securely - deny access on error
            return false;
        }
    }

    /**
     * Check role permission
     */
    async checkRolePermission(roleId, permission, resource, context) {
        const role = this.roles.get(roleId);
        if (!role || !role.active) {
            return false;
        }
        
        const rolePermissions = this.rolePermissions.get(roleId) || [];
        
        // Check for wildcard permission
        if (rolePermissions.includes('*')) {
            return true;
        }
        
        // Check direct permission
        if (rolePermissions.includes(permission)) {
            return true;
        }
        
        // Check resource-specific permissions
        if (resource) {
            const resourcePermissions = this.resourcePermissions.get(resource) || [];
            return resourcePermissions.some(rp => 
                rp.role === roleId && rp.permission === permission
            );
        }
        
        return false;
    }

    /**
     * Evaluate policies
     */
    async evaluatePolicies(userId, permission, resource, context, userRoles) {
        this.metrics.policyEvaluations++;
        
        for (const policy of this.policies.values()) {
            if (!policy.active) continue;
            
            const result = await this.evaluatePolicy(policy, userId, permission, resource, context, userRoles);
            if (result !== null) {
                return result;
            }
        }
        
        return null; // No policy applies
    }

    /**
     * Evaluate individual policy
     */
    async evaluatePolicy(policy, userId, permission, resource, context, userRoles) {
        for (const rule of policy.rules) {
            if (await this.evaluateRule(rule, userId, permission, resource, context, userRoles)) {
                switch (rule.action) {
                    case 'allow':
                        return true;
                    case 'deny':
                        return false;
                    case 'allow_if':
                        return await this.evaluateCondition(rule.check, userId, permission, resource, context, userRoles);
                    case 'deny_unless':
                        return await this.evaluateCondition(rule.check, userId, permission, resource, context, userRoles);
                }
            }
        }
        
        return null; // Rule doesn't apply
    }

    /**
     * Evaluate rule condition
     */
    async evaluateRule(rule, userId, permission, resource, context, userRoles) {
        try {
            // Create evaluation context
            const evalContext = {
                user: { id: userId },
                permission: permission,
                resource: resource ? this.resources.get(resource) : null,
                context: context,
                roles: userRoles,
                role: userRoles[0] // Primary role
            };
            
            // Simple condition evaluation (in production, use a proper expression evaluator)
            const condition = rule.condition;
            
            // Replace variables in condition
            let evaluableCondition = condition
                .replace(/user\.id/g, `"${userId}"`)
                .replace(/permission/g, `"${permission}"`)
                .replace(/resource/g, resource ? `"${resource}"` : 'null')
                .replace(/role/g, userRoles[0] ? `"${userRoles[0]}"` : 'null');
            
            // Basic evaluation (simplified for demo)
            if (evaluableCondition.includes('role === "administrator"')) {
                return userRoles.includes('administrator');
            }
            if (evaluableCondition.includes('role === "super_admin"')) {
                return userRoles.includes('super_admin');
            }
            
            return false;
            
        } catch (error) {
            console.error('Rule evaluation failed:', error);
            return false;
        }
    }

    /**
     * Evaluate condition
     */
    async evaluateCondition(condition, userId, permission, resource, context, userRoles) {
        try {
            // Simplified condition evaluation
            if (condition === 'user.id === resource.owner') {
                const resourceObj = this.resources.get(resource);
                return resourceObj && resourceObj.owner === userId;
            }
            
            return false;
            
        } catch (error) {
            console.error('Condition evaluation failed:', error);
            return false;
        }
    }

    /**
     * Assign role to user
     */
    async assignRole(userId, roleId) {
        if (!this.roles.has(roleId)) {
            throw new Error(`Role '${roleId}' does not exist`);
        }
        
        let userRoles = this.userRoles.get(userId) || [];
        if (!userRoles.includes(roleId)) {
            userRoles.push(roleId);
            this.userRoles.set(userId, userRoles);
            
            // Clear cache for this user
            this.clearUserCache(userId);
            
            await this.saveAuthorizationData();
            
            await this.auditLogger.log('authorization', 'info', 'Role assigned', {
                userId: userId,
                roleId: roleId
            });
            
            console.log(`✅ Role '${roleId}' assigned to user '${userId}'`);
        }
    }

    /**
     * Remove role from user
     */
    async removeRole(userId, roleId) {
        let userRoles = this.userRoles.get(userId) || [];
        const index = userRoles.indexOf(roleId);
        
        if (index > -1) {
            userRoles.splice(index, 1);
            this.userRoles.set(userId, userRoles);
            
            // Clear cache for this user
            this.clearUserCache(userId);
            
            await this.saveAuthorizationData();
            
            await this.auditLogger.log('authorization', 'info', 'Role removed', {
                userId: userId,
                roleId: roleId
            });
            
            console.log(`✅ Role '${roleId}' removed from user '${userId}'`);
        }
    }

    /**
     * Assign permission to role
     */
    assignPermissionsToRole(roleId, permissions) {
        if (!this.roles.has(roleId)) {
            throw new Error(`Role '${roleId}' does not exist`);
        }
        
        const currentPermissions = this.rolePermissions.get(roleId) || [];
        const newPermissions = [...new Set([...currentPermissions, ...permissions])];
        
        this.rolePermissions.set(roleId, newPermissions);
        
        // Clear cache
        this.clearRoleCache(roleId);
        
        console.log(`✅ Permissions assigned to role '${roleId}': ${permissions.join(', ')}`);
    }

    /**
     * Get user roles
     */
    getUserRoles(userId) {
        return this.userRoles.get(userId) || [this.config.defaultRole];
    }

    /**
     * Get inherited roles
     */
    getInheritedRoles(roleId) {
        const inherited = [];
        const queue = [roleId];
        const visited = new Set();
        
        while (queue.length > 0) {
            const currentRole = queue.shift();
            if (visited.has(currentRole)) continue;
            
            visited.add(currentRole);
            const inherits = this.roleHierarchy.get(currentRole) || [];
            
            for (const inheritedRole of inherits) {
                if (!inherited.includes(inheritedRole)) {
                    inherited.push(inheritedRole);
                    queue.push(inheritedRole);
                }
            }
        }
        
        return inherited;
    }

    /**
     * Evaluate guest access
     */
    async evaluateGuestAccess(permission, resource, context) {
        // Guests only get basic read permissions
        const guestPermissions = ['read', 'browse'];
        return guestPermissions.includes(permission);
    }

    /**
     * Cache management
     */
    cacheResult(key, result) {
        if (this.config.cacheEnabled) {
            this.accessCache.set(key, {
                result: result,
                timestamp: Date.now()
            });
        }
    }

    clearUserCache(userId) {
        if (this.config.cacheEnabled) {
            for (const key of this.accessCache.keys()) {
                if (key.startsWith(`${userId}:`)) {
                    this.accessCache.delete(key);
                }
            }
        }
    }

    clearRoleCache(roleId) {
        if (this.config.cacheEnabled) {
            // Clear cache for all users with this role
            for (const [userId, roles] of this.userRoles) {
                if (roles.includes(roleId)) {
                    this.clearUserCache(userId);
                }
            }
        }
    }

    startCacheCleanup() {
        setInterval(() => {
            const now = Date.now();
            for (const [key, cached] of this.accessCache) {
                if (now - cached.timestamp > this.config.cacheTimeout) {
                    this.accessCache.delete(key);
                }
            }
        }, this.config.cacheTimeout);
    }

    /**
     * Utility methods
     */
    updateAverageTime(operation, time) {
        const metricKey = `average${operation.charAt(0).toUpperCase() + operation.slice(1)}Time`;
        const operationKey = `authorizationChecks`;
        
        const totalOperations = this.metrics[operationKey];
        const currentAverage = this.metrics[metricKey];
        
        this.metrics[metricKey] = ((currentAverage * (totalOperations - 1)) + time) / totalOperations;
    }

    /**
     * Get authorization status
     */
    async getStatus() {
        return {
            initialized: this.isInitialized,
            rolesCount: this.roles.size,
            permissionsCount: this.permissions.size,
            resourcesCount: this.resources.size,
            policiesCount: this.policies.size,
            cacheSize: this.accessCache.size,
            metrics: this.metrics,
            healthy: this.isInitialized && this.roles.size > 0
        };
    }
}

module.exports = AuthorizationManager;