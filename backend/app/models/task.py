from sqlalchemy import Column, Integer, String, Text, DateTime, func
from backend.app.db.base import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    status = Column(String(30), nullable=False, default="todo", index=True)
    priority = Column(String(30), nullable=False, default="medium", index=True)
    assignee = Column(String(100), nullable=True, default="Unassigned")
    due_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self) -> str:
        return f"<Task id={self.id} title='{self.title}' status='{self.status}'>"
