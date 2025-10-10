/**
 * PersistentStorage - LevelDB-based storage system for MIC Browser Ultimate
 * Handles bookmarks, history, settings, command history, AI context, and more
 */

const { Level } = require('level');
const path = require('path');
const { app } = require('electron');

class PersistentStorage {
    constructor() {
        // Initialize database path in user data directory
        this.dbPath = path.join(app.getPath('userData'), 'mic-browser-data');
        this.db = null;
        this.isInitialized = false;
        
        // Database collections (prefixes)
        this.collections = {
            settings: 'settings:',
            bookmarks: 'bookmarks:',
            history: 'history:',
            commands: 'commands:',
            aiContext: 'ai:',
            workflows: 'workflows:',
            macros: 'macros:',
            tabs: 'tabs:',
            profiles: 'profiles:',
            extensions: 'extensions:',
            analytics: 'analytics:',
            cache: 'cache:'
        };
    }

    /**
     * Initialize the database
     */
    async initialize() {
        try {
            this.db = new Level(this.dbPath, { 
                valueEncoding: 'json',
                createIfMissing: true,
                errorIfExists: false
            });
            
            await this.db.open();
            this.isInitialized = true;
            
            console.log('✅ PersistentStorage initialized at:', this.dbPath);
            
            // Initialize default data if needed
            await this.initializeDefaults();
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize PersistentStorage:', error);
            throw error;
        }
    }

    /**
     * Initialize default data structure
     */
    async initializeDefaults() {
        try {
            // Check if this is first run
            const version = await this.getSetting('version', null);
            if (!version) {
                await this.setSetting('version', '1.0.0');
                await this.setSetting('firstRun', new Date().toISOString());
                await this.setSetting('installId', this.generateId());
                
                // Create default bookmarks
                await this.addBookmark('https://google.com', 'Google', 'search');
                await this.addBookmark('https://github.com', 'GitHub', 'development');
                
                console.log('🎉 First run setup completed');
            }
        } catch (error) {
            console.error('Error initializing defaults:', error);
        }
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Settings Management
     */
    async getSetting(key, defaultValue = null) {
        try {
            const value = await this.db.get(this.collections.settings + key);
            return value;
        } catch (error) {
            if (error.code === 'LEVEL_NOT_FOUND') {
                return defaultValue;
            }
            throw error;
        }
    }

    async setSetting(key, value) {
        return await this.db.put(this.collections.settings + key, value);
    }

    async deleteSetting(key) {
        try {
            return await this.db.del(this.collections.settings + key);
        } catch (error) {
            if (error.code !== 'LEVEL_NOT_FOUND') {
                throw error;
            }
        }
    }

    async getAllSettings() {
        const settings = {};
        const stream = this.db.iterator({
            gte: this.collections.settings,
            lt: this.collections.settings + '\xff'
        });
        
        for await (const [key, value] of stream) {
            const settingKey = key.replace(this.collections.settings, '');
            settings[settingKey] = value;
        }
        
        return settings;
    }

    /**
     * Bookmarks Management
     */
    async addBookmark(url, title, folder = 'default', tags = []) {
        const bookmark = {
            id: this.generateId(),
            url,
            title,
            folder,
            tags,
            dateAdded: new Date().toISOString(),
            dateModified: new Date().toISOString(),
            visitCount: 0,
            favicon: null
        };
        
        await this.db.put(this.collections.bookmarks + bookmark.id, bookmark);
        return bookmark;
    }

    async getBookmark(id) {
        try {
            return await this.db.get(this.collections.bookmarks + id);
        } catch (error) {
            if (error.code === 'LEVEL_NOT_FOUND') {
                return null;
            }
            throw error;
        }
    }

    async updateBookmark(id, updates) {
        const bookmark = await this.getBookmark(id);
        if (!bookmark) {
            throw new Error(`Bookmark not found: ${id}`);
        }
        
        const updatedBookmark = {
            ...bookmark,
            ...updates,
            dateModified: new Date().toISOString()
        };
        
        await this.db.put(this.collections.bookmarks + id, updatedBookmark);
        return updatedBookmark;
    }

    async deleteBookmark(id) {
        return await this.db.del(this.collections.bookmarks + id);
    }

    async getAllBookmarks(folder = null) {
        const bookmarks = [];
        const stream = this.db.iterator({
            gte: this.collections.bookmarks,
            lt: this.collections.bookmarks + '\xff'
        });
        
        for await (const [key, value] of stream) {
            if (!folder || value.folder === folder) {
                bookmarks.push(value);
            }
        }
        
        return bookmarks.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
    }

    async searchBookmarks(query) {
        const bookmarks = await this.getAllBookmarks();
        const lowerQuery = query.toLowerCase();
        
        return bookmarks.filter(bookmark => 
            bookmark.title.toLowerCase().includes(lowerQuery) ||
            bookmark.url.toLowerCase().includes(lowerQuery) ||
            bookmark.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
    }

    /**
     * History Management
     */
    async addHistory(url, title, visitTime = null) {
        const historyEntry = {
            id: this.generateId(),
            url,
            title,
            visitTime: visitTime || new Date().toISOString(),
            visitCount: 1,
            domain: new URL(url).hostname,
            favicon: null
        };
        
        // Check if URL already exists in recent history
        const existing = await this.findHistoryByUrl(url, 24); // Last 24 hours
        if (existing) {
            return await this.updateHistory(existing.id, {
                visitCount: existing.visitCount + 1,
                visitTime: historyEntry.visitTime,
                title: title || existing.title
            });
        }
        
        await this.db.put(this.collections.history + historyEntry.id, historyEntry);
        return historyEntry;
    }

    async findHistoryByUrl(url, hoursBack = 24) {
        const cutoff = new Date(Date.now() - (hoursBack * 60 * 60 * 1000)).toISOString();
        const stream = this.db.iterator({
            gte: this.collections.history,
            lt: this.collections.history + '\xff'
        });
        
        for await (const [key, value] of stream) {
            if (value.url === url && value.visitTime > cutoff) {
                return value;
            }
        }
        
        return null;
    }

    async updateHistory(id, updates) {
        const entry = await this.db.get(this.collections.history + id);
        const updatedEntry = { ...entry, ...updates };
        
        await this.db.put(this.collections.history + id, updatedEntry);
        return updatedEntry;
    }

    async getHistory(days = 7, limit = 100) {
        const cutoff = new Date(Date.now() - (days * 24 * 60 * 60 * 1000)).toISOString();
        const history = [];
        
        const stream = this.db.iterator({
            gte: this.collections.history,
            lt: this.collections.history + '\xff',
            reverse: true,
            limit: limit * 2 // Get more to filter by date
        });
        
        for await (const [key, value] of stream) {
            if (value.visitTime > cutoff) {
                history.push(value);
                if (history.length >= limit) break;
            }
        }
        
        return history;
    }

    async clearHistory(days = null) {
        if (days === null) {
            // Clear all history
            const stream = this.db.iterator({
                gte: this.collections.history,
                lt: this.collections.history + '\xff',
                keys: true,
                values: false
            });
            
            const batch = this.db.batch();
            for await (const [key] of stream) {
                batch.del(key);
            }
            
            return await batch.write();
        } else {
            // Clear history older than specified days
            const cutoff = new Date(Date.now() - (days * 24 * 60 * 60 * 1000)).toISOString();
            const stream = this.db.iterator({
                gte: this.collections.history,
                lt: this.collections.history + '\xff'
            });
            
            const batch = this.db.batch();
            for await (const [key, value] of stream) {
                if (value.visitTime < cutoff) {
                    batch.del(key);
                }
            }
            
            return await batch.write();
        }
    }

    /**
     * Command History Management
     */
    async addCommandHistory(command, result, executionTime) {
        const commandEntry = {
            id: this.generateId(),
            command,
            result: result.success ? 'success' : 'error',
            error: result.error || null,
            executionTime,
            timestamp: new Date().toISOString()
        };
        
        await this.db.put(this.collections.commands + commandEntry.id, commandEntry);
        
        // Keep only last 1000 commands
        await this.cleanupCommandHistory();
        
        return commandEntry;
    }

    async getCommandHistory(limit = 50) {
        const commands = [];
        const stream = this.db.iterator({
            gte: this.collections.commands,
            lt: this.collections.commands + '\xff',
            reverse: true,
            limit
        });
        
        for await (const [key, value] of stream) {
            commands.push(value);
        }
        
        return commands;
    }

    async cleanupCommandHistory() {
        const commands = await this.getCommandHistory(1000);
        if (commands.length < 1000) return;
        
        // Delete oldest commands beyond 1000
        const stream = this.db.iterator({
            gte: this.collections.commands,
            lt: this.collections.commands + '\xff',
            reverse: false
        });
        
        const batch = this.db.batch();
        let count = 0;
        
        for await (const [key] of stream) {
            count++;
            if (count <= commands.length - 1000) {
                batch.del(key);
            } else {
                break;
            }
        }
        
        if (batch.length > 0) {
            await batch.write();
        }
    }

    /**
     * AI Context Management
     */
    async saveAIContext(sessionId, context) {
        const contextEntry = {
            id: sessionId,
            context,
            timestamp: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        };
        
        await this.db.put(this.collections.aiContext + sessionId, contextEntry);
        return contextEntry;
    }

    async getAIContext(sessionId) {
        try {
            const entry = await this.db.get(this.collections.aiContext + sessionId);
            
            // Check if expired
            if (new Date(entry.expiresAt) < new Date()) {
                await this.db.del(this.collections.aiContext + sessionId);
                return null;
            }
            
            return entry.context;
        } catch (error) {
            if (error.code === 'LEVEL_NOT_FOUND') {
                return null;
            }
            throw error;
        }
    }

    async clearExpiredAIContext() {
        const stream = this.db.iterator({
            gte: this.collections.aiContext,
            lt: this.collections.aiContext + '\xff'
        });
        
        const batch = this.db.batch();
        const now = new Date();
        
        for await (const [key, value] of stream) {
            if (new Date(value.expiresAt) < now) {
                batch.del(key);
            }
        }
        
        if (batch.length > 0) {
            await batch.write();
        }
    }

    /**
     * Workflow & Macro Management
     */
    async saveWorkflow(name, workflow) {
        const workflowEntry = {
            id: this.generateId(),
            name,
            workflow,
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            executionCount: 0
        };
        
        await this.db.put(this.collections.workflows + workflowEntry.id, workflowEntry);
        return workflowEntry;
    }

    async getWorkflow(id) {
        try {
            return await this.db.get(this.collections.workflows + id);
        } catch (error) {
            if (error.code === 'LEVEL_NOT_FOUND') {
                return null;
            }
            throw error;
        }
    }

    async getAllWorkflows() {
        const workflows = [];
        const stream = this.db.iterator({
            gte: this.collections.workflows,
            lt: this.collections.workflows + '\xff'
        });
        
        for await (const [key, value] of stream) {
            workflows.push(value);
        }
        
        return workflows.sort((a, b) => new Date(b.modified) - new Date(a.modified));
    }

    /**
     * Tab State Management
     */
    async saveTabState(sessionId, tabs) {
        const tabState = {
            sessionId,
            tabs,
            timestamp: new Date().toISOString()
        };
        
        await this.db.put(this.collections.tabs + sessionId, tabState);
        return tabState;
    }

    async getTabState(sessionId) {
        try {
            return await this.db.get(this.collections.tabs + sessionId);
        } catch (error) {
            if (error.code === 'LEVEL_NOT_FOUND') {
                return null;
            }
            throw error;
        }
    }

    /**
     * Analytics & Metrics
     */
    async recordMetric(metric, value, metadata = {}) {
        const metricEntry = {
            id: this.generateId(),
            metric,
            value,
            metadata,
            timestamp: new Date().toISOString(),
            date: new Date().toISOString().split('T')[0] // YYYY-MM-DD
        };
        
        await this.db.put(this.collections.analytics + metricEntry.id, metricEntry);
        return metricEntry;
    }

    async getMetrics(metric, days = 7) {
        const cutoff = new Date(Date.now() - (days * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
        const metrics = [];
        
        const stream = this.db.iterator({
            gte: this.collections.analytics,
            lt: this.collections.analytics + '\xff'
        });
        
        for await (const [key, value] of stream) {
            if (value.metric === metric && value.date >= cutoff) {
                metrics.push(value);
            }
        }
        
        return metrics.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    /**
     * Cache Management
     */
    async setCache(key, value, ttl = 3600) { // Default 1 hour TTL
        const cacheEntry = {
            value,
            expiresAt: new Date(Date.now() + (ttl * 1000)).toISOString()
        };
        
        await this.db.put(this.collections.cache + key, cacheEntry);
        return cacheEntry;
    }

    async getCache(key) {
        try {
            const entry = await this.db.get(this.collections.cache + key);
            
            // Check if expired
            if (new Date(entry.expiresAt) < new Date()) {
                await this.db.del(this.collections.cache + key);
                return null;
            }
            
            return entry.value;
        } catch (error) {
            if (error.code === 'LEVEL_NOT_FOUND') {
                return null;
            }
            throw error;
        }
    }

    async clearCache() {
        const stream = this.db.iterator({
            gte: this.collections.cache,
            lt: this.collections.cache + '\xff',
            keys: true,
            values: false
        });
        
        const batch = this.db.batch();
        for await (const [key] of stream) {
            batch.del(key);
        }
        
        return await batch.write();
    }

    /**
     * Database Maintenance
     */
    async compact() {
        // LevelDB automatically compacts, but we can trigger cleanup
        await this.clearExpiredAIContext();
        await this.cleanupCommandHistory();
        
        // Clear expired cache
        const stream = this.db.iterator({
            gte: this.collections.cache,
            lt: this.collections.cache + '\xff'
        });
        
        const batch = this.db.batch();
        const now = new Date();
        
        for await (const [key, value] of stream) {
            if (new Date(value.expiresAt) < now) {
                batch.del(key);
            }
        }
        
        if (batch.length > 0) {
            await batch.write();
        }
        
        console.log('🧹 Database maintenance completed');
    }

    async getStats() {
        const stats = {
            bookmarks: 0,
            history: 0,
            commands: 0,
            workflows: 0,
            cache: 0
        };
        
        for (const [collection, prefix] of Object.entries(this.collections)) {
            if (collection === 'analytics') continue;
            
            const stream = this.db.iterator({
                gte: prefix,
                lt: prefix + '\xff',
                keys: true,
                values: false
            });
            
            let count = 0;
            for await (const [key] of stream) {
                count++;
            }
            
            if (collection in stats) {
                stats[collection] = count;
            }
        }
        
        return stats;
    }

    /**
     * Import/Export
     */
    async exportData() {
        const data = {};
        
        for (const [collection, prefix] of Object.entries(this.collections)) {
            data[collection] = [];
            
            const stream = this.db.iterator({
                gte: prefix,
                lt: prefix + '\xff'
            });
            
            for await (const [key, value] of stream) {
                data[collection].push(value);
            }
        }
        
        return {
            version: '1.0.0',
            exportDate: new Date().toISOString(),
            data
        };
    }

    async importData(importData) {
        const batch = this.db.batch();
        
        for (const [collection, items] of Object.entries(importData.data)) {
            const prefix = this.collections[collection];
            if (!prefix) continue;
            
            for (const item of items) {
                const key = prefix + (item.id || this.generateId());
                batch.put(key, item);
            }
        }
        
        await batch.write();
        console.log('📥 Data import completed');
    }

    /**
     * Close database
     */
    async close() {
        if (this.db) {
            await this.db.close();
            this.isInitialized = false;
            console.log('📄 PersistentStorage closed');
        }
    }
}

module.exports = PersistentStorage;