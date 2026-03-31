#!/usr/bin/env python3
"""
Fine-tune pqctodaylogo1 to match pqctoday.com palette:

  App Primary   (cyan):   hsl(189°, 83%, 53%)  OCV H≈94   #19D4EF
  App Secondary (violet): hsl(255°, 91%, 76%)  OCV H≈127  #A68AFA
  App Background:         hsl(230°, 35%,  7%)  OCV H≈115  #0C0E18
"""

import cv2
import numpy as np
import sys

SRC = 'pqctodaylogo1'
DST = 'pqctodaylogo_v2.png'

img_bgr = cv2.imread(SRC)
if img_bgr is None:
    print(f"ERROR: could not load {SRC}")
    sys.exit(1)

print(f"Loaded {SRC}: {img_bgr.shape[1]}x{img_bgr.shape[0]}")

img_hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV).astype(np.float32)
H, S, V = cv2.split(img_hsv)
H_out = H.copy()
S_out = S.copy()

# Guard: only affect colored (non-black) pixels
sat_guard = np.clip((S - 40.0) / 60.0, 0.0, 1.0)

# ---- 1. Violet right-side elements: pull toward app secondary (OCV 127.5 = std 255°) ----
# These sit at OCV 120-140 (std 240-280°). Use a "gravitational pull" so all
# converge toward 127.5 proportionally, rather than a uniform shift.
H_violet_target = 127.5
H_violet_center = 132.0   # OCV center of the violet cluster
H_violet_radius = 16.0    # soft influence radius (±16 OCV = ±32° std)

dist_violet = np.abs(H - H_violet_center)
violet_mask = np.clip(1.0 - dist_violet / H_violet_radius, 0.0, 1.0)
violet_mask *= sat_guard

# Pull strength 0.75 → brings H=136(272°) to 130(260°), H=132(264°) to 129(258°)
# A reasonable correction that doesn't over-saturate the shift
pull_violet = (H_violet_target - H) * 0.75 * violet_mask
H_out += pull_violet

# ---- 2. Boost saturation on violet elements to match app secondary vibrancy ----
# App secondary hsl(255,91%,76%) is very saturated (S≈232/255 at OCV scale).
# Logo violet nodes are at S≈84-105; boost by +40 on the brightest nodes.
bright_guard = np.clip((V - 100.0) / 100.0, 0.0, 1.0)
S_out += violet_mask * bright_guard * 40.0

# ---- 3. Cyan left-side lines: pull toward app primary (OCV 94.5 = std 189°) ----
# Currently at OCV 95-100 (std 190-200°). Target OCV 94.5.
H_cyan_target = 94.5
H_cyan_center = 97.0
H_cyan_radius = 8.0

dist_cyan = np.abs(H - H_cyan_center)
cyan_mask = np.clip(1.0 - dist_cyan / H_cyan_radius, 0.0, 1.0)
cyan_mask *= sat_guard
# Don't let cyan mask affect violet region (no overlap due to radius)

pull_cyan = (H_cyan_target - H) * 0.6 * cyan_mask
H_out += pull_cyan

# ---- 4. Background: nudge dark areas toward app bg hsl(230°) OCV 115 ----
H_bg_target = 115.0
H_bg_center = 108.0
H_bg_radius = 9.0

dist_bg = np.abs(H - H_bg_center)
bg_mask = np.clip(1.0 - dist_bg / H_bg_radius, 0.0, 1.0)
dark_guard = np.clip(1.0 - (V - 25.0) / 55.0, 0.0, 1.0)
bg_mask *= dark_guard

pull_bg = (H_bg_target - H) * 0.5 * bg_mask
H_out += pull_bg

# ---- Clamp and rebuild ----
H_out = np.clip(H_out, 0.0, 180.0)
S_out = np.clip(S_out, 0.0, 255.0)

result = cv2.cvtColor(
    cv2.merge([H_out.astype(np.uint8), S_out.astype(np.uint8), V.astype(np.uint8)]),
    cv2.COLOR_HSV2BGR
)
cv2.imwrite(DST, result)
print(f"Saved to: {DST}")

# ---- Diagnostics (safe uint16 multiply) ----
print("\nKey pixel comparison (ORIGINAL → ADJUSTED):")
checks = [
    ("Left cyan node",     232, 329),
    ("Right violet node1", 222, 479),
    ("Right violet node2", 150, 441),
    ("Left background",    400, 100),
    ("Right background",   300, 550),
]
for label, row, col in checks:
    o = img_bgr[row, col]
    n = result[row, col]
    o_h = cv2.cvtColor(np.uint8([[o]]), cv2.COLOR_BGR2HSV)[0][0]
    n_h = cv2.cvtColor(np.uint8([[n]]), cv2.COLOR_BGR2HSV)[0][0]
    # safe hue-to-degrees without uint8 overflow
    o_deg = int(o_h[0]) * 2
    n_deg = int(n_h[0]) * 2
    print(f"\n  {label}:")
    print(f"    ORIG  RGB=({int(o[2]):3d},{int(o[1]):3d},{int(o[0]):3d})  H={int(o_h[0])} (std {o_deg}°)  S={int(o_h[1])}  V={int(o_h[2])}")
    print(f"    NEW   RGB=({int(n[2]):3d},{int(n[1]):3d},{int(n[0]):3d})  H={int(n_h[0])} (std {n_deg}°)  S={int(n_h[1])}  V={int(n_h[2])}")

print(f"\nApp targets → Primary: std 189° (OCV 94)  Secondary: std 255° (OCV 127)  BG: std 230° (OCV 115)")
