import sqlalchemy as _sql
import database as _db

class Task(_db.Base):
    __tablename__ = 'tasks'

    id = _sql.Column(_sql.Integer, primary_key=True, index=True)
    title = _sql.Column(_sql.String, index=True)
    description = _sql.Column(_sql.String, index=True)
    status = _sql.Column(_sql.String, default=None)
    created_at = _sql.Column(_sql.DateTime, default=_sql.func.now())
    updated_at = _sql.Column(_sql.DateTime, default=_sql.func.now(), onupdate=_sql.func.now())

class User(_db.Base):
    __tablename__ = 'users'

    id = _sql.Column(_sql.Integer, primary_key=True, index=True)
    username = _sql.Column(_sql.String, unique=True, index=True)


