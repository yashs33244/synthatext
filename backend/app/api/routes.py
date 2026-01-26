from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional
import uuid
from datetime import datetime, timezone
from pathlib import Path

from app.core.database import get_db
from app.repositories.job_repository import JobRepository, get_job_repository
from app.repositories.slide_repository import SlideRepository
from app.services.s3_service import S3Service, get_s3_service
from app.middleware.auth import get_current_user
from app.schemas.job import (
    FileUploadResponse,
    JobCreateRequest,
    JobCreateResponse,
    JobStatusResponse,
    PresignedUrlResponse,
    JobListResponse,
    SlideRegenerateRequest
)
from app.schemas.slide import SlideResponse
from app.models.job import JobStatus
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["PPT Generation"], dependencies=[Depends(get_current_user)])
public_router = APIRouter(prefix="/api/v1", tags=["PPT Generation"])


@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    s3_service: S3Service = Depends(get_s3_service)
):
    """
    Upload a file to S3 for PPT generation.
    
    Args:
        file: File to upload
        
    Returns:
        FileUploadResponse with S3 key and file metadata
    """
    try:
        # Generate unique S3 key with ppt-yash-proj prefix
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else ''
        s3_key = f"ppt-yash-proj/inputs/{uuid.uuid4()}.{file_extension}"
        
        # Get file size first
        file.file.seek(0, 2)  # Seek to end
        file_size = file.file.tell()
        file.file.seek(0)  # Reset
        
        # Upload to S3 (or local storage)
        await s3_service.upload_file(
            file.file,
            s3_key,
            content_type=file.content_type
        )
        
        return FileUploadResponse(
            s3_key=s3_key,
            file_name=file.filename,
            file_size=file_size
        )
    
    except Exception as e:
        logger.error(f"File upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")


@router.post("/jobs", response_model=JobCreateResponse)
async def create_job(
    request: JobCreateRequest,
    db: Session = Depends(get_db),
    s3_service: S3Service = Depends(get_s3_service)
):
    """
    Create a new PPT generation job and queue it for processing.
    Returns immediately with job ID - processing happens asynchronously.
    
    Args:
        request: Job creation request with input S3 key and config
        
    Returns:
        JobCreateResponse with job ID and status
    """
    try:
        # Verify input file exists in S3
        if not s3_service.file_exists(request.input_s3_key):
            raise HTTPException(status_code=404, detail="Input file not found in S3")
        
        # Create job in database
        job_repo = JobRepository(db)
        job = job_repo.create_job(
            input_s3_key=request.input_s3_key,
            config=request.config
        )
        
        logger.info(f"Created job: {job.id}, queuing for processing...")
        
        # Queue the entire pipeline (HTML generation + conversion)
        try:
            from app.tasks.conversion_tasks import generate_html_and_convert_task
            task_result = generate_html_and_convert_task.delay(job.id)
            logger.info(f"Job {job.id} queued successfully with task ID: {task_result.id}")
        except Exception as e:
            logger.error(f"Failed to queue job {job.id}: {str(e)}")
            # Update job with error
            job_repo.update_job_status(job.id, JobStatus.FAILED, error_message=f"Failed to queue task: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to queue job: {str(e)}")
        
        return JobCreateResponse(
            job_id=job.id,
            status=job.status,
            created_at=job.created_at
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Job creation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Job creation failed: {str(e)}")


@router.get("/jobs/{job_id}", response_model=JobStatusResponse)
async def get_job_status(
    job_id: str,
    db: Session = Depends(get_db)
):
    """
    Get the status of a PPT generation job.
    
    Args:
        job_id: Job ID
        
    Returns:
        JobStatusResponse with current status and progress
    """
    job_repo = JobRepository(db)
    job = job_repo.get_job(job_id)
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Calculate progress percentage
    progress = 0.0
    if job.total_slides > 0:
        progress = (job.completed_slides / job.total_slides) * 100
    
    return JobStatusResponse(
        job_id=job.id,
        status=job.status,
        total_slides=job.total_slides,
        completed_slides=job.completed_slides,
        progress_percentage=round(progress, 2),
        output_s3_key=job.output_s3_key,
        error_message=job.error_message,
        created_at=job.created_at,
        updated_at=job.updated_at,
        started_at=job.started_at,
        completed_at=job.completed_at
    )


@router.get("/jobs", response_model=JobListResponse)
async def list_jobs(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[JobStatus] = Query(None, description="Filter by status"),
    db: Session = Depends(get_db)
):
    """
    List all PPT generation jobs with pagination.
    
    Args:
        page: Page number (1-indexed)
        page_size: Number of items per page
        status: Optional status filter
        
    Returns:
        JobListResponse with paginated jobs
    """
    job_repo = JobRepository(db)
    
    skip = (page - 1) * page_size
    jobs = job_repo.list_jobs(skip=skip, limit=page_size, status=status)
    total = job_repo.count_jobs(status=status)
    
    job_responses = []
    for job in jobs:
        progress = 0.0
        if job.total_slides > 0:
            progress = (job.completed_slides / job.total_slides) * 100
        
        job_responses.append(JobStatusResponse(
            job_id=job.id,
            status=job.status,
            total_slides=job.total_slides,
            completed_slides=job.completed_slides,
            progress_percentage=round(progress, 2),
            output_s3_key=job.output_s3_key,
            error_message=job.error_message,
            created_at=job.created_at,
            updated_at=job.updated_at,
            started_at=job.started_at,
            completed_at=job.completed_at
        ))
    
    return JobListResponse(
        jobs=job_responses,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/jobs/{job_id}/download", response_model=PresignedUrlResponse)
async def get_download_url(
    job_id: str,
    expiration: int = Query(3600, ge=60, le=86400, description="URL expiration in seconds"),
    db: Session = Depends(get_db),
    s3_service: S3Service = Depends(get_s3_service)
):
    """
    Get a presigned URL to download the generated PPT.
    
    Args:
        job_id: Job ID
        expiration: URL expiration time in seconds (default: 1 hour)
        
    Returns:
        PresignedUrlResponse with presigned download URL
    """
    job_repo = JobRepository(db)
    job = job_repo.get_job(job_id)
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.status != JobStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Job is not completed yet")
    
    if not job.output_s3_key:
        raise HTTPException(status_code=404, detail="Output file not found")
    
    try:
        presigned_url = s3_service.generate_presigned_url(
            job.output_s3_key,
            expiration=expiration
        )
        
        return PresignedUrlResponse(
            presigned_url=presigned_url,
            expires_in=expiration
        )
    
    except Exception as e:
        logger.error(f"Failed to generate presigned URL: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate download URL")


@router.post("/jobs/{job_id}/cancel")
async def cancel_job(
    job_id: str,
    db: Session = Depends(get_db)
):
    """
    Cancel a running job.
    
    Args:
        job_id: Job ID
        
    Returns:
        Success message
    """
    job_repo = JobRepository(db)
    job = job_repo.get_job(job_id)
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.status in [JobStatus.COMPLETED, JobStatus.FAILED]:
        raise HTTPException(status_code=400, detail=f"Job is already {job.status}")
    
    try:
        job_repo.update_job_status(job_id, JobStatus.FAILED, error_message="Cancelled by user")
        logger.info(f"Job {job_id} cancelled")
        return {"message": "Job cancelled successfully"}
    
    except Exception as e:
        logger.error(f"Failed to cancel job: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to cancel job")


@router.delete("/jobs/{job_id}")
async def delete_job(
    job_id: str,
    db: Session = Depends(get_db),
    s3_service: S3Service = Depends(get_s3_service)
):
    """
    Delete a job and its associated files.
    
    Args:
        job_id: Job ID
        
    Returns:
        Success message
    """
    job_repo = JobRepository(db)
    job = job_repo.get_job(job_id)
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    try:
        # Delete output files from S3 if exists
        if job.output_s3_key:
            # Delete both HTML folder and final output
            if job.output_s3_key.startswith("html:"):
                html_folder = job.output_s3_key.replace("html:", "")
                # Delete HTML files (best effort)
                try:
                    for i in range(1, 100):  # Max 100 slides
                        html_key = f"{html_folder}/slide_{i}.html"
                        if s3_service.file_exists(html_key):
                            await s3_service.delete_file(html_key)
                        else:
                            break
                except:
                    pass
            else:
                await s3_service.delete_file(job.output_s3_key)
        
        # Delete input file
        if job.input_s3_key:
            try:
                await s3_service.delete_file(job.input_s3_key)
            except:
                pass
        
        # Delete job from database
        job_repo.delete_job(job_id)
        
        return {"message": "Job deleted successfully"}
    
    except Exception as e:
        logger.error(f"Failed to delete job: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete job")


@router.get("/jobs/{job_id}/slides")
async def get_job_slides(
    job_id: str,
    db: Session = Depends(get_db),
    s3_service: S3Service = Depends(get_s3_service)
):
    """
    Get all HTML slides for a job with presigned URLs (including partial slides during processing).
    
    Args:
        job_id: Job ID
        
    Returns:
        List of slides with presigned URLs
    """
    try:
        job_repo = JobRepository(db)
        slide_repo = SlideRepository(db)
        
        job = job_repo.get_job(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Get slides from database
        db_slides = slide_repo.get_by_job_id(job_id)
        logger.info(f"Found {len(db_slides)} slides in database for job {job_id}")
        
        # Generate presigned URLs for each slide
        slides = []
        for slide in db_slides:
            presigned_url = s3_service.generate_presigned_url(slide.s3_key)
            slides.append({
                "slide_number": slide.slide_number,
                "filename": f"slide_{slide.slide_number}.html",
                "url": presigned_url,
                "slide_type": slide.slide_type,
                "id": slide.id
            })
        
        return {
            "slides": slides,  # Already sorted by slide_number from repository
            "status": job.status.value,
            "total_expected": job.total_slides if job.total_slides else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get slides: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get slides: {str(e)}")


@router.post("/jobs/{job_id}/slides/regenerate")
async def regenerate_slides(
    job_id: str,
    request: SlideRegenerateRequest,
    db: Session = Depends(get_db),
    s3_service: S3Service = Depends(get_s3_service)
):
    """
    Regenerate specific slides with custom instructions.
    
    Args:
        job_id: Job ID
        request: Regeneration request with slide numbers and instructions
        
    Returns:
        Success message
    """
    try:
        job_repo = JobRepository(db)
        job = job_repo.get_job(job_id)
        
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        if job.status != JobStatus.COMPLETED:
            raise HTTPException(status_code=400, detail="Can only regenerate completed job slides")
        
        # Queue slide regeneration task
        from app.tasks.conversion_tasks import regenerate_slides_task
        regenerate_slides_task.delay(
            job_id,
            request.slide_numbers,
            request.instructions
        )
        
        return {
            "message": f"Regenerating {len(request.slide_numbers)} slide(s)",
            "slide_numbers": request.slide_numbers
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to regenerate slides: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to regenerate slides: {str(e)}")


@public_router.get("/storage/{path:path}")
async def serve_storage_file(path: str, s3_service: S3Service = Depends(get_s3_service)):
    """Serve files from S3 or local storage (proxied to avoid CORS)."""
    try:
        from app.core.config import get_settings
        settings = get_settings()
        
        # Dev mode - serve from local storage
        if settings.aws_access_key_id == "placeholder_access_key":
            storage_base = Path(__file__).parent.parent.parent / "storage"
            file_path = storage_base / path
            
            if not file_path.exists() or not file_path.is_file():
                raise HTTPException(status_code=404, detail="File not found")
            
            content_type = 'text/html' if file_path.suffix == '.html' else 'application/octet-stream'
            
            return FileResponse(
                str(file_path),
                media_type=content_type,
                headers={
                    "Cache-Control": "no-cache",
                    "Access-Control-Allow-Origin": "*"
                }
            )
        
        # Production - fetch from S3 and serve
        import tempfile
        import boto3
        
        s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=settings.aws_region
        )
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(path).suffix) as tmp_file:
            try:
                s3_client.download_fileobj(settings.s3_bucket_name, path, tmp_file)
                tmp_path = tmp_file.name
            except Exception as e:
                logger.error(f"S3 download failed: {e}")
                raise HTTPException(status_code=404, detail="File not found in S3")
        
        content_type = 'text/html' if path.endswith('.html') else 'application/octet-stream'
        
        return FileResponse(
            tmp_path,
            media_type=content_type,
            headers={
                "Cache-Control": "public, max-age=3600",
                "Access-Control-Allow-Origin": "*"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to serve file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


@public_router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
