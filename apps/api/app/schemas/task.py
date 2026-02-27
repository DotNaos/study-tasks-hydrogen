from datetime import date
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.task import TaskSection


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    section: TaskSection
    due_date: date | None = None

    @model_validator(mode="after")
    def validate_due_date_for_section(self):
        if self.section == TaskSection.HOMEWORK and self.due_date is not None:
            raise ValueError("due_date is only allowed for submission tasks")
        return self


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    done: bool | None = None
    due_date: date | None = None


class TaskRead(BaseModel):
    id: UUID
    course_id: UUID
    title: str
    section: TaskSection
    due_date: date | None
    done: bool

    model_config = ConfigDict(from_attributes=True)
