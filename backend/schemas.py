from pydantic import BaseModel
from uuid import UUID

class ChatRequest(BaseModel):
    message: str
    session_id: UUID

class ChatResponse(BaseModel):
    response: str

class User(BaseModel):
    name: str
    email: str
    password: str


class UserCreate(User):
    pass


class UserLogin(BaseModel):
    email: str
    password: str


class UserLogout(BaseModel):
    email: str


class UserResponse(BaseModel):
    id: UUID
    email: str

    class Config:
        from_attributes = True


class AccessToken(BaseModel):
    access_token: str


class RefreshToken(BaseModel):
    refresh_token: str

class QnAResult(BaseModel):
    user: str
    ai: str

class TherapySessionResponse(BaseModel):
    data: list[QnAResult]
    user_id: UUID

class MessageSchema(BaseModel):
    session_id: UUID
    role: str
    content: str
