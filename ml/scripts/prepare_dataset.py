import os
import glob
import shutil
import yaml
import xml.etree.ElementTree as ET

def prepare():
    raw_dir = r'D:\RoadGuard\ml\datasets\raw\mwpd_rdd'
    out_dir = r'D:\RoadGuard\ml\datasets\roadguard_yolo'
    
    # Check if raw_dir exists and has files
    if not os.path.exists(raw_dir) or not os.listdir(raw_dir):
        print(f"Error: Raw dataset not found in {raw_dir}")
        return
        
    print(f"Preparing dataset from {raw_dir} to {out_dir}...")
    
    # Load class mapping
    with open(r'D:\RoadGuard\ml\datasets\class_mapping.yaml', 'r') as f:
        mapping = yaml.safe_load(f)
        
    source_map = mapping['source_classes']
    target_map = mapping['target_classes']
    
    # Reverse lookup for target_classes
    name_to_id = {name: str(id) for id, name in target_map.items()}
    
    # Ensure output structure
    for split in ['train', 'val']:
        os.makedirs(os.path.join(out_dir, 'images', split), exist_ok=True)
        os.makedirs(os.path.join(out_dir, 'labels', split), exist_ok=True)
        
    # Gather all images
    all_images = glob.glob(os.path.join(raw_dir, '**', '*.jpg'), recursive=True)
    all_images += glob.glob(os.path.join(raw_dir, '**', '*.png'), recursive=True)
    
    skipped = 0
    processed = 0
    seen_names = set()
    
    for img_path in all_images:
        base_name = os.path.splitext(os.path.basename(img_path))[0]
        if base_name in seen_names:
            skipped += 1
            continue
            
        # Look for corresponding label file (.xml or .txt)
        dir_name = os.path.dirname(img_path)
        
        # If dataset is already YOLO structured, labels are in ../../labels/split/
        # Or side-by-side. Let's construct possible paths.
        txt_side = os.path.join(dir_name, base_name + '.txt')
        xml_side = os.path.join(dir_name, base_name + '.xml')
        
        # Replace 'images' with 'labels' in path
        lbl_dir = dir_name.replace('images', 'labels')
        txt_yolo = os.path.join(lbl_dir, base_name + '.txt')
        xml_yolo = os.path.join(lbl_dir, base_name + '.xml')
        
        lbl_path = None
        for p in [txt_yolo, txt_side, xml_yolo, xml_side]:
            if os.path.exists(p):
                lbl_path = p
                break
        
        if not lbl_path:
            skipped += 1
            continue
            
        # Determine split based on path or random (simplified: path based)
        split = 'val' if ('val' in img_path.lower() or 'test' in img_path.lower()) else 'train'
        
        out_img_path = os.path.join(out_dir, 'images', split, os.path.basename(img_path))
        out_lbl_path = os.path.join(out_dir, 'labels', split, base_name + '.txt')
        
        yolo_lines = []
        if lbl_path.endswith('.xml'):
            try:
                tree = ET.parse(lbl_path)
                root = tree.getroot()
                size = root.find('size')
                if size is not None:
                    img_w = float(size.find('width').text)
                    img_h = float(size.find('height').text)
                else:
                    skipped += 1
                    continue
                    
                for obj in root.findall('object'):
                    name = obj.find('name').text
                    if name in source_map:
                        target_name = source_map[name]
                        target_id = name_to_id[target_name]
                        
                        bndbox = obj.find('bndbox')
                        xmin = float(bndbox.find('xmin').text)
                        ymin = float(bndbox.find('ymin').text)
                        xmax = float(bndbox.find('xmax').text)
                        ymax = float(bndbox.find('ymax').text)
                        
                        # Convert to YOLO
                        x_center = ((xmin + xmax) / 2) / img_w
                        y_center = ((ymin + ymax) / 2) / img_h
                        width = (xmax - xmin) / img_w
                        height = (ymax - ymin) / img_h
                        
                        yolo_lines.append(f"{target_id} {x_center:.6f} {y_center:.6f} {width:.6f} {height:.6f}")
            except Exception as e:
                skipped += 1
                continue
                
        elif lbl_path.endswith('.txt'):
            try:
                with open(lbl_path, 'r') as f:
                    lines = f.readlines()
                for line in lines:
                    parts = line.strip().split()
                    if len(parts) >= 5:
                        class_id = parts[0]
                        if class_id in source_map:
                            target_name = source_map[class_id]
                            target_id = name_to_id[target_name]
                            new_line = f"{target_id} " + " ".join(parts[1:])
                            yolo_lines.append(new_line)
            except Exception:
                skipped += 1
                continue
                
        if yolo_lines:
            shutil.copy2(img_path, out_img_path)
            with open(out_lbl_path, 'w') as f:
                f.write('\n'.join(yolo_lines) + '\n')
            seen_names.add(base_name)
            processed += 1
        else:
            skipped += 1

    print(f"Processed: {processed} images")
    print(f"Skipped: {skipped} images")

if __name__ == '__main__':
    prepare()
