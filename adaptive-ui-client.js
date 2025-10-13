// Client-side Adaptive UI Handler
// Handles adaptive UI changes sent from the main process

class AdaptiveUIClient {
  constructor() {
    this.currentTheme = 'auto';
    this.currentLayout = 'default';
    this.adaptationHistory = [];
    this.userPreferences = {
      autoAcceptAdaptations: false,
      adaptationSensitivity: 'medium',
      allowThemeChanges: true,
      allowLayoutChanges: true
    };
    
    this.initialize();
  }
  
  initialize() {
    // Listen for adaptive changes from main process
    if (window.electronAPI) {
      window.electronAPI.onAdaptiveThemeChange(this.handleThemeChange.bind(this));
      window.electronAPI.onAdaptiveLayoutChange(this.handleLayoutChange.bind(this));
      window.electronAPI.onAdaptiveThemeSuggestion(this.handleThemeSuggestion.bind(this));
      window.electronAPI.onAdaptiveNotificationSettings(this.handleNotificationSettings.bind(this));
      window.electronAPI.onAdaptiveShortcutSuggestions(this.handleShortcutSuggestions.bind(this));
    }
    
    // Setup UI elements for adaptation feedback
    this.createAdaptationUI();
    
    // Load user preferences
    this.loadUserPreferences();
    
    console.log('🎨 Adaptive UI Client initialized');
  }
  
  createAdaptationUI() {
    // Create notification area for adaptation suggestions
    const adaptationContainer = document.createElement('div');
    adaptationContainer.id = 'adaptation-notifications';
    adaptationContainer.className = 'adaptation-notifications';
    adaptationContainer.innerHTML = `
      <style>
        .adaptation-notifications {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10000;
          max-width: 350px;
        }
        
        .adaptation-suggestion {
          background: var(--card-bg, #ffffff);
          border: 1px solid var(--border-color, #e0e0e0);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          animation: slideIn 0.3s ease-out;
        }
        
        .adaptation-suggestion.theme-dark {
          background: #2a2a2a;
          border-color: #404040;
          color: #ffffff;
        }
        
        .adaptation-suggestion h4 {
          margin: 0 0 8px 0;
          color: var(--accent-blue, #0066cc);
          font-size: 14px;
          font-weight: 600;
        }
        
        .adaptation-suggestion p {
          margin: 0 0 12px 0;
          font-size: 13px;
          color: var(--text-secondary, #666666);
          line-height: 1.4;
        }
        
        .adaptation-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }
        
        .adaptation-btn {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .adaptation-btn.primary {
          background: var(--accent-blue, #0066cc);
          color: white;
        }
        
        .adaptation-btn.secondary {
          background: var(--surface-secondary, #f5f5f5);
          color: var(--text-primary, #333333);
        }
        
        .adaptation-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .adaptation-history-toggle {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: var(--accent-blue, #0066cc);
          color: white;
          border: none;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          font-size: 20px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          transition: all 0.3s ease;
          z-index: 9999;
        }
        
        .adaptation-history-toggle:hover {
          transform: scale(1.1);
        }
        
        .adaptation-history-panel {
          position: fixed;
          bottom: 80px;
          right: 20px;
          width: 300px;
          max-height: 400px;
          background: var(--card-bg, #ffffff);
          border: 1px solid var(--border-color, #e0e0e0);
          border-radius: 8px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
          overflow: hidden;
          display: none;
          z-index: 9998;
        }
        
        .adaptation-history-header {
          padding: 16px;
          background: var(--surface-secondary, #f8f9fa);
          border-bottom: 1px solid var(--border-color, #e0e0e0);
          font-weight: 600;
          font-size: 14px;
        }
        
        .adaptation-history-list {
          max-height: 300px;
          overflow-y: auto;
          padding: 8px 0;
        }
        
        .adaptation-history-item {
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-light, #f0f0f0);
          font-size: 12px;
        }
        
        .adaptation-history-item:last-child {
          border-bottom: none;
        }
        
        .adaptation-history-item .timestamp {
          color: var(--text-secondary, #666666);
          font-size: 11px;
        }
        
        .adaptation-history-item .change {
          font-weight: 500;
          margin-top: 4px;
        }
      </style>
    `;
    
    document.body.appendChild(adaptationContainer);
    
    // Create history toggle button
    const historyToggle = document.createElement('button');
    historyToggle.className = 'adaptation-history-toggle';
    historyToggle.innerHTML = '🎨';
    historyToggle.title = 'View Adaptation History';
    historyToggle.onclick = this.toggleAdaptationHistory.bind(this);
    document.body.appendChild(historyToggle);
    
    // Create history panel
    const historyPanel = document.createElement('div');
    historyPanel.className = 'adaptation-history-panel';
    historyPanel.innerHTML = `
      <div class="adaptation-history-header">
        Learning Adaptations
        <button style="float: right; background: none; border: none; cursor: pointer;" onclick="this.parentElement.parentElement.style.display='none'">×</button>
      </div>
      <div class="adaptation-history-list" id="adaptation-history-list"></div>
    `;
    document.body.appendChild(historyPanel);
  }
  
  handleThemeChange(data) {
    if (!this.userPreferences.allowThemeChanges) return;
    
    console.log('🎨 Applying theme change:', data);
    
    this.currentTheme = data.theme;
    this.applyTheme(data.theme);
    
    this.recordAdaptation({
      type: 'theme',
      change: `Theme changed to ${data.theme}`,
      source: data.source,
      automatic: true
    });
    
    // Show subtle notification
    this.showAdaptationNotification({
      title: 'Theme Adapted',
      message: `Switched to ${data.theme} theme based on your usage patterns`,
      type: 'info',
      autoClose: true
    });
  }
  
  handleLayoutChange(data) {
    if (!this.userPreferences.allowLayoutChanges) return;
    
    console.log('🎨 Applying layout change:', data);
    
    this.currentLayout = data.layout;
    this.applyLayout(data.layout);
    
    this.recordAdaptation({
      type: 'layout',
      change: `Layout adapted: ${JSON.stringify(data.layout)}`,
      source: data.source,
      automatic: true
    });
  }
  
  handleThemeSuggestion(suggestion) {
    if (this.userPreferences.autoAcceptAdaptations) {
      this.acceptSuggestion('theme', suggestion);
      return;
    }
    
    this.showAdaptationSuggestion({
      type: 'theme',
      title: 'Theme Suggestion',
      message: `Switch to ${suggestion.theme} theme? ${suggestion.reason || ''}`,
      suggestion,
      actions: [
        {
          text: 'Apply',
          action: () => this.acceptSuggestion('theme', suggestion)
        },
        {
          text: 'Dismiss',
          action: () => this.dismissSuggestion('theme', suggestion)
        }
      ]
    });
  }
  
  handleNotificationSettings(settings) {
    console.log('🔔 Updating notification settings:', settings);
    
    // Apply notification settings to the app
    if (window.micBrowser && window.micBrowser.notifications) {
      window.micBrowser.notifications.updateSettings(settings);
    }
    
    this.recordAdaptation({
      type: 'notifications',
      change: `Notification frequency: ${settings.frequency}`,
      source: 'learning',
      automatic: true
    });
  }
  
  handleShortcutSuggestions(suggestions) {
    if (suggestions.length === 0) return;
    
    const topSuggestion = suggestions[0];
    
    this.showAdaptationSuggestion({
      type: 'shortcuts',
      title: 'Shortcut Suggestion',
      message: `Add shortcut ${topSuggestion.suggestedShortcut} for ${topSuggestion.action}? You've used this action ${topSuggestion.count} times.`,
      suggestion: topSuggestion,
      actions: [
        {
          text: 'Add Shortcut',
          action: () => this.acceptShortcutSuggestion(topSuggestion)
        },
        {
          text: 'Not Now',
          action: () => this.dismissSuggestion('shortcuts', topSuggestion)
        }
      ]
    });
  }
  
  applyTheme(theme) {
    const root = document.documentElement;
    const body = document.body;
    
    // Remove existing theme classes
    body.classList.remove('theme-light', 'theme-dark', 'theme-auto');
    
    if (theme === 'dark') {
      body.classList.add('theme-dark');
      root.style.setProperty('--bg-primary', '#1a1a1a');
      root.style.setProperty('--bg-secondary', '#2a2a2a');
      root.style.setProperty('--text-primary', '#ffffff');
      root.style.setProperty('--text-secondary', '#b0b0b0');
      root.style.setProperty('--border-color', '#404040');
    } else if (theme === 'light') {
      body.classList.add('theme-light');
      root.style.setProperty('--bg-primary', '#ffffff');
      root.style.setProperty('--bg-secondary', '#f8f9fa');
      root.style.setProperty('--text-primary', '#333333');
      root.style.setProperty('--text-secondary', '#666666');
      root.style.setProperty('--border-color', '#e0e0e0');
    } else {
      body.classList.add('theme-auto');
      // Auto theme based on system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.applyTheme(prefersDark ? 'dark' : 'light');
      return;
    }
    
    // Update adaptation notification styles
    const suggestions = document.querySelectorAll('.adaptation-suggestion');
    suggestions.forEach(suggestion => {
      if (theme === 'dark') {
        suggestion.classList.add('theme-dark');
      } else {
        suggestion.classList.remove('theme-dark');
      }
    });
  }
  
  applyLayout(layoutData) {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const panels = document.querySelectorAll('.sidebar-panel');
    
    if (layoutData.compactMode) {
      document.body.classList.add('compact-mode');
    } else {
      document.body.classList.remove('compact-mode');
    }
    
    if (layoutData.focusedComponent) {
      // Highlight or expand the focused component's panel
      panels.forEach(panel => {
        if (panel.id === `${layoutData.focusedComponent}Panel`) {
          panel.classList.add('focused-component');
        } else {
          panel.classList.remove('focused-component');
        }
      });
    }
    
    if (layoutData.layout === 'focused') {
      document.body.classList.add('layout-focused');
    } else {
      document.body.classList.remove('layout-focused');
    }
  }
  
  showAdaptationSuggestion(data) {
    const container = document.getElementById('adaptation-notifications');
    const suggestion = document.createElement('div');
    suggestion.className = 'adaptation-suggestion';
    suggestion.innerHTML = `
      <h4>💡 ${data.title}</h4>
      <p>${data.message}</p>
      <div class="adaptation-actions">
        ${data.actions.map((action, index) => 
          `<button class="adaptation-btn ${index === 0 ? 'primary' : 'secondary'}" 
                   onclick="this.closest('.adaptation-suggestion').remove(); (${action.action.toString()})()">${action.text}</button>`
        ).join('')}
      </div>
    `;
    
    // Apply current theme
    if (this.currentTheme === 'dark') {
      suggestion.classList.add('theme-dark');
    }
    
    container.appendChild(suggestion);
    
    // Auto-remove after 30 seconds if not interacted with
    setTimeout(() => {
      if (suggestion.parentNode) {
        suggestion.remove();
      }
    }, 30000);
  }
  
  showAdaptationNotification(data) {
    if (!data.autoClose) {
      this.showAdaptationSuggestion({
        ...data,
        actions: [{ text: 'OK', action: () => {} }]
      });
      return;
    }
    
    const container = document.getElementById('adaptation-notifications');
    const notification = document.createElement('div');
    notification.className = 'adaptation-suggestion';
    notification.innerHTML = `
      <h4>✨ ${data.title}</h4>
      <p>${data.message}</p>
    `;
    
    if (this.currentTheme === 'dark') {
      notification.classList.add('theme-dark');
    }
    
    container.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => notification.remove(), 300);
      }
    }, 5000);
  }
  
  acceptSuggestion(type, suggestion) {
    console.log(`✅ Accepting ${type} suggestion:`, suggestion);
    
    if (type === 'theme') {
      this.applyTheme(suggestion.theme);
      this.currentTheme = suggestion.theme;
    }
    
    this.recordAdaptation({
      type,
      change: `Accepted suggestion: ${JSON.stringify(suggestion)}`,
      source: 'user_accepted',
      automatic: false
    });
    
    // Send acceptance back to main process
    if (window.electronAPI) {
      window.electronAPI.sendLearningFeedback('suggestion_accepted', {
        type,
        suggestion,
        timestamp: Date.now()
      });
    }
  }
  
  dismissSuggestion(type, suggestion) {
    console.log(`❌ Dismissing ${type} suggestion:`, suggestion);
    
    this.recordAdaptation({
      type,
      change: `Dismissed suggestion: ${JSON.stringify(suggestion)}`,
      source: 'user_dismissed',
      automatic: false
    });
    
    // Send dismissal back to main process
    if (window.electronAPI) {
      window.electronAPI.sendLearningFeedback('suggestion_dismissed', {
        type,
        suggestion,
        timestamp: Date.now()
      });
    }
  }
  
  acceptShortcutSuggestion(suggestion) {
    // Add the shortcut to the system
    if (window.micBrowser && window.micBrowser.shortcuts) {
      window.micBrowser.shortcuts.add(suggestion.suggestedShortcut, suggestion.action);
    }
    
    this.recordAdaptation({
      type: 'shortcuts',
      change: `Added shortcut: ${suggestion.suggestedShortcut} for ${suggestion.action}`,
      source: 'user_accepted',
      automatic: false
    });
    
    this.showAdaptationNotification({
      title: 'Shortcut Added',
      message: `${suggestion.suggestedShortcut} now triggers ${suggestion.action}`,
      type: 'success',
      autoClose: true
    });
  }
  
  recordAdaptation(adaptation) {
    adaptation.timestamp = Date.now();
    this.adaptationHistory.push(adaptation);
    
    // Keep only last 50 adaptations
    if (this.adaptationHistory.length > 50) {
      this.adaptationHistory = this.adaptationHistory.slice(-50);
    }
    
    this.updateAdaptationHistoryDisplay();
  }
  
  updateAdaptationHistoryDisplay() {
    const list = document.getElementById('adaptation-history-list');
    if (!list) return;
    
    list.innerHTML = this.adaptationHistory.slice(-10).reverse().map(adaptation => `
      <div class="adaptation-history-item">
        <div class="timestamp">${new Date(adaptation.timestamp).toLocaleString()}</div>
        <div class="change">${adaptation.change}</div>
        <div style="font-size: 11px; color: var(--text-secondary);">
          ${adaptation.source} ${adaptation.automatic ? '(automatic)' : '(manual)'}
        </div>
      </div>
    `).join('');
  }
  
  toggleAdaptationHistory() {
    const panel = document.querySelector('.adaptation-history-panel');
    if (panel.style.display === 'none' || !panel.style.display) {
      panel.style.display = 'block';
      this.updateAdaptationHistoryDisplay();
    } else {
      panel.style.display = 'none';
    }
  }
  
  loadUserPreferences() {
    const saved = localStorage.getItem('adaptiveUIPreferences');
    if (saved) {
      try {
        this.userPreferences = { ...this.userPreferences, ...JSON.parse(saved) };
      } catch (error) {
        console.error('Error loading adaptive UI preferences:', error);
      }
    }
  }
  
  saveUserPreferences() {
    localStorage.setItem('adaptiveUIPreferences', JSON.stringify(this.userPreferences));
  }
  
  updatePreference(key, value) {
    this.userPreferences[key] = value;
    this.saveUserPreferences();
  }
  
  // Public API
  getAdaptationHistory() {
    return [...this.adaptationHistory];
  }
  
  getCurrentState() {
    return {
      theme: this.currentTheme,
      layout: this.currentLayout,
      preferences: { ...this.userPreferences }
    };
  }
  
  resetAdaptations() {
    this.adaptationHistory = [];
    this.applyTheme('auto');
    this.applyLayout({ layout: 'default' });
    this.updateAdaptationHistoryDisplay();
    
    this.showAdaptationNotification({
      title: 'Adaptations Reset',
      message: 'All adaptive UI changes have been reset to defaults',
      type: 'info',
      autoClose: true
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.adaptiveUI = new AdaptiveUIClient();
  });
} else {
  window.adaptiveUI = new AdaptiveUIClient();
}

// Add CSS for slideOut animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);