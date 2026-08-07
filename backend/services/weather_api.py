import httpx
from datetime import datetime, timedelta
from typing import Dict, Any

ARCHIVE_API_URL = "https://archive-api.open-meteo.com/v1/archive"
FORECAST_API_URL = "https://api.open-meteo.com/v1/forecast"

async def fetch_historical_weather(lat: float, lon: float, start_date: str, end_date: str) -> Dict[str, Any]:
    """
    Fetches daily weather data from Open-Meteo.
    Dynamically routes to Forecast API for recent/future data or Archive API for historical data.
    """
    start_date_obj = datetime.strptime(start_date, "%Y-%m-%d").date()
    today = datetime.utcnow().date()
    start_days_ago = (today - start_date_obj).days

    # Open-Meteo's forecast API handles up to 92 days in the past.
    # We must route based on start_date, because if start_date > 92 days ago, forecast API throws a 400.
    if start_days_ago <= 90:
        api_url = FORECAST_API_URL
    else:
        api_url = ARCHIVE_API_URL

    # 3. Prepare parameters
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start_date,
        "end_date": end_date,
        "daily": "temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,wind_speed_10m_max",
        "timezone": "auto"
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(api_url, params=params)
        
        # Add user-friendly error handling for HTTP errors
        if response.status_code == 400:
            error_data = response.json()
            reason = error_data.get("reason", "Unknown API Error")
            raise Exception(f"Open-Meteo API Error: {reason}")
            
        response.raise_for_status()
        return response.json()
