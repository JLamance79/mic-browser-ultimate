// =================================================================
// 🚀 COMPLETE ELECTRON API & THEME SYSTEM TEST
// =================================================================
// Run this test step-by-step in DevTools console

console.clear();
console.log('🚀 COMPLETE ELECTRON API & THEME SYSTEM TEST');
console.log('============================================');

// Step 1: Check if DOM is ready
console.log('\n📋 STEP 1: DOM Ready Check');
console.log('---------------------------');
console.log('Document ready state:', document.readyState);
console.log('Window loaded:', window.document.readyState === 'complete');

// Step 2: Check ElectronAPI availability with retry
console.log('\n🔌 STEP 2: ElectronAPI Availability Check');
console.log('------------------------------------------');

function checkElectronAPI() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 10;
        const checkInterval = 100;

        function check() {
            attempts++;
            console.log(`Attempt ${attempts}/${maxAttempts}: Checking electronAPI...`);
            
            if (window.electronAPI) {
                console.log('✅ ElectronAPI found!');
                resolve(window.electronAPI);
                return;
            }
            
            if (attempts >= maxAttempts) {
                console.log('❌ ElectronAPI not found after', maxAttempts, 'attempts');
                reject(new Error('ElectronAPI not available'));
                return;
            }
            
            setTimeout(check, checkInterval);
        }
        
        check();
    });
}

checkElectronAPI().then(electronAPI => {
    console.log('\n🎯 ElectronAPI Methods Available:');
    
    // Check theme methods specifically
    const themeMethods = ['setTheme', 'getTheme', 'getAvailableThemes', 'onThemeChanged'];
    themeMethods.forEach(method => {
        const available = typeof electronAPI[method] === 'function';
        console.log(`   ${method}: ${available ? '✅' : '❌'}`);
    });
    
    // Step 3: Test Theme API calls
    console.log('\n🎨 STEP 3: Testing Theme API Calls');
    console.log('-----------------------------------');
    
    // Test getAvailableThemes
    console.log('Testing getAvailableThemes...');
    electronAPI.getAvailableThemes().then(themes => {
        console.log('✅ Available themes:', themes);
        
        // Test getCurrentTheme
        console.log('\nTesting getCurrentTheme...');
        return electronAPI.getTheme();
    }).then(currentTheme => {
        console.log('✅ Current theme:', currentTheme);
        
        // Test theme switching
        console.log('\n🔄 STEP 4: Testing Theme Switching');
        console.log('----------------------------------');
        
        // Switch to light theme first
        console.log('Switching to light theme...');
        return electronAPI.setTheme('light');
    }).then(() => {
        console.log('✅ Successfully switched to light theme');
        
        // Wait a bit then switch to blue
        return new Promise(resolve => {
            setTimeout(() => {
                console.log('Switching to blue theme...');
                electronAPI.setTheme('blue').then(() => {
                    console.log('✅ Successfully switched to blue theme');
                    resolve();
                });
            }, 1000);
        });
    }).then(() => {
        // Wait a bit then switch to purple
        return new Promise(resolve => {
            setTimeout(() => {
                console.log('Switching to purple theme...');
                electronAPI.setTheme('purple').then(() => {
                    console.log('✅ Successfully switched to purple theme');
                    resolve();
                });
            }, 1000);
        });
    }).then(() => {
        // Finally switch back to dark
        return new Promise(resolve => {
            setTimeout(() => {
                console.log('Switching back to dark theme...');
                electronAPI.setTheme('dark').then(() => {
                    console.log('✅ Successfully switched back to dark theme');
                    resolve();
                });
            }, 1000);
        });
    }).then(() => {
        console.log('\n🏆 THEME SWITCHING TEST COMPLETE!');
        console.log('================================');
        console.log('All theme switches successful!');
        
        // Step 5: Test ThemeManager integration
        console.log('\n🎨 STEP 5: Testing ThemeManager Integration');
        console.log('-------------------------------------------');
        
        if (window.themeManager) {
            console.log('✅ ThemeManager available');
            console.log('Current theme from manager:', window.themeManager.getCurrentTheme());
            
            // Test theme manager methods
            const themes = window.themeManager.getAvailableThemes();
            console.log('Available themes from manager:', Object.keys(themes));
            
            console.log('\n🔄 Testing ThemeManager.changeTheme method...');
            window.themeManager.changeTheme('light').then(() => {
                console.log('✅ ThemeManager.changeTheme successful');
                
                setTimeout(() => {
                    window.themeManager.changeTheme('dark').then(() => {
                        console.log('✅ Reverted to dark theme via ThemeManager');
                        
                        console.log('\n🎉 ALL TESTS PASSED!');
                        console.log('===================');
                        console.log('✅ ElectronAPI working');
                        console.log('✅ IPC communication working');
                        console.log('✅ Theme API working');
                        console.log('✅ Theme switching working');
                        console.log('✅ ThemeManager integration working');
                        console.log('\nYour theme system is fully functional! 🚀');
                    });
                }, 1000);
            });
        } else {
            console.log('❌ ThemeManager not available');
        }
        
    }).catch(error => {
        console.error('❌ Theme API test failed:', error);
    });
    
}).catch(error => {
    console.error('❌ ElectronAPI check failed:', error);
    console.log('\n💡 Troubleshooting Steps:');
    console.log('1. Try refreshing the app (Ctrl+R)');
    console.log('2. Check for JavaScript errors in console');
    console.log('3. Verify main.js and preload.js are loading');
    console.log('4. Check if context isolation is properly configured');
});

console.log('\n⏳ Running API availability check...');