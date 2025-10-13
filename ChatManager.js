/**
 * ChatManager - Comprehensive Chat Interface Backend
 * Handles messages, persistence, real-time communication, and AI integration
 */

const EventEmitter = require('events');
const { Level } = require('level');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const { Server } = require('socket.io');
const http = require('http');

class ChatManager extends EventEmitter {
  constructor(mainWindow, options = {}) {
    super();
    
    this.mainWindow = mainWindow;
    this.port = options.port || 3080;
    this.dbPath = options.dbPath || path.join(__dirname, 'data', 'chat.db');
    
    // Initialize Express app and HTTP server
    this.app = express();
    this.server = http.createServer(this.app);
    
    // Initialize Socket.IO
    this.io = new Server(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    
    // Chat state
    this.rooms = new Map();
    this.users = new Map();
    this.activeConnections = new Map();
    this.messageQueue = [];
    
    // AI integration
    this.aiEnabled = true;
    this.aiResponseDelay = 1000;
    
    this.initializeDatabase();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.setupEventHandlers();
  }

  async initializeDatabase() {
    try {
      // Initialize Level database for chat persistence
      this.db = new Level(this.dbPath, { valueEncoding: 'json' });
      
      // Create sub-databases for different data types
      this.messagesDB = this.db.sublevel('messages');
      this.roomsDB = this.db.sublevel('rooms');
      this.usersDB = this.db.sublevel('users');
      this.sessionsDB = this.db.sublevel('sessions');
      
      console.log('✅ Chat database initialized');
      this.emit('database-ready');
    } catch (error) {
      console.error('❌ Failed to initialize chat database:', error);
      this.emit('database-error', error);
    }
  }

  setupMiddleware() {
    // CORS middleware
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`[Chat API] ${new Date().toISOString()} - ${req.method} ${req.url}`);
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        uptime: process.uptime(),
        rooms: this.rooms.size,
        activeUsers: this.users.size,
        connections: this.activeConnections.size
      });
    });

    // Send message
    this.app.post('/api/chat/send', async (req, res) => {
      try {
        const { roomId, userId, message, type = 'text', metadata = {} } = req.body;
        
        if (!roomId || !userId || !message) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        const chatMessage = await this.sendMessage(roomId, userId, message, type, metadata);
        res.json({ success: true, message: chatMessage });
      } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Get chat history
    this.app.get('/api/chat/history/:roomId', async (req, res) => {
      try {
        const { roomId } = req.params;
        const { limit = 50, offset = 0 } = req.query;
        
        const history = await this.getChatHistory(roomId, parseInt(limit), parseInt(offset));
        res.json({ success: true, history });
      } catch (error) {
        console.error('Error getting chat history:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Create or join room
    this.app.post('/api/chat/room', async (req, res) => {
      try {
        const { roomId, userId, roomName, isPrivate = false } = req.body;
        
        const room = await this.createOrJoinRoom(roomId, userId, roomName, isPrivate);
        res.json({ success: true, room });
      } catch (error) {
        console.error('Error creating/joining room:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Get active rooms
    this.app.get('/api/chat/rooms', async (req, res) => {
      try {
        const rooms = await this.getActiveRooms();
        res.json({ success: true, rooms });
      } catch (error) {
        console.error('Error getting rooms:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Search messages
    this.app.get('/api/chat/search', async (req, res) => {
      try {
        const { query, roomId, limit = 20 } = req.query;
        
        if (!query) {
          return res.status(400).json({ error: 'Search query required' });
        }

        const results = await this.searchMessages(query, roomId, parseInt(limit));
        res.json({ success: true, results });
      } catch (error) {
        console.error('Error searching messages:', error);
        res.status(500).json({ error: error.message });
      }
    });
  }

  setupWebSocket() {
    this.io.on('connection', (socket) => {
      console.log(`[Chat WebSocket] User connected: ${socket.id}`);

      // Handle user authentication
      socket.on('authenticate', async (data) => {
        try {
          const { userId, userInfo } = data;
          
          // Store user information
          this.users.set(userId, {
            socketId: socket.id,
            userInfo,
            joinedAt: new Date(),
            lastActivity: new Date()
          });
          
          this.activeConnections.set(socket.id, userId);
          
          // Save user session
          await this.usersDB.put(userId, {
            ...userInfo,
            lastSeen: new Date().toISOString(),
            socketId: socket.id
          });

          socket.emit('authenticated', { success: true, userId });
          
          // Notify other users
          socket.broadcast.emit('user-online', { userId, userInfo });
          
          console.log(`[Chat] User authenticated: ${userId}`);
        } catch (error) {
          console.error('Authentication error:', error);
          socket.emit('auth-error', { error: error.message });
        }
      });

      // Handle joining rooms
      socket.on('join-room', async (data) => {
        try {
          const { roomId, userId } = data;
          
          await socket.join(roomId);
          
          // Update room membership
          if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, {
              id: roomId,
              members: new Set(),
              createdAt: new Date(),
              lastActivity: new Date()
            });
          }
          
          const room = this.rooms.get(roomId);
          room.members.add(userId);
          room.lastActivity = new Date();
          
          // Save room to database
          await this.roomsDB.put(roomId, {
            id: roomId,
            members: Array.from(room.members),
            createdAt: room.createdAt.toISOString(),
            lastActivity: room.lastActivity.toISOString()
          });

          socket.emit('room-joined', { roomId, success: true });
          socket.to(roomId).emit('user-joined-room', { roomId, userId });
          
          console.log(`[Chat] User ${userId} joined room ${roomId}`);
        } catch (error) {
          console.error('Error joining room:', error);
          socket.emit('room-error', { error: error.message });
        }
      });

      // Handle sending messages via WebSocket
      socket.on('send-message', async (data) => {
        try {
          const { roomId, userId, message, type = 'text', metadata = {} } = data;
          
          const chatMessage = await this.sendMessage(roomId, userId, message, type, metadata);
          
          // Emit to room members
          this.io.to(roomId).emit('new-message', chatMessage);
          
          // Trigger AI response if enabled
          if (this.aiEnabled && this.shouldTriggerAI(message, roomId)) {
            setTimeout(() => {
              this.generateAIResponse(roomId, message, chatMessage);
            }, this.aiResponseDelay);
          }
          
        } catch (error) {
          console.error('Error sending WebSocket message:', error);
          socket.emit('message-error', { error: error.message });
        }
      });

      // Handle typing indicators
      socket.on('typing-start', (data) => {
        const { roomId, userId } = data;
        socket.to(roomId).emit('user-typing', { userId, typing: true });
      });

      socket.on('typing-stop', (data) => {
        const { roomId, userId } = data;
        socket.to(roomId).emit('user-typing', { userId, typing: false });
      });

      // Handle disconnection
      socket.on('disconnect', async () => {
        try {
          const userId = this.activeConnections.get(socket.id);
          
          if (userId) {
            // Update user status
            const user = this.users.get(userId);
            if (user) {
              user.lastActivity = new Date();
              await this.usersDB.put(userId, {
                ...user.userInfo,
                lastSeen: new Date().toISOString(),
                status: 'offline'
              });
            }
            
            // Clean up
            this.users.delete(userId);
            this.activeConnections.delete(socket.id);
            
            // Notify other users
            socket.broadcast.emit('user-offline', { userId });
            
            console.log(`[Chat] User disconnected: ${userId}`);
          }
        } catch (error) {
          console.error('Error handling disconnect:', error);
        }
      });
    });
  }

  setupEventHandlers() {
    // Handle messages from main process
    this.on('main-message', async (data) => {
      try {
        const { roomId, message, type = 'system' } = data;
        
        const chatMessage = await this.sendMessage(roomId, 'system', message, type, {
          source: 'main-process',
          timestamp: new Date().toISOString()
        });
        
        this.io.to(roomId).emit('new-message', chatMessage);
      } catch (error) {
        console.error('Error handling main message:', error);
      }
    });

    // Handle AI responses
    this.on('ai-response', async (data) => {
      try {
        const { roomId, response, originalMessage } = data;
        
        const chatMessage = await this.sendMessage(roomId, 'ai-assistant', response, 'ai', {
          inResponseTo: originalMessage.id,
          model: 'claude-3-sonnet',
          timestamp: new Date().toISOString()
        });
        
        this.io.to(roomId).emit('new-message', chatMessage);
      } catch (error) {
        console.error('Error handling AI response:', error);
      }
    });
  }

  async sendMessage(roomId, userId, content, type = 'text', metadata = {}) {
    const messageId = this.generateId();
    const timestamp = new Date();
    
    const message = {
      id: messageId,
      roomId,
      userId,
      content,
      type,
      metadata,
      timestamp: timestamp.toISOString(),
      edited: false,
      deleted: false
    };

    // Save message to database
    await this.messagesDB.put(messageId, message);
    
    // Update room activity
    if (this.rooms.has(roomId)) {
      const room = this.rooms.get(roomId);
      room.lastActivity = timestamp;
    }

    this.emit('message-sent', message);
    return message;
  }

  async getChatHistory(roomId, limit = 50, offset = 0) {
    const messages = [];
    
    try {
      // Get messages for the room from database
      for await (const [key, value] of this.messagesDB.iterator({
        reverse: true,
        limit: limit + offset
      })) {
        if (value.roomId === roomId && !value.deleted) {
          messages.push(value);
        }
        
        if (messages.length >= limit + offset) break;
      }
      
      return messages.slice(offset);
    } catch (error) {
      console.error('Error getting chat history:', error);
      return [];
    }
  }

  async createOrJoinRoom(roomId, userId, roomName, isPrivate = false) {
    let room;
    
    if (this.rooms.has(roomId)) {
      room = this.rooms.get(roomId);
    } else {
      room = {
        id: roomId,
        name: roomName || roomId,
        members: new Set(),
        isPrivate,
        createdAt: new Date(),
        lastActivity: new Date()
      };
      
      this.rooms.set(roomId, room);
    }
    
    room.members.add(userId);
    
    // Save to database
    await this.roomsDB.put(roomId, {
      id: roomId,
      name: room.name,
      members: Array.from(room.members),
      isPrivate,
      createdAt: room.createdAt.toISOString(),
      lastActivity: room.lastActivity.toISOString()
    });

    return {
      id: room.id,
      name: room.name,
      members: Array.from(room.members),
      isPrivate: room.isPrivate,
      memberCount: room.members.size
    };
  }

  async getActiveRooms() {
    const rooms = [];
    
    for (const [roomId, room] of this.rooms) {
      rooms.push({
        id: room.id,
        name: room.name || roomId,
        memberCount: room.members.size,
        lastActivity: room.lastActivity.toISOString(),
        isPrivate: room.isPrivate || false
      });
    }
    
    return rooms;
  }

  async searchMessages(query, roomId = null, limit = 20) {
    const results = [];
    const searchTerm = query.toLowerCase();
    
    try {
      for await (const [key, value] of this.messagesDB.iterator({ reverse: true })) {
        if (value.deleted) continue;
        if (roomId && value.roomId !== roomId) continue;
        
        if (value.content.toLowerCase().includes(searchTerm)) {
          results.push(value);
          
          if (results.length >= limit) break;
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error searching messages:', error);
      return [];
    }
  }

  shouldTriggerAI(message, roomId) {
    // Trigger AI for questions or mentions
    const triggers = ['?', '@ai', '@assistant', 'help'];
    return triggers.some(trigger => message.toLowerCase().includes(trigger));
  }

  async generateAIResponse(roomId, originalMessage, messageObj) {
    try {
      // Request AI response from main process
      if (this.mainWindow && this.mainWindow.webContents) {
        this.mainWindow.webContents.send('chat-ai-request', {
          roomId,
          message: originalMessage,
          messageId: messageObj.id,
          context: await this.getChatHistory(roomId, 10) // Get recent context
        });
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
    }
  }

  generateId() {
    return crypto.randomBytes(16).toString('hex');
  }

  async start() {
    return new Promise((resolve, reject) => {
      this.server.listen(this.port, (err) => {
        if (err) {
          console.error(`❌ Failed to start chat server: ${err}`);
          reject(err);
        } else {
          console.log(`🚀 Chat server running on http://localhost:${this.port}`);
          console.log(`📡 WebSocket server ready for real-time chat`);
          console.log(`💾 Chat persistence enabled`);
          resolve();
        }
      });
    });
  }

  async stop() {
    if (this.server) {
      this.server.close();
      console.log('Chat server stopped');
    }
    
    if (this.db) {
      await this.db.close();
      console.log('Chat database closed');
    }
  }

  // Get statistics for monitoring
  getStats() {
    return {
      activeRooms: this.rooms.size,
      activeUsers: this.users.size,
      activeConnections: this.activeConnections.size,
      uptime: process.uptime(),
      messagesInQueue: this.messageQueue.length
    };
  }

  // Clean up old data periodically
  async cleanup(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    let deletedCount = 0;
    
    try {
      for await (const [key, value] of this.messagesDB.iterator()) {
        const messageDate = new Date(value.timestamp);
        if (messageDate < cutoffDate) {
          await this.messagesDB.del(key);
          deletedCount++;
        }
      }
      
      console.log(`🧹 Cleaned up ${deletedCount} old messages`);
      return deletedCount;
    } catch (error) {
      console.error('Error during cleanup:', error);
      return 0;
    }
  }
}

module.exports = ChatManager;