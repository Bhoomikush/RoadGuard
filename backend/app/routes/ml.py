from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from ..services.ml_service import predict_image
from .hazards import get_current_user

router = APIRouter(
    prefix="/api/ml",
    tags=["Machine Learning"]
)

@router.post("/detect")
async def detect_hazards(file: UploadFile = File(...), user_data = Depends(get_current_user)):
    allowed_mime_types = ["image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_mime_types:
        raise HTTPException(status_code=400, detail="Invalid content type. Only JPEG, PNG, and WEBP are supported.")

    MAX_FILE_SIZE = 10 * 1024 * 1024 # 10 MB
    
    try:
        contents = bytearray()
        while chunk := await file.read(1024 * 1024):
            contents.extend(chunk)
            if len(contents) > MAX_FILE_SIZE:
                raise HTTPException(status_code=400, detail="File size exceeds the 10 MB limit.")
        
        results = predict_image(bytes(contents))
        return JSONResponse(content=results)
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="An error occurred during inference.")
