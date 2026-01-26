"""Repository for Slide database operations."""
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.slide import Slide
from app.schemas.slide import SlideCreate


class SlideRepository:
    """Repository for slide-related database operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, slide_data: SlideCreate) -> Slide:
        """Create a new slide record."""
        import logging
        logger = logging.getLogger(__name__)
        
        slide = Slide(
            job_id=slide_data.job_id,
            slide_number=slide_data.slide_number,
            s3_key=slide_data.s3_key,
            slide_type=slide_data.slide_type,
            content_preview=slide_data.content_preview
        )
        logger.info(f"Creating slide record: job_id={slide_data.job_id}, slide_number={slide_data.slide_number}")
        self.db.add(slide)
        self.db.commit()
        logger.info(f"Slide committed to DB: {slide.id}")
        self.db.refresh(slide)
        return slide
    
    def get_by_job_id(self, job_id: str) -> List[Slide]:
        """Get all slides for a job, ordered by slide number."""
        return (
            self.db.query(Slide)
            .filter(Slide.job_id == job_id)
            .order_by(Slide.slide_number)
            .all()
        )
    
    def get_by_slide_number(self, job_id: str, slide_number: int) -> Optional[Slide]:
        """Get a specific slide by job ID and slide number."""
        return (
            self.db.query(Slide)
            .filter(and_(Slide.job_id == job_id, Slide.slide_number == slide_number))
            .first()
        )
    
    def update_s3_key(self, slide_id: str, s3_key: str) -> Optional[Slide]:
        """Update the S3 key for a slide (used when regenerating)."""
        slide = self.db.query(Slide).filter(Slide.id == slide_id).first()
        if slide:
            slide.s3_key = s3_key
            self.db.commit()
            self.db.refresh(slide)
        return slide
    
    def delete_by_job_id(self, job_id: str) -> int:
        """Delete all slides for a job."""
        deleted_count = self.db.query(Slide).filter(Slide.job_id == job_id).delete()
        self.db.commit()
        return deleted_count
