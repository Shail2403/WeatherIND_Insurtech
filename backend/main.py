from fastapi import FastAPI
from services.s3_client import test_s3_connection

app = FastAPI(
    title="Weather Explorer API",
    description="Backend for fetching weather data and storing it in Supabase S3",
    version="1.0.0"
)

@app.get("/")
def root():
    return {"message": "Welcome to the Weather Explorer API"}

@app.get("/health/s3")
def health_s3():
    """Health check endpoint to verify S3 connectivity."""
    is_connected = test_s3_connection()
    if is_connected:
        return {"status": "ok", "message": "Successfully connected to Supabase S3 bucket"}
    return {"status": "error", "message": "Failed to connect to Supabase S3 bucket"}
