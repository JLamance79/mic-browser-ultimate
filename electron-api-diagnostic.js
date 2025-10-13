// =================================================================
// 🔧 ELECTRON API DIAGNOSTIC TEST
// =================================================================
// Copy and paste this into DevTools console to diagnose the API issue

console.clear();
console.log('🔧 ELECTRON API DIAGNOSTIC TEST');
console.log('==============================');

// Test 1: Check window.electronAPI availability
console.log('\n📋 TEST 1: ElectronAPI Availability');
console.log('----------------------------------');

console.log('window.electronAPI exists:', !!window.electronAPI);

if (window.electronAPI) {
    console.log('✅ ElectronAPI is available');
    
    // Check theme-related methods
    const themeMethods = [
        'setTheme',
        'getTheme', 
        'getAvailableThemes',
        'onThemeChanged'
    ];
    
    console.log('\n🎨 Theme API Methods:');
    themeMethods.forEach(method => {
        const exists = typeof window.electronAPI[method] === 'function';
        console.log(`   ${method}: ${exists ? '✅' : '❌'} ${exists ? 'Available' : 'Missing'}`);
    });
    
    // Test basic API call
    console.log('\n🧪 Testing Basic API Call:');
    if (window.electronAPI.getTheme) {
        window.electronAPI.getTheme().then(result => {
            console.log('✅ getTheme call successful:', result);
        }).catch(error => {
            console.log('❌ getTheme call failed:', error);
        });
    } else {
        console.log('❌ getTheme method not available');
    }
    
} else {
    console.log('❌ ElectronAPI not available');
    console.log('   This could mean:');
    console.log('   1. Preload script not loading properly');
    console.log('   2. Context isolation issues');
    console.log('   3. App needs to be refreshed');
}

// Test 2: Check ThemeManager
console.log('\n🎨 TEST 2: ThemeManager Check');
console.log('----------------------------');

if (window.themeManager) {
    console.log('✅ ThemeManager is available');
    console.log('   Current theme:', window.themeManager.getCurrentTheme());
    
    // Test if we can use fallback theme switching
    console.log('\n🔄 Testing fallback theme application...');
    try {
        window.themeManager.applyTheme({
            name: 'test',
            colors: {
                background: '#ff0000',
                surface: '#00ff00',
                primary: '#0000ff',
                text: '#ffffff',
                secondary: '#cccccc',
                accent: '#ffff00',
                success: '#00ffff',
                warning: '#ff00ff',
                danger: '#ff8800'
            }
        });
        console.log('✅ Direct theme application works');
        
        // Revert to dark theme
        setTimeout(() => {
            window.themeManager.applyTheme({
                name: 'dark',
                colors: window.themeManager.getDefaultDarkTheme()
            });
            console.log('🔄 Reverted to dark theme');
        }, 1000);
        
    } catch (error) {
        console.log('❌ Direct theme application failed:', error);
    }
} else {
    console.log('❌ ThemeManager not available');
}

// Test 3: Manual IPC Test
console.log('\n📡 TEST 3: Manual IPC Test');
console.log('-------------------------');

if (window.electronAPI) {
    // Try different API methods to see what works
    const apiTests = [
        { name: 'getAppVersion', method: 'getAppVersion' },
        { name: 'getTheme', method: 'getTheme' },
        { name: 'getAvailableThemes', method: 'getAvailableThemes' }
    ];
    
    apiTests.forEach(test => {
        if (window.electronAPI[test.method]) {
            console.log(`Testing ${test.name}...`);
            window.electronAPI[test.method]().then(result => {
                console.log(`✅ ${test.name}:`, result);
            }).catch(error => {
                console.log(`❌ ${test.name} failed:`, error);
            });
        } else {
            console.log(`❌ ${test.name} method not available`);
        }
    });
}

console.log('\n📋 DIAGNOSTIC COMPLETE');
console.log('======================');
console.log('If ElectronAPI is missing:');
console.log('1. Try refreshing the app (Ctrl+R)');
console.log('2. Check for JavaScript errors in console');
console.log('3. Verify preload.js is loading');
console.log('\nIf theme methods are missing:');
console.log('1. Check main.js for IPC handlers');
console.log('2. Verify preload.js theme API exports');
console.log('3. Check for IPC communication errors');