import fastapi as _fastapi
from pydantic import BaseModel
import sqlalchemy.orm as _orm
import uvicorn
from fastapi.responses import StreamingResponse
from services import event_generator

app = FastAPI(
    title="Real-time Task Management API",
    description="Real-time task-management application using FastAPI WebSockets",
    version="1.0.0"
    )

@app.get("/")
def read_root():
    # Example of accessing environment variable set in docker-compose.yml
    db_url = os.getenv("DATABASE_URL")
    return {"message": "Hello, backend task app!", "database_url": db_url}


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=5000, log_level="info", reload=True)