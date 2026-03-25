from PIL import Image, ImageChops

def trim(im):
    # Get the background color from top-left pixel
    bg = Image.new("RGB", im.size, im.getpixel((0,0)))
    diff = ImageChops.difference(im.convert("RGB"), bg)
    diff = ImageChops.add(diff, diff, 2.0, -100)
    bbox = diff.getbbox()
    if bbox:
        return im.crop(bbox)
    return im

# Use the best refined AI logo
img = Image.open('/Users/ericamador/.gemini/antigravity/brain/6f1dcd55-f204-45f6-b0ac-1ab2b74b92a9/logo_variant_sextant_final_polish_1774418120316.png')

# 1. Trim all wasted space perfectly
cropped = trim(img)

# 2. Make it a perfect square without distorting
w, h = cropped.size
size = max(w, h)
new_im = Image.new('RGB', (size, size), img.getpixel((0,0)))
# center it
new_im.paste(cropped, ((size - w) // 2, (size - h) // 2))

# 3. Generate icon sizes
sizes = {
    'pwa-1024x1024.png': 1024,
    'pwa-512x512.png': 512,
    'pwa-192x192.png': 192,
    'apple-touch-icon.png': 180,
    'favicon-32x32.png': 32,
    'favicon-dark-32x32.png': 32,
    'favicon-light-32x32.png': 32
}

for name, sz in sizes.items():
    resized = new_im.resize((sz, sz), Image.Resampling.LANCZOS)
    resized.save(f'public/{name}')
    print(f'Generated public/{name}')

print("Successfully generated all perfectly cropped, centered macOS/iOS PWA icons.")
