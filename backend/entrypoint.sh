#!/bin/sh
echo "⏳ Waiting for DB..."
sleep 3  # or use pg_isready

echo "🔄 Running database migrations..."
alembic upgrade head

echo "🌱 Seeding initial data..."
python seeds/seed.py --all

echo "▶️ Starting FastAPI"
exec python3 -m debugpy --listen 0.0.0.0:5678 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload