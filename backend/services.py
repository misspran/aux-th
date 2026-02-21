"""
Migration and DB bootstrap. Ensures all tables exist before the app serves requests.
"""
import logging

import database as _db
import models as _models  # noqa: F401 - register tables with Base.metadata

logger = logging.getLogger(__name__)


def run_migrations():
    """Create all tables defined on Base.metadata if they do not exist (idempotent)."""
    try:
        _db.Base.metadata.create_all(bind=_db.engine)
        logger.info("Migrations completed: tables created or already exist.")
    except Exception as e:
        logger.exception("Migrations failed: %s", e)
        raise


def get_db():
    db = _db.SessionLocal()
    try:
        yield db
    finally:
        db.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_migrations()
