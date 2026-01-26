"""PPT generation service for synchronous HTML generation."""
import logging
import os
import sys
import tempfile
from pathlib import Path
from typing import Dict, Any, Tuple, List

from app.core.config import get_settings
from app.core.database import SessionLocal
from app.services.s3_service import S3Service
from app.repositories.job_repository import JobRepository
from app.repositories.slide_repository import SlideRepository
from app.models.job import JobStatus
from app.schemas.slide import SlideCreate

logger = logging.getLogger(__name__)

# Add project root to path to import generate_ppt module
current_file = Path(__file__).resolve()
project_root = current_file.parent.parent.parent.parent
sys.path.insert(0, str(project_root))

from generate_ppt import (
    load_source_content,
    distribute_content_to_slides,
    generate_title_slide_html,
    generate_ending_slide_html,
    generate_content_slide_html,
    save_html_slide,
    get_instructions
)


class PPTService:
    """Service for PPT generation operations."""
    
    def __init__(self, s3_service: S3Service, job_repo: JobRepository, slide_repo: SlideRepository):
        self.s3_service = s3_service
        self.job_repo = job_repo
        self.slide_repo = slide_repo
        self.settings = get_settings()
    
    async def generate_html_slides(
        self,
        job_id: str,
        input_s3_key: str,
        config: Dict[str, Any]
    ) -> Tuple[str, int]:
        """
        Generate HTML slides synchronously and upload to S3.
        
        Returns:
            Tuple of (html_folder_s3_key, total_slides)
        """
        import asyncio
        
        logger.info(f"Starting HTML generation for job {job_id}")
        
        # Update status to processing
        self.job_repo.update_job_status(job_id, JobStatus.PROCESSING)
        
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            input_path = temp_path / "input"
            output_path = temp_path / "output"
            input_path.mkdir(exist_ok=True)
            output_path.mkdir(exist_ok=True)
            
            # Download input file
            logger.info(f"Downloading input file: {input_s3_key}")
            file_ext = Path(input_s3_key).suffix
            input_file = input_path / f"input_file{file_ext}"
            await self.s3_service.download_file(input_s3_key, str(input_file))
            
            # Prepare config
            ppt_config = self._prepare_ppt_config(
                job_id, config, input_file, output_path
            )
            
            # Change to temp directory for generate_ppt module
            original_dir = os.getcwd()
            os.chdir(temp_path)
            
            try:
                import generate_ppt
                old_script_dir = generate_ppt.SCRIPT_DIR
                generate_ppt.SCRIPT_DIR = temp_path
                
                # Load instructions and content
                instructions = get_instructions()
                pages = load_source_content(ppt_config)
                logger.info(f"Loaded {len(pages)} pages from source")
                
                if not pages:
                    raise Exception("No content found in source file")
                
                # Distribute content
                num_slides = ppt_config["slides"]["number_of_slides"]
                slides_content = distribute_content_to_slides(pages, num_slides)
                logger.info(f"Distributing content across {len(slides_content)} slides")
                
                total_slides = len(slides_content) + 2  # +2 for title and ending
                self.job_repo.update_job_progress(job_id, 0, total_slides)
                
                # Generate slides
                slide_number = 1
                
                # Prepare S3 folder key
                html_folder_s3_key = f"ppt-yash-proj/htmls/{job_id}"
                
                # Title slide
                logger.info("Generating title slide...")
                title_html = generate_title_slide_html(ppt_config, instructions)
                if title_html:
                    save_html_slide(title_html, slide_number, output_path)
                    # Upload immediately to S3 and DB
                    await self._upload_single_slide(job_id, output_path, slide_number, html_folder_s3_key, slide_type="title")
                    slide_number += 1
                    self.job_repo.update_job_progress(job_id, slide_number - 1, total_slides)
                
                # Content slides
                for i, slide_content in enumerate(slides_content):
                    logger.info(f"Generating content slide {i+1}/{len(slides_content)}...")
                    html = generate_content_slide_html(
                        slide_content,
                        slide_number,
                        total_slides,
                        ppt_config,
                        instructions
                    )
                    save_html_slide(html, slide_number, output_path)
                    # Upload immediately to S3 and DB for live preview
                    await self._upload_single_slide(job_id, output_path, slide_number, html_folder_s3_key, slide_type="content")
                    slide_number += 1
                    self.job_repo.update_job_progress(job_id, slide_number - 1, total_slides)
                
                # Ending slide
                logger.info("Generating ending slide...")
                ending_html = generate_ending_slide_html(ppt_config, instructions)
                if ending_html:
                    save_html_slide(ending_html, slide_number, output_path)
                    # Upload immediately to S3 and DB
                    await self._upload_single_slide(job_id, output_path, slide_number, html_folder_s3_key, slide_type="ending")
                    self.job_repo.update_job_progress(job_id, slide_number, total_slides)
                
                generate_ppt.SCRIPT_DIR = old_script_dir
                
                logger.info(f"HTML generation completed for job {job_id}")
                return html_folder_s3_key, total_slides
                
            finally:
                os.chdir(original_dir)
    
    def _prepare_ppt_config(
        self,
        job_id: str,
        config: Dict[str, Any],
        input_file: Path,
        output_path: Path
    ) -> Dict[str, Any]:
        """Prepare PPT configuration dictionary."""
        return {
            "input": {
                "file_name": input_file.name,
                "content_type": "auto"
            },
            "output": {
                "format": config.get("output_format", "pdf"),
                "file_name": f"presentation_{job_id}",
                "folder": str(output_path)
            },
            "slides": {
                "width": 1280,
                "height": 720,
                "number_of_slides": config.get("number_of_slides", 15),
                "pages_to_process": config.get("pages_to_process", -1)
            },
            "title_slide": {
                "enabled": True,
                "title": config.get("title", "Presentation"),
                "subtitle": config.get("subtitle", ""),
                "author": config.get("author", ""),
                "date": "auto",
                "background_color": config.get("title_slide_color", "#004080"),
                "text_color": "#FFFFFF",
                "font_family": config.get("title_slide_font", "Inter")
            },
            "ending_slide": {
                "enabled": True,
                "type": "thank_you",
                "main_text": "Thank You",
                "background_color": "#004080",
                "text_color": "#FFFFFF"
            },
            "content_styling": {
                "style": "mckinsey",
                "primary_color": config.get("primary_color", "#004080"),
                "secondary_color": config.get("secondary_color", "#0066CC"),
                "accent_color": config.get("accent_color", "#FFA000"),
                "background_color": config.get("background_color", "#FFFFFF"),
                "page_background_color": config.get("page_background_color", "#FFFFFF"),
                "title_color": "#004080",
                "body_color": "#333333",
                "font_family": config.get("content_font", "Inter"),
                "title_font_size": config.get("title_font_size", 28),
                "body_font_size": config.get("body_font_size", 11),
                "include_insights": True,
                "include_page_numbers": True,
                "include_sources": True,
                "additional_prompt": config.get("additional_prompt", "")
            },
            "llm": {
                "provider": config.get("llm_provider", "gemini"),
                "claude": {
                    "model": "claude-sonnet-4-5-20250929",
                    "max_tokens": 10000
                },
                "gemini": {
                    "model": "gemini-2.0-flash-exp",
                    "max_tokens": 10000
                }
            },
            "processing": {
                "verbose": True,
                "save_html_files": True,
                "cleanup_html": False,
                "max_retries": 2
            }
        }
    
    async def _upload_single_slide(
        self, 
        job_id: str,
        output_path: Path, 
        slide_number: int, 
        html_folder_s3_key: str,
        slide_type: str = "content"
    ):
        """Upload a single HTML slide to S3 and save to DB immediately after generation."""
        html_file = output_path / f"slide_{slide_number}.html"
        if html_file.exists():
            s3_key = f"{html_folder_s3_key}/slide_{slide_number}.html"
            
            # Upload to S3
            await self.s3_service.upload_file_from_path(
                str(html_file),
                s3_key,
                content_type="text/html"
            )
            logger.info(f"Uploaded slide_{slide_number}.html to S3 for live preview")
            
            # Save to database with a fresh session
            db = None
            try:
                db = SessionLocal()
                slide_repo = SlideRepository(db)
                slide_data = SlideCreate(
                    job_id=job_id,
                    slide_number=slide_number,
                    s3_key=s3_key,
                    slide_type=slide_type
                )
                slide = slide_repo.create(slide_data)
                logger.info(f"Saved slide_{slide_number} (id: {slide.id}) to database")
            except Exception as e:
                logger.error(f"Failed to save slide to database: {e}")
                if db:
                    db.rollback()
            finally:
                if db:
                    db.close()
    
    async def _upload_html_folder(self, output_path: Path, html_folder_s3_key: str):
        """Upload all HTML files from output folder to S3."""
        html_files = sorted(output_path.glob("slide_*.html"))
        
        for html_file in html_files:
            s3_key = f"{html_folder_s3_key}/{html_file.name}"
            await self.s3_service.upload_file_from_path(
                str(html_file),
                s3_key,
                content_type="text/html"
            )
            logger.info(f"Uploaded {html_file.name} to S3")


def get_ppt_service(
    s3_service: S3Service,
    job_repo: JobRepository,
    slide_repo: SlideRepository
) -> PPTService:
    """Dependency for getting PPT service instance."""
    return PPTService(s3_service, job_repo, slide_repo)
