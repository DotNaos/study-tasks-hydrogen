from fastapi import APIRouter

from app.api.v1.courses import router as courses_router
from app.api.v1.tasks import router as tasks_router

api_router = APIRouter()
api_router.include_router(courses_router, prefix="/courses", tags=["courses"])
api_router.include_router(tasks_router, tags=["tasks"])
