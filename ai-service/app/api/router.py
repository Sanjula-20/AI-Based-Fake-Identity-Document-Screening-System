from fastapi import APIRouter
from app.api import health, pipeline, eval

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(pipeline.router, tags=["Pipeline"])
api_router.include_router(eval.router, tags=["Evaluation"])
