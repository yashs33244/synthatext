from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid


class Slide(Base):
    """Individual slide model for tracking HTML slides."""
    
    __tablename__ = "slides"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Foreign key to job
    job_id = Column(String, ForeignKey("ppt_jobs.id", ondelete="CASCADE"), nullable=False)
    
    # Slide information
    slide_number = Column(Integer, nullable=False)
    s3_key = Column(String, nullable=False)  # S3 key for the HTML file
    
    # Optional metadata
    slide_type = Column(String, nullable=True)  # 'title', 'content', 'ending'
    content_preview = Column(Text, nullable=True)  # Brief preview of content
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship to job
    job = relationship("PPTJob", back_populates="slides")
    
    def __repr__(self):
        return f"<Slide(id={self.id}, job_id={self.job_id}, slide_number={self.slide_number})>"
