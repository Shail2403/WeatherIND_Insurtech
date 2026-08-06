import httpx
from datetime import datetime, timedelta
from typing import Dict, Any

ARCHIVE_API_URL = "https://archive-api.open-meteo.com/v1/archive"
FORECAST_API_URL = "https://api.open-meteo.com/v1/forecast"

async def fetch_historical_weather(lat: float, lon: float, start_date: str, end_date: str) -> Dict[str, Any]:
    """
    Fetches daily weather data from Open-Meteo.
    Dynamically routes to the Forecast API (for recent/future data) or the 
    Archive API (for older historical data) based on the date range.
    """
    # 1. Parse the dates to figure out how old the data is
    end_date_obj = datetime.strptime(end_date, "%Y-%m-%d").date()
    today = datetime.utcnow().date()
    
    # Calculate how many days ago the requested end_date is
    days_ago = (today - end_date_obj).days

    # 2. Choose the correct API
    # Open-Meteo's forecast API handles up to 92 days in the past and 16 days in the future.
    # The Archive API handles 1940 to 5 days ago.
    if days_ago <= 90:
        # It's recent history or a future forecast -> Use Forecast API
        api_url = FORECAST_API_URL
        print(f"📡 Routing to Forecast API for dates {start_date} to {end_date}")
    else:
        # It's older than 90 days -> Use Archive API
        api_url = ARCHIVE_API_URL
        print(f"📡 Routing to Archive API for dates {start_date} to {end_date}")

    # 3. Prepare parameters
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start_date,
        "end_date": end_date,
        "daily": "temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min",
        "timezone": "auto"
    }

    # 4. Fetch the data
    async with httpx.AsyncClient() as client:
        response = await client.get(api_url, params=params)
        response.raise_for_status()
        return response.json()
