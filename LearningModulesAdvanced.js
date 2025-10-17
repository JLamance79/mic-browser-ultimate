// Advanced Learning Modules: Preferences, Predictions, and Adaptations
// Part 2 of the comprehensive learning system

const { EventEmitter } = require('events');

// Preference Learning Engine
class PreferenceEngine extends EventEmitter {
  constructor(learningEngine) {
    super();
    this.learningEngine = learningEngine;
    this.monitoring = false;
    this.preferenceCategories = {
      ui: ['theme', 'layout', 'shortcuts', 'notifications', 'accessibility'],
      features: ['ai_assistance', 'automation', 'security', 'performance'],
      workflows: ['default_actions', 'custom_sequences', 'triggers'],
      communication: ['tone', 'verbosity', 'format', 'frequency']
    };
  }
  
  async initialize() {
    console.log('❤️ Initializing Preference Engine...');
    console.log('✅ Preference Engine initialized');
  }
  
  async analyzeUIPreferences(behaviorHistory) {
    const preferences = {};
    
    // Theme preferences based on usage times
    preferences.theme = this.analyzeThemePreference(behaviorHistory);
    
    // Layout preferences based on customization actions
    preferences.layout = this.analyzeLayoutPreference(behaviorHistory);
    
    // Shortcut usage patterns
    preferences.shortcuts = this.analyzeShortcutPreference(behaviorHistory);
    
    // Notification interaction patterns
    preferences.notifications = this.analyzeNotificationPreference(behaviorHistory);
    
    return preferences;
  }
  
  async analyzeFeatureUsage(behaviorHistory) {
    const usage = {};
    
    // AI assistance usage
    const aiInteractions = behaviorHistory.filter(i => 
      i.component === 'ai' || i.features?.includes('ai')
    );
    usage.ai_assistance = {
      frequency: aiInteractions.length / behaviorHistory.length,
      preferredActions: this.getTopActions(aiInteractions),
      satisfaction: this.calculateAverageSatisfaction(aiInteractions)
    };
    
    // Automation usage
    const automationInteractions = behaviorHistory.filter(i => 
      i.component === 'workflow' || i.features?.includes('automation')
    );
    usage.automation = {
      frequency: automationInteractions.length / behaviorHistory.length,
      preferredWorkflows: this.getTopWorkflows(automationInteractions),
      complexity: this.calculateWorkflowComplexity(automationInteractions)
    };
    
    // Security feature usage
    const securityInteractions = behaviorHistory.filter(i => 
      i.features?.includes('security') || i.component === 'security'
    );
    usage.security = {
      frequency: securityInteractions.length / behaviorHistory.length,
      preferredLevel: this.determineSecurityLevel(securityInteractions)
    };
    
    return usage;
  }
  
  async analyzeWorkflowPreferences(behaviorHistory) {
    const preferences = {};
    
    // Default action preferences
    preferences.defaultActions = this.analyzeDefaultActions(behaviorHistory);
    
    // Custom sequence preferences
    preferences.customSequences = this.analyzeCustomSequences(behaviorHistory);
    
    // Trigger preferences
    preferences.triggers = this.analyzeTriggerPreferences(behaviorHistory);
    
    return preferences;
  }

  analyzeDefaultActions(behaviorHistory) {
    const actionCounts = new Map();
    const componentActions = new Map();
    
    behaviorHistory.forEach(interaction => {
      const key = `${interaction.component}:${interaction.action}`;
      actionCounts.set(key, (actionCounts.get(key) || 0) + 1);
      
      if (!componentActions.has(interaction.component)) {
        componentActions.set(interaction.component, new Map());
      }
      const compActions = componentActions.get(interaction.component);
      compActions.set(interaction.action, (compActions.get(interaction.action) || 0) + 1);
    });
    
    const defaults = {};
    for (const [component, actions] of componentActions) {
      const sortedActions = Array.from(actions.entries())
        .sort((a, b) => b[1] - a[1]);
      
      if (sortedActions.length > 0) {
        defaults[component] = {
          action: sortedActions[0][0],
          frequency: sortedActions[0][1] / behaviorHistory.length
        };
      }
    }
    
    return defaults;
  }

  analyzeCustomSequences(behaviorHistory) {
    const sequences = [];
    const sequenceMap = new Map();
    
    // Look for repeated sequences of 2-4 actions
    for (let length = 2; length <= 4; length++) {
      for (let i = 0; i <= behaviorHistory.length - length; i++) {
        const sequence = behaviorHistory.slice(i, i + length);
        const sequenceKey = sequence.map(a => `${a.component}:${a.action}`).join('-');
        
        sequenceMap.set(sequenceKey, (sequenceMap.get(sequenceKey) || 0) + 1);
      }
    }
    
    // Convert to array and filter by frequency
    for (const [sequence, count] of sequenceMap) {
      if (count >= 3) { // Minimum repetitions
        sequences.push({
          sequence: sequence.split('-').map(s => {
            const [component, action] = s.split(':');
            return { component, action };
          }),
          frequency: count / behaviorHistory.length,
          count
        });
      }
    }
    
    return sequences.sort((a, b) => b.frequency - a.frequency).slice(0, 10);
  }

  analyzeTriggerPreferences(behaviorHistory) {
    const triggers = {};
    const contextTriggers = new Map();
    
    behaviorHistory.forEach((interaction, index) => {
      if (index > 0) {
        const prevInteraction = behaviorHistory[index - 1];
        const triggerKey = `${prevInteraction.component}:${prevInteraction.action}`;
        const responseKey = `${interaction.component}:${interaction.action}`;
        
        if (!contextTriggers.has(triggerKey)) {
          contextTriggers.set(triggerKey, new Map());
        }
        
        const responses = contextTriggers.get(triggerKey);
        responses.set(responseKey, (responses.get(responseKey) || 0) + 1);
      }
    });
    
    // Convert to usable format
    for (const [trigger, responses] of contextTriggers) {
      const totalResponses = Array.from(responses.values()).reduce((sum, count) => sum + count, 0);
      
      if (totalResponses >= 3) {
        const sortedResponses = Array.from(responses.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([response, count]) => ({
            response,
            probability: count / totalResponses,
            count
          }));
        
        triggers[trigger] = sortedResponses.slice(0, 3);
      }
    }
    
    return triggers;
  }
  
  async analyzeCommunicationStyle(behaviorHistory) {
    const style = {};
    
    // Analyze chat interactions for tone preference
    const chatInteractions = behaviorHistory.filter(i => i.component === 'chat');
    style.tone = this.analyzeTonePreference(chatInteractions);
    
    // Analyze response length preferences
    style.verbosity = this.analyzeVerbosityPreference(chatInteractions);
    
    // Analyze preferred communication format
    style.format = this.analyzeFormatPreference(chatInteractions);
    
    return style;
  }

  analyzeTonePreference(chatInteractions) {
    if (chatInteractions.length === 0) {
      return { preferred: 'neutral', confidence: 0.1 };
    }

    const toneIndicators = {
      formal: ['please', 'thank you', 'would you', 'could you'],
      casual: ['hey', 'thanks', 'yeah', 'ok'],
      direct: ['do this', 'get', 'show me', 'need']
    };

    const toneCounts = { formal: 0, casual: 0, direct: 0 };

    chatInteractions.forEach(interaction => {
      const message = (interaction.data?.message || '').toLowerCase();
      
      for (const [tone, indicators] of Object.entries(toneIndicators)) {
        indicators.forEach(indicator => {
          if (message.includes(indicator)) {
            toneCounts[tone]++;
          }
        });
      }
    });

    const totalIndicators = Object.values(toneCounts).reduce((sum, count) => sum + count, 0);
    
    if (totalIndicators === 0) {
      return { preferred: 'neutral', confidence: 0.1 };
    }

    const preferredTone = Object.entries(toneCounts)
      .sort((a, b) => b[1] - a[1])[0];

    return {
      preferred: preferredTone[0],
      confidence: preferredTone[1] / totalIndicators,
      distribution: toneCounts
    };
  }

  analyzeVerbosityPreference(chatInteractions) {
    if (chatInteractions.length === 0) {
      return { preferred: 'medium', confidence: 0.1 };
    }

    const messageLengths = chatInteractions
      .filter(i => i.data?.message)
      .map(i => i.data.message.length);

    if (messageLengths.length === 0) {
      return { preferred: 'medium', confidence: 0.1 };
    }

    const avgLength = messageLengths.reduce((sum, len) => sum + len, 0) / messageLengths.length;

    let preferred;
    if (avgLength < 50) preferred = 'brief';
    else if (avgLength < 150) preferred = 'medium';
    else preferred = 'detailed';

    return {
      preferred,
      avgLength,
      confidence: Math.min(messageLengths.length / 10, 1.0)
    };
  }

  analyzeFormatPreference(chatInteractions) {
    if (chatInteractions.length === 0) {
      return { preferred: 'text', confidence: 0.1 };
    }

    const formatCounts = {
      text: 0,
      bullet: 0,
      numbered: 0,
      code: 0
    };

    chatInteractions.forEach(interaction => {
      const message = interaction.data?.message || '';
      
      if (message.includes('```') || message.includes('`')) formatCounts.code++;
      if (message.includes('1.') || message.includes('2.')) formatCounts.numbered++;
      if (message.includes('•') || message.includes('-')) formatCounts.bullet++;
      else formatCounts.text++;
    });

    const preferredFormat = Object.entries(formatCounts)
      .sort((a, b) => b[1] - a[1])[0];

    return {
      preferred: preferredFormat[0],
      confidence: preferredFormat[1] / chatInteractions.length,
      distribution: formatCounts
    };
  }
  
  // UI Preference Analysis Methods
  analyzeThemePreference(behaviorHistory) {
    const timeBasedUsage = new Map();
    
    behaviorHistory.forEach(interaction => {
      const hour = new Date(interaction.timestamp).getHours();
      const theme = hour >= 18 || hour <= 6 ? 'dark' : 'light';
      timeBasedUsage.set(theme, (timeBasedUsage.get(theme) || 0) + 1);
    });
    
    const totalInteractions = behaviorHistory.length;
    const darkUsage = timeBasedUsage.get('dark') || 0;
    const lightUsage = timeBasedUsage.get('light') || 0;
    
    return {
      preferred: darkUsage > lightUsage ? 'dark' : 'light',
      confidence: Math.abs(darkUsage - lightUsage) / totalInteractions,
      autoSwitch: darkUsage > 0 && lightUsage > 0
    };
  }
  
  analyzeLayoutPreference(behaviorHistory) {
    const layoutActions = behaviorHistory.filter(i => 
      i.action.includes('resize') || i.action.includes('move') || i.action.includes('toggle')
    );
    
    const preferences = {
      sidebarPosition: 'left', // Default
      panelSize: 'medium',
      compactMode: false
    };
    
    // Analyze sidebar interactions
    const sidebarActions = layoutActions.filter(i => i.context?.element?.includes('sidebar'));
    if (sidebarActions.length > 0) {
      // Determine preferred sidebar position based on interactions
      preferences.sidebarPosition = this.determineSidebarPreference(sidebarActions);
    }
    
    return preferences;
  }
  
  analyzeShortcutPreference(behaviorHistory) {
    const shortcutUsage = new Map();
    
    behaviorHistory.forEach(interaction => {
      if (interaction.data?.shortcut) {
        const shortcut = interaction.data.shortcut;
        shortcutUsage.set(shortcut, (shortcutUsage.get(shortcut) || 0) + 1);
      }
    });
    
    const topShortcuts = Array.from(shortcutUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    return {
      mostUsed: topShortcuts,
      frequency: shortcutUsage.size / behaviorHistory.length,
      powerUser: shortcutUsage.size > 20
    };
  }
  
  analyzeNotificationPreference(behaviorHistory) {
    const notificationActions = behaviorHistory.filter(i => 
      i.component === 'notification' || i.action.includes('notification')
    );
    
    const dismissed = notificationActions.filter(i => i.action === 'dismiss').length;
    const interacted = notificationActions.filter(i => i.action === 'click').length;
    
    return {
      engagement: interacted / (notificationActions.length || 1),
      tolerance: 1 - (dismissed / (notificationActions.length || 1)),
      preferredFrequency: this.calculatePreferredNotificationFrequency(notificationActions)
    };
  }
  
  // Feature Usage Analysis Methods
  getTopActions(interactions) {
    const actionCounts = new Map();
    interactions.forEach(i => {
      actionCounts.set(i.action, (actionCounts.get(i.action) || 0) + 1);
    });
    
    return Array.from(actionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([action, count]) => ({ action, count }));
  }
  
  getTopWorkflows(interactions) {
    const workflowCounts = new Map();
    interactions.forEach(i => {
      const workflow = i.workflow || i.action || 'unknown';
      workflowCounts.set(workflow, (workflowCounts.get(workflow) || 0) + 1);
    });
    
    return Array.from(workflowCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([workflow, count]) => ({ workflow, count }));
  }
  
  calculateWorkflowComplexity(interactions) {
    if (interactions.length === 0) return 0;
    
    // Calculate complexity based on variety of actions and sequence depth
    const uniqueActions = new Set(interactions.map(i => i.action)).size;
    const avgStepsPerWorkflow = interactions.reduce((sum, i) => {
      return sum + (i.steps ? i.steps.length : 1);
    }, 0) / interactions.length;
    
    // Normalize complexity score between 0 and 1
    const varietyScore = Math.min(uniqueActions / 10, 1);
    const complexityScore = Math.min(avgStepsPerWorkflow / 5, 1);
    
    return (varietyScore + complexityScore) / 2;
  }
  
  determineSecurityLevel(interactions) {
    if (interactions.length === 0) return 'low';
    
    // Count security-related interactions
    const securityActions = interactions.filter(i =>
      i.action?.includes('password') ||
      i.action?.includes('encrypt') ||
      i.action?.includes('security') ||
      i.features?.includes('security')
    ).length;
    
    const securityRatio = securityActions / interactions.length;
    
    if (securityRatio > 0.5) return 'high';
    if (securityRatio > 0.2) return 'medium';
    return 'low';
  }
  
  calculateAverageSatisfaction(interactions) {
    const satisfactionScores = interactions
      .filter(i => i.satisfaction !== null && i.satisfaction !== undefined)
      .map(i => i.satisfaction);
    
    if (satisfactionScores.length === 0) return null;
    
    return satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length;
  }
  
  // Helper methods for preference analysis
  determineSidebarPreference(sidebarActions) {
    // Analyze interaction patterns to determine sidebar preference
    return 'left'; // Simplified implementation
  }
  
  calculatePreferredNotificationFrequency(notificationActions) {
    // Calculate based on interaction timing
    return 'moderate'; // Simplified implementation
  }
  
  startMonitoring() {
    this.monitoring = true;
    console.log('👁️ Preference monitoring started');
  }
  
  stopMonitoring() {
    this.monitoring = false;
    console.log('👁️ Preference monitoring stopped');
  }

  // Additional methods needed for testing
  getPreferences() {
    return this.preferences || {};
  }

  clearPreferences() {
    this.preferences = {};
  }

  loadPreferences(preferences) {
    this.preferences = preferences || {};
  }
}

// Prediction Model Engine
class PredictionModel extends EventEmitter {
  constructor(learningEngine) {
    super();
    this.learningEngine = learningEngine;
    this.models = {
      sequence: new SequencePredictor(),
      temporal: new TemporalPredictor(),
      context: new ContextPredictor(),
      ai: new AIPredictor(learningEngine.aiSystem)
    };
    this.continuousLearning = false;
    this.continuousLearningInterval = null;
  }
  
  async initialize() {
    console.log('🎯 Initializing Prediction Model...');
    
    // Initialize individual predictors
    await Promise.all(Object.values(this.models).map(model => model.initialize()));
    
    console.log('✅ Prediction Model initialized');
  }
  
  async predictBySequence(context, behaviorHistory) {
    return await this.models.sequence.predict(context, behaviorHistory);
  }
  
  async predictByTemporal(context, behaviorHistory) {
    return await this.models.temporal.predict(context, behaviorHistory);
  }
  
  async predictByContext(context, learnedPatterns) {
    return await this.models.context.predict(context, learnedPatterns);
  }
  
  async predictByAI(context, behaviorHistory) {
    return await this.models.ai.predict(context, behaviorHistory);
  }
  
  async updateWithPatterns(sequencePatterns, temporalPatterns) {
    await this.models.sequence.updatePatterns(sequencePatterns);
    await this.models.temporal.updatePatterns(temporalPatterns);
  }
  
  startContinuousLearning() {
    this.continuousLearning = true;
    
    // Update models every 30 minutes
    this.continuousLearningInterval = setInterval(() => {
      if (this.continuousLearning) {
        this.updateAllModels();
      }
    }, 30 * 60 * 1000);
    
    console.log('🔄 Continuous learning started');
  }
  
  stopContinuousLearning() {
    this.continuousLearning = false;
    if (this.continuousLearningInterval) {
      clearInterval(this.continuousLearningInterval);
      this.continuousLearningInterval = null;
    }
    console.log('🔄 Continuous learning stopped');
  }
  
  async updateAllModels() {
    try {
      const behaviorHistory = this.learningEngine.behaviorHistory;
      const learnedPatterns = this.learningEngine.learnedPatterns;
      
      await Promise.all([
        this.models.sequence.retrain(behaviorHistory),
        this.models.temporal.retrain(behaviorHistory),
        this.models.context.retrain(learnedPatterns)
      ]);
      
      console.log('🔄 All prediction models updated');
    } catch (error) {
      console.error('Error updating prediction models:', error);
    }
  }
  
  async updateWithCorrelations(correlations) {
    // Update prediction models with cross-component correlations
    correlations.forEach(correlation => {
      // Add correlation patterns to sequence predictor
      if (this.models.sequence) {
        this.models.sequence.addCorrelationPattern(correlation);
      }
      
      // Update context predictor with component relationships
      if (this.models.context) {
        this.models.context.addComponentCorrelation(correlation);
      }
    });
  }
}

// Individual Predictor Classes
class SequencePredictor {
  constructor() {
    this.sequencePatterns = new Map();
    this.nGramModels = new Map(); // N-gram models for sequence prediction
  }
  
  async initialize() {
    console.log('🔗 Initializing Sequence Predictor...');
  }
  
  async predict(context, behaviorHistory) {
    const recentActions = behaviorHistory.slice(-5); // Look at last 5 actions
    const predictions = [];
    
    // Use n-gram models to predict next action
    for (let n = 2; n <= Math.min(4, recentActions.length); n++) {
      const nGram = recentActions.slice(-n).map(a => `${a.component}:${a.action}`).join('->');
      
      if (this.nGramModels.has(nGram)) {
        const nextActions = this.nGramModels.get(nGram);
        predictions.push(...nextActions.map(action => ({
          ...action,
          method: 'sequence',
          nGramSize: n
        })));
      }
    }
    
    return this.rankPredictions(predictions);
  }
  
  async updatePatterns(sequencePatterns) {
    sequencePatterns.forEach(pattern => {
      this.sequencePatterns.set(pattern.signature, pattern);
      this.updateNGramModels(pattern);
    });
  }
  
  updateNGramModels(pattern) {
    const sequence = pattern.pattern;
    
    for (let n = 2; n <= sequence.length; n++) {
      for (let i = 0; i <= sequence.length - n; i++) {
        const nGram = sequence.slice(i, i + n - 1).map(a => `${a.component}:${a.action}`).join('->');
        const nextAction = sequence[i + n - 1];
        
        if (!this.nGramModels.has(nGram)) {
          this.nGramModels.set(nGram, []);
        }
        
        const existing = this.nGramModels.get(nGram).find(a => 
          a.component === nextAction.component && a.action === nextAction.action
        );
        
        if (existing) {
          existing.count += pattern.occurrences;
          existing.confidence = Math.min(existing.count / 100, 1.0);
        } else {
          this.nGramModels.get(nGram).push({
            component: nextAction.component,
            action: nextAction.action,
            count: pattern.occurrences,
            confidence: Math.min(pattern.occurrences / 100, 1.0)
          });
        }
      }
    }
  }
  
  rankPredictions(predictions) {
    return predictions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
  }
  
  async retrain(behaviorHistory) {
    // Retrain n-gram models with new data
    this.nGramModels.clear();
    
    // Rebuild models from scratch with recent data
    const recentHistory = behaviorHistory.slice(-1000); // Use last 1000 interactions
    this.buildNGramModels(recentHistory);
  }
  
  buildNGramModels(history) {
    // Implementation for building n-gram models from history
    for (let n = 2; n <= 4; n++) {
      for (let i = 0; i <= history.length - n; i++) {
        const sequence = history.slice(i, i + n);
        const nGram = sequence.slice(0, -1).map(a => `${a.component}:${a.action}`).join('->');
        const nextAction = sequence[sequence.length - 1];
        
        if (!this.nGramModels.has(nGram)) {
          this.nGramModels.set(nGram, []);
        }
        
        const existing = this.nGramModels.get(nGram).find(a => 
          a.component === nextAction.component && a.action === nextAction.action
        );
        
        if (existing) {
          existing.count++;
        } else {
          this.nGramModels.get(nGram).push({
            component: nextAction.component,
            action: nextAction.action,
            count: 1,
            confidence: 0.1
          });
        }
      }
    }
    
    // Calculate final confidences
    for (const [nGram, actions] of this.nGramModels) {
      const totalCount = actions.reduce((sum, a) => sum + a.count, 0);
      actions.forEach(action => {
        action.confidence = action.count / totalCount;
      });
    }
  }
  
  addCorrelationPattern(correlation) {
    // Add cross-component correlation patterns
    const correlationKey = `${correlation.from}->${correlation.to}`;
    if (!this.nGramModels.has(correlationKey)) {
      this.nGramModels.set(correlationKey, []);
    }
    
    this.nGramModels.get(correlationKey).push({
      component: correlation.to,
      action: 'correlated_action',
      count: Math.floor(correlation.strength * 10),
      confidence: correlation.strength
    });
  }
}

class TemporalPredictor {
  constructor() {
    this.timePatterns = new Map();
    this.cyclicalPatterns = new Map();
  }
  
  async initialize() {
    console.log('⏰ Initializing Temporal Predictor...');
  }
  
  async predict(context, behaviorHistory) {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    
    const predictions = [];
    
    // Hourly patterns
    const hourlyKey = `hour_${hour}`;
    if (this.timePatterns.has(hourlyKey)) {
      const pattern = this.timePatterns.get(hourlyKey);
      if (pattern && pattern.commonActions && Array.isArray(pattern.commonActions)) {
        predictions.push(...pattern.commonActions.map(action => ({
          ...action,
          method: 'temporal_hourly',
          timeContext: { hour }
        })));
      }
    }
    
    // Daily patterns
    const dailyKey = `day_${dayOfWeek}`;
    if (this.timePatterns.has(dailyKey)) {
      const pattern = this.timePatterns.get(dailyKey);
      if (pattern && pattern.commonActions && Array.isArray(pattern.commonActions)) {
        predictions.push(...pattern.commonActions.map(action => ({
          ...action,
          method: 'temporal_daily',
          timeContext: { dayOfWeek }
        })));
      }
    }
    
    return predictions.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  }
  
  async updatePatterns(temporalPatterns) {
    temporalPatterns.forEach(pattern => {
      // Ensure pattern has proper structure
      const normalizedPattern = {
        ...pattern,
        commonActions: pattern.commonActions || []
      };
      
      if (pattern.type === 'temporal_hourly') {
        this.timePatterns.set(`hour_${pattern.hour}`, normalizedPattern);
      } else if (pattern.type === 'temporal_daily') {
        this.timePatterns.set(`day_${pattern.day}`, normalizedPattern);
      }
    });
  }
  
  async retrain(behaviorHistory) {
    // Retrain temporal models
    this.analyzeTemporalPatterns(behaviorHistory);
  }
  
  analyzeTemporalPatterns(history) {
    const hourlyActivity = new Map();
    const dailyActivity = new Map();
    
    history.forEach(interaction => {
      const date = new Date(interaction.timestamp);
      const hour = date.getHours();
      const day = date.getDay();
      
      // Hourly activity
      const hourKey = `hour_${hour}`;
      if (!hourlyActivity.has(hourKey)) {
        hourlyActivity.set(hourKey, []);
      }
      hourlyActivity.get(hourKey).push(interaction);
      
      // Daily activity
      const dayKey = `day_${day}`;
      if (!dailyActivity.has(dayKey)) {
        dailyActivity.set(dayKey, []);
      }
      dailyActivity.get(dayKey).push(interaction);
    });
    
    // Process hourly patterns
    for (const [key, interactions] of hourlyActivity) {
      if (interactions.length >= 10) { // Minimum threshold
        const commonActions = this.extractCommonActions(interactions);
        this.timePatterns.set(key, {
          type: 'temporal_hourly',
          hour: parseInt(key.split('_')[1]),
          commonActions,
          totalInteractions: interactions.length
        });
      }
    }
    
    // Process daily patterns
    for (const [key, interactions] of dailyActivity) {
      if (interactions.length >= 20) { // Minimum threshold
        const commonActions = this.extractCommonActions(interactions);
        this.timePatterns.set(key, {
          type: 'temporal_daily',
          day: parseInt(key.split('_')[1]),
          commonActions,
          totalInteractions: interactions.length
        });
      }
    }
  }
  
  extractCommonActions(interactions) {
    const actionCounts = new Map();
    
    interactions.forEach(interaction => {
      const key = `${interaction.component}:${interaction.action}`;
      actionCounts.set(key, (actionCounts.get(key) || 0) + 1);
    });
    
    return Array.from(actionCounts.entries())
      .map(([key, count]) => {
        const [component, action] = key.split(':');
        return {
          component,
          action,
          count,
          confidence: count / interactions.length
        };
      })
      .filter(action => action.confidence >= 0.1)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
  }
}

class ContextPredictor {
  constructor() {
    this.contextPatterns = new Map();
  }
  
  async initialize() {
    console.log('🎯 Initializing Context Predictor...');
  }
  
  async predict(context, learnedPatterns) {
    const predictions = [];
    
    // Find similar contexts in learned patterns
    for (const [patternId, pattern] of learnedPatterns) {
      if (pattern.type === 'context') {
        const similarity = this.calculateContextSimilarity(context, pattern.context);
        
        if (similarity >= 0.7) {
          if (pattern.commonActions && Array.isArray(pattern.commonActions)) {
            predictions.push(...pattern.commonActions.map(action => ({
              component: action.action.split(':')[0],
              action: action.action.split(':')[1],
              confidence: action.frequency * similarity,
              method: 'context',
              similarity
            })));
          }
        }
      }
    }
    
    return predictions.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  }
  
  calculateContextSimilarity(context1, context2) {
    // Simple similarity calculation based on common keys and values
    const keys1 = Object.keys(context1 || {});
    const keys2 = Object.keys(context2 || {});
    
    if (keys1.length === 0 && keys2.length === 0) return 1;
    if (keys1.length === 0 || keys2.length === 0) return 0;
    
    const commonKeys = keys1.filter(key => keys2.includes(key));
    const keysSimilarity = commonKeys.length / Math.max(keys1.length, keys2.length);
    
    let valuesSimilarity = 0;
    if (commonKeys.length > 0) {
      valuesSimilarity = commonKeys.reduce((sum, key) => {
        return sum + (context1[key] === context2[key] ? 1 : 0);
      }, 0) / commonKeys.length;
    }
    
    return (keysSimilarity + valuesSimilarity) / 2;
  }
  
  async retrain(learnedPatterns) {
    this.contextPatterns.clear();
    
    for (const [patternId, pattern] of learnedPatterns) {
      if (pattern.type === 'context') {
        this.contextPatterns.set(patternId, pattern);
      }
    }
  }
  
  addComponentCorrelation(correlation) {
    // Add component correlation to context patterns
    const correlationPattern = {
      type: 'component_correlation',
      from: correlation.from,
      to: correlation.to,
      strength: correlation.strength,
      commonActions: []
    };
    
    this.contextPatterns.set(`correlation_${correlation.from}_${correlation.to}`, correlationPattern);
  }
}

class AIPredictor {
  constructor(aiSystem) {
    this.aiSystem = aiSystem;
  }
  
  async initialize() {
    console.log('🤖 Initializing AI Predictor...');
  }
  
  async predict(context, behaviorHistory) {
    if (!this.aiSystem) return [];
    
    try {
      // Check if AI system has the expected method
      if (typeof this.aiSystem.processCommand !== 'function') {
        // Fall back to mock predictions if AI system is not properly configured
        return this.generateMockPredictions(context, behaviorHistory);
      }
      
      const recentHistory = behaviorHistory.slice(-10);
      const prompt = `Based on this user behavior pattern, predict the next 3 most likely actions:

Recent interactions:
${recentHistory.map(i => `${i.component}:${i.action} at ${new Date(i.timestamp).toLocaleTimeString()}`).join('\n')}

Current context: ${JSON.stringify(context)}

Return predictions as JSON array with format:
[{"component": "name", "action": "action", "confidence": 0.8, "reasoning": "why"}]`;

      const response = await this.aiSystem.processCommand(prompt, {
        type: 'prediction',
        maxTokens: 500
      });
      
      if (response && response.success) {
        const predictions = this.extractPredictionsFromResponse(response.content);
        return predictions.map(p => ({ ...p, method: 'ai' }));
      }
      
    } catch (error) {
      console.error('AI prediction error:', error);
      return this.generateMockPredictions(context, behaviorHistory);
    }
    
    return [];
  }

  generateMockPredictions(context, behaviorHistory) {
    // Generate mock predictions based on recent behavior patterns
    if (behaviorHistory.length === 0) {
      return [{
        component: 'browser',
        action: 'navigate',
        confidence: 0.7,
        reasoning: 'Default browser action',
        method: 'ai_mock'
      }];
    }

    const recentActions = behaviorHistory.slice(-3);
    const actionCounts = new Map();
    
    recentActions.forEach(action => {
      const key = `${action.component}:${action.action}`;
      actionCounts.set(key, (actionCounts.get(key) || 0) + 1);
    });

    return Array.from(actionCounts.entries())
      .map(([key, count]) => {
        const [component, action] = key.split(':');
        return {
          component,
          action,
          confidence: Math.min(count / recentActions.length * 0.8, 0.9),
          reasoning: `Based on recent usage pattern`,
          method: 'ai_mock'
        };
      })
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
  }
  
  extractPredictionsFromResponse(content) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[.*\]/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Error parsing AI prediction response:', error);
    }
    
    return [];
  }
}

// Adaptation Engine
class AdaptationEngine extends EventEmitter {
  constructor(learningEngine) {
    super();
    this.learningEngine = learningEngine;
    this.adaptationRules = new Map();
    this.appliedAdaptations = new Map();
  }
  
  async initialize() {
    console.log('🔧 Initializing Adaptation Engine...');
    this.loadAdaptationRules();
    console.log('✅ Adaptation Engine initialized');
  }
  
  async generateAdaptations(component, context, preferences, learnedPatterns) {
    const adaptations = [];
    
    // UI adaptations based on preferences
    if (preferences.ui) {
      adaptations.push(...this.generateUIAdaptations(component, preferences.ui));
    }
    
    // Feature adaptations based on usage patterns
    if (preferences.features) {
      adaptations.push(...this.generateFeatureAdaptations(component, preferences.features));
    }
    
    // Context-based adaptations
    adaptations.push(...this.generateContextAdaptations(component, context, learnedPatterns));
    
    return adaptations.filter(a => a.confidence >= 0.6);
  }
  
  generateUIAdaptations(component, uiPreferences) {
    const adaptations = [];
    
    // Theme adaptation
    if (uiPreferences.theme) {
      adaptations.push({
        type: 'ui_theme',
        component,
        changes: { theme: uiPreferences.theme.preferred },
        confidence: uiPreferences.theme.confidence,
        reason: 'User theme preference'
      });
    }
    
    // Layout adaptations
    if (uiPreferences.layout) {
      adaptations.push({
        type: 'ui_layout',
        component,
        changes: uiPreferences.layout,
        confidence: 0.8,
        reason: 'User layout preferences'
      });
    }
    
    return adaptations;
  }
  
  generateFeatureAdaptations(component, featurePreferences) {
    const adaptations = [];
    
    // Enable/disable features based on usage
    Object.entries(featurePreferences).forEach(([feature, usage]) => {
      if (usage.frequency < 0.1) {
        adaptations.push({
          type: 'feature_disable',
          component,
          changes: { [feature]: { enabled: false, reason: 'Low usage' } },
          confidence: 1 - usage.frequency,
          reason: `Low usage of ${feature}`
        });
      } else if (usage.frequency > 0.5) {
        adaptations.push({
          type: 'feature_promote',
          component,
          changes: { [feature]: { promoted: true, reason: 'High usage' } },
          confidence: usage.frequency,
          reason: `High usage of ${feature}`
        });
      }
    });
    
    return adaptations;
  }
  
  generateContextAdaptations(component, context, learnedPatterns) {
    const adaptations = [];
    
    // Context-specific UI adaptations
    if (context.url && context.url.includes('form')) {
      adaptations.push({
        type: 'context_ui',
        component,
        changes: { autoFillSuggestions: true, formAssist: true },
        confidence: 0.9,
        reason: 'Form context detected'
      });
    }
    
    return adaptations;
  }
  
  async applyAdaptations(component, adaptations) {
    const applied = [];
    
    for (const adaptation of adaptations) {
      try {
        const success = await this.applyAdaptation(component, adaptation);
        if (success) {
          applied.push(adaptation);
          this.trackAppliedAdaptation(component, adaptation);
        }
      } catch (error) {
        console.error('Error applying adaptation:', error);
      }
    }
    
    return applied;
  }
  
  async applyAdaptation(component, adaptation) {
    // This would integrate with the actual UI/component system
    // For now, we'll simulate the application
    
    console.log(`🔧 Applying ${adaptation.type} to ${component}:`, adaptation.changes);
    
    // Store the adaptation for tracking
    const key = `${component}_${adaptation.type}`;
    this.appliedAdaptations.set(key, {
      ...adaptation,
      appliedAt: Date.now(),
      component
    });
    
    return true; // Simulate successful application
  }
  
  trackAppliedAdaptation(component, adaptation) {
    // Track the success of applied adaptations for learning
    const key = `${component}_${adaptation.type}`;
    
    setTimeout(() => {
      // Simulate checking if the adaptation was beneficial
      const wasSuccessful = Math.random() > 0.3; // 70% success rate simulation
      
      if (this.appliedAdaptations.has(key)) {
        this.appliedAdaptations.get(key).success = wasSuccessful;
        this.appliedAdaptations.get(key).evaluatedAt = Date.now();
      }
      
      this.emit('adaptation-evaluated', { component, adaptation, success: wasSuccessful });
    }, 60000); // Evaluate after 1 minute
  }
  
  loadAdaptationRules() {
    // Load predefined adaptation rules
    this.adaptationRules.set('high_ai_usage', {
      condition: (preferences) => preferences.features?.ai_assistance?.frequency > 0.7,
      adaptation: { type: 'feature_promote', target: 'ai_assistant' }
    });
    
    this.adaptationRules.set('low_automation_usage', {
      condition: (preferences) => preferences.features?.automation?.frequency < 0.2,
      adaptation: { type: 'feature_tutorial', target: 'workflow_recorder' }
    });
  }
  
  getAppliedAdaptations(component = null) {
    if (component) {
      const adaptations = [];
      for (const [key, adaptation] of this.appliedAdaptations) {
        if (adaptation.component === component) {
          adaptations.push(adaptation);
        }
      }
      return adaptations;
    }
    
    return Object.fromEntries(this.appliedAdaptations);
  }
}

module.exports = { PreferenceEngine, PredictionModel, AdaptationEngine };