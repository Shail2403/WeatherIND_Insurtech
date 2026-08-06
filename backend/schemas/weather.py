from pydantic import BaseModel, Field, field_validator
from datetime import datetime

class WeatherRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90, description="Latitude must be between -90 and 90")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude must be between -180 and 180")
    start_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$", description="Must be YYYY-MM-DD")
    end_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$", description="Must be YYYY-MM-DD")

    @field_validator('end_date')
    @classmethod
    def validate_dates(cls, end_date: str, info):
        # info.data contains previously validated fields (like start_date)
        start_date = info.data.get('start_date')
        if not start_date:
            return end_date
            
        start = datetime.strptime(start_date, "%Y-%m-%d").date()
        end = datetime.strptime(end_date, "%Y-%m-%d").date()
        
        if start > end:
            raise ValueError("start_date cannot be after end_date")
            
        delta = (end - start).days
        if delta > 31:
            raise ValueError("Date range cannot exceed 31 days")
            
        # The user's advanced check: Ensure they aren't asking for a forecast 
        # further out than Open-Meteo allows (14 days max for free tier).
        # We handle this loosely, but let's prevent crazy future dates.
        today = datetime.utcnow().date()
        if (end - today).days > 14:
            raise ValueError("Forecasts are only available up to 14 days in the future")
            
        return end_date
