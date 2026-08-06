import httpx
from typing import Dict, Any

# Open-Meteo's historical API endpoint
OPEN_METEO_URL = "https://archive-api.open-meteo.com/v1/archive"

async def fetch_historical_weather(lat: float, lon: float, start_date: str, end_date: str) -> Dict[str, Any]:
    """
    Fetches historical daily weather data from Open-Meteo.
    Uses asynchronous HTTP requests (httpx) for better performance in FastAPI.
    """
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start_date,
        "end_date": end_date,
        "daily": "temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min",
        "timezone": "auto"
    }

    # Use an async client so we don't block the FastAPI event loop while waiting for the network
    async with httpx.AsyncClient() as client:
        response = await client.get(OPEN_METEO_URL, params=params)
        
        # Raise an exception if the API returns an error (like a 400 or 500 status)
        response.raise_for_status()
        
        return response.json()
