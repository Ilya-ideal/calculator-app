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
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    echo "🔨 Building Docker image..."
                    docker.build("${env.DOCKER_IMAGE}:${env.DOCKER_TAG}")
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                script {
                    echo "📤 Pushing Docker image to Docker Hub..."
                    docker.withRegistry('', 'dockerhub-credentials') {
                        docker.image("${env.DOCKER_IMAGE}:${env.DOCKER_TAG}").push()
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
                            echo "Applying Kubernetes manifests..."
                            kubectl --kubeconfig=\$KUBECONFIG apply -f k8s/namespace.yaml
                            kubectl --kubeconfig=\$KUBECONFIG apply -f k8s/ -n ${env.K8S_NAMESPACE}
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
                echo "✅ Pipeline succeeded!"
                // Телеграм уведомления временно отключим для отладки
                // withCredentials([string(credentialsId: 'telegram-bot-token', variable: 'TELEGRAM_TOKEN'), string(credentialsId: 'telegram-chat-id', variable: 'CHAT_ID')]) {
                //     sh """
                //         curl -s -X POST "https://api.telegram.org/bot\${TELEGRAM_TOKEN}/sendMessage" \
                //             -d chat_id=\${CHAT_ID} \
                //             -d text="✅ Calculator App deployed successfully! Build: ${env.BUILD_NUMBER}"
                //     """
                // }
            }
        }
        failure {
            script {
                echo "❌ Pipeline failed!"
                // withCredentials([string(credentialsId: 'telegram-bot-token', variable: 'TELEGRAM_TOKEN'), string(credentialsId: 'telegram-chat-id', variable: 'CHAT_ID')]) {
                //     sh """
                //         curl -s -X POST "https://api.telegram.org/bot\${TELEGRAM_TOKEN}/sendMessage" \
                //             -d chat_id=\${CHAT_ID} \
                //             -d text="❌ Calculator App deployment failed! Build: ${env.BUILD_NUMBER}"
                //     """
                // }
            }
        }
    }
}