const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { evaluate } = require('mathjs');
const promClient = require('prom-client');
const winston = require('winston');
const { Client } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// ================== НАСТРОЙКА ЛОГГИРОВАНИЯ ==================
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

// ================== PROMETHEUS МЕТРИКИ ==================
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

register.registerMetric(httpRequestDuration);

// Счетчик для общего количества запросов
const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

register.registerMetric(httpRequestsTotal);

// ================== ПОДКЛЮЧЕНИЕ К POSTGRESQL ==================
const dbClient = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:pass@db:5432/calculator',
  ssl: false
});

// Функция подключения к БД
async function connectDatabase() {
  try {
    await dbClient.connect();
    logger.info('✅ Connected to PostgreSQL database');
    
    // Проверяем существование таблицы
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS calculations (
        id SERIAL PRIMARY KEY,
        expression TEXT NOT NULL,
        result TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logger.info('✅ Database table initialized');
    
  } catch (error) {
    logger.error('❌ Database connection failed:', error.message);
    // В development режиме продолжаем без базы
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
}

// ================== MIDDLEWARE ==================
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://frontend:80'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Middleware для логирования запросов
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`
    });
    
    // Инкрементируем счетчик запросов
    httpRequestsTotal.inc({
      method: req.method,
      route: req.route?.path || req.url,
      status_code: res.statusCode
    });
  });
  next();
});

// ================== КРАСИВЫЙ HEALTH UI ==================
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
        
        .loading {
            text-align: center;
            color: white;
            font-size: 1.2rem;
        }
        
        .nav-back {
            display: inline-block;
            margin-bottom: 20px;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            transition: all 0.3s ease;
        }
        
        .nav-back:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="container">
        <a href="http://localhost:3000" class="nav-back">⬅ Back to Calculator</a>
        
        <div class="header">
            <h1>🧮 Calculator API</h1>
            <p>Real-time Health Dashboard & Metrics</p>
        </div>
        
        <div class="dashboard" id="dashboard">
            <div class="card">
                <h2>📊 Loading Health Data...</h2>
                <div class="loading" id="loading">
                    <p>Connecting to backend API...</p>
                    <p id="status">Initializing</p>
                </div>
            </div>
        </div>
        
        <button class="refresh-btn" onclick="loadHealthData()">
            🔄 Refresh Data
        </button>
        
        <div class="timestamp" id="timestamp">
            Last updated: Never
        </div>
    </div>

    <script>
        async function loadHealthData() {
            document.getElementById('status').textContent = 'Fetching health data...';
            
            try {
                // Используем абсолютный URL к backend
                const backendUrl = window.location.origin;
                console.log('Fetching from:', backendUrl);
                
                const healthResponse = await fetch('\${backendUrl}/health');
                if (!healthResponse.ok) {
                    throw new Error(\`HTTP \${healthResponse.status}: \${healthResponse.statusText}\`);
                }
                const healthData = await healthResponse.json();
                
                document.getElementById('status').textContent = 'Fetching metrics...';
                const metricsResponse = await fetch('\${backendUrl}/metrics/simple');
                const metricsText = await metricsResponse.text();
                
                updateDashboard(healthData, metricsText);
                document.getElementById('timestamp').textContent = 
                    'Last updated: ' + new Date().toLocaleString();
                    
            } catch (error) {
                console.error('Health data fetch error:', error);
                document.getElementById('dashboard').innerHTML = \`
                    <div class="card">
                        <h2>❌ Connection Error</h2>
                        <p>Unable to fetch health data from backend</p>
                        <p><strong>Error:</strong> \${error.message}</p>
                        <p><strong>Backend URL:</strong> \${window.location.origin}</p>
                        <div style="margin-top: 15px; font-size: 14px;">
                            <p>Troubleshooting steps:</p>
                            <ul>
                                <li>Check if backend is running on port 3001</li>
                                <li>Verify network connectivity</li>
                                <li>Check browser console for detailed errors</li>
                                <li>Ensure CORS is properly configured</li>
                            </ul>
                        </div>
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
                        <div class="metric">
                            <span class="metric-label">Environment</span>
                            <span class="metric-value">\${healthData.environment || 'development'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <h2>📈 Performance Metrics</h2>
                    <div class="metric-grid">
                        <div class="metric">
                            <span class="metric-label">HTTP Requests Total</span>
                            <span class="metric-value">\${metrics.http_requests_total || '0'}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Memory Usage</span>
                            <span class="metric-value">\${formatBytes(metrics.process_resident_memory_bytes) || 'N/A'}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">CPU Time</span>
                            <span class="metric-value">\${metrics.process_cpu_seconds_total || '0'}s</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Node.js Version</span>
                            <span class="metric-value">\${metrics.nodejs_version_info || '18.x'}</span>
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
    </script>
</body>
</html>
    `;
    
    res.send(healthHTML);
});

// ================== ЭНДПОИНТЫ API ==================

// Health check эндпоинт
app.get('/health', async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'calculator-backend',
    version: '1.0.0',
    database: dbClient._connected ? 'connected' : 'disconnected',
    uptime: `${process.uptime().toFixed(2)}s`,
    environment: process.env.NODE_ENV || 'development'
  };
  
  if (!dbClient._connected) {
    health.status = 'WARNING';
    health.message = 'Database connection issues';
  }
  
  res.json(health);
});

// Упрощенный эндпоинт для метрик (для health UI)
app.get('/metrics/simple', async (req, res) => {
  try {
    res.set('Content-Type', 'text/plain');
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    res.status(500).end(error.message);
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Calculator API is running! 🚀',
    version: '1.0.0',
    endpoints: {
      calculate: 'POST /calculate',
      history: 'GET /history',
      health: 'GET /health',
      'health-ui': 'GET /health-ui',
      metrics: 'GET /metrics'
    }
  });
});

// Эндпоинт для вычислений
app.post('/calculate', async (req, res) => {
  const end = httpRequestDuration.startTimer();
  
  try {
    const { expression } = req.body;
    
    if (!expression || typeof expression !== 'string') {
      return res.status(400).json({ 
        error: 'Expression is required and must be a string' 
      });
    }

    logger.info('🔢 Calculation request received', { expression });
    
    // Вычисление выражения с безопасной обработкой
    let result;
    try {
      result = evaluate(expression);
    } catch (mathError) {
      logger.warn('❌ Mathematical error', { 
        expression, 
        error: mathError.message 
      });
      return res.status(400).json({ 
        error: 'Invalid mathematical expression',
        details: mathError.message
      });
    }
    
    // Сохранение в базу данных (если подключена)
    if (dbClient._connected) {
      try {
        await dbClient.query(
          'INSERT INTO calculations (expression, result) VALUES ($1, $2)',
          [expression, result.toString()]
        );
        logger.info('💾 Calculation saved to database', { expression, result });
      } catch (dbError) {
        logger.error('📦 Database save error (continuing without save):', dbError);
      }
    }
    
    logger.info('✅ Calculation completed successfully', { 
      expression, 
      result 
    });
    
    res.json({ 
      result: result.toString(),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('💥 Unexpected calculation error', { 
      error: error.message
    });
    
    res.status(500).json({ 
      error: 'Internal server error during calculation'
    });
  } finally {
    end({ 
      method: req.method, 
      route: '/calculate', 
      status_code: res.statusCode 
    });
  }
});

// Эндпоинт для получения истории вычислений
app.get('/history', async (req, res) => {
  try {
    if (!dbClient._connected) {
      // Возвращаем демо-данные если база не доступна
      return res.json({ 
        history: [
          { expression: "2+2", result: "4", created_at: new Date().toISOString() },
          { expression: "3*4", result: "12", created_at: new Date().toISOString() },
          { expression: "10/2", result: "5", created_at: new Date().toISOString() }
        ] 
      });
    }
    
    const result = await dbClient.query(
      'SELECT expression, result, created_at FROM calculations ORDER BY created_at DESC LIMIT 10'
    );
    
    logger.info('📋 History requested', { count: result.rows.length });
    res.json({ history: result.rows });
    
  } catch (error) {
    logger.error('📦 History fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Эндпоинт для метрик Prometheus
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    logger.error('📊 Metrics error:', error);
    res.status(500).end(error.message);
  }
});

// Обработка 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Глобальная обработка ошибок
app.use((error, req, res, next) => {
  logger.error('🔥 Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: error.message })
  });
});

// ================== ЗАПУСК СЕРВЕРА ==================

async function startServer() {
  try {
    // Подключаемся к базе данных
    await connectDatabase();
    
    // Запускаем сервер
    app.listen(PORT, () => {
      logger.info(`🚀 Calculator backend server running on port ${PORT}`);
      logger.info(`📊 Health dashboard: http://localhost:${PORT}/health-ui`);
      logger.info(`❤️ Health check: http://localhost:${PORT}/health`);
      logger.info(`🌐 CORS enabled for: localhost:3000, frontend:80`);
    });
    
  } catch (error) {
    logger.error('💥 Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('🛑 Received SIGTERM, shutting down gracefully');
  await dbClient.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('🛑 Received SIGINT, shutting down gracefully');
  await dbClient.end();
  process.exit(0);
});

// Запускаем сервер
startServer();

module.exports = app;