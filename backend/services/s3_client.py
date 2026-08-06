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

def list_s3_files() -> list:
    """
    Lists all JSON files in the S3 bucket.
    """
    try:
        response = s3_client.list_objects_v2(Bucket=BUCKET_NAME)
        # S3 returns objects under the 'Contents' key. If bucket is empty, it might not exist.
        objects = response.get('Contents', [])
        
        files = []
        for obj in objects:
            # We format the response exactly how the Case Study requested
            files.append({
                "name": obj['Key'],
                "size": obj['Size'],
                "created_at": obj['LastModified'].isoformat()
            })
        return files
    except Exception as e:
        print(f"❌ Failed to list S3 files: {e}")
        raise e

def read_s3_file(file_name: str) -> dict:
    """
    Reads the content of a specific file from the bucket and returns the parsed JSON.
    """
    try:
        response = s3_client.get_object(Bucket=BUCKET_NAME, Key=file_name)
        # The 'Body' is a stream, so we must read() it, then decode it, then parse it with json.loads
        file_content = response['Body'].read().decode('utf-8')
        return json.loads(file_content)
    except Exception as e:
        # If the file doesn't exist, AWS/Supabase raises a NoSuchKey error
        print(f"❌ Failed to read {file_name} from S3: {e}")
        raise e

# When running this file directly, it will test the connection
if __name__ == "__main__":
    test_s3_connection()
