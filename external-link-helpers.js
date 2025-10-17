function testQuickExternalLinks() {
    // Test the quick external test page
    const fileUrl = './quick-external-test.html';
    console.log('Opening quick external link test:', fileUrl);
    
    if (window.micBrowser && window.micBrowser.navigateToUrl) {
        window.micBrowser.navigateToUrl(fileUrl);
    } else if (window.micBrowser && window.micBrowser.createTab) {
        window.micBrowser.createTab(fileUrl, 'Quick External Test');
    } else {
        const urlInput = document.getElementById('urlInput');
        if (urlInput) {
            urlInput.value = fileUrl;
            safeNavigateFromUrlBar();
        } else {
            window.location.href = fileUrl;
        }
    }
}

// Test external link opening directly
function testDirectExternalLink() {
    console.log('Testing direct external link opening...');
    
    const testUrls = [
        'https://www.google.com',
        'https://github.com',
        'https://stackoverflow.com'
    ];
    
    const randomUrl = testUrls[Math.floor(Math.random() * testUrls.length)];
    console.log('Opening external URL:', randomUrl);
    
    if (window.electronAPI && window.electronAPI.openExternalLink) {
        window.electronAPI.openExternalLink(randomUrl)
            .then(() => console.log('✅ External link opened successfully'))
            .catch(error => console.error('❌ Failed to open external link:', error));
    } else {
        console.warn('⚠️ electronAPI not available, trying fallback');
        window.open(randomUrl, '_blank');
    }
}

console.log('External link test functions loaded');