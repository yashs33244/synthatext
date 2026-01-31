import boto3
from botocore.exceptions import ClientError
from typing import Optional, BinaryIO
from pathlib import Path
from app.core.config import get_settings
import logging

logger = logging.getLogger(__name__)


class S3Service:
    """Service for handling S3 operations using Repository pattern."""
    
    def __init__(self):
        self.settings = get_settings()
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=self.settings.aws_access_key_id,
            aws_secret_access_key=self.settings.aws_secret_access_key,
            region_name=self.settings.aws_region
        )
        self.bucket_name = self.settings.s3_bucket_name
        # Use absolute path for local storage
        self.local_storage_base = Path(__file__).parent.parent.parent / "storage"
    
    async def upload_file(
        self, 
        file_obj: BinaryIO, 
        s3_key: str,
        content_type: Optional[str] = None
    ) -> str:
        """Upload a file to S3 or local storage."""
        try:
            # Check if we should use local storage for development
            if self.settings.aws_access_key_id == "placeholder_access_key":
                local_path = self.local_storage_base / s3_key
                local_path.parent.mkdir(parents=True, exist_ok=True)
                
                with open(local_path, "wb") as f:
                    f.write(file_obj.read())
                
                logger.info(f"Dev Mode: Saved file locally to {local_path}")
                return s3_key

            extra_args = {}
            if content_type:
                extra_args['ContentType'] = content_type
            
            self.s3_client.upload_fileobj(
                file_obj,
                self.bucket_name,
                s3_key,
                ExtraArgs=extra_args
            )
            
            logger.info(f"Successfully uploaded file to S3: {s3_key}")
            return s3_key
            
        except ClientError as e:
            logger.error(f"Failed to upload file to S3: {e}")
            raise Exception(f"S3 upload failed: {str(e)}")

    async def download_file(self, s3_key: str, local_path: str) -> str:
        """Download a file from S3 or local storage."""
        try:
            if self.settings.aws_access_key_id == "placeholder_access_key":
                source_path = self.local_storage_base / s3_key
                import shutil
                shutil.copy2(source_path, local_path)
                logger.info(f"Dev Mode: Copied file from local storage: {s3_key}")
                return local_path

            self.s3_client.download_file(
                self.bucket_name,
                s3_key,
                local_path
            )
            
            logger.info(f"Successfully downloaded file from S3: {s3_key}")
            return local_path
            
        except (ClientError, FileNotFoundError) as e:
            logger.error(f"Failed to download file: {e}")
            raise Exception(f"File download failed: {str(e)}")

    async def upload_file_from_path(
        self, 
        local_path: str, 
        s3_key: str,
        content_type: Optional[str] = None
    ) -> str:
        """Upload a file from local path to S3 or local storage."""
        try:
            if self.settings.aws_access_key_id == "placeholder_access_key":
                dest_path = self.local_storage_base / s3_key
                dest_path.parent.mkdir(parents=True, exist_ok=True)
                import shutil
                shutil.copy2(local_path, dest_path)
                logger.info(f"Dev Mode: Saved file locally to {dest_path}")
                return s3_key

            extra_args = {}
            if content_type:
                extra_args['ContentType'] = content_type
            
            self.s3_client.upload_file(
                local_path,
                self.bucket_name,
                s3_key,
                ExtraArgs=extra_args
            )
            
            logger.info(f"Successfully uploaded file to S3: {s3_key}")
            return s3_key
            
        except ClientError as e:
            logger.error(f"Failed to upload file to S3: {e}")
            raise Exception(f"S3 upload failed: {str(e)}")

    def generate_presigned_url(
        self, 
        s3_key: str, 
        expiration: int = 3600
    ) -> str:
        """Generate a backend proxy URL to avoid CORS issues."""
        # ALWAYS use backend proxy to avoid CORS with S3/iframes
        return f"{self.settings.backend_url}/api/v1/storage/{s3_key}"

    async def delete_file(self, s3_key: str) -> bool:
        """Delete a file from S3 or local storage."""
        try:
            if self.settings.aws_access_key_id == "placeholder_access_key":
                local_path = self.local_storage_base / s3_key
                if local_path.exists():
                    local_path.unlink()
                return True

            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            
            logger.info(f"Successfully deleted file from S3: {s3_key}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete file: {e}")
            raise Exception(f"S3 delete failed: {str(e)}")

    def file_exists(self, s3_key: str) -> bool:
        """Check if a file exists in S3 or local storage."""
        if self.settings.aws_access_key_id == "placeholder_access_key":
            return (self.local_storage_base / s3_key).exists()

        try:
            self.s3_client.head_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            return True
        except ClientError:
            return False

    def list_files(self, prefix: str) -> list[str]:
        """List all files under a given prefix in S3 or local storage."""
        try:
            if self.settings.aws_access_key_id == "placeholder_access_key":
                folder_path = self.local_storage_base / prefix
                if not folder_path.exists():
                    return []
                return [f.name for f in folder_path.iterdir() if f.is_file()]

            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=prefix
            )
            
            if 'Contents' not in response:
                return []
            
            # Extract just the filenames from the full keys
            files = []
            for obj in response['Contents']:
                # Get just the filename, not the full path
                filename = obj['Key'].split('/')[-1]
                if filename:  # Skip if it's a folder marker
                    files.append(filename)
            
            return files
            
        except Exception as e:
            logger.error(f"Failed to list files: {e}")
            return []


def get_s3_service() -> S3Service:
    """Dependency for getting S3 service instance."""
    return S3Service()
