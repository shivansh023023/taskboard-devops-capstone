from typing import List, Optional, Dict
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from backend.app.models.task import Task
from backend.app.schemas.task import TaskCreate, TaskUpdate

def get_tasks(
    db: Session,
    search: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[Task]:
    """Retrieve tasks with optional search, filtering, and pagination."""
    query = db.query(Task)
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Task.title.ilike(search_pattern),
                Task.description.ilike(search_pattern),
                Task.assignee.ilike(search_pattern),
            )
        )
    if status and status.lower() != "all":
        query = query.filter(Task.status == status.lower())
    if priority and priority.lower() != "all":
        query = query.filter(Task.priority == priority.lower())
    
    return query.order_by(Task.created_at.desc()).offset(skip).limit(limit).all()

def get_task_by_id(db: Session, task_id: int) -> Optional[Task]:
    """Retrieve a single task by its primary key ID."""
    return db.query(Task).filter(Task.id == task_id).first()

def create_task(db: Session, task_in: TaskCreate) -> Task:
    """Create and persist a new task."""
    task_data = task_in.model_dump()
    task = Task(**task_data)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

def update_task(db: Session, task: Task, task_in: TaskUpdate) -> Task:
    """Update fields of an existing task."""
    update_data = task_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    return task

def delete_task(db: Session, task: Task) -> None:
    """Delete a task permanently from the database."""
    db.delete(task)
    db.commit()

def get_task_stats(db: Session) -> Dict:
    """Calculate dashboard statistics: total count and breakdowns by status and priority."""
    total = db.query(Task).count()
    todo = db.query(Task).filter(Task.status == "todo").count()
    in_progress = db.query(Task).filter(Task.status == "in_progress").count()
    done = db.query(Task).filter(Task.status == "done").count()

    # Priorities breakdown
    priority_rows = (
        db.query(Task.priority, func.count(Task.id))
        .group_by(Task.priority)
        .all()
    )
    by_priority = {
        "low": 0,
        "medium": 0,
        "high": 0,
        "urgent": 0,
    }
    for prio, count in priority_rows:
        if prio in by_priority:
            by_priority[prio] = count
        else:
            by_priority[str(prio)] = count

    return {
        "total": total,
        "todo": todo,
        "in_progress": in_progress,
        "done": done,
        "by_priority": by_priority,
    }
