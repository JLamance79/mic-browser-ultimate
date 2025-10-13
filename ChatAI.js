/**
 * ChatAI - AI Integration for Chat System
 * Handles intelligent responses and AI-powered chat features
 */

const EventEmitter = require('events');

class ChatAI extends EventEmitter {
  constructor(chatManager, aiService = null) {
    super();
    
    this.chatManager = chatManager;
    this.aiService = aiService;
    this.enabled = true;
    this.responseDelay = 1000; // Delay before AI responds (ms)
    
    // AI configuration
    this.config = {
      model: 'claude-3-sonnet-20240229',
      maxTokens: 1500,
      temperature: 0.7,
      systemPrompt: this.buildSystemPrompt()
    };
    
    // Conversation context tracking
    this.contextMemory = new Map(); // roomId -> context
    this.maxContextMessages = 10;
    
    // AI response patterns and triggers
    this.triggers = [
      /\?$/,                    // Questions ending with ?
      /^@ai\b/i,                // Direct mentions @ai
      /^@assistant\b/i,         // Direct mentions @assistant
      /help me/i,               // Help requests
      /how do i/i,              // How-to questions
      /what is/i,               // Definition requests
      /can you/i,               // Direct requests
      /please/i,                // Polite requests
      /explain/i,               // Explanation requests
      /(analyze|summarize)/i    // Analysis requests
    ];
    
    this.setupEventHandlers();
  }

  buildSystemPrompt() {
    return `You are MIC Assistant, an advanced AI integrated into the MIC Browser Ultimate chat system.

CAPABILITIES:
- Intelligent conversation and assistance
- Browser automation and web analysis
- Document processing and OCR
- Workflow automation suggestions
- Technical support for the application
- Data analysis and insights

PERSONALITY:
- Helpful and professional
- Concise but thorough
- Proactive in suggesting solutions
- Knowledgeable about web technologies

GUIDELINES:
- Keep responses conversational and helpful
- Offer specific actionable advice
- Ask clarifying questions when needed
- Suggest relevant MIC Browser features
- Be aware this is a chat environment with multiple users

CONTEXT AWARENESS:
- You can see recent chat history for context
- Users may be discussing web pages, documents, or tasks
- Previous messages provide important context
- Multiple users may be in the conversation

RESPONSE FORMAT:
- Use markdown for formatting when helpful
- Keep responses under 300 words unless specifically asked for detail
- Use bullet points for lists
- Include relevant examples when appropriate`;
  }

  setupEventHandlers() {
    // Listen for new messages in chat
    this.chatManager.on('message-sent', async (message) => {
      if (this.shouldRespond(message)) {
        await this.generateResponse(message);
      }
    });

    // Handle direct AI requests from main process
    this.on('ai-request', async (data) => {
      const { roomId, message, context } = data;
      await this.processAIRequest(roomId, message, context);
    });
  }

  shouldRespond(message) {
    // Don't respond to AI messages
    if (message.userId === 'ai-assistant' || message.userId === 'system') {
      return false;
    }

    // Don't respond if AI is disabled
    if (!this.enabled) {
      return false;
    }

    // Check if message matches any triggers
    const content = message.content.toLowerCase();
    return this.triggers.some(trigger => trigger.test(content));
  }

  async generateResponse(message) {
    try {
      // Add delay to seem more natural
      setTimeout(async () => {
        await this.processAIRequest(message.roomId, message.content, [message]);
      }, this.responseDelay);
      
    } catch (error) {
      console.error('Error generating AI response:', error);
    }
  }

  async processAIRequest(roomId, messageContent, context = []) {
    try {
      // Get conversation context
      const conversationContext = await this.getConversationContext(roomId);
      
      // Build full context including recent messages
      const fullContext = [...conversationContext, ...context];
      
      // Generate AI response
      const response = await this.callAIService(messageContent, fullContext, roomId);
      
      if (response) {
        // Send AI response to chat
        const aiMessage = await this.chatManager.sendMessage(
          roomId,
          'ai-assistant',
          response,
          'ai',
          {
            model: this.config.model,
            inResponseTo: context[context.length - 1]?.id,
            confidence: 0.85,
            timestamp: new Date().toISOString()
          }
        );

        // Emit to WebSocket clients
        this.chatManager.io.to(roomId).emit('new-message', aiMessage);
        
        // Update context memory
        this.updateContextMemory(roomId, messageContent, response);
        
        this.emit('response-generated', { roomId, response, originalMessage: messageContent });
      }
      
    } catch (error) {
      console.error('Error processing AI request:', error);
      
      // Send error message to chat
      const errorMessage = await this.chatManager.sendMessage(
        roomId,
        'ai-assistant',
        "I'm sorry, I encountered an error while processing your request. Please try again.",
        'error',
        { error: error.message, timestamp: new Date().toISOString() }
      );
      
      this.chatManager.io.to(roomId).emit('new-message', errorMessage);
    }
  }

  async getConversationContext(roomId) {
    try {
      // Get recent messages for context
      const recentMessages = await this.chatManager.getChatHistory(roomId, this.maxContextMessages);
      
      // Filter out system messages and format for AI
      return recentMessages
        .filter(msg => !msg.deleted && msg.type !== 'system')
        .map(msg => ({
          role: msg.userId === 'ai-assistant' ? 'assistant' : 'user',
          content: msg.content,
          timestamp: msg.timestamp,
          userId: msg.userId
        }))
        .reverse(); // Oldest first for proper context
        
    } catch (error) {
      console.error('Error getting conversation context:', error);
      return [];
    }
  }

  async callAIService(message, context, roomId) {
    if (!this.aiService) {
      // Fallback to main process AI service
      return await this.callMainProcessAI(message, context, roomId);
    }

    try {
      // Build conversation for AI
      const messages = [
        { role: 'system', content: this.config.systemPrompt }
      ];

      // Add context messages
      context.forEach(ctx => {
        if (ctx.role && ctx.content) {
          messages.push({
            role: ctx.role,
            content: ctx.content
          });
        }
      });

      // Add current message
      messages.push({
        role: 'user',
        content: message
      });

      // Call AI service
      const response = await this.aiService.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        messages: messages
      });

      return response.content[0].text;

    } catch (error) {
      console.error('AI service error:', error);
      return this.generateFallbackResponse(message);
    }
  }

  async callMainProcessAI(message, context, roomId) {
    return new Promise((resolve) => {
      // Request AI response from main process
      const requestId = Date.now().toString();
      
      // Listen for response
      const responseHandler = (response) => {
        if (response.requestId === requestId) {
          this.removeListener('main-ai-response', responseHandler);
          resolve(response.content);
        }
      };
      
      this.on('main-ai-response', responseHandler);
      
      // Send request to main process
      if (this.chatManager.mainWindow && this.chatManager.mainWindow.webContents) {
        this.chatManager.mainWindow.webContents.send('chat-ai-request', {
          requestId,
          roomId,
          message,
          context,
          config: this.config
        });
      }
      
      // Timeout after 30 seconds
      setTimeout(() => {
        this.removeListener('main-ai-response', responseHandler);
        resolve(this.generateFallbackResponse(message));
      }, 30000);
    });
  }

  generateFallbackResponse(message) {
    const fallbacks = [
      "I understand you're asking about: " + message.substring(0, 50) + "... Let me help you with that.",
      "That's an interesting question. Could you provide a bit more context?",
      "I'm here to help! Could you rephrase that or be more specific?",
      "I'd be happy to assist you. What would you like to know more about?",
      "Let me help you with that. Can you provide more details about what you're trying to do?"
    ];
    
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  updateContextMemory(roomId, userMessage, aiResponse) {
    if (!this.contextMemory.has(roomId)) {
      this.contextMemory.set(roomId, []);
    }
    
    const context = this.contextMemory.get(roomId);
    
    // Add new exchange
    context.push({
      userMessage,
      aiResponse,
      timestamp: new Date().toISOString()
    });
    
    // Keep only recent context
    if (context.length > this.maxContextMessages) {
      context.splice(0, context.length - this.maxContextMessages);
    }
  }

  // Analyze message sentiment and intent
  analyzeMessage(message) {
    const content = message.toLowerCase();
    
    // Simple sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'awesome', 'perfect', 'thank', 'please'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'broken', 'error', 'problem'];
    const questionWords = ['what', 'how', 'why', 'when', 'where', 'who', 'which'];
    
    let sentiment = 'neutral';
    let intent = 'statement';
    
    const positiveCount = positiveWords.filter(word => content.includes(word)).length;
    const negativeCount = negativeWords.filter(word => content.includes(word)).length;
    const questionCount = questionWords.filter(word => content.includes(word)).length;
    
    if (positiveCount > negativeCount) sentiment = 'positive';
    else if (negativeCount > positiveCount) sentiment = 'negative';
    
    if (questionCount > 0 || content.includes('?')) intent = 'question';
    else if (content.includes('help') || content.includes('please')) intent = 'request';
    else if (this.triggers.some(trigger => trigger.test(content))) intent = 'ai_trigger';
    
    return { sentiment, intent, confidence: Math.random() * 0.3 + 0.7 }; // Mock confidence
  }

  // Generate suggested responses for users
  generateSuggestions(message, context = []) {
    const analysis = this.analyzeMessage(message);
    const suggestions = [];
    
    if (analysis.intent === 'question') {
      suggestions.push(
        "I can help answer that question.",
        "Let me analyze that for you.",
        "Would you like me to research that?"
      );
    } else if (analysis.intent === 'request') {
      suggestions.push(
        "I can assist with that task.",
        "Let me guide you through that.",
        "I have some suggestions for that."
      );
    } else {
      suggestions.push(
        "That's interesting! Tell me more.",
        "I can provide additional insights on that.",
        "Would you like me to elaborate on that topic?"
      );
    }
    
    return suggestions.slice(0, 3); // Return top 3 suggestions
  }

  // Enable/disable AI responses
  setEnabled(enabled) {
    this.enabled = enabled;
    console.log(`Chat AI ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Update AI configuration
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('Chat AI configuration updated');
  }

  // Get AI statistics
  getStats() {
    return {
      enabled: this.enabled,
      contextMemorySize: this.contextMemory.size,
      totalContextEntries: Array.from(this.contextMemory.values()).reduce((sum, arr) => sum + arr.length, 0),
      triggers: this.triggers.length,
      config: this.config
    };
  }

  // Clear context memory for a room
  clearContext(roomId) {
    if (this.contextMemory.has(roomId)) {
      this.contextMemory.delete(roomId);
      console.log(`Cleared context memory for room: ${roomId}`);
    }
  }

  // Clear all context memory
  clearAllContext() {
    this.contextMemory.clear();
    console.log('Cleared all context memory');
  }
}

module.exports = ChatAI;