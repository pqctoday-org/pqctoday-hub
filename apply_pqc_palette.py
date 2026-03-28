import cv2
import numpy as np
import sys

# Load the source image (the simplified sextant before any light-mode hacks, wait, I will use the one built from generate_icons.py)
# Actually, let's just use the raw AI generated image as source, then we can re-crop it.
# No, generate_icons.py creates public/pwa-1024x1024.png which was overwritten.
# I will use the original artifact:
SRC = '/Users/ericamador/.gemini/antigravity/brain/6f1dcd55-f204-45f6-b0ac-1ab2b74b92a9/logo_variant_sextant_simplified_1774417587093.png'
DST = 'public/pwa-1024x1024.png'

print(f"Loading {SRC}...")
img_bgr = cv2.imread(SRC)
if img_bgr is None:
    print(f"ERROR: could not load {SRC}")
    sys.exit(1)

# First, trim the navy space (like generate_icons.py did)
def trim(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 40, 255, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if contours:
        c = max(contours, key=cv2.contourArea)
        x, y, w, h = cv2.boundingRect(c)
        return img[y:y+h, x:x+w]
    return img

cropped = trim(img_bgr)
size = max(cropped.shape[0], cropped.shape[1])
# background color from top left
bg_col = img_bgr[0,0]
squared = np.full((size, size, 3), bg_col, dtype=np.uint8)
y_off = (size - cropped.shape[0]) // 2
x_off = (size - cropped.shape[1]) // 2
squared[y_off:y_off+cropped.shape[0], x_off:x_off+cropped.shape[1]] = cropped

# Resize to 1024x1024
final_img = cv2.resize(squared, (1024, 1024), interpolation=cv2.INTER_LANCZOS4)

# Now apply color correction!
img_hsv = cv2.cvtColor(final_img, cv2.COLOR_BGR2HSV).astype(np.float32)
H, S, V = cv2.split(img_hsv)
H_out = H.copy()
S_out = S.copy()
V_out = V.copy()

sat_guard = np.clip((S - 40.0) / 60.0, 0.0, 1.0)
bright_guard = np.clip((V - 40.0) / 60.0, 0.0, 1.0)

# Target Cyan: OCV 94.5 (hsl(189))
H_cyan_target = 94.5
H_cyan_center = 90.0 # Standard AI cyan
H_cyan_radius = 20.0

dist_cyan = np.abs(H - H_cyan_center)
cyan_mask = np.clip(1.0 - dist_cyan / H_cyan_radius, 0.0, 1.0) * sat_guard * bright_guard
H_out += (H_cyan_target - H) * 1.0 * cyan_mask
# Boost saturation slightly
S_out += cyan_mask * 20.0

# Target Violet: OCV 127.5 (hsl(255))
# Current AI amber is around H=15-30
H_amber_center = 22.0
H_amber_radius = 20.0

# Calculate distance, handle wrap-around (H goes 0-179 in opencv)
dist_amber1 = np.abs(H - H_amber_center)
dist_amber2 = np.abs(H + 180 - H_amber_center)
dist_amber3 = np.abs(H - 180 - H_amber_center)
dist_amber = np.minimum(dist_amber1, np.minimum(dist_amber2, dist_amber3))

amber_mask = np.clip(1.0 - dist_amber / H_amber_radius, 0.0, 1.0) * sat_guard * bright_guard

# Shift amber to violet
pull_amber = (127.5 - H) * 1.0 * amber_mask
H_out += pull_amber
# Boost saturation for violet
S_out += amber_mask * 30.0

# Target background: OCV 115 (hsl(230))
H_bg_target = 115.0
H_bg_center = 108.0
H_bg_radius = 15.0
dist_bg = np.abs(H - H_bg_center)
bg_mask = np.clip(1.0 - dist_bg / H_bg_radius, 0.0, 1.0)
dark_guard = np.clip(1.0 - (V - 10.0) / 30.0, 0.0, 1.0)
bg_mask *= dark_guard

H_out += (H_bg_target - H) * 0.8 * bg_mask

# Rebuild
H_out = np.clip(H_out, 0.0, 179.0)
S_out = np.clip(S_out, 0.0, 255.0)
V_out = np.clip(V_out, 0.0, 255.0)

result = cv2.cvtColor(
    cv2.merge([H_out.astype(np.uint8), S_out.astype(np.uint8), V_out.astype(np.uint8)]),
    cv2.COLOR_HSV2BGR
)

cv2.imwrite(DST, result)
print(f"Saved correctly colored logo to {DST}")

# Generate derived sizes
from PIL import Image
im = Image.open(DST)
sizes = {
    'pwa-512x512.png': 512,
    'pwa-192x192.png': 192,
    'apple-touch-icon.png': 180,
    'favicon-32x32.png': 32,
    'favicon-dark-32x32.png': 32,
    'favicon-light-32x32.png': 32
}
for name, sz in sizes.items():
    resized = im.resize((sz, sz), Image.Resampling.LANCZOS)
    resized.save(f'public/{name}')
    print(f'Generated public/{name}')
