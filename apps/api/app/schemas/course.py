from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CourseCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)


class CourseRead(BaseModel):
    id: UUID
    name: str
    model_config = ConfigDict(from_attributes=True)
