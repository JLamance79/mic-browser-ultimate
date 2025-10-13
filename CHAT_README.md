# MIC Browser Ultimate - Chat Interface Backend

## Overview

The Chat Interface Backend provides a comprehensive real-time chat system for MIC Browser Ultimate, featuring AI integration, persistent storage, WebSocket communication, and RESTful API endpoints.

## Features

### 🚀 Core Features
- **Real-time Communication**: WebSocket-based chat with Socket.IO
- **Persistent Storage**: Level DB for message history and room data
- **AI Integration**: Intelligent responses using OpenAI/Anthropic APIs
- **Multi-Room Support**: Create and manage multiple chat rooms
- **User Management**: User presence, typing indicators, and session management
- **Message Search**: Full-text search across chat history
- **REST API**: Comprehensive HTTP endpoints for all chat operations

### 🤖 AI Features
- **Smart Triggers**: AI responds to questions and specific patterns
- **Context Awareness**: Maintains conversation context across messages
- **Fallback Responses**: Graceful handling when AI services are unavailable
- **Configurable Behavior**: Adjustable AI response settings

### 💾 Data Persistence
- **Message History**: All messages stored with timestamps and metadata
- **Room Management**: Persistent chat rooms with member tracking
- **User Sessions**: Session management with reconnection support
- **Search Indexing**: Fast message search capabilities

## Architecture

### Components

1. **ChatManager** (`ChatManager.js`)
   - Core chat system management
   - WebSocket server setup
   - Database operations
   - Room and user management

2. **ChatAI** (`ChatAI.js`)
   - AI response generation
   - Context management
   - Trigger pattern matching
   - Integration with existing AI services

3. **ChatRoutes** (`ChatRoutes.js`)
   - REST API endpoints
   - HTTP request handling
   - Data validation and formatting

4. **Integration** (in `main.js`)
   - IPC handlers for Electron
   - System initialization
   - Event coordination

## API Documentation

### WebSocket Events

#### Client -> Server
```javascript
// Authentication
socket.emit('authenticate', { userId, userInfo });

// Join room
socket.emit('join-room', { roomId, userId });

// Send message
socket.emit('send-message', { roomId, userId, message, type, metadata });

// Typing indicators
socket.emit('typing-start', { roomId, userId });
socket.emit('typing-stop', { roomId, userId });
```

#### Server -> Client
```javascript
// Authentication result
socket.on('authenticated', { success, userId });

// New message
socket.on('new-message', messageObject);

// User events
socket.on('user-joined-room', { roomId, userId });
socket.on('user-left-room', { roomId, userId });
socket.on('user-typing', { userId, typing });

// Message updates
socket.on('message-updated', messageObject);
socket.on('message-deleted', { messageId, roomId });
```

### REST API Endpoints

#### Messages
- `POST /api/messages` - Send a message
- `GET /rooms/:roomId/messages` - Get message history
- `PATCH /messages/:messageId` - Edit message
- `DELETE /messages/:messageId` - Delete message

#### Rooms
- `POST /api/rooms` - Create room
- `GET /api/rooms` - List rooms
- `GET /rooms/:roomId` - Get room details
- `POST /rooms/:roomId/join` - Join room
- `POST /rooms/:roomId/leave` - Leave room

#### Search & Stats
- `GET /api/search` - Search messages
- `GET /users/:userId/stats` - User statistics
- `GET /admin/stats` - System statistics

### IPC API (Electron)

```javascript
// Send message
await window.electronAPI.chat.sendMessage({
  roomId: 'general',
  userId: 'user123',
  message: 'Hello world!',
  type: 'text'
});

// Get chat history
const result = await window.electronAPI.chat.getHistory({
  roomId: 'general',
  limit: 50
});

// Join room
await window.electronAPI.chat.joinRoom({
  roomId: 'general',
  userId: 'user123',
  roomName: 'General Chat'
});

// Toggle AI
await window.electronAPI.chat.toggleAI(true);
```

## Configuration

### Environment Variables
```env
# AI Service Configuration
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here

# Chat Server Configuration
CHAT_PORT=3080
CHAT_DB_PATH=./data/chat.db

# Feature Flags
CHAT_AI_ENABLED=true
CHAT_PERSISTENCE_ENABLED=true
```

### Chat Manager Options
```javascript
const chatManager = new ChatManager(mainWindow, {
  port: 3080,                    // WebSocket server port
  dbPath: './data/chat.db',      // Database path
  maxContextMessages: 10,        // AI context size
  aiResponseDelay: 1000,         // AI response delay (ms)
  enablePersistence: true        // Enable message persistence
});
```

## Usage Examples

### Basic Chat Implementation

```html
<!DOCTYPE html>
<html>
<head>
    <title>Chat Interface</title>
</head>
<body>
    <div id="messages"></div>
    <input id="messageInput" type="text" placeholder="Type a message...">
    <button onclick="sendMessage()">Send</button>

    <script>
        let currentUser = window.electronAPI.chat.generateUserId();
        let currentRoom = 'general';

        // Initialize chat
        async function initChat() {
            await window.electronAPI.chat.joinRoom({
                roomId: currentRoom,
                userId: currentUser,
                roomName: 'General Chat'
            });
            
            loadHistory();
        }

        // Send message
        async function sendMessage() {
            const input = document.getElementById('messageInput');
            const message = input.value.trim();
            
            if (message) {
                await window.electronAPI.chat.sendMessage({
                    roomId: currentRoom,
                    userId: currentUser,
                    message: message
                });
                
                input.value = '';
                loadHistory();
            }
        }

        // Load chat history
        async function loadHistory() {
            const result = await window.electronAPI.chat.getHistory({
                roomId: currentRoom,
                limit: 50
            });
            
            if (result.success) {
                const messagesDiv = document.getElementById('messages');
                messagesDiv.innerHTML = '';
                
                result.history.forEach(msg => {
                    const msgEl = document.createElement('div');
                    msgEl.innerHTML = `
                        <strong>${msg.userId}:</strong> 
                        ${msg.content} 
                        <small>(${new Date(msg.timestamp).toLocaleTimeString()})</small>
                    `;
                    messagesDiv.appendChild(msgEl);
                });
            }
        }

        // Initialize when page loads
        document.addEventListener('DOMContentLoaded', initChat);
    </script>
</body>
</html>
```

### Advanced AI Chat

```javascript
class AIChat {
    constructor() {
        this.userId = window.electronAPI.chat.generateUserId();
        this.roomId = 'ai-assistant';
        this.init();
    }

    async init() {
        // Join AI room
        await window.electronAPI.chat.joinRoom({
            roomId: this.roomId,
            userId: this.userId,
            roomName: 'AI Assistant'
        });

        // Enable AI
        await window.electronAPI.chat.toggleAI(true);
    }

    async askAI(question) {
        const result = await window.electronAPI.chat.sendMessage({
            roomId: this.roomId,
            userId: this.userId,
            message: question,
            type: 'text',
            metadata: { expectAIResponse: true }
        });

        // AI will automatically respond due to trigger patterns
        return result;
    }

    async getConversationHistory() {
        const result = await window.electronAPI.chat.getHistory({
            roomId: this.roomId,
            limit: 100
        });

        return result.success ? result.history : [];
    }
}

// Usage
const aiChat = new AIChat();
await aiChat.askAI("How do I automate web scraping with MIC Browser?");
```

## Database Schema

### Messages Table
```javascript
{
  id: String,           // Unique message ID
  roomId: String,       // Room identifier
  userId: String,       // User identifier
  content: String,      // Message content
  type: String,         // Message type (text, ai, system, etc.)
  metadata: Object,     // Additional metadata
  timestamp: String,    // ISO timestamp
  edited: Boolean,      // Whether message was edited
  deleted: Boolean,     // Whether message was deleted
  editedAt: String,     // Edit timestamp
  deletedAt: String     // Deletion timestamp
}
```

### Rooms Table
```javascript
{
  id: String,           // Room identifier
  name: String,         // Display name
  members: Array,       // Array of user IDs
  isPrivate: Boolean,   // Privacy setting
  createdAt: String,    // Creation timestamp
  lastActivity: String  // Last activity timestamp
}
```

### Users Table
```javascript
{
  userId: String,       // User identifier
  userInfo: Object,     // User profile data
  lastSeen: String,     // Last activity timestamp
  status: String,       // Online/offline status
  socketId: String      // Current socket connection
}
```

## Troubleshooting

### Common Issues

1. **Chat system not initializing**
   - Check if Level database can be created
   - Verify port 3080 is available
   - Check console for initialization errors

2. **AI responses not working**
   - Verify API keys are set in `.env` file
   - Check AI service connectivity
   - Enable AI with `toggleAI(true)`

3. **WebSocket connection issues**
   - Check firewall settings
   - Verify port configuration
   - Check network connectivity

4. **Database errors**
   - Ensure write permissions for database directory
   - Check disk space
   - Verify Level DB installation

### Debug Mode

Enable debug logging:
```javascript
// In main.js initialization
const chatManager = new ChatManager(mainWindow, {
  debug: true,
  logLevel: 'verbose'
});
```

### Performance Monitoring

```javascript
// Get system statistics
const stats = await window.electronAPI.chat.getStats();
console.log('Chat System Stats:', stats);

// Monitor message throughput
setInterval(async () => {
  const stats = await window.electronAPI.chat.getStats();
  console.log(`Active: ${stats.activeUsers} users, ${stats.activeRooms} rooms`);
}, 30000);
```

## Development

### Running the Demo

1. Start the MIC Browser application
2. Open `chat-demo.html` in the browser window
3. The chat interface will automatically initialize

### Testing

```javascript
// Test message sending
await window.electronAPI.chat.sendMessage({
  roomId: 'test',
  userId: 'testuser',
  message: 'Hello world!'
});

// Test AI integration
await window.electronAPI.chat.sendMessage({
  roomId: 'test',
  userId: 'testuser',
  message: 'What is the weather like?'
});

// Test search functionality
const results = await window.electronAPI.chat.searchMessages({
  query: 'weather',
  limit: 10
});
```

### Extending the System

#### Adding Custom Message Types

```javascript
// In ChatManager.js
async sendMessage(roomId, userId, content, type = 'text', metadata = {}) {
  // Add support for new message types
  if (type === 'file') {
    metadata.fileName = content.fileName;
    metadata.fileSize = content.fileSize;
    content = `📎 ${content.fileName}`;
  }
  
  // ... rest of implementation
}
```

#### Custom AI Triggers

```javascript
// In ChatAI.js
this.triggers = [
  ...this.triggers,
  /^\/command\s+/i,     // Slash commands
  /remind me/i,         // Reminders
  /schedule/i           // Scheduling
];
```

## Security Considerations

- **Input Validation**: All user inputs are validated and sanitized
- **Rate Limiting**: Implement rate limiting for API endpoints
- **Authentication**: Secure user authentication and session management
- **Data Encryption**: Encrypt sensitive data in storage
- **XSS Prevention**: Proper HTML escaping for message content

## Performance Optimization

- **Database Indexing**: Implement proper indexes for search functionality
- **Message Pagination**: Limit message loading for large chat histories
- **Connection Pooling**: Manage WebSocket connections efficiently
- **Caching**: Cache frequently accessed data
- **Cleanup**: Regular cleanup of old messages and sessions

## License

This chat interface backend is part of MIC Browser Ultimate and follows the same licensing terms.