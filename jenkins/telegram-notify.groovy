def sendTelegramMessage(String message, String chatId, String botToken) {
    def telegramUrl = "https://api.telegram.org/bot${botToken}/sendMessage"
    
    def payload = [
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
    ]
    
    def jsonPayload = new groovy.json.JsonBuilder(payload).toString()
    
    sh """
        curl -s -X POST ${telegramUrl} \\
        -H "Content-Type: application/json" \\
        -d '${jsonPayload}'
    """
}

def sendBuildStartNotification() {
    def message = """
🚀 <b>Build Started</b>
📁 Project: ${env.JOB_NAME}
🔨 Build: #${env.BUILD_NUMBER}
📝 Commit: ${env.GIT_COMMIT ?: 'N/A'}
👤 Triggered by: ${env.CHANGE_AUTHOR ?: 'Manual'}
    """.stripIndent()
    
    sendTelegramMessage(message, env.TELEGRAM_CHAT_ID, env.TELEGRAM_BOT_TOKEN)
}

def sendBuildSuccessNotification() {
    def message = """
✅ <b>Build Successful</b>
📁 Project: ${env.JOB_NAME}
🔨 Build: #${env.BUILD_NUMBER}
⏱️ Duration: ${currentBuild.durationString}
📊 Tests: ✅ Passed
🐳 Images: Built and pushed
🚀 Deployed to: Kubernetes
    """.stripIndent()
    
    sendTelegramMessage(message, env.TELEGRAM_CHAT_ID, env.TELEGRAM_BOT_TOKEN)
}

def sendBuildFailureNotification() {
    def message = """
❌ <b>Build Failed</b>
📁 Project: ${env.JOB_NAME}
🔨 Build: #${env.BUILD_NUMBER}
⏱️ Duration: ${currentBuild.durationString}
🔍 Stage: ${env.STAGE_NAME ?: 'Unknown'}
💡 Check: ${env.BUILD_URL}
    """.stripIndent()
    
    sendTelegramMessage(message, env.TELEGRAM_CHAT_ID, env.TELEGRAM_BOT_TOKEN)
}

return this