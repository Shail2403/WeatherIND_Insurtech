import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, AsyncMock
from main import weatherApp

@pytest.fixture
def client():
    """Returns a FastAPI TestClient."""
    return TestClient(weatherApp)

@pytest.fixture
def mock_s3_client():
    """Mocks the boto3 S3 client used in main.py and s3_client.py."""
    with patch('main.s3_client') as mock_s3:
        yield mock_s3

@pytest.fixture
def mock_fetch_weather():
    """Mocks the Open-Meteo external API call."""
    with patch('main.fetch_historical_weather', new_callable=AsyncMock) as mock_fetch:
        yield mock_fetch

@pytest.fixture
def mock_upload_s3():
    """Mocks the upload function."""
    with patch('main.upload_json_to_s3') as mock_upload:
        yield mock_upload
