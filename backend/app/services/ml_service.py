import os
from io import BytesIO
from PIL import Image
from ultralytics import YOLO
from dotenv import load_dotenv

load_dotenv()

# Model path resolution:
# 1. Environment variable MODEL_PATH (recommended for production/containers/Render disk)
# 2. Local repository default: <repo_root>/ml/models/best.pt
# 3. Fallback backend-relative default: <backend_dir>/models/best.pt
# NOTE: In production (e.g., Render), best.pt is not tracked in Git. The host must supply
# the model file either via a build script download, persistent disk, or MODEL_PATH env var.
MODEL_PATH = os.environ.get("MODEL_PATH")

if not MODEL_PATH:
    # 4 levels up: backend/app/services -> backend/app -> backend -> RoadGuard repo root
    REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    default_repo_path = os.path.join(REPO_ROOT, "ml", "models", "best.pt")

    # 3 levels up: backend/app/services -> backend/app -> backend dir
    BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    backend_local_path = os.path.join(BACKEND_DIR, "models", "best.pt")

    if os.path.exists(default_repo_path):
        MODEL_PATH = default_repo_path
    elif os.path.exists(backend_local_path):
        MODEL_PATH = backend_local_path
    else:
        MODEL_PATH = default_repo_path

# Load the model only once upon module initialization
try:
    if os.path.exists(MODEL_PATH):
        model = YOLO(MODEL_PATH)
        print(f"Successfully loaded YOLOv8 model from {MODEL_PATH}")
    else:
        model = None
        print(f"Warning: YOLOv8 model not found at {MODEL_PATH}. Production must supply this file.")
except Exception as e:
    model = None
    print(f"Error loading YOLOv8 model: {e}")


def predict_image(image_bytes: bytes):
    """
    Runs YOLOv8 inference on the given image bytes and returns the detection results.
    """
    if model is None:
        raise ValueError("Model is not loaded.")

    try:
        # Load image from bytes
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        raise ValueError("Invalid image file.")

    # Run inference
    results = model(image, imgsz=640, conf=0.25)
    
    detections = []
    
    # Process results
    for r in results:
        boxes = r.boxes
        for box in boxes:
            # box.xyxy[0] returns [x1, y1, x2, y2]
            coords = box.xyxy[0].tolist()
            confidence = float(box.conf[0])
            class_id = int(box.cls[0])
            class_name = model.names[class_id]
            
            # We only care about crack and pothole, but the model is trained for those.
            if class_name.lower() in ["crack", "pothole"]:
                detections.append({
                    "class_name": class_name.lower(),
                    "confidence": round(confidence, 4),
                    "bbox": [round(c, 2) for c in coords]
                })

    overall_severity = "low"
    if detections:
        max_conf = max(d["confidence"] for d in detections)
        # Normalize in case confidence is > 1 for some reason, exactly like frontend logic
        normalized_conf = max_conf / 100 if max_conf > 1 else max_conf
        
        if normalized_conf >= 0.75:
            overall_severity = "high"
        elif normalized_conf >= 0.50:
            overall_severity = "medium"

    return {
        "detected_objects": detections,
        "total_detections": len(detections),
        "overall_severity": overall_severity
    }
