from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routes import (parents, athletes, sessions, invites, message_templates, message_logs, tags,)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="A.I. Training Academy Ops API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(parents.router)
app.include_router(athletes.router)
app.include_router(sessions.router)
app.include_router(invites.router)
app.include_router(message_templates.router)
app.include_router(message_logs.router)
app.include_router(tags.router)


@app.get("/")
def root():
    return {"message": "A.I. Training Academy Ops API is running"}