/**
 * Crash Analytics Dashboard UI
 * Provides comprehensive crash reporting analytics and visualization
 */

class CrashAnalyticsDashboard {
    constructor() {
        this.crashReports = [];
        this.analytics = {};
        this.isInitialized = false;
        this.refreshInterval = null;
        
        this.init();
    }

    async init() {
        console.log('🚨 Initializing Crash Analytics Dashboard...');
        
        try {
            // Load initial data
            await this.loadData();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Start auto-refresh
            this.startAutoRefresh();
            
            this.isInitialized = true;
            console.log('✅ Crash Analytics Dashboard initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Crash Analytics Dashboard:', error);
        }
    }

    async loadData() {
        try {
            if (!window.electronAPI?.crashReporting) {
                console.warn('Crash reporting API not available');
                return;
            }

            // Load crash reports
            const reportsResult = await window.electronAPI.crashReporting.getReports();
            if (reportsResult.success) {
                this.crashReports = reportsResult.reports || [];
            }

            // Load analytics data
            const analyticsResult = await window.electronAPI.crashReporting.getAnalytics();
            if (analyticsResult.success) {
                this.analytics = analyticsResult.analytics || {};
            }

            console.log(`📊 Loaded ${this.crashReports.length} crash reports`);
        } catch (error) {
            console.error('Failed to load crash data:', error);
        }
    }

    setupEventListeners() {
        // Listen for crash events
        if (window.electronAPI?.crashReporting) {
            window.electronAPI.crashReporting.onCrashDetected((event, data) => {
                console.log('🚨 New crash detected:', data);
                this.onNewCrash(data);
            });

            window.electronAPI.crashReporting.onReportGenerated((event, data) => {
                console.log('📄 Crash report generated:', data);
                this.onReportGenerated(data);
            });
        }

        // Setup dashboard refresh button
        document.addEventListener('click', (e) => {
            if (e.target.matches('.refresh-dashboard-btn') || e.target.closest('.refresh-dashboard-btn')) {
                this.refreshDashboard();
            }
        });
    }

    startAutoRefresh() {
        // Refresh data every 5 minutes
        this.refreshInterval = setInterval(() => {
            this.loadData().then(() => {
                this.updateActiveDashboard();
            });
        }, 5 * 60 * 1000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    async onNewCrash(crashData) {
        // Add to local cache
        this.crashReports.push(crashData);
        
        // Update active dashboard if open
        this.updateActiveDashboard();
        
        // Show notification if enabled
        this.showCrashNotification(crashData);
    }

    async onReportGenerated(reportData) {
        // Reload data to get the complete report
        await this.loadData();
        
        // Update active dashboard if open
        this.updateActiveDashboard();
    }

    showCrashNotification(crashData) {
        if (window.micBrowser && typeof window.micBrowser.showNotification === 'function') {
            window.micBrowser.showNotification(
                'Crash Detected',
                `Application crash detected: ${crashData.error?.type || 'Unknown error'}`,
                'warning'
            );
        }
    }

    updateActiveDashboard() {
        const dashboard = document.querySelector('.crash-analytics-dashboard');
        if (dashboard) {
            this.renderDashboardContent(dashboard);
        }
    }

    async showDashboard() {
        // Ensure data is fresh
        await this.loadData();
        
        // Create dashboard modal
        const modal = this.createDashboardModal();
        document.body.appendChild(modal);
        
        // Render content
        this.renderDashboardContent(modal.querySelector('.crash-analytics-dashboard'));
        
        return modal;
    }

    createDashboardModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay crash-analytics-modal';
        modal.innerHTML = `
            <div class="modal-content large-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-chart-line"></i> Crash Analytics Dashboard</h3>
                    <div class="dashboard-actions">
                        <button class="action-btn secondary refresh-dashboard-btn" title="Refresh Data">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                        <button class="action-btn secondary export-dashboard-btn" title="Export Data">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="modal-body">
                    <div class="crash-analytics-dashboard">
                        <div class="loading-indicator">
                            <i class="fas fa-spinner fa-spin"></i> Loading analytics...
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        modal.querySelector('.export-dashboard-btn').addEventListener('click', () => {
            this.exportDashboardData();
        });

        return modal;
    }

    renderDashboardContent(container) {
        if (!container) return;

        const content = `
            <div class="dashboard-summary">
                ${this.renderSummaryCards()}
            </div>
            
            <div class="dashboard-charts">
                <div class="chart-section">
                    <h4><i class="fas fa-chart-line"></i> Crash Trends (Last 30 Days)</h4>
                    <div class="crash-trends-chart">
                        ${this.renderTrendsChart()}
                    </div>
                </div>
                
                <div class="chart-section">
                    <h4><i class="fas fa-chart-pie"></i> Crash Types Distribution</h4>
                    <div class="crash-types-chart">
                        ${this.renderTypesChart()}
                    </div>
                </div>
            </div>
            
            <div class="dashboard-tables">
                <div class="table-section">
                    <h4><i class="fas fa-list"></i> Recent Crashes</h4>
                    ${this.renderRecentCrashesTable()}
                </div>
                
                <div class="table-section">
                    <h4><i class="fas fa-exclamation-triangle"></i> Most Frequent Issues</h4>
                    ${this.renderFrequentIssuesTable()}
                </div>
            </div>
            
            <div class="dashboard-insights">
                <h4><i class="fas fa-lightbulb"></i> Insights & Recommendations</h4>
                ${this.renderInsights()}
            </div>
        `;

        container.innerHTML = content;
    }

    renderSummaryCards() {
        const totalCrashes = this.crashReports.length;
        const recentCrashes = this.getRecentCrashes(7);
        const criticalCrashes = this.getCriticalCrashes();
        const avgCrashesPerDay = this.getAverageCrashesPerDay();

        return `
            <div class="summary-cards">
                <div class="summary-card total">
                    <div class="card-icon"><i class="fas fa-bug"></i></div>
                    <div class="card-content">
                        <h3>${totalCrashes}</h3>
                        <p>Total Crashes</p>
                    </div>
                </div>
                
                <div class="summary-card recent">
                    <div class="card-icon"><i class="fas fa-clock"></i></div>
                    <div class="card-content">
                        <h3>${recentCrashes}</h3>
                        <p>Last 7 Days</p>
                    </div>
                </div>
                
                <div class="summary-card critical">
                    <div class="card-icon"><i class="fas fa-exclamation-triangle"></i></div>
                    <div class="card-content">
                        <h3>${criticalCrashes}</h3>
                        <p>Critical Crashes</p>
                    </div>
                </div>
                
                <div class="summary-card average">
                    <div class="card-icon"><i class="fas fa-chart-bar"></i></div>
                    <div class="card-content">
                        <h3>${avgCrashesPerDay.toFixed(1)}</h3>
                        <p>Avg/Day</p>
                    </div>
                </div>
            </div>
        `;
    }

    renderTrendsChart() {
        const chartData = this.generateTrendsData();
        const maxValue = Math.max(...chartData.map(d => d.crashes), 1);
        
        return `
            <div class="trends-chart">
                ${chartData.map(day => `
                    <div class="chart-bar" style="height: ${(day.crashes / maxValue) * 100}%">
                        <div class="bar-value">${day.crashes}</div>
                        <div class="bar-label">${day.label}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderTypesChart() {
        const types = this.getCrashTypeDistribution();
        const total = Object.values(types).reduce((sum, count) => sum + count, 0);
        
        if (total === 0) {
            return '<div class="no-data">No crash data available</div>';
        }

        return `
            <div class="types-chart">
                ${Object.entries(types).map(([type, count]) => {
                    const percentage = ((count / total) * 100).toFixed(1);
                    return `
                        <div class="type-bar">
                            <div class="type-label">${type}</div>
                            <div class="type-progress">
                                <div class="type-fill" style="width: ${percentage}%"></div>
                            </div>
                            <div class="type-value">${count} (${percentage}%)</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    renderRecentCrashesTable() {
        const recentCrashes = this.crashReports.slice(-10).reverse();
        
        if (recentCrashes.length === 0) {
            return '<div class="no-data">No crash reports found</div>';
        }

        return `
            <div class="crashes-table">
                <table>
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Type</th>
                            <th>Message</th>
                            <th>Severity</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${recentCrashes.map(crash => `
                            <tr>
                                <td>${new Date(crash.timestamp).toLocaleString()}</td>
                                <td><span class="crash-type-badge">${crash.error?.type || 'Unknown'}</span></td>
                                <td title="${crash.error?.message || 'No message'}">${(crash.error?.message || 'No message').substring(0, 50)}...</td>
                                <td><span class="severity-badge ${crash.severity || 'medium'}">${crash.severity || 'Medium'}</span></td>
                                <td>
                                    <button class="action-btn small" onclick="window.crashDashboard.viewCrashDetails('${crash.id}')">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderFrequentIssuesTable() {
        const issues = this.getFrequentIssues();
        
        if (issues.length === 0) {
            return '<div class="no-data">No frequent issues detected</div>';
        }

        return `
            <div class="issues-table">
                <table>
                    <thead>
                        <tr>
                            <th>Issue</th>
                            <th>Occurrences</th>
                            <th>First Seen</th>
                            <th>Last Seen</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${issues.map(issue => `
                            <tr>
                                <td>${issue.type}</td>
                                <td><span class="occurrence-count">${issue.count}</span></td>
                                <td>${new Date(issue.firstSeen).toLocaleDateString()}</td>
                                <td>${new Date(issue.lastSeen).toLocaleDateString()}</td>
                                <td><span class="status-badge ${issue.status}">${issue.status}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderInsights() {
        const insights = this.generateInsights();
        
        if (insights.length === 0) {
            return '<div class="no-insights">No insights available yet. More crash data needed for analysis.</div>';
        }

        return `
            <div class="insights-list">
                ${insights.map(insight => `
                    <div class="insight-item ${insight.type}">
                        <div class="insight-icon">
                            <i class="fas ${insight.icon}"></i>
                        </div>
                        <div class="insight-content">
                            <h5>${insight.title}</h5>
                            <p>${insight.description}</p>
                            ${insight.action ? `<button class="insight-action" onclick="${insight.action}">${insight.actionLabel}</button>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Data processing methods
    getRecentCrashes(days) {
        const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
        return this.crashReports.filter(crash => 
            new Date(crash.timestamp).getTime() > cutoff
        ).length;
    }

    getCriticalCrashes() {
        return this.crashReports.filter(crash => 
            crash.severity === 'critical' || crash.severity === 'high'
        ).length;
    }

    getAverageCrashesPerDay() {
        if (this.crashReports.length === 0) return 0;
        
        const firstCrash = Math.min(...this.crashReports.map(c => new Date(c.timestamp).getTime()));
        const daysSinceFirst = (Date.now() - firstCrash) / (24 * 60 * 60 * 1000);
        
        return daysSinceFirst > 0 ? this.crashReports.length / daysSinceFirst : 0;
    }

    generateTrendsData() {
        const data = [];
        const now = new Date();
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);
            
            const crashes = this.crashReports.filter(crash => {
                const crashTime = new Date(crash.timestamp);
                return crashTime >= dayStart && crashTime <= dayEnd;
            }).length;
            
            data.push({
                date: date.toISOString().split('T')[0],
                label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                crashes
            });
        }
        
        return data;
    }

    getCrashTypeDistribution() {
        const types = {};
        this.crashReports.forEach(crash => {
            const type = crash.error?.type || 'Unknown';
            types[type] = (types[type] || 0) + 1;
        });
        return types;
    }

    getFrequentIssues() {
        const issues = {};
        
        this.crashReports.forEach(crash => {
            const key = crash.error?.type || 'Unknown';
            if (!issues[key]) {
                issues[key] = {
                    type: key,
                    count: 0,
                    firstSeen: crash.timestamp,
                    lastSeen: crash.timestamp,
                    status: 'open'
                };
            }
            
            issues[key].count++;
            issues[key].lastSeen = Math.max(issues[key].lastSeen, crash.timestamp);
            issues[key].firstSeen = Math.min(issues[key].firstSeen, crash.timestamp);
        });
        
        return Object.values(issues)
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }

    generateInsights() {
        const insights = [];
        const recentCrashes = this.getRecentCrashes(7);
        const previousWeekCrashes = this.getRecentCrashes(14) - recentCrashes;
        
        // Trend analysis
        if (recentCrashes > previousWeekCrashes * 1.5) {
            insights.push({
                type: 'warning',
                icon: 'fa-trending-up',
                title: 'Increasing Crash Rate',
                description: `Crash rate has increased by ${((recentCrashes / Math.max(previousWeekCrashes, 1) - 1) * 100).toFixed(0)}% compared to the previous week.`,
                action: 'window.crashDashboard.showTrendDetails()',
                actionLabel: 'Investigate'
            });
        }
        
        // Memory issues
        const memoryIssues = this.crashReports.filter(crash => 
            crash.error?.message?.includes('memory') || crash.error?.type?.includes('Memory')
        ).length;
        
        if (memoryIssues > this.crashReports.length * 0.3) {
            insights.push({
                type: 'error',
                icon: 'fa-memory',
                title: 'Memory-Related Issues',
                description: `${memoryIssues} crashes (${((memoryIssues / this.crashReports.length) * 100).toFixed(0)}%) appear to be memory-related.`,
                action: 'window.crashDashboard.showMemoryAnalysis()',
                actionLabel: 'Analyze Memory Usage'
            });
        }
        
        // Performance recommendation
        if (this.crashReports.length > 50) {
            insights.push({
                type: 'info',
                icon: 'fa-lightbulb',
                title: 'Performance Optimization',
                description: 'Consider enabling performance monitoring to identify bottlenecks and prevent crashes.',
                action: 'window.micBrowser.switchSettingsTab("monitoring")',
                actionLabel: 'Enable Monitoring'
            });
        }
        
        return insights;
    }

    // Action methods
    async refreshDashboard() {
        console.log('🔄 Refreshing crash analytics dashboard...');
        await this.loadData();
        this.updateActiveDashboard();
    }

    async exportDashboardData() {
        try {
            if (!window.electronAPI?.crashReporting) {
                alert('Crash reporting API not available');
                return;
            }

            const result = await window.electronAPI.crashReporting.exportReports();
            if (result.success) {
                alert(`Dashboard data exported to: ${result.path}`);
            } else {
                alert(`Failed to export data: ${result.error}`);
            }
        } catch (error) {
            console.error('Failed to export dashboard data:', error);
            alert('Failed to export data. Please try again.');
        }
    }

    viewCrashDetails(crashId) {
        const crash = this.crashReports.find(c => c.id === crashId);
        if (!crash) {
            alert('Crash report not found');
            return;
        }

        // Create detailed crash view modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay crash-details-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-bug"></i> Crash Details</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="crash-details">
                        <div class="detail-section">
                            <h4>Basic Information</h4>
                            <table class="details-table">
                                <tr><td>Timestamp:</td><td>${new Date(crash.timestamp).toLocaleString()}</td></tr>
                                <tr><td>Type:</td><td>${crash.error?.type || 'Unknown'}</td></tr>
                                <tr><td>Severity:</td><td>${crash.severity || 'Medium'}</td></tr>
                                <tr><td>Platform:</td><td>${crash.system?.platform || 'Unknown'}</td></tr>
                            </table>
                        </div>
                        
                        <div class="detail-section">
                            <h4>Error Details</h4>
                            <div class="error-message">${crash.error?.message || 'No error message available'}</div>
                            ${crash.error?.stack ? `<div class="error-stack"><pre>${crash.error.stack}</pre></div>` : ''}
                        </div>
                        
                        ${crash.system ? `
                            <div class="detail-section">
                                <h4>System Information</h4>
                                <table class="details-table">
                                    <tr><td>CPU:</td><td>${crash.system.cpu || 'Unknown'}</td></tr>
                                    <tr><td>Memory:</td><td>${crash.system.memory || 'Unknown'}</td></tr>
                                    <tr><td>OS Version:</td><td>${crash.system.osVersion || 'Unknown'}</td></tr>
                                </table>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    destroy() {
        this.stopAutoRefresh();
        
        // Remove event listeners
        if (window.electronAPI?.crashReporting) {
            window.electronAPI.crashReporting.removeAllListeners();
        }
        
        console.log('🚨 Crash Analytics Dashboard destroyed');
    }
}

// Initialize global instance
window.crashDashboard = new CrashAnalyticsDashboard();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CrashAnalyticsDashboard;
}