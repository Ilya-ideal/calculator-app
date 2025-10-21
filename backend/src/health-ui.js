const path = require('path');
const fs = require('fs');

function setupHealthUI(app) {
  // Красивый HTML для health check
  app.get('/health-ui', (req, res) => {
    const healthHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Calculator API - Health Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            color: white;
        }
        
        .header h1 {
            font-size: 3rem;
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        
        .dashboard {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .card {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .card h2 {
            color: #333;
            margin-bottom: 15px;
            font-size: 1.5rem;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .status-badge {
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
        }
        
        .status-healthy {
            background: #d3f9d8;
            color: #2b8a3e;
        }
        
        .status-warning {
            background: #fff3bf;
            color: #e67700;
        }
        
        .status-error {
            background: #ffe3e3;
            color: #c92a2a;
        }
        
        .metric-grid {
            display: grid;
            gap: 15px;
        }
        
        .metric {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #e9ecef;
        }
        
        .metric:last-child {
            border-bottom: none;
        }
        
        .metric-label {
            color: #666;
            font-weight: 500;
        }
        
        .metric-value {
            color: #333;
            font-weight: 600;
        }
        
        .endpoints {
            list-style: none;
        }
        
        .endpoint {
            padding: 12px;
            margin: 8px 0;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        
        .endpoint-method {
            display: inline-block;
            padding: 4px 8px;
            background: #667eea;
            color: white;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: 600;
            margin-right: 10px;
        }
        
        .refresh-btn {
            background: #51cf66;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            display: block;
            margin: 20px auto;
        }
        
        .refresh-btn:hover {
            background: #40c057;
            transform: translateY(-2px);
        }
        
        .timestamp {
            text-align: center;
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.9rem;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧮 Calculator API</h1>
            <p>Real-time Health Dashboard & Metrics</p>
        </div>
        
        <div class="dashboard" id="dashboard">
            <!-- Dashboard content will be loaded by JavaScript -->
            <div class="card">
                <h2>📊 Loading...</h2>
                <p>Fetching health data...</p>
            </div>
        </div>
        
        <button class="refresh-btn" onclick="loadHealthData()">
            🔄 Refresh Data
        </button>
        
        <div class="timestamp" id="timestamp">
            Last updated: Loading...
        </div>
    </div>

    <script>
        async function loadHealthData() {
            try {
                const [healthRes, metricsRes] = await Promise.all([
                    fetch('/health'),
                    fetch('/metrics?simple=1')
                ]);
                
                const healthData = await healthRes.json();
                const metricsText = await metricsRes.text();
                
                updateDashboard(healthData, metricsText);
                document.getElementById('timestamp').textContent = 
                    'Last updated: ' + new Date().toLocaleString();
                    
            } catch (error) {
                document.getElementById('dashboard').innerHTML = \`
                    <div class="card">
                        <h2>❌ Connection Error</h2>
                        <p>Unable to fetch health data: \${error.message}</p>
                    </div>
                \`;
            }
        }
        
        function updateDashboard(healthData, metricsText) {
            const metrics = parseMetrics(metricsText);
            
            document.getElementById('dashboard').innerHTML = \`
                <div class="card">
                    <h2>
                        ❤️ Service Health 
                        <span class="status-badge \${getStatusClass(healthData.status)}">
                            \${healthData.status}
                        </span>
                    </h2>
                    <div class="metric-grid">
                        <div class="metric">
                            <span class="metric-label">Service</span>
                            <span class="metric-value">\${healthData.service}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Version</span>
                            <span class="metric-value">\${healthData.version}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Database</span>
                            <span class="metric-value">\${healthData.database}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Uptime</span>
                            <span class="metric-value">\${healthData.uptime || 'N/A'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <h2>📈 Performance Metrics</h2>
                    <div class="metric-grid">
                        <div class="metric">
                            <span class="metric-label">Requests Total</span>
                            <span class="metric-value">\${metrics.http_requests_total || '0'}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Request Duration (95%)</span>
                            <span class="metric-value">\${metrics.http_request_duration_seconds || '0ms'}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Memory Usage</span>
                            <span class="metric-value">\${metrics.process_resident_memory_bytes || '0'}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">CPU Usage</span>
                            <span class="metric-value">\${metrics.process_cpu_seconds_total || '0'}</span>
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
                    </ul>
                </div>
                
                <div class="card">
                    <h2>🔧 System Info</h2>
                    <div class="metric-grid">
                        <div class="metric">
                            <span class="metric-label">Node.js Version</span>
                            <span class="metric-value">\${process.version}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Platform</span>
                            <span class="metric-value">\${process.platform}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Architecture</span>
                            <span class="metric-value">\${process.arch}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">PID</span>
                            <span class="metric-value">\${process.pid}</span>
                        </div>
                    </div>
                </div>
            \`;
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
            const lines = metricsText.split('\\n');
            
            lines.forEach(line => {
                if (line && !line.startsWith('#') && line.includes(' ')) {
                    const [name, value] = line.split(' ');
                    if (name && value) {
                        metrics[name] = value;
                    }
                }
            });
            
            return metrics;
        }
        
        // Load data on page load and every 30 seconds
        loadHealthData();
        setInterval(loadHealthData, 30000);
    </script>
</body>
</html>
    `;
    
    res.send(healthHTML);
  });
}

module.exports = { setupHealthUI };