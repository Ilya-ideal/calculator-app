FROM nginx:alpine

# Копируем статические файлы приложения
COPY ../../index.html /usr/share/nginx/html/
COPY ../../style.css /usr/share/nginx/html/
COPY ../../script.js /usr/share/nginx/html/

# Открываем порт 80
EXPOSE 5000

# Запускаем nginx
CMD ["nginx", "-g", "daemon off;"]
