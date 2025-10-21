# 🧮 Advanced Calculator Application

A modern, containerized calculator application with monitoring, built with React, Node.js, PostgreSQL, and Docker.

## 🚀 Features

- **Modern Calculator** with advanced mathematical functions
- **Real-time Health Monitoring** with beautiful dashboard
- **Docker Containerization** with multi-container architecture
- **Prometheus Metrics** for performance monitoring
- **PostgreSQL Database** for calculation history
- **CI/CD Pipeline** with Jenkins
- **Kubernetes Ready** with Helm charts

## 🏗️ Architecture
Frontend (React) → Backend (Node.js/Express) → PostgreSQL
↓
Monitoring (Prometheus + Custom Dashboard)

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, CSS3
- **Backend**: Node.js, Express, Math.js
- **Database**: PostgreSQL
- **Containerization**: Docker, Docker Compose
- **Monitoring**: Prometheus, Custom Health Dashboard
- **CI/CD**: Jenkins, GitHub Actions

## 📦 Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/calculator-app.git
cd calculator-app

# Start with Docker Compose
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001/health
# Health Dashboard: http://localhost:3001/health-ui
🐳 Docker Commands
bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Clean up
docker system prune -f
🔧 Development
bash
# Backend development
cd backend
npm install
npm run dev

# Frontend development  
cd frontend
npm install
npm run dev
📊 Monitoring Endpoints
Health Check: GET /health

Metrics: GET /metrics

Health Dashboard: GET /health-ui

API Documentation: GET /

🤝 Contributing
Fork the repository

Create your feature branch (git checkout -b feature/amazing-feature)

Commit your changes (git commit -m 'Add some amazing feature')

Push to the branch (git push origin feature/amazing-feature)

Open a Pull Request