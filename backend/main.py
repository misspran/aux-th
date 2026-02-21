import os
import logging
import sys

import fastapi as _fastapi
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from services import run_migrations

logging.basicConfig(level=logging.INFO, stream=sys.stdout)
logger = logging.getLogger(__name__)

app = _fastapi.FastAPI(
    title="Real-time Task Management API",
    description="Real-time task-management application using FastAPI WebSockets",
    version="1.0.0"
)


@app.on_event("startup")
def on_startup():
    run_migrations()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    db_url = os.getenv("DATABASE_URL")
    return {"message": "Hello, backend task app!", "database_url": db_url}


from api import router as api_router
app.include_router(api_router)


if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG, stream=sys.stdout)
    uvicorn.run("main:app", host="127.0.0.1", port=8000, log_level="info", reload=True, DEBUG=True)