#!/bin/sh
echo "⏳ Waiting for DB..."
sleep 3  # or use pg_isready

echo "🚀 Initializing DB"
python scripts/init_db.py

echo "▶️ Starting FastAPI"
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --reload-dir app