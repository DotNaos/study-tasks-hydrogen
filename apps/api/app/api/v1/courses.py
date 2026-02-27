from fastapi import APIRouter
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.models.course import Course
from app.schemas.course import CourseCreate, CourseRead

router = APIRouter()


@router.get("", response_model=list[CourseRead])
def list_courses(db: DbSession, current_user: CurrentUser):
    stmt = select(Course).where(Course.owner_id == current_user.user_id).order_by(Course.name.asc())
    return db.execute(stmt).scalars().all()


@router.post("", response_model=CourseRead)
def create_course(payload: CourseCreate, db: DbSession, current_user: CurrentUser):
    course = Course(owner_id=current_user.user_id, name=payload.name.strip())
    db.add(course)
    db.commit()
    db.refresh(course)
    return course
