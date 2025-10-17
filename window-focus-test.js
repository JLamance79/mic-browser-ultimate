// Window focus test - run this in the main process
// This will help identify if the window is created but not visible

console.log('🔍 Testing window state...');

// Check if mainWindow exists
if (typeof mainWindow !== 'undefined' && mainWindow) {
    console.log('✅ Main window exists');
    console.log('Window bounds:', mainWindow.getBounds());
    console.log('Window visible:', mainWindow.isVisible());
    console.log('Window minimized:', mainWindow.isMinimized());
    console.log('Window focused:', mainWindow.isFocused());
    
    // Try to show and focus the window
    console.log('🔄 Attempting to show and focus window...');
    mainWindow.show();
    mainWindow.focus();
    mainWindow.setAlwaysOnTop(true);
    
    // Reset always on top after 2 seconds
    setTimeout(() => {
        mainWindow.setAlwaysOnTop(false);
        console.log('✅ Window should now be visible');
    }, 2000);
    
} else {
    console.error('❌ Main window not found');
    console.log('Available variables:', Object.keys(global));
}