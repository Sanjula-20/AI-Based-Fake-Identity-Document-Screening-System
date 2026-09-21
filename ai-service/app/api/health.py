from fastapi import APIRouter
import sys
import platform

router = APIRouter()

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "AI Document Screening Engine",
        "pythonVersion": sys.version,
        "platform": platform.platform(),
        "modules": {
            "torch": "available",
            "opencv": "available",
            "paddleocr": "available"
        }
    }
