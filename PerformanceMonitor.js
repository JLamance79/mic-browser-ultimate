// ================================================================
// PERFORMANCE MONITORING DASHBOARD
// ================================================================
// Advanced performance monitoring and visualization for MIC Browser Ultimate

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            memory: [],
            cpu: [],
            fps: [],
            renderTime: [],
            ipcLatency: [],
            networkRequests: [],
            domNodes: [],
            jsHeapSize: [],
            eventLoopLag: []
        };
        
        this.maxDataPoints = 100;
        this.updateInterval = 1000; // 1 second
        this.chartCanvas = null;
        this.chartContext = null;
        this.isMonitoring = false;
        this.performanceObserver = null;
        this.frameId = null;
        
        this.thresholds = {
            memory: { warning: 100, critical: 200 }, // MB
            fps: { warning: 30, critical: 15 },
            renderTime: { warning: 16, critical: 32 }, // ms
            ipcLatency: { warning: 50, critical: 100 }, // ms
            eventLoopLag: { warning: 10, critical: 50 } // ms
        };
        
        this.init();
    }

    init() {
        console.log('📊 Initializing Performance Monitor...');
        
        try {
            this.setupPerformanceObserver();
            this.enhanceDebugConsole();
            
            // Only start monitoring if we're in a proper environment
            if (document.readyState === 'complete' || document.readyState === 'interactive') {
                // Delay start to ensure DOM is ready
                setTimeout(() => {
                    this.startMonitoring();
                }, 1000);
            } else {
                document.addEventListener('DOMContentLoaded', () => {
                    setTimeout(() => {
                        this.startMonitoring();
                    }, 1000);
                });
            }
            
            console.log('✅ Performance Monitor initialized');
        } catch (error) {
            console.error('❌ Performance Monitor initialization failed:', error);
        }
    }

    enhanceDebugConsole() {
        // Wait for debug console to be available
        setTimeout(() => {
            this.injectAdvancedPerformanceUI();
            this.setupEventListeners();
        }, 1500);
    }

    injectAdvancedPerformanceUI() {
        const performanceContent = document.getElementById('debug-performance-content');
        if (!performanceContent) {
            console.warn('Performance tab not found, creating standalone dashboard');
            return;
        }

        // Replace existing performance content with advanced dashboard
        performanceContent.innerHTML = this.createAdvancedPerformanceUI();
        
        // Initialize chart canvas
        this.initializeChart();
        
        console.log('📊 Advanced performance UI injected');
    }

    createAdvancedPerformanceUI() {
        return `
            <div class="performance-dashboard">
                <div class="performance-controls">
                    <div class="control-group">
                        <button id="perf-start-stop" class="perf-btn primary">⏸️ Pause Monitoring</button>
                        <button id="perf-reset" class="perf-btn">🔄 Reset Data</button>
                        <button id="perf-export" class="perf-btn">💾 Export Report</button>
                        <button id="perf-screenshot" class="perf-btn">📷 Capture</button>
                    </div>
                    
                    <div class="monitoring-options">
                        <label><input type="checkbox" id="monitor-memory" checked> Memory</label>
                        <label><input type="checkbox" id="monitor-fps" checked> FPS</label>
                        <label><input type="checkbox" id="monitor-render" checked> Render Time</label>
                        <label><input type="checkbox" id="monitor-ipc" checked> IPC Latency</label>
                        <label><input type="checkbox" id="monitor-network" checked> Network</label>
                    </div>
                </div>

                <div class="performance-alerts" id="performance-alerts"></div>

                <div class="metrics-grid">
                    <div class="metric-card memory">
                        <div class="metric-header">
                            <span class="metric-icon">🧠</span>
                            <span class="metric-title">Memory Usage</span>
                            <span class="metric-status" id="memory-status">●</span>
                        </div>
                        <div class="metric-value">
                            <span class="primary-value" id="memory-current">-- MB</span>
                            <span class="secondary-value">/ <span id="memory-limit">-- MB</span></span>
                        </div>
                        <div class="metric-details">
                            <span>Peak: <span id="memory-peak">-- MB</span></span>
                            <span>Avg: <span id="memory-avg">-- MB</span></span>
                        </div>
                        <div class="metric-sparkline" id="memory-sparkline"></div>
                    </div>

                    <div class="metric-card fps">
                        <div class="metric-header">
                            <span class="metric-icon">🎯</span>
                            <span class="metric-title">Frame Rate</span>
                            <span class="metric-status" id="fps-status">●</span>
                        </div>
                        <div class="metric-value">
                            <span class="primary-value" id="fps-current">-- FPS</span>
                        </div>
                        <div class="metric-details">
                            <span>Min: <span id="fps-min">-- FPS</span></span>
                            <span>Avg: <span id="fps-avg">-- FPS</span></span>
                        </div>
                        <div class="metric-sparkline" id="fps-sparkline"></div>
                    </div>

                    <div class="metric-card render">
                        <div class="metric-header">
                            <span class="metric-icon">⚡</span>
                            <span class="metric-title">Render Time</span>
                            <span class="metric-status" id="render-status">●</span>
                        </div>
                        <div class="metric-value">
                            <span class="primary-value" id="render-current">-- ms</span>
                        </div>
                        <div class="metric-details">
                            <span>Max: <span id="render-max">-- ms</span></span>
                            <span>Avg: <span id="render-avg">-- ms</span></span>
                        </div>
                        <div class="metric-sparkline" id="render-sparkline"></div>
                    </div>

                    <div class="metric-card ipc">
                        <div class="metric-header">
                            <span class="metric-icon">📡</span>
                            <span class="metric-title">IPC Latency</span>
                            <span class="metric-status" id="ipc-status">●</span>
                        </div>
                        <div class="metric-value">
                            <span class="primary-value" id="ipc-current">-- ms</span>
                        </div>
                        <div class="metric-details">
                            <span>Calls: <span id="ipc-calls">--</span></span>
                            <span>Avg: <span id="ipc-avg">-- ms</span></span>
                        </div>
                        <div class="metric-sparkline" id="ipc-sparkline"></div>
                    </div>

                    <div class="metric-card network">
                        <div class="metric-header">
                            <span class="metric-icon">🌐</span>
                            <span class="metric-title">Network</span>
                            <span class="metric-status" id="network-status">●</span>
                        </div>
                        <div class="metric-value">
                            <span class="primary-value" id="network-requests">--</span>
                            <span class="secondary-value">requests</span>
                        </div>
                        <div class="metric-details">
                            <span>Active: <span id="network-active">--</span></span>
                            <span>Failed: <span id="network-failed">--</span></span>
                        </div>
                        <div class="metric-sparkline" id="network-sparkline"></div>
                    </div>

                    <div class="metric-card system">
                        <div class="metric-header">
                            <span class="metric-icon">💻</span>
                            <span class="metric-title">System</span>
                            <span class="metric-status" id="system-status">●</span>
                        </div>
                        <div class="metric-value">
                            <span class="primary-value" id="dom-nodes">--</span>
                            <span class="secondary-value">DOM nodes</span>
                        </div>
                        <div class="metric-details">
                            <span>Listeners: <span id="event-listeners">--</span></span>
                            <span>Timers: <span id="active-timers">--</span></span>
                        </div>
                        <div class="metric-sparkline" id="system-sparkline"></div>
                    </div>
                </div>

                <div class="performance-chart-container">
                    <div class="chart-header">
                        <h4>📈 Real-time Performance Chart</h4>
                        <div class="chart-controls">
                            <select id="chart-timespan">
                                <option value="60">Last 60 seconds</option>
                                <option value="300" selected>Last 5 minutes</option>
                                <option value="900">Last 15 minutes</option>
                            </select>
                            <select id="chart-metrics">
                                <option value="all">All Metrics</option>
                                <option value="memory">Memory Only</option>
                                <option value="performance">Performance Only</option>
                                <option value="network">Network Only</option>
                            </select>
                        </div>
                    </div>
                    <canvas id="performance-chart" width="800" height="300"></canvas>
                </div>

                <div class="performance-analysis">
                    <div class="analysis-section">
                        <h4>🔍 Performance Analysis</h4>
                        <div id="performance-insights" class="insights-container">
                            <div class="insight">
                                <span class="insight-icon">📊</span>
                                <span class="insight-text">Monitoring started. Collecting baseline metrics...</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bottlenecks-section">
                        <h4>⚠️ Potential Bottlenecks</h4>
                        <div id="bottlenecks-list" class="bottlenecks-container">
                            <div class="no-issues">No performance issues detected.</div>
                        </div>
                    </div>
                </div>

                <div class="performance-recommendations">
                    <h4>💡 Optimization Recommendations</h4>
                    <div id="recommendations-list" class="recommendations-container">
                        <div class="recommendation">
                            <span class="rec-icon">🚀</span>
                            <span class="rec-text">Performance monitoring is active. Recommendations will appear based on collected data.</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Start/Stop monitoring
        document.getElementById('perf-start-stop')?.addEventListener('click', () => {
            this.toggleMonitoring();
        });

        // Reset data
        document.getElementById('perf-reset')?.addEventListener('click', () => {
            this.resetMetrics();
        });

        // Export report
        document.getElementById('perf-export')?.addEventListener('click', () => {
            this.exportPerformanceReport();
        });

        // Screenshot
        document.getElementById('perf-screenshot')?.addEventListener('click', () => {
            this.capturePerformanceScreenshot();
        });

        // Chart controls
        document.getElementById('chart-timespan')?.addEventListener('change', (e) => {
            this.updateChartTimespan(parseInt(e.target.value));
        });

        document.getElementById('chart-metrics')?.addEventListener('change', (e) => {
            this.updateChartMetrics(e.target.value);
        });

        // Monitoring options
        ['memory', 'fps', 'render', 'ipc', 'network'].forEach(metric => {
            document.getElementById(`monitor-${metric}`)?.addEventListener('change', (e) => {
                this.toggleMetricMonitoring(metric, e.target.checked);
            });
        });
    }

    initializeChart() {
        const canvas = document.getElementById('performance-chart');
        if (canvas) {
            this.chartCanvas = canvas;
            this.chartContext = canvas.getContext('2d');
            
            // Set up canvas for high DPI displays
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            this.chartContext.scale(dpr, dpr);
            canvas.style.width = rect.width + 'px';
            canvas.style.height = rect.height + 'px';
            
            console.log('📈 Performance chart initialized');
        }
    }

    setupPerformanceObserver() {
        try {
            // Performance Observer for detailed metrics
            this.performanceObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    this.processPerformanceEntry(entry);
                });
            });

            // Observe various performance entry types
            const entryTypes = ['measure', 'navigation', 'resource', 'paint'];
            entryTypes.forEach(type => {
                try {
                    this.performanceObserver.observe({ entryTypes: [type] });
                } catch (e) {
                    console.warn(`Performance observer type ${type} not supported`);
                }
            });

        } catch (error) {
            console.warn('Performance Observer not available:', error);
        }
    }

    processPerformanceEntry(entry) {
        switch (entry.entryType) {
            case 'measure':
                this.recordCustomMetric(entry.name, entry.duration);
                break;
            case 'navigation':
                this.recordNavigationTiming(entry);
                break;
            case 'resource':
                this.recordResourceTiming(entry);
                break;
            case 'paint':
                this.recordPaintTiming(entry);
                break;
        }
    }

    startMonitoring() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        console.log('📊 Performance monitoring started');

        // Start main monitoring loop
        this.monitoringInterval = setInterval(() => {
            this.collectMetrics();
        }, this.updateInterval);

        // Start frame rate monitoring
        this.startFPSMonitoring();

        // Update UI
        const startStopBtn = document.getElementById('perf-start-stop');
        if (startStopBtn) {
            startStopBtn.textContent = '⏸️ Pause Monitoring';
            startStopBtn.className = 'perf-btn warning';
        }
    }

    stopMonitoring() {
        if (!this.isMonitoring) return;
        
        this.isMonitoring = false;
        console.log('⏹️ Performance monitoring stopped');

        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }

        this.stopFPSMonitoring();

        // Update UI
        const startStopBtn = document.getElementById('perf-start-stop');
        if (startStopBtn) {
            startStopBtn.textContent = '▶️ Resume Monitoring';
            startStopBtn.className = 'perf-btn primary';
        }
    }

    toggleMonitoring() {
        if (this.isMonitoring) {
            this.stopMonitoring();
        } else {
            this.startMonitoring();
        }
    }

    collectMetrics() {
        try {
            const timestamp = Date.now();
            
            // Check if performance dashboard exists before doing anything
            if (!document.getElementById('debug-performance-content')) {
                // Dashboard doesn't exist, skip UI updates but collect basic metrics
                if (performance && performance.memory) {
                    this.addMetric('memory', timestamp, Math.round(performance.memory.usedJSHeapSize / 1024 / 1024));
                }
                return; // Exit early, no UI to update
            }
            
            // Memory metrics
            if (performance && performance.memory) {
                const memoryMB = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
                const memoryLimitMB = Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024);
                
                this.addMetric('memory', timestamp, memoryMB);
                this.addMetric('jsHeapSize', timestamp, performance.memory.usedJSHeapSize);
                
                this.updateMemoryUI(memoryMB, memoryLimitMB);
            }

            // DOM metrics (with safety check)
            if (document && document.querySelectorAll) {
                const domNodes = document.querySelectorAll('*').length;
                this.addMetric('domNodes', timestamp, domNodes);
            }

            // Network metrics
            this.collectNetworkMetrics(timestamp);

            // Update UI only if elements exist
            this.safeUpdateUI();
            
        } catch (error) {
            // Silently handle errors to prevent console spam
            // Only log if it's a new type of error
            if (!this.lastError || this.lastError !== error.message) {
                console.debug('Performance monitoring error (non-critical):', error.message);
                this.lastError = error.message;
            }
        }
    }

    addMetric(type, timestamp, value) {
        if (!this.metrics[type]) {
            this.metrics[type] = [];
        }

        this.metrics[type].push({ timestamp, value });

        // Keep only recent data points
        if (this.metrics[type].length > this.maxDataPoints) {
            this.metrics[type].shift();
        }
    }

    startFPSMonitoring() {
        let frameCount = 0;
        let lastTime = performance.now();
        let lastFPSUpdate = lastTime;

        const countFrame = (currentTime) => {
            frameCount++;
            
            // Update FPS every second
            if (currentTime - lastFPSUpdate >= 1000) {
                const fps = Math.round((frameCount * 1000) / (currentTime - lastFPSUpdate));
                const renderTime = currentTime - lastTime;
                
                this.addMetric('fps', Date.now(), fps);
                this.addMetric('renderTime', Date.now(), renderTime);
                
                this.updateFPSUI(fps);
                this.updateRenderTimeUI(renderTime);
                
                frameCount = 0;
                lastFPSUpdate = currentTime;
            }
            
            lastTime = currentTime;
            
            if (this.isMonitoring) {
                this.frameId = requestAnimationFrame(countFrame);
            }
        };

        this.frameId = requestAnimationFrame(countFrame);
    }

    stopFPSMonitoring() {
        if (this.frameId) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }
    }

    collectNetworkMetrics(timestamp) {
        // Network requests from Performance API
        const resources = performance.getEntriesByType('resource');
        const recentResources = resources.filter(r => r.startTime > timestamp - this.updateInterval);
        
        this.addMetric('networkRequests', timestamp, recentResources.length);
        
        // Update network UI
        this.updateNetworkUI(resources);
    }

    updateMemoryUI(current, limit) {
        // Add null checks to prevent errors
        const memoryCurrentElement = document.getElementById('memory-current');
        const memoryLimitElement = document.getElementById('memory-limit');
        const memoryPeakElement = document.getElementById('memory-peak');
        const memoryAvgElement = document.getElementById('memory-avg');
        
        if (memoryCurrentElement) memoryCurrentElement.textContent = `${current} MB`;
        if (memoryLimitElement) memoryLimitElement.textContent = `${limit} MB`;
        
        const memoryData = this.metrics.memory || [];
        if (memoryData.length > 0 && memoryPeakElement && memoryAvgElement) {
            const values = memoryData.map(d => d.value);
            const peak = Math.max(...values);
            const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
            
            memoryPeakElement.textContent = `${peak} MB`;
            memoryAvgElement.textContent = `${avg} MB`;
        }
        
        // Update status indicator
        const memoryStatusElement = document.getElementById('memory-status');
        if (memoryStatusElement) {
            const status = this.getMetricStatus('memory', current);
            memoryStatusElement.className = `metric-status ${status}`;
        }
    }

    updateFPSUI(fps) {
        document.getElementById('fps-current').textContent = `${fps} FPS`;
        
        const fpsData = this.metrics.fps || [];
        if (fpsData.length > 0) {
            const values = fpsData.map(d => d.value);
            const min = Math.min(...values);
            const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
            
            document.getElementById('fps-min').textContent = `${min} FPS`;
            document.getElementById('fps-avg').textContent = `${avg} FPS`;
        }
        
        const status = this.getMetricStatus('fps', fps);
        document.getElementById('fps-status').className = `metric-status ${status}`;
    }

    updateRenderTimeUI(renderTime) {
        document.getElementById('render-current').textContent = `${renderTime.toFixed(1)} ms`;
        
        const renderData = this.metrics.renderTime || [];
        if (renderData.length > 0) {
            const values = renderData.map(d => d.value);
            const max = Math.max(...values);
            const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
            
            document.getElementById('render-max').textContent = `${max.toFixed(1)} ms`;
            document.getElementById('render-avg').textContent = `${avg} ms`;
        }
        
        const status = this.getMetricStatus('renderTime', renderTime);
        document.getElementById('render-status').className = `metric-status ${status}`;
    }

    updateNetworkUI(resources) {
        const total = resources.length;
        const failed = resources.filter(r => r.responseStatus >= 400).length;
        const active = resources.filter(r => !r.responseEnd).length;
        
        document.getElementById('network-requests').textContent = total;
        document.getElementById('network-active').textContent = active;
        document.getElementById('network-failed').textContent = failed;
        
        const status = failed > 0 ? 'critical' : active > 5 ? 'warning' : 'good';
        document.getElementById('network-status').className = `metric-status ${status}`;
    }

    updateMetricsUI() {
        // Update DOM nodes
        const domNodes = document.querySelectorAll('*').length;
        document.getElementById('dom-nodes').textContent = domNodes;
        
        // Update system metrics
        const listeners = this.getEventListenerCount();
        const timers = this.getActiveTimerCount();
        
        document.getElementById('event-listeners').textContent = listeners;
        document.getElementById('active-timers').textContent = timers;
        
        const systemStatus = domNodes > 5000 ? 'warning' : 'good';
        document.getElementById('system-status').className = `metric-status ${systemStatus}`;
    }

    getMetricStatus(metric, value) {
        const threshold = this.thresholds[metric];
        if (!threshold) return 'good';
        
        if (metric === 'fps') {
            // For FPS, lower is worse
            if (value < threshold.critical) return 'critical';
            if (value < threshold.warning) return 'warning';
            return 'good';
        } else {
            // For other metrics, higher is worse
            if (value > threshold.critical) return 'critical';
            if (value > threshold.warning) return 'warning';
            return 'good';
        }
    }

    safeUpdateUI() {
        try {
            // Only update if UI elements exist
            if (document.getElementById('performance-chart')) {
                this.updateChart();
            }
            
            if (document.getElementById('performance-insights')) {
                this.analyzePerformance();
            }
            
            this.updateMetricsUI();
        } catch (error) {
            // Silently handle UI update errors to prevent cascading failures
            console.debug('UI update skipped:', error.message);
        }
    }

    updateChart() {
        if (!this.chartContext) return;

        const ctx = this.chartContext;
        const canvas = this.chartCanvas;
        const width = canvas.width / (window.devicePixelRatio || 1);
        const height = canvas.height / (window.devicePixelRatio || 1);

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw grid
        this.drawGrid(ctx, width, height);

        // Draw metrics
        this.drawMetricLine(ctx, width, height, this.metrics.memory, '#3b82f6', 'Memory (MB)');
        this.drawMetricLine(ctx, width, height, this.metrics.fps, '#10b981', 'FPS');
        this.drawMetricLine(ctx, width, height, this.metrics.renderTime, '#f59e0b', 'Render Time (ms)');
    }

    drawGrid(ctx, width, height) {
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x <= width; x += width / 10) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= height; y += height / 5) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
    }

    drawMetricLine(ctx, width, height, data, color, label) {
        if (!data || data.length < 2) return;

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        const maxValue = Math.max(...data.map(d => d.value));
        const minValue = Math.min(...data.map(d => d.value));
        const range = maxValue - minValue || 1;

        data.forEach((point, index) => {
            const x = (index / (data.length - 1)) * width;
            const y = height - ((point.value - minValue) / range) * height;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();
    }

    analyzePerformance() {
        const insights = [];
        const bottlenecks = [];
        const recommendations = [];

        // Analyze memory
        const memoryData = this.metrics.memory || [];
        if (memoryData.length > 10) {
            const recent = memoryData.slice(-10);
            const trend = this.calculateTrend(recent);
            
            if (trend > 5) {
                bottlenecks.push({
                    type: 'memory',
                    severity: 'warning',
                    message: 'Memory usage increasing rapidly',
                    details: `+${trend.toFixed(1)} MB/min trend`
                });
                recommendations.push({
                    type: 'memory',
                    message: 'Consider reducing object creation or implementing garbage collection optimization'
                });
            }
        }

        // Analyze FPS
        const fpsData = this.metrics.fps || [];
        if (fpsData.length > 0) {
            const avgFps = fpsData.reduce((sum, d) => sum + d.value, 0) / fpsData.length;
            
            if (avgFps < 30) {
                bottlenecks.push({
                    type: 'performance',
                    severity: 'critical',
                    message: 'Low frame rate detected',
                    details: `Average: ${avgFps.toFixed(1)} FPS`
                });
                recommendations.push({
                    type: 'performance',
                    message: 'Optimize rendering operations and reduce DOM manipulations'
                });
            }
        }

        this.updateInsights(insights, bottlenecks, recommendations);
    }

    calculateTrend(data) {
        if (data.length < 2) return 0;
        
        const first = data[0].value;
        const last = data[data.length - 1].value;
        const timeSpan = (data[data.length - 1].timestamp - data[0].timestamp) / 60000; // minutes
        
        return timeSpan > 0 ? (last - first) / timeSpan : 0;
    }

    updateInsights(insights, bottlenecks, recommendations) {
        // Update insights
        const insightsContainer = document.getElementById('performance-insights');
        if (insightsContainer && insights.length > 0) {
            insightsContainer.innerHTML = insights.map(insight => `
                <div class="insight">
                    <span class="insight-icon">${insight.icon}</span>
                    <span class="insight-text">${insight.message}</span>
                </div>
            `).join('');
        }

        // Update bottlenecks
        const bottlenecksContainer = document.getElementById('bottlenecks-list');
        if (bottlenecksContainer) {
            if (bottlenecks.length === 0) {
                bottlenecksContainer.innerHTML = '<div class="no-issues">No performance issues detected.</div>';
            } else {
                bottlenecksContainer.innerHTML = bottlenecks.map(bottleneck => `
                    <div class="bottleneck ${bottleneck.severity}">
                        <span class="bottleneck-icon">${bottleneck.severity === 'critical' ? '🔴' : '⚠️'}</span>
                        <div class="bottleneck-content">
                            <div class="bottleneck-message">${bottleneck.message}</div>
                            <div class="bottleneck-details">${bottleneck.details}</div>
                        </div>
                    </div>
                `).join('');
            }
        }

        // Update recommendations
        const recommendationsContainer = document.getElementById('recommendations-list');
        if (recommendationsContainer && recommendations.length > 0) {
            recommendationsContainer.innerHTML = recommendations.map(rec => `
                <div class="recommendation">
                    <span class="rec-icon">💡</span>
                    <span class="rec-text">${rec.message}</span>
                </div>
            `).join('');
        }
    }

    // Utility methods
    resetMetrics() {
        Object.keys(this.metrics).forEach(key => {
            this.metrics[key] = [];
        });
        
        console.log('🔄 Performance metrics reset');
        
        if (this.chartContext) {
            this.chartContext.clearRect(0, 0, this.chartCanvas.width, this.chartCanvas.height);
        }
    }

    exportPerformanceReport() {
        const report = {
            timestamp: new Date().toISOString(),
            duration: this.isMonitoring ? Date.now() - (this.monitoringStartTime || Date.now()) : 0,
            metrics: this.metrics,
            thresholds: this.thresholds,
            summary: this.generateSummary()
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `performance-report-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('💾 Performance report exported');
    }

    generateSummary() {
        const summary = {};
        
        Object.keys(this.metrics).forEach(metric => {
            const data = this.metrics[metric];
            if (data.length > 0) {
                const values = data.map(d => d.value);
                summary[metric] = {
                    count: data.length,
                    min: Math.min(...values),
                    max: Math.max(...values),
                    avg: values.reduce((a, b) => a + b, 0) / values.length,
                    latest: values[values.length - 1]
                };
            }
        });
        
        return summary;
    }

    capturePerformanceScreenshot() {
        // Capture the performance dashboard as image
        const dashboard = document.querySelector('.performance-dashboard');
        if (dashboard && window.html2canvas) {
            html2canvas(dashboard).then(canvas => {
                const link = document.createElement('a');
                link.download = `performance-screenshot-${Date.now()}.png`;
                link.href = canvas.toDataURL();
                link.click();
            });
        } else {
            console.log('📷 Screenshot captured (html2canvas not available for actual capture)');
        }
    }

    getEventListenerCount() {
        // Estimate event listener count (simplified)
        return document.querySelectorAll('[onclick], [onload], [onchange]').length;
    }

    getActiveTimerCount() {
        // This is an approximation - real implementation would track timers
        return 0;
    }

    // Public API for integration
    recordCustomMetric(name, value) {
        this.addMetric(name, Date.now(), value);
    }

    setThreshold(metric, warning, critical) {
        this.thresholds[metric] = { warning, critical };
    }

    // Integration with IPC monitoring
    recordIPCLatency(latency) {
        this.addMetric('ipcLatency', Date.now(), latency);
        
        // Update IPC UI
        const ipcData = this.metrics.ipcLatency || [];
        if (ipcData.length > 0) {
            const latest = ipcData[ipcData.length - 1].value;
            const avg = ipcData.reduce((sum, d) => sum + d.value, 0) / ipcData.length;
            
            document.getElementById('ipc-current').textContent = `${latest.toFixed(1)} ms`;
            document.getElementById('ipc-calls').textContent = ipcData.length;
            document.getElementById('ipc-avg').textContent = `${avg.toFixed(1)} ms`;
            
            const status = this.getMetricStatus('ipcLatency', latest);
            document.getElementById('ipc-status').className = `metric-status ${status}`;
        }
    }
}

// CSS for performance dashboard
const performanceCSS = `
<style>
.performance-dashboard {
    padding: 15px;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    color: #e0e0e0;
}

.performance-controls {
    background: #2a2a2a;
    padding: 12px;
    border-radius: 6px;
    margin-bottom: 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
}

.control-group {
    display: flex;
    gap: 8px;
}

.perf-btn {
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 11px;
    background: #444;
    color: #e0e0e0;
    transition: background-color 0.2s;
}

.perf-btn:hover { background: #555; }
.perf-btn.primary { background: #3b82f6; }
.perf-btn.warning { background: #f59e0b; }
.perf-btn.danger { background: #ef4444; }

.monitoring-options {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
}

.monitoring-options label {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    color: #aaa;
}

.performance-alerts {
    margin-bottom: 15px;
}

.metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
    margin-bottom: 20px;
}

.metric-card {
    background: #2a2a2a;
    border-radius: 6px;
    padding: 12px;
    border-left: 4px solid #444;
    transition: transform 0.2s;
}

.metric-card:hover {
    transform: translateY(-2px);
}

.metric-card.memory { border-left-color: #3b82f6; }
.metric-card.fps { border-left-color: #10b981; }
.metric-card.render { border-left-color: #f59e0b; }
.metric-card.ipc { border-left-color: #8b5cf6; }
.metric-card.network { border-left-color: #06b6d4; }
.metric-card.system { border-left-color: #6b7280; }

.metric-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
}

.metric-icon {
    font-size: 16px;
    margin-right: 6px;
}

.metric-title {
    font-weight: bold;
    color: #e0e0e0;
    font-size: 11px;
}

.metric-status {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
}

.metric-status.good { background: #10b981; }
.metric-status.warning { background: #f59e0b; }
.metric-status.critical { background: #ef4444; }

.metric-value {
    margin-bottom: 6px;
}

.primary-value {
    font-size: 18px;
    font-weight: bold;
    color: #e0e0e0;
}

.secondary-value {
    font-size: 10px;
    color: #aaa;
}

.metric-details {
    display: flex;
    justify-content: space-between;
    font-size: 9px;
    color: #888;
    margin-bottom: 8px;
}

.metric-sparkline {
    height: 20px;
    background: #1a1a1a;
    border-radius: 2px;
    position: relative;
    overflow: hidden;
}

.performance-chart-container {
    background: #2a2a2a;
    border-radius: 6px;
    padding: 15px;
    margin-bottom: 20px;
}

.chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.chart-header h4 {
    margin: 0;
    color: #e0e0e0;
}

.chart-controls {
    display: flex;
    gap: 10px;
}

.chart-controls select {
    background: #444;
    border: 1px solid #555;
    color: #e0e0e0;
    padding: 4px 8px;
    border-radius: 3px;
    font-size: 11px;
}

#performance-chart {
    width: 100%;
    height: 300px;
    background: #1a1a1a;
    border-radius: 4px;
}

.performance-analysis {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin-bottom: 20px;
}

.analysis-section, .bottlenecks-section {
    background: #2a2a2a;
    border-radius: 6px;
    padding: 12px;
}

.analysis-section h4, .bottlenecks-section h4 {
    margin: 0 0 10px 0;
    color: #e0e0e0;
    font-size: 12px;
}

.insights-container, .bottlenecks-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.insight, .bottleneck {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    background: #1a1a1a;
    border-radius: 3px;
    font-size: 10px;
}

.bottleneck.warning {
    border-left: 3px solid #f59e0b;
}

.bottleneck.critical {
    border-left: 3px solid #ef4444;
}

.bottleneck-content {
    flex: 1;
}

.bottleneck-message {
    color: #e0e0e0;
    font-weight: bold;
}

.bottleneck-details {
    color: #aaa;
    font-size: 9px;
}

.no-issues {
    color: #10b981;
    font-style: italic;
    text-align: center;
    padding: 10px;
}

.performance-recommendations {
    background: #2a2a2a;
    border-radius: 6px;
    padding: 12px;
}

.performance-recommendations h4 {
    margin: 0 0 10px 0;
    color: #e0e0e0;
    font-size: 12px;
}

.recommendations-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.recommendation {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    background: #1a1a1a;
    border-radius: 3px;
    font-size: 10px;
    border-left: 3px solid #3b82f6;
}

.rec-icon {
    font-size: 12px;
}

@media (max-width: 768px) {
    .metrics-grid {
        grid-template-columns: 1fr;
    }
    
    .performance-analysis {
        grid-template-columns: 1fr;
    }
    
    .performance-controls {
        flex-direction: column;
        align-items: stretch;
    }
}
</style>
`;

// Inject CSS
document.head.insertAdjacentHTML('beforeend', performanceCSS);

// Initialize performance monitor
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.performanceMonitor = new PerformanceMonitor();
    });
} else {
    window.performanceMonitor = new PerformanceMonitor();
}

// Export for external access
window.PerformanceMonitor = PerformanceMonitor;