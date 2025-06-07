# Math Challenger Backend

This is the backend service for the Math Challenger application, built with FastAPI and PostgreSQL, and managed with Rye for Python dependencies.

## Features
- FastAPI-based REST API
- PostgreSQL database
- Dockerized for easy development and deployment
- Rye for Python dependency management
- Includes database seeding script (`init_db.py`)

## Development Setup

### Prerequisites
- [Docker](https://www.docker.com/)
- [Rye](https://rye-up.com/) (for local development)

### Running Locally with Docker Compose

1. **Build and start all services:**
   ```sh
   docker compose up --build
   ```
   This will start:
   - `backend`: FastAPI app (http://localhost:8000)
   - `db`: PostgreSQL database (port 5432)
   - `pgadmin`: PostgreSQL admin UI (http://localhost:5050, login: admin@admin.com / admin)

2. **API Docs:**
   - Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
   - ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### Local Development (without Docker)

1. Install dependencies:
   ```sh
   rye sync
   ```
2. Set up a local PostgreSQL database and configure your `.env` file.
3. Run the app:
   ```sh
   uvicorn app.main:app --reload
   ```

### Database Seeding
To reset and seed the database, run:
```sh
python app/init_db.py
```

## Project Structure
```
backend/
  src/app/
    main.py         # FastAPI entrypoint
    init_db.py      # Database seeding script
    models/         # SQLAlchemy models
    routes/         # API routes
    db/             # Database session setup
```

## License
MIT
