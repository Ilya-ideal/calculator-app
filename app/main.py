from flask import Flask, render_template, request, jsonify
import logging
import os
from datetime import datetime

# Настройка логирования только в stdout (без файла)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

@app.route('/')
def index():
    logger.info("Home page accessed")
    return render_template('index.html')

@app.route('/calculate', methods=['POST'])
def calculate():
    try:
        data = request.get_json()
        num1 = float(data['num1'])
        num2 = float(data['num2'])
        operation = data['operation']

        logger.info(f"Calculation: {num1} {operation} {num2}")

        # Расширенные математические операции
        if operation == 'add':
            result = num1 + num2
            symbol = '+'
        elif operation == 'subtract':
            result = num1 - num2
            symbol = '-'
        elif operation == 'multiply':
            result = num1 * num2
            symbol = '×'
        elif operation == 'divide':
            if num2 == 0:
                logger.warning("Division by zero attempted")
                return jsonify({'error': 'Division by zero!'}), 400
            result = num1 / num2
            symbol = '÷'
        elif operation == 'power':
            result = num1 ** num2
            symbol = '^'
        elif operation == 'sqrt':
            if num1 < 0:
                return jsonify({'error': 'Cannot calculate square root of negative number'}), 400
            result = num1 ** 0.5
            symbol = '√'
            return jsonify({'result': result, 'expression': f'√{num1}'})
        elif operation == 'percentage':
            result = (num1 * num2) / 100
            symbol = '%'
        else:
            logger.warning(f"Invalid operation: {operation}")
            return jsonify({'error': 'Invalid operation'}), 400

        expression = f"{num1} {symbol} {num2}" if operation != 'sqrt' else f"√{num1}"
        logger.info(f"Calculation result: {result}")

        return jsonify({
            'result': result,
            'expression': expression,
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Calculation error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/health')
def health():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '2.0.0'
    })

@app.route('/history')
def get_history():
    '''Возвращает пустую историю (файловые логи отключены)'''
    return jsonify({'history': ['File logging disabled - using stdout']})

@app.route('/metrics')
def metrics():
    '''Метрики для мониторинга'''
    return jsonify({
        'status': 'up',
        'timestamp': datetime.now().isoformat(),
        'service': 'calculator',
        'version': '2.0.0'
    })

if __name__ == '__main__':
    logger.info("🚀 Starting Advanced Calculator Application v2.0.0")
    app.run(host='0.0.0.0', port=5000, debug=False)
