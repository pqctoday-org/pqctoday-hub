#!/usr/bin/env python3
"""
Generate all app icon sizes from pqctodaylogo_v2.png:
  - public/favicon-32x32.png       (32x32)
  - public/apple-touch-icon.png    (180x180, iOS)
  - public/pwa-192x192.png         (192x192, PWA)
  - public/pwa-512x512.png         (512x512, PWA maskable)
  - pqctodaylogo.icns               (macOS, all sizes via iconutil)
"""

import subprocess
import shutil
import sys
from pathlib import Path
from PIL import Image

SRC = Path('pqctodaylogo_v2.png')
if not SRC.exists():
    print("ERROR: pqctodaylogo_v2.png not found. Run adjust_logo_colors.py first.")
    sys.exit(1)

src_img = Image.open(SRC).convert('RGBA')
print(f"Source: {SRC}  {src_img.size[0]}x{src_img.size[1]}  mode={src_img.mode}")

def save_png(img: Image.Image, path: Path, size: int) -> None:
    resized = img.resize((size, size), Image.LANCZOS)
    # Convert to RGB (no alpha) for web icons
    rgb = Image.new('RGB', (size, size), (0, 0, 0))
    if resized.mode == 'RGBA':
        rgb.paste(resized, mask=resized.split()[3])
    else:
        rgb = resized.convert('RGB')
    rgb.save(path, 'PNG', optimize=True)
    print(f"  Saved {path}  ({size}x{size})")

PUBLIC = Path('public')

# ---- Web / PWA icons ----
save_png(src_img, PUBLIC / 'favicon-32x32.png',    32)
save_png(src_img, PUBLIC / 'apple-touch-icon.png', 180)
save_png(src_img, PUBLIC / 'pwa-192x192.png',      192)
save_png(src_img, PUBLIC / 'pwa-512x512.png',      512)

# ---- macOS .icns ----
iconset = Path('AppIcon.iconset')
iconset.mkdir(exist_ok=True)

icns_sizes = [
    ('icon_16x16.png',       16),
    ('icon_16x16@2x.png',    32),
    ('icon_32x32.png',       32),
    ('icon_32x32@2x.png',    64),
    ('icon_128x128.png',    128),
    ('icon_128x128@2x.png', 256),
    ('icon_256x256.png',    256),
    ('icon_256x256@2x.png', 512),
    ('icon_512x512.png',    512),
    ('icon_512x512@2x.png',1024),
]

for filename, size in icns_sizes:
    resized = src_img.resize((size, size), Image.LANCZOS)
    # Keep RGBA for icns (supports transparency)
    resized.save(iconset / filename, 'PNG')

print(f"\n  Iconset written: {iconset}/")

# Convert to .icns using macOS iconutil
icns_out = Path('pqctodaylogo.icns')
result = subprocess.run(
    ['iconutil', '-c', 'icns', str(iconset), '-o', str(icns_out)],
    capture_output=True, text=True
)
if result.returncode == 0:
    print(f"  Saved {icns_out}  ({icns_out.stat().st_size // 1024} KB)")
else:
    print(f"  iconutil error: {result.stderr}")
    sys.exit(1)

# Cleanup iconset dir
shutil.rmtree(iconset)
print(f"  Cleaned up {iconset}/")

print("\nDone. Icons generated:")
for p in [
    PUBLIC / 'favicon-32x32.png',
    PUBLIC / 'apple-touch-icon.png',
    PUBLIC / 'pwa-192x192.png',
    PUBLIC / 'pwa-512x512.png',
    icns_out,
]:
    size_kb = p.stat().st_size // 1024
    print(f"  {p}  ({size_kb} KB)")
