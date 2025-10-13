/**
 * Chat API Routes - RESTful endpoints for chat functionality
 * Handles HTTP requests for chat operations
 */

const express = require('express');
const router = express.Router();

class ChatRoutes {
  constructor(chatManager) {
    this.chatManager = chatManager;
    this.setupRoutes();
  }

  setupRoutes() {
    // Health check endpoint
    router.get('/health', (req, res) => {
      const stats = this.chatManager.getStats();
      res.json({
        status: 'healthy',
        service: 'chat-api',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        ...stats
      });
    });

    // Send a message
    router.post('/messages', async (req, res) => {
      try {
        const { roomId, userId, content, type = 'text', metadata = {} } = req.body;
        
        // Validation
        if (!roomId || !userId || !content) {
          return res.status(400).json({
            error: 'Missing required fields',
            required: ['roomId', 'userId', 'content']
          });
        }

        // Send message
        const message = await this.chatManager.sendMessage(roomId, userId, content, type, metadata);
        
        res.status(201).json({
          success: true,
          data: message,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({
          error: 'Failed to send message',
          details: error.message
        });
      }
    });

    // Get messages for a room (with pagination)
    router.get('/rooms/:roomId/messages', async (req, res) => {
      try {
        const { roomId } = req.params;
        const { 
          limit = 50, 
          offset = 0, 
          before, // Get messages before this timestamp
          after,  // Get messages after this timestamp
          search  // Search query
        } = req.query;

        let messages;
        
        if (search) {
          messages = await this.chatManager.searchMessages(search, roomId, parseInt(limit));
        } else {
          messages = await this.chatManager.getChatHistory(
            roomId, 
            parseInt(limit), 
            parseInt(offset)
          );
        }

        // Filter by timestamp if specified
        if (before) {
          const beforeDate = new Date(before);
          messages = messages.filter(msg => new Date(msg.timestamp) < beforeDate);
        }
        
        if (after) {
          const afterDate = new Date(after);
          messages = messages.filter(msg => new Date(msg.timestamp) > afterDate);
        }

        res.json({
          success: true,
          data: messages,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            total: messages.length,
            hasMore: messages.length === parseInt(limit)
          },
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Error getting messages:', error);
        res.status(500).json({
          error: 'Failed to get messages',
          details: error.message
        });
      }
    });

    // Create a new chat room
    router.post('/rooms', async (req, res) => {
      try {
        const { 
          roomId, 
          userId, 
          name, 
          description = '', 
          isPrivate = false,
          maxMembers = 100
        } = req.body;

        if (!roomId || !userId) {
          return res.status(400).json({
            error: 'Missing required fields',
            required: ['roomId', 'userId']
          });
        }

        const room = await this.chatManager.createOrJoinRoom(
          roomId, 
          userId, 
          name, 
          isPrivate
        );

        // Add additional room metadata
        room.description = description;
        room.maxMembers = maxMembers;
        room.createdBy = userId;

        res.status(201).json({
          success: true,
          data: room,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Error creating room:', error);
        res.status(500).json({
          error: 'Failed to create room',
          details: error.message
        });
      }
    });

    // Join an existing room
    router.post('/rooms/:roomId/join', async (req, res) => {
      try {
        const { roomId } = req.params;
        const { userId, userInfo = {} } = req.body;

        if (!userId) {
          return res.status(400).json({
            error: 'Missing userId'
          });
        }

        const room = await this.chatManager.createOrJoinRoom(roomId, userId);
        
        // Emit join event to WebSocket clients
        this.chatManager.io.to(roomId).emit('user-joined-room', {
          roomId,
          userId,
          userInfo,
          timestamp: new Date().toISOString()
        });

        res.json({
          success: true,
          data: room,
          message: `Successfully joined room ${roomId}`,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Error joining room:', error);
        res.status(500).json({
          error: 'Failed to join room',
          details: error.message
        });
      }
    });

    // Leave a room
    router.post('/rooms/:roomId/leave', async (req, res) => {
      try {
        const { roomId } = req.params;
        const { userId } = req.body;

        if (!userId) {
          return res.status(400).json({
            error: 'Missing userId'
          });
        }

        // Remove user from room
        const room = this.chatManager.rooms.get(roomId);
        if (room && room.members.has(userId)) {
          room.members.delete(userId);
          
          // Update database
          await this.chatManager.roomsDB.put(roomId, {
            ...room,
            members: Array.from(room.members),
            lastActivity: new Date().toISOString()
          });
        }

        // Emit leave event
        this.chatManager.io.to(roomId).emit('user-left-room', {
          roomId,
          userId,
          timestamp: new Date().toISOString()
        });

        res.json({
          success: true,
          message: `Successfully left room ${roomId}`,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Error leaving room:', error);
        res.status(500).json({
          error: 'Failed to leave room',
          details: error.message
        });
      }
    });

    // Get all rooms (with filtering)
    router.get('/rooms', async (req, res) => {
      try {
        const { 
          isPrivate, 
          userId, 
          search,
          limit = 50,
          offset = 0
        } = req.query;

        let rooms = await this.chatManager.getActiveRooms();

        // Apply filters
        if (isPrivate !== undefined) {
          rooms = rooms.filter(room => room.isPrivate === (isPrivate === 'true'));
        }

        if (userId) {
          rooms = rooms.filter(room => room.members.includes(userId));
        }

        if (search) {
          const searchTerm = search.toLowerCase();
          rooms = rooms.filter(room => 
            room.name.toLowerCase().includes(searchTerm) ||
            (room.description && room.description.toLowerCase().includes(searchTerm))
          );
        }

        // Pagination
        const startIndex = parseInt(offset);
        const endIndex = startIndex + parseInt(limit);
        const paginatedRooms = rooms.slice(startIndex, endIndex);

        res.json({
          success: true,
          data: paginatedRooms,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            total: rooms.length,
            hasMore: endIndex < rooms.length
          },
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Error getting rooms:', error);
        res.status(500).json({
          error: 'Failed to get rooms',
          details: error.message
        });
      }
    });

    // Get room details
    router.get('/rooms/:roomId', async (req, res) => {
      try {
        const { roomId } = req.params;
        
        const room = this.chatManager.rooms.get(roomId);
        if (!room) {
          return res.status(404).json({
            error: 'Room not found'
          });
        }

        // Get recent messages
        const recentMessages = await this.chatManager.getChatHistory(roomId, 10);
        
        // Get active users in room
        const activeUsers = [];
        for (const userId of room.members) {
          const user = this.chatManager.users.get(userId);
          if (user) {
            activeUsers.push({
              userId,
              ...user.userInfo,
              online: true,
              lastActivity: user.lastActivity
            });
          }
        }

        res.json({
          success: true,
          data: {
            id: room.id,
            name: room.name || roomId,
            memberCount: room.members.size,
            members: Array.from(room.members),
            activeUsers,
            isPrivate: room.isPrivate || false,
            createdAt: room.createdAt,
            lastActivity: room.lastActivity,
            recentMessages
          },
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Error getting room details:', error);
        res.status(500).json({
          error: 'Failed to get room details',
          details: error.message
        });
      }
    });

    // Search messages across all rooms or specific room
    router.get('/search', async (req, res) => {
      try {
        const { 
          query, 
          roomId, 
          userId,
          type,
          limit = 20,
          offset = 0
        } = req.query;

        if (!query) {
          return res.status(400).json({
            error: 'Search query required'
          });
        }

        let results = await this.chatManager.searchMessages(
          query, 
          roomId, 
          parseInt(limit) + parseInt(offset)
        );

        // Apply additional filters
        if (userId) {
          results = results.filter(msg => msg.userId === userId);
        }

        if (type) {
          results = results.filter(msg => msg.type === type);
        }

        // Pagination
        const paginatedResults = results.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

        res.json({
          success: true,
          data: paginatedResults,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            total: results.length,
            hasMore: parseInt(offset) + parseInt(limit) < results.length
          },
          query,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Error searching:', error);
        res.status(500).json({
          error: 'Search failed',
          details: error.message
        });
      }
    });

    // Update message (edit)
    router.patch('/messages/:messageId', async (req, res) => {
      try {
        const { messageId } = req.params;
        const { content, userId } = req.body;

        if (!content || !userId) {
          return res.status(400).json({
            error: 'Missing required fields',
            required: ['content', 'userId']
          });
        }

        // Get original message
        const originalMessage = await this.chatManager.messagesDB.get(messageId);
        
        if (!originalMessage) {
          return res.status(404).json({
            error: 'Message not found'
          });
        }

        // Check if user can edit (only message author)
        if (originalMessage.userId !== userId) {
          return res.status(403).json({
            error: 'Permission denied'
          });
        }

        // Update message
        const updatedMessage = {
          ...originalMessage,
          content,
          edited: true,
          editedAt: new Date().toISOString()
        };

        await this.chatManager.messagesDB.put(messageId, updatedMessage);

        // Emit update to room
        this.chatManager.io.to(originalMessage.roomId).emit('message-updated', updatedMessage);

        res.json({
          success: true,
          data: updatedMessage,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Error updating message:', error);
        res.status(500).json({
          error: 'Failed to update message',
          details: error.message
        });
      }
    });

    // Delete message
    router.delete('/messages/:messageId', async (req, res) => {
      try {
        const { messageId } = req.params;
        const { userId } = req.body;

        if (!userId) {
          return res.status(400).json({
            error: 'Missing userId'
          });
        }

        // Get original message
        const originalMessage = await this.chatManager.messagesDB.get(messageId);
        
        if (!originalMessage) {
          return res.status(404).json({
            error: 'Message not found'
          });
        }

        // Check permissions (message author or room admin)
        if (originalMessage.userId !== userId) {
          return res.status(403).json({
            error: 'Permission denied'
          });
        }

        // Soft delete
        const deletedMessage = {
          ...originalMessage,
          deleted: true,
          deletedAt: new Date().toISOString(),
          deletedBy: userId
        };

        await this.chatManager.messagesDB.put(messageId, deletedMessage);

        // Emit deletion to room
        this.chatManager.io.to(originalMessage.roomId).emit('message-deleted', {
          messageId,
          roomId: originalMessage.roomId
        });

        res.json({
          success: true,
          message: 'Message deleted successfully',
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({
          error: 'Failed to delete message',
          details: error.message
        });
      }
    });

    // Get user's chat statistics
    router.get('/users/:userId/stats', async (req, res) => {
      try {
        const { userId } = req.params;
        
        let messageCount = 0;
        let roomsJoined = 0;
        let lastMessage = null;

        // Count messages by user
        for await (const [key, message] of this.chatManager.messagesDB.iterator()) {
          if (message.userId === userId && !message.deleted) {
            messageCount++;
            if (!lastMessage || new Date(message.timestamp) > new Date(lastMessage.timestamp)) {
              lastMessage = message;
            }
          }
        }

        // Count rooms joined
        for (const room of this.chatManager.rooms.values()) {
          if (room.members.has(userId)) {
            roomsJoined++;
          }
        }

        res.json({
          success: true,
          data: {
            userId,
            messageCount,
            roomsJoined,
            lastMessage: lastMessage ? {
              content: lastMessage.content,
              timestamp: lastMessage.timestamp,
              roomId: lastMessage.roomId
            } : null,
            isOnline: this.chatManager.users.has(userId)
          },
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Error getting user stats:', error);
        res.status(500).json({
          error: 'Failed to get user statistics',
          details: error.message
        });
      }
    });

    // Admin endpoint: Get system statistics
    router.get('/admin/stats', async (req, res) => {
      try {
        const stats = this.chatManager.getStats();
        
        // Additional detailed stats
        let totalMessages = 0;
        let totalRooms = 0;
        
        for await (const [key] of this.chatManager.messagesDB.iterator()) {
          totalMessages++;
        }
        
        for await (const [key] of this.chatManager.roomsDB.iterator()) {
          totalRooms++;
        }

        res.json({
          success: true,
          data: {
            ...stats,
            totalMessages,
            totalRooms,
            databaseSize: await this.getDatabaseSize(),
            systemInfo: {
              nodeVersion: process.version,
              platform: process.platform,
              arch: process.arch,
              memory: process.memoryUsage()
            }
          },
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Error getting admin stats:', error);
        res.status(500).json({
          error: 'Failed to get system statistics',
          details: error.message
        });
      }
    });
  }

  async getDatabaseSize() {
    try {
      // This is a simplified size calculation
      let size = 0;
      for await (const [key, value] of this.chatManager.db.iterator()) {
        size += JSON.stringify(value).length;
      }
      return size;
    } catch (error) {
      return 0;
    }
  }

  getRouter() {
    return router;
  }
}

module.exports = ChatRoutes;