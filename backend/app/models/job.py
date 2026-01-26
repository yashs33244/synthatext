from sqlalchemy import Column, String, DateTime, Enum, Text, Integer
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum
import uuid


class JobStatus(str, enum.Enum):
    """Job status enumeration."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class PPTJob(Base):
    """PPT Generation Job model."""
    
    __tablename__ = "ppt_jobs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # File references
    input_s3_key = Column(String, nullable=False)
    output_s3_key = Column(String, nullable=True)
    
    # Job status
    status = Column(Enum(JobStatus), default=JobStatus.PENDING, nullable=False)
    
    # Configuration (stored as JSON string)
    config_json = Column(Text, nullable=False)
    
    # Progress tracking
    total_slides = Column(Integer, default=0)
    completed_slides = Column(Integer, default=0)
    
    # Error tracking
    error_message = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationship to slides
    slides = relationship("Slide", back_populates="job", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<PPTJob(id={self.id}, status={self.status})>"
