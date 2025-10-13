/**
 * Client-side I18n Helper for MIC Browser Ultimate
 * Provides translation functionality for the browser interface
 */

class ClientI18n {
    constructor() {
        this.currentLanguage = 'en';
        this.translations = {};
        this.fallbackLanguage = 'en';
        this.initialized = false;
        this.observers = new Set();
        
        // DOM attribute selectors for automatic translation
        this.selectors = [
            '[data-i18n]',           // Main translation attribute
            '[data-i18n-title]',     // For title attributes
            '[data-i18n-placeholder]', // For placeholder attributes
            '[data-i18n-aria]'       // For aria-label attributes
        ];
        
        // Cache for translation elements to avoid repeated DOM queries
        this.elementCache = new Map();
        this.cacheInvalidated = true;
    }

    /**
     * Initialize the client-side i18n system
     */
    async init(initialLanguage = 'en') {
        try {
            console.log('🌐 Initializing Client I18n...');
            
            this.currentLanguage = initialLanguage;
            
            // Load initial language
            await this.loadLanguage(this.currentLanguage);
            
            // Set up DOM observer for dynamic content
            this.setupDOMObserver();
            
            this.initialized = true;
            console.log(`✅ Client I18n initialized with language: ${this.currentLanguage}`);
            
            // Translate existing content
            this.translatePage();
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Client I18n:', error);
            return false;
        }
    }

    /**
     * Load language data from the main process
     */
    async loadLanguage(langCode) {
        try {
            // Request translations from main process
            const result = await window.electronAPI.i18n.getTranslations(langCode);
            
            if (result && result.success && result.translations) {
                this.translations[langCode] = result.translations;
                console.log(`📄 Loaded translations for: ${langCode}`);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error(`❌ Error loading language ${langCode}:`, error);
            return false;
        }
    }

    /**
     * Change the current language
     */
    async changeLanguage(langCode) {
        if (langCode === this.currentLanguage) {
            return true;
        }

        try {
            // Load language if not already loaded
            if (!this.translations[langCode]) {
                const loaded = await this.loadLanguage(langCode);
                if (!loaded) {
                    console.warn(`⚠️ Failed to load language: ${langCode}`);
                    return false;
                }
            }

            const previousLanguage = this.currentLanguage;
            this.currentLanguage = langCode;
            
            // Update HTML lang attribute
            document.documentElement.lang = langCode;
            
            // Update text direction if needed
            const direction = this.getDirection(langCode);
            document.documentElement.dir = direction;
            
            // Translate all content
            this.translatePage();
            
            // Notify observers
            this.notifyLanguageChange(previousLanguage, langCode);
            
            // Save preference via i18n API (which saves to storage)
            await window.electronAPI.i18n.setLanguage(langCode);
            
            console.log(`🌐 Language changed: ${previousLanguage} → ${langCode}`);
            return true;
            
        } catch (error) {
            console.error(`❌ Error changing language to ${langCode}:`, error);
            return false;
        }
    }

    /**
     * Translate a key
     */
    t(key, interpolations = {}) {
        try {
            let translation = this.getTranslation(this.currentLanguage, key);
            
            // Fall back to default language
            if (translation === key && this.currentLanguage !== this.fallbackLanguage) {
                translation = this.getTranslation(this.fallbackLanguage, key);
            }
            
            // Perform interpolation
            if (typeof translation === 'string' && Object.keys(interpolations).length > 0) {
                translation = this.interpolate(translation, interpolations);
            }
            
            return translation;
        } catch (error) {
            console.warn(`⚠️ Translation error for key "${key}":`, error.message);
            return key;
        }
    }

    /**
     * Get translation from specific language
     */
    getTranslation(langCode, key) {
        const translations = this.translations[langCode];
        
        if (!translations) {
            return key;
        }

        const keys = key.split('.');
        let value = translations;
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return key;
            }
        }
        
        return value !== null && value !== undefined ? value : key;
    }

    /**
     * Interpolate variables in translation strings
     */
    interpolate(template, values) {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return values.hasOwnProperty(key) ? values[key] : match;
        });
    }

    /**
     * Translate the entire page
     */
    translatePage() {
        if (!this.initialized) return;
        
        // Update cache if needed
        if (this.cacheInvalidated) {
            this.rebuildElementCache();
        }
        
        // Translate cached elements
        for (const [element, config] of this.elementCache) {
            this.translateElement(element, config);
        }
        
        // Translate dynamic time/date elements
        this.translateDateTimeElements();
    }

    /**
     * Translate a single element
     */
    translateElement(element, config = null) {
        if (!element) return;
        
        const elementConfig = config || this.getElementConfig(element);
        
        // Translate text content
        if (elementConfig.textKey) {
            const translation = this.t(elementConfig.textKey, elementConfig.interpolations);
            if (element.textContent !== translation) {
                element.textContent = translation;
            }
        }
        
        // Translate attributes
        for (const [attr, key] of Object.entries(elementConfig.attributes)) {
            const translation = this.t(key, elementConfig.interpolations);
            if (element.getAttribute(attr) !== translation) {
                element.setAttribute(attr, translation);
            }
        }
    }

    /**
     * Get element configuration for translation
     */
    getElementConfig(element) {
        const config = {
            textKey: null,
            attributes: {},
            interpolations: {}
        };
        
        // Main text translation
        const textKey = element.getAttribute('data-i18n');
        if (textKey) {
            config.textKey = textKey;
        }
        
        // Attribute translations
        const titleKey = element.getAttribute('data-i18n-title');
        if (titleKey) {
            config.attributes['title'] = titleKey;
        }
        
        const placeholderKey = element.getAttribute('data-i18n-placeholder');
        if (placeholderKey) {
            config.attributes['placeholder'] = placeholderKey;
        }
        
        const ariaKey = element.getAttribute('data-i18n-aria');
        if (ariaKey) {
            config.attributes['aria-label'] = ariaKey;
        }
        
        // Interpolation data
        const interpolationData = element.getAttribute('data-i18n-data');
        if (interpolationData) {
            try {
                config.interpolations = JSON.parse(interpolationData);
            } catch (error) {
                console.warn('Invalid interpolation data:', interpolationData);
            }
        }
        
        return config;
    }

    /**
     * Rebuild element cache
     */
    rebuildElementCache() {
        this.elementCache.clear();
        
        for (const selector of this.selectors) {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
                const config = this.getElementConfig(element);
                this.elementCache.set(element, config);
            }
        }
        
        this.cacheInvalidated = false;
    }

    /**
     * Setup DOM observer for dynamic content
     */
    setupDOMObserver() {
        if (typeof MutationObserver !== 'undefined') {
            const observer = new MutationObserver((mutations) => {
                let hasNewElements = false;
                
                for (const mutation of mutations) {
                    if (mutation.type === 'childList') {
                        for (const node of mutation.addedNodes) {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                // Check if the added element or its children need translation
                                if (this.needsTranslation(node)) {
                                    hasNewElements = true;
                                    break;
                                }
                            }
                        }
                    }
                }
                
                if (hasNewElements) {
                    this.cacheInvalidated = true;
                    this.translatePage();
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }

    /**
     * Check if an element needs translation
     */
    needsTranslation(element) {
        for (const selector of this.selectors) {
            if (element.matches && element.matches(selector)) {
                return true;
            }
            if (element.querySelector && element.querySelector(selector)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Translate date/time elements
     */
    translateDateTimeElements() {
        const dateElements = document.querySelectorAll('[data-i18n-date]');
        for (const element of dateElements) {
            const date = new Date(element.getAttribute('data-i18n-date'));
            element.textContent = this.formatDate(date);
        }
        
        const timeElements = document.querySelectorAll('[data-i18n-time]');
        for (const element of timeElements) {
            const date = new Date(element.getAttribute('data-i18n-time'));
            element.textContent = this.formatTime(date);
        }
    }

    /**
     * Get text direction for language
     */
    getDirection(langCode = null) {
        const lang = langCode || this.currentLanguage;
        // RTL languages
        const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
        return rtlLanguages.includes(lang) ? 'rtl' : 'ltr';
    }

    /**
     * Format date according to current language
     */
    formatDate(date) {
        try {
            return date.toLocaleDateString(this.currentLanguage);
        } catch (error) {
            return date.toLocaleDateString();
        }
    }

    /**
     * Format time according to current language
     */
    formatTime(date) {
        try {
            return date.toLocaleTimeString(this.currentLanguage);
        } catch (error) {
            return date.toLocaleTimeString();
        }
    }

    /**
     * Format number according to current language
     */
    formatNumber(number, options = {}) {
        try {
            return number.toLocaleString(this.currentLanguage, options);
        } catch (error) {
            return number.toString();
        }
    }

    /**
     * Register an observer for language changes
     */
    onLanguageChange(callback) {
        this.observers.add(callback);
        return () => this.observers.delete(callback);
    }

    /**
     * Notify observers of language change
     */
    notifyLanguageChange(from, to) {
        for (const callback of this.observers) {
            try {
                callback({ from, to, currentLanguage: this.currentLanguage });
            } catch (error) {
                console.error('Error in language change observer:', error);
            }
        }
    }

    /**
     * Get available languages
     */
    async getAvailableLanguages() {
        try {
            const result = await window.electronAPI.i18n.getAvailableLanguages();
            return result && result.success ? result.languages : [];
        } catch (error) {
            console.error('Error getting available languages:', error);
            return [];
        }
    }

    /**
     * Get current language
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    /**
     * Utility method to add translation attributes to elements
     */
    addTranslationAttribute(element, key, type = 'text') {
        switch (type) {
            case 'text':
                element.setAttribute('data-i18n', key);
                break;
            case 'title':
                element.setAttribute('data-i18n-title', key);
                break;
            case 'placeholder':
                element.setAttribute('data-i18n-placeholder', key);
                break;
            case 'aria':
                element.setAttribute('data-i18n-aria', key);
                break;
        }
        
        // Invalidate cache and retranslate
        this.cacheInvalidated = true;
        this.translateElement(element);
    }

    /**
     * Pluralization helper
     */
    plural(key, count, interpolations = {}) {
        const pluralKey = count === 1 ? `${key}.one` : `${key}.other`;
        const translation = this.t(pluralKey, { ...interpolations, count });
        
        return translation === pluralKey ? this.t(key, { ...interpolations, count }) : translation;
    }
}

// Create global instance
window.i18n = new ClientI18n();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        // Get saved language preference or detect from system
        const savedLanguage = await window.electronAPI.i18n.getLanguagePreference() || 
                             navigator.language.split('-')[0] || 'en';
        await window.i18n.init(savedLanguage);
    });
} else {
    // DOM already loaded
    (async () => {
        const savedLanguage = await window.electronAPI.i18n.getLanguagePreference() || 
                             navigator.language.split('-')[0] || 'en';
        await window.i18n.init(savedLanguage);
    })();
}