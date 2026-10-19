import os
import sys
import tempfile
import threading
import logging
from io import BytesIO
from typing import Optional, Dict, Any
from PIL import Image
from dotenv import load_dotenv

# Ensure environment variables are loaded
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".env")
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    load_dotenv()

logger = logging.getLogger("roadguard.ml_service")
if not logger.handlers:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter("[%(levelname)s] %(asctime)s - %(name)s - %(message)s"))
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

# Configuration constants
SUPABASE_MODEL_BUCKET = os.environ.get("SUPABASE_MODEL_BUCKET", "roadguard-models")
SUPABASE_MODEL_PATH = os.environ.get("SUPABASE_MODEL_PATH", "best.pt")

# Directory references
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
REPO_ROOT = os.path.dirname(BACKEND_DIR)


def get_model_target_path() -> str:
    """
    Resolves the target local filesystem path for the YOLO model.
    Resolution order:
    1. Explicit MODEL_PATH environment variable (for Render persistent disk or custom host location)
    2. Local development repository model: <repo_root>/ml/models/best.pt
    3. Local fallback model: <backend_dir>/models/best.pt
    4. Safe ephemeral fallback path on production hosts (e.g. /tmp/roadguard/best.pt)
    """
    explicit_path = os.environ.get("MODEL_PATH")
    if explicit_path:
        return os.path.abspath(explicit_path)

    # Local development: use existing file directly if available (zero download, zero duplicate files)
    repo_model = os.path.join(REPO_ROOT, "ml", "models", "best.pt")
    if os.path.exists(repo_model):
        return repo_model

    backend_model = os.path.join(BACKEND_DIR, "models", "best.pt")
    if os.path.exists(backend_model):
        return backend_model

    # Ephemeral fallback for cloud deployments (e.g. Render standard/free containers)
    temp_dir = tempfile.gettempdir()
    return os.path.join(temp_dir, "roadguard", "best.pt")


def download_model_from_supabase(target_path: str) -> bool:
    """
    Downloads the YOLO model from a private Supabase Storage bucket.
    Uses backend-only credentials (SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY).
    Never logs or exposes secret credentials.
    Writes to a temporary file first and renames atomically to prevent corrupted files.
    """
    supabase_url = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
    # For private buckets, SUPABASE_SERVICE_ROLE_KEY is required to bypass RLS securely
    supabase_key = (
        os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        or os.environ.get("SUPABASE_KEY")
        or os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY")
    )

    if not supabase_url or not supabase_key:
        logger.warning(
            "Supabase credentials not configured in environment. "
            "Cannot download YOLO model from Supabase Storage. "
            "Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are configured."
        )
        return False

    bucket = SUPABASE_MODEL_BUCKET
    object_name = SUPABASE_MODEL_PATH

    try:
        from supabase import create_client

        client = create_client(supabase_url, supabase_key)
        logger.info(
            f"Downloading YOLO model from private Supabase Storage bucket '{bucket}' "
            f"(object: '{object_name}')..."
        )

        model_bytes = client.storage.from_(bucket).download(object_name)

        if not model_bytes or len(model_bytes) == 0:
            logger.error(f"Download returned 0 bytes for '{bucket}/{object_name}'. Model was not saved.")
            return False

        # Ensure destination directory exists
        dest_dir = os.path.dirname(os.path.abspath(target_path))
        os.makedirs(dest_dir, exist_ok=True)

        # Write to temporary file first, then atomically replace
        tmp_file = f"{target_path}.tmp_{os.getpid()}"
        with open(tmp_file, "wb") as f:
            f.write(model_bytes)

        os.replace(tmp_file, target_path)

        size_mb = len(model_bytes) / (1024 * 1024)
        logger.info(
            f"Successfully downloaded YOLO model ({size_mb:.2f} MB) from Supabase Storage "
            f"bucket '{bucket}' to '{target_path}'"
        )
        return True

    except Exception as e:
        err_msg = str(e)
        if supabase_key and supabase_key in err_msg:
            err_msg = err_msg.replace(supabase_key, "[REDACTED]")
        logger.error(
            f"Failed to download YOLO model from Supabase Storage "
            f"(bucket: '{bucket}', path: '{object_name}'): {err_msg}"
        )

        # Clean up temporary file if left behind
        tmp_file = f"{target_path}.tmp_{os.getpid()}"
        if os.path.exists(tmp_file):
            try:
                os.remove(tmp_file)
            except OSError:
                pass
        return False


_model: Optional[Any] = None
_load_lock = threading.Lock()
_load_attempted = False


def load_model(force_reload: bool = False) -> Optional[Any]:
    """
    Loads YOLOv8 model into memory once and caches it.
    If the model file does not exist locally, attempts download from private Supabase Storage.
    Thread-safe to prevent race conditions during concurrent startup requests.
    """
    global _model, _load_attempted
    with _load_lock:
        if _model is not None and not force_reload:
            return _model

        _load_attempted = True
        target_path = get_model_target_path()

        # 1. If model file is missing from target path, attempt to download it
        if not os.path.exists(target_path):
            logger.info(f"Model file not found at '{target_path}'. Attempting download from Supabase Storage...")
            download_model_from_supabase(target_path)

        # 2. Model file exists on disk, load with Ultralytics YOLO
        if os.path.exists(target_path):
            try:
                from ultralytics import YOLO

                # Limit CPU threads to reduce memory footprint on shared cloud containers
                try:
                    import torch
                    torch.set_num_threads(1)
                except Exception:
                    pass

                logger.info(f"Loading YOLOv8 weights from '{target_path}'...")
                _model = YOLO(target_path)
                logger.info(f"Successfully loaded YOLOv8 model from '{target_path}'")
            except Exception as e:
                logger.error(f"Error initializing YOLO model from '{target_path}': {e}")
                _model = None
        else:
            logger.warning(
                f"YOLOv8 model could not be found or downloaded at '{target_path}'. "
                f"In production, verify that the 'roadguard-models' bucket contains 'best.pt' "
                f"and SUPABASE_SERVICE_ROLE_KEY is configured in Render environment variables."
            )
            _model = None

        return _model


def get_model() -> Optional[Any]:
    """
    Returns the cached model instance, attempting initial load if not already attempted.
    """
    if _model is None and not _load_attempted:
        return load_model()
    return _model


def is_model_loaded() -> bool:
    """
    Returns True if the YOLO model is currently loaded in memory.
    """
    return get_model() is not None


# Resolve model path on module load for backward compatibility
MODEL_PATH = get_model_target_path()

# Initial load attempt on startup
model = load_model()


def __getattr__(name: str) -> Any:
    """
    Allows ml_service.model to always dynamically reflect the loaded model state.
    """
    if name == "model":
        return get_model()
    raise AttributeError(f"module '{__name__}' has no attribute '{name}'")


def predict_image(image_bytes: bytes) -> Dict[str, Any]:
    """
    Runs YOLOv8 inference on the given image bytes and returns the detection results.
    """
    current_model = get_model()
    if current_model is None:
        raise RuntimeError(
            "ML model is not loaded. Please verify the model file locally or ensure the "
            "model is uploaded to Supabase Storage bucket 'roadguard-models' and "
            "SUPABASE_SERVICE_ROLE_KEY is configured in Render environment variables."
        )

    try:
        # Load image from bytes
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
    except Exception:
        raise ValueError("Invalid image file. Could not parse image data.")

    # Run inference
    results = current_model(image, imgsz=640, conf=0.25)

    detections = []

    # Process results
    for r in results:
        boxes = r.boxes
        for box in boxes:
            coords = box.xyxy[0].tolist()
            confidence = float(box.conf[0])
            class_id = int(box.cls[0])
            class_name = current_model.names[class_id]

            if class_name.lower() in ["crack", "pothole"]:
                detections.append({
                    "class_name": class_name.lower(),
                    "confidence": round(confidence, 4),
                    "bbox": [round(c, 2) for c in coords]
                })

    overall_severity = "low"
    if detections:
        max_conf = max(d["confidence"] for d in detections)
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
