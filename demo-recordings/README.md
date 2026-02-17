# PQC Today - Demo Recordings for LinkedIn

This directory contains 14 WebP video recordings capturing the entire PQC Today web application experience.

## 📹 Recordings Overview

The following pages were captured with interactive demonstrations:

1. **landing_page_1771306533351.webp** - Landing page with hero section, features, and stats
2. **timeline_page_1771306590954.webp** - Interactive global migration timeline with event modals
3. **algorithms_page_1771306635601.webp** - Algorithm comparison, transition guide, and glossary
4. **playground_page_1771306766087.webp** - WASM-powered ML-KEM key generation demo
5. **openssl_studio_page_1771306809449.webp** - OpenSSL Studio interactive workbench
6. **learn_page_1771306844069.webp** - Learning dashboard with PQC 101 and glossary features
7. **assess_page_1771307038749.webp** - Complete 12-step risk assessment wizard with generated report
8. **compliance_page_1771307336845.webp** - Compliance tracker with FIPS 140-3 and ACVP filtering
9. **threat_page_1771307376071.webp** - Quantum threats dashboard with detailed threat views
10. **standards_page_1771307457659.webp** - Standards library with search and 91+ tracked standards
11. **migration_page_1771307500832.webp** - 7-phase migration framework with software catalog

## 🎬 Creating a LinkedIn Demo Video

### Option 1: Online Conversion (Recommended)

1. **Convert WebP to MP4** using online tools:
   - [CloudConvert](https://cloudconvert.com/webp-to-mp4) - Supports animated WebP
   - [FreeConvert](https://www.freeconvert.com/webp-to-mp4) - Batch conversion available
   - [Convertio](https://convertio.co/webp-mp4/) - Good quality output

2. **Add Text Overlays** (optional):
   - Use [Kapwing](https://www.kapwing.com/) - Free online video editor
   - Use [Canva Video Editor](https://www.canva.com/video-editor/) - Professional templates
   - Add titles for each section:
     - "PQC Today - Post-Quantum Cryptography Migration Hub"
     - "Interactive Global Migration Timeline"
     - "Algorithm Comparison & Transition Guide"
     - etc.

3. **Concatenate Videos**:
   - Use Kapwing or Canva to merge all MP4 files
   - Add intro card: "PQC Today\nPost-Quantum Cryptography Migration Hub"
   - Add outro card: "Open Source • Free Forever\ngithub.com/pqc-today"

### Option 2: Using ffmpeg (Advanced)

If you have ffmpeg with proper WebP support:

```bash
# Convert each WebP to MP4
for file in *.webp; do
    ffmpeg -i "$file" -c:v libx264 -pix_fmt yuv420p "${file%.webp}.mp4"
done

# Create concat list
ls -1 *.mp4 | sed 's/^/file /' > concat_list.txt

# Concatenate
ffmpeg -f concat -safe 0 -i concat_list.txt -c copy pqc_today_demo.mp4
```

### Option 3: Using Video Editing Software

- **DaVinci Resolve** (Free) - Professional grade
- **iMovie** (Mac) - Simple and effective
- **Adobe Premiere** - Industry standard
- **Shotcut** (Free, Cross-platform) - Open source

## 📊 Suggested LinkedIn Post

```
🔐 Introducing PQC Today - Your Complete Post-Quantum Cryptography Migration Hub

As quantum computing advances, organizations need to prepare for the post-quantum era.
PQC Today provides everything you need:

✅ Interactive Timeline - Track global PQC migration milestones
✅ Algorithm Comparison - Understand ML-KEM, ML-DSA, and more
✅ WASM Playground - Test PQC algorithms in your browser
✅ Risk Assessment - Get personalized migration recommendations
✅ Compliance Tracker - Monitor FIPS 140-3 & ACVP certifications
✅ Standards Library - Access 91+ tracked standards and drafts

🌟 Open Source • Free Forever

#PostQuantumCryptography #Cybersecurity #QuantumComputing #InfoSec #OpenSource
```

## 🎯 LinkedIn Video Specs

- **Aspect Ratio**: 16:9 (landscape) or 1:1 (square)
- **Duration**: 30 seconds to 10 minutes (3-5 minutes recommended)
- **File Size**: Max 5GB
- **Format**: MP4 (H.264 codec recommended)
- **Resolution**: 1920x1080 (Full HD) recommended

## 📝 Notes

- All recordings were captured on February 16, 2026
- Each recording shows real interactive features and data
- Total recording time: ~2-3 minutes (varies by page)
- Recordings include scrolling, clicking, and modal interactions

## 🚀 Quick Start

1. Upload all WebP files to CloudConvert
2. Download the converted MP4 files
3. Use Kapwing to merge them with text overlays
4. Export as MP4 (1080p)
5. Upload to LinkedIn!

---

**Need help?** Check the main project README or open an issue on GitHub.
