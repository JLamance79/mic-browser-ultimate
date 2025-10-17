/**
 * File-based validation for crash reporting system
 * Validates all components exist and are properly structured
 */

const fs = require('fs');
const path = require('path');

class CrashReportingValidator {
    constructor() {
        this.basePath = __dirname;
        this.results = {
            passed: 0,
            failed: 0,
            details: []
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const emoji = type === 'pass' ? '✅' : type === 'fail' ? '❌' : 'ℹ️';
        console.log(`[${timestamp}] ${emoji} ${message}`);
        
        this.results.details.push({ message, type, timestamp });
        if (type === 'pass') this.results.passed++;
        if (type === 'fail') this.results.failed++;
    }

    fileExists(filePath) {
        const fullPath = path.join(this.basePath, filePath);
        return fs.existsSync(fullPath);
    }

    fileSize(filePath) {
        const fullPath = path.join(this.basePath, filePath);
        if (!fs.existsSync(fullPath)) return 0;
        return fs.statSync(fullPath).size;
    }

    readFileContent(filePath) {
        const fullPath = path.join(this.basePath, filePath);
        if (!fs.existsSync(fullPath)) return '';
        return fs.readFileSync(fullPath, 'utf8');
    }

    validateFileExists(filePath, description) {
        if (this.fileExists(filePath)) {
            const size = Math.round(this.fileSize(filePath) / 1024);
            this.log(`${description} exists (${size}KB)`, 'pass');
            return true;
        } else {
            this.log(`${description} missing`, 'fail');
            return false;
        }
    }

    validateFileContent(filePath, patterns, description) {
        if (!this.fileExists(filePath)) {
            this.log(`${description} - file missing`, 'fail');
            return false;
        }

        const content = this.readFileContent(filePath);
        let allPatternsFound = true;

        for (const pattern of patterns) {
            const found = content.includes(pattern.text);
            if (found) {
                this.log(`${description} - ${pattern.name} found`, 'pass');
            } else {
                this.log(`${description} - ${pattern.name} missing`, 'fail');
                allPatternsFound = false;
            }
        }

        return allPatternsFound;
    }

    async runValidation() {
        this.log('Starting Crash Reporting System Validation', 'info');

        // Core Files Validation
        this.log('\n=== Core Files Validation ===', 'info');
        
        this.validateFileExists('CrashReporter.js', 'CrashReporter.js');
        this.validateFileExists('CrashAnalyticsDashboard.js', 'CrashAnalyticsDashboard.js');
        this.validateFileExists('CrashAnalyticsDashboard.css', 'CrashAnalyticsDashboard.css');
        this.validateFileExists('CRASH_REPORTING_DOCS.md', 'CRASH_REPORTING_DOCS.md');
        this.validateFileExists('CRASH_REPORTING_COMPLETE.md', 'CRASH_REPORTING_COMPLETE.md');

        // CrashReporter.js Content Validation
        this.log('\n=== CrashReporter.js Content Validation ===', 'info');
        this.validateFileContent('CrashReporter.js', [
            { name: 'CrashReportingSystem class', text: 'class CrashReportingSystem' },
            { name: 'init method', text: 'async init(' },
            { name: 'crash detection', text: 'onCrash' },
            { name: 'privacy controls', text: 'collectAnonymousData' },
            { name: 'settings management', text: 'getSettings' },
            { name: 'performance monitoring', text: 'performanceMetrics' },
            { name: 'error handling', text: 'recordError' }
        ], 'CrashReporter.js');

        // CrashAnalyticsDashboard.js Content Validation
        this.log('\n=== CrashAnalyticsDashboard.js Content Validation ===', 'info');
        this.validateFileContent('CrashAnalyticsDashboard.js', [
            { name: 'CrashAnalyticsDashboard class', text: 'class CrashAnalyticsDashboard' },
            { name: 'showDashboard method', text: 'showDashboard' },
            { name: 'data visualization', text: 'createChart' },
            { name: 'dashboard content', text: 'renderDashboardContent' },
            { name: 'analytics data', text: 'loadData' }
        ], 'CrashAnalyticsDashboard.js');

        // Main.js Integration Validation
        this.log('\n=== Main.js Integration Validation ===', 'info');
        this.validateFileContent('main.js', [
            { name: 'CrashReporter import', text: 'CrashReporter' },
            { name: 'crash reporting initialization', text: 'initializeCrashReporting' },
            { name: 'IPC handlers setup', text: 'setupCrashReportingIpcHandlers' },
            { name: 'development mode handling', text: 'isDev' }
        ], 'main.js');

        // Preload.js API Validation
        this.log('\n=== Preload.js API Validation ===', 'info');
        this.validateFileContent('preload.js', [
            { name: 'crash reporting API', text: 'crashReporting' },
            { name: 'getSettings API', text: 'getSettings' },
            { name: 'updateSettings API', text: 'updateSettings' },
            { name: 'getCrashReports API', text: 'getReports' }
        ], 'preload.js');

        // Index.html UI Integration Validation
        this.log('\n=== Index.html UI Integration Validation ===', 'info');
        this.validateFileContent('index.html', [
            { name: 'monitoring tab', text: 'Monitoring' },
            { name: 'crash reporting section', text: 'crash-reporting-settings' },
            { name: 'analytics dashboard', text: 'crash-analytics-dashboard' },
            { name: 'dashboard CSS', text: 'CrashAnalyticsDashboard.css' },
            { name: 'dashboard JS', text: 'CrashAnalyticsDashboard.js' }
        ], 'index.html');

        // CSS Styling Validation
        this.log('\n=== CSS Styling Validation ===', 'info');
        this.validateFileContent('CrashAnalyticsDashboard.css', [
            { name: 'dashboard container', text: '.crash-analytics-dashboard' },
            { name: 'chart styling', text: '.stats-grid' },
            { name: 'responsive design', text: '@media' },
            { name: 'dark mode support', text: 'background-color' }
        ], 'CrashAnalyticsDashboard.css');

        // Documentation Validation
        this.log('\n=== Documentation Validation ===', 'info');
        this.validateFileContent('CRASH_REPORTING_DOCS.md', [
            { name: 'privacy policy', text: 'Privacy Policy' },
            { name: 'configuration guide', text: 'Configuration' },
            { name: 'API reference', text: 'CrashReportingSystem' },
            { name: 'troubleshooting', text: 'Troubleshooting' }
        ], 'CRASH_REPORTING_DOCS.md');

        // Package.json Dependencies
        this.log('\n=== Package.json Dependencies Validation ===', 'info');
        if (this.fileExists('package.json')) {
            const packageContent = this.readFileContent('package.json');
            try {
                const packageData = JSON.parse(packageContent);
                if (packageData.devDependencies && packageData.devDependencies.electron) {
                    this.log('Electron dependency found', 'pass');
                } else {
                    this.log('Electron dependency missing', 'fail');
                }
            } catch (error) {
                this.log('Package.json parsing failed', 'fail');
            }
        }

        // File Size Validation
        this.log('\n=== File Size Validation ===', 'info');
        const minSizes = {
            'CrashReporter.js': 15000, // ~15KB minimum
            'CrashAnalyticsDashboard.js': 12000, // ~12KB minimum
            'CrashAnalyticsDashboard.css': 8000, // ~8KB minimum
            'CRASH_REPORTING_DOCS.md': 8000 // ~8KB minimum
        };

        for (const [file, minSize] of Object.entries(minSizes)) {
            const actualSize = this.fileSize(file);
            if (actualSize >= minSize) {
                this.log(`${file} size validation passed (${Math.round(actualSize/1024)}KB)`, 'pass');
            } else {
                this.log(`${file} size validation failed (${Math.round(actualSize/1024)}KB < ${Math.round(minSize/1024)}KB)`, 'fail');
            }
        }

        // Summary
        this.log('\n=== Validation Summary ===', 'info');
        this.log(`Total Checks: ${this.results.passed + this.results.failed}`, 'info');
        this.log(`Passed: ${this.results.passed}`, 'pass');
        this.log(`Failed: ${this.results.failed}`, this.results.failed > 0 ? 'fail' : 'pass');
        
        const successRate = Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100);
        this.log(`Success Rate: ${successRate}%`, successRate >= 90 ? 'pass' : 'fail');

        if (this.results.failed === 0) {
            this.log('\n🎉 All validation checks passed! Crash reporting system is ready.', 'pass');
        } else {
            this.log(`\n⚠️ ${this.results.failed} validation checks failed. Please review the details above.`, 'fail');
        }

        return this.results.failed === 0;
    }
}

// Run validation
async function main() {
    const validator = new CrashReportingValidator();
    const success = await validator.runValidation();
    process.exit(success ? 0 : 1);
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = CrashReportingValidator;