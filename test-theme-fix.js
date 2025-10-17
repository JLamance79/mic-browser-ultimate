// =================================================================
// 🧪 THEME METHODS TEST - ElectronAPI Fix Verification
// =================================================================
// Run this in the DevTools console to test the fix

console.clear();
console.log('🧪 TESTING ELECTRONAPI THEME METHODS FIX');
console.log('==========================================');

async function testElectronAPIThemeMethods() {
    let testsPassed = 0;
    let testsFailed = 0;
    
    function logResult(test, passed, details = '') {
        if (passed) {
            console.log(`✅ ${test}`, details ? `- ${details}` : '');
            testsPassed++;
        } else {
            console.log(`❌ ${test}`, details ? `- ${details}` : '');
            testsFailed++;
        }
    }
    
    console.log('\n🔍 Step 1: Basic API Availability');
    console.log('--------------------------------');
    
    // Test 1: ElectronAPI exists
    const apiExists = typeof window.electronAPI !== 'undefined';
    logResult('ElectronAPI exists', apiExists);
    
    if (!apiExists) {
        console.log('💥 ElectronAPI not found - test aborted');
        return;
    }
    
    // Test 2: Theme methods exist
    const themeMethods = ['setTheme', 'getTheme', 'getAvailableThemes', 'onThemeChanged'];
    themeMethods.forEach(method => {
        const exists = typeof window.electronAPI[method] === 'function';
        logResult(`${method} method exists`, exists);
    });
    
    console.log('\n🎨 Step 2: Theme API Functionality');
    console.log('----------------------------------');
    
    try {
        // Test 3: Get current theme
        const currentThemeResult = await window.electronAPI.getTheme();
        logResult('getTheme() call', currentThemeResult.success, 
            currentThemeResult.success ? `Current: ${currentThemeResult.theme.name}` : currentThemeResult.error);
        
        // Test 4: Get available themes
        const themesResult = await window.electronAPI.getAvailableThemes();
        logResult('getAvailableThemes() call', themesResult.success,
            themesResult.success ? `Found ${themesResult.themes.length} themes` : themesResult.error);
        
        if (themesResult.success) {
            const expectedThemes = ['dark', 'light', 'blue', 'purple'];
            expectedThemes.forEach(theme => {
                const found = themesResult.themes.some(t => t.name === theme);
                logResult(`Theme '${theme}' available`, found);
            });
        }
        
        // Test 5: Theme switching
        console.log('\n🔄 Step 3: Theme Switching Test');
        console.log('-------------------------------');
        
        const originalTheme = currentThemeResult.success ? currentThemeResult.theme.name : 'dark';
        
        // Switch to light theme
        const lightResult = await window.electronAPI.setTheme('light');
        logResult('Switch to light theme', lightResult.success, 
            lightResult.success ? 'Theme changed' : lightResult.error);
        
        // Wait a moment then switch back
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const revertResult = await window.electronAPI.setTheme(originalTheme);
        logResult(`Revert to ${originalTheme} theme`, revertResult.success,
            revertResult.success ? 'Theme reverted' : revertResult.error);
        
    } catch (error) {
        logResult('Theme API calls', false, error.message);
    }
    
    console.log('\n🎯 Step 4: ThemeManager Integration');
    console.log('-----------------------------------');
    
    // Test 6: ThemeManager exists
    const managerExists = typeof window.themeManager !== 'undefined';
    logResult('ThemeManager exists', managerExists);
    
    if (managerExists) {
        try {
            const currentTheme = window.themeManager.getCurrentTheme();
            logResult('ThemeManager.getCurrentTheme()', currentTheme !== null,
                currentTheme ? `Current: ${currentTheme.name}` : 'No theme');
            
            const availableThemes = window.themeManager.getAvailableThemes();
            logResult('ThemeManager.getAvailableThemes()', Object.keys(availableThemes).length > 0,
                `Found ${Object.keys(availableThemes).length} themes`);
                
        } catch (error) {
            logResult('ThemeManager methods', false, error.message);
        }
    }
    
    console.log('\n📊 TEST RESULTS');
    console.log('===============');
    console.log(`✅ Passed: ${testsPassed}`);
    console.log(`❌ Failed: ${testsFailed}`);
    console.log(`📈 Success Rate: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%`);
    
    if (testsFailed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! ElectronAPI theme methods are working correctly! 🚀');
    } else {
        console.log('\n⚠️  Some tests failed. Check the results above for details.');
    }
}

// Auto-run the test
console.log('⏳ Starting theme methods test...');
testElectronAPIThemeMethods();