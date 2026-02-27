"""init schema

Revision ID: 20260226_0001
Revises:
Create Date: 2026-02-26 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260226_0001"
down_revision = None
branch_labels = None
depends_on = None


task_section = sa.Enum("homework", "submission", name="task_section")


def upgrade() -> None:
    task_section.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "courses",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("owner_id", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_courses_owner_id"), "courses", ["owner_id"], unique=False)

    op.create_table(
        "tasks",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("course_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("section", task_section, nullable=False),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("done", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_tasks_course_id"), "tasks", ["course_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_tasks_course_id"), table_name="tasks")
    op.drop_table("tasks")
    op.drop_index(op.f("ix_courses_owner_id"), table_name="courses")
    op.drop_table("courses")
    task_section.drop(op.get_bind(), checkfirst=True)
