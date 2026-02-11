from sqlalchemy import (
    Column,
    String,
    DateTime,
    func,
    ForeignKey
)
from db import Base
from sqlalchemy.orm import relationship
import uuid
from sqlalchemy.dialects.postgresql import UUID

class TimestampMixin:
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password = Column(String, nullable=False)
    refresh_token = Column(String, nullable=True)

    sessions = relationship("SessionAttended", back_populates="attended_by", cascade="all,delete")
    chat_sessions = relationship("ChatSession", back_populates="created_by", cascade="all,delete")



class SessionAttended(Base, TimestampMixin):
    __tablename__ = "sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    classification = Column(String, nullable=False)
    evaluation = Column(String, nullable=False)

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))

    attended_by = relationship("User", back_populates="sessions", cascade="all,delete")

class ChatSession(Base, TimestampMixin):
    __tablename__ = "chat_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    created_by = relationship("User", back_populates="chat_sessions", cascade="all,delete")
    chat_messages = relationship("Message", back_populates="message_of_session", cascade="all,delete")

class Message(Base, TimestampMixin):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    role = Column(String, nullable=False)
    content = Column(String, nullable=False)
    session_id = Column(UUID(as_uuid=True), ForeignKey("chat_sessions.id"))

    message_of_session = relationship("ChatSession", back_populates="chat_messages", cascade="all,delete")