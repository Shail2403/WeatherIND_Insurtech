from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """
    Application Settings
    This class automatically loads environment variables from the .env file.
    It validates that these variables exist and are of the correct type.
    """
    
    # Supabase S3 Configuration
    SUPABASE_S3_ENDPOINT: str
    SUPABASE_S3_ACCESS_KEY: str
    SUPABASE_S3_SECRET_KEY: str
    SUPABASE_S3_REGION: str
    SUPABASE_BUCKET_NAME: str

    class Config:
        env_file = (".env", "../.env")
        env_file_encoding = "utf-8"

# Instantiate the settings object to be used across the app
settings = Settings()
