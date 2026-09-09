from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import config

app = FastAPI(title="RoadGuard AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "RoadGuard AI API"
    }
