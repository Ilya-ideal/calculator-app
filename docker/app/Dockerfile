FROM python:3.9-slim

WORKDIR /app

# Создаем папку для логов при сборке образа
RUN mkdir -p /app/logs

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ .

EXPOSE 5000

CMD ["python", "main.py"]
