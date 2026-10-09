from enum import Enum
from typing import Optional, Dict
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"

class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="Task title cannot be empty")
    description: Optional[str] = Field(None, max_length=2000, description="Detailed task description")
    status: TaskStatus = Field(default=TaskStatus.TODO, description="Current workflow status")
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM, description="Task priority level")
    assignee: Optional[str] = Field(default="Unassigned", max_length=100, description="Assigned team member")
    due_date: Optional[datetime] = Field(None, description="Due date and time in UTC/ISO format")

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    assignee: Optional[str] = Field(None, max_length=100)
    due_date: Optional[datetime] = None

class TaskResponse(TaskBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TaskStats(BaseModel):
    total: int
    todo: int
    in_progress: int
    done: int
    by_priority: Dict[str, int]
