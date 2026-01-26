"""Celery tasks for HTML generation and PPT/PDF conversion."""
from app.celery_app import celery_app
from app.core.database import SessionLocal
from app.repositories.job_repository import JobRepository
from app.repositories.slide_repository import SlideRepository
from app.services.s3_service import S3Service
from app.services.ppt_service import PPTService
from app.models.job import JobStatus
import os
import sys
import tempfile
import logging
from pathlib import Path
import asyncio
import json

# Add backend root to path (where generate_ppt.py is now located)
current_file = Path(__file__).resolve()
backend_root = current_file.parent.parent.parent
sys.path.insert(0, str(backend_root))

from generate_ppt import convert_to_pdf, convert_to_pptx

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name='app.tasks.conversion_tasks.generate_html_and_convert')
def generate_html_and_convert_task(self, job_id: str):
    """
    Complete PPT generation: HTML slides + conversion to PPT/PDF.
    This runs the entire pipeline asynchronously.
    
    Args:
        job_id: ID of the PPT generation job
    """
    db = SessionLocal()
    job_repo = JobRepository(db)
    slide_repo = SlideRepository(db)
    s3_service = S3Service()
    
    try:
        job = job_repo.get_job(job_id)
        if not job:
            logger.error(f"Job not found: {job_id}")
            return
        
        # Parse config
        config = json.loads(job.config_json)
        output_format = config.get("output_format", "pdf")
        
        # Step 1: Generate HTML slides
        logger.info(f"Starting HTML generation for job {job_id}")
        ppt_service = PPTService(s3_service, job_repo, slide_repo)
        
        html_folder_s3_key, total_slides = asyncio.run(
            ppt_service.generate_html_slides(
                job_id,
                job.input_s3_key,
                config
            )
        )
        
        logger.info(f"HTML generation complete for job {job_id}, starting conversion...")
        
        # Step 2: Convert HTML to PPT/PDF
        convert_html_to_ppt_task(job_id, html_folder_s3_key, output_format)
        
    except Exception as e:
        logger.error(f"Job {job_id} failed during HTML generation: {str(e)}", exc_info=True)
        job_repo.update_job_status(job_id, JobStatus.FAILED, error_message=str(e))
        raise
    finally:
        db.close()


@celery_app.task(bind=True, name='app.tasks.conversion_tasks.convert_html_to_ppt')
def convert_html_to_ppt_task(self, job_id: str, html_folder_s3_key: str, output_format: str):
    """
    Celery task to convert HTML slides to PPT/PDF.
    This is the only memory-heavy operation that needs queuing.
    
    Args:
        job_id: ID of the PPT generation job
        html_folder_s3_key: S3 key prefix for HTML files folder
        output_format: Output format (pdf or pptx)
    """
    db = SessionLocal()
    job_repo = JobRepository(db)
    s3_service = S3Service()
    
    try:
        job = job_repo.get_job(job_id)
        if not job:
            logger.error(f"Job not found: {job_id}")
            return
        
        # Check if job was cancelled
        if job.status == JobStatus.FAILED and job.error_message == "Cancelled by user":
            logger.info(f"Job {job_id} was cancelled, skipping conversion")
            return
        
        logger.info(f"Starting HTML to {output_format.upper()} conversion for job {job_id}")
        
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            html_path = temp_path / "htmls"
            output_path = temp_path / "output"
            html_path.mkdir(exist_ok=True)
            output_path.mkdir(exist_ok=True)
            
            # Download all HTML files from S3
            logger.info(f"Downloading HTML files from {html_folder_s3_key}")
            await_download = asyncio.run(
                s3_service.download_file(f"{html_folder_s3_key}/slide_1.html", str(html_path / "slide_1.html"))
            )
            
            # Download all slides (assuming sequential numbering)
            slide_num = 1
            while True:
                try:
                    slide_file = f"slide_{slide_num}.html"
                    s3_key = f"{html_folder_s3_key}/{slide_file}"
                    local_file = html_path / slide_file
                    
                    if not s3_service.file_exists(s3_key):
                        break
                    
                    asyncio.run(s3_service.download_file(s3_key, str(local_file)))
                    logger.info(f"Downloaded {slide_file}")
                    slide_num += 1
                except Exception as e:
                    logger.warning(f"Stopped downloading at slide {slide_num}: {e}")
                    break
            
            # Prepare config for conversion
            ppt_config = {
                "output": {
                    "format": output_format,
                    "file_name": f"presentation_{job_id}",
                    "folder": str(output_path)
                },
                "slides": {
                    "width": 1280,
                    "height": 720
                }
            }
            
            # Convert HTML to output format
            logger.info(f"Converting HTMLs to {output_format.upper()}...")
            original_dir = os.getcwd()
            os.chdir(temp_path)
            
            try:
                if output_format == "pdf":
                    output_file = convert_to_pdf(html_path, ppt_config)
                else:
                    output_file = convert_to_pptx(html_path, ppt_config)
                
                if not output_file or not Path(output_file).exists():
                    raise Exception("Failed to generate output file")
                
                # Upload output file to S3
                logger.info("Uploading output file to S3...")
                output_s3_key = f"ppt-yash-proj/outputs/{job_id}/{Path(output_file).name}"
                
                content_type = "application/pdf" if output_format == "pdf" else \
                    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
                
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
                os.chdir(original_dir)
    
    except Exception as e:
        logger.error(f"Job {job_id} conversion failed: {str(e)}", exc_info=True)
        job_repo.update_job_status(job_id, JobStatus.FAILED, error_message=str(e))
        raise
    
    finally:
        db.close()


@celery_app.task(bind=True, name='app.tasks.conversion_tasks.regenerate_slides')
def regenerate_slides_task(self, job_id: str, slide_numbers: list, instructions: str):
    """
    Regenerate specific slides with custom instructions.
    
    Args:
        job_id: ID of the job
        slide_numbers: List of slide numbers to regenerate
        instructions: Custom instructions for regeneration
    """
    db = SessionLocal()
    job_repo = JobRepository(db)
    slide_repo = SlideRepository(db)
    s3_service = S3Service()
    
    try:
        job = job_repo.get_job(job_id)
        if not job:
            logger.error(f"Job not found: {job_id}")
            return
        
        # Parse original config
        config = json.loads(job.config_json)
        
        # Add custom instructions to the config
        current_prompt = config.get("additional_prompt", "")
        config["additional_prompt"] = f"{current_prompt}\n\nADDITIONAL MODIFICATIONS: {instructions}"
        
        logger.info(f"Regenerating slides {slide_numbers} for job {job_id}")
        
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            input_path = temp_path / "input"
            output_path = temp_path / "output"
            input_path.mkdir(exist_ok=True)
            output_path.mkdir(exist_ok=True)
            
            # Download input file
            file_ext = Path(job.input_s3_key).suffix
            input_file = input_path / f"input_file{file_ext}"
            asyncio.run(s3_service.download_file(job.input_s3_key, str(input_file)))
            
            # Prepare config for PPT service
            ppt_service = PPTService(s3_service, job_repo, slide_repo)
            ppt_config = ppt_service._prepare_ppt_config(
                job_id, config, input_file, output_path
            )
            
            # Change to temp directory
            original_dir = os.getcwd()
            os.chdir(temp_path)
            
            try:
                import generate_ppt
                old_script_dir = generate_ppt.SCRIPT_DIR
                generate_ppt.SCRIPT_DIR = temp_path
                
                # Load content
                from generate_ppt import (
                    load_source_content,
                    distribute_content_to_slides,
                    generate_content_slide_html,
                    save_html_slide,
                    get_instructions
                )
                
                instructions_text = get_instructions()
                pages = load_source_content(ppt_config)
                num_slides = ppt_config["slides"]["number_of_slides"]
                slides_content = distribute_content_to_slides(pages, num_slides)
                
                # Regenerate only specified slides
                html_folder_s3_key = f"ppt-yash-proj/htmls/{job_id}"
                
                for slide_num in slide_numbers:
                    # Adjust for title slide (slide 1)
                    content_index = slide_num - 2  # -1 for 0-based, -1 for title slide
                    
                    if content_index < 0 or content_index >= len(slides_content):
                        logger.warning(f"Slide number {slide_num} out of range, skipping")
                        continue
                    
                    logger.info(f"Regenerating slide {slide_num}...")
                    
                    total_slides = len(slides_content) + 2
                    slide_content = slides_content[content_index]
                    
                    html = generate_content_slide_html(
                        slide_content,
                        slide_num,
                        total_slides,
                        ppt_config,
                        instructions_text
                    )
                    
                    # Save locally
                    save_html_slide(html, slide_num, output_path)
                    
                    # Upload to S3 (overwrite existing)
                    html_file = output_path / f"slide_{slide_num}.html"
                    s3_key = f"{html_folder_s3_key}/slide_{slide_num}.html"
                    asyncio.run(s3_service.upload_file_from_path(
                        str(html_file),
                        s3_key,
                        content_type="text/html"
                    ))
                    logger.info(f"Uploaded regenerated slide {slide_num} to S3")
                
                generate_ppt.SCRIPT_DIR = old_script_dir
                logger.info(f"Successfully regenerated {len(slide_numbers)} slides for job {job_id}")
                
            finally:
                os.chdir(original_dir)
    
    except Exception as e:
        logger.error(f"Slide regeneration failed for job {job_id}: {str(e)}", exc_info=True)
        raise
    
    finally:
        db.close()
