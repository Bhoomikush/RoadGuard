import os
from ultralytics import YOLO

def train():
    print("Starting YOLOv8 Smoke Test Training...")
    
    # Load a pretrained model
    model = YOLO('yolov8n.pt')
    
    # Paths
    data_yaml = r'D:\RoadGuard\ml\datasets\smoke_test\data.yaml'
    project_dir = r'D:\RoadGuard\ml\runs'
    name = 'roadguard_yolov8n_smoke'
    
    # Train the model with very conservative settings for CPU smoke test
    results = model.train(
        data=data_yaml,
        epochs=2,
        imgsz=416,
        batch=4,
        workers=0,
        project=project_dir,
        name=name,
        device='cpu',
        cache=False,
        exist_ok=True
    )
    
    print("Training completed.")

if __name__ == '__main__':
    train()
