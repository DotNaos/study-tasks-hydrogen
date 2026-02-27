import enum
import uuid
from datetime import date

from sqlalchemy import Boolean, Date, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class TaskSection(str, enum.Enum):
    HOMEWORK = "homework"
    SUBMISSION = "submission"


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    section: Mapped[TaskSection] = mapped_column(Enum(TaskSection, name="task_section", native_enum=True), nullable=False)
    due_date: Mapped[date | None] = mapped_column(Date(), nullable=True)
    done: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    course = relationship("Course", back_populates="tasks")
