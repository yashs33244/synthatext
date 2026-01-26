from sqlalchemy.orm import Session
from typing import Optional, List
from app.models.job import PPTJob, JobStatus
from app.schemas.job import JobCreateRequest, PPTConfigSchema
import json
import logging

logger = logging.getLogger(__name__)


class JobRepository:
    """Repository for PPT Job database operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_job(
        self, 
        input_s3_key: str, 
        config: PPTConfigSchema
    ) -> PPTJob:
        """
        Create a new PPT generation job.
        
        Args:
            input_s3_key: S3 key of input file
            config: PPT generation configuration
            
        Returns:
            Created PPTJob instance
        """
        job = PPTJob(
            input_s3_key=input_s3_key,
            config_json=config.model_dump_json(),
            status=JobStatus.PENDING
        )
        
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)
        
        logger.info(f"Created job: {job.id}")
        return job
    
    def get_job(self, job_id: str) -> Optional[PPTJob]:
        """
        Get a job by ID.
        
        Args:
            job_id: Job ID
            
        Returns:
            PPTJob instance or None
        """
        return self.db.query(PPTJob).filter(PPTJob.id == job_id).first()
    
    def update_job_status(
        self, 
        job_id: str, 
        status: JobStatus,
        error_message: Optional[str] = None
    ) -> Optional[PPTJob]:
        """
        Update job status.
        
        Args:
            job_id: Job ID
            status: New status
            error_message: Error message if failed
            
        Returns:
            Updated PPTJob instance
        """
        job = self.get_job(job_id)
        if job:
            job.status = status
            if error_message:
                job.error_message = error_message
            
            self.db.commit()
            self.db.refresh(job)
            logger.info(f"Updated job {job_id} status to {status}")
        
        return job
    
    def update_job_progress(
        self, 
        job_id: str, 
        completed_slides: int,
        total_slides: int
    ) -> Optional[PPTJob]:
        """
        Update job progress.
        
        Args:
            job_id: Job ID
            completed_slides: Number of completed slides
            total_slides: Total number of slides
            
        Returns:
            Updated PPTJob instance
        """
        job = self.get_job(job_id)
        if job:
            job.completed_slides = completed_slides
            job.total_slides = total_slides
            
            self.db.commit()
            self.db.refresh(job)
        
        return job
    
    def set_output_s3_key(
        self, 
        job_id: str, 
        output_s3_key: str
    ) -> Optional[PPTJob]:
        """
        Set the output S3 key for a completed job.
        
        Args:
            job_id: Job ID
            output_s3_key: S3 key of output file
            
        Returns:
            Updated PPTJob instance
        """
        job = self.get_job(job_id)
        if job:
            job.output_s3_key = output_s3_key
            
            self.db.commit()
            self.db.refresh(job)
            logger.info(f"Set output S3 key for job {job_id}: {output_s3_key}")
        
        return job
    
    def list_jobs(
        self, 
        skip: int = 0, 
        limit: int = 100,
        status: Optional[JobStatus] = None
    ) -> List[PPTJob]:
        """
        List jobs with pagination.
        
        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            status: Filter by status
            
        Returns:
            List of PPTJob instances
        """
        query = self.db.query(PPTJob)
        
        if status:
            query = query.filter(PPTJob.status == status)
        
        return query.order_by(PPTJob.created_at.desc()).offset(skip).limit(limit).all()
    
    def count_jobs(self, status: Optional[JobStatus] = None) -> int:
        """
        Count total jobs.
        
        Args:
            status: Filter by status
            
        Returns:
            Total count
        """
        query = self.db.query(PPTJob)
        
        if status:
            query = query.filter(PPTJob.status == status)
        
        return query.count()
    
    def delete_job(self, job_id: str) -> bool:
        """
        Delete a job.
        
        Args:
            job_id: Job ID
            
        Returns:
            True if deleted
        """
        job = self.get_job(job_id)
        if job:
            self.db.delete(job)
            self.db.commit()
            logger.info(f"Deleted job: {job_id}")
            return True
        return False


def get_job_repository(db: Session) -> JobRepository:
    """Dependency for getting job repository instance."""
    return JobRepository(db)
