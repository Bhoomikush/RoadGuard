import os
import shutil
import random
from pathlib import Path

def setup_smoke_test():
    source_dir = Path("D:/RoadGuard/ml/datasets/roadguard_yolo")
    dest_dir = Path("D:/RoadGuard/ml/datasets/smoke_test")
    
    # Remove existing smoke_test if exists
    if dest_dir.exists():
        shutil.rmtree(dest_dir)
    
    # Create directories
    for split in ['train', 'val']:
        (dest_dir / 'images' / split).mkdir(parents=True, exist_ok=True)
        (dest_dir / 'labels' / split).mkdir(parents=True, exist_ok=True)
    
    # We need 300 train and 50 val images
    # Let's read from source train and val respectively
    
    def sample_and_copy(split, count):
        src_images_dir = source_dir / 'images' / split
        src_labels_dir = source_dir / 'labels' / split
        
        dst_images_dir = dest_dir / 'images' / split
        dst_labels_dir = dest_dir / 'labels' / split
        
        if not src_images_dir.exists():
            print(f"Warning: {src_images_dir} does not exist.")
            return 0
            
        images = list(src_images_dir.glob('*.jpg')) + list(src_images_dir.glob('*.png'))
        random.seed(42)  # For reproducibility
        random.shuffle(images)
        
        selected = images[:count]
        
        copied_count = 0
        for img_path in selected:
            # Check for label
            label_name = img_path.stem + '.txt'
            label_path = src_labels_dir / label_name
            
            if label_path.exists():
                shutil.copy(img_path, dst_images_dir / img_path.name)
                shutil.copy(label_path, dst_labels_dir / label_name)
                copied_count += 1
                
        return copied_count

    train_count = sample_and_copy('train', 300)
    val_count = sample_and_copy('val', 50)
    
    print(f"Copied {train_count} training images.")
    print(f"Copied {val_count} validation images.")

if __name__ == '__main__':
    setup_smoke_test()
