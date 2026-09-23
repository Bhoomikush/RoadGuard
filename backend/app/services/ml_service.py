import os
from io import BytesIO
from PIL import Image
from ultralytics import YOLO

# Absolute path based on the project structure
MODEL_PATH = r"D:\RoadGuard\ml\models\best.pt"

# Load the model only once upon module initialization
try:
    if os.path.exists(MODEL_PATH):
        model = YOLO(MODEL_PATH)
        print(f"Successfully loaded YOLOv8 model from {MODEL_PATH}")
    else:
        model = None
        print(f"Warning: YOLOv8 model not found at {MODEL_PATH}")
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
    results = model(image)
    
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
