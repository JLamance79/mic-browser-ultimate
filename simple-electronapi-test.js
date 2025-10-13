// =================================================================
// 🚀 SIMPLE ELECTRONAPI TEST
// =================================================================
// Copy and paste this into DevTools console step-by-step

console.clear();
console.log('🚀 TESTING ELECTRONAPI AVAILABILITY');
console.log('===================================');

// Test 1: Check if ElectronAPI exists
console.log('\n📋 Step 1: Basic API Check');
console.log('ElectronAPI exists:', !!window.electronAPI);

if (window.electronAPI) {
    console.log('✅ ElectronAPI is available');
    
    // List all available methods
    console.log('\n📋 Available methods:');
    Object.keys(window.electronAPI).forEach(key => {
        const type = typeof window.electronAPI[key];
        console.log(`   ${key}: ${type}`);
    });
    
} else {
    console.log('❌ ElectronAPI NOT available');
    console.log('💡 Try refreshing the app (Ctrl+R) and wait a few seconds');
}

// Test 2: Check theme methods specifically
console.log('\n🎨 Step 2: Theme Methods Check');
if (window.electronAPI) {
    const themeMethods = ['setTheme', 'getTheme', 'getAvailableThemes'];
    themeMethods.forEach(method => {
        const available = typeof window.electronAPI[method] === 'function';
        console.log(`   ${method}: ${available ? '✅ Available' : '❌ Missing'}`);
    });
} else {
    console.log('❌ Cannot check theme methods - ElectronAPI not available');
}

// Test 3: Check ThemeManager
console.log('\n🎯 Step 3: ThemeManager Check');
if (window.themeManager) {
    console.log('✅ ThemeManager is available');
    console.log('Current theme:', window.themeManager.getCurrentTheme());
} else {
    console.log('❌ ThemeManager not available');
}

console.log('\n📋 NEXT STEPS:');
console.log('=============');
console.log('1. If ElectronAPI is available, run: testBasicTheme()');
console.log('2. If not available, refresh app and try again');
console.log('3. If still having issues, check console for errors');

// Create test functions
if (window.electronAPI && window.electronAPI.setTheme) {
    window.testBasicTheme = async function() {
        console.log('\n🧪 RUNNING BASIC THEME TEST');
        console.log('===========================');
        
        try {
            // Get available themes
            const themes = await window.electronAPI.getAvailableThemes();
            console.log('Available themes:', Object.keys(themes));
            
            // Get current theme
            const current = await window.electronAPI.getTheme();
            console.log('Current theme:', current);
            
            // Test switching to light theme
            console.log('\nSwitching to light theme...');
            await window.electronAPI.setTheme('light');
            console.log('✅ Switched to light theme');
            
            // Wait 2 seconds then switch back to dark
            setTimeout(async () => {
                console.log('\nSwitching back to dark theme...');
                await window.electronAPI.setTheme('dark');
                console.log('✅ Switched back to dark theme');
                console.log('🎉 Basic theme test completed successfully!');
            }, 2000);
            
        } catch (error) {
            console.error('❌ Theme test failed:', error);
        }
    };
    
    console.log('\n✅ testBasicTheme() function ready to use');
} else {
    console.log('\n❌ Cannot create test function - ElectronAPI not available');
}