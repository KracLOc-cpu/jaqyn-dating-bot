# Build context = корень проекта (см. docker-compose).
FROM python:3.12-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY shared/ ./shared/
COPY db/ ./db/
COPY bot/ ./bot/

CMD ["python", "-m", "bot.main"]
