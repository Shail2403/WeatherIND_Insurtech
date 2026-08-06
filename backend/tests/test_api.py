import datetime
from unittest.mock import patch

def test_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to the Weather Explorer API"}

def test_health_s3_success(client):
    with patch('main.test_s3_connection', return_value=True):
        response = client.get("/health/s3")
        assert response.status_code == 200
        assert response.json() == {"status": "ok", "message": "Successfully connected to Supabase S3 bucket"}

def test_health_s3_failure(client):
    with patch('main.test_s3_connection', return_value=False):
        response = client.get("/health/s3")
        assert response.status_code == 200
        assert response.json() == {"status": "error", "message": "Failed to connect to Supabase S3 bucket"}

def test_store_weather_data_success(client, mock_fetch_weather, mock_upload_s3):
    # Mock the external API returning dummy data
    mock_fetch_weather.return_value = {"daily": {"time": ["2026-07-01"], "temperature_2m_max": [25.0]}}
    mock_upload_s3.return_value = None

    payload = {
        "latitude": 51.5074,
        "longitude": -0.1278,
        "start_date": "2026-07-01",
        "end_date": "2026-07-05"
    }

    response = client.post("/store-weather-data", json=payload)
    
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert "weather_51.5074_-0.1278_2026-07-01_2026-07-05" in response.json()["file"]
    
    # Ensure our mocks were called
    mock_fetch_weather.assert_called_once()
    mock_upload_s3.assert_called_once()

def test_list_weather_files(client, mock_s3_client):
    # Mock the S3 list objects response
    mock_s3_client.list_objects_v2.return_value = {
        "Contents": [
            {
                "Key": "weather_1.json",
                "Size": 1024,
                "LastModified": datetime.datetime(2026, 1, 1, tzinfo=datetime.timezone.utc)
            }
        ]
    }

    response = client.get("/list-weather-files")
    assert response.status_code == 200
    data = response.json()
    assert len(data["files"]) == 1
    assert data["files"][0]["name"] == "weather_1.json"

def test_get_weather_file_content(client, mock_s3_client):
    # Mock the S3 get object response
    class MockStreamingBody:
        def read(self):
            return b'{"daily": {"time": ["2026-01-01"]}}'

    mock_s3_client.get_object.return_value = {"Body": MockStreamingBody()}

    response = client.get("/weather-file-content/weather_1.json")
    assert response.status_code == 200
    assert response.json() == {"daily": {"time": ["2026-01-01"]}}
