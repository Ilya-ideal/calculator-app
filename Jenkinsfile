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
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    // Логинимся в Docker Hub
                    withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                        sh "docker login -u $DOCKER_USERNAME -p $DOCKER_PASSWORD"
                    }
                    
                    // Собираем образ
                    sh "docker build -t ${DOCKER_IMAGE}:${env.BUILD_ID} -f docker/app/Dockerfile ."
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                script {
                    sh "docker push ${DOCKER_IMAGE}:${env.BUILD_ID}"
                }
            }
        }

        stage('Deploy to K8s') {
            steps {
                script {
                    // Обновляем образ в Deployment
                    sh """
                    kubectl --kubeconfig=\"${KUBE_CONFIG}\" set image deployment/calculator-app calculator-app=${DOCKER_IMAGE}:${env.BUILD_ID} --namespace=default --record=true
                    """
                }
            }
        }

        stage('Verify Deployment') {
            steps {
                script {
                    sh """
                    kubectl --kubeconfig=\"${KUBE_CONFIG}\" rollout status deployment/calculator-app --namespace=default --timeout=3m
                    """
                }
            }
        }
    }

    post {
        always {
            script {
                // Очистка - удаляем собранный образ чтобы не засорять диск
                sh "docker rmi ${DOCKER_IMAGE}:${env.BUILD_ID} || true"
            }
        }
        failure {
            script {
                // Уведомление в Telegram при ошибке
                sh """
                curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
                -d chat_id=${TELEGRAM_CHAT_ID} \
                -d text="❌ Деплой Calculator App (Build #${env.BUILD_ID}) завершился ОШИБКОЙ! Проверьте Jenkins: ${env.BUILD_URL}"
                """
            }
        }
        success {
            script {
                // Получаем IP Minikube для ссылки
                def MINIKUBE_IP = sh(
                    script: 'minikube ip',
                    returnStdout: true
                ).trim()
                
                sh """
                curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
                -d chat_id=${TELEGRAM_CHAT_ID} \
                -d text="✅ Деплой Calculator App (Build #${env.BUILD_ID}) успешно завершен! Приложение доступно по адресу: http://${MINIKUBE_IP}"
                """
            }
        }
    }
}