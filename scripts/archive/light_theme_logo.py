import cv2
import numpy as np
import sys

# Load the already perfectly trimmed, edge-to-edge logo
img_bgr = cv2.imread('public/pwa-1024x1024.png')
if img_bgr is None:
    print("Could not load image")
    sys.exit(1)

# Convert to HSL/HSV representation. OpenCV uses H:0-179, S:0-255, V:0-255
img_float = img_bgr.astype(np.float32) / 255.0

# Alternatively, we can use a more robust technique: 
# The logo is lines over a solid dark background.
# We can extract the "glow/lines" by treating the image as an additive blend.
# dark bg is ~ [20, 20, 30] BGR.
gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
# Anything significantly brighter than the dark background is part of a line/glow
_, mask = cv2.threshold(gray, 40, 255, cv2.THRESH_BINARY)
mask_float = cv2.GaussianBlur(mask.astype(np.float32)/255.0, (3,3), 0)
mask_3d = np.repeat(mask_float[:, :, np.newaxis], 3, axis=2)

# Light background: hsl(210°, 40%, 98%)
# H=210 -> RGB ~ (245, 248, 251)
light_bg = np.full_like(img_float, [251/255.0, 248/255.0, 245/255.0]) # BGR

# Now, we need to adapt the lines so they show up on a light background.
# Invert the lines' lightness so they become dark and crisp instead of glowing light.
# Or keep them colored but multiply them against the light bg.
inverted_lines = 1.0 - img_float

# Shift hues for cyan and amber -> cyan and violet
img_hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV).astype(np.float32)
H, S, V = cv2.split(img_hsv)

# 1. Shift Amber/Yellow (H~15-30) to Violet (H~127 in OCV, meaning 255 degrees)
amber_mask = np.clip(1.0 - np.abs(H - 20) / 20.0, 0.0, 1.0)
H += (127.5 - H) * amber_mask

# 2. Shift Cyan (H~90-100) to darker Cyan for light mode (H=94, S high, V lower for contrast)
cyan_mask = np.clip(1.0 - np.abs(H - 95) / 15.0, 0.0, 1.0)
H += (94.5 - H) * cyan_mask
V -= 50 * cyan_mask * (V/255.0) # darken cyan so it's readable on white

# Rebuild HSV
H = np.clip(H, 0, 179)
S = np.clip(S, 0, 255)
V = np.clip(V, 0, 255)
shifted_bgr = cv2.cvtColor(cv2.merge([H.astype(np.uint8), S.astype(np.uint8), V.astype(np.uint8)]), cv2.COLOR_HSV2BGR).astype(np.float32) / 255.0

# Blend the recolored lines over the light background using a multiply-like or dark-blend.
# Since lines are currently light on dark, `shifted_bgr` has bright lines and dark bg.
# If we invert it, we get dark lines on a bright bg (which is what we want for light mode).
inverted_shifted = 1.0 - shifted_bgr

# Mix: where original image was bright (glow/lines), use inverted_shifted.
# Where original was dark (background), use the exact light_bg color.
# A simple lerp using the mask:
final_float = light_bg * (1.0 - mask_3d) + inverted_shifted * mask_3d

# To preserve the exact light background flavor, let's just use inverted_shifted directly, 
# because inverted dark navy gives a nice off-white background anyway. Let's see what inverted dark navy is:
# Dark Navy: ~ RGB(15, 20, 30) -> Inverted: RGB(240, 235, 225). 
# But we want EXACT light bg: RGB(245, 248, 251).
# We can do a color transfer of the background.
final = np.clip(final_float * 255.0, 0, 255).astype(np.uint8)

cv2.imwrite('public/pwa-1024x1024-light.png', final)
print("Saved light theme logo")
