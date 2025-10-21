import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const api = axios.create({
  timeout: 10000,
});

const API_URL = 'http://localhost:3001';

function App() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [backendStatus, setBackendStatus] = useState('checking');
  const [activeTab, setActiveTab] = useState('calculator');

  useEffect(() => {
    checkBackendHealth();
    loadHistory();
  }, []);

  const checkBackendHealth = async () => {
    try {
      const response = await api.get(`${API_URL}/health`);
      setBackendStatus('connected');
    } catch (error) {
      setBackendStatus('disconnected');
    }
  };

  const loadHistory = async () => {
    try {
      const response = await api.get(`${API_URL}/history`);
      setHistory(response.data.history || []);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const calculate = async () => {
    if (!input.trim()) {
      setError('Please enter an expression');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await api.post(`${API_URL}/calculate`, {
        expression: input.trim()
      });
      
      const calculationResult = response.data.result;
      setResult(calculationResult);
      await loadHistory();
      
    } catch (error) {
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError('Cannot connect to backend server');
      }
      setResult('');
    } finally {
      setLoading(false);
    }
  };

  const clearInput = () => {
    setInput('');
    setResult('');
    setError('');
  };

  const addToInput = (value) => {
    setInput(prev => prev + value);
    setError('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      calculate();
    }
  };

  const testConnection = async () => {
    await checkBackendHealth();
  };

  const navigationLinks = [
    { 
      name: '🧮 Calculator', 
      tab: 'calculator',
      description: 'Perform calculations'
    },
    { 
      name: '📊 Health Dashboard', 
      url: 'http://localhost:3001/health-ui',
      external: true,
      description: 'System monitoring'
    },
    { 
      name: '⚙️ API Health', 
      url: 'http://localhost:3001/health',
      external: true,
      description: 'Backend status'
    },
    { 
      name: '📈 Metrics', 
      url: 'http://localhost:3001/metrics', 
      external: true,
      description: 'Performance metrics'
    },
    { 
      name: '📚 History', 
      tab: 'history',
      description: 'Calculation history'
    },
    { 
      name: 'ℹ️ About', 
      tab: 'about',
      description: 'Project information'
    }
  ];

  const handleNavigation = (link) => {
    if (link.tab) {
      setActiveTab(link.tab);
    } else if (link.url) {
      window.open(link.url, link.external ? '_blank' : '_self');
    }
  };

  return (
    <div className="app">
      <div className="calculator">
        {/* Заголовок и навигация */}
        <div className="header-section">
          <h1>🧮 Advanced Calculator</h1>
          <p className="subtitle">Powered by React + Node.js + PostgreSQL + Docker</p>
          
          <div className="connection-status">
            <button 
              onClick={testConnection} 
              className={`status-btn ${backendStatus}`}
              title="Test backend connection"
            >
              <span className="status-dot"></span>
              Backend: {backendStatus}
            </button>
          </div>

          {/* Панель навигации */}
          <div className="navigation-panel">
            {navigationLinks.map((link, index) => (
              <button
                key={index}
                className={`nav-btn ${link.tab === activeTab ? 'active' : ''}`}
                onClick={() => handleNavigation(link)}
                title={link.description}
              >
                {link.name}
                {link.external && <span className="external-icon">↗</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Калькулятор */}
        {activeTab === 'calculator' && (
          <div className="tab-content">
            <div className="display">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter expression (e.g., 2+2*3, sin(45), sqrt(16))"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="error">
                ⚠️ {error}
              </div>
            )}

            <div className="buttons">
              <div className="row">
                <button onClick={clearInput} className="clear" disabled={loading}>C</button>
                <button onClick={() => addToInput('(')} disabled={loading}>(</button>
                <button onClick={() => addToInput(')')} disabled={loading}>)</button>
                <button onClick={() => addToInput('/')} disabled={loading}>/</button>
              </div>
              
              <div className="row">
                <button onClick={() => addToInput('7')} disabled={loading}>7</button>
                <button onClick={() => addToInput('8')} disabled={loading}>8</button>
                <button onClick={() => addToInput('9')} disabled={loading}>9</button>
                <button onClick={() => addToInput('*')} disabled={loading}>×</button>
              </div>
              
              <div className="row">
                <button onClick={() => addToInput('4')} disabled={loading}>4</button>
                <button onClick={() => addToInput('5')} disabled={loading}>5</button>
                <button onClick={() => addToInput('6')} disabled={loading}>6</button>
                <button onClick={() => addToInput('-')} disabled={loading}>-</button>
              </div>
              
              <div className="row">
                <button onClick={() => addToInput('1')} disabled={loading}>1</button>
                <button onClick={() => addToInput('2')} disabled={loading}>2</button>
                <button onClick={() => addToInput('3')} disabled={loading}>3</button>
                <button onClick={() => addToInput('+')} disabled={loading}>+</button>
              </div>
              
              <div className="row">
                <button onClick={() => addToInput('0')} disabled={loading}>0</button>
                <button onClick={() => addToInput('.')} disabled={loading}>.</button>
                <button onClick={() => addToInput('sqrt(')} disabled={loading}>√</button>
                <button onClick={calculate} className="equals" disabled={loading}>
                  {loading ? '⏳' : '='}
                </button>
              </div>

              <div className="row">
                <button onClick={() => addToInput('pi')} disabled={loading}>π</button>
                <button onClick={() => addToInput('sin(')} disabled={loading}>sin</button>
                <button onClick={() => addToInput('cos(')} disabled={loading}>cos</button>
                <button onClick={() => addToInput('tan(')} disabled={loading}>tan</button>
              </div>
            </div>

            {result && !error && (
              <div className="result">
                <strong>Result: {result}</strong>
              </div>
            )}
          </div>
        )}

        {/* История вычислений */}
        {activeTab === 'history' && (
          <div className="tab-content">
            <div className="history-section">
              <h2>📚 Calculation History</h2>
              {history.length > 0 ? (
                <div className="history-list">
                  {history.map((item, index) => (
                    <div key={index} className="history-item">
                      <span className="expression">{item.expression} = </span>
                      <strong className="result-value">{item.result}</strong>
                      {item.created_at && (
                        <span className="timestamp">
                          {new Date(item.created_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No calculations yet</p>
                  <p className="hint">Perform some calculations to see history here</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* О проекте */}
        {activeTab === 'about' && (
          <div className="tab-content">
            <div className="about-section">
              <h2>ℹ️ About This Project</h2>
              <div className="about-grid">
                <div className="about-card">
                  <h3>🚀 Technologies</h3>
                  <ul>
                    <li>Frontend: React + Vite</li>
                    <li>Backend: Node.js + Express</li>
                    <li>Database: PostgreSQL</li>
                    <li>Containerization: Docker + Docker Compose</li>
                    <li>Monitoring: Prometheus Metrics</li>
                  </ul>
                </div>
                
                <div className="about-card">
                  <h3>📊 Features</h3>
                  <ul>
                    <li>Advanced mathematical calculations</li>
                    <li>Real-time health monitoring</li>
                    <li>Calculation history</li>
                    <li>Beautiful responsive UI</li>
                    <li>Docker containerization</li>
                  </ul>
                </div>
                
                <div className="about-card">
                  <h3>🔗 Quick Links</h3>
                  <div className="links">
                    <button 
                      className="link-btn"
                      onClick={() => window.open('http://localhost:3001/health-ui', '_blank')}
                    >
                      Health Dashboard ↗
                    </button>
                    <button 
                      className="link-btn"
                      onClick={() => window.open('http://localhost:3001/health', '_blank')}
                    >
                      API Health ↗
                    </button>
                    <button 
                      className="link-btn"
                      onClick={() => window.open('http://localhost:3001/metrics', '_blank')}
                    >
                      Metrics ↗
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;