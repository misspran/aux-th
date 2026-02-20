from fastapi import FastAPI, WebSocket, Depends
from services import event_generator
from pydantic import BaseModel
from fastapi_socketio import SocketManager

class TaskResponse(BaseModel):
    id: UUID
    title: str
    description: str
    status: str
    created_at: datetime
    updated_at: datetime


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.user_connections: Dict[str, WebSocket] = {}
        self.online_users: List[str] = []

    async def connect(self, websocket: WebSocket, client_id: str):
        try:
            await websocket.accept()
            self.active_connections.append(websocket)
            self.user_connections[client_id] = websocket
            self.online_users.append(client_id)
            logger.info(f"Client connected: {client_id}")
            await self.broadcast_online_users()
        except Exception as e:
            logger.error(f"Error during connection: {e}")
            await websocket.close()

    def disconnect(self, websocket: WebSocket, client_id: str):
        self.active_connections.remove(websocket)
        if client_id in self.user_connections:
            del self.user_connections[client_id]
        if client_id in self.online_users:
            self.online_users.remove(client_id)
        logger.info(f"Client disconnected: {client_id}")

    async def broadcast_online_users(self):
        message = json.dumps({
            "type": "users_list",
            "users": self.online_users,
            "count": len(self.online_users)
        })
        await self.broadcast(message)

    async def broadcast(self, tasks:TaskResponse[] ):
        try:
            task_data = json.loads(tasks.json())
        except:
            pass  # Not a JSON message or other error
            
        # Send to all connections
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error sending message: {e}")
                disconnected.append(connection)
        
        # Clean up any failed connections
        for conn in disconnected:
            if conn in self.active_connections:
                self.active_connections.remove(conn)

manager = ConnectionManager()


@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str, db: Session = Depends(get_db)):
    await manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_text()
            data_dict = json.loads(data)
            print(f"Received message from {client_id}: {data_dict}")
            db_task = Task(**data_dict)
            db.add(db_task)
            db.commit()
            db.refresh(db_task)
            task_response = TaskResponse.from_orm(db_task)
            await manager.broadcast(task_response)
    except Exception as e:
        await websocket.send_text(f"Error: {e}")
        logger.error(f"Error in websocket endpoint: {e}")
    finally:
        manager.disconnect(websocket, client_id)




@app.get("/")
async def root():
    return {"message": "Hello World"}


def register_routes(app: _fastapi.FastAPI):
    @app.post("/add", response_model=TaskResponse, status_code=201)
    async def add_task(response, db: Session = Depends(get_db)):
        task = Task()
        db.add(task)
        db.flush()
        db.commit()
        db.refresh(task)
        return TaskResponse(id=task.id)