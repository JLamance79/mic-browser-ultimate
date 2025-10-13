// =================================================================
// 🎨 LIVE THEME SYSTEM RUNTIME TEST
// =================================================================
// Copy and paste this entire script into the app's DevTools console
// (Open app, press F12, paste this code, press Enter)

console.clear();
console.log('🔬 LIVE THEME SYSTEM RUNTIME TEST');
console.log('================================');

// Global test state
let testResults = {
    passed: 0,
    failed: 0,
    tests: []
};

function logTest(name, passed, details = '') {
    const status = passed ? '✅' : '❌';
    const message = `${status} ${name}${details ? ' - ' + details : ''}`;
    console.log(message);
    
    testResults.tests.push({ name, passed, details });
    if (passed) testResults.passed++;
    else testResults.failed++;
}

// TEST 1: Environment Check
console.log('\n📋 TEST 1: Environment Check');
console.log('----------------------------');

logTest('Window object available', typeof window !== 'undefined');
logTest('Document object available', typeof document !== 'undefined');
logTest('ElectronAPI available', typeof window.electronAPI !== 'undefined');

// TEST 2: ThemeManager Availability
console.log('\n🎨 TEST 2: ThemeManager Availability');
console.log('-----------------------------------');

const themeManagerExists = typeof window.themeManager !== 'undefined';
logTest('ThemeManager exists', themeManagerExists);

if (themeManagerExists) {
    logTest('ThemeManager has changeTheme method', typeof window.themeManager.changeTheme === 'function');
    logTest('ThemeManager has getCurrentTheme method', typeof window.themeManager.getCurrentTheme === 'function');
    logTest('ThemeManager has getAvailableThemes method', typeof window.themeManager.getAvailableThemes === 'function');
    
    const currentTheme = window.themeManager.getCurrentTheme();
    logTest('Can get current theme', currentTheme !== null, currentTheme ? `Current: ${currentTheme.name}` : '');
}

// TEST 3: IPC Communication
console.log('\n📡 TEST 3: IPC Communication');
console.log('----------------------------');

if (window.electronAPI) {
    // Test get-theme
    window.electronAPI.getTheme().then(result => {
        logTest('getTheme IPC call', result.success, result.success ? `Theme: ${result.theme.name}` : result.error);
    }).catch(error => {
        logTest('getTheme IPC call', false, error.message);
    });
    
    // Test get-available-themes
    window.electronAPI.getAvailableThemes().then(result => {
        logTest('getAvailableThemes IPC call', result.success, result.success ? `Found ${result.themes.length} themes` : result.error);
        
        if (result.success) {
            const expectedThemes = ['dark', 'light', 'blue', 'purple'];
            const foundThemes = result.themes.map(t => t.name);
            expectedThemes.forEach(theme => {
                logTest(`Theme '${theme}' available`, foundThemes.includes(theme));
            });
        }
    }).catch(error => {
        logTest('getAvailableThemes IPC call', false, error.message);
    });
} else {
    logTest('ElectronAPI for IPC', false, 'ElectronAPI not available');
}

// TEST 4: CSS Variables
console.log('\n🎨 TEST 4: CSS Variables');
console.log('------------------------');

const cssVariables = [
    '--theme-background',
    '--theme-surface', 
    '--theme-primary',
    '--theme-text',
    '--theme-secondary',
    '--theme-accent',
    '--theme-success',
    '--theme-warning',
    '--theme-danger'
];

const rootStyles = getComputedStyle(document.documentElement);
cssVariables.forEach(varName => {
    const value = rootStyles.getPropertyValue(varName).trim();
    logTest(`CSS variable ${varName}`, value !== '', `Value: ${value || 'NOT SET'}`);
});

// TEST 5: Settings UI Elements
console.log('\n⚙️ TEST 5: Settings UI Elements');
console.log('------------------------------');

const themeSelector = document.getElementById('themeSelector');
const previewGrid = document.getElementById('themePreviewGrid');

logTest('Theme selector element', !!themeSelector);
logTest('Theme preview grid element', !!previewGrid);

if (previewGrid) {
    const previewCards = previewGrid.querySelectorAll('.theme-preview-card');
    logTest('Theme preview cards', previewCards.length > 0, `Found ${previewCards.length} cards`);
    
    // Check if cards have the correct theme data
    previewCards.forEach((card, index) => {
        const themeName = card.dataset.theme;
        logTest(`Preview card ${index + 1} has theme data`, !!themeName, `Theme: ${themeName}`);
    });
}

if (themeSelector) {
    const options = themeSelector.querySelectorAll('option');
    logTest('Theme selector has options', options.length > 0, `Found ${options.length} options`);
}

// TEST 6: Theme Switching
console.log('\n🔄 TEST 6: Theme Switching');
console.log('-------------------------');

if (themeManagerExists) {
    async function testThemeSwitching() {
        const themes = ['dark', 'light', 'blue', 'purple'];
        const originalTheme = window.themeManager.getCurrentTheme()?.name || 'dark';
        
        for (let i = 0; i < themes.length; i++) {
            const theme = themes[i];
            try {
                console.log(`🔄 Testing ${theme} theme...`);
                
                await window.themeManager.changeTheme(theme);
                
                // Wait a moment for CSS to update
                await new Promise(resolve => setTimeout(resolve, 100));
                
                const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--theme-background');
                const currentTheme = window.themeManager.getCurrentTheme();
                
                const success = currentTheme && currentTheme.name === theme && bgColor.trim() !== '';
                logTest(`Switch to ${theme} theme`, success, `Background: ${bgColor.trim()}`);
                
                // Brief pause between theme changes
                if (i < themes.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
                
            } catch (error) {
                logTest(`Switch to ${theme} theme`, false, error.message);
            }
        }
        
        // Return to original theme
        try {
            await window.themeManager.changeTheme(originalTheme);
            logTest('Return to original theme', true, `Back to ${originalTheme}`);
        } catch (error) {
            logTest('Return to original theme', false, error.message);
        }
    }
    
    testThemeSwitching();
} else {
    logTest('Theme switching test', false, 'ThemeManager not available');
}

// TEST 7: Event System
console.log('\n📡 TEST 7: Event System');
console.log('----------------------');

let eventReceived = false;
const eventListener = (event) => {
    eventReceived = true;
    logTest('Theme change event received', true, `New theme: ${event.detail.theme.name}`);
};

document.addEventListener('themeChanged', eventListener);

// TEST 8: Storage Persistence Test
console.log('\n💾 TEST 8: Storage Persistence');
console.log('-----------------------------');

if (window.electronAPI && themeManagerExists) {
    setTimeout(async () => {
        try {
            // Change to a specific theme
            await window.themeManager.changeTheme('blue');
            
            // Get the theme from storage
            const result = await window.electronAPI.getTheme();
            logTest('Theme persistence', result.success && result.theme.name === 'blue', 'Theme saved to storage');
            
        } catch (error) {
            logTest('Theme persistence', false, error.message);
        }
    }, 2000);
} else {
    logTest('Storage persistence test', false, 'Required APIs not available');
}

// TEST SUMMARY
setTimeout(() => {
    console.log('\n📊 TEST SUMMARY');
    console.log('===============');
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📊 Total: ${testResults.tests.length}`);
    console.log(`🎯 Success Rate: ${Math.round((testResults.passed / testResults.tests.length) * 100)}%`);
    
    if (testResults.failed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! Theme system is working perfectly!');
    } else {
        console.log('\n⚠️  Some tests failed. Check the details above.');
        console.log('\nFailed tests:');
        testResults.tests.filter(t => !t.passed).forEach(test => {
            console.log(`   ❌ ${test.name}: ${test.details}`);
        });
    }
    
    console.log('\n🎨 MANUAL TESTING SUGGESTIONS:');
    console.log('1. Navigate to Settings → Theme tab');
    console.log('2. Try each theme from the dropdown');  
    console.log('3. Click theme preview cards');
    console.log('4. Verify instant visual updates');
    console.log('5. Restart app and check theme persistence');
    
    // Cleanup event listener
    document.removeEventListener('themeChanged', eventListener);
    
}, 5000);

console.log('\n⏱️  Running comprehensive tests... (will complete in ~5 seconds)');