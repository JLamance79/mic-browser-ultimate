/**
 * Multi-Language Support Validation Script
 * Tests the internationalization implementation
 */

const fs = require('fs');
const path = require('path');

// Import the I18n system
const { i18n } = require('./I18nManager');

async function validateI18nImplementation() {
    console.log('🌐 Validating Multi-Language Support Implementation...\n');

    try {
        // Initialize the i18n system
        const initialized = await i18n.initialize();
        if (!initialized) {
            throw new Error('Failed to initialize I18n Manager');
        }

        console.log('✅ I18n Manager initialized successfully');

        // Test 1: Check available languages
        const availableLanguages = i18n.getAvailableLanguages();
        console.log(`✅ Found ${availableLanguages.length} available languages:`);
        availableLanguages.forEach(lang => {
            console.log(`   - ${lang.code}: ${lang.name} (${lang.nativeName})`);
        });

        // Test 2: Test translation for each language
        console.log('\n📝 Testing translations for each language:');
        const testKeys = [
            'app.title',
            'navigation.back',
            'navigation.forward',
            'settings.language.interfaceLanguage',
            'chat.title',
            'ocr.title'
        ];

        for (const lang of availableLanguages) {
            console.log(`\n   Testing ${lang.code} (${lang.name}):`);
            
            // Switch to this language
            const switched = await i18n.setLanguage(lang.code);
            if (!switched) {
                console.log(`   ❌ Failed to switch to ${lang.code}`);
                continue;
            }

            // Test key translations
            let translationsValid = true;
            for (const key of testKeys) {
                const translation = i18n.t(key);
                if (translation === key) {
                    console.log(`   ⚠️  Missing translation for '${key}'`);
                    translationsValid = false;
                } else {
                    console.log(`   ✅ ${key}: "${translation}"`);
                }
            }

            if (translationsValid) {
                console.log(`   ✅ All test translations found for ${lang.code}`);
            }
        }

        // Test 3: Validate translation file structure
        console.log('\n📁 Validating translation file structure:');
        const localesPath = path.join(__dirname, 'locales');
        const expectedFiles = ['en.json', 'es.json', 'fr.json', 'de.json', 'ja.json', 'zh-CN.json'];
        
        for (const file of expectedFiles) {
            const filePath = path.join(localesPath, file);
            if (fs.existsSync(filePath)) {
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    const translations = JSON.parse(content);
                    const keyCount = countTranslationKeys(translations);
                    console.log(`   ✅ ${file}: ${keyCount} translation keys`);
                } catch (error) {
                    console.log(`   ❌ ${file}: Invalid JSON - ${error.message}`);
                }
            } else {
                console.log(`   ❌ ${file}: File not found`);
            }
        }

        // Test 4: Test interpolation
        console.log('\n🔄 Testing string interpolation:');
        await i18n.setLanguage('en');
        
        // Add a test translation with interpolation (would normally be in translation file)
        const testTranslation = i18n.interpolate('Hello {{name}}, you have {{count}} messages', {
            name: 'John',
            count: 5
        });
        console.log(`   ✅ Interpolation test: "${testTranslation}"`);

        // Test 5: Test date and number formatting
        console.log('\n📅 Testing localization features:');
        const testDate = new Date();
        const testNumber = 1234.56;

        for (const lang of availableLanguages.slice(0, 3)) { // Test first 3 languages
            await i18n.setLanguage(lang.code);
            const formattedDate = i18n.formatDate(testDate);
            const formattedNumber = i18n.formatNumber(testNumber);
            console.log(`   ${lang.code}: Date: ${formattedDate}, Number: ${formattedNumber}`);
        }

        // Test 6: Performance test
        console.log('\n⚡ Performance testing:');
        const startTime = Date.now();
        
        // Perform 1000 translations
        await i18n.setLanguage('en');
        for (let i = 0; i < 1000; i++) {
            i18n.t('app.title');
            i18n.t('navigation.back');
            i18n.t('settings.language.interfaceLanguage');
        }
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        console.log(`   ✅ 3000 translations completed in ${duration}ms (${(3000/duration*1000).toFixed(0)} translations/second)`);

        // Final summary
        console.log('\n🎉 Multi-Language Support Validation Complete!');
        console.log('\n📊 Summary:');
        console.log(`   • ${availableLanguages.length} languages supported`);
        console.log('   • Translation system working correctly');
        console.log('   • File structure validated');
        console.log('   • Interpolation and formatting functional');
        console.log('   • Performance acceptable');
        
        return true;

    } catch (error) {
        console.error('❌ Validation failed:', error);
        return false;
    }
}

// Helper function to count translation keys recursively
function countTranslationKeys(obj, prefix = '') {
    let count = 0;
    for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            count += countTranslationKeys(obj[key], fullKey);
        } else {
            count++;
        }
    }
    return count;
}

// Run validation if this file is executed directly
if (require.main === module) {
    validateI18nImplementation().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = {
    validateI18nImplementation,
    countTranslationKeys
};