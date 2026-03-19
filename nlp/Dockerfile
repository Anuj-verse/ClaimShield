FROM python:3.10-slim

WORKDIR /app

# Install dependencies required by faiss and sentence-transformers
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all python scripts and FAISS indexes
COPY . .

EXPOSE 5001

CMD ["python", "app.py"]
