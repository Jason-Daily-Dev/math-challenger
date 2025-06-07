FROM python:3.12-slim

WORKDIR /src

# Copy pyproject and lock files for reproducible install
COPY pyproject.toml .
COPY requirements.lock requirements.txt
COPY README.md .

# Install dependencies
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY src/app ./app

COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/src

# Run app (init_db can be run via entrypoint or CMD script)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]