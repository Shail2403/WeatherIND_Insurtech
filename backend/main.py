from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
from services.s3_client import test_s3_connection, upload_json_to_s3, s3_client, BUCKET_NAME
from services.weather_api import fetch_historical_weather
from schemas.weather import WeatherRequest
import json

weatherApp = FastAPI(
    title="Weather Explorer API",
    description="Backend for fetching weather data and storing it in Supabase S3",
    version="1.0.0"
)

# CORS configuration for frontend integration
weatherApp.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@weatherApp.get("/")
def root():
    return {"message": "Welcome to the Weather Explorer API"}

@weatherApp.get("/health/s3")
def health_s3():
    """Health check endpoint to verify S3 connectivity."""
    is_connected = test_s3_connection()
    if is_connected:
        return {"status": "ok", "message": "Successfully connected to Supabase S3 bucket"}
    return {"status": "error", "message": "Failed to connect to Supabase S3 bucket"}

@weatherApp.post("/store-weather-data")
async def store_weather_data(request: WeatherRequest):
    """
    Fetches historical data from Open-Meteo and stores raw JSON in S3.
    """
    try:
        weather_data = await fetch_historical_weather(
            lat=request.latitude,
            lon=request.longitude,
            start_date=request.start_date,
            end_date=request.end_date
        )

        # Enforce case study file naming convention
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        file_name = f"weather_{request.latitude}_{request.longitude}_{request.start_date}_{request.end_date}_{timestamp}.json"

        upload_json_to_s3(file_name, weather_data)

        return {"status": "ok", "file": file_name}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@weatherApp.get("/list-weather-files")
def list_weather_files():
    """Returns a list of all JSON files stored in the bucket and deletes files older than 30 days."""
    try:
        response = s3_client.list_objects_v2(Bucket=BUCKET_NAME)
        files = []
        
        if 'Contents' in response:
            for obj in response['Contents']:
                files.append({
                    "name": obj['Key'],
                    "size": obj['Size'],
                    "created_at": obj['LastModified'].isoformat()
                })
        
        return {"files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@weatherApp.get("/weather-file-content/{file}")
def get_weather_file_content(file: str):
    """Retrieves specific weather JSON file from S3 bucket."""
    try:
        response = s3_client.get_object(Bucket=BUCKET_NAME, Key=file)
         # info.data contains previously validated fields (like start_date)
        file_content = response['Body'].read().decode('utf-8')
        return json.loads(file_content)
    
    except s3_client.exceptions.NoSuchKey:
        raise HTTPException(status_code=404, detail="not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
