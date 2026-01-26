from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from app.models.job import JobStatus


class PPTConfigSchema(BaseModel):
    """PPT Generation configuration schema."""
    title: str = Field(..., description="Presentation title")
    subtitle: Optional[str] = Field(None, description="Presentation subtitle")
    author: Optional[str] = Field(None, description="Author name")
    number_of_slides: int = Field(15, description="Number of content slides")
    pages_to_process: int = Field(-1, description="Number of pages to process from input")
    output_format: str = Field("pdf", description="Output format: pdf or pptx")
    llm_provider: str = Field("gemini", description="LLM provider: claude or gemini")
    
    # Styling
    primary_color: str = Field("#004080", description="Primary color")
    secondary_color: str = Field("#0066CC", description="Secondary color")
    accent_color: str = Field("#FFA000", description="Accent color")
    background_color: str = Field("#FFFFFF", description="Title/content background color")
    page_background_color: str = Field("#FFFFFF", description="Page background color")
    content_font: str = Field("Inter", description="Content font family")
    title_slide_font: str = Field("Inter", description="Title slide font family")
    title_font_size: int = Field(28, description="Title font size in pixels")
    body_font_size: int = Field(11, description="Body font size in pixels")
    title_slide_color: str = Field("#004080", description="Title slide background color")
    additional_prompt: Optional[str] = Field("", description="Additional instructions for slide generation")


class FileUploadResponse(BaseModel):
    """Response for file upload."""
    s3_key: str = Field(..., description="S3 key of uploaded file")
    file_name: str = Field(..., description="Original file name")
    file_size: int = Field(..., description="File size in bytes")


class JobCreateRequest(BaseModel):
    """Request to create a new PPT generation job."""
    input_s3_key: str = Field(..., description="S3 key of input file")
    config: PPTConfigSchema = Field(..., description="PPT generation configuration")


class JobCreateResponse(BaseModel):
    """Response for job creation."""
    job_id: str = Field(..., description="Unique job ID")
    status: JobStatus = Field(..., description="Initial job status")
    created_at: datetime = Field(..., description="Job creation timestamp")


class JobStatusResponse(BaseModel):
    """Response for job status query."""
    job_id: str
    status: JobStatus
    total_slides: int = 0
    completed_slides: int = 0
    progress_percentage: float = 0.0
    output_s3_key: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class PresignedUrlResponse(BaseModel):
    """Response for presigned URL generation."""
    presigned_url: str = Field(..., description="Presigned URL for file download")
    expires_in: int = Field(3600, description="URL expiration time in seconds")


class JobListResponse(BaseModel):
    """Response for listing jobs."""
    jobs: list[JobStatusResponse]
    total: int
    page: int
    page_size: int


class SlideRegenerateRequest(BaseModel):
    """Request to regenerate specific slides."""
    slide_numbers: list[int] = Field(..., description="List of slide numbers to regenerate")
    instructions: str = Field(..., description="Instructions for regenerating slides")
