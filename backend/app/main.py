import os
from dotenv import load_dotenv

# Ensure environment variables are loaded
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env")
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import config
from .routes import hazards, ml, chat, complaints
from .services import ml_service

app = FastAPI(title="RoadGuard AI API")

# Configure CORS: allow origins from ALLOWED_ORIGINS env var + local dev origins
raw_origins = os.environ.get("ALLOWED_ORIGINS", "")
env_origins = [origin.strip().rstrip("/") for origin in raw_origins.split(",") if origin.strip()]
default_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]
allowed_origins = list(dict.fromkeys(default_origins + env_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(hazards.router)
app.include_router(ml.router)
app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(complaints.router)

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "RoadGuard AI API",
        "ml_model_loaded": ml_service.model is not None
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
