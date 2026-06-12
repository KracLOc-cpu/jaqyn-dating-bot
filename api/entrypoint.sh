#!/bin/sh
set -e

# Дожидаемся БД и применяем миграции перед стартом API.
echo "Running migrations..."
alembic upgrade head

echo "Starting API..."
exec uvicorn api.main:app --host 0.0.0.0 --port 8000
