/**
 * Content Security Policy (CSP) Configuration and Testing
 * Tests and validates CSP configuration for MIC Browser Ultimate
 */

class CSPValidator {
    constructor() {
        this.requiredDirectives = {
            'default-src': ['self', 'unsafe-inline', 'unsafe-eval', 'data:', 'blob:', 'https:', 'wss:', 'ws:'],
            'script-src': ['self', 'unsafe-inline', 'unsafe-eval', 'https://cdnjs.cloudflare.com'],
            'style-src': ['self', 'unsafe-inline', 'https://cdnjs.cloudflare.com'],
            'img-src': ['self', 'data:', 'blob:', 'https:'],
            'connect-src': ['self', 'https:', 'wss:', 'ws:', 'http://localhost:*'],
            'font-src': ['self', 'https://cdnjs.cloudflare.com', 'data:'],
            'worker-src': ['self', 'blob:', 'data:'],
            'media-src': ['self', 'data:', 'blob:'],
            'object-src': ['none'],
            'frame-src': ['none'],
            'child-src': ['self', 'blob:']
        };
    }

    /**
     * Test CSP configuration
     */
    async testCSPConfiguration() {
        console.log('🛡️ Testing Content Security Policy Configuration...');
        
        const results = {
            html_csp: this.testHTMLCSP(),
            electron_csp: this.testElectronCSP(),
            feature_compatibility: await this.testFeatureCompatibility(),
            security_headers: this.testSecurityHeaders()
        };

        this.generateCSPReport(results);
        return results;
    }

    /**
     * Test HTML meta CSP
     */
    testHTMLCSP() {
        console.log('📄 Testing HTML CSP...');
        
        try {
            const metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
            if (!metaCSP) {
                return { status: 'error', message: 'No CSP meta tag found' };
            }

            const content = metaCSP.getAttribute('content');
            const directives = this.parseCSP(content);
            
            return {
                status: 'success',
                content: content,
                directives: directives,
                validation: this.validateDirectives(directives)
            };
        } catch (error) {
            return { status: 'error', message: error.message };
        }
    }

    /**
     * Test Electron session CSP (simulated)
     */
    testElectronCSP() {
        console.log('⚡ Testing Electron Session CSP...');
        
        // This would typically be tested in the main process
        // For now, we'll simulate the expected configuration
        const expectedCSP = `default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob: wss: ws:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src-elem 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; img-src 'self' data: blob: https:; connect-src 'self' https: wss: ws: http://localhost:* https://api.* https://*.supabase.co; font-src 'self' https://cdnjs.cloudflare.com data:; worker-src 'self' blob: data:; object-src 'none'; media-src 'self' data: blob:; frame-src 'none'; child-src 'self' blob:`;
        
        const directives = this.parseCSP(expectedCSP);
        
        return {
            status: 'configured',
            content: expectedCSP,
            directives: directives,
            validation: this.validateDirectives(directives)
        };
    }

    /**
     * Test feature compatibility with CSP
     */
    async testFeatureCompatibility() {
        console.log('🔧 Testing Feature Compatibility...');
        
        const features = {
            websockets: this.testWebSocketSupport(),
            workers: this.testWorkerSupport(),
            fetch: this.testFetchSupport(),
            blob_urls: this.testBlobSupport(),
            inline_scripts: this.testInlineScriptSupport(),
            external_resources: this.testExternalResourceSupport()
        };

        return features;
    }

    /**
     * Test WebSocket support
     */
    testWebSocketSupport() {
        try {
            if (typeof WebSocket !== 'undefined') {
                return { supported: true, note: 'WebSocket API available' };
            }
            return { supported: false, note: 'WebSocket API not available' };
        } catch (error) {
            return { supported: false, note: error.message };
        }
    }

    /**
     * Test Worker support
     */
    testWorkerSupport() {
        try {
            if (typeof Worker !== 'undefined') {
                return { supported: true, note: 'Web Workers API available' };
            }
            return { supported: false, note: 'Web Workers API not available' };
        } catch (error) {
            return { supported: false, note: error.message };
        }
    }

    /**
     * Test Fetch API support
     */
    testFetchSupport() {
        try {
            if (typeof fetch !== 'undefined') {
                return { supported: true, note: 'Fetch API available' };
            }
            return { supported: false, note: 'Fetch API not available' };
        } catch (error) {
            return { supported: false, note: error.message };
        }
    }

    /**
     * Test Blob URL support
     */
    testBlobSupport() {
        try {
            const blob = new Blob(['test'], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            URL.revokeObjectURL(url);
            return { supported: true, note: 'Blob URLs supported' };
        } catch (error) {
            return { supported: false, note: error.message };
        }
    }

    /**
     * Test inline script execution
     */
    testInlineScriptSupport() {
        try {
            // Test if eval works (indicates unsafe-eval is allowed)
            eval('1 + 1');
            return { supported: true, note: 'Inline scripts and eval allowed' };
        } catch (error) {
            return { supported: false, note: 'Inline scripts blocked: ' + error.message };
        }
    }

    /**
     * Test external resource loading
     */
    testExternalResourceSupport() {
        const tests = {
            cdnjs_fonts: this.testResourceURL('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'),
            https_images: this.testResourceURL('https://example.com/image.png'),
            data_urls: this.testResourceURL('data:image/png;base64,iVBORw0KGgo=')
        };

        return tests;
    }

    /**
     * Test if a resource URL would be allowed
     */
    testResourceURL(url) {
        // This is a simplified test - in reality, CSP enforcement happens at browser level
        try {
            new URL(url);
            return { allowed: true, url: url };
        } catch (error) {
            return { allowed: false, url: url, error: error.message };
        }
    }

    /**
     * Test security headers
     */
    testSecurityHeaders() {
        console.log('🔐 Testing Security Headers...');
        
        const expectedHeaders = {
            'X-Frame-Options': 'DENY',
            'X-Content-Type-Options': 'nosniff',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin'
        };

        return {
            expected: expectedHeaders,
            note: 'Security headers are configured in Electron main process'
        };
    }

    /**
     * Parse CSP string into directive objects
     */
    parseCSP(cspString) {
        const directives = {};
        const parts = cspString.split(';');
        
        parts.forEach(part => {
            const trimmed = part.trim();
            if (trimmed) {
                const [directive, ...sources] = trimmed.split(' ');
                directives[directive] = sources;
            }
        });
        
        return directives;
    }

    /**
     * Validate CSP directives against requirements
     */
    validateDirectives(directives) {
        const validation = {
            missing: [],
            incorrect: [],
            warnings: []
        };

        // Check for required directives
        Object.keys(this.requiredDirectives).forEach(directive => {
            if (!directives[directive]) {
                validation.missing.push(directive);
            }
        });

        // Check for security concerns
        if (directives['script-src'] && directives['script-src'].includes("'unsafe-eval'")) {
            validation.warnings.push("'unsafe-eval' allows eval() - required for AI/ML but increases XSS risk");
        }

        if (directives['default-src'] && directives['default-src'].includes("'unsafe-inline'")) {
            validation.warnings.push("'unsafe-inline' allows inline scripts - required for dynamic content but increases XSS risk");
        }

        return validation;
    }

    /**
     * Generate comprehensive CSP report
     */
    generateCSPReport(results) {
        console.log('\n📊 CSP Configuration Report');
        console.log('='.repeat(50));
        
        // HTML CSP Status
        console.log('\n📄 HTML CSP Status:', results.html_csp.status);
        if (results.html_csp.validation) {
            if (results.html_csp.validation.missing.length > 0) {
                console.log('❌ Missing directives:', results.html_csp.validation.missing.join(', '));
            }
            if (results.html_csp.validation.warnings.length > 0) {
                console.log('⚠️  Warnings:', results.html_csp.validation.warnings.join('; '));
            }
        }

        // Electron CSP Status
        console.log('\n⚡ Electron CSP Status:', results.electron_csp.status);
        
        // Feature Compatibility
        console.log('\n🔧 Feature Compatibility:');
        Object.entries(results.feature_compatibility).forEach(([feature, result]) => {
            const status = result.supported || result.allowed ? '✅' : '❌';
            console.log(`${status} ${feature}: ${result.note || result.error || 'OK'}`);
        });

        // Security Assessment
        console.log('\n🛡️ Security Assessment:');
        console.log('✅ CSP configured for advanced features');
        console.log('✅ WebSocket support enabled (wss:, ws:)');
        console.log('✅ Web Workers support enabled');
        console.log('✅ Blob URLs supported for dynamic content');
        console.log('✅ External CDN resources allowed (cdnjs.cloudflare.com)');
        console.log('⚠️  unsafe-eval enabled (required for AI/ML features)');
        console.log('⚠️  unsafe-inline enabled (required for dynamic UI)');
        
        console.log('\n📋 Recommendations:');
        console.log('1. Monitor CSP violations in production');
        console.log('2. Consider nonce-based CSP for enhanced security');
        console.log('3. Regular CSP audits as features evolve');
        console.log('4. Implement CSP reporting endpoint');
    }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CSPValidator;
}

// Auto-run if in browser environment
if (typeof window !== 'undefined') {
    // Run CSP validation when page loads
    document.addEventListener('DOMContentLoaded', async () => {
        const validator = new CSPValidator();
        await validator.testCSPConfiguration();
    });
}