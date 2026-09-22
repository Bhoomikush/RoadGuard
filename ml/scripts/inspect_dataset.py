import os
import glob
import json
import xml.etree.ElementTree as ET
from collections import defaultdict
from PIL import Image

def inspect(base_dir):
    print("="*50)
    print("DATASET INSPECTION REPORT")
    print("="*50)

    if not os.path.exists(base_dir):
        print(f"Error: Dataset directory {base_dir} does not exist.")
        return

    # Gather all images and label files
    all_files = glob.glob(os.path.join(base_dir, '**', '*.*'), recursive=True)
    
    image_exts = {'.jpg', '.jpeg', '.png', '.webp'}
    label_exts = {'.txt', '.xml', '.json'}
    
    images = [f for f in all_files if os.path.splitext(f)[1].lower() in image_exts]
    labels = [f for f in all_files if os.path.splitext(f)[1].lower() in label_exts]

    print(f"Total files found: {len(all_files)}")
    print(f"Total image count: {len(images)}")
    print(f"Total label count: {len(labels)}")
    
    found_exts = set(os.path.splitext(f)[1].lower() for f in images)
    print(f"Image extensions: {found_exts}")
    
    found_label_exts = set(os.path.splitext(f)[1].lower() for f in labels)
    print(f"Label format(s): {found_label_exts}")

    # Inspect images (sample to avoid taking too long, or check all for corruption)
    print("\n--- Image Health & Dimensions ---")
    corrupted = 0
    dimensions = defaultdict(int)
    # Check max 1000 images for dimensions to save time, but check all for corruption?
    # Actually, we should check all for corruption if requested, but let's just do a quick scan
    for img_path in images:
        try:
            with Image.open(img_path) as img:
                img.verify()
            with Image.open(img_path) as img:
                dimensions[img.size] += 1
        except Exception:
            corrupted += 1
            
    print(f"Corrupted images: {corrupted}")
    print("Image dimensions summary (top 5):")
    for dim, count in sorted(dimensions.items(), key=lambda x: x[1], reverse=True)[:5]:
        print(f"  {dim[0]}x{dim[1]}: {count} images")

    # Inspect labels
    print("\n--- Annotations ---")
    empty_labels = 0
    classes = defaultdict(int)
    class_names = set()
    
    for lbl_path in labels:
        ext = os.path.splitext(lbl_path)[1].lower()
        if os.path.getsize(lbl_path) == 0:
            empty_labels += 1
            continue
            
        if ext == '.txt':
            with open(lbl_path, 'r') as f:
                lines = f.readlines()
                if not lines:
                    empty_labels += 1
                for line in lines:
                    parts = line.strip().split()
                    if parts:
                        classes[parts[0]] += 1
        elif ext == '.xml': # PASCAL VOC
            try:
                tree = ET.parse(lbl_path)
                root = tree.getroot()
                objects = root.findall('object')
                if not objects:
                    empty_labels += 1
                for obj in objects:
                    name = obj.find('name').text
                    classes[name] += 1
                    class_names.add(name)
            except Exception:
                pass

    print(f"Empty label files: {empty_labels}")
    print(f"Class IDs/Names found: {list(classes.keys())}")
    print("Number of annotations per class:")
    for c, count in classes.items():
        print(f"  {c}: {count}")

    # Splits
    train_imgs = [f for f in images if 'train' in f.lower()]
    val_imgs = [f for f in images if 'val' in f.lower() or 'valid' in f.lower()]
    test_imgs = [f for f in images if 'test' in f.lower()]
    
    print("\n--- Splits (inferred from path) ---")
    print(f"Train images: {len(train_imgs)}")
    print(f"Validation images: {len(val_imgs)}")
    print(f"Test images: {len(test_imgs)}")

if __name__ == '__main__':
    inspect(r'D:\RoadGuard\ml\datasets\raw\mwpd_rdd')
