from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from ..services.rag_service import generate_rag_response
from .hazards import get_current_user

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

@router.post("/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest, user_data = Depends(get_current_user)):
    message = request.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty or whitespace.")
    
    try:
        reply = generate_rag_response(message)
        return ChatResponse(reply=reply)
    except Exception as e:
        # Handle errors gracefully without exposing stack traces to the client
        raise HTTPException(status_code=500, detail="An internal error occurred while generating the assistant response.")
