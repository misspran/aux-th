from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from services import event_generator
from pydantic import BaseModel

class TaskResponse(BaseModel):
    id: UUID


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
        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream"
        )