import logging

import uvicorn

from app.core.config import get_settings
from app.main import app


if __name__ == "__main__":
    # Keep runtime logging consistent when launching via python main.py
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    settings = get_settings()
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.backend_port,
        reload=True,
    )

