from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class SlideResponse(BaseModel):
    """Response schema for a single slide."""
    id: str
    job_id: str
    slide_number: int
    s3_key: str
    presigned_url: str  # Presigned URL for accessing the HTML
    slide_type: Optional[str] = None
    content_preview: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class SlideCreate(BaseModel):
    """Schema for creating a slide record."""
    job_id: str
    slide_number: int
    s3_key: str
    slide_type: Optional[str] = None
    content_preview: Optional[str] = None
