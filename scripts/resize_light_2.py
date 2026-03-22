import sys
from PIL import Image

def resize_and_crop(image_path, output_path):
    img = Image.open(image_path)
    img = img.convert("RGBA")
    
    bg_color = img.getpixel((0, 0))
    
    width, height = img.size
    
    min_x = width
    min_y = height
    max_x = 0
    max_y = 0
    
    THRESHOLD = 20
    
    found = False
    for y in range(height):
        for x in range(width):
            p = img.getpixel((x, y))
            dist = abs(p[0] - bg_color[0]) + abs(p[1] - bg_color[1]) + abs(p[2] - bg_color[2])
            
            if dist > THRESHOLD:
                found = True
                if x < min_x: min_x = x
                if y < min_y: min_y = y
                if x > max_x: max_x = x
                if y > max_y: max_y = y
                
    if not found:
        print("No content found different from background!")
        return
        
    bbox = (min_x, min_y, max_x, max_y)
    print(f"Bounding box: {bbox}")
    
    cropped = img.crop(bbox)
    
    crop_w = bbox[2] - bbox[0]
    crop_h = bbox[3] - bbox[1]
    
    target_size = 1024
    
    aspect = crop_w / crop_h
    
    if crop_w > crop_h:
        new_w = target_size
        new_h = int(target_size / aspect)
    else:
        new_h = target_size
        new_w = int(target_size * aspect)
        
    resized = cropped.resize((new_w, new_h), Image.LANCZOS)
    
    final_bg = (bg_color[0], bg_color[1], bg_color[2], 255)
    new_img = Image.new('RGBA', (target_size, target_size), final_bg)
    
    paste_x = (target_size - new_w) // 2
    paste_y = (target_size - new_h) // 2
    
    new_img.paste(resized, (paste_x, paste_y), mask=resized.split()[3])
    
    new_img.save(output_path)
    print(f"Saved to {output_path}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 resize_light_2.py <input_image> <output_image>")
        sys.exit(1)
        
    sharp_image = sys.argv[1]
    output_image = sys.argv[2]
    resize_and_crop(sharp_image, output_image)
