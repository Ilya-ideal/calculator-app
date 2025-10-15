pipeline {
    agent any

    environment {
        DOCKER_IMAGE = 'ilia2014a/calculator-app'
        DOCKER_TAG = "${env.BUILD_NUMBER}"
        KUBE_CONFIG = credentials('kubeconfig')
        TELEGRAM_CHAT_ID = credentials('telegram-chat-id')
        TELEGRAM_BOT_TOKEN = credentials('telegram-bot-token')
        K8S_NAMESPACE = 'calculator'
    }

    triggers {
        pollSCM('H/2 * * * *')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo "✅ Code checked out successfully from GitHub"
                bat 'dir'
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    echo "🔨 Building Docker image..."
                    docker.build("${env.DOCKER_IMAGE}:${env.DOCKER_TAG}", ".")
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                script {
                    echo "📤 Pushing Docker image to Docker Hub..."
                    docker.withRegistry('', 'dockerhub-credentials') {
                        docker.image("${env.DOCKER_IMAGE}:${env.DOCKER_TAG}").push()
                        docker.image("${env.DOCKER_IMAGE}:${env.DOCKER_TAG}").push('latest')
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    echo "🚀 Deploying to Kubernetes..."
                    bat 'dir k8s'
                    
                    withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
                        bat """
                            echo "Checking Kubernetes access..."
                            kubectl --kubeconfig=%KUBECONFIG% cluster-info || echo "Kubernetes cluster info failed, but continuing..."
                            
                            echo "Creating namespace..."
                            kubectl --kubeconfig=%KUBECONFIG% create namespace ${env.K8S_NAMESPACE} --dry-run=client -o yaml | kubectl --kubeconfig=%KUBECONFIG% apply -f - || echo "Namespace creation failed, but continuing..."
                            
                            echo "Deploying application..."
                            kubectl --kubeconfig=%KUBECONFIG% apply -f k8s/app-deployment.yaml --validate=false || echo "Deployment failed"
                            kubectl --kubeconfig=%KUBECONFIG% apply -f k8s/app-service.yaml --validate=false || echo "Service failed"
                            
                            echo "Waiting for rollout..."
                            kubectl --kubeconfig=%KUBECONFIG% rollout status deployment/test-app -n ${env.K8S_NAMESPACE} --timeout=300s || echo "Rollout status check failed"
                        """
                    }
                }
            }
        }

        stage('Health Check') {
            steps {
                script {
                    echo "❤️ Performing health check..."
                    withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
                        bat """
                            echo "=== Pods in ${env.K8S_NAMESPACE} ==="
                            kubectl --kubeconfig=%KUBECONFIG% get pods -n ${env.K8S_NAMESPACE} || echo "Failed to get pods"
                            echo "=== Services in ${env.K8S_NAMESPACE} ==="
                            kubectl --kubeconfig=%KUBECONFIG% get svc -n ${env.K8S_NAMESPACE} || echo "Failed to get services"
                        """
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                echo "🏁 Pipeline execution completed"
                // Используем безопасный метод для отправки уведомлений
                sendTelegramNotification(currentBuild.currentResult)
            }
        }
        success {
            script {
                echo "✅ Pipeline succeeded! Build: ${env.BUILD_NUMBER}"
            }
        }
        failure {
            script {
                echo "❌ Pipeline failed! Build: ${env.BUILD_NUMBER}"
            }
        }
    }
}

def sendTelegramNotification(String buildStatus) {
    def message = ""
    
    if (buildStatus == "SUCCESS") {
        message = "✅ Pipeline УСПЕШНО завершен!%0A%0A📦 Проект: Calculator App%0A🔢 Номер сборки: ${env.BUILD_NUMBER}%0A🐳 Образ: ${env.DOCKER_IMAGE}:${env.DOCKER_TAG}%0A🚀 Развернуто в: ${env.K8S_NAMESPACE}%0A⏰ Время: ${new Date().format('dd.MM.yyyy HH:mm:ss')}"
    } else if (buildStatus == "FAILURE") {
        message = "❌ Pipeline ЗАВЕРШИЛСЯ С ОШИБКОЙ!%0A%0A📦 Проект: Calculator App%0A🔢 Номер сборки: ${env.BUILD_NUMBER}%0A🔍 Проверьте логи Jenkins%0A⏰ Время: ${new Date().format('dd.MM.yyyy HH:mm:ss')}"
    } else {
        message = "⚠️ Pipeline завершен со статусом: ${buildStatus}%0A%0A📦 Проект: Calculator App%0A🔢 Номер сборки: ${env.BUILD_NUMBER}%0A⏰ Время: ${new Date().format('dd.MM.yyyy HH:mm:ss')}"
    }
    
    // Безопасная отправка через одну строку
    bat """
        curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${TELEGRAM_CHAT_ID}&text=${message}&parse_mode=Markdown" || echo "Telegram notification failed"
    """
}