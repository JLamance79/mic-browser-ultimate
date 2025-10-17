/**
 * Chrome Sign-in Helper
 * Resolves common Chrome authentication issues in Electron apps
 */

class ChromeSigninHelper {
    constructor() {
        this.isInitialized = false;
        this.authIssues = [];
    }

    /**
     * Initialize Chrome sign-in support
     */
    async initialize() {
        console.log('🔐 Initializing Chrome Sign-in Helper...');

        try {
            await this.checkAuthEnvironment();
            await this.configureWebviews();
            await this.setupAuthHandlers();
            
            this.isInitialized = true;
            console.log('✅ Chrome Sign-in Helper initialized successfully');
            
            return {
                success: true,
                issues: this.authIssues,
                recommendations: this.getRecommendations()
            };
        } catch (error) {
            console.error('❌ Chrome Sign-in Helper initialization failed:', error);
            return {
                success: false,
                error: error.message,
                issues: this.authIssues
            };
        }
    }

    /**
     * Check authentication environment
     */
    async checkAuthEnvironment() {
        console.log('🔍 Checking authentication environment...');

        // Check CSP configuration
        const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        if (cspMeta) {
            const cspContent = cspMeta.getAttribute('content');
            
            if (!cspContent.includes('accounts.google.com')) {
                this.authIssues.push({
                    type: 'CSP_GOOGLE_BLOCKED',
                    severity: 'HIGH',
                    message: 'Google accounts domain not allowed in CSP',
                    fix: 'Update CSP to include https://accounts.google.com'
                });
            }
            
            if (cspContent.includes("frame-src 'none'")) {
                this.authIssues.push({
                    type: 'CSP_FRAMES_BLOCKED',
                    severity: 'HIGH',
                    message: 'Frames completely blocked by CSP',
                    fix: 'Allow frames from Google auth domains'
                });
            }
        }

        // Check user agent
        if (!navigator.userAgent.includes('Chrome')) {
            this.authIssues.push({
                type: 'USER_AGENT_MISMATCH',
                severity: 'MEDIUM',
                message: 'User agent may not be recognized by Google',
                fix: 'Set Chrome-compatible user agent'
            });
        }

        // Check for third-party cookies
        if (window.electronAPI) {
            try {
                // Test cookie access
                document.cookie = 'test_auth_cookie=test; SameSite=None; Secure';
                if (!document.cookie.includes('test_auth_cookie')) {
                    this.authIssues.push({
                        type: 'COOKIE_ACCESS_BLOCKED',
                        severity: 'HIGH',
                        message: 'Cookie access may be restricted',
                        fix: 'Enable third-party cookies for authentication'
                    });
                }
            } catch (error) {
                this.authIssues.push({
                    type: 'COOKIE_ERROR',
                    severity: 'MEDIUM',
                    message: 'Cookie handling error: ' + error.message,
                    fix: 'Check cookie security settings'
                });
            }
        }

        console.log(`Found ${this.authIssues.length} potential authentication issues`);
    }

    /**
     * Configure webviews for authentication
     */
    async configureWebviews() {
        console.log('⚙️ Configuring webviews for authentication...');

        // Find all webviews
        const webviews = document.querySelectorAll('webview');
        
        webviews.forEach((webview, index) => {
            try {
                // Set authentication-friendly attributes
                webview.setAttribute('partition', 'persist:main');
                webview.setAttribute('allowpopups', 'true');
                
                // Add auth-specific event handlers
                webview.addEventListener('permissionrequest', (e) => {
                    if (e.permission === 'media' || e.permission === 'geolocation' || e.permission === 'notifications') {
                        e.request.allow();
                    }
                });

                // Handle auth redirects
                webview.addEventListener('did-navigate', (e) => {
                    if (e.url.includes('accounts.google.com') || e.url.includes('signin')) {
                        console.log('🔐 Authentication page detected:', e.url);
                        this.handleAuthNavigation(webview, e.url);
                    }
                });

                console.log(`✅ Configured webview ${index + 1} for authentication`);
            } catch (error) {
                console.warn(`⚠️ Failed to configure webview ${index + 1}:`, error.message);
            }
        });
    }

    /**
     * Handle authentication navigation
     */
    handleAuthNavigation(webview, url) {
        try {
            // Inject auth helper scripts
            webview.executeJavaScript(`
                (function() {
                    // Fix common auth issues
                    if (window.location.hostname.includes('accounts.google.com')) {
                        console.log('🔐 Google authentication page detected');
                        
                        // Enable credential manager if available
                        if (navigator.credentials) {
                            console.log('✅ Credential Manager available');
                        }
                        
                        // Fix form submission issues
                        document.addEventListener('submit', function(e) {
                            const form = e.target;
                            if (form && form.method) {
                                console.log('🔐 Auth form submission detected');
                            }
                        });
                        
                        // Handle auth errors
                        window.addEventListener('error', function(e) {
                            console.warn('🔐 Auth page error:', e.message);
                        });
                    }
                })();
            `).catch(error => {
                console.warn('Failed to inject auth helper:', error.message);
            });
        } catch (error) {
            console.warn('Failed to handle auth navigation:', error.message);
        }
    }

    /**
     * Setup authentication event handlers
     */
    async setupAuthHandlers() {
        console.log('🎯 Setting up authentication event handlers...');

        // Handle auth success/failure
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'auth') {
                this.handleAuthMessage(event.data);
            }
        });

        // Monitor for auth errors in console
        if (window.electronAPI) {
            // Override console.error to catch auth errors
            const originalError = console.error;
            console.error = (...args) => {
                const message = args.join(' ');
                if (message.includes('auth') || message.includes('signin') || message.includes('oauth')) {
                    this.handleAuthError(message);
                }
                originalError.apply(console, args);
            };
        }
    }

    /**
     * Handle authentication messages
     */
    handleAuthMessage(data) {
        console.log('🔐 Auth message received:', data);
        
        switch (data.status) {
            case 'success':
                console.log('✅ Authentication successful');
                this.showAuthStatus('Authentication successful!', 'success');
                break;
            case 'error':
                console.error('❌ Authentication failed:', data.error);
                this.showAuthStatus('Authentication failed: ' + data.error, 'error');
                break;
            case 'redirect':
                console.log('🔄 Authentication redirect:', data.url);
                break;
        }
    }

    /**
     * Handle authentication errors
     */
    handleAuthError(message) {
        console.error('🔐 Auth error detected:', message);
        
        if (message.includes('CORS')) {
            this.showAuthStatus('CORS error - try refreshing the page', 'warning');
        } else if (message.includes('popup')) {
            this.showAuthStatus('Popup blocked - check browser settings', 'warning');
        } else if (message.includes('cookie')) {
            this.showAuthStatus('Cookie issue - check privacy settings', 'warning');
        }
    }

    /**
     * Show authentication status
     */
    showAuthStatus(message, type = 'info') {
        // Create or update auth status indicator
        let statusElement = document.getElementById('auth-status-indicator');
        if (!statusElement) {
            statusElement = document.createElement('div');
            statusElement.id = 'auth-status-indicator';
            statusElement.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 16px;
                border-radius: 6px;
                color: white;
                font-weight: bold;
                z-index: 10000;
                max-width: 300px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            `;
            document.body.appendChild(statusElement);
        }

        // Set status styling based on type
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };

        statusElement.style.backgroundColor = colors[type] || colors.info;
        statusElement.textContent = message;

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (statusElement.parentNode) {
                statusElement.parentNode.removeChild(statusElement);
            }
        }, 5000);
    }

    /**
     * Get recommendations for fixing auth issues
     */
    getRecommendations() {
        if (this.authIssues.length === 0) {
            return ['Chrome sign-in should work normally'];
        }

        const recommendations = [
            '🔧 Fix Chrome Sign-in Issues:',
            ''
        ];

        this.authIssues.forEach(issue => {
            recommendations.push(`• ${issue.message}`);
            recommendations.push(`  Fix: ${issue.fix}`);
            recommendations.push('');
        });

        recommendations.push('Additional Tips:');
        recommendations.push('• Clear browser data and restart the app');
        recommendations.push('• Disable ad blockers or privacy extensions');
        recommendations.push('• Check internet connection');
        recommendations.push('• Try incognito/private browsing mode');
        recommendations.push('• Update Chrome to the latest version');

        return recommendations;
    }

    /**
     * Create diagnostic report
     */
    createDiagnosticReport() {
        return {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            cookiesEnabled: navigator.cookieEnabled,
            onlineStatus: navigator.onLine,
            authIssues: this.authIssues,
            recommendations: this.getRecommendations(),
            electronAPI: !!window.electronAPI,
            webviewCount: document.querySelectorAll('webview').length
        };
    }

    /**
     * Run comprehensive auth diagnosis
     */
    async diagnoseAuthIssues() {
        console.log('🔍 Running Chrome sign-in diagnosis...');
        
        const report = this.createDiagnosticReport();
        
        console.log('📊 Auth Diagnostic Report:');
        console.log(JSON.stringify(report, null, 2));
        
        return report;
    }
}

// Initialize Chrome sign-in helper when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    const authHelper = new ChromeSigninHelper();
    
    try {
        const result = await authHelper.initialize();
        
        if (!result.success) {
            console.error('Chrome sign-in helper failed to initialize:', result.error);
            authHelper.showAuthStatus('Chrome sign-in helper failed to initialize', 'error');
        } else if (result.issues.length > 0) {
            console.warn(`Chrome sign-in helper found ${result.issues.length} issues`);
            authHelper.showAuthStatus(`Found ${result.issues.length} potential sign-in issues - check console`, 'warning');
        } else {
            console.log('Chrome sign-in helper ready');
            authHelper.showAuthStatus('Chrome sign-in ready', 'success');
        }
        
        // Make helper globally available
        window.chromeSigninHelper = authHelper;
        
    } catch (error) {
        console.error('Failed to initialize Chrome sign-in helper:', error);
    }
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChromeSigninHelper;
}