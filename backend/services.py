import database as _db
import models as _models
import asyncio
import json


async def event_generator():
    counter = 0
    while True:
        data = {"message": f"Ping {counter}"}
        yield f"data: {json.dumps(data)}\n\n"
        counter += 1
        await asyncio.sleep(1)

def _add_tables():
    return _db.Base.metadata.create_all(bind=_db.engine)


def get_db():
    db = _db.SessionLocal()
    try:
        yield db
    finally:
        db.close()