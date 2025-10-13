/**
 * I18nManager - Internationalization Manager for MIC Browser Ultimate
 * Handles multi-language support with dynamic language switching
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class I18nManager extends EventEmitter {
    constructor() {
        super();
        this.currentLanguage = 'en';
        this.fallbackLanguage = 'en';
        this.translations = new Map();
        this.localesPath = path.join(__dirname, 'locales');
        this.availableLanguages = new Map();
        this.initialized = false;
        
        // Language metadata
        this.languageInfo = {
            'en': { 
                name: 'English', 
                nativeName: 'English',
                direction: 'ltr',
                dateFormat: 'MM/DD/YYYY',
                timeFormat: '12h',
                currency: 'USD'
            },
            'es': { 
                name: 'Spanish', 
                nativeName: 'Español',
                direction: 'ltr',
                dateFormat: 'DD/MM/YYYY',
                timeFormat: '24h',
                currency: 'EUR'
            },
            'fr': { 
                name: 'French', 
                nativeName: 'Français',
                direction: 'ltr',
                dateFormat: 'DD/MM/YYYY',
                timeFormat: '24h',
                currency: 'EUR'
            },
            'de': { 
                name: 'German', 
                nativeName: 'Deutsch',
                direction: 'ltr',
                dateFormat: 'DD.MM.YYYY',
                timeFormat: '24h',
                currency: 'EUR'
            },
            'ja': { 
                name: 'Japanese', 
                nativeName: '日本語',
                direction: 'ltr',
                dateFormat: 'YYYY/MM/DD',
                timeFormat: '24h',
                currency: 'JPY'
            },
            'zh-CN': { 
                name: 'Chinese (Simplified)', 
                nativeName: '中文（简体）',
                direction: 'ltr',
                dateFormat: 'YYYY-MM-DD',
                timeFormat: '24h',
                currency: 'CNY'
            }
        };
    }

    /**
     * Initialize the I18n manager
     */
    async initialize() {
        try {
            console.log('🌐 Initializing I18n Manager...');
            
            // Load all available language files
            await this.loadAvailableLanguages();
            
            // Load default language
            await this.loadLanguage(this.currentLanguage);
            
            this.initialized = true;
            console.log(`✅ I18n Manager initialized with ${this.availableLanguages.size} languages`);
            
            this.emit('initialized');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize I18n Manager:', error);
            return false;
        }
    }

    /**
     * Load all available language files from the locales directory
     */
    async loadAvailableLanguages() {
        try {
            if (!fs.existsSync(this.localesPath)) {
                console.warn('⚠️ Locales directory not found:', this.localesPath);
                return;
            }

            const files = fs.readdirSync(this.localesPath);
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const langCode = path.basename(file, '.json');
                    const filePath = path.join(this.localesPath, file);
                    
                    try {
                        // Validate the language file
                        const content = fs.readFileSync(filePath, 'utf8');
                        const translations = JSON.parse(content);
                        
                        this.availableLanguages.set(langCode, {
                            code: langCode,
                            filePath: filePath,
                            loaded: false,
                            info: this.languageInfo[langCode] || {
                                name: langCode.toUpperCase(),
                                nativeName: langCode.toUpperCase(),
                                direction: 'ltr',
                                dateFormat: 'MM/DD/YYYY',
                                timeFormat: '12h',
                                currency: 'USD'
                            }
                        });
                        
                        console.log(`📄 Found language file: ${langCode}`);
                    } catch (parseError) {
                        console.warn(`⚠️ Invalid language file ${file}:`, parseError.message);
                    }
                }
            }

            console.log(`🌍 Discovered ${this.availableLanguages.size} language(s)`);
        } catch (error) {
            console.error('❌ Error loading available languages:', error);
        }
    }

    /**
     * Load a specific language
     */
    async loadLanguage(langCode) {
        try {
            const langInfo = this.availableLanguages.get(langCode);
            
            if (!langInfo) {
                console.warn(`⚠️ Language not found: ${langCode}`);
                return false;
            }

            if (langInfo.loaded && this.translations.has(langCode)) {
                console.log(`✅ Language ${langCode} already loaded`);
                return true;
            }

            const content = fs.readFileSync(langInfo.filePath, 'utf8');
            const translations = JSON.parse(content);
            
            this.translations.set(langCode, translations);
            langInfo.loaded = true;
            
            console.log(`🔄 Loaded language: ${langCode}`);
            return true;
        } catch (error) {
            console.error(`❌ Error loading language ${langCode}:`, error);
            return false;
        }
    }

    /**
     * Set the current language
     */
    async setLanguage(langCode) {
        try {
            if (langCode === this.currentLanguage) {
                return true;
            }

            // Load the language if not already loaded
            const loaded = await this.loadLanguage(langCode);
            
            if (!loaded) {
                console.warn(`⚠️ Failed to load language: ${langCode}`);
                return false;
            }

            const previousLanguage = this.currentLanguage;
            this.currentLanguage = langCode;
            
            console.log(`🌐 Language changed: ${previousLanguage} → ${langCode}`);
            
            // Emit language change event
            this.emit('languageChanged', {
                from: previousLanguage,
                to: langCode,
                info: this.getLanguageInfo(langCode)
            });

            return true;
        } catch (error) {
            console.error(`❌ Error setting language to ${langCode}:`, error);
            return false;
        }
    }

    /**
     * Translate a key to the current language
     */
    t(key, interpolations = {}) {
        try {
            // Get translation from current language
            let translation = this.getTranslation(this.currentLanguage, key);
            
            // Fall back to default language if translation not found
            if (translation === key && this.currentLanguage !== this.fallbackLanguage) {
                translation = this.getTranslation(this.fallbackLanguage, key);
            }
            
            // Perform string interpolation
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
     * Get a translation from a specific language
     */
    getTranslation(langCode, key) {
        const translations = this.translations.get(langCode);
        
        if (!translations) {
            return key;
        }

        // Support nested keys like "app.title"
        const keys = key.split('.');
        let value = translations;
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return key; // Key not found
            }
        }
        
        return value !== null && value !== undefined ? value : key;
    }

    /**
     * Perform string interpolation
     */
    interpolate(template, values) {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return values.hasOwnProperty(key) ? values[key] : match;
        });
    }

    /**
     * Get information about a language
     */
    getLanguageInfo(langCode) {
        const langData = this.availableLanguages.get(langCode);
        return langData ? langData.info : null;
    }

    /**
     * Get current language code
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    /**
     * Get all available languages
     */
    getAvailableLanguages() {
        const languages = [];
        
        for (const [code, data] of this.availableLanguages) {
            languages.push({
                code: code,
                name: data.info.name,
                nativeName: data.info.nativeName,
                direction: data.info.direction,
                loaded: data.loaded
            });
        }
        
        return languages;
    }

    /**
     * Check if a language is available
     */
    hasLanguage(langCode) {
        return this.availableLanguages.has(langCode);
    }

    /**
     * Get formatted date according to current language
     */
    formatDate(date, format = null) {
        const langInfo = this.getLanguageInfo(this.currentLanguage);
        const dateFormat = format || (langInfo ? langInfo.dateFormat : 'MM/DD/YYYY');
        
        if (!date) date = new Date();
        
        try {
            // Simple date formatting - in production, consider using a library like moment.js or date-fns
            const options = {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            };
            
            return date.toLocaleDateString(this.currentLanguage, options);
        } catch (error) {
            return date.toLocaleDateString();
        }
    }

    /**
     * Get formatted time according to current language
     */
    formatTime(date, format = null) {
        const langInfo = this.getLanguageInfo(this.currentLanguage);
        const timeFormat = format || (langInfo ? langInfo.timeFormat : '12h');
        
        if (!date) date = new Date();
        
        try {
            const options = {
                hour: '2-digit',
                minute: '2-digit',
                hour12: timeFormat === '12h'
            };
            
            return date.toLocaleTimeString(this.currentLanguage, options);
        } catch (error) {
            return date.toLocaleTimeString();
        }
    }

    /**
     * Format numbers according to current language
     */
    formatNumber(number, options = {}) {
        try {
            return number.toLocaleString(this.currentLanguage, options);
        } catch (error) {
            return number.toString();
        }
    }

    /**
     * Format currency according to current language
     */
    formatCurrency(amount, currency = null) {
        const langInfo = this.getLanguageInfo(this.currentLanguage);
        const currencyCode = currency || (langInfo ? langInfo.currency : 'USD');
        
        try {
            return amount.toLocaleString(this.currentLanguage, {
                style: 'currency',
                currency: currencyCode
            });
        } catch (error) {
            return `${currencyCode} ${amount}`;
        }
    }

    /**
     * Get text direction for current language
     */
    getDirection() {
        const langInfo = this.getLanguageInfo(this.currentLanguage);
        return langInfo ? langInfo.direction : 'ltr';
    }

    /**
     * Pluralization helper
     */
    plural(key, count, interpolations = {}) {
        const pluralKey = count === 1 ? `${key}.one` : `${key}.other`;
        const translation = this.t(pluralKey, { ...interpolations, count });
        
        // Fallback to base key if plural form not found
        return translation === pluralKey ? this.t(key, { ...interpolations, count }) : translation;
    }

    /**
     * Get translation keys for debugging
     */
    getTranslationKeys(langCode = null) {
        const code = langCode || this.currentLanguage;
        const translations = this.translations.get(code);
        
        if (!translations) {
            return [];
        }
        
        const keys = [];
        
        function extractKeys(obj, prefix = '') {
            for (const key in obj) {
                const fullKey = prefix ? `${prefix}.${key}` : key;
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    extractKeys(obj[key], fullKey);
                } else {
                    keys.push(fullKey);
                }
            }
        }
        
        extractKeys(translations);
        return keys;
    }

    /**
     * Validate translation completeness
     */
    validateTranslations() {
        const baseKeys = this.getTranslationKeys(this.fallbackLanguage);
        const results = {};
        
        for (const [langCode] of this.availableLanguages) {
            if (langCode === this.fallbackLanguage) continue;
            
            const langKeys = this.getTranslationKeys(langCode);
            const missing = baseKeys.filter(key => !langKeys.includes(key));
            const extra = langKeys.filter(key => !baseKeys.includes(key));
            
            results[langCode] = {
                total: baseKeys.length,
                translated: langKeys.length,
                missing: missing,
                extra: extra,
                completeness: ((langKeys.length - extra.length) / baseKeys.length * 100).toFixed(2)
            };
        }
        
        return results;
    }

    /**
     * Export current translations for external use
     */
    exportTranslations(langCode = null) {
        const code = langCode || this.currentLanguage;
        return this.translations.get(code) || {};
    }

    /**
     * Reload all translations (useful for development)
     */
    async reload() {
        console.log('🔄 Reloading I18n Manager...');
        
        // Clear current translations
        this.translations.clear();
        this.availableLanguages.clear();
        
        // Reload everything
        await this.loadAvailableLanguages();
        await this.loadLanguage(this.currentLanguage);
        
        this.emit('reloaded');
        console.log('✅ I18n Manager reloaded');
    }

    /**
     * Get statistics about the i18n system
     */
    getStats() {
        return {
            currentLanguage: this.currentLanguage,
            fallbackLanguage: this.fallbackLanguage,
            totalLanguages: this.availableLanguages.size,
            loadedLanguages: Array.from(this.translations.keys()),
            direction: this.getDirection(),
            initialized: this.initialized
        };
    }
}

// Create and export singleton instance
const i18nManager = new I18nManager();

module.exports = {
    I18nManager,
    i18n: i18nManager
};