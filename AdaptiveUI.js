// Adaptive UI System for MIC Browser Ultimate
// Creates dynamic, learning-responsive interface elements

const { EventEmitter } = require('events');

class AdaptiveUISystem extends EventEmitter {
  constructor(learningEngine, mainWindow) {
    super();
    this.learningEngine = learningEngine;
    this.mainWindow = mainWindow;
    this.adaptiveElements = new Map();
    this.uiState = {
      theme: 'auto',
      layout: 'default',
      shortcuts: new Map(),
      notifications: { enabled: true, frequency: 'normal' },
      accessibility: { highContrast: false, fontSize: 'normal' }
    };
    this.adaptationRules = new Map();
    this.adaptationHistory = [];
    this.initialized = false;
  }
  
  async initialize() {
    console.log('🎨 Initializing Adaptive UI System...');
    
    // Load saved UI preferences
    await this.loadUIPreferences();
    
    // Setup adaptation rules
    this.setupAdaptationRules();
    
    // Initialize adaptive elements
    await this.initializeAdaptiveElements();
    
    // Listen to learning engine events
    this.setupLearningListeners();
    
    // Setup periodic adaptation
    this.setupPeriodicAdaptation();
    
    this.initialized = true;
    console.log('✅ Adaptive UI System initialized');
  }
  
  async loadUIPreferences() {
    try {
      const preferences = this.learningEngine.getUserPreferences('ui');
      if (preferences && Object.keys(preferences).length > 0) {
        this.uiState = { ...this.uiState, ...preferences };
        console.log('📱 Loaded UI preferences from learning engine');
      }
    } catch (error) {
      console.error('Error loading UI preferences:', error);
    }
  }
  
  setupAdaptationRules() {
    // Theme adaptation rules
    this.adaptationRules.set('theme_time_based', {
      condition: (interactions, time) => {
        const hour = new Date(time).getHours();
        const isDayTime = hour >= 6 && hour <= 18;
        const nightUsage = interactions.filter(u => {
          const uHour = new Date(u.timestamp).getHours();
          return uHour < 6 || uHour > 18;
        }).length;
        return { isDayTime, nightUsage: interactions.length > 0 ? nightUsage / interactions.length : 0 };
      },
      adaptation: (result) => {
        if (result.nightUsage > 0.6) {
          return { theme: 'dark', confidence: result.nightUsage };
        } else if (!result.isDayTime) {
          return { theme: 'dark', confidence: 0.8 };
        }
        return { theme: 'light', confidence: 0.6 };
      }
    });
    
    // Layout adaptation rules
    this.adaptationRules.set('layout_usage_based', {
      condition: (interactions, time) => {
        const componentUsage = new Map();
        interactions.forEach(i => {
          componentUsage.set(i.component, (componentUsage.get(i.component) || 0) + 1);
        });
        return componentUsage;
      },
      adaptation: (usage) => {
        const sortedUsage = Array.from(usage.entries())
          .sort((a, b) => b[1] - a[1]);
        
        const adaptations = {};
        
        // Promote frequently used components
        if (sortedUsage[0] && sortedUsage[0][1] > 10) {
          adaptations.primaryComponent = sortedUsage[0][0];
          adaptations.layout = 'focused';
        }
        
        // Suggest compact mode for power users
        if (usage.size > 5) {
          adaptations.compactMode = true;
          adaptations.showAdvanced = true;
        }
        
        return adaptations;
      }
    });
    
    // Notification adaptation rules
    this.adaptationRules.set('notification_engagement', {
      condition: (interactions) => {
        const notificationInteractions = interactions.filter(i => 
          i.component === 'notification' || i.action.includes('notification')
        );
        
        const dismissed = notificationInteractions.filter(i => i.action === 'dismiss').length;
        const clicked = notificationInteractions.filter(i => i.action === 'click').length;
        
        return {
          total: notificationInteractions.length,
          dismissed,
          clicked,
          engagement: clicked / (notificationInteractions.length || 1)
        };
      },
      adaptation: (result) => {
        if (result.engagement < 0.3) {
          return { 
            notifications: { 
              enabled: true, 
              frequency: 'minimal',
              importance: 'high_only'
            }
          };
        } else if (result.engagement > 0.7) {
          return { 
            notifications: { 
              enabled: true, 
              frequency: 'normal',
              showPreviews: true
            }
          };
        }
        return {};
      }
    });
  }
  
  async initializeAdaptiveElements() {
    // Create adaptive elements for different UI components
    
    // Theme adapter
    this.adaptiveElements.set('theme', new ThemeAdapter(this));
    
    // Layout adapter
    this.adaptiveElements.set('layout', new LayoutAdapter(this));
    
    // Shortcut adapter
    this.adaptiveElements.set('shortcuts', new ShortcutAdapter(this));
    
    // Notification adapter
    this.adaptiveElements.set('notifications', new NotificationAdapter(this));
    
    // Accessibility adapter
    this.adaptiveElements.set('accessibility', new AccessibilityAdapter(this));
    
    // Initialize all adapters
    for (const [name, adapter] of this.adaptiveElements) {
      await adapter.initialize();
      console.log(`🔧 ${name} adapter initialized`);
    }
  }
  
  setupLearningListeners() {
    if (!this.learningEngine) return;
    
    // Listen for preference updates
    this.learningEngine.on('preferences-learned', async () => {
      await this.updateUIFromPreferences();
    });
    
    // Listen for pattern changes
    this.learningEngine.on('patterns-learned', async () => {
      await this.adaptBasedOnPatterns();
    });
    
    // Listen for real-time interactions
    this.learningEngine.on('interaction-tracked', async (interaction) => {
      await this.processRealTimeAdaptation(interaction);
    });
  }
  
  setupPeriodicAdaptation() {
    // Run comprehensive adaptation every 30 minutes
    setInterval(async () => {
      if (this.initialized) {
        await this.runPeriodicAdaptation();
      }
    }, 30 * 60 * 1000);
    
    // Quick adaptations every 5 minutes
    setInterval(async () => {
      if (this.initialized) {
        await this.runQuickAdaptations();
      }
    }, 5 * 60 * 1000);
  }
  
  async updateUIFromPreferences() {
    try {
      const preferences = this.learningEngine.getUserPreferences('ui');
      if (!preferences) return;
      
      // Apply theme preferences
      if (preferences.theme) {
        await this.adaptiveElements.get('theme')?.applyAdaptation(preferences.theme);
      }
      
      // Apply layout preferences
      if (preferences.layout) {
        await this.adaptiveElements.get('layout')?.applyAdaptation(preferences.layout);
      }
      
      // Apply notification preferences
      if (preferences.notifications) {
        await this.adaptiveElements.get('notifications')?.applyAdaptation(preferences.notifications);
      }
      
      this.emit('ui-adapted', { source: 'preferences', preferences });
      
    } catch (error) {
      console.error('Error updating UI from preferences:', error);
    }
  }
  
  async adaptBasedOnPatterns() {
    try {
      const patterns = this.learningEngine.getLearnedPatterns();
      const behaviorHistory = this.learningEngine.behaviorHistory || [];
      
      // Apply adaptation rules
      for (const [ruleName, rule] of this.adaptationRules) {
        // Ensure behaviorHistory is an array for rules that expect interactions
        const interactions = Array.isArray(behaviorHistory) ? behaviorHistory : [];
        const condition = rule.condition(interactions, Date.now());
        const adaptation = rule.adaptation(condition);
        
        if (adaptation && Object.keys(adaptation).length > 0) {
          await this.applyAdaptation(adaptation, ruleName);
        }
      }
      
      this.emit('ui-adapted', { source: 'patterns', patterns: Object.keys(patterns) });
      
    } catch (error) {
      console.error('Error adapting based on patterns:', error);
    }
  }
  
  async processRealTimeAdaptation(interaction) {
    try {
      // Quick theme adaptation based on time
      if (interaction.component === 'ui' && interaction.action === 'session_start') {
        const hour = new Date(interaction.timestamp).getHours();
        if ((hour < 6 || hour > 20) && this.uiState.theme !== 'dark') {
          await this.adaptiveElements.get('theme')?.suggestAdaptation({ theme: 'dark', reason: 'Night time detected' });
        }
      }
      
      // Layout adaptation based on component usage
      if (interaction.component !== 'ui') {
        const recentUsage = this.learningEngine.behaviorHistory.slice(-10);
        const componentCounts = new Map();
        
        recentUsage.forEach(i => {
          componentCounts.set(i.component, (componentCounts.get(i.component) || 0) + 1);
        });
        
        const mostUsed = Array.from(componentCounts.entries())
          .sort((a, b) => b[1] - a[1])[0];
        
        if (mostUsed && mostUsed[1] >= 5) {
          await this.adaptiveElements.get('layout')?.suggestAdaptation({
            focusComponent: mostUsed[0],
            reason: 'Heavy usage detected'
          });
        }
      }
      
    } catch (error) {
      console.error('Error in real-time adaptation:', error);
    }
  }
  
  async runPeriodicAdaptation() {
    console.log('🔄 Running periodic UI adaptation...');
    
    try {
      // Get recent behavior data
      const recentBehavior = this.learningEngine.behaviorHistory.slice(-1000);
      
      // Run all adaptation rules
      for (const [name, adapter] of this.adaptiveElements) {
        await adapter.runPeriodicAdaptation(recentBehavior);
      }
      
      // Save current UI state
      await this.saveUIState();
      
      console.log('✅ Periodic adaptation completed');
      
    } catch (error) {
      console.error('Error in periodic adaptation:', error);
    }
  }
  
  async runQuickAdaptations() {
    // Run lightweight, quick adaptations
    const recentInteractions = this.learningEngine.behaviorHistory.slice(-50);
    
    // Quick theme check
    const nightInteractions = recentInteractions.filter(i => {
      const hour = new Date(i.timestamp).getHours();
      return hour < 6 || hour > 20;
    });
    
    if (nightInteractions.length > recentInteractions.length * 0.8) {
      await this.adaptiveElements.get('theme')?.quickAdaptation({ prefer: 'dark' });
    }
  }
  
  async applyAdaptation(adaptation, source) {
    try {
      const changes = [];
      
      // Apply theme changes
      if (adaptation.theme) {
        await this.adaptiveElements.get('theme')?.applyAdaptation({ theme: adaptation.theme });
        changes.push(`theme: ${adaptation.theme}`);
      }
      
      // Apply layout changes
      if (adaptation.layout || adaptation.compactMode || adaptation.primaryComponent) {
        await this.adaptiveElements.get('layout')?.applyAdaptation(adaptation);
        changes.push('layout updated');
      }
      
      // Apply notification changes
      if (adaptation.notifications) {
        await this.adaptiveElements.get('notifications')?.applyAdaptation(adaptation.notifications);
        changes.push('notifications updated');
      }
      
      if (changes.length > 0) {
        console.log(`🎨 Applied adaptations from ${source}: ${changes.join(', ')}`);
        this.emit('adaptations-applied', { source, changes, adaptation });
      }
      
    } catch (error) {
      console.error('Error applying adaptation:', error);
    }
  }
  
  async saveUIState() {
    try {
      if (this.learningEngine && this.learningEngine.storage) {
        await this.learningEngine.storage.save('adaptive_ui_state', {
          uiState: this.uiState,
          lastSaved: Date.now()
        });
      }
    } catch (error) {
      console.error('Error saving UI state:', error);
    }
  }
  
  // Public API methods
  async suggestUIChange(component, suggestion) {
    const adapter = this.adaptiveElements.get(component);
    if (adapter) {
      return await adapter.suggestAdaptation(suggestion);
    }
    return false;
  }
  
  getCurrentUIState() {
    return { ...this.uiState };
  }
  
  async resetToDefaults() {
    this.uiState = {
      theme: 'auto',
      layout: 'default',
      shortcuts: new Map(),
      notifications: { enabled: true, frequency: 'normal' },
      accessibility: { highContrast: false, fontSize: 'normal' }
    };
    
    for (const adapter of this.adaptiveElements.values()) {
      await adapter.reset();
    }
    
    this.emit('ui-reset');
  }
  
  getAdaptationHistory() {
    const history = [];
    for (const [name, adapter] of this.adaptiveElements) {
      history.push({
        component: name,
        adaptations: adapter.getAdaptationHistory()
      });
    }
    return history;
  }
}

// Base Adapter Class
class BaseAdapter extends EventEmitter {
  constructor(adaptiveUI) {
    super();
    this.adaptiveUI = adaptiveUI;
    this.history = [];
    this.currentState = {};
  }
  
  async initialize() {
    // Override in subclasses
  }
  
  async applyAdaptation(adaptation) {
    // Override in subclasses
    this.history.push({
      adaptation,
      timestamp: Date.now(),
      applied: true
    });
  }
  
  async suggestAdaptation(suggestion) {
    // Override in subclasses
    this.emit('suggestion', suggestion);
    return true;
  }
  
  async runPeriodicAdaptation(behaviorData) {
    // Override in subclasses
  }
  
  async quickAdaptation(hint) {
    // Override in subclasses
  }
  
  async reset() {
    this.currentState = {};
    this.history = [];
  }
  
  getAdaptationHistory() {
    return [...this.history];
  }
}

// Specific Adapter Implementations
class ThemeAdapter extends BaseAdapter {
  async initialize() {
    this.currentState = { theme: 'auto', lastChanged: Date.now() };
  }
  
  async applyAdaptation(adaptation) {
    if (adaptation.theme && adaptation.theme !== this.currentState.theme) {
      this.currentState.theme = adaptation.theme;
      this.currentState.lastChanged = Date.now();
      
      // Send to renderer
      if (this.adaptiveUI.mainWindow) {
        this.adaptiveUI.mainWindow.webContents.send('adaptive-theme-change', {
          theme: adaptation.theme,
          source: 'learning'
        });
      }
      
      await super.applyAdaptation(adaptation);
    }
  }
  
  async suggestAdaptation(suggestion) {
    // Only suggest if not changed recently (avoid flickering)
    const timeSinceLastChange = Date.now() - this.currentState.lastChanged;
    if (timeSinceLastChange > 60000) { // 1 minute cooldown
      if (this.adaptiveUI.mainWindow) {
        this.adaptiveUI.mainWindow.webContents.send('adaptive-theme-suggestion', suggestion);
      }
      return await super.suggestAdaptation(suggestion);
    }
    return false;
  }
  
  async quickAdaptation(hint) {
    if (hint.prefer && hint.prefer !== this.currentState.theme) {
      await this.suggestAdaptation({
        theme: hint.prefer,
        reason: 'Usage pattern detected',
        priority: 'low'
      });
    }
  }
}

class LayoutAdapter extends BaseAdapter {
  async initialize() {
    this.currentState = { 
      layout: 'default', 
      compactMode: false,
      focusedComponent: null 
    };
  }
  
  async applyAdaptation(adaptation) {
    let changed = false;
    
    if (adaptation.layout && adaptation.layout !== this.currentState.layout) {
      this.currentState.layout = adaptation.layout;
      changed = true;
    }
    
    if (adaptation.compactMode !== undefined && adaptation.compactMode !== this.currentState.compactMode) {
      this.currentState.compactMode = adaptation.compactMode;
      changed = true;
    }
    
    if (adaptation.primaryComponent && adaptation.primaryComponent !== this.currentState.focusedComponent) {
      this.currentState.focusedComponent = adaptation.primaryComponent;
      changed = true;
    }
    
    if (changed && this.adaptiveUI.mainWindow) {
      this.adaptiveUI.mainWindow.webContents.send('adaptive-layout-change', {
        layout: this.currentState,
        source: 'learning'
      });
      
      await super.applyAdaptation(adaptation);
    }
  }
  
  async runPeriodicAdaptation(behaviorData) {
    // Analyze component usage patterns
    const componentUsage = new Map();
    behaviorData.forEach(interaction => {
      if (interaction.component !== 'ui') {
        componentUsage.set(interaction.component, (componentUsage.get(interaction.component) || 0) + 1);
      }
    });
    
    const totalInteractions = behaviorData.length;
    const sortedUsage = Array.from(componentUsage.entries())
      .sort((a, b) => b[1] - a[1]);
    
    // Suggest layout changes based on usage
    if (sortedUsage.length > 0) {
      const topComponent = sortedUsage[0];
      const usagePercent = topComponent[1] / totalInteractions;
      
      if (usagePercent > 0.4) { // Component used in 40%+ of interactions
        await this.suggestAdaptation({
          focusComponent: topComponent[0],
          reason: `${topComponent[0]} used in ${Math.round(usagePercent * 100)}% of interactions`,
          confidence: usagePercent
        });
      }
      
      // Suggest compact mode for power users
      if (componentUsage.size >= 4) {
        await this.suggestAdaptation({
          compactMode: true,
          reason: 'Multiple components used regularly',
          confidence: 0.7
        });
      }
    }
  }
}

class ShortcutAdapter extends BaseAdapter {
  async initialize() {
    this.currentState = { 
      customShortcuts: new Map(),
      mostUsedActions: new Map()
    };
  }
  
  async runPeriodicAdaptation(behaviorData) {
    // Track action frequency
    const actionFreq = new Map();
    behaviorData.forEach(interaction => {
      const actionKey = `${interaction.component}:${interaction.action}`;
      actionFreq.set(actionKey, (actionFreq.get(actionKey) || 0) + 1);
    });
    
    // Suggest shortcuts for frequently used actions
    const sortedActions = Array.from(actionFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    const suggestions = [];
    sortedActions.forEach(([action, count]) => {
      if (count > 20 && !this.currentState.customShortcuts.has(action)) {
        suggestions.push({
          action,
          count,
          suggestedShortcut: this.generateShortcut(action)
        });
      }
    });
    
    if (suggestions.length > 0 && this.adaptiveUI.mainWindow) {
      this.adaptiveUI.mainWindow.webContents.send('adaptive-shortcut-suggestions', suggestions);
    }
  }
  
  generateShortcut(action) {
    const [component, actionName] = action.split(':');
    const shortcuts = {
      'chatai:send_message': 'Ctrl+Enter',
      'voice:start_listening': 'Alt+V',
      'workflow:execute': 'Ctrl+Shift+W',
      'ocr:scan': 'Ctrl+Shift+S'
    };
    
    return shortcuts[action] || `Ctrl+Shift+${component.charAt(0).toUpperCase()}`;
  }
}

class NotificationAdapter extends BaseAdapter {
  async initialize() {
    this.currentState = { 
      frequency: 'normal',
      engagement: 0.5,
      preferences: {}
    };
  }
  
  async applyAdaptation(adaptation) {
    if (adaptation.frequency && adaptation.frequency !== this.currentState.frequency) {
      this.currentState.frequency = adaptation.frequency;
      
      if (this.adaptiveUI.mainWindow) {
        this.adaptiveUI.mainWindow.webContents.send('adaptive-notification-settings', {
          frequency: adaptation.frequency,
          importance: adaptation.importance || 'normal'
        });
      }
      
      await super.applyAdaptation(adaptation);
    }
  }
  
  async runPeriodicAdaptation(behaviorData) {
    // Analyze notification interactions
    const notificationData = behaviorData.filter(i => 
      i.component === 'notification' || i.action.includes('notification')
    );
    
    if (notificationData.length > 0) {
      const dismissed = notificationData.filter(i => i.action === 'dismiss').length;
      const clicked = notificationData.filter(i => i.action === 'click').length;
      const engagement = clicked / notificationData.length;
      
      this.currentState.engagement = engagement;
      
      // Adjust notification frequency based on engagement
      if (engagement < 0.2) {
        await this.applyAdaptation({ frequency: 'minimal' });
      } else if (engagement > 0.8) {
        await this.applyAdaptation({ frequency: 'detailed' });
      }
    }
  }
}

class AccessibilityAdapter extends BaseAdapter {
  async initialize() {
    this.currentState = {
      fontSize: 'normal',
      highContrast: false,
      reducedMotion: false
    };
  }
  
  async runPeriodicAdaptation(behaviorData) {
    // Analyze interaction patterns that might indicate accessibility needs
    const longDurations = behaviorData.filter(i => i.duration && i.duration > 10000);
    const errors = behaviorData.filter(i => i.outcome === 'failed' || i.outcome === 'error');
    
    // Suggest accessibility improvements if needed
    if (longDurations.length > behaviorData.length * 0.3) {
      await this.suggestAdaptation({
        fontSize: 'large',
        reason: 'Longer interaction times detected',
        confidence: 0.6
      });
    }
    
    if (errors.length > behaviorData.length * 0.2) {
      await this.suggestAdaptation({
        highContrast: true,
        reason: 'High error rate detected',
        confidence: 0.7
      });
    }
  }

  // Additional methods for testing
  async adaptTheme(context) {
    const themeMap = { evening: 'dark', night: 'dark', morning: 'light' };
    const theme = context.userPreference || themeMap[context.timeOfDay] || 'auto';
    
    await this.applyAdaptation({ theme }, 'theme-test');
    this.adaptationHistory.push({
      type: 'theme',
      timestamp: Date.now(),
      context,
      result: { theme }
    });
    
    return { success: true, theme };
  }

  async adaptLayout(context) {
    const layout = {
      layout: context.userBehavior === 'power-user' ? 'advanced' : 'simple',
      compactMode: context.screenSize === 'small',
      focusedComponent: context.frequentFeatures?.[0] || 'default'
    };
    
    await this.applyAdaptation({ layout }, 'layout-test');
    this.adaptationHistory.push({
      type: 'layout',
      timestamp: Date.now(),
      context,
      result: layout
    });
    
    return { success: true, layout };
  }

  async adaptShortcuts(context) {
    const shortcuts = context.frequentActions?.slice(0, 3).map(action => ({
      key: action.action.replace('-', '+'),
      command: action.action
    })) || [];
    
    await this.applyAdaptation({ shortcuts }, 'shortcuts-test');
    this.adaptationHistory.push({
      type: 'shortcuts',
      timestamp: Date.now(),
      context,
      result: { shortcuts }
    });
    
    return { success: true, shortcuts };
  }

  getAdaptationHistory() {
    return this.adaptationHistory || [];
  }
}

module.exports = { AdaptiveUISystem };