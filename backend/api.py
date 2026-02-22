import json
import logging
from typing import List, Dict, Any
from datetime import datetime

from fastapi import WebSocket, Depends, APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import SessionLocal
from models import Task, User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["api"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def task_to_dict(task: Task) -> Dict[str, Any]:
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "created_at": task.created_at.isoformat() if task.created_at else None,
        "updated_at": task.updated_at.isoformat() if task.updated_at else None,
    }

class LoginRequest(BaseModel):
    username: str

class UserResponse(BaseModel):
    id: int
    username: str

class TaskResponse(BaseModel):
    id: int
    title: str | None
    description: str | None
    status: str | None
    created_at: datetime | None
    updated_at: datetime | None


# WebSocket connection manager to handle active connections and broadcasting messages to connected clients.
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.user_connections: Dict[str, WebSocket] = {}
        self.online_users: List[str] = []

    async def connect(self, websocket: WebSocket, username: str):
        try:
            await websocket.accept()
            self.active_connections.append(websocket)
            self.user_connections[username] = websocket
            self.online_users.append(username)
            logger.info("User connected: %s", username)
            await self.broadcast_online_users()
        except Exception as e:
            logger.error("Error during connection: %s", e)
            await websocket.close()

    def disconnect(self, websocket: WebSocket, username: str):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if username in self.user_connections:
            del self.user_connections[username]
        if username in self.online_users:
            self.online_users.remove(username)
        logger.info("User disconnected: %s", username)

    async def broadcast_online_users(self):
        users = json.dumps({
            "type": "users_list",
            "users": self.online_users,
            "count": len(self.online_users)
        })
        await self.broadcast_items(users)

    async def broadcast_tasks(self, tasks_list: List[Dict[str, Any]]):
        try:
            tasks = json.dumps({
                "type": "tasks_list",
                "tasks": tasks_list,
                "count": len(tasks_list)
            })
            await self.broadcast_items(tasks)
        except Exception as e:
            logger.error("Error broadcasting tasks: %s", e)

    async def broadcast_items(self, message: str):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error("Error sending items: %s", e)
                disconnected.append(connection)
        for conn in disconnected:
            if conn in self.active_connections:
                self.active_connections.remove(conn)


manager = ConnectionManager()


# handle socket connections for real-time updates, create, delete on tasks 
@router.websocket("/ws/{username}")
async def websocket_endpoint(
    websocket: WebSocket,
    username: str,
    db: Session = Depends(get_db)
):
    try:
        await manager.connect(websocket, username)

        await websocket.send_text("Welcome to the task board, %s!" % username)

        while True:
            data = await websocket.receive_text()
            data_dict = json.loads(data)
            msg_type = data_dict.get("type")
           
            user = db.query(User).filter(User.username == username).one_or_none()

            if msg_type == "add_task":
                try:
                    user = db.query(User).filter(User.username == username).one_or_none()
                    title = data_dict.get("title") or ""
                    description = data_dict.get("description") or ""
                    status = data_dict.get("status") or "todo"
                    task = Task(title=title, description=description, status=status)
                    db.add(task)
                    db.commit()
                    db.refresh(task)
                    payload = json.dumps({
                        "type": "task_created",
                        "task": task_to_dict(task),
                    })
                    await manager.broadcast_items(payload)
                except Exception as e:
                    logger.error("Error in websocket endpoint: %s", e)
            if msg_type == "edit_task":
                try:
                    task_id = data_dict.get("id")
                    task = db.query(Task).filter(Task.id == task_id).one_or_none()
                    if not task:
                        logger.error("Task not found for editing: %s", task_id)
                    else:
                        title = data_dict.get("title") or ""
                        description = data_dict.get("description") or ""
                        status = data_dict.get("status") or "todo"
                        task.title = title
                        task.description = description
                        task.status = status
                        task.updated_by = user
                        task.updated_at = datetime.utcnow()
                        db.add(task)
                        db.commit()
                        db.refresh(task)
                        payload = json.dumps({
                            "type": "task_updated",
                            "task": task_to_dict(task),
                        })
                        await manager.broadcast_items(payload)
                except Exception as e:
                    logger.error("Error in websocket endpoint: %s", e)
            logger.info(f"Received message of type: {msg_type} from user: {username}")
            if msg_type == "remove_task":
                try:
                    task_id = data_dict.get("id")
                    task = db.query(Task).filter(Task.id == task_id).one_or_none()
                    if not task:
                        logger.error("Task not found for editing: %s", task_id)
                    else:
                        task_to_delete = db.query(Task).get(task_id)
                        db.delete(task_to_delete)
                        db.commit()
                        payload = json.dumps({
                            "type": "task_removed",
                            "task_id": task_id,
                        })
                        await manager.broadcast_items(payload)
                except Exception as e:
                    logger.error("Error in websocket endpoint: %s", e)
            else:
                await manager.broadcast_online_users()
    except Exception as e:
        logger.error("Error in websocket endpoint: %s", e)
    finally:
        manager.disconnect(websocket, username)

# REST API endpoints for login, creates new user if username does not exist, returns user info
@router.post("/login", response_model=UserResponse)
async def login(body: LoginRequest, db: Session = Depends(get_db)):
    """Create a new user or return existing user by username."""
    try:
        user = db.query(User).filter(User.username == body.username).first()
        if not user:
            user = User(username=body.username)
            db.add(user)
            db.commit()
            db.refresh(user)
        return UserResponse(id=user.id, username=user.username)
    except Exception as e:
        logger.error("Error in login endpoint: %s", e)
        return JSONResponse(content={"error": str(e)}, status_code=500)


# REST API endpoints for tasks
@router.get("/tasks", response_model=List[TaskResponse])
async def get_tasks(db: Session = Depends(get_db)):
    """Return all tasks from the database."""
    try:
        tasks = db.query(Task).order_by(Task.id).all()
        return [TaskResponse(**task_to_dict(t)) for t in tasks]
    except Exception as e:
        logger.error("Error fetching tasks: %s", e)
        return JSONResponse(content={"error": str(e)}, status_code=500)

@router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(task_id: int, db: Session = Depends(get_db)):
    """Return a specific task by ID."""
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return JSONResponse(content={"error": "Task not found"}, status_code=404)
        return TaskResponse(**task_to_dict(task))
    except Exception as e:
        logger.error("Error fetching tasks: %s", e)
        return JSONResponse(content={"error": str(e)}, status_code=500)

@router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(task_id: int, db: Session = Depends(get_db)):
    """Return a specific task by ID."""
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return JSONResponse(content={"error": "Task not found"}, status_code=404)
        return TaskResponse(**task_to_dict(task))
    except Exception as e:
        logger.error("Error fetching tasks: %s", e)
        return JSONResponse(content={"error": str(e)}, status_code=500)

@router.post("/tasks", response_model=TaskResponse)
async def create_task(task: TaskResponse, db: Session = Depends(get_db)):
    """Create a new task in the database."""
    try:
        db_task = Task(
            title=task.title,
            description=task.description,
            status=task.status,
        )
        db.add(db_task)
        db.commit()
        db.refresh(db_task)
        return TaskResponse(**task_to_dict(db_task))
    except Exception as e:
        logger.error("Error creating task: %s", e)
        return JSONResponse(content={"error": str(e)}, status_code=500)

@router.patch("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(task_id: int, task: TaskResponse, db: Session = Depends(get_db)):
    """Update an existing task in the database."""
    try:
        db_task = db.query(Task).filter(Task.id == task_id).first()
        if not db_task:
            return JSONResponse(content={"error": "Task not found"}, status_code=404)
        db_task.title = task.title or db_task.title
        db_task.description = task.description or db_task.description
        db_task.status = task.status or db_task.status
        db.commit()
        db.refresh(db_task)
        return TaskResponse(**task_to_dict(db_task))
    except Exception as e:
        logger.error("Error updating task: %s", e)
        return JSONResponse(content={"error": str(e)}, status_code=500)

@router.delete("/tasks/{task_id}")
async def delete_task(task_id: int, db: Session = Depends(get_db)):
    """Delete a task from the database."""
    try:
        db_task = db.query(Task).filter(Task.id == task_id).first()
        if not db_task:
            return JSONResponse(content={"error": "Task not found"}, status_code=404)
        db.delete(db_task)
        db.commit()
        return JSONResponse(content={"message": "Task deleted successfully"}, status_code=200)
    except Exception as e:
        logger.error("Error deleting task: %s", e)
        return JSONResponse(content={"error": str(e)}, status_code=500)

