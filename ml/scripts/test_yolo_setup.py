import os
import sys

try:
    from ultralytics import YOLO
    print("YOLO imported successfully.")
except ImportError as e:
    print(f"Failed to import ultralytics: {e}")
    sys.exit(1)

def test_setup():
    yaml_path = r'D:\RoadGuard\ml\datasets\roadguard_yolo\data.yaml'
    
    # Check if yaml exists
    if not os.path.exists(yaml_path):
        print(f"Warning: {yaml_path} not found. Skipping dataset check.")
        yaml_path = None
        
    print("Loading small pretrained YOLO model (yolov8n.pt)...")
    try:
        model = YOLO('yolov8n.pt')
        print("Model loaded successfully.")
    except Exception as e:
        print(f"Error loading model: {e}")
        sys.exit(1)
        
    if yaml_path:
        # We don't train, but we can verify the dataset structure is parsable
        print("Dataset configuration looks ready. (Skipping actual parsing to avoid training start)")
        
    print("TEST PASSED: Ultralytics installed and model loads successfully.")

if __name__ == '__main__':
    test_setup()
