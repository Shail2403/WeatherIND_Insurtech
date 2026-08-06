from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from services.s3_client import test_s3_connection, upload_json_to_s3, s3_client, BUCKET_NAME
from services.weather_api import fetch_historical_weather
from schemas.weather import WeatherRequest
import json

app = FastAPI(
    title="Weather Explorer API",
    description="Backend for fetching weather data and storing it in Supabase S3",
    version="1.0.0"
)

# Enable CORS for the frontend React app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

@app.post("/store-weather-data")
async def store_weather_data(request: WeatherRequest):
    """
    1. Validates the request via the WeatherRequest schema.
    2. Fetches data from Open-Meteo (Archive or Forecast dynamically).
    3. Saves the raw JSON to the S3 bucket.
    """
    try:
        # Fetch from Open-Meteo
        weather_data = await fetch_historical_weather(
            lat=request.latitude,
            lon=request.longitude,
            start_date=request.start_date,
            end_date=request.end_date
        )

        # Generate a unique filename as required by the case study
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        file_name = f"weather_{request.latitude}_{request.longitude}_{request.start_date}_{request.end_date}_{timestamp}.json"

        # Upload to S3
        upload_json_to_s3(file_name, weather_data)

        return {"status": "ok", "file": file_name}
    
    except Exception as e:
        # If anything goes wrong, return a 500 Server Error
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/list-weather-files")
def list_weather_files():
    """Returns a list of all JSON files stored in the bucket."""
    try:
        response = s3_client.list_objects_v2(Bucket=BUCKET_NAME)
        files = []
        
        # Check if the bucket has any contents
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

@app.get("/weather-file-content/{file}")
def get_weather_file_content(file: str):
    """Fetches the contents of a specific JSON file from the bucket."""
    try:
        response = s3_client.get_object(Bucket=BUCKET_NAME, Key=file)
        # The body is a stream, so we read it and decode it from bytes to string
        file_content = response['Body'].read().decode('utf-8')
        
        # Convert the string back into a JSON object to return
        return json.loads(file_content)
    
    except s3_client.exceptions.NoSuchKey:
        # If the file doesn't exist, return a 404 (as required by case study)
        raise HTTPException(status_code=404, detail="not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
