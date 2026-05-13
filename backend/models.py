from sqlalchemy import Column, String, DateTime, func, ForeignKey, Text, Float, JSON, Boolean
from db import Base
from sqlalchemy.orm import relationship
import uuid
from sqlalchemy.dialects.postgresql import UUID


class TimestampMixin:
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class User(Base, TimestampMixin):
    __tablename__ = "users"
    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name          = Column(String, nullable=False)
    email         = Column(String, unique=True, nullable=False, index=True)
    password      = Column(String, nullable=False)
    refresh_token = Column(String, nullable=True)
    sessions      = relationship("SessionAttended", back_populates="attended_by", cascade="all,delete")
    chat_sessions = relationship("ChatSession", back_populates="created_by", cascade="all,delete")
    emotion_logs  = relationship("EmotionLog", back_populates="user", cascade="all,delete")
    summaries     = relationship("SessionSummary", back_populates="user", cascade="all,delete")
    reminders     = relationship("ExerciseReminder", back_populates="user", cascade="all,delete")  # ← added


class SessionAttended(Base, TimestampMixin):
    __tablename__  = "sessions"
    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    classification = Column(String, nullable=False)
    evaluation     = Column(String, nullable=False)
    user_id        = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    attended_by    = relationship("User", back_populates="sessions", cascade="all,delete")


class ChatSession(Base, TimestampMixin):
    __tablename__  = "chat_sessions"
    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id        = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_by     = relationship("User", back_populates="chat_sessions", cascade="all,delete")
    chat_messages  = relationship("Message", back_populates="message_of_session", cascade="all,delete")


class Message(Base, TimestampMixin):
    __tablename__      = "messages"
    id                 = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    role               = Column(String, nullable=False)
    content            = Column(String, nullable=False)
    session_id         = Column(UUID(as_uuid=True), ForeignKey("chat_sessions.id"))
    message_of_session = relationship("ChatSession", back_populates="chat_messages", cascade="all,delete")


class EmotionLog(Base, TimestampMixin):
    __tablename__    = "emotion_logs"
    id               = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id          = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    transcript       = Column(Text, nullable=True)
    voice_emotion    = Column(String, nullable=True)
    voice_confidence = Column(Float, nullable=True)
    face_emotion     = Column(String, nullable=True)
    face_confidence  = Column(Float, nullable=True)
    verdict          = Column(String, nullable=True)
    language         = Column(String, nullable=True)
    therapist_text   = Column(Text, nullable=True)
    user             = relationship("User", back_populates="emotion_logs")


class SessionSummary(Base, TimestampMixin):
    __tablename__       = "session_summaries"
    id                  = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id             = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    dominant_emotions   = Column(JSON, nullable=True)
    topics_discussed    = Column(JSON, nullable=True)
    coping_strategies   = Column(JSON, nullable=True)
    suggested_exercises = Column(JSON, nullable=True)
    summary_text        = Column(Text, nullable=True)
    crisis_detected     = Column(String, nullable=True)
    user                = relationship("User", back_populates="summaries")


class ExerciseReminder(Base):
    __tablename__  = "exercise_reminders"
    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id        = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)
    exercise_id    = Column(String, nullable=False)
    reminder_time  = Column(String, nullable=False)
    enabled        = Column(Boolean, default=True, nullable=False)
    user           = relationship("User", back_populates="reminders")