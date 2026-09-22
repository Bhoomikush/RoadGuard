from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from ..services.ml_service import predict_image

router = APIRouter(
    prefix="/api/ml",
    tags=["Machine Learning"]
)

@router.post("/detect")
async def detect_hazards(file: UploadFile = File(...)):
    # Check file extension or content type simply
    if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
        raise HTTPException(status_code=400, detail="Invalid image file format. Only PNG, JPG, and JPEG are supported.")

    try:
        contents = await file.read()
        results = predict_image(contents)
        return JSONResponse(content=results)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="An error occurred during inference.")
