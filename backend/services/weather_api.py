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
    end_date_obj = datetime.strptime(end_date, "%Y-%m-%d").date()
    today = datetime.utcnow().date()
    days_ago = (today - end_date_obj).days

    # Open-Meteo's forecast API handles up to 92 days in the past and 16 days in the future.
    if days_ago <= 90:
        api_url = FORECAST_API_URL
    else:
        api_url = ARCHIVE_API_URL

    # 3. Prepare parameters
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start_date,
        "end_date": end_date,
        "daily": "temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min",
        "timezone": "auto"
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(api_url, params=params)
        response.raise_for_status()
        return response.json()
