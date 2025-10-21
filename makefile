.PHONY: jenkins-up jenkins-down jenkins-logs pipeline-test

# Jenkins commands
jenkins-up:
	docker-compose -f jenkins/docker-compose.jenkins.yml up -d
	@echo "Jenkins is starting... Access at http://localhost:8080"
	@echo "Username: admin"
	@echo "Password: admin123"

jenkins-down:
	docker-compose -f jenkins/docker-compose.jenkins.yml down

jenkins-logs:
	docker-compose -f jenkins/docker-compose.jenkins.yml logs -f

jenkins-restart: jenkins-down jenkins-up

# Pipeline testing
pipeline-test:
	@echo "Testing pipeline locally..."
	docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
		-v $(PWD):/workspace \
		-w /workspace \
		node:18-alpine \
		sh -c "npm run build"

# Deployment
deploy-staging:
	docker-compose down
	docker-compose up -d --build

deploy-production:
	@echo "Production deployment would go here"

# Utility
clean:
	docker system prune -f
	docker volume prune -f

status:
	docker-compose ps
	@echo ""
	@echo "Frontend: http://localhost:3000"
	@echo "Backend API: http://localhost:3001/health"
	@echo "Health Dashboard: http://localhost:3001/health-ui"

help:
	@echo "Available commands:"
	@echo "  jenkins-up       - Start Jenkins CI/CD server"
	@echo "  jenkins-down     - Stop Jenkins"
	@echo "  jenkins-logs     - View Jenkins logs"
	@echo "  pipeline-test    - Test pipeline locally"
	@echo "  deploy-staging   - Deploy to staging"
	@echo "  clean            - Clean Docker system"
	@echo "  status           - Show application status"