// Backend URL - фиксированный порт 3001
const BACKEND_URL = 'http://localhost:3001';

async function loadHealthData() {
    document.getElementById('status').textContent = 'Fetching health data...';
    
    try {
        const healthResponse = await fetch(BACKEND_URL + '/health');
        
        if (!healthResponse.ok) {
            throw new Error(`HTTP ${healthResponse.status}: ${healthResponse.statusText}`);
        }
        
        const healthData = await healthResponse.json();
        
        document.getElementById('status').textContent = 'Fetching metrics...';
        const metricsResponse = await fetch(BACKEND_URL + '/metrics/simple');
        const metricsText = await metricsResponse.text();
        
        updateDashboard(healthData, metricsText);
        document.getElementById('timestamp').textContent = 
            'Last updated: ' + new Date().toLocaleString();
            
    } catch (error) {
        console.error('Health data fetch error:', error);
        showError(error);
    }
}

function showError(error) {
    document.getElementById('dashboard').innerHTML = `
        <div class="card">
            <h2>❌ Connection Error</h2>
            <p>Unable to fetch health data from backend</p>
            <p><strong>Error:</strong> ${error.message}</p>
            <p><strong>Backend URL:</strong> ${BACKEND_URL}</p>
        </div>
    `;
}

function updateDashboard(healthData, metricsText) {
    const metrics = parseMetrics(metricsText);
    
    document.getElementById('dashboard').innerHTML = `
        <div class="card">
            <h2>
                ❤️ Service Health 
                <span class="status-badge ${getStatusClass(healthData.status)}">
                    ${healthData.status}
                </span>
            </h2>
            <div class="metric-grid">
                <div class="metric">
                    <span class="metric-label">Service</span>
                    <span class="metric-value">${healthData.service}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Version</span>
                    <span class="metric-value">${healthData.version}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Database</span>
                    <span class="metric-value">${healthData.database}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Uptime</span>
                    <span class="metric-value">${healthData.uptime || 'N/A'}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Environment</span>
                    <span class="metric-value">${healthData.environment || 'development'}</span>
                </div>
            </div>
        </div>
        
        <div class="card">
            <h2>📈 Performance Metrics</h2>
            <div class="metric-grid">
                <div class="metric">
                    <span class="metric-label">HTTP Requests Total</span>
                    <span class="metric-value">${metrics.http_requests_total || '0'}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Memory Usage</span>
                    <span class="metric-value">${formatBytes(metrics.process_resident_memory_bytes) || 'N/A'}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">CPU Time</span>
                    <span class="metric-value">${metrics.process_cpu_seconds_total || '0'}s</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Node.js Version</span>
                    <span class="metric-value">${metrics.nodejs_version_info || '18.x'}</span>
                </div>
            </div>
        </div>
        
        <div class="card">
            <h2>🔗 API Endpoints</h2>
            <ul class="endpoints">
                <li class="endpoint">
                    <span class="endpoint-method">POST</span>
                    <strong>/calculate</strong> - Perform calculations
                </li>
                <li class="endpoint">
                    <span class="endpoint-method">GET</span>
                    <strong>/history</strong> - Get calculation history
                </li>
                <li class="endpoint">
                    <span class="endpoint-method">GET</span>
                    <strong>/metrics</strong> - Prometheus metrics
                </li>
                <li class="endpoint">
                    <span class="endpoint-method">GET</span>
                    <strong>/health</strong> - Service health check
                </li>
                <li class="endpoint">
                    <span class="endpoint-method">GET</span>
                    <strong>/health-ui</strong> - This dashboard
                </li>
            </ul>
        </div>
    `;
}

function getStatusClass(status) {
    switch(status?.toLowerCase()) {
        case 'ok': return 'status-healthy';
        case 'warning': return 'status-warning';
        case 'error': return 'status-error';
        default: return 'status-warning';
    }
}

function parseMetrics(metricsText) {
    const metrics = {};
    const lines = metricsText.split('\n');
    
    lines.forEach(line => {
        if (line && !line.startsWith('#') && line.includes(' ')) {
            const parts = line.split(' ');
            const name = parts[0];
            const value = parts[1];
            if (name && value && !isNaN(value)) {
                metrics[name] = parseFloat(value);
            } else if (name && value) {
                metrics[name] = value;
            }
        }
    });
    
    return metrics;
}

function formatBytes(bytes) {
    if (!bytes || isNaN(bytes)) return 'N/A';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Load data on page load
document.addEventListener('DOMContentLoaded', function() {
    loadHealthData();
    // Auto-refresh every 30 seconds
    setInterval(loadHealthData, 30000);
});