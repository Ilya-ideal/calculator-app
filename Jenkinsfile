pipeline {
    agent any

    environment {
        DOCKER_IMAGE = 'ilia2014a/calculator-app'
        KUBE_CONFIG = credentials('kubeconfig')
        TELEGRAM_CHAT_ID = credentials('telegram-chat-id')
        TELEGRAM_BOT_TOKEN = credentials('telegram-bot-token')
    }

    triggers {
        pollSCM('H/2 * * * *')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo "✅ Code checked out successfully from GitHub"
                sh 'ls -la'  // Покажем структуру файлов
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    echo "🔨 Building Docker image..."
                    // Строим из папки docker/app
                    dir('docker/app') {
                        docker.build("${env.DOCKER_IMAGE}:${env.DOCKER_TAG}", ".")
                    }
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                script {
                    echo "📤 Pushing Docker image to Docker Hub..."
                    docker.withRegistry('', 'dockerhub-credentials') {
                        docker.image("${env.DOCKER_IMAGE}:${env.DOCKER_TAG}").push()
                        // Также пушим как latest
                        docker.image("${env.DOCKER_IMAGE}:${env.DOCKER_TAG}").push('latest')
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    echo "🚀 Deploying to Kubernetes..."
                    withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
                        sh """
                            echo "Creating namespace..."
                            kubectl --kubeconfig=\$KUBECONFIG apply -f k8s/namespace.yaml
                            
                            echo "Deploying application..."
                            kubectl --kubeconfig=\$KUBECONFIG apply -f k8s/deployment.yaml
                            kubectl --kubeconfig=\$KUBECONFIG apply -f k8s/service.yaml
                            
                            echo "Waiting for rollout..."
                            kubectl --kubeconfig=\$KUBECONFIG rollout status deployment/test-app -n ${env.K8S_NAMESPACE} --timeout=300s
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
                        sh """
                            echo "=== Pods in ${env.K8S_NAMESPACE} ==="
                            kubectl --kubeconfig=\$KUBECONFIG get pods -n ${env.K8S_NAMESPACE}
                            echo "=== Services in ${env.K8S_NAMESPACE} ==="
                            kubectl --kubeconfig=\$KUBECONFIG get svc -n ${env.K8S_NAMESPACE}
                        """
                    }
                }
            }
        }
    }

    post {
        always {
            echo "🏁 Pipeline execution completed"
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