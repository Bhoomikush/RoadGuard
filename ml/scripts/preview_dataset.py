import os
import glob
import random
import cv2

def preview():
    yolo_dir = r'D:\RoadGuard\ml\datasets\roadguard_yolo'
    out_dir = r'D:\RoadGuard\ml\datasets\preview'
    
    os.makedirs(out_dir, exist_ok=True)
    
    train_imgs = glob.glob(os.path.join(yolo_dir, 'images', 'train', '*.*'))
    if not train_imgs:
        print("No training images found to preview.")
        return
        
    sample = random.sample(train_imgs, min(10, len(train_imgs)))
    
    class_colors = {
        '0': (0, 0, 255), # Red for crack
        '1': (0, 255, 0)  # Green for pothole
    }
    
    class_names = {
        '0': 'crack',
        '1': 'pothole'
    }
    
    for img_path in sample:
        base_name = os.path.splitext(os.path.basename(img_path))[0]
        lbl_path = os.path.join(yolo_dir, 'labels', 'train', base_name + '.txt')
        
        img = cv2.imread(img_path)
        if img is None:
            continue
            
        h, w, _ = img.shape
        
        if os.path.exists(lbl_path):
            with open(lbl_path, 'r') as f:
                for line in f:
                    parts = line.strip().split()
                    if len(parts) == 5:
                        c, x_c, y_c, bw, bh = parts
                        x_c, y_c, bw, bh = float(x_c), float(y_c), float(bw), float(bh)
                        
                        # Convert normalized to pixel coordinates
                        xmin = int((x_c - bw/2) * w)
                        ymin = int((y_c - bh/2) * h)
                        xmax = int((x_c + bw/2) * w)
                        ymax = int((y_c + bh/2) * h)
                        
                        color = class_colors.get(c, (255, 255, 255))
                        name = class_names.get(c, c)
                        
                        cv2.rectangle(img, (xmin, ymin), (xmax, ymax), color, 2)
                        cv2.putText(img, name, (xmin, ymin - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
                        
        out_path = os.path.join(out_dir, f"preview_{os.path.basename(img_path)}")
        cv2.imwrite(out_path, img)
        
    print(f"Generated {len(sample)} previews in {out_dir}")

if __name__ == '__main__':
    preview()
