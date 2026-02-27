from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.models.course import Course
from app.models.task import Task, TaskSection
from app.schemas.task import TaskCreate, TaskRead, TaskUpdate

router = APIRouter()


def _get_owned_course_or_404(db: DbSession, course_id: UUID, owner_id: str) -> Course:
    course = db.get(Course, course_id)
    if not course or course.owner_id != owner_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return course


@router.get("/courses/{course_id}/tasks", response_model=list[TaskRead])
def list_course_tasks(course_id: UUID, db: DbSession, current_user: CurrentUser):
    _get_owned_course_or_404(db, course_id, current_user.user_id)
    stmt = select(Task).where(Task.course_id == course_id).order_by(Task.section.asc(), Task.done.asc(), Task.id.asc())
    return db.execute(stmt).scalars().all()


@router.post("/courses/{course_id}/tasks", response_model=TaskRead)
def create_task(course_id: UUID, payload: TaskCreate, db: DbSession, current_user: CurrentUser):
    _get_owned_course_or_404(db, course_id, current_user.user_id)
    task = Task(
        course_id=course_id,
        title=payload.title.strip(),
        section=payload.section,
        due_date=payload.due_date,
        done=False,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.patch("/tasks/{task_id}", response_model=TaskRead)
def update_task(task_id: UUID, payload: TaskUpdate, db: DbSession, current_user: CurrentUser):
    stmt = (
        select(Task)
        .join(Course, Course.id == Task.course_id)
        .where(Task.id == task_id, Course.owner_id == current_user.user_id)
    )
    task = db.execute(stmt).scalars().first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if payload.title is not None:
        task.title = payload.title.strip()
    if payload.done is not None:
        task.done = payload.done
    due_date_provided = "due_date" in payload.model_fields_set
    if task.section == TaskSection.HOMEWORK and due_date_provided and payload.due_date is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="due_date is only allowed for submission tasks")
    if task.section == TaskSection.SUBMISSION and due_date_provided:
        task.due_date = payload.due_date

    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: UUID, db: DbSession, current_user: CurrentUser):
    stmt = (
        select(Task)
        .join(Course, Course.id == Task.course_id)
        .where(Task.id == task_id, Course.owner_id == current_user.user_id)
    )
    task = db.execute(stmt).scalars().first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    db.delete(task)
    db.commit()
