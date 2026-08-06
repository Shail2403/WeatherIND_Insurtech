import json
import boto3
from botocore.client import Config
from core.config import settings

# Initialize the S3 client
s3_client = boto3.client(
    's3',
    endpoint_url=settings.SUPABASE_S3_ENDPOINT,
    aws_access_key_id=settings.SUPABASE_S3_ACCESS_KEY,
    aws_secret_access_key=settings.SUPABASE_S3_SECRET_KEY,
    region_name=settings.SUPABASE_S3_REGION,
    config=Config(signature_version='s3v4')
)

BUCKET_NAME = settings.SUPABASE_BUCKET_NAME

def test_s3_connection():
    """
    Tests the connection to Supabase S3 by listing the buckets.
    This is useful to verify credentials before building further.
    """
    try:
        response = s3_client.list_buckets()
        print("✅ Successfully connected to Supabase S3!")
        print("Available buckets:", [bucket['Name'] for bucket in response.get('Buckets', [])])
        return True
    except Exception as e:
        print(f"❌ Failed to connect to S3: {e}")
        return False

def upload_json_to_s3(file_name: str, json_data: dict) -> str:
    """
    Uploads a python dictionary as a JSON string to the S3 bucket.
    Returns the file name on success.
    """
    try:
        # Convert the python dictionary to a JSON formatted string
        json_string = json.dumps(json_data)
        
        # put_object uploads the data directly without saving a temporary file on the server disk
        s3_client.put_object(
            Bucket=BUCKET_NAME,
            Key=file_name,
            Body=json_string,
            ContentType='application/json'
        )
        print(f"✅ Successfully uploaded {file_name} to {BUCKET_NAME}")
        return file_name
    except Exception as e:
        print(f"❌ Failed to upload to S3: {e}")
        raise e

# When running this file directly, it will test the connection
if __name__ == "__main__":
    test_s3_connection()
