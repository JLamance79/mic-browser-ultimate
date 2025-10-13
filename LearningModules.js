// Behavior Tracking Module for Learning Engine
// Tracks and records user interactions across all components

const { EventEmitter } = require('events');

class BehaviorTracker extends EventEmitter {
  constructor(learningEngine) {
    super();
    this.learningEngine = learningEngine;
    this.privacyMode = false;
    this.sessionData = new Map();
    this.realTimeBuffer = [];
    this.trackingMetrics = {
      sessionsTracked: 0,
      interactionsRecorded: 0,
      averageSessionLength: 0,
      mostUsedFeatures: new Map(),
      userJourneys: new Map()
    };
  }
  
  async initialize() {
    console.log('📊 Initializing Behavior Tracker...');
    
    // Load previous session data
    await this.loadSessionData();
    
    // Setup real-time tracking
    this.setupRealTimeTracking();
    
    console.log('✅ Behavior Tracker initialized');
  }
  
  async record(interaction) {
    if (this.privacyMode && this.isPrivateInteraction(interaction)) {
      return; // Skip private interactions
    }
    
    try {
      // Add to real-time buffer
      this.realTimeBuffer.push(interaction);
      
      // Track session data
      await this.trackSession(interaction);
      
      // Update metrics
      this.updateTrackingMetrics(interaction);
      
      // Emit for real-time processing
      this.emit('interaction-recorded', interaction);
      
    } catch (error) {
      console.error('Error recording interaction:', error);
    }
  }
  
  async trackSession(interaction) {
    const sessionId = interaction.sessionId || 'default';
    
    if (!this.sessionData.has(sessionId)) {
      this.sessionData.set(sessionId, {
        id: sessionId,
        startTime: interaction.timestamp,
        lastActivity: interaction.timestamp,
        interactions: [],
        components: new Set(),
        features: new Set(),
        duration: 0,
        outcomes: new Map()
      });
    }
    
    const session = this.sessionData.get(sessionId);
    session.interactions.push(interaction);
    session.lastActivity = interaction.timestamp;
    session.duration = interaction.timestamp - session.startTime;
    session.components.add(interaction.component);
    
    if (interaction.features) {
      interaction.features.forEach(feature => session.features.add(feature));
    }
    
    if (interaction.outcome && interaction.outcome !== 'pending') {
      const count = session.outcomes.get(interaction.outcome) || 0;
      session.outcomes.set(interaction.outcome, count + 1);
    }
  }
  
  setPrivacyMode(enabled) {
    this.privacyMode = enabled;
    if (enabled) {
      this.anonymizeCurrentData();
    }
  }
  
  isPrivateInteraction(interaction) {
    // Define what constitutes private data
    const privateActions = ['login', 'password', 'payment', 'personal-info'];
    const privateComponents = ['auth', 'payment', 'settings'];
    
    return privateActions.includes(interaction.action) ||
           privateComponents.includes(interaction.component) ||
           (interaction.data && this.containsPrivateData(interaction.data));
  }
  
  containsPrivateData(data) {
    const privateFields = ['password', 'ssn', 'credit', 'token', 'key'];
    const dataString = JSON.stringify(data).toLowerCase();
    return privateFields.some(field => dataString.includes(field));
  }
  
  anonymizeCurrentData() {
    // Anonymize stored session data
    for (const [sessionId, session] of this.sessionData) {
      session.interactions = session.interactions.map(interaction => ({
        ...interaction,
        user: 'anonymous',
        data: this.anonymizeData(interaction.data)
      }));
    }
  }
  
  anonymizeData(data) {
    if (!data || typeof data !== 'object') return data;
    
    const anonymized = { ...data };
    const sensitiveFields = ['email', 'name', 'phone', 'address', 'ip'];
    
    for (const field of sensitiveFields) {
      if (anonymized[field]) {
        anonymized[field] = '[ANONYMIZED]';
      }
    }
    
    return anonymized;
  }
  
  updateTrackingMetrics(interaction) {
    this.trackingMetrics.interactionsRecorded++;
    
    // Track feature usage
    if (interaction.features) {
      interaction.features.forEach(feature => {
        const count = this.trackingMetrics.mostUsedFeatures.get(feature) || 0;
        this.trackingMetrics.mostUsedFeatures.set(feature, count + 1);
      });
    }
    
    // Track user journeys (component transitions)
    if (this.lastComponent && this.lastComponent !== interaction.component) {
      const journey = `${this.lastComponent}->${interaction.component}`;
      const count = this.trackingMetrics.userJourneys.get(journey) || 0;
      this.trackingMetrics.userJourneys.set(journey, count + 1);
    }
    this.lastComponent = interaction.component;
  }
  
  setupRealTimeTracking() {
    // Process real-time buffer every 5 seconds
    setInterval(() => {
      if (this.realTimeBuffer.length > 0) {
        this.processRealTimeBuffer();
      }
    }, 5000);
  }
  
  processRealTimeBuffer() {
    const buffer = [...this.realTimeBuffer];
    this.realTimeBuffer = [];
    
    // Analyze real-time patterns
    const patterns = this.analyzeRealTimePatterns(buffer);
    if (patterns.length > 0) {
      this.emit('real-time-patterns', patterns);
    }
  }
  
  analyzeRealTimePatterns(interactions) {
    const patterns = [];
    
    // Rapid sequence detection
    const rapidSequences = this.detectRapidSequences(interactions);
    patterns.push(...rapidSequences);
    
    // Error patterns
    const errorPatterns = this.detectErrorPatterns(interactions);
    patterns.push(...errorPatterns);
    
    // Usage spikes
    const usageSpikes = this.detectUsageSpikes(interactions);
    patterns.push(...usageSpikes);
    
    return patterns;
  }
  
  detectRapidSequences(interactions) {
    const sequences = [];
    
    for (let i = 0; i < interactions.length - 2; i++) {
      const sequence = interactions.slice(i, i + 3);
      const timeSpan = sequence[2].timestamp - sequence[0].timestamp;
      
      if (timeSpan < 5000) { // Less than 5 seconds
        sequences.push({
          type: 'rapid_sequence',
          interactions: sequence,
          timeSpan,
          confidence: 0.8
        });
      }
    }
    
    return sequences;
  }
  
  detectErrorPatterns(interactions) {
    const errorPatterns = [];
    const errorInteractions = interactions.filter(i => 
      i.outcome === 'error' || i.outcome === 'failed'
    );
    
    if (errorInteractions.length > 2) {
      errorPatterns.push({
        type: 'error_cluster',
        interactions: errorInteractions,
        count: errorInteractions.length,
        confidence: 0.9
      });
    }
    
    return errorPatterns;
  }
  
  detectUsageSpikes(interactions) {
    const spikes = [];
    const componentCounts = new Map();
    
    interactions.forEach(interaction => {
      const count = componentCounts.get(interaction.component) || 0;
      componentCounts.set(interaction.component, count + 1);
    });
    
    for (const [component, count] of componentCounts) {
      if (count > 10) { // More than 10 interactions in buffer
        spikes.push({
          type: 'usage_spike',
          component,
          count,
          confidence: 0.7
        });
      }
    }
    
    return spikes;
  }
  
  async loadSessionData() {
    try {
      const data = await this.learningEngine.storage.getSetting('session_data') || {};
      this.sessionData = new Map(Object.entries(data.sessions || {}));
      this.trackingMetrics = { ...this.trackingMetrics, ...data.metrics };
    } catch (error) {
      console.error('Error loading session data:', error);
    }
  }
  
  async saveSessionData() {
    try {
      const data = {
        sessions: Object.fromEntries(this.sessionData),
        metrics: this.trackingMetrics,
        lastSaved: Date.now()
      };
      await this.learningEngine.storage.setSetting('session_data', data);
    } catch (error) {
      console.error('Error saving session data:', error);
    }
  }
  
  getSessionData(sessionId = null) {
    if (sessionId) {
      return this.sessionData.get(sessionId);
    }
    return Object.fromEntries(this.sessionData);
  }
  
  getTrackingMetrics() {
    return {
      ...this.trackingMetrics,
      mostUsedFeatures: Object.fromEntries(this.trackingMetrics.mostUsedFeatures),
      userJourneys: Object.fromEntries(this.trackingMetrics.userJourneys)
    };
  }
  
  clearOldSessions(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days
    const cutoff = Date.now() - maxAge;
    
    for (const [sessionId, session] of this.sessionData) {
      if (session.lastActivity < cutoff) {
        this.sessionData.delete(sessionId);
      }
    }
  }
}

// Pattern Recognition Module
class PatternRecognizer extends EventEmitter {
  constructor(learningEngine) {
    super();
    this.learningEngine = learningEngine;
    this.realTimeDetection = false;
    this.patternThresholds = {
      sequence: { minOccurrence: 3, minConfidence: 0.7 },
      temporal: { minOccurrence: 5, timeWindow: 60000 },
      context: { minSimilarity: 0.8, minOccurrence: 3 },
      usage: { minFrequency: 0.1, minSessions: 2 }
    };
  }
  
  async initialize() {
    console.log('🔍 Initializing Pattern Recognizer...');
    console.log('✅ Pattern Recognizer initialized');
  }
  
  async findSequencePatterns(behaviorHistory) {
    const patterns = [];
    const sequenceMap = new Map();
    
    // Look for sequences of 2-5 actions
    for (let len = 2; len <= 5; len++) {
      for (let i = 0; i <= behaviorHistory.length - len; i++) {
        const sequence = behaviorHistory.slice(i, i + len);
        const signature = this.createSequenceSignature(sequence);
        
        if (sequenceMap.has(signature)) {
          sequenceMap.get(signature).occurrences++;
          sequenceMap.get(signature).lastSeen = sequence[len - 1].timestamp;
        } else {
          sequenceMap.set(signature, {
            sequence,
            occurrences: 1,
            firstSeen: sequence[0].timestamp,
            lastSeen: sequence[len - 1].timestamp,
            avgDuration: this.calculateSequenceDuration(sequence)
          });
        }
      }
    }
    
    // Filter patterns by threshold
    for (const [signature, data] of sequenceMap) {
      if (data.occurrences >= this.patternThresholds.sequence.minOccurrence) {
        patterns.push({
          type: 'sequence',
          signature,
          pattern: data.sequence.map(i => ({ component: i.component, action: i.action })),
          occurrences: data.occurrences,
          confidence: Math.min(data.occurrences / 10, 1.0),
          avgDuration: data.avgDuration,
          firstSeen: data.firstSeen,
          lastSeen: data.lastSeen
        });
      }
    }
    
    return patterns.sort((a, b) => b.confidence - a.confidence);
  }
  
  async findTemporalPatterns(behaviorHistory) {
    const patterns = [];
    const timeSlots = this.groupByTimeSlots(behaviorHistory);
    
    // Analyze patterns by time of day, day of week, etc.
    const hourlyPatterns = this.analyzeHourlyPatterns(timeSlots);
    const dailyPatterns = this.analyzeDailyPatterns(timeSlots);
    const weeklyPatterns = this.analyzeWeeklyPatterns(timeSlots);
    
    patterns.push(...hourlyPatterns, ...dailyPatterns, ...weeklyPatterns);
    
    return patterns.filter(p => p.confidence >= this.patternThresholds.temporal.minOccurrence / 10);
  }
  
  async findContextPatterns(behaviorHistory) {
    const patterns = [];
    const contextGroups = this.groupByContext(behaviorHistory);
    
    for (const [context, interactions] of contextGroups) {
      if (interactions.length >= this.patternThresholds.context.minOccurrence) {
        const actionFreq = this.calculateActionFrequency(interactions);
        const commonActions = Object.entries(actionFreq)
          .filter(([action, freq]) => freq >= this.patternThresholds.context.minOccurrence)
          .sort((a, b) => b[1] - a[1]);
        
        if (commonActions.length > 0) {
          patterns.push({
            type: 'context',
            context: JSON.parse(context),
            commonActions: commonActions.map(([action, freq]) => ({ action, frequency: freq })),
            totalInteractions: interactions.length,
            confidence: Math.min(commonActions.length / 5, 1.0)
          });
        }
      }
    }
    
    return patterns.sort((a, b) => b.confidence - a.confidence);
  }
  
  async findUsagePatterns(behaviorHistory) {
    const patterns = [];
    
    // Component usage patterns
    const componentUsage = this.analyzeComponentUsage(behaviorHistory);
    patterns.push(...componentUsage);
    
    // Feature usage patterns
    const featureUsage = this.analyzeFeatureUsage(behaviorHistory);
    patterns.push(...featureUsage);
    
    // Session patterns
    const sessionPatterns = this.analyzeSessionPatterns(behaviorHistory);
    patterns.push(...sessionPatterns);
    
    return patterns.filter(p => p.confidence >= this.patternThresholds.usage.minFrequency);
  }
  
  // Helper methods
  createSequenceSignature(sequence) {
    return sequence.map(i => `${i.component}:${i.action}`).join('->');
  }
  
  calculateSequenceDuration(sequence) {
    if (sequence.length < 2) return 0;
    return sequence[sequence.length - 1].timestamp - sequence[0].timestamp;
  }
  
  groupByTimeSlots(behaviorHistory) {
    const slots = new Map();
    
    behaviorHistory.forEach(interaction => {
      const date = new Date(interaction.timestamp);
      const hour = date.getHours();
      const day = date.getDay();
      const week = this.getWeekNumber(date);
      
      const timeKey = `${hour}:${day}:${week}`;
      if (!slots.has(timeKey)) {
        slots.set(timeKey, []);
      }
      slots.get(timeKey).push(interaction);
    });
    
    return slots;
  }
  
  analyzeHourlyPatterns(timeSlots) {
    const hourlyActivity = new Map();
    
    for (const [timeKey, interactions] of timeSlots) {
      const hour = parseInt(timeKey.split(':')[0]);
      const count = hourlyActivity.get(hour) || 0;
      hourlyActivity.set(hour, count + interactions.length);
    }
    
    const patterns = [];
    for (const [hour, count] of hourlyActivity) {
      if (count >= this.patternThresholds.temporal.minOccurrence) {
        patterns.push({
          type: 'temporal_hourly',
          hour,
          activityCount: count,
          confidence: Math.min(count / 50, 1.0)
        });
      }
    }
    
    return patterns;
  }
  
  analyzeDailyPatterns(timeSlots) {
    // Similar implementation for daily patterns
    return [];
  }
  
  analyzeWeeklyPatterns(timeSlots) {
    // Similar implementation for weekly patterns
    return [];
  }
  
  groupByContext(behaviorHistory) {
    const contextGroups = new Map();
    
    behaviorHistory.forEach(interaction => {
      const contextKey = JSON.stringify(interaction.context || {});
      if (!contextGroups.has(contextKey)) {
        contextGroups.set(contextKey, []);
      }
      contextGroups.get(contextKey).push(interaction);
    });
    
    return contextGroups;
  }
  
  calculateActionFrequency(interactions) {
    const frequency = {};
    interactions.forEach(interaction => {
      frequency[interaction.action] = (frequency[interaction.action] || 0) + 1;
    });
    return frequency;
  }
  
  analyzeComponentUsage(behaviorHistory) {
    // Implementation for component usage analysis
    return [];
  }
  
  analyzeFeatureUsage(behaviorHistory) {
    // Implementation for feature usage analysis
    return [];
  }
  
  analyzeSessionPatterns(behaviorHistory) {
    // Implementation for session pattern analysis
    return [];
  }
  
  getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }
  
  startRealTimeDetection() {
    this.realTimeDetection = true;
    console.log('🔍 Real-time pattern detection started');
  }
  
  stopRealTimeDetection() {
    this.realTimeDetection = false;
    console.log('🔍 Real-time pattern detection stopped');
  }
  
  async analyzeRealTimePatterns(interactions) {
    const patterns = [];
    
    if (interactions.length < 3) return patterns;
    
    // Quick sequence detection
    const sequence = interactions.map(i => `${i.component}:${i.action}`).join('->');
    const timeSpan = interactions[interactions.length - 1].timestamp - interactions[0].timestamp;
    
    if (timeSpan < 10000) { // Less than 10 seconds
      patterns.push({
        type: 'quick_sequence',
        sequence,
        interactions,
        timeSpan,
        confidence: 0.7
      });
    }
    
    // Error pattern detection
    const errorCount = interactions.filter(i => i.outcome === 'error' || i.outcome === 'failed').length;
    if (errorCount > 1) {
      patterns.push({
        type: 'error_sequence',
        errorCount,
        interactions,
        confidence: 0.8
      });
    }
    
    return patterns;
  }

  // Additional methods needed for testing
  getPatterns() {
    return this.patterns || [];
  }

  clearPatterns() {
    this.patterns = [];
  }

  loadPatterns(patterns) {
    this.patterns = patterns || [];
  }
}

// Add missing methods to BehaviorTracker
BehaviorTracker.prototype.getInteractionHistory = function() {
  return this.realTimeBuffer || [];
};

BehaviorTracker.prototype.clearAll = function() {
  this.realTimeBuffer = [];
  this.sessionData.clear();
  return Promise.resolve();
};

BehaviorTracker.prototype.clearSensitiveData = function() {
  // Remove sensitive data from interactions
  if (this.realTimeBuffer) {
    this.realTimeBuffer = this.realTimeBuffer.filter(interaction => 
      !this.isPrivateInteraction(interaction)
    );
  }
};

BehaviorTracker.prototype.loadInteractions = function(interactions) {
  this.realTimeBuffer = interactions || [];
};

module.exports = { BehaviorTracker, PatternRecognizer };