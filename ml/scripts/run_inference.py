import os
import glob
from ultralytics import YOLO

def verify_inference():
    model_path = r'D:\RoadGuard\ml\runs\roadguard_yolov8n_smoke\weights\best.pt'
    if not os.path.exists(model_path):
        print("Model best.pt NOT FOUND!")
        return
        
    print("Loading best.pt for inference...")
    model = YOLO(model_path)
    
    val_dir = r'D:\RoadGuard\ml\datasets\smoke_test\images\val'
    out_dir = r'D:\RoadGuard\ml\runs\roadguard_yolov8n_smoke\predictions'
    os.makedirs(out_dir, exist_ok=True)
    
    val_images = glob.glob(os.path.join(val_dir, '*.jpg'))[:5]
    
    if not val_images:
        print("No validation images found for inference.")
        return
        
    results = model(val_images, save=True, project=os.path.dirname(out_dir), name=os.path.basename(out_dir), exist_ok=True)
    print(f"Inference completed. Results saved to {out_dir}")

if __name__ == '__main__':
    verify_inference()
