/**
 * CrossTabDataTransfer - Advanced Cross-Tab Data Synchronization System
 * Handles real-time data transfer between tabs with conflict resolution, encryption, and compression
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');
const zlib = require('zlib');

class CrossTabDataTransfer extends EventEmitter {
    constructor(persistentStorage, mainWindow) {
        super();
        this.storage = persistentStorage;
        this.mainWindow = mainWindow;
        
        // Active tab tracking
        this.activeTabs = new Map();
        this.tabSessions = new Map();
        this.dataChannels = new Map();
        
        // Transfer management
        this.activeTransfers = new Map();
        this.transferQueue = [];
        this.transferHistory = [];
        
        // Synchronization state
        this.syncState = new Map();
        this.conflictQueue = [];
        this.lastSyncTimestamp = new Map();
        
        // Configuration
        this.config = {
            maxTransferSize: 10 * 1024 * 1024, // 10MB
            compressionThreshold: 1024, // 1KB
            encryptSensitiveData: true,
            syncInterval: 5000, // 5 seconds
            maxRetries: 3,
            chunkSize: 64 * 1024, // 64KB chunks
            enableConflictResolution: true,
            enableRealTimeSync: true
        };
        
        // Data types and handlers
        this.dataTypes = new Map();
        this.syncHandlers = new Map();
        this.conflictResolvers = new Map();
        
        // Performance metrics
        this.metrics = {
            totalTransfers: 0,
            successfulTransfers: 0,
            failedTransfers: 0,
            totalDataTransferred: 0,
            averageTransferTime: 0,
            conflictsResolved: 0
        };
        
        this.initialize();
    }

    async initialize() {
        console.log('🔄 Initializing Cross-Tab Data Transfer System...');
        
        // Initialize data type handlers
        this.initializeDataTypes();
        
        // Initialize sync handlers
        this.initializeSyncHandlers();
        
        // Initialize conflict resolvers
        this.initializeConflictResolvers();
        
        // Initialize rollback system
        this.initializeRollbackSystem();
        
        // Start background sync if enabled
        if (this.config.enableRealTimeSync) {
            this.startBackgroundSync();
        }
        
        console.log('✅ Cross-Tab Data Transfer System initialized');
    }

    // ========================================================================
    // COMPREHENSIVE ROLLBACK SYSTEM
    // ========================================================================

    /**
     * Initialize the rollback system with state management and recovery points
     */
    initializeRollbackSystem() {
        console.log('🔄 Initializing Rollback System...');
        
        // Rollback storage and state management
        this.rollbackSystem = {
            // State snapshots for rollback
            stateSnapshots: new Map(),
            
            // Transaction log for operations
            transactionLog: [],
            
            // Recovery points with timestamps
            recoveryPoints: new Map(),
            
            // Active transactions
            activeTransactions: new Map(),
            
            // Rollback configuration
            config: {
                maxSnapshots: 100,
                maxTransactionLog: 1000,
                snapshotInterval: 60000, // 1 minute
                maxRecoveryPoints: 50,
                enableAutoRecovery: true,
                rollbackTimeout: 30000 // 30 seconds
            },
            
            // Rollback metrics
            metrics: {
                snapshotsTaken: 0,
                rollbacksPerformed: 0,
                recoveryPointsCreated: 0,
                autoRecoveriesTriggered: 0,
                manualRollbacksInitiated: 0
            }
        };
        
        // Start automatic snapshot creation
        this.startAutomaticSnapshotting();
        
        console.log('✅ Rollback System initialized');
    }

    /**
     * Create a state snapshot for rollback purposes
     */
    async createStateSnapshot(snapshotId = null, description = 'Automatic snapshot') {
        if (!snapshotId) {
            snapshotId = crypto.randomBytes(16).toString('hex');
        }
        
        console.log(`📸 Creating state snapshot: ${snapshotId} - ${description}`);
        
        try {
            const snapshot = {
                id: snapshotId,
                timestamp: Date.now(),
                description,
                state: {
                    activeTabs: this.serializeTabData(),
                    tabSessions: this.serializeSessionData(),
                    syncState: this.serializeSyncState(),
                    metrics: { ...this.metrics },
                    configuration: { ...this.config }
                },
                metadata: {
                    version: '1.0',
                    systemState: 'active',
                    dataIntegrity: await this.calculateStateIntegrity(),
                    createdBy: 'system'
                }
            };
            
            // Store snapshot
            this.rollbackSystem.stateSnapshots.set(snapshotId, snapshot);
            this.rollbackSystem.metrics.snapshotsTaken++;
            
            // Manage snapshot storage limits
            this.cleanupOldSnapshots();
            
            // Emit snapshot event
            this.emit('snapshot-created', snapshot);
            
            console.log(`✅ State snapshot created: ${snapshotId}`);
            return snapshotId;
            
        } catch (error) {
            console.error(`❌ Failed to create state snapshot: ${error.message}`);
            throw error;
        }
    }

    /**
     * Create a recovery point before critical operations
     */
    async createRecoveryPoint(operationType, operationData, description = '') {
        const recoveryId = crypto.randomBytes(16).toString('hex');
        
        console.log(`🛡️ Creating recovery point: ${recoveryId} for ${operationType}`);
        
        try {
            // Create pre-operation snapshot
            const snapshotId = await this.createStateSnapshot(
                `recovery-${recoveryId}`,
                `Pre-${operationType} recovery point`
            );
            
            const recoveryPoint = {
                id: recoveryId,
                timestamp: Date.now(),
                operationType,
                operationData: this.cloneObject(operationData),
                snapshotId,
                description,
                status: 'created',
                rollbackInstructions: this.generateRollbackInstructions(operationType, operationData)
            };
            
            this.rollbackSystem.recoveryPoints.set(recoveryId, recoveryPoint);
            this.rollbackSystem.metrics.recoveryPointsCreated++;
            
            // Cleanup old recovery points
            this.cleanupOldRecoveryPoints();
            
            console.log(`✅ Recovery point created: ${recoveryId}`);
            return recoveryId;
            
        } catch (error) {
            console.error(`❌ Failed to create recovery point: ${error.message}`);
            throw error;
        }
    }

    /**
     * Begin a transaction with automatic rollback capability
     */
    async beginTransaction(transactionType, transactionData = {}) {
        const transactionId = crypto.randomBytes(16).toString('hex');
        
        console.log(`🔄 Beginning transaction: ${transactionId} (${transactionType})`);
        
        try {
            // Create recovery point
            const recoveryPointId = await this.createRecoveryPoint(
                transactionType,
                transactionData,
                `Transaction: ${transactionType}`
            );
            
            const transaction = {
                id: transactionId,
                type: transactionType,
                startTime: Date.now(),
                recoveryPointId,
                data: this.cloneObject(transactionData),
                operations: [],
                status: 'active',
                rollbackData: {}
            };
            
            this.rollbackSystem.activeTransactions.set(transactionId, transaction);
            
            // Log transaction start
            this.logTransaction(transactionId, 'begin', { type: transactionType });
            
            console.log(`✅ Transaction started: ${transactionId}`);
            return transactionId;
            
        } catch (error) {
            console.error(`❌ Failed to begin transaction: ${error.message}`);
            throw error;
        }
    }

    /**
     * Commit a transaction and cleanup rollback data
     */
    async commitTransaction(transactionId) {
        console.log(`✅ Committing transaction: ${transactionId}`);
        
        const transaction = this.rollbackSystem.activeTransactions.get(transactionId);
        if (!transaction) {
            throw new Error(`Transaction not found: ${transactionId}`);
        }
        
        try {
            transaction.status = 'committed';
            transaction.endTime = Date.now();
            transaction.duration = transaction.endTime - transaction.startTime;
            
            // Log transaction commit
            this.logTransaction(transactionId, 'commit', { 
                duration: transaction.duration,
                operations: transaction.operations.length
            });
            
            // Remove from active transactions
            this.rollbackSystem.activeTransactions.delete(transactionId);
            
            // Mark recovery point as completed
            const recoveryPoint = this.rollbackSystem.recoveryPoints.get(transaction.recoveryPointId);
            if (recoveryPoint) {
                recoveryPoint.status = 'completed';
                recoveryPoint.completedAt = Date.now();
            }
            
            console.log(`✅ Transaction committed: ${transactionId} (${transaction.duration}ms)`);
            this.emit('transaction-committed', transaction);
            
        } catch (error) {
            console.error(`❌ Failed to commit transaction: ${error.message}`);
            // Auto-rollback on commit failure
            await this.rollbackTransaction(transactionId, 'commit-failure');
            throw error;
        }
    }

    /**
     * Rollback a transaction to its recovery point
     */
    async rollbackTransaction(transactionId, reason = 'manual') {
        console.log(`🔄 Rolling back transaction: ${transactionId} (reason: ${reason})`);
        
        const transaction = this.rollbackSystem.activeTransactions.get(transactionId);
        if (!transaction) {
            throw new Error(`Transaction not found: ${transactionId}`);
        }
        
        try {
            transaction.status = 'rolling-back';
            
            // Get recovery point
            const recoveryPoint = this.rollbackSystem.recoveryPoints.get(transaction.recoveryPointId);
            if (!recoveryPoint) {
                throw new Error(`Recovery point not found: ${transaction.recoveryPointId}`);
            }
            
            // Execute rollback using recovery point
            await this.executeRollback(recoveryPoint, transaction, reason);
            
            transaction.status = 'rolled-back';
            transaction.endTime = Date.now();
            transaction.rollbackReason = reason;
            
            // Log transaction rollback
            this.logTransaction(transactionId, 'rollback', { 
                reason,
                operations: transaction.operations.length
            });
            
            // Remove from active transactions
            this.rollbackSystem.activeTransactions.delete(transactionId);
            this.rollbackSystem.metrics.rollbacksPerformed++;
            
            console.log(`✅ Transaction rolled back: ${transactionId}`);
            this.emit('transaction-rolled-back', transaction);
            
        } catch (error) {
            console.error(`❌ Failed to rollback transaction: ${error.message}`);
            transaction.status = 'rollback-failed';
            throw error;
        }
    }

    /**
     * Execute rollback operations using recovery point data
     */
    async executeRollback(recoveryPoint, transaction, reason) {
        console.log(`🔄 Executing rollback operations for: ${recoveryPoint.id}`);
        
        try {
            // Get snapshot data
            const snapshot = this.rollbackSystem.stateSnapshots.get(recoveryPoint.snapshotId);
            if (!snapshot) {
                throw new Error(`Snapshot not found: ${recoveryPoint.snapshotId}`);
            }
            
            // Execute rollback instructions
            for (const instruction of recoveryPoint.rollbackInstructions) {
                await this.executeRollbackInstruction(instruction, snapshot, transaction);
            }
            
            // Restore state from snapshot if needed
            if (reason === 'critical-failure' || reason === 'data-corruption') {
                await this.restoreFromSnapshot(recoveryPoint.snapshotId);
            }
            
            console.log(`✅ Rollback operations completed for: ${recoveryPoint.id}`);
            
        } catch (error) {
            console.error(`❌ Rollback execution failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Execute individual rollback instruction
     */
    async executeRollbackInstruction(instruction, snapshot, transaction) {
        console.log(`🔄 Executing rollback instruction: ${instruction.type}`);
        
        try {
            switch (instruction.type) {
                case 'restore-tab-data':
                    await this.rollbackTabData(instruction.tabId, snapshot);
                    break;
                    
                case 'undo-transfer':
                    await this.undoDataTransfer(instruction.transferId, instruction.data);
                    break;
                    
                case 'restore-sync-state':
                    await this.rollbackSyncState(instruction.tabId, snapshot);
                    break;
                    
                case 'cleanup-failed-operation':
                    await this.cleanupFailedOperation(instruction.operationId, instruction.data);
                    break;
                    
                case 'restore-configuration':
                    await this.rollbackConfiguration(snapshot.state.configuration);
                    break;
                    
                default:
                    console.warn(`Unknown rollback instruction: ${instruction.type}`);
            }
            
        } catch (error) {
            console.error(`❌ Failed to execute rollback instruction: ${error.message}`);
            throw error;
        }
    }

    /**
     * Rollback tab data to previous state
     */
    async rollbackTabData(tabId, snapshot) {
        console.log(`🔄 Rolling back tab data: ${tabId}`);
        
        try {
            const snapshotTabData = snapshot.state.activeTabs[tabId];
            if (!snapshotTabData) {
                console.warn(`No snapshot data found for tab: ${tabId}`);
                return;
            }
            
            // Restore tab session data
            const currentTab = this.activeTabs.get(tabId);
            if (currentTab) {
                // Backup current state for potential re-rollback
                const backupData = {
                    dataState: new Map(currentTab.dataState),
                    lastActive: currentTab.lastActive,
                    syncStatus: currentTab.syncStatus
                };
                
                // Restore from snapshot
                currentTab.dataState = new Map(snapshotTabData.dataState);
                currentTab.lastActive = snapshotTabData.lastActive;
                currentTab.syncStatus = snapshotTabData.syncStatus;
                
                console.log(`✅ Tab data restored: ${tabId}`);
            }
            
        } catch (error) {
            console.error(`❌ Failed to rollback tab data: ${error.message}`);
            throw error;
        }
    }

    /**
     * Undo a data transfer operation
     */
    async undoDataTransfer(transferId, originalData) {
        console.log(`🔄 Undoing data transfer: ${transferId}`);
        
        try {
            // Find transfer in history
            const transfer = this.transferHistory.find(t => t.id === transferId);
            if (!transfer) {
                console.warn(`Transfer not found in history: ${transferId}`);
                return;
            }
            
            // Reverse transfer operations
            if (transfer.sourceTabId && transfer.targetTabId) {
                const sourceTab = this.activeTabs.get(transfer.sourceTabId);
                const targetTab = this.activeTabs.get(transfer.targetTabId);
                
                if (sourceTab && targetTab) {
                    // Remove transferred data from target
                    if (originalData && originalData.dataKeys) {
                        for (const key of originalData.dataKeys) {
                            targetTab.dataState.delete(key);
                        }
                    }
                    
                    // Restore original sync timestamps
                    if (originalData && originalData.syncTimestamp) {
                        this.lastSyncTimestamp.set(transfer.targetTabId, originalData.syncTimestamp);
                    }
                }
            }
            
            // Mark transfer as undone
            transfer.undone = true;
            transfer.undoneAt = Date.now();
            
            console.log(`✅ Data transfer undone: ${transferId}`);
            
        } catch (error) {
            console.error(`❌ Failed to undo data transfer: ${error.message}`);
            throw error;
        }
    }

    /**
     * Rollback sync state to previous checkpoint
     */
    async rollbackSyncState(tabId, snapshot) {
        console.log(`🔄 Rolling back sync state: ${tabId}`);
        
        try {
            const snapshotSyncData = snapshot.state.syncState[tabId];
            if (snapshotSyncData) {
                this.syncState.set(tabId, new Map(snapshotSyncData));
                this.lastSyncTimestamp.set(tabId, snapshot.timestamp);
                
                console.log(`✅ Sync state restored: ${tabId}`);
            }
            
        } catch (error) {
            console.error(`❌ Failed to rollback sync state: ${error.message}`);
            throw error;
        }
    }

    /**
     * Cleanup failed operation artifacts
     */
    async cleanupFailedOperation(operationId, operationData) {
        console.log(`🧹 Cleaning up failed operation: ${operationId}`);
        
        try {
            // Remove from active transfers
            if (this.activeTransfers.has(operationId)) {
                this.activeTransfers.delete(operationId);
            }
            
            // Cleanup temporary files or data
            if (operationData.tempFiles) {
                // Cleanup temporary resources
                for (const tempResource of operationData.tempFiles) {
                    // Cleanup logic for temporary resources
                    console.log(`Cleaning up temp resource: ${tempResource}`);
                }
            }
            
            // Emit cleanup event
            this.emit('operation-cleaned-up', { operationId, operationData });
            
            console.log(`✅ Operation cleanup completed: ${operationId}`);
            
        } catch (error) {
            console.error(`❌ Failed to cleanup operation: ${error.message}`);
            throw error;
        }
    }

    /**
     * Rollback system configuration
     */
    async rollbackConfiguration(snapshotConfig) {
        console.log('🔄 Rolling back system configuration...');
        
        try {
            const backupConfig = { ...this.config };
            
            // Restore configuration from snapshot
            Object.assign(this.config, snapshotConfig);
            
            // Emit configuration rollback event
            this.emit('configuration-rolled-back', { 
                previous: backupConfig, 
                restored: this.config 
            });
            
            console.log('✅ System configuration rolled back');
            
        } catch (error) {
            console.error(`❌ Failed to rollback configuration: ${error.message}`);
            throw error;
        }
    }

    /**
     * Restore complete system state from snapshot
     */
    async restoreFromSnapshot(snapshotId) {
        console.log(`🔄 Restoring system from snapshot: ${snapshotId}`);
        
        const snapshot = this.rollbackSystem.stateSnapshots.get(snapshotId);
        if (!snapshot) {
            throw new Error(`Snapshot not found: ${snapshotId}`);
        }
        
        try {
            // Backup current state
            const currentStateBackup = {
                activeTabs: this.serializeTabData(),
                configuration: { ...this.config },
                metrics: { ...this.metrics }
            };
            
            // Restore from snapshot
            await this.deserializeTabData(snapshot.state.activeTabs);
            await this.deserializeSessionData(snapshot.state.tabSessions);
            await this.deserializeSyncState(snapshot.state.syncState);
            
            // Restore configuration
            Object.assign(this.config, snapshot.state.configuration);
            
            // Update metrics
            this.rollbackSystem.metrics.autoRecoveriesTriggered++;
            
            this.emit('system-restored', { snapshotId, snapshot, currentStateBackup });
            console.log(`✅ System restored from snapshot: ${snapshotId}`);
            
        } catch (error) {
            console.error(`❌ Failed to restore from snapshot: ${error.message}`);
            throw error;
        }
    }

    // ========================================================================
    // ROLLBACK UTILITY FUNCTIONS
    // ========================================================================

    /**
     * Generate rollback instructions for different operation types
     */
    generateRollbackInstructions(operationType, operationData) {
        const instructions = [];
        
        switch (operationType) {
            case 'data-transfer':
                instructions.push({
                    type: 'undo-transfer',
                    transferId: operationData.transferId,
                    data: {
                        dataKeys: operationData.dataKeys,
                        syncTimestamp: operationData.originalSyncTimestamp
                    }
                });
                break;
                
            case 'tab-registration':
                instructions.push({
                    type: 'cleanup-failed-operation',
                    operationId: operationData.tabId,
                    data: { type: 'tab-cleanup' }
                });
                break;
                
            case 'sync-operation':
                instructions.push({
                    type: 'restore-sync-state',
                    tabId: operationData.tabId,
                    data: operationData
                });
                break;
                
            case 'configuration-change':
                instructions.push({
                    type: 'restore-configuration',
                    data: operationData.previousConfig
                });
                break;
                
            default:
                instructions.push({
                    type: 'cleanup-failed-operation',
                    operationId: operationData.operationId || crypto.randomBytes(8).toString('hex'),
                    data: operationData
                });
        }
        
        return instructions;
    }

    /**
     * Serialize tab data for snapshots
     */
    serializeTabData() {
        const serialized = {};
        
        for (const [tabId, tabData] of this.activeTabs.entries()) {
            serialized[tabId] = {
                id: tabData.id,
                url: tabData.url,
                title: tabData.title,
                lastActive: tabData.lastActive,
                dataState: Array.from(tabData.dataState.entries()),
                syncStatus: tabData.syncStatus,
                pendingTransfers: [...tabData.pendingTransfers]
            };
        }
        
        return serialized;
    }

    /**
     * Deserialize tab data from snapshots
     */
    async deserializeTabData(serializedData) {
        this.activeTabs.clear();
        
        for (const [tabId, tabData] of Object.entries(serializedData)) {
            const restoredTab = {
                id: tabData.id,
                url: tabData.url,
                title: tabData.title,
                lastActive: tabData.lastActive,
                dataState: new Map(tabData.dataState),
                syncStatus: tabData.syncStatus,
                pendingTransfers: [...tabData.pendingTransfers]
            };
            
            this.activeTabs.set(tabId, restoredTab);
        }
    }

    /**
     * Serialize session data for snapshots
     */
    serializeSessionData() {
        const serialized = {};
        
        for (const [tabId, sessionData] of this.tabSessions.entries()) {
            serialized[tabId] = Array.from(sessionData.entries());
        }
        
        return serialized;
    }

    /**
     * Deserialize session data from snapshots
     */
    async deserializeSessionData(serializedData) {
        this.tabSessions.clear();
        
        for (const [tabId, sessionData] of Object.entries(serializedData)) {
            this.tabSessions.set(tabId, new Map(sessionData));
        }
    }

    /**
     * Serialize sync state for snapshots
     */
    serializeSyncState() {
        const serialized = {};
        
        for (const [tabId, syncData] of this.syncState.entries()) {
            serialized[tabId] = Array.from(syncData.entries());
        }
        
        return serialized;
    }

    /**
     * Deserialize sync state from snapshots
     */
    async deserializeSyncState(serializedData) {
        this.syncState.clear();
        
        for (const [tabId, syncData] of Object.entries(serializedData)) {
            this.syncState.set(tabId, new Map(syncData));
        }
    }

    /**
     * Calculate state integrity hash for verification
     */
    async calculateStateIntegrity() {
        const stateData = {
            tabCount: this.activeTabs.size,
            sessionCount: this.tabSessions.size,
            syncStateCount: this.syncState.size,
            timestamp: Date.now()
        };
        
        return crypto.createHash('sha256')
            .update(JSON.stringify(stateData))
            .digest('hex');
    }

    /**
     * Clone object for safe storage
     */
    cloneObject(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    /**
     * Log transaction operations
     */
    logTransaction(transactionId, operation, data = {}) {
        const logEntry = {
            timestamp: Date.now(),
            transactionId,
            operation,
            data: this.cloneObject(data)
        };
        
        this.rollbackSystem.transactionLog.push(logEntry);
        
        // Maintain log size limit
        if (this.rollbackSystem.transactionLog.length > this.rollbackSystem.config.maxTransactionLog) {
            this.rollbackSystem.transactionLog = this.rollbackSystem.transactionLog.slice(-this.rollbackSystem.config.maxTransactionLog);
        }
        
        this.emit('transaction-logged', logEntry);
    }

    /**
     * Start automatic snapshots
     */
    startAutomaticSnapshotting() {
        if (this.snapshotInterval) {
            clearInterval(this.snapshotInterval);
        }
        
        this.snapshotInterval = setInterval(async () => {
            try {
                await this.createStateSnapshot(
                    null,
                    `Automatic snapshot - ${new Date().toISOString()}`
                );
            } catch (error) {
                console.error('❌ Automatic snapshot failed:', error);
            }
        }, this.rollbackSystem.config.snapshotInterval);
    }

    /**
     * Cleanup old snapshots
     */
    cleanupOldSnapshots() {
        const snapshots = Array.from(this.rollbackSystem.stateSnapshots.entries())
            .sort(([,a], [,b]) => b.timestamp - a.timestamp);
            
        if (snapshots.length > this.rollbackSystem.config.maxSnapshots) {
            const toRemove = snapshots.slice(this.rollbackSystem.config.maxSnapshots);
            for (const [snapshotId] of toRemove) {
                this.rollbackSystem.stateSnapshots.delete(snapshotId);
            }
        }
    }

    /**
     * Cleanup old recovery points
     */
    cleanupOldRecoveryPoints() {
        const recoveryPoints = Array.from(this.rollbackSystem.recoveryPoints.entries())
            .sort(([,a], [,b]) => b.timestamp - a.timestamp);
            
        if (recoveryPoints.length > this.rollbackSystem.config.maxRecoveryPoints) {
            const toRemove = recoveryPoints.slice(this.rollbackSystem.config.maxRecoveryPoints);
            for (const [recoveryId] of toRemove) {
                this.rollbackSystem.recoveryPoints.delete(recoveryId);
            }
        }
    }

    // ========================================================================
    // AUTOMATIC ROLLBACK TRIGGERS
    // ========================================================================

    /**
     * Monitor transfer operations for automatic rollback triggers
     */
    monitorTransferForRollback(transferId, transaction) {
        const transfer = this.activeTransfers.get(transferId);
        if (!transfer) return;
        
        // Set up monitoring
        const monitoringInterval = setInterval(async () => {
            try {
                await this.checkTransferHealth(transferId, transaction);
            } catch (error) {
                console.error('❌ Transfer health check failed:', error);
                clearInterval(monitoringInterval);
                await this.triggerAutomaticRollback(transferId, transaction, 'health-check-failure');
            }
        }, 5000); // Check every 5 seconds
        
        // Store monitoring reference
        transfer.monitoringInterval = monitoringInterval;
        
        // Setup transfer completion cleanup
        this.once(`transfer-completed-${transferId}`, () => {
            clearInterval(monitoringInterval);
        });
        
        this.once(`transfer-failed-${transferId}`, async () => {
            clearInterval(monitoringInterval);
            await this.triggerAutomaticRollback(transferId, transaction, 'transfer-failure');
        });
    }

    /**
     * Check transfer health for automatic rollback triggers
     */
    async checkTransferHealth(transferId, transaction) {
        const transfer = this.activeTransfers.get(transferId);
        if (!transfer) return;
        
        // Check for timeout
        const elapsed = Date.now() - transfer.startTime;
        if (elapsed > this.rollbackSystem.config.rollbackTimeout) {
            throw new Error('Transfer timeout exceeded');
        }
        
        // Check for data corruption
        if (transfer.metadata && transfer.metadata.corrupted) {
            throw new Error('Data corruption detected');
        }
        
        // Check for memory leaks or resource issues
        const memoryUsage = process.memoryUsage();
        if (memoryUsage.heapUsed > 1024 * 1024 * 1024) { // 1GB limit
            console.warn('⚠️ High memory usage detected during transfer');
        }
    }

    /**
     * Trigger automatic rollback for failed operations
     */
    async triggerAutomaticRollback(operationId, transaction, reason) {
        if (!this.rollbackSystem.config.enableAutoRecovery) {
            console.log(`⚠️ Auto-rollback disabled, skipping for: ${operationId}`);
            return;
        }
        
        console.log(`🚨 Triggering automatic rollback: ${operationId} (reason: ${reason})`);
        
        try {
            if (transaction) {
                await this.rollbackTransaction(transaction.id, `auto-${reason}`);
            } else {
                // Create emergency rollback
                await this.performEmergencyRollback(operationId, reason);
            }
            
            this.rollbackSystem.metrics.autoRecoveriesTriggered++;
            this.emit('automatic-rollback-triggered', { operationId, reason });
            
        } catch (error) {
            console.error(`❌ Automatic rollback failed: ${error.message}`);
            this.emit('rollback-failure', { operationId, reason, error: error.message });
        }
    }

    /**
     * Perform emergency rollback without transaction context
     */
    async performEmergencyRollback(operationId, reason) {
        console.log(`🚨 Performing emergency rollback: ${operationId}`);
        
        try {
            // Find most recent snapshot
            const snapshots = Array.from(this.rollbackSystem.stateSnapshots.values())
                .sort((a, b) => b.timestamp - a.timestamp);
                
            if (snapshots.length === 0) {
                throw new Error('No snapshots available for emergency rollback');
            }
            
            const latestSnapshot = snapshots[0];
            
            // Check if snapshot is recent enough (within last hour)
            const snapshotAge = Date.now() - latestSnapshot.timestamp;
            if (snapshotAge > 3600000) { // 1 hour
                console.warn('⚠️ Latest snapshot is older than 1 hour');
            }
            
            // Restore from latest snapshot
            await this.restoreFromSnapshot(latestSnapshot.id);
            
            console.log(`✅ Emergency rollback completed: ${operationId}`);
            
        } catch (error) {
            console.error(`❌ Emergency rollback failed: ${error.message}`);
            throw error;
        }
    }

    // ========================================================================
    // MANUAL ROLLBACK CONTROLS
    // ========================================================================

    /**
     * Initiate manual rollback with user confirmation
     */
    async initiateManualRollback(targetId, rollbackType = 'transaction', options = {}) {
        console.log(`🔄 Manual rollback initiated: ${targetId} (${rollbackType})`);
        
        try {
            // Validate rollback request
            const validation = await this.validateRollbackRequest(targetId, rollbackType, options);
            if (!validation.isValid) {
                throw new Error(`Rollback validation failed: ${validation.reason}`);
            }
            
            // Create safety checkpoint before manual rollback
            const checkpointId = await this.createStateSnapshot(
                null,
                `Pre-manual-rollback checkpoint: ${targetId}`
            );
            
            // Execute rollback based on type
            let result;
            switch (rollbackType) {
                case 'transaction':
                    result = await this.rollbackTransaction(targetId, 'manual');
                    break;
                    
                case 'snapshot':
                    result = await this.restoreFromSnapshot(targetId);
                    break;
                    
                case 'recovery-point':
                    const recoveryPoint = this.rollbackSystem.recoveryPoints.get(targetId);
                    if (!recoveryPoint) {
                        throw new Error(`Recovery point not found: ${targetId}`);
                    }
                    result = await this.executeRollback(recoveryPoint, null, 'manual');
                    break;
                    
                default:
                    throw new Error(`Unknown rollback type: ${rollbackType}`);
            }
            
            this.rollbackSystem.metrics.manualRollbacksInitiated++;
            
            console.log(`✅ Manual rollback completed: ${targetId}`);
            return {
                success: true,
                targetId,
                rollbackType,
                checkpointId,
                result
            };
            
        } catch (error) {
            console.error(`❌ Manual rollback failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Validate rollback request for safety
     */
    async validateRollbackRequest(targetId, rollbackType, options) {
        const validation = { isValid: true, errors: [], warnings: [] };
        
        // Check if target exists
        switch (rollbackType) {
            case 'transaction':
                if (!this.rollbackSystem.activeTransactions.has(targetId)) {
                    validation.isValid = false;
                    validation.errors.push('Transaction not found or not active');
                }
                break;
                
            case 'snapshot':
                if (!this.rollbackSystem.stateSnapshots.has(targetId)) {
                    validation.isValid = false;
                    validation.errors.push('Snapshot not found');
                }
                break;
                
            case 'recovery-point':
                if (!this.rollbackSystem.recoveryPoints.has(targetId)) {
                    validation.isValid = false;
                    validation.errors.push('Recovery point not found');
                }
                break;
        }
        
        // Check for safety conditions
        if (this.activeTransfers.size > 0 && !options.forceRollback) {
            validation.warnings.push('Active transfers in progress - rollback may cause data loss');
        }
        
        return validation;
    }

    /**
     * List available rollback options
     */
    getAvailableRollbackOptions() {
        const options = {
            transactions: [],
            snapshots: [],
            recoveryPoints: []
        };
        
        // Active transactions
        for (const [id, transaction] of this.rollbackSystem.activeTransactions.entries()) {
            options.transactions.push({
                id,
                type: transaction.type,
                startTime: transaction.startTime,
                age: Date.now() - transaction.startTime
            });
        }
        
        // Recent snapshots (last 10)
        const recentSnapshots = Array.from(this.rollbackSystem.stateSnapshots.values())
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 10);
            
        for (const snapshot of recentSnapshots) {
            options.snapshots.push({
                id: snapshot.id,
                description: snapshot.description,
                timestamp: snapshot.timestamp,
                age: Date.now() - snapshot.timestamp
            });
        }
        
        // Recent recovery points (last 10)
        const recentRecoveryPoints = Array.from(this.rollbackSystem.recoveryPoints.values())
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 10);
            
        for (const recoveryPoint of recentRecoveryPoints) {
            options.recoveryPoints.push({
                id: recoveryPoint.id,
                operationType: recoveryPoint.operationType,
                timestamp: recoveryPoint.timestamp,
                description: recoveryPoint.description,
                age: Date.now() - recoveryPoint.timestamp
            });
        }
        
        return options;
    }

    /**
     * Get rollback system metrics and status
     */
    getRollbackSystemStatus() {
        const status = {
            enabled: this.rollbackSystem !== undefined,
            metrics: { ...this.rollbackSystem.metrics },
            counts: {
                activeTransactions: this.rollbackSystem.activeTransactions.size,
                storedSnapshots: this.rollbackSystem.stateSnapshots.size,
                recoveryPoints: this.rollbackSystem.recoveryPoints.size,
                transactionLogEntries: this.rollbackSystem.transactionLog.length
            },
            configuration: { ...this.rollbackSystem.config },
            lastSnapshot: null,
            lastRecoveryPoint: null
        };
        
        // Find latest snapshot
        const snapshots = Array.from(this.rollbackSystem.stateSnapshots.values());
        if (snapshots.length > 0) {
            status.lastSnapshot = snapshots.reduce((latest, current) => 
                current.timestamp > latest.timestamp ? current : latest
            );
        }
        
        // Find latest recovery point
        const recoveryPoints = Array.from(this.rollbackSystem.recoveryPoints.values());
        if (recoveryPoints.length > 0) {
            status.lastRecoveryPoint = recoveryPoints.reduce((latest, current) => 
                current.timestamp > latest.timestamp ? current : latest
            );
        }
        
        return status;
    }

    // ========================================================================
    // END COMPREHENSIVE ROLLBACK SYSTEM
    // ========================================================================

    // Tab Management
    registerTab(tabId, tabInfo) {
        const session = {
            id: tabId,
            url: tabInfo.url,
            title: tabInfo.title,
            lastActive: Date.now(),
            dataState: new Map(),
            pendingTransfers: [],
            syncStatus: 'idle'
        };
        
        this.activeTabs.set(tabId, session);
        this.tabSessions.set(tabId, new Map());
        this.lastSyncTimestamp.set(tabId, Date.now());
        
        this.emit('tab-registered', { tabId, session });
        console.log(`📋 Tab registered: ${tabId} - ${tabInfo.title}`);
    }

    unregisterTab(tabId) {
        // Clean up pending transfers
        if (this.activeTabs.has(tabId)) {
            const session = this.activeTabs.get(tabId);
            session.pendingTransfers.forEach(transferId => {
                this.cancelTransfer(transferId);
            });
        }
        
        this.activeTabs.delete(tabId);
        this.tabSessions.delete(tabId);
        this.dataChannels.delete(tabId);
        this.lastSyncTimestamp.delete(tabId);
        
        this.emit('tab-unregistered', { tabId });
        console.log(`📋 Tab unregistered: ${tabId}`);
    }

    updateTabActivity(tabId) {
        if (this.activeTabs.has(tabId)) {
            this.activeTabs.get(tabId).lastActive = Date.now();
        }
    }

    // Data Transfer Core Functions
    async transferData(sourceTabId, targetTabId, data, options = {}) {
        const transferId = crypto.randomBytes(16).toString('hex');
        const startTime = Date.now();
        let transactionId = null;
        
        try {
            // Validate transfer request
            this.validateTransferRequest(sourceTabId, targetTabId, data, options);
            
            // Begin rollback transaction for the transfer
            transactionId = await this.beginTransaction('data-transfer', {
                transferId,
                sourceTabId,
                targetTabId,
                dataKeys: Object.keys(data),
                originalSyncTimestamp: this.lastSyncTimestamp.get(targetTabId)
            });
            
            // Create transfer session
            const transfer = {
                id: transferId,
                sourceTabId,
                targetTabId,
                data,
                options,
                startTime,
                status: 'initializing',
                progress: 0,
                chunks: [],
                transactionId, // Link to rollback transaction
                metadata: {
                    dataType: options.dataType || 'generic',
                    originalSize: this.calculateDataSize(data),
                    compressed: false,
                    encrypted: false
                }
            };
            
            this.activeTransfers.set(transferId, transfer);
            
            // Start monitoring for automatic rollback
            this.monitorTransferForRollback(transferId, { id: transactionId });
            
            this.emit('transfer-started', transfer);
            
            // Process data based on options
            let processedData = await this.processTransferData(data, options);
            transfer.metadata.processedSize = this.calculateDataSize(processedData);
            
            // Check if data needs chunking
            if (transfer.metadata.processedSize > this.config.chunkSize) {
                transfer.status = 'chunking';
                processedData = await this.chunkData(processedData, transfer);
            }
            
            // Execute transfer
            transfer.status = 'transferring';
            const result = await this.executeTransfer(transfer, processedData);
            
            // Complete transfer
            transfer.status = 'completed';
            transfer.endTime = Date.now();
            transfer.duration = transfer.endTime - transfer.startTime;
            transfer.result = result;
            
            // Commit the rollback transaction
            if (transactionId) {
                await this.commitTransaction(transactionId);
            }
            
            // Update metrics
            this.updateTransferMetrics(transfer);
            
            // Move to history
            this.transferHistory.push(transfer);
            this.activeTransfers.delete(transferId);
            
            // Emit completion events
            this.emit('transfer-completed', transfer);
            this.emit(`transfer-completed-${transferId}`, transfer);
            console.log(`✅ Data transfer completed: ${transferId} (${transfer.duration}ms)`);
            
            return {
                success: true,
                transferId,
                duration: transfer.duration,
                result
            };
            
        } catch (error) {
            console.error(`❌ Data transfer failed: ${transferId}`, error);
            
            // Rollback the transaction on failure
            if (transactionId) {
                try {
                    await this.rollbackTransaction(transactionId, 'transfer-failure');
                } catch (rollbackError) {
                    console.error(`❌ Rollback failed for transfer: ${rollbackError.message}`);
                }
            }
            
            // Update transfer record
            if (this.activeTransfers.has(transferId)) {
                const transfer = this.activeTransfers.get(transferId);
                transfer.status = 'failed';
                transfer.error = error.message;
                transfer.endTime = Date.now();
                transfer.duration = transfer.endTime - transfer.startTime;
                
                this.transferHistory.push(transfer);
                this.activeTransfers.delete(transferId);
                
                this.emit('transfer-failed', transfer);
                this.emit(`transfer-failed-${transferId}`, transfer);
            }
            
            throw error;
        }
    }

    async processTransferData(data, options) {
        let processedData = { ...data };
        
        // Apply data transformations
        if (options.transform) {
            processedData = await this.applyDataTransformation(processedData, options.transform);
        }
        
        // Compress if enabled and data is large enough
        if (this.shouldCompress(processedData)) {
            processedData = await this.compressData(processedData);
        }
        
        // Encrypt sensitive data
        if (this.shouldEncrypt(processedData, options)) {
            processedData = await this.encryptData(processedData, options.encryptionKey);
        }
        
        return processedData;
    }

    async executeTransfer(transfer, data) {
        const { sourceTabId, targetTabId } = transfer;
        
        // Get target tab session
        const targetSession = this.activeTabs.get(targetTabId);
        if (!targetSession) {
            throw new Error(`Target tab not found: ${targetTabId}`);
        }
        
        // Prepare transfer payload
        const payload = {
            transferId: transfer.id,
            sourceTabId,
            data,
            metadata: transfer.metadata,
            timestamp: Date.now()
        };
        
        // Send to target tab via IPC
        this.mainWindow.webContents.send('cross-tab-data-receive', {
            targetTabId,
            payload
        });
        
        // Wait for acknowledgment (with timeout)
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Transfer acknowledgment timeout'));
            }, 30000); // 30 second timeout
            
            const onAck = (ackData) => {
                if (ackData.transferId === transfer.id) {
                    clearTimeout(timeout);
                    this.removeListener('transfer-ack', onAck);
                    resolve(ackData);
                }
            };
            
            this.on('transfer-ack', onAck);
        });
    }

    // Data Processing Functions
    shouldCompress(data) {
        const size = this.calculateDataSize(data);
        return size >= this.config.compressionThreshold;
    }

    shouldEncrypt(data, options) {
        if (!this.config.encryptSensitiveData) return false;
        if (options.forceEncryption) return true;
        
        // Check for sensitive data patterns
        const dataString = JSON.stringify(data).toLowerCase();
        const sensitivePatterns = [
            'password', 'token', 'key', 'secret', 
            'ssn', 'social', 'credit', 'card',
            'bank', 'account', 'personal'
        ];
        
        return sensitivePatterns.some(pattern => dataString.includes(pattern));
    }

    async compressData(data) {
        const jsonString = JSON.stringify(data);
        const compressed = await new Promise((resolve, reject) => {
            zlib.gzip(jsonString, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
        
        return {
            __compressed: true,
            data: compressed.toString('base64'),
            originalSize: jsonString.length,
            compressedSize: compressed.length
        };
    }

    async decompressData(compressedData) {
        if (!compressedData.__compressed) return compressedData;
        
        const buffer = Buffer.from(compressedData.data, 'base64');
        const decompressed = await new Promise((resolve, reject) => {
            zlib.gunzip(buffer, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
        
        return JSON.parse(decompressed.toString());
    }

    async encryptData(data, key) {
        if (!key) {
            key = crypto.randomBytes(32); // Generate random key if not provided
        }
        
        const jsonString = JSON.stringify(data);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher('aes-256-cbc', key);
        
        let encrypted = cipher.update(jsonString, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        
        return {
            __encrypted: true,
            data: encrypted,
            iv: iv.toString('base64'),
            keyHint: crypto.createHash('sha256').update(key).digest('hex').substring(0, 8)
        };
    }

    async decryptData(encryptedData, key) {
        if (!encryptedData.__encrypted) return encryptedData;
        
        const decipher = crypto.createDecipher('aes-256-cbc', key);
        let decrypted = decipher.update(encryptedData.data, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        
        return JSON.parse(decrypted);
    }

    async chunkData(data, transfer) {
        const jsonString = JSON.stringify(data);
        const totalSize = Buffer.byteLength(jsonString, 'utf8');
        const chunks = [];
        const chunkSize = this.config.chunkSize;
        
        for (let i = 0; i < totalSize; i += chunkSize) {
            const chunk = {
                id: crypto.randomBytes(8).toString('hex'),
                index: Math.floor(i / chunkSize),
                data: jsonString.slice(i, i + chunkSize),
                size: Math.min(chunkSize, totalSize - i),
                isLast: i + chunkSize >= totalSize
            };
            
            chunks.push(chunk);
        }
        
        transfer.chunks = chunks;
        transfer.metadata.totalChunks = chunks.length;
        
        return {
            __chunked: true,
            totalChunks: chunks.length,
            totalSize,
            chunks
        };
    }

    async reassembleChunks(chunkedData) {
        if (!chunkedData.__chunked) return chunkedData;
        
        // Sort chunks by index
        const sortedChunks = chunkedData.chunks.sort((a, b) => a.index - b.index);
        
        // Reassemble data
        let reassembled = '';
        for (const chunk of sortedChunks) {
            reassembled += chunk.data;
        }
        
        return JSON.parse(reassembled);
    }

    // ========================================================================
    // ENHANCED TRANSFER PROTOCOL LAYER
    // ========================================================================

    /**
     * Enhanced Transfer Protocol with handshake, authentication, and reliability
     */
    
    async initiateSecureTransfer(sourceTabId, targetTabId, data, options = {}) {
        const protocolId = crypto.randomBytes(16).toString('hex');
        console.log(`🔐 Initiating secure transfer protocol: ${protocolId}`);
        
        try {
            // Step 1: Protocol Handshake
            const handshakeResult = await this.performProtocolHandshake(sourceTabId, targetTabId, protocolId, options);
            if (!handshakeResult.success) {
                throw new Error(`Handshake failed: ${handshakeResult.reason}`);
            }
            
            // Step 2: Establish Secure Channel
            const secureChannel = await this.establishSecureChannel(sourceTabId, targetTabId, protocolId, options);
            
            // Step 3: Transfer with Reliability Protocol
            const transferResult = await this.executeReliableTransfer(secureChannel, data, options);
            
            // Step 4: Protocol Cleanup
            await this.cleanupProtocolSession(protocolId);
            
            console.log(`✅ Secure transfer protocol completed: ${protocolId}`);
            return transferResult;
            
        } catch (error) {
            console.error(`❌ Secure transfer protocol failed: ${protocolId}`, error);
            await this.cleanupProtocolSession(protocolId);
            throw error;
        }
    }

    async performProtocolHandshake(sourceTabId, targetTabId, protocolId, options) {
        console.log(`🤝 Performing protocol handshake: ${protocolId}`);
        
        const handshakeData = {
            protocolId,
            version: '1.0',
            sourceTabId,
            targetTabId,
            timestamp: Date.now(),
            nonce: crypto.randomBytes(16).toString('hex'),
            supportedFeatures: [
                'encryption',
                'compression',
                'chunking',
                'retry',
                'integrity-check',
                'replay-protection'
            ],
            requestedFeatures: options.features || ['encryption', 'integrity-check']
        };
        
        // Send handshake request
        const handshakeResponse = await this.sendProtocolMessage('handshake-request', handshakeData, targetTabId);
        
        if (!handshakeResponse || !handshakeResponse.success) {
            return { success: false, reason: 'No handshake response or failed' };
        }
        
        // Validate handshake response
        const validation = this.validateHandshakeResponse(handshakeData, handshakeResponse);
        if (!validation.isValid) {
            return { success: false, reason: validation.reason };
        }
        
        // Store protocol session
        this.protocolSessions = this.protocolSessions || new Map();
        this.protocolSessions.set(protocolId, {
            sourceTabId,
            targetTabId,
            established: Date.now(),
            nonce: handshakeData.nonce,
            targetNonce: handshakeResponse.nonce,
            agreedFeatures: handshakeResponse.agreedFeatures,
            sharedSecret: this.deriveSharedSecret(handshakeData.nonce, handshakeResponse.nonce)
        });
        
        console.log(`✅ Protocol handshake successful: ${protocolId}`);
        return { success: true, session: this.protocolSessions.get(protocolId) };
    }

    async establishSecureChannel(sourceTabId, targetTabId, protocolId, options) {
        console.log(`🔒 Establishing secure channel: ${protocolId}`);
        
        const session = this.protocolSessions.get(protocolId);
        if (!session) {
            throw new Error('Protocol session not found');
        }
        
        // Generate channel encryption keys
        const channelKey = this.deriveChannelKey(session.sharedSecret);
        const integrityKey = this.deriveIntegrityKey(session.sharedSecret);
        
        // Create secure channel
        const secureChannel = {
            protocolId,
            sourceTabId,
            targetTabId,
            encryptionKey: channelKey,
            integrityKey: integrityKey,
            sequenceNumber: 0,
            established: Date.now(),
            features: session.agreedFeatures
        };
        
        // Test channel with ping
        const pingResult = await this.testSecureChannel(secureChannel);
        if (!pingResult.success) {
            throw new Error(`Secure channel test failed: ${pingResult.reason}`);
        }
        
        console.log(`✅ Secure channel established: ${protocolId}`);
        return secureChannel;
    }

    async executeReliableTransfer(secureChannel, data, options) {
        console.log(`📦 Executing reliable transfer via secure channel: ${secureChannel.protocolId}`);
        
        const transferId = crypto.randomBytes(16).toString('hex');
        let attempt = 0;
        const maxAttempts = options.maxRetries || this.config.maxRetries;
        
        while (attempt < maxAttempts) {
            try {
                attempt++;
                console.log(`📡 Transfer attempt ${attempt}/${maxAttempts}: ${transferId}`);
                
                // Prepare secure message
                const secureMessage = await this.prepareSecureMessage(secureChannel, data, transferId);
                
                // Send with delivery confirmation
                const deliveryResult = await this.sendWithConfirmation(secureChannel, secureMessage);
                
                // Verify integrity
                const integrityResult = await this.verifyTransferIntegrity(secureChannel, deliveryResult);
                
                if (integrityResult.success) {
                    console.log(`✅ Reliable transfer successful: ${transferId} (attempt ${attempt})`);
                    return {
                        success: true,
                        transferId,
                        attempts: attempt,
                        deliveryTime: deliveryResult.deliveryTime,
                        integrity: integrityResult
                    };
                }
                
                console.log(`⚠️ Transfer integrity check failed, retrying... (attempt ${attempt})`);
                
            } catch (error) {
                console.log(`❌ Transfer attempt ${attempt} failed: ${error.message}`);
                
                if (attempt >= maxAttempts) {
                    throw new Error(`Transfer failed after ${maxAttempts} attempts: ${error.message}`);
                }
                
                // Exponential backoff
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    async prepareSecureMessage(secureChannel, data, transferId) {
        const message = {
            transferId,
            protocolId: secureChannel.protocolId,
            sequenceNumber: ++secureChannel.sequenceNumber,
            timestamp: Date.now(),
            data: data
        };
        
        // Apply channel features
        if (secureChannel.features.includes('compression')) {
            if (this.shouldCompress(message.data)) {
                message.data = await this.compressData(message.data);
            }
        }
        
        if (secureChannel.features.includes('encryption')) {
            message.data = await this.encryptData(message.data, secureChannel.encryptionKey);
        }
        
        // Add integrity check
        if (secureChannel.features.includes('integrity-check')) {
            message.integrity = this.calculateMessageIntegrity(message, secureChannel.integrityKey);
        }
        
        // Add replay protection
        if (secureChannel.features.includes('replay-protection')) {
            message.nonce = crypto.randomBytes(16).toString('hex');
        }
        
        return message;
    }

    async sendWithConfirmation(secureChannel, message) {
        const startTime = Date.now();
        
        // Send message
        this.mainWindow.webContents.send('secure-transfer-message', {
            targetTabId: secureChannel.targetTabId,
            message: message
        });
        
        // Wait for delivery confirmation
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Delivery confirmation timeout'));
            }, 30000);
            
            const onConfirmation = (confirmationData) => {
                if (confirmationData.transferId === message.transferId && 
                    confirmationData.protocolId === secureChannel.protocolId) {
                    clearTimeout(timeout);
                    this.removeListener('delivery-confirmation', onConfirmation);
                    resolve({
                        success: true,
                        deliveryTime: Date.now() - startTime,
                        confirmation: confirmationData
                    });
                }
            };
            
            this.on('delivery-confirmation', onConfirmation);
        });
    }

    async verifyTransferIntegrity(secureChannel, deliveryResult) {
        if (!secureChannel.features.includes('integrity-check')) {
            return { success: true, reason: 'Integrity check not enabled' };
        }
        
        const confirmation = deliveryResult.confirmation;
        
        // Verify message integrity hash
        if (!confirmation.integrityHash) {
            return { success: false, reason: 'No integrity hash in confirmation' };
        }
        
        // Calculate expected hash and compare
        const expectedHash = this.calculateConfirmationHash(confirmation, secureChannel.integrityKey);
        
        if (confirmation.integrityHash !== expectedHash) {
            return { success: false, reason: 'Integrity hash mismatch' };
        }
        
        return { success: true, reason: 'Integrity verified' };
    }

    async testSecureChannel(secureChannel) {
        try {
            const pingData = {
                type: 'ping',
                timestamp: Date.now(),
                nonce: crypto.randomBytes(8).toString('hex')
            };
            
            const pingMessage = await this.prepareSecureMessage(secureChannel, pingData, 'ping-test');
            const pongResult = await this.sendWithConfirmation(secureChannel, pingMessage);
            
            return { success: true, roundTripTime: pongResult.deliveryTime };
            
        } catch (error) {
            return { success: false, reason: error.message };
        }
    }

    validateHandshakeResponse(request, response) {
        // Validate required fields
        if (!response.nonce || !response.agreedFeatures) {
            return { isValid: false, reason: 'Missing required response fields' };
        }
        
        // Validate nonce (should be different from request)
        if (response.nonce === request.nonce) {
            return { isValid: false, reason: 'Invalid response nonce' };
        }
        
        // Validate agreed features are subset of requested
        const invalidFeatures = response.agreedFeatures.filter(
            feature => !request.supportedFeatures.includes(feature)
        );
        
        if (invalidFeatures.length > 0) {
            return { isValid: false, reason: `Unsupported features agreed: ${invalidFeatures.join(', ')}` };
        }
        
        return { isValid: true };
    }

    deriveSharedSecret(nonce1, nonce2) {
        return crypto.createHash('sha256')
            .update(nonce1 + nonce2)
            .digest();
    }

    deriveChannelKey(sharedSecret) {
        return crypto.createHash('sha256')
            .update(sharedSecret)
            .update('channel-encryption')
            .digest();
    }

    deriveIntegrityKey(sharedSecret) {
        return crypto.createHash('sha256')
            .update(sharedSecret)
            .update('message-integrity')
            .digest();
    }

    calculateMessageIntegrity(message, integrityKey) {
        const messageData = {
            transferId: message.transferId,
            protocolId: message.protocolId,
            sequenceNumber: message.sequenceNumber,
            timestamp: message.timestamp,
            data: message.data
        };
        
        return crypto.createHmac('sha256', integrityKey)
            .update(JSON.stringify(messageData))
            .digest('hex');
    }

    calculateConfirmationHash(confirmation, integrityKey) {
        return crypto.createHmac('sha256', integrityKey)
            .update(JSON.stringify(confirmation))
            .digest('hex');
    }

    async sendProtocolMessage(messageType, data, targetTabId) {
        return new Promise((resolve, reject) => {
            const messageId = crypto.randomBytes(8).toString('hex');
            
            this.mainWindow.webContents.send('protocol-message', {
                messageId,
                messageType,
                targetTabId,
                data
            });
            
            const timeout = setTimeout(() => {
                reject(new Error('Protocol message timeout'));
            }, 10000);
            
            const onResponse = (responseData) => {
                if (responseData.messageId === messageId) {
                    clearTimeout(timeout);
                    this.removeListener('protocol-response', onResponse);
                    resolve(responseData.data);
                }
            };
            
            this.on('protocol-response', onResponse);
        });
    }

    async cleanupProtocolSession(protocolId) {
        if (this.protocolSessions && this.protocolSessions.has(protocolId)) {
            this.protocolSessions.delete(protocolId);
            console.log(`🧹 Protocol session cleaned up: ${protocolId}`);
        }
    }

    // ========================================================================
    // PROTOCOL MESSAGE HANDLERS
    // ========================================================================

    /**
     * Handle incoming protocol messages
     */
    async handleProtocolMessage(messageType, data, sourceTabId) {
        console.log(`📨 Handling protocol message: ${messageType} from ${sourceTabId}`);
        
        try {
            switch (messageType) {
                case 'handshake-request':
                    return await this.handleHandshakeRequest(data, sourceTabId);
                
                case 'secure-transfer-message':
                    return await this.handleSecureTransferMessage(data, sourceTabId);
                
                case 'delivery-confirmation':
                    this.emit('delivery-confirmation', data);
                    return { success: true };
                
                case 'protocol-response':
                    this.emit('protocol-response', data);
                    return { success: true };
                
                case 'ping-test':
                    return await this.handlePingTest(data, sourceTabId);
                
                default:
                    throw new Error(`Unknown protocol message type: ${messageType}`);
            }
            
        } catch (error) {
            console.error(`❌ Protocol message handling error:`, error);
            return { success: false, error: error.message };
        }
    }

    async handleHandshakeRequest(handshakeData, sourceTabId) {
        console.log(`🤝 Handling handshake request from: ${sourceTabId}`);
        
        // Validate handshake request
        if (!handshakeData.protocolId || !handshakeData.nonce) {
            throw new Error('Invalid handshake request');
        }
        
        // Check if we support the requested features
        const supportedFeatures = [
            'encryption', 'compression', 'chunking', 
            'retry', 'integrity-check', 'replay-protection'
        ];
        
        const requestedFeatures = handshakeData.requestedFeatures || [];
        const agreedFeatures = requestedFeatures.filter(feature => 
            supportedFeatures.includes(feature)
        );
        
        // Generate response nonce
        const responseNonce = crypto.randomBytes(16).toString('hex');
        
        // Create handshake response
        const response = {
            success: true,
            protocolId: handshakeData.protocolId,
            nonce: responseNonce,
            agreedFeatures: agreedFeatures,
            timestamp: Date.now()
        };
        
        console.log(`✅ Handshake accepted with features: ${agreedFeatures.join(', ')}`);
        return response;
    }

    async handleSecureTransferMessage(messageData, sourceTabId) {
        console.log(`🔒 Handling secure transfer message from: ${sourceTabId}`);
        
        try {
            // Validate message structure
            if (!messageData.message) {
                throw new Error('No message data provided');
            }
            
            const message = messageData.message;
            
            // Get protocol session if exists
            const protocolSession = this.protocolSessions?.get(message.protocolId);
            
            // Verify message integrity if enabled
            if (message.integrity && protocolSession) {
                const expectedIntegrity = this.calculateMessageIntegrity(message, protocolSession.sharedSecret);
                if (message.integrity !== expectedIntegrity) {
                    throw new Error('Message integrity verification failed');
                }
            }
            
            // Decrypt data if encrypted
            let data = message.data;
            if (data.__encrypted && protocolSession) {
                data = await this.decryptData(data, protocolSession.sharedSecret);
            }
            
            // Decompress data if compressed
            if (data.__compressed) {
                data = await this.decompressData(data);
            }
            
            // Send delivery confirmation
            const confirmation = {
                transferId: message.transferId,
                protocolId: message.protocolId,
                sequenceNumber: message.sequenceNumber,
                received: Date.now(),
                success: true
            };
            
            // Add integrity hash if required
            if (protocolSession && protocolSession.agreedFeatures?.includes('integrity-check')) {
                confirmation.integrityHash = this.calculateConfirmationHash(confirmation, protocolSession.sharedSecret);
            }
            
            this.emit('delivery-confirmation', confirmation);
            
            // Process received data
            this.emit('secure-data-received', {
                sourceTabId,
                targetTabId: messageData.targetTabId,
                data: data,
                metadata: {
                    transferId: message.transferId,
                    protocolId: message.protocolId,
                    received: confirmation.received
                }
            });
            
            console.log(`✅ Secure transfer message processed: ${message.transferId}`);
            return { success: true, confirmation };
            
        } catch (error) {
            console.error(`❌ Secure transfer message handling error:`, error);
            
            // Send error confirmation
            const errorConfirmation = {
                transferId: messageData.message?.transferId || 'unknown',
                success: false,
                error: error.message,
                timestamp: Date.now()
            };
            
            this.emit('delivery-confirmation', errorConfirmation);
            throw error;
        }
    }

    async handlePingTest(pingData, sourceTabId) {
        console.log(`🏓 Handling ping test from: ${sourceTabId}`);
        
        const pong = {
            type: 'pong',
            originalTimestamp: pingData.timestamp,
            responseTimestamp: Date.now(),
            nonce: pingData.nonce
        };
        
        return { success: true, pong };
    }

    // ========================================================================
    // PROTOCOL SECURITY ENHANCEMENTS
    // ========================================================================

    /**
     * Rate limiting for protocol messages
     */
    initializeRateLimiting() {
        this.rateLimits = new Map();
        this.rateLimitConfig = {
            maxRequestsPerMinute: 60,
            maxRequestsPerHour: 1000,
            blockDuration: 300000 // 5 minutes
        };
    }

    checkRateLimit(sourceTabId, messageType) {
        if (!this.rateLimits) {
            this.initializeRateLimiting();
        }
        
        const now = Date.now();
        const key = `${sourceTabId}-${messageType}`;
        
        if (!this.rateLimits.has(key)) {
            this.rateLimits.set(key, {
                requests: [],
                blocked: false,
                blockUntil: 0
            });
        }
        
        const limit = this.rateLimits.get(key);
        
        // Check if still blocked
        if (limit.blocked && now < limit.blockUntil) {
            return { allowed: false, reason: 'Rate limit exceeded' };
        }
        
        // Clear old requests
        limit.requests = limit.requests.filter(time => now - time < 60000); // Keep last minute
        
        // Check rate limit
        if (limit.requests.length >= this.rateLimitConfig.maxRequestsPerMinute) {
            limit.blocked = true;
            limit.blockUntil = now + this.rateLimitConfig.blockDuration;
            return { allowed: false, reason: 'Rate limit exceeded' };
        }
        
        // Add current request
        limit.requests.push(now);
        return { allowed: true };
    }

    /**
     * Protocol session management with timeout
     */
    startProtocolSessionCleanup() {
        this.protocolCleanupInterval = setInterval(() => {
            this.cleanupExpiredSessions();
        }, 300000); // 5 minutes
    }

    cleanupExpiredSessions() {
        if (!this.protocolSessions) return;
        
        const now = Date.now();
        const sessionTimeout = 1800000; // 30 minutes
        
        for (const [protocolId, session] of this.protocolSessions.entries()) {
            if (now - session.established > sessionTimeout) {
                this.protocolSessions.delete(protocolId);
                console.log(`🧹 Expired protocol session cleaned up: ${protocolId}`);
            }
        }
    }

    /**
     * Protocol message validation and sanitization
     */
    validateProtocolMessage(messageType, data, sourceTabId) {
        const validation = { isValid: true, errors: [] };
        
        // Basic validation
        if (!messageType || typeof messageType !== 'string') {
            validation.isValid = false;
            validation.errors.push('Invalid message type');
        }
        
        if (!data || typeof data !== 'object') {
            validation.isValid = false;
            validation.errors.push('Invalid message data');
        }
        
        if (!sourceTabId || typeof sourceTabId !== 'string') {
            validation.isValid = false;
            validation.errors.push('Invalid source tab ID');
        }
        
        // Rate limiting check
        const rateCheck = this.checkRateLimit(sourceTabId, messageType);
        if (!rateCheck.allowed) {
            validation.isValid = false;
            validation.errors.push(`Rate limit exceeded: ${rateCheck.reason}`);
        }
        
        // Message size validation
        try {
            const messageSize = Buffer.byteLength(JSON.stringify(data));
            if (messageSize > 1024 * 1024) { // 1MB limit
                validation.isValid = false;
                validation.errors.push('Message too large');
            }
        } catch (error) {
            validation.isValid = false;
            validation.errors.push('Message serialization error');
        }
        
        return validation;
    }

    /**
     * Protocol audit logging
     */
    logProtocolEvent(eventType, details) {
        if (!this.protocolAuditLog) {
            this.protocolAuditLog = [];
        }
        
        const logEntry = {
            timestamp: Date.now(),
            eventType,
            details,
            id: crypto.randomBytes(8).toString('hex')
        };
        
        this.protocolAuditLog.push(logEntry);
        
        // Keep only last 1000 entries
        if (this.protocolAuditLog.length > 1000) {
            this.protocolAuditLog = this.protocolAuditLog.slice(-1000);
        }
        
        // Emit for external logging
        this.emit('protocol-audit', logEntry);
    }

    /**
     * Get protocol statistics
     */
    getProtocolStats() {
        const stats = {
            activeSessions: this.protocolSessions ? this.protocolSessions.size : 0,
            auditLogEntries: this.protocolAuditLog ? this.protocolAuditLog.length : 0,
            rateLimitedSources: this.rateLimits ? this.rateLimits.size : 0
        };
        
        return stats;
    }

    // ========================================================================
    // END ENHANCED TRANSFER PROTOCOL LAYER
    // ========================================================================

    // Synchronization Functions
    async syncTabData(tabId, dataType = null) {
        const session = this.activeTabs.get(tabId);
        if (!session) {
            throw new Error(`Tab not found: ${tabId}`);
        }
        
        session.syncStatus = 'syncing';
        const syncStartTime = Date.now();
        
        try {
            // Get current tab data
            const currentData = await this.getTabData(tabId, dataType);
            
            // Get last sync timestamp
            const lastSync = this.lastSyncTimestamp.get(tabId) || 0;
            
            // Check for conflicts with other tabs
            const conflicts = await this.detectConflicts(tabId, currentData, lastSync);
            
            if (conflicts.length > 0 && this.config.enableConflictResolution) {
                // Resolve conflicts
                const resolvedData = await this.resolveConflicts(conflicts, currentData);
                await this.updateTabData(tabId, resolvedData);
            }
            
            // Update sync timestamp
            this.lastSyncTimestamp.set(tabId, Date.now());
            session.syncStatus = 'idle';
            
            this.emit('sync-completed', {
                tabId,
                dataType,
                duration: Date.now() - syncStartTime,
                conflicts: conflicts.length
            });
            
        } catch (error) {
            session.syncStatus = 'error';
            console.error(`Sync failed for tab ${tabId}:`, error);
            throw error;
        }
    }

    async detectConflicts(tabId, currentData, lastSync) {
        const conflicts = [];
        
        // Compare with other active tabs
        for (const [otherTabId, otherSession] of this.activeTabs) {
            if (otherTabId === tabId) continue;
            
            const otherData = await this.getTabData(otherTabId);
            const otherLastSync = this.lastSyncTimestamp.get(otherTabId) || 0;
            
            // Find conflicting data points
            const tabConflicts = this.findDataConflicts(currentData, otherData, lastSync, otherLastSync);
            conflicts.push(...tabConflicts.map(conflict => ({
                ...conflict,
                sourceTabId: tabId,
                conflictTabId: otherTabId
            })));
        }
        
        return conflicts;
    }

    findDataConflicts(data1, data2, timestamp1, timestamp2) {
        const conflicts = [];
        
        // Deep comparison for conflicts
        this.deepCompareObjects(data1, data2, '', conflicts, timestamp1, timestamp2);
        
        return conflicts;
    }

    deepCompareObjects(obj1, obj2, path, conflicts, ts1, ts2) {
        const keys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
        
        for (const key of keys) {
            const currentPath = path ? `${path}.${key}` : key;
            const val1 = obj1[key];
            const val2 = obj2[key];
            
            if (val1 !== val2) {
                if (typeof val1 === 'object' && typeof val2 === 'object' && val1 !== null && val2 !== null) {
                    this.deepCompareObjects(val1, val2, currentPath, conflicts, ts1, ts2);
                } else {
                    conflicts.push({
                        path: currentPath,
                        value1: val1,
                        value2: val2,
                        timestamp1: ts1,
                        timestamp2: ts2,
                        type: 'value_conflict'
                    });
                }
            }
        }
    }

    // Utility Functions
    calculateDataSize(data) {
        return Buffer.byteLength(JSON.stringify(data), 'utf8');
    }

    validateTransferRequest(sourceTabId, targetTabId, data, options) {
        if (!this.activeTabs.has(sourceTabId)) {
            throw new Error(`Source tab not found: ${sourceTabId}`);
        }
        
        if (!this.activeTabs.has(targetTabId)) {
            throw new Error(`Target tab not found: ${targetTabId}`);
        }
        
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data for transfer');
        }
        
        const dataSize = this.calculateDataSize(data);
        if (dataSize > this.config.maxTransferSize) {
            throw new Error(`Data size exceeds maximum: ${dataSize} > ${this.config.maxTransferSize}`);
        }
    }

    updateTransferMetrics(transfer) {
        this.metrics.totalTransfers++;
        
        if (transfer.status === 'completed') {
            this.metrics.successfulTransfers++;
            this.metrics.totalDataTransferred += transfer.metadata.originalSize;
            
            // Update running average
            const currentAvg = this.metrics.averageTransferTime;
            const count = this.metrics.successfulTransfers;
            this.metrics.averageTransferTime = ((currentAvg * (count - 1)) + transfer.duration) / count;
        } else if (transfer.status === 'failed') {
            this.metrics.failedTransfers++;
        }
    }

    // Initialize system components
    initializeDataTypes() {
        // Form data
        this.dataTypes.set('form', {
            serialize: (data) => this.serializeFormData(data),
            deserialize: (data) => this.deserializeFormData(data),
            validate: (data) => this.validateFormData(data)
        });
        
        // Bookmark data
        this.dataTypes.set('bookmarks', {
            serialize: (data) => data,
            deserialize: (data) => data,
            validate: (data) => this.validateBookmarkData(data)
        });
        
        // Settings data
        this.dataTypes.set('settings', {
            serialize: (data) => data,
            deserialize: (data) => data,
            validate: (data) => this.validateSettingsData(data)
        });
        
        // Custom user data
        this.dataTypes.set('user', {
            serialize: (data) => data,
            deserialize: (data) => data,
            validate: (data) => this.validateUserData(data)
        });
    }

    // ========================================================================
    // COMPREHENSIVE DATA VALIDATION SYSTEM
    // ========================================================================

    /**
     * Advanced Data Validation for Cross-Tab Transfer
     * Provides comprehensive validation, sanitization, and security checks
     */

    async validateTransferData(data, dataType = 'user', options = {}) {
        console.log(`🔍 Validating transfer data (type: ${dataType})...`);
        
        const validation = {
            isValid: true,
            errors: [],
            warnings: [],
            sanitizedData: null,
            securityThreats: [],
            metrics: {
                fieldCount: 0,
                validFields: 0,
                invalidFields: 0,
                sanitizedFields: 0,
                threatCount: 0
            }
        };

        try {
            // 1. Basic structure validation
            const structureValidation = this.validateDataStructure(data);
            if (!structureValidation.isValid) {
                validation.isValid = false;
                validation.errors.push(...structureValidation.errors);
                return validation;
            }

            // 2. Data type specific validation
            const typeValidation = await this.validateDataType(data, dataType);
            if (!typeValidation.isValid) {
                validation.isValid = false;
                validation.errors.push(...typeValidation.errors);
            }
            validation.warnings.push(...typeValidation.warnings);

            // 3. Security validation
            const securityValidation = await this.validateDataSecurity(data, options);
            validation.securityThreats.push(...securityValidation.threats);
            if (securityValidation.hasThreats) {
                validation.warnings.push('Security threats detected and mitigated');
            }

            // 4. Content validation and sanitization
            const contentValidation = await this.validateAndSanitizeContent(data, options);
            validation.sanitizedData = contentValidation.sanitizedData;
            validation.metrics = contentValidation.metrics;

            // 5. Size and complexity validation
            const sizeValidation = this.validateDataSize(validation.sanitizedData || data);
            if (!sizeValidation.isValid) {
                validation.isValid = false;
                validation.errors.push(...sizeValidation.errors);
            }

            // 6. Format and schema validation
            if (options.schema) {
                const schemaValidation = await this.validateAgainstSchema(
                    validation.sanitizedData || data, 
                    options.schema
                );
                if (!schemaValidation.isValid) {
                    validation.errors.push(...schemaValidation.errors);
                    validation.isValid = false;
                }
            }

            console.log(`✅ Data validation complete - Valid: ${validation.isValid}`);
            return validation;

        } catch (error) {
            console.error('❌ Data validation error:', error);
            validation.isValid = false;
            validation.errors.push(`Validation error: ${error.message}`);
            return validation;
        }
    }

    /**
     * Validate basic data structure
     */
    validateDataStructure(data) {
        const validation = { isValid: true, errors: [] };

        // Check for null/undefined
        if (data === null || data === undefined) {
            validation.isValid = false;
            validation.errors.push('Data cannot be null or undefined');
            return validation;
        }

        // Check for circular references
        try {
            JSON.stringify(data);
        } catch (error) {
            if (error.message.includes('circular')) {
                validation.isValid = false;
                validation.errors.push('Data contains circular references');
            }
        }

        // Check for valid data types
        const validTypes = ['object', 'string', 'number', 'boolean', 'array'];
        const dataType = Array.isArray(data) ? 'array' : typeof data;
        
        if (!validTypes.includes(dataType)) {
            validation.isValid = false;
            validation.errors.push(`Invalid data type: ${dataType}`);
        }

        return validation;
    }

    /**
     * Validate data based on specific type
     */
    async validateDataType(data, dataType) {
        const validation = { isValid: true, errors: [], warnings: [] };

        switch (dataType) {
            case 'form':
                return this.validateFormData(data);
            case 'bookmarks':
                return this.validateBookmarkData(data);
            case 'settings':
                return this.validateSettingsData(data);
            case 'user':
                return this.validateUserData(data);
            default:
                validation.warnings.push(`Unknown data type: ${dataType}, using generic validation`);
                return this.validateGenericData(data);
        }
    }

    /**
     * Validate form data
     */
    validateFormData(data) {
        const validation = { isValid: true, errors: [], warnings: [] };

        if (typeof data !== 'object' || Array.isArray(data)) {
            validation.isValid = false;
            validation.errors.push('Form data must be an object');
            return validation;
        }

        // Check for common form field patterns
        const formFieldPatterns = {
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            phone: /^[\d\s\-\+\(\)\.]+$/,
            url: /^https?:\/\/.+/,
            creditCard: /^\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}$/
        };

        Object.keys(data).forEach(key => {
            const value = data[key];
            const lowerKey = key.toLowerCase();

            // Email validation
            if (lowerKey.includes('email') && value && !formFieldPatterns.email.test(value)) {
                validation.warnings.push(`Invalid email format in field: ${key}`);
            }

            // Phone validation
            if (lowerKey.includes('phone') && value && !formFieldPatterns.phone.test(value)) {
                validation.warnings.push(`Invalid phone format in field: ${key}`);
            }

            // URL validation
            if (lowerKey.includes('url') && value && !formFieldPatterns.url.test(value)) {
                validation.warnings.push(`Invalid URL format in field: ${key}`);
            }

            // Credit card detection (security warning)
            if (value && formFieldPatterns.creditCard.test(value)) {
                validation.warnings.push(`Potential credit card number detected in field: ${key}`);
            }
        });

        return validation;
    }

    /**
     * Validate bookmark data
     */
    validateBookmarkData(data) {
        const validation = { isValid: true, errors: [], warnings: [] };

        if (!Array.isArray(data)) {
            validation.isValid = false;
            validation.errors.push('Bookmark data must be an array');
            return validation;
        }

        data.forEach((bookmark, index) => {
            if (typeof bookmark !== 'object') {
                validation.errors.push(`Bookmark at index ${index} must be an object`);
                validation.isValid = false;
                return;
            }

            // Required fields
            if (!bookmark.url) {
                validation.errors.push(`Bookmark at index ${index} missing required field: url`);
                validation.isValid = false;
            }

            // URL validation
            if (bookmark.url && !/^https?:\/\/.+/.test(bookmark.url)) {
                validation.warnings.push(`Invalid URL format in bookmark ${index}: ${bookmark.url}`);
            }

            // Title validation
            if (bookmark.title && typeof bookmark.title !== 'string') {
                validation.warnings.push(`Bookmark title at index ${index} should be a string`);
            }
        });

        return validation;
    }

    /**
     * Validate settings data
     */
    validateSettingsData(data) {
        const validation = { isValid: true, errors: [], warnings: [] };

        if (typeof data !== 'object' || Array.isArray(data)) {
            validation.isValid = false;
            validation.errors.push('Settings data must be an object');
            return validation;
        }

        // Check for dangerous settings
        const dangerousKeys = ['password', 'secret', 'key', 'token', 'auth'];
        Object.keys(data).forEach(key => {
            const lowerKey = key.toLowerCase();
            if (dangerousKeys.some(dangerous => lowerKey.includes(dangerous))) {
                validation.warnings.push(`Sensitive setting detected: ${key}`);
            }
        });

        return validation;
    }

    /**
     * Validate generic user data
     */
    validateUserData(data) {
        const validation = { isValid: true, errors: [], warnings: [] };

        if (typeof data !== 'object') {
            validation.isValid = false;
            validation.errors.push('User data must be an object');
            return validation;
        }

        return validation;
    }

    /**
     * Validate generic data
     */
    validateGenericData(data) {
        const validation = { isValid: true, errors: [], warnings: [] };

        // Basic checks for any data type
        if (typeof data === 'string' && data.length > 100000) {
            validation.warnings.push('Large string data detected');
        }

        if (Array.isArray(data) && data.length > 1000) {
            validation.warnings.push('Large array data detected');
        }

        return validation;
    }

    /**
     * Security validation and threat detection
     */
    async validateDataSecurity(data, options = {}) {
        const validation = { hasThreats: false, threats: [] };

        try {
            const dataString = JSON.stringify(data);
            
            // SQL Injection patterns
            const sqlPatterns = [
                /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b)/gi,
                /(;|\|\||&&|'|"|`)/g,
                /(-{2}|\/\*|\*\/)/g
            ];

            // XSS patterns
            const xssPatterns = [
                /<script[^>]*>.*?<\/script>/gi,
                /javascript:/gi,
                /on\w+\s*=/gi,
                /<iframe[^>]*>/gi,
                /<object[^>]*>/gi,
                /<embed[^>]*>/gi
            ];

            // Path traversal patterns
            const pathPatterns = [
                /\.\.[\/\\]/g,
                /\/etc\/passwd/gi,
                /\/windows\/system32/gi
            ];

            // Command injection patterns
            const commandPatterns = [
                /(\||&|;|`|\$\(|\${)/g,
                /(rm\s+-rf|del\s+\/s)/gi,
                /(wget|curl)\s+/gi
            ];

            // Check all patterns
            const patternChecks = [
                { patterns: sqlPatterns, type: 'SQL Injection' },
                { patterns: xssPatterns, type: 'Cross-Site Scripting (XSS)' },
                { patterns: pathPatterns, type: 'Path Traversal' },
                { patterns: commandPatterns, type: 'Command Injection' }
            ];

            patternChecks.forEach(({ patterns, type }) => {
                patterns.forEach(pattern => {
                    if (pattern.test(dataString)) {
                        validation.hasThreats = true;
                        validation.threats.push({
                            type,
                            pattern: pattern.toString(),
                            severity: 'high'
                        });
                    }
                });
            });

            // Check for sensitive data patterns
            const sensitivePatterns = [
                { pattern: /\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/g, type: 'Credit Card' },
                { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, type: 'Social Security Number' },
                { pattern: /password\s*[:=]\s*[^\s]+/gi, type: 'Password' },
                { pattern: /api[_\-]?key\s*[:=]\s*[^\s]+/gi, type: 'API Key' }
            ];

            sensitivePatterns.forEach(({ pattern, type }) => {
                if (pattern.test(dataString)) {
                    validation.hasThreats = true;
                    validation.threats.push({
                        type: `Sensitive Data: ${type}`,
                        severity: 'medium'
                    });
                }
            });

        } catch (error) {
            console.error('Security validation error:', error);
            validation.threats.push({
                type: 'Validation Error',
                message: error.message,
                severity: 'low'
            });
        }

        return validation;
    }

    /**
     * Content validation and sanitization
     */
    async validateAndSanitizeContent(data, options = {}) {
        const metrics = {
            fieldCount: 0,
            validFields: 0,
            invalidFields: 0,
            sanitizedFields: 0,
            threatCount: 0
        };

        const sanitizedData = await this.deepSanitizeData(data, metrics);

        return { sanitizedData, metrics };
    }

    /**
     * Deep sanitization of data structures
     */
    async deepSanitizeData(data, metrics = {}) {
        if (typeof data === 'string') {
            metrics.fieldCount++;
            const sanitized = this.sanitizeString(data);
            if (sanitized !== data) {
                metrics.sanitizedFields++;
            }
            metrics.validFields++;
            return sanitized;
        }

        if (typeof data === 'number' || typeof data === 'boolean') {
            metrics.fieldCount++;
            metrics.validFields++;
            return data;
        }

        if (Array.isArray(data)) {
            return Promise.all(data.map(item => this.deepSanitizeData(item, metrics)));
        }

        if (typeof data === 'object' && data !== null) {
            const sanitizedObj = {};
            for (const [key, value] of Object.entries(data)) {
                const sanitizedKey = this.sanitizeString(key);
                sanitizedObj[sanitizedKey] = await this.deepSanitizeData(value, metrics);
            }
            return sanitizedObj;
        }

        return data;
    }

    /**
     * String sanitization
     */
    sanitizeString(str) {
        if (typeof str !== 'string') return str;

        // Remove potentially dangerous characters
        let sanitized = str
            .replace(/[<>]/g, '') // Remove < and >
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+\s*=/gi, '') // Remove event handlers
            .replace(/script/gi, '') // Remove script tags
            .trim();

        // Limit length
        if (sanitized.length > 10000) {
            sanitized = sanitized.substring(0, 10000);
        }

        return sanitized;
    }

    /**
     * Validate data size
     */
    validateDataSize(data) {
        const validation = { isValid: true, errors: [] };

        try {
            const dataSize = this.calculateDataSize(data);
            
            if (dataSize > this.config.maxTransferSize) {
                validation.isValid = false;
                validation.errors.push(`Data size (${dataSize} bytes) exceeds maximum allowed (${this.config.maxTransferSize} bytes)`);
            }

            // Warn for large data
            if (dataSize > this.config.maxTransferSize * 0.8) {
                validation.errors.push(`Warning: Data size is approaching the limit (${dataSize}/${this.config.maxTransferSize})`);
            }

        } catch (error) {
            validation.isValid = false;
            validation.errors.push(`Size calculation error: ${error.message}`);
        }

        return validation;
    }

    /**
     * Validate against schema
     */
    async validateAgainstSchema(data, schema) {
        const validation = { isValid: true, errors: [] };

        try {
            if (!schema || !schema.fields) {
                validation.errors.push('Invalid schema provided');
                validation.isValid = false;
                return validation;
            }

            // Check required fields
            if (typeof data === 'object' && !Array.isArray(data)) {
                schema.fields.forEach(field => {
                    if (field.required && !(field.name in data)) {
                        validation.isValid = false;
                        validation.errors.push(`Required field missing: ${field.name}`);
                    }

                    if (field.name in data && field.type) {
                        const actualType = Array.isArray(data[field.name]) ? 'array' : typeof data[field.name];
                        if (actualType !== field.type) {
                            validation.errors.push(`Type mismatch for field ${field.name}: expected ${field.type}, got ${actualType}`);
                        }
                    }
                });
            }

        } catch (error) {
            validation.isValid = false;
            validation.errors.push(`Schema validation error: ${error.message}`);
        }

        return validation;
    }

    /**
     * Enhanced form data validation with specific rules
     */
    validateFormData(data) {
        const validation = { isValid: true, errors: [], warnings: [] };

        if (!data || typeof data !== 'object') {
            validation.isValid = false;
            validation.errors.push('Form data must be a valid object');
            return validation;
        }

        return validation;
    }

    // ========================================================================
    // END COMPREHENSIVE DATA VALIDATION SYSTEM
    // ========================================================================

    // ========================================================================
    // COMPREHENSIVE DATA VALIDATION SYSTEM
    // ========================================================================

    /**
     * Advanced Data Validation for Cross-Tab Transfer
     * Provides comprehensive validation, sanitization, and security checks
     */

    async validateTransferData(data, dataType = 'user', options = {}) {
        console.log(`🔍 Validating transfer data (type: ${dataType})...`);
        
        const validation = {
            isValid: true,
            errors: [],
            warnings: [],
            sanitizedData: null,
            securityThreats: [],
            metrics: {
                fieldCount: 0,
                validFields: 0,
                invalidFields: 0,
                sanitizedFields: 0,
                threatCount: 0
            }
        };

        try {
            // Basic structure validation
            const structureValidation = this.validateDataStructure(data);
            if (!structureValidation.isValid) {
                validation.isValid = false;
                validation.errors.push(...structureValidation.errors);
                return validation;
            }

            // Data type specific validation
            const typeValidation = await this.validateDataType(data, dataType);
            if (!typeValidation.isValid) {
                validation.isValid = false;
                validation.errors.push(...typeValidation.errors);
            }
            validation.warnings.push(...typeValidation.warnings);

            // Security validation
            const securityValidation = await this.validateDataSecurity(data, options);
            validation.securityThreats.push(...securityValidation.threats);
            if (securityValidation.hasThreats) {
                validation.warnings.push('Security threats detected and mitigated');
            }

            // Content validation and sanitization
            const contentValidation = await this.validateAndSanitizeContent(data, options);
            validation.sanitizedData = contentValidation.sanitizedData;
            validation.metrics = contentValidation.metrics;

            console.log(`✅ Data validation complete - Valid: ${validation.isValid}`);
            return validation;

        } catch (error) {
            console.error('❌ Data validation error:', error);
            validation.isValid = false;
            validation.errors.push(`Validation error: ${error.message}`);
            return validation;
        }
    }

    /**
     * Validate basic data structure
     */
    validateDataStructure(data) {
        const validation = { isValid: true, errors: [] };

        if (data === null || data === undefined) {
            validation.isValid = false;
            validation.errors.push('Data cannot be null or undefined');
            return validation;
        }

        try {
            JSON.stringify(data);
        } catch (error) {
            if (error.message.includes('circular')) {
                validation.isValid = false;
                validation.errors.push('Data contains circular references');
            }
        }

        return validation;
    }

    /**
     * Validate form data
     */
    validateFormData(data) {
        const validation = { isValid: true, errors: [], warnings: [] };

        if (typeof data !== 'object' || Array.isArray(data)) {
            validation.isValid = false;
            validation.errors.push('Form data must be an object');
            return validation;
        }

        // Check for sensitive data patterns
        Object.keys(data).forEach(key => {
            const value = data[key];
            const lowerKey = key.toLowerCase();

            // Email validation
            if (lowerKey.includes('email') && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                validation.warnings.push(`Invalid email format in field: ${key}`);
            }

            // Credit card detection
            if (value && /^\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}$/.test(value)) {
                validation.warnings.push(`Potential credit card number detected in field: ${key}`);
            }
        });

        return validation;
    }

    /**
     * Validate bookmark data
     */
    validateBookmarkData(data) {
        const validation = { isValid: true, errors: [], warnings: [] };

        if (!Array.isArray(data)) {
            validation.isValid = false;
            validation.errors.push('Bookmark data must be an array');
            return validation;
        }

        data.forEach((bookmark, index) => {
            if (typeof bookmark !== 'object') {
                validation.errors.push(`Bookmark at index ${index} must be an object`);
                validation.isValid = false;
                return;
            }

            if (!bookmark.url) {
                validation.errors.push(`Bookmark at index ${index} missing required field: url`);
                validation.isValid = false;
            }

            if (bookmark.url && !/^https?:\/\/.+/.test(bookmark.url)) {
                validation.warnings.push(`Invalid URL format in bookmark ${index}: ${bookmark.url}`);
            }
        });

        return validation;
    }

    /**
     * Validate settings data
     */
    validateSettingsData(data) {
        const validation = { isValid: true, errors: [], warnings: [] };

        if (typeof data !== 'object' || Array.isArray(data)) {
            validation.isValid = false;
            validation.errors.push('Settings data must be an object');
            return validation;
        }

        const dangerousKeys = ['password', 'secret', 'key', 'token', 'auth'];
        Object.keys(data).forEach(key => {
            const lowerKey = key.toLowerCase();
            if (dangerousKeys.some(dangerous => lowerKey.includes(dangerous))) {
                validation.warnings.push(`Sensitive setting detected: ${key}`);
            }
        });

        return validation;
    }

    /**
     * Validate generic user data
     */
    validateUserData(data) {
        const validation = { isValid: true, errors: [], warnings: [] };

        if (typeof data !== 'object') {
            validation.isValid = false;
            validation.errors.push('User data must be an object');
            return validation;
        }

        return validation;
    }

    /**
     * Validate data based on specific type
     */
    async validateDataType(data, dataType) {
        switch (dataType) {
            case 'form':
                return this.validateFormData(data);
            case 'bookmarks':
                return this.validateBookmarkData(data);
            case 'settings':
                return this.validateSettingsData(data);
            case 'user':
                return this.validateUserData(data);
            default:
                return { isValid: true, errors: [], warnings: [`Unknown data type: ${dataType}`] };
        }
    }

    /**
     * Security validation and threat detection
     */
    async validateDataSecurity(data, options = {}) {
        const validation = { hasThreats: false, threats: [] };

        try {
            const dataString = JSON.stringify(data);
            
            // XSS patterns
            const xssPatterns = [
                /<script[^>]*>.*?<\/script>/gi,
                /javascript:/gi,
                /on\w+\s*=/gi
            ];

            // SQL Injection patterns
            const sqlPatterns = [
                /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b)/gi,
                /(;|\|\||&&|'|"|`)/g
            ];

            // Check patterns
            [...xssPatterns, ...sqlPatterns].forEach(pattern => {
                if (pattern.test(dataString)) {
                    validation.hasThreats = true;
                    validation.threats.push({
                        type: 'Security Threat',
                        pattern: pattern.toString(),
                        severity: 'high'
                    });
                }
            });

        } catch (error) {
            console.error('Security validation error:', error);
        }

        return validation;
    }

    /**
     * Content validation and sanitization
     */
    async validateAndSanitizeContent(data, options = {}) {
        const metrics = {
            fieldCount: 0,
            validFields: 0,
            invalidFields: 0,
            sanitizedFields: 0,
            threatCount: 0
        };

        const sanitizedData = await this.deepSanitizeData(data, metrics);
        return { sanitizedData, metrics };
    }

    /**
     * Deep sanitization of data structures
     */
    async deepSanitizeData(data, metrics = {}) {
        if (typeof data === 'string') {
            metrics.fieldCount++;
            const sanitized = this.sanitizeString(data);
            if (sanitized !== data) {
                metrics.sanitizedFields++;
            }
            metrics.validFields++;
            return sanitized;
        }

        if (typeof data === 'number' || typeof data === 'boolean') {
            metrics.fieldCount++;
            metrics.validFields++;
            return data;
        }

        if (Array.isArray(data)) {
            return Promise.all(data.map(item => this.deepSanitizeData(item, metrics)));
        }

        if (typeof data === 'object' && data !== null) {
            const sanitizedObj = {};
            for (const [key, value] of Object.entries(data)) {
                const sanitizedKey = this.sanitizeString(key);
                sanitizedObj[sanitizedKey] = await this.deepSanitizeData(value, metrics);
            }
            return sanitizedObj;
        }

        return data;
    }

    /**
     * String sanitization
     */
    sanitizeString(str) {
        if (typeof str !== 'string') return str;

        let sanitized = str
            .replace(/[<>]/g, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .replace(/script/gi, '')
            .trim();

        if (sanitized.length > 10000) {
            sanitized = sanitized.substring(0, 10000);
        }

        return sanitized;
    }

    // ========================================================================
    // END COMPREHENSIVE DATA VALIDATION SYSTEM
    // ========================================================================

    initializeSyncHandlers() {
        // Real-time form sync
        this.syncHandlers.set('form', async (tabId, data) => {
            // Sync form data across tabs
            return this.syncFormData(tabId, data);
        });
        
        // Settings sync
        this.syncHandlers.set('settings', async (tabId, data) => {
            // Sync settings to persistent storage
            await this.storage.setSetting('crossTabSync', data);
            return data;
        });
    }

    initializeConflictResolvers() {
        // Last-write-wins resolver
        this.conflictResolvers.set('last-write-wins', (conflict) => {
            return conflict.timestamp1 > conflict.timestamp2 ? conflict.value1 : conflict.value2;
        });
        
        // User-choice resolver
        this.conflictResolvers.set('user-choice', (conflict) => {
            this.conflictQueue.push(conflict);
            this.emit('conflict-detected', conflict);
            return null; // Will be resolved by user interaction
        });
        
        // Merge resolver for arrays
        this.conflictResolvers.set('merge-arrays', (conflict) => {
            if (Array.isArray(conflict.value1) && Array.isArray(conflict.value2)) {
                return [...new Set([...conflict.value1, ...conflict.value2])];
            }
            return conflict.value1;
        });
    }

    startBackgroundSync() {
        setInterval(async () => {
            for (const tabId of this.activeTabs.keys()) {
                try {
                    await this.syncTabData(tabId);
                } catch (error) {
                    console.error(`Background sync failed for tab ${tabId}:`, error);
                }
            }
        }, this.config.syncInterval);
        
        console.log('🔄 Background sync started');
    }

    // API Methods
    getActiveTransfers() {
        return Array.from(this.activeTransfers.values());
    }

    getTransferHistory() {
        return this.transferHistory.slice(-100); // Last 100 transfers
    }

    getMetrics() {
        return { ...this.metrics };
    }

    getTabSessions() {
        return Array.from(this.activeTabs.values());
    }

    async getTabData(tabId, dataType = null) {
        const session = this.tabSessions.get(tabId);
        if (!session) return {};
        
        if (dataType) {
            return session.get(dataType) || {};
        }
        
        return Object.fromEntries(session);
    }

    async updateTabData(tabId, data, dataType = 'user') {
        if (!this.tabSessions.has(tabId)) {
            this.tabSessions.set(tabId, new Map());
        }
        
        const session = this.tabSessions.get(tabId);
        session.set(dataType, data);
        
        this.emit('tab-data-updated', { tabId, dataType, data });
    }

    // ========================================================================
    // FIELD MAPPING ALGORITHMS
    // ========================================================================

    /**
     * Advanced Field Mapping System for Cross-Tab Data Transfer
     * Intelligently maps fields between different data structures
     */
    
    async mapFieldsBetweenTabs(sourceData, targetSchema, options = {}) {
        console.log('🔗 Starting intelligent field mapping...');
        
        const sourceSchema = this.analyzeDataSchema(sourceData);
        const mappingResult = await this.generateFieldMapping(sourceSchema, targetSchema, options);
        
        // Apply the mapping to transform data
        const mappedData = this.applyFieldMapping(sourceData, mappingResult.fieldMappings);
        
        return {
            mappedData,
            mappingConfidence: mappingResult.confidence,
            mappingDetails: mappingResult.fieldMappings,
            unmappedFields: mappingResult.unmappedFields
        };
    }

    /**
     * Analyze data structure to create schema
     */
    analyzeDataSchema(data) {
        const schema = {
            fields: [],
            dataTypes: new Map(),
            structure: 'object'
        };

        if (Array.isArray(data)) {
            schema.structure = 'array';
            // Analyze first few items to determine field structure
            const sampleItems = data.slice(0, 5);
            const fieldMap = new Map();
            
            sampleItems.forEach(item => {
                if (typeof item === 'object') {
                    Object.keys(item).forEach(key => {
                        if (!fieldMap.has(key)) {
                            fieldMap.set(key, {
                                name: key,
                                type: typeof item[key],
                                frequency: 1,
                                examples: [item[key]]
                            });
                        } else {
                            const field = fieldMap.get(key);
                            field.frequency++;
                            field.examples.push(item[key]);
                        }
                    });
                }
            });
            
            schema.fields = Array.from(fieldMap.values());
        } else if (typeof data === 'object') {
            Object.keys(data).forEach(key => {
                schema.fields.push({
                    name: key,
                    type: this.determineFieldType(data[key]),
                    value: data[key],
                    required: data[key] !== null && data[key] !== undefined
                });
            });
        }

        return schema;
    }

    /**
     * Generate intelligent field mapping between schemas
     */
    async generateFieldMapping(sourceSchema, targetSchema, options = {}) {
        const mappings = [];
        const unmappedFields = [];
        
        // 1. Exact name matches (highest priority)
        const exactMappings = this.generateExactMapping(sourceSchema, targetSchema);
        mappings.push(...exactMappings);
        
        // 2. Fuzzy name matching
        const fuzzyMappings = this.generateFuzzyMapping(sourceSchema, targetSchema, exactMappings);
        mappings.push(...fuzzyMappings);
        
        // 3. Semantic mapping based on field types and patterns
        const semanticMappings = this.generateSemanticMapping(sourceSchema, targetSchema, [...exactMappings, ...fuzzyMappings]);
        mappings.push(...semanticMappings);
        
        // 4. Custom mapping rules from options
        if (options.customMappings) {
            const customMappings = this.applyCustomMappings(sourceSchema, targetSchema, options.customMappings);
            mappings.push(...customMappings);
        }
        
        // Find unmapped source fields
        const mappedSourceFields = new Set(mappings.map(m => m.source));
        sourceSchema.fields.forEach(field => {
            if (!mappedSourceFields.has(field.name)) {
                unmappedFields.push(field.name);
            }
        });
        
        const confidence = this.calculateMappingConfidence(mappings, sourceSchema, targetSchema);
        
        return {
            fieldMappings: mappings,
            confidence,
            unmappedFields,
            mappingStats: {
                exactMatches: exactMappings.length,
                fuzzyMatches: fuzzyMappings.length,
                semanticMatches: semanticMappings.length,
                totalMapped: mappings.length,
                totalSource: sourceSchema.fields.length
            }
        };
    }

    /**
     * Generate exact field name mappings
     */
    generateExactMapping(sourceSchema, targetSchema) {
        const mappings = [];
        
        sourceSchema.fields.forEach(sourceField => {
            const exactMatch = targetSchema.fields.find(
                targetField => targetField.name.toLowerCase() === sourceField.name.toLowerCase()
            );
            
            if (exactMatch) {
                mappings.push({
                    source: sourceField.name,
                    target: exactMatch.name,
                    confidence: 1.0,
                    method: 'exact',
                    transformation: this.getFieldTransformation(sourceField.type, exactMatch.type)
                });
            }
        });
        
        return mappings;
    }

    /**
     * Generate fuzzy field name mappings using similarity algorithms
     */
    generateFuzzyMapping(sourceSchema, targetSchema, existingMappings) {
        const mappings = [];
        const mappedTargets = new Set(existingMappings.map(m => m.target));
        
        sourceSchema.fields.forEach(sourceField => {
            // Skip if already mapped exactly
            if (existingMappings.some(m => m.source === sourceField.name)) {
                return;
            }
            
            let bestMatch = null;
            let bestScore = 0;
            
            targetSchema.fields.forEach(targetField => {
                // Skip if target already mapped
                if (mappedTargets.has(targetField.name)) {
                    return;
                }
                
                const similarity = this.calculateFieldSimilarity(sourceField, targetField);
                if (similarity > bestScore && similarity > 0.6) { // 60% threshold
                    bestScore = similarity;
                    bestMatch = targetField;
                }
            });
            
            if (bestMatch) {
                mappings.push({
                    source: sourceField.name,
                    target: bestMatch.name,
                    confidence: bestScore,
                    method: 'fuzzy',
                    transformation: this.getFieldTransformation(sourceField.type, bestMatch.type)
                });
                mappedTargets.add(bestMatch.name);
            }
        });
        
        return mappings;
    }

    /**
     * Generate semantic mappings based on field types and common patterns
     */
    generateSemanticMapping(sourceSchema, targetSchema, existingMappings) {
        const mappings = [];
        const mappedTargets = new Set(existingMappings.map(m => m.target));
        const mappedSources = new Set(existingMappings.map(m => m.source));
        
        // Common semantic patterns
        const semanticPatterns = {
            // Email patterns
            email: ['email', 'e-mail', 'emailaddress', 'mail', 'usermail'],
            // Name patterns
            name: ['name', 'fullname', 'username', 'displayname', 'title'],
            firstName: ['firstname', 'fname', 'givenname', 'forename'],
            lastName: ['lastname', 'lname', 'surname', 'familyname'],
            // Address patterns
            address: ['address', 'addr', 'location', 'street'],
            city: ['city', 'town', 'municipality'],
            state: ['state', 'province', 'region'],
            zipCode: ['zip', 'zipcode', 'postal', 'postcode'],
            // Phone patterns
            phone: ['phone', 'telephone', 'mobile', 'cell', 'contact'],
            // Date patterns
            date: ['date', 'datetime', 'timestamp', 'created', 'modified'],
            birthDate: ['birthdate', 'dob', 'birthday', 'born'],
            // ID patterns
            id: ['id', 'identifier', 'key', 'uuid', 'guid'],
            // Common form fields
            password: ['password', 'pwd', 'pass', 'secret'],
            confirm: ['confirm', 'confirmation', 'verify', 'repeat']
        };
        
        sourceSchema.fields.forEach(sourceField => {
            if (mappedSources.has(sourceField.name)) return;
            
            const sourcePattern = this.identifyFieldPattern(sourceField.name, semanticPatterns);
            if (!sourcePattern) return;
            
            targetSchema.fields.forEach(targetField => {
                if (mappedTargets.has(targetField.name)) return;
                
                const targetPattern = this.identifyFieldPattern(targetField.name, semanticPatterns);
                if (sourcePattern === targetPattern) {
                    mappings.push({
                        source: sourceField.name,
                        target: targetField.name,
                        confidence: 0.8,
                        method: 'semantic',
                        pattern: sourcePattern,
                        transformation: this.getFieldTransformation(sourceField.type, targetField.type)
                    });
                    mappedTargets.add(targetField.name);
                }
            });
        });
        
        return mappings;
    }

    /**
     * Calculate field similarity using multiple algorithms
     */
    calculateFieldSimilarity(sourceField, targetField) {
        const sourceName = sourceField.name.toLowerCase();
        const targetName = targetField.name.toLowerCase();
        
        // Exact match
        if (sourceName === targetName) return 1.0;
        
        // Levenshtein distance similarity
        const levenshteinSim = 1 - (this.levenshteinDistance(sourceName, targetName) / Math.max(sourceName.length, targetName.length));
        
        // Substring matching
        const substringScore = this.calculateSubstringScore(sourceName, targetName);
        
        // Type compatibility
        const typeCompatibility = this.calculateTypeCompatibility(sourceField.type, targetField.type);
        
        // Weighted average
        const similarity = (levenshteinSim * 0.4) + (substringScore * 0.3) + (typeCompatibility * 0.3);
        
        return Math.round(similarity * 100) / 100;
    }

    /**
     * Calculate Levenshtein distance between two strings
     */
    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    /**
     * Calculate substring and token matching score
     */
    calculateSubstringScore(str1, str2) {
        // Check for substring matches
        if (str1.includes(str2) || str2.includes(str1)) {
            return 0.8;
        }
        
        // Token-based matching
        const tokens1 = str1.split(/[_-\s]/);
        const tokens2 = str2.split(/[_-\s]/);
        
        let matchingTokens = 0;
        tokens1.forEach(token1 => {
            if (tokens2.some(token2 => token1 === token2 || token1.includes(token2) || token2.includes(token1))) {
                matchingTokens++;
            }
        });
        
        return matchingTokens / Math.max(tokens1.length, tokens2.length);
    }

    /**
     * Calculate type compatibility between field types
     */
    calculateTypeCompatibility(type1, type2) {
        if (type1 === type2) return 1.0;
        
        // Type compatibility matrix
        const compatibilityMatrix = {
            'string': ['text', 'varchar', 'char', 'email', 'url'],
            'number': ['int', 'integer', 'float', 'decimal', 'numeric'],
            'boolean': ['bool', 'bit', 'flag'],
            'date': ['datetime', 'timestamp', 'time'],
            'object': ['json', 'blob', 'text']
        };
        
        for (const [baseType, compatibleTypes] of Object.entries(compatibilityMatrix)) {
            if ((type1 === baseType && compatibleTypes.includes(type2)) ||
                (type2 === baseType && compatibleTypes.includes(type1))) {
                return 0.7;
            }
        }
        
        return 0.1; // Minimal compatibility for different types
    }

    /**
     * Identify field pattern from semantic patterns
     */
    identifyFieldPattern(fieldName, semanticPatterns) {
        const cleanName = fieldName.toLowerCase().replace(/[_-\s]/g, '');
        
        for (const [pattern, variations] of Object.entries(semanticPatterns)) {
            if (variations.some(variation => cleanName.includes(variation.replace(/[_-\s]/g, '')))) {
                return pattern;
            }
        }
        
        return null;
    }

    /**
     * Apply field mappings to transform data
     */
    applyFieldMapping(sourceData, fieldMappings) {
        if (Array.isArray(sourceData)) {
            return sourceData.map(item => this.transformObjectWithMappings(item, fieldMappings));
        } else if (typeof sourceData === 'object') {
            return this.transformObjectWithMappings(sourceData, fieldMappings);
        }
        
        return sourceData;
    }

    /**
     * Transform object using field mappings
     */
    transformObjectWithMappings(obj, fieldMappings) {
        const transformedObj = {};
        
        fieldMappings.forEach(mapping => {
            if (obj.hasOwnProperty(mapping.source)) {
                let value = obj[mapping.source];
                
                // Apply transformation if specified
                if (mapping.transformation) {
                    value = this.applyFieldTransformation(value, mapping.transformation);
                }
                
                transformedObj[mapping.target] = value;
            }
        });
        
        // Add unmapped fields if they don't conflict
        Object.keys(obj).forEach(key => {
            if (!fieldMappings.some(m => m.source === key) && !transformedObj.hasOwnProperty(key)) {
                transformedObj[key] = obj[key];
            }
        });
        
        return transformedObj;
    }

    /**
     * Get appropriate transformation for field type conversion
     */
    getFieldTransformation(sourceType, targetType) {
        if (sourceType === targetType) return null;
        
        const transformations = {
            'string->number': 'parseNumber',
            'number->string': 'toString',
            'string->boolean': 'parseBoolean',
            'boolean->string': 'booleanToString',
            'string->date': 'parseDate',
            'date->string': 'dateToString',
            'object->string': 'objectToJSON',
            'string->object': 'JSONToObject'
        };
        
        return transformations[`${sourceType}->${targetType}`] || null;
    }

    /**
     * Apply field transformation
     */
    applyFieldTransformation(value, transformation) {
        try {
            switch (transformation) {
                case 'parseNumber':
                    return isNaN(value) ? value : Number(value);
                case 'toString':
                    return String(value);
                case 'parseBoolean':
                    if (typeof value === 'string') {
                        return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
                    }
                    return Boolean(value);
                case 'booleanToString':
                    return value ? 'true' : 'false';
                case 'parseDate':
                    return new Date(value);
                case 'dateToString':
                    return value instanceof Date ? value.toISOString() : String(value);
                case 'objectToJSON':
                    return JSON.stringify(value);
                case 'JSONToObject':
                    return typeof value === 'string' ? JSON.parse(value) : value;
                default:
                    return value;
            }
        } catch (error) {
            console.warn(`Field transformation failed: ${transformation}`, error);
            return value;
        }
    }

    /**
     * Calculate overall mapping confidence
     */
    calculateMappingConfidence(mappings, sourceSchema, targetSchema) {
        if (mappings.length === 0) return 0;
        
        const totalConfidence = mappings.reduce((sum, mapping) => sum + mapping.confidence, 0);
        const averageConfidence = totalConfidence / mappings.length;
        
        // Adjust for coverage
        const coverage = mappings.length / sourceSchema.fields.length;
        const adjustedConfidence = averageConfidence * coverage;
        
        return Math.round(adjustedConfidence * 100) / 100;
    }

    /**
     * Determine field type from value
     */
    determineFieldType(value) {
        if (value === null || value === undefined) return 'unknown';
        if (typeof value === 'string') {
            // Check for date patterns
            if (/^\d{4}-\d{2}-\d{2}/.test(value)) return 'date';
            // Check for email patterns
            if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'email';
            // Check for URL patterns
            if (/^https?:\/\//.test(value)) return 'url';
            return 'string';
        }
        if (typeof value === 'number') return 'number';
        if (typeof value === 'boolean') return 'boolean';
        if (value instanceof Date) return 'date';
        if (Array.isArray(value)) return 'array';
        if (typeof value === 'object') return 'object';
        return 'unknown';
    }

    /**
     * Apply custom mapping rules
     */
    applyCustomMappings(sourceSchema, targetSchema, customMappings) {
        const mappings = [];
        
        customMappings.forEach(customMapping => {
            const sourceField = sourceSchema.fields.find(f => f.name === customMapping.source);
            const targetField = targetSchema.fields.find(f => f.name === customMapping.target);
            
            if (sourceField && targetField) {
                mappings.push({
                    source: customMapping.source,
                    target: customMapping.target,
                    confidence: customMapping.confidence || 1.0,
                    method: 'custom',
                    transformation: customMapping.transformation || this.getFieldTransformation(sourceField.type, targetField.type)
                });
            }
        });
        
        return mappings;
    }

    // Enhanced data transformation with field mapping
    async applyDataTransformation(data, transformOptions) {
        if (transformOptions.fieldMapping) {
            const mappingResult = await this.mapFieldsBetweenTabs(
                data, 
                transformOptions.targetSchema, 
                transformOptions.mappingOptions
            );
            return mappingResult.mappedData;
        }
        
        return data;
    }

    // ========================================================================
    // END FIELD MAPPING ALGORITHMS
    // ========================================================================

    // Cleanup and shutdown
    async shutdown() {
        console.log('🔄 Shutting down Cross-Tab Data Transfer System...');
        
        // Cancel active transfers
        for (const transfer of this.activeTransfers.values()) {
            transfer.status = 'cancelled';
        }
        
        // Clear all sessions
        this.activeTabs.clear();
        this.tabSessions.clear();
        this.dataChannels.clear();
        
        console.log('✅ Cross-Tab Data Transfer System shutdown complete');
    }
}

module.exports = CrossTabDataTransfer;