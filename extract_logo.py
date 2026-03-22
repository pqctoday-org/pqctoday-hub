import cv2
import numpy as np

# Load the image
img = cv2.imread('pqctodaylogo1')
if img is None:
    print("Could not load image.")
    exit(1)

# Convert to grayscale
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# Threshold the image to find the dark non-background regions
# Assuming logo is dark on white background for now based on preview name
_, thresh = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY_INV)

# Find contours
contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

if not contours:
    print("No contours found.")
    exit(1)

# Sort contours by area, the largest is likely the logo
contours = sorted(contours, key=cv2.contourArea, reverse=True)

# Select the largest contour
c = contours[0]

# Create a mask for the logo
mask = np.zeros(img.shape[:2], dtype=np.uint8)
cv2.drawContours(mask, [c], -1, 255, -1)

# Create an alpha channel based on the mask
b, g, r = cv2.split(img)
alpha = mask

# Merge the channels back together with the alpha channel
rgba = cv2.merge((b, g, r, alpha))

# Crop to the bounding box of the contour to remove text below if any
x, y, w, h = cv2.boundingRect(c)
cropped_rgba = rgba[y:y+h, x:x+w]

# Save the result
cv2.imwrite('pqctodaylogo_extracted.png', cropped_rgba)
print("Saved extracted logo to pqctodaylogo_extracted.png")
