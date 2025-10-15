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
                            kubectl --kubeconfig=%KUBECONFIG% cluster-info
                            
                            echo "Creating namespace..."
                            kubectl --kubeconfig=%KUBECONFIG% create namespace ${env.K8S_NAMESPACE} --dry-run=client -o yaml | kubectl --kubeconfig=%KUBECONFIG% apply -f -
                            
                            echo "Deploying application..."
                            kubectl --kubeconfig=%KUBECONFIG% apply -f k8s/app-deployment.yaml
                            kubectl --kubeconfig=%KUBECONFIG% apply -f k8s/app-service.yaml
                            
                            echo "Waiting for rollout..."
                            kubectl --kubeconfig=%KUBECONFIG% rollout status deployment/test-app -n ${env.K8S_NAMESPACE} --timeout=300s
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
                            kubectl --kubeconfig=%KUBECONFIG% get pods -n ${env.K8S_NAMESPACE}
                            echo "=== Services in ${env.K8S_NAMESPACE} ==="
                            kubectl --kubeconfig=%KUBECONFIG% get svc -n ${env.K8S_NAMESPACE}
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
                sendTelegramNotification(currentBuild.result)
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
        message = "✅ Pipeline УСПЕШНО завершен!\n\n" +
                 "📦 Проект: Calculator App\n" +
                 "🔢 Номер сборки: ${env.BUILD_NUMBER}\n" +
                 "🐳 Образ: ${env.DOCKER_IMAGE}:${env.DOCKER_TAG}\n" +
                 "🚀 Развернуто в: ${env.K8S_NAMESPACE}\n" +
                 "⏰ Время: ${new Date().format('dd.MM.yyyy HH:mm:ss')}"
    } else if (buildStatus == "FAILURE") {
        message = "❌ Pipeline ЗАВЕРШИЛСЯ С ОШИБКОЙ!\n\n" +
                 "📦 Проект: Calculator App\n" +
                 "🔢 Номер сборки: ${env.BUILD_NUMBER}\n" +
                 "🔍 Проверьте логи Jenkins\n" +
                 "⏰ Время: ${new Date().format('dd.MM.yyyy HH:mm:ss')}"
    } else {
        message = "⚠️ Pipeline завершен со статусом: ${buildStatus}\n\n" +
                 "📦 Проект: Calculator App\n" +
                 "🔢 Номер сборки: ${env.BUILD_NUMBER}\n" +
                 "⏰ Время: ${new Date().format('dd.MM.yyyy HH:mm:ss')}"
    }
    
    // Кодируем сообщение для URL
    def encodedMessage = URLEncoder.encode(message, "UTF-8")
    
    // Отправляем запрос к Telegram API
    def telegramUrl = "https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${env.TELEGRAM_CHAT_ID}&text=${encodedMessage}"
    
    try {
        httpRequest url: telegramUrl, validResponseCodes: '200'
        echo "📱 Уведомление отправлено в Telegram"
    } catch (Exception e) {
        echo "⚠️ Не удалось отправить уведомление в Telegram: ${e.getMessage()}"
    }
}