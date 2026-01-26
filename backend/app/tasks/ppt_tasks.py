from app.celery_app import celery_app
from app.core.database import SessionLocal
from app.repositories.job_repository import JobRepository
from app.services.s3_service import S3Service
from app.models.job import JobStatus
import os
import sys
import tempfile
import logging
from pathlib import Path
from datetime import datetime

# Add backend root to path to import generate_ppt module
# File structure: backend/app/tasks/ppt_tasks.py
# generate_ppt.py is now in backend/ directory
current_file = Path(__file__).resolve()
backend_root = current_file.parent.parent.parent
sys.path.insert(0, str(backend_root))

from generate_ppt import (
    load_source_content,
    distribute_content_to_slides,
    generate_title_slide_html,
    generate_ending_slide_html,
    generate_content_slide_html,
    save_html_slide,
    convert_to_pdf,
    convert_to_pptx,
    get_instructions
)

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name='app.tasks.ppt_tasks.generate_ppt')
def generate_ppt_task(self, job_id: str):
    """
    Celery task to generate PPT asynchronously.
    
    Args:
        job_id: ID of the PPT generation job
    """
    import asyncio
    db = SessionLocal()
    job_repo = JobRepository(db)
    s3_service = S3Service()
    
    try:
        # Get job from database
        job = job_repo.get_job(job_id)
        if not job:
            logger.error(f"Job not found: {job_id}")
            return
        
        # Update status to processing
        job_repo.update_job_status(job_id, JobStatus.PROCESSING)
        
        # Parse configuration
        import json
        config = json.loads(job.config_json)
        
        # Create temporary working directory
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            input_path = temp_path / "input"
            output_path = temp_path / "output"
            input_path.mkdir(exist_ok=True)
            output_path.mkdir(exist_ok=True)
            
            # Download input file from S3 (using asyncio.run for async method)
            logger.info(f"Downloading input file: {job.input_s3_key}")
            file_ext = Path(job.input_s3_key).suffix
            input_file = input_path / f"input_file{file_ext}"
            asyncio.run(s3_service.download_file(job.input_s3_key, str(input_file)))
            
            # Prepare config for generate_ppt
            ppt_config = {
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
                    "background_color": "#004080",
                    "text_color": "#FFFFFF"
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
                    "background_color": "#FFFFFF",
                    "title_color": "#004080",
                    "body_color": "#333333",
                    "title_font_size": 28,
                    "body_font_size": 11,
                    "include_insights": True,
                    "include_page_numbers": True,
                    "include_sources": True
                },
                "llm": {
                    "provider": config.get("llm_provider", "gemini"),
                    "claude": {
                        "model": "claude-sonnet-4-5-20250929",
                        "max_tokens": 10000
                    },
                    "gemini": {
                        "model": "gemini-3-pro-preview",
                        "max_tokens": 10000
                    }
                },
                "processing": {
                    "verbose": True,
                    "save_html_files": True,
                    "cleanup_html": True,
                    "max_retries": 2
                }
            }
            
            # Change working directory temporarily
            original_dir = os.getcwd()
            os.chdir(temp_path)
            
            try:
                # Load instructions
                instructions = get_instructions()
                
                # Load source content
                logger.info("Loading source content...")
                
                # Temporarily set SCRIPT_DIR for the generate_ppt module
                import generate_ppt
                old_script_dir = generate_ppt.SCRIPT_DIR
                generate_ppt.SCRIPT_DIR = temp_path
                
                pages = load_source_content(ppt_config)
                logger.info(f"Loaded {len(pages)} pages from source")
                
                if not pages:
                    raise Exception("No content found in source file")
                
                # Distribute content across slides
                num_slides = ppt_config["slides"]["number_of_slides"]
                slides_content = distribute_content_to_slides(pages, num_slides)
                logger.info(f"Distributing content across {len(slides_content)} slides")
                
                total_slides = len(slides_content) + 2  # +2 for title and ending
                job_repo.update_job_progress(job_id, 0, total_slides)
                
                # Generate slides
                slide_number = 1
                
                # Title slide
                logger.info("Generating title slide...")
                title_html = generate_title_slide_html(ppt_config, instructions)
                if title_html:
                    save_html_slide(title_html, slide_number, output_path)
                    slide_number += 1
                    job_repo.update_job_progress(job_id, slide_number - 1, total_slides)
                
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
                    slide_number += 1
                    job_repo.update_job_progress(job_id, slide_number - 1, total_slides)
                
                # Ending slide
                logger.info("Generating ending slide...")
                ending_html = generate_ending_slide_html(ppt_config, instructions)
                if ending_html:
                    save_html_slide(ending_html, slide_number, output_path)
                    job_repo.update_job_progress(job_id, slide_number, total_slides)
                
                # Convert to output format
                logger.info("Converting to output format...")
                output_format = ppt_config["output"]["format"]
                
                if output_format == "pdf":
                    output_file = convert_to_pdf(output_path, ppt_config)
                else:
                    output_file = convert_to_pptx(output_path, ppt_config)
                
                # Restore SCRIPT_DIR
                generate_ppt.SCRIPT_DIR = old_script_dir
                
                if not output_file or not Path(output_file).exists():
                    raise Exception("Failed to generate output file")
                
                # Upload output file to S3
                logger.info("Uploading output file to S3...")
                output_s3_key = f"outputs/{job_id}/{Path(output_file).name}"
                
                content_type = "application/pdf" if output_format == "pdf" else "application/vnd.openxmlformats-officedocument.presentationml.presentation"
                
                # Using asyncio.run for async method
                asyncio.run(s3_service.upload_file_from_path(
                    str(output_file),
                    output_s3_key,
                    content_type=content_type
                ))
                
                # Update job with output S3 key
                job_repo.set_output_s3_key(job_id, output_s3_key)
                job_repo.update_job_status(job_id, JobStatus.COMPLETED)
                
                logger.info(f"Job {job_id} completed successfully")
                
            finally:
                # Restore working directory
                os.chdir(original_dir)
    
    except Exception as e:
        logger.error(f"Job {job_id} failed: {str(e)}", exc_info=True)
        job_repo.update_job_status(job_id, JobStatus.FAILED, error_message=str(e))
        raise
    
    finally:
        db.close()
