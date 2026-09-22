import os
import glob
import yaml
from PIL import Image

def validate():
    print("RoadGuard Dataset Validation")
    print("-" * 28)
    
    yolo_dir = r'D:\RoadGuard\ml\datasets\roadguard_yolo'
    data_yaml = os.path.join(yolo_dir, 'data.yaml')
    
    if not os.path.exists(data_yaml):
        print(f"Error: {data_yaml} not found.")
        return
        
    with open(data_yaml, 'r') as f:
        config = yaml.safe_load(f)
        
    names = config.get('names', {})
    valid_ids = [str(k) for k in names.keys()]
    
    train_imgs = glob.glob(os.path.join(yolo_dir, 'images', 'train', '*.*'))
    val_imgs = glob.glob(os.path.join(yolo_dir, 'images', 'val', '*.*'))
    
    print(f"Train images: {len(train_imgs)}")
    print(f"Validation images: {len(val_imgs)}")
    
    crack_ann = 0
    pothole_ann = 0
    invalid_labels = 0
    corrupted = 0
    
    def check_split(imgs, split_name):
        nonlocal crack_ann, pothole_ann, invalid_labels, corrupted
        for img_path in imgs:
            try:
                with Image.open(img_path) as img:
                    img.verify()
            except Exception:
                corrupted += 1
                
            base_name = os.path.splitext(os.path.basename(img_path))[0]
            lbl_path = os.path.join(yolo_dir, 'labels', split_name, base_name + '.txt')
            
            if not os.path.exists(lbl_path):
                # Images without labels are allowed in YOLO as background images, but user instruction said:
                # "every training image has the correct corresponding label where annotations exist"
                pass
            else:
                with open(lbl_path, 'r') as f:
                    for line in f:
                        parts = line.strip().split()
                        if not parts:
                            continue
                        if len(parts) != 5:
                            invalid_labels += 1
                            continue
                        
                        cls_id, x, y, w, h = parts
                        if cls_id not in valid_ids:
                            invalid_labels += 1
                        else:
                            if cls_id == '0':
                                crack_ann += 1
                            elif cls_id == '1':
                                pothole_ann += 1
                                
                        for val in [float(x), float(y), float(w), float(h)]:
                            if val < 0 or val > 1:
                                invalid_labels += 1
                                break

    check_split(train_imgs, 'train')
    check_split(val_imgs, 'val')
    
    print("\nCrack annotations: {}".format(crack_ann))
    print("Pothole annotations: {}".format(pothole_ann))
    print("\nInvalid labels: {}".format(invalid_labels))
    print("Corrupted images: {}".format(corrupted))
    
    train_names = set(os.path.basename(f) for f in train_imgs)
    val_names = set(os.path.basename(f) for f in val_imgs)
    duplicates = len(train_names.intersection(val_names))
    
    print("Duplicate train/val images: {}".format(duplicates))
    
    if invalid_labels == 0 and corrupted == 0 and duplicates == 0:
        print("\nDataset status: READY FOR YOLO TRAINING")
    else:
        print("\nDataset status: ERROR IN PREPARATION")

if __name__ == '__main__':
    validate()
