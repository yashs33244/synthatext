from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router, public_router
from app.api.auth_routes import router as auth_router, api_router as auth_api_router
from app.core.database import engine, Base
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="PPT Generation API",
    description="Asynchronous PPT generation service with S3 integration",
    version="1.0.0"
)

# CORS middleware
from app.core.config import get_settings
settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,  # Use specific origins from config
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(router)
app.include_router(public_router)
app.include_router(auth_router)
app.include_router(auth_api_router)

# Mount static files for local storage (Dev Mode)
from fastapi.staticfiles import StaticFiles
import os
storage_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "storage")
if not os.path.exists(storage_path):
    os.makedirs(storage_path)
app.mount("/api/v1/storage", StaticFiles(directory=storage_path), name="storage")


@app.on_event("startup")
async def startup_event():
    """Application startup event."""
    logger.info("Starting PPT Generation API...")


@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event."""
    logger.info("Shutting down PPT Generation API...")


if __name__ == "__main__":
    import uvicorn
    from app.core.config import get_settings
    
    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.backend_port,
        reload=True
    )
