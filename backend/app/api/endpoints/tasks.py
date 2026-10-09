from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    TaskStats,
)
from backend.app.services import task_service

router = APIRouter()

@router.get("/stats", response_model=TaskStats, tags=["Tasks"])
def get_task_statistics(db: Session = Depends(get_db)):
    """Retrieve aggregate counts and priority breakdown for the dashboard KPI cards."""
    return task_service.get_task_stats(db)

@router.get("", response_model=List[TaskResponse], tags=["Tasks"])
def list_tasks(
    search: Optional[str] = Query(None, description="Search term for title, description, or assignee"),
    status: Optional[str] = Query(None, description="Filter by status (todo, in_progress, done)"),
    priority: Optional[str] = Query(None, description="Filter by priority (low, medium, high, urgent)"),
    skip: int = Query(0, ge=0, description="Offset for pagination"),
    limit: int = Query(100, ge=1, le=500, description="Limit for pagination"),
    db: Session = Depends(get_db),
):
    """List tasks with optional search query, status/priority filtering, and pagination."""
    return task_service.get_tasks(
        db=db,
        search=search,
        status=status,
        priority=priority,
        skip=skip,
        limit=limit,
    )

@router.get("/{task_id}", response_model=TaskResponse, tags=["Tasks"])
def get_single_task(task_id: int, db: Session = Depends(get_db)):
    """Retrieve a single task by ID or return 404 if not found."""
    task = task_service.get_task_by_id(db, task_id=task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} not found",
        )
    return task

@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED, tags=["Tasks"])
def create_new_task(task_in: TaskCreate, db: Session = Depends(get_db)):
    """Create a new task in the database."""
    return task_service.create_task(db=db, task_in=task_in)

@router.put("/{task_id}", response_model=TaskResponse, tags=["Tasks"])
def update_existing_task(
    task_id: int,
    task_in: TaskUpdate,
    db: Session = Depends(get_db),
):
    """Update fields of an existing task or return 404 if not found."""
    task = task_service.get_task_by_id(db, task_id=task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} not found",
        )
    return task_service.update_task(db=db, task=task, task_in=task_in)

@router.delete("/{task_id}", status_code=status.HTTP_200_OK, tags=["Tasks"])
def delete_existing_task(task_id: int, db: Session = Depends(get_db)):
    """Delete an existing task or return 404 if not found."""
    task = task_service.get_task_by_id(db, task_id=task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} not found",
        )
    task_service.delete_task(db=db, task=task)
    return {"message": "Task deleted successfully", "id": task_id}
