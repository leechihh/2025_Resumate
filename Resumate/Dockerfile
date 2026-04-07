FROM python:3.11-slim

WORKDIR /app

# 安裝系統套件（psycopg2 需要 libpq）
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# migrate 後啟動 dev server（docker-compose 會 override 此指令）
CMD ["sh", "-c", "python manage.py migrate && python manage.py runserver 0.0.0.0:8000"]
