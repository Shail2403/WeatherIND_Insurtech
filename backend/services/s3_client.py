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

# When running this file directly, it will test the connection
if __name__ == "__main__":
    test_s3_connection()
