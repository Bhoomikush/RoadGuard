from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import config
from .routes import hazards, ml, chat
from .services import ml_service

app = FastAPI(title="RoadGuard AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5174",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(hazards.router)
app.include_router(ml.router)
app.include_router(chat.router, prefix="/api", tags=["chat"])

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "RoadGuard AI API",
        "ml_model_loaded": ml_service.model is not None
    }
