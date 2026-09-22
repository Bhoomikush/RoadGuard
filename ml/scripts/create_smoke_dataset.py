import os
import shutil
import random

def setup_smoke_dataset():
    src_dir = r'D:\RoadGuard\ml\datasets\roadguard_yolo'
    dst_dir = r'D:\RoadGuard\ml\datasets\smoke_test'
    
    # Create structure
    for split in ['train', 'val']:
        os.makedirs(os.path.join(dst_dir, 'images', split), exist_ok=True)
        os.makedirs(os.path.join(dst_dir, 'labels', split), exist_ok=True)
        
    def sample_files(split, count):
        src_images = os.path.join(src_dir, 'images', split)
        src_labels = os.path.join(src_dir, 'labels', split)
        
        dst_images = os.path.join(dst_dir, 'images', split)
        dst_labels = os.path.join(dst_dir, 'labels', split)
        
        all_imgs = [f for f in os.listdir(src_images) if f.endswith('.jpg')]
        random.seed(42)  # For reproducibility
        random.shuffle(all_imgs)
        
        copied = 0
        for img in all_imgs:
            base = os.path.splitext(img)[0]
            lbl = base + '.txt'
            
            if os.path.exists(os.path.join(src_labels, lbl)):
                shutil.copy2(os.path.join(src_images, img), os.path.join(dst_images, img))
                shutil.copy2(os.path.join(src_labels, lbl), os.path.join(dst_labels, lbl))
                copied += 1
                
            if copied >= count:
                break
                
        print(f"Copied {copied} images to {split}")

    sample_files('train', 300)
    sample_files('val', 50)

if __name__ == '__main__':
    setup_smoke_dataset()
