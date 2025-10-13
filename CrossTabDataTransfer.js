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
        
        // Start background sync if enabled
        if (this.config.enableRealTimeSync) {
            this.startBackgroundSync();
        }
        
        console.log('✅ Cross-Tab Data Transfer System initialized');
    }

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
        
        try {
            // Validate transfer request
            this.validateTransferRequest(sourceTabId, targetTabId, data, options);
            
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
                metadata: {
                    dataType: options.dataType || 'generic',
                    originalSize: this.calculateDataSize(data),
                    compressed: false,
                    encrypted: false
                }
            };
            
            this.activeTransfers.set(transferId, transfer);
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
            
            // Update metrics
            this.updateTransferMetrics(transfer);
            
            // Move to history
            this.transferHistory.push(transfer);
            this.activeTransfers.delete(transferId);
            
            this.emit('transfer-completed', transfer);
            console.log(`✅ Data transfer completed: ${transferId} (${transfer.duration}ms)`);
            
            return {
                success: true,
                transferId,
                duration: transfer.duration,
                result
            };
            
        } catch (error) {
            console.error(`❌ Data transfer failed: ${transferId}`, error);
            
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
            validate: (data) => Array.isArray(data)
        });
        
        // Settings data
        this.dataTypes.set('settings', {
            serialize: (data) => data,
            deserialize: (data) => data,
            validate: (data) => typeof data === 'object'
        });
        
        // Custom user data
        this.dataTypes.set('user', {
            serialize: (data) => data,
            deserialize: (data) => data,
            validate: (data) => typeof data === 'object'
        });
    }

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