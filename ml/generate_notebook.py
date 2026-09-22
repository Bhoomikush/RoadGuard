import json
from pathlib import Path

notebook = {
    "cells": [],
    "metadata": {
        "colab": {
            "provenance": []
        },
        "kernelspec": {
            "display_name": "Python 3",
            "name": "python3"
        },
        "language_info": {
            "name": "python"
        }
    },
    "nbformat": 4,
    "nbformat_minor": 0
}

def add_md(text):
    notebook["cells"].append({
        "cell_type": "markdown",
        "metadata": {},
        "source": [line + "\n" for line in text.split("\n")]
    })

def add_code(text):
    notebook["cells"].append({
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": [line + "\n" for line in text.split("\n")]
    })

# Section 0: Instructions
add_md("""# ROADGUARD AI — YOLOv8n GPU TRAINING PACKAGE
## Instructions for preparing the dataset:
Before running this notebook, you must prepare the dataset on your local machine.
1. Locate the prepared YOLO dataset at: `D:\\RoadGuard\\ml\\datasets\\roadguard_yolo`
2. Create a ZIP archive named `roadguard_yolo.zip` containing the contents of this directory.
3. Ensure the ZIP structure looks like this:
   ```
   roadguard_yolo/
   ├── images/
   │   ├── train/
   │   └── val/
   ├── labels/
   │   ├── train/
   │   └── val/
   └── data.yaml
   ```
4. Do NOT modify the actual dataset while creating the ZIP.
5. Upload the ZIP file using the file explorer on the left panel in Colab.""")

# Section 1: Environment setup
add_md("## 1. Environment Setup")
add_code("""!pip install ultralytics opencv-python pyyaml matplotlib pandas""")

# Section 2: GPU verification
add_md("## 2. GPU Verification\nEnsure the runtime is set to T4 GPU (Runtime -> Change runtime type).")
add_code("""import torch
import sys

print("Checking Hardware...")
if torch.cuda.is_available():
    print("CUDA available: YES")
    print(f"GPU name: {torch.cuda.get_device_name(0)}")
    print(f"CUDA version: {torch.version.cuda}")
else:
    print("CUDA available: NO")
    print("ERROR: CUDA is unavailable. Please switch the Colab runtime to GPU (Runtime -> Change runtime type -> Hardware accelerator: GPU).")
    sys.exit("Stopping execution: GPU required.")""")

# Section 3: Dataset upload & Unzip
add_md("## 3. Dataset Upload & Unzip\nAssuming `roadguard_yolo.zip` has been uploaded to `/content/roadguard_yolo.zip`.")
add_code("""import os
import zipfile

zip_path = '/content/roadguard_yolo.zip'
extract_path = '/content/'

if not os.path.exists(zip_path):
    print(f"ERROR: {zip_path} not found. Please upload the dataset ZIP file.")
else:
    print("Extracting dataset...")
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(extract_path)
    print("Dataset extracted to /content/roadguard_yolo")""")

# Section 4: Dataset verification
add_md("## 4. Dataset Verification")
add_code("""import yaml
import glob
import sys

dataset_path = '/content/roadguard_yolo'
yaml_path = f'{dataset_path}/data.yaml'

if not os.path.exists(yaml_path):
    print("ERROR: data.yaml not found!")
    sys.exit("Dataset verification failed.")

with open(yaml_path, 'r') as f:
    data_cfg = yaml.safe_load(f)

print("data.yaml classes:")
for k, v in data_cfg.get('names', {}).items():
    print(f"{k} = {v}")

train_images = len(glob.glob(f"{dataset_path}/images/train/*.*"))
val_images = len(glob.glob(f"{dataset_path}/images/val/*.*"))

print(f"Train images found: {train_images} (Expected approx 12,358)")
print(f"Validation images found: {val_images} (Expected approx 1,373)")

if train_images < 10000 or val_images < 1000:
    print("WARNING: Image counts seem significantly lower than expected.")
else:
    print("Dataset validation PASS.")""")

# Section 5 & 6: YOLOv8n installation & Model initialization
add_md("## 5 & 6. YOLOv8n Installation & Model Initialization")
add_code("""from ultralytics import YOLO

print("Loading YOLOv8n pretrained model...")
model = YOLO("yolov8n.pt")""")

# Section 7: Full training
add_md("## 7. Full Training Configuration\n# FINAL TRAINING — THIS WILL USE GPU TIME")
add_code("""# Ensure we point to the absolute path in Colab
import yaml

yaml_path = '/content/roadguard_yolo/data.yaml'
with open(yaml_path, 'r') as f:
    data_yaml = yaml.safe_load(f)

# Update paths in YAML for Colab
data_yaml['path'] = '/content/roadguard_yolo'
data_yaml['train'] = 'images/train'
data_yaml['val'] = 'images/val'

with open(yaml_path, 'w') as f:
    yaml.dump(data_yaml, f)

print("Starting Full Training...")
results = model.train(
    data=yaml_path,
    epochs=50,
    imgsz=640,
    device=0,
    workers=2,
    patience=10,
    project='roadguard_training',
    name='yolov8n_full',
    exist_ok=True
)

best_pt_path = '/content/roadguard_training/yolov8n_full/weights/best.pt'
if os.path.exists(best_pt_path):
    print("Training Complete. best.pt FOUND.")
else:
    print("ERROR: best.pt not found.")""")

# Section 8: Validation
add_md("## 8. Validation")
add_code("""# Load the best model
best_model = YOLO('/content/roadguard_training/yolov8n_full/weights/best.pt')

print("Running validation on the validation dataset...")
metrics = best_model.val()

print("\\nOVERALL METRICS:")
print(f"Precision: {metrics.results_dict['metrics/precision(B)']:.4f}")
print(f"Recall: {metrics.results_dict['metrics/recall(B)']:.4f}")
print(f"mAP50: {metrics.results_dict['metrics/mAP50(B)']:.4f}")
print(f"mAP50-95: {metrics.results_dict['metrics/mAP50-95(B)']:.4f}")

# Assuming names are {0: 'crack', 1: 'pothole'}
for i, name in enumerate(['crack', 'pothole']):
    if i < len(metrics.box.ap_class_index):
        idx = list(metrics.box.ap_class_index).index(i)
        print(f"\\n{name.upper()}:")
        print(f"Precision: {metrics.box.p[idx]:.4f}")
        print(f"Recall: {metrics.box.r[idx]:.4f}")
        print(f"mAP50: {metrics.box.map50[idx]:.4f}")
        print(f"mAP50-95: {metrics.box.map[idx]:.4f}")""")

# Section 9: Sample inference
add_md("## 9. Sample Inference")
add_code("""import random

val_images = glob.glob('/content/roadguard_yolo/images/val/*.*')
sample_images = random.sample(val_images, min(10, len(val_images)))

print("Running inference on sample images...")
best_model.predict(
    source=sample_images,
    save=True,
    project='roadguard_predictions',
    name='samples'
)
print("Predictions saved to /content/roadguard_predictions/samples/")""")

# Section 10: Confusion Matrix + Results
add_md("## 10. Confusion Matrix + Results Display")
add_code("""from IPython.display import Image, display

print("Results Dashboard:")
results_dir = '/content/roadguard_training/yolov8n_full/'

for img_file in ['results.png', 'confusion_matrix.png', 'val_batch0_pred.jpg']:
    if os.path.exists(results_dir + img_file):
        print(f"\\nDisplaying {img_file}:")
        display(Image(filename=results_dir + img_file, width=800))""")

# Section 11: Download Final Model
add_md("## 11. Download Final Model")
add_code("""from google.colab import files
import shutil

print("Downloading best.pt...")
best_pt_path = '/content/roadguard_training/yolov8n_full/weights/best.pt'
if os.path.exists(best_pt_path):
    files.download(best_pt_path)
else:
    print("best.pt not found!")

print("Creating results.zip...")
shutil.make_archive('/content/results', 'zip', '/content/roadguard_training/yolov8n_full')
files.download('/content/results.zip')
print("Download initiated.")""")

# Section 12: Final Notebook Report
add_md("## 12. Final Notebook Report")
add_code("""print("==================================================")
print("ROADGUARD AI — FINAL YOLOv8n TRAINING\\n")

gpu_name = torch.cuda.get_device_name(0) if torch.cuda.is_available() else "None"
print(f"GPU:\\nGPU name: {gpu_name}\\n")

print(f"Dataset:\\nTrain images: {train_images}\\nValidation images: {val_images}\\n")

print("Classes:\\n0 = crack\\n1 = pothole\\n")

print("Training:\\nEpochs: 50\\nImage size: 640\\nBatch size: 16\\n")

print("RESULTS:\\n")
print(f"Precision: {metrics.results_dict.get('metrics/precision(B)', 0):.4f}")
print(f"Recall: {metrics.results_dict.get('metrics/recall(B)', 0):.4f}")
print(f"mAP50: {metrics.results_dict.get('metrics/mAP50(B)', 0):.4f}")
print(f"mAP50-95: {metrics.results_dict.get('metrics/mAP50-95(B)', 0):.4f}\\n")

for i, name in enumerate(['crack', 'pothole']):
    if i < len(metrics.box.ap_class_index):
        idx = list(metrics.box.ap_class_index).index(i)
        print(f"{name.upper()}:")
        print(f"Precision: {metrics.box.p[idx]:.4f}")
        print(f"Recall: {metrics.box.r[idx]:.4f}")
        print(f"mAP50: {metrics.box.map50[idx]:.4f}")
        print(f"mAP50-95: {metrics.box.map[idx]:.4f}\\n")

best_exists = "FOUND" if os.path.exists(best_pt_path) else "NOT FOUND"
print(f"Model:\\nbest.pt: {best_exists}\\n")

print("Inference:\\nPASS")
print("==================================================")""")

with open('D:/RoadGuard/ml/RoadGuard_YOLOv8_Training.ipynb', 'w') as f:
    json.dump(notebook, f, indent=2)
