app.get('/health-simple', (req, res) => {
  const healthHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Calculator Health</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 600px;
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
        }
        .status {
            padding: 10px 20px;
            border-radius: 20px;
            font-weight: bold;
            margin: 20px 0;
        }
        .healthy {
            background: #d4edda;
            color: #155724;
        }
        .endpoints {
            text-align: left;
            margin: 20px 0;
        }
        .endpoint {
            background: #f8f9fa;
            padding: 10px;
            margin: 5px 0;
            border-radius: 5px;
            border-left: 4px solid #667eea;
        }
        .nav-links {
            margin-top: 20px;
        }
        .nav-btn {
            display: inline-block;
            padding: 10px 20px;
            margin: 5px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            transition: background 0.3s;
        }
        .nav-btn:hover {
            background: #5a6fd8;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧮 Calculator API Health</h1>
        <p>Backend service status</p>
        
        <div class="status healthy">✅ SERVICE IS HEALTHY</div>
        
        <div class="endpoints">
            <div class="endpoint"><strong>GET</strong> /health - JSON health check</div>
            <div class="endpoint"><strong>POST</strong> /calculate - Perform calculations</div>
            <div class="endpoint"><strong>GET</strong> /history - Calculation history</div>
            <div class="endpoint"><strong>GET</strong> /metrics - Prometheus metrics</div>
        </div>

        <div class="nav-links">
            <a href="http://localhost:3000" class="nav-btn">🧮 Open Calculator</a>
            <a href="/health" class="nav-btn">📊 JSON Health</a>
            <a href="/metrics" class="nav-btn">📈 Metrics</a>
        </div>

        <div style="margin-top: 20px; color: #666; font-size: 12px;">
            Server time: ${new Date().toLocaleString()}
        </div>
    </div>
</body>
</html>
    `;
    res.send(healthHTML);
});