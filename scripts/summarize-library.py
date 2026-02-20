#!/usr/bin/env python3
"""
scripts/summarize-library.py

Generates structured 2-page markdown summaries + PNG previews for all downloaded library documents.
- Metadata from CSV
- Text extracted via pdftotext / html.parser
- PNG previews for PDFs only (via pdftoppm)
- Cost: $0 (no API calls)

Usage:
  python3 scripts/summarize-library.py
"""

import csv
import os
import re
import subprocess
import sys
from pathlib import Path
from html.parser import HTMLParser

# ──────────────────────────────────────────────────────────────────────────────
# Paths
# ──────────────────────────────────────────────────────────────────────────────

ROOT = Path(__file__).parent.parent
DATA_DIR = ROOT / "src/data"
LIBRARY_DIR = ROOT / "public/library"
CSV_PATH = DATA_DIR / "library_02192026.csv"

# ──────────────────────────────────────────────────────────────────────────────
# HTML text extractor
# ──────────────────────────────────────────────────────────────────────────────

class HTMLTextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text = []
        self.skip_tags = {'script', 'style', 'meta', 'noscript'}
        self.in_skip = False

    def handle_starttag(self, tag, attrs):
        if tag in self.skip_tags:
            self.in_skip = True

    def handle_endtag(self, tag):
        if tag in self.skip_tags:
            self.in_skip = False

    def handle_data(self, data):
        if not self.in_skip:
            self.text.append(data)

    def get_text(self):
        return ' '.join(self.text)

# ──────────────────────────────────────────────────────────────────────────────
# Text extraction
# ──────────────────────────────────────────────────────────────────────────────

def extract_text_from_pdf(pdf_path, max_lines=500):
    """Extract text from first 3 pages of PDF using pdftotext."""
    try:
        result = subprocess.run(
            ['pdftotext', '-l', '3', str(pdf_path), '-'],
            capture_output=True,
            text=True,
            timeout=10
        )
        if result.returncode == 0:
            lines = result.stdout.strip().split('\n')[:max_lines]
            return '\n'.join(lines)
    except Exception as e:
        print(f"  ⚠ pdftotext failed for {pdf_path.name}: {e}")
    return ""

def extract_text_from_html(html_path, max_chars=2000):
    """Extract text from HTML file using html.parser."""
    try:
        with open(html_path, 'r', encoding='utf-8', errors='ignore') as f:
            parser = HTMLTextExtractor()
            parser.feed(f.read())
            text = parser.get_text()
            return text[:max_chars]
    except Exception as e:
        print(f"  ⚠ HTML parsing failed for {html_path.name}: {e}")
    return ""

# ──────────────────────────────────────────────────────────────────────────────
# Clean extracted text
# ──────────────────────────────────────────────────────────────────────────────

def clean_text(text, max_words=300):
    """
    Clean extracted text:
    - Collapse whitespace
    - Remove common boilerplate
    - Limit to first N words
    """
    # Collapse whitespace
    text = ' '.join(text.split())

    # Remove common boilerplate phrases (case-insensitive)
    boilerplate = [
        r'^\s*confidential\s*',
        r'^\s*draft\s*',
        r'^\s*[a-z0-9\.\-]+@',  # email addresses
        r'©.*?$',  # copyright
        r'page\s+\d+\s+of\s+\d+',  # page numbers
    ]
    for pattern in boilerplate:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE | re.MULTILINE)

    # Limit to first N words
    words = text.split()[:max_words]
    return ' '.join(words)

# ──────────────────────────────────────────────────────────────────────────────
# PNG generation for PDFs
# ──────────────────────────────────────────────────────────────────────────────

def generate_png_from_pdf(pdf_path, output_dir):
    """Generate PNG from first page of PDF using pdftoppm."""
    basename = pdf_path.stem
    tmp_base = output_dir / f"_tmp_{basename}"
    output_png = output_dir / f"{basename}.png"

    try:
        # pdftoppm -r 150 -l 1 -png input.pdf tmpbase → tmpbase-01.png
        subprocess.run(
            ['pdftoppm', '-r', '150', '-l', '1', '-png', str(pdf_path), str(tmp_base)],
            capture_output=True,
            timeout=15,
            check=True
        )

        # Rename tmp-01.png to basename.png
        tmp_png = tmp_base.with_name(f"{tmp_base.name}-01.png")
        if tmp_png.exists():
            tmp_png.rename(output_png)
            return True
    except Exception as e:
        print(f"  ⚠ PNG generation failed for {basename}: {e}")

    return False

# ──────────────────────────────────────────────────────────────────────────────
# Markdown generation
# ──────────────────────────────────────────────────────────────────────────────

def generate_markdown(row, extracted_text, has_png=False):
    """Generate structured markdown from CSV row + extracted text."""

    ref_id = row.get('reference_id', '').strip()
    title = row.get('document_title', '').strip()
    doc_type = row.get('document_type', 'Unknown').strip()
    doc_status = row.get('document_status', '').strip()
    date_pub = row.get('initial_publication_date', '').strip()
    date_upd = row.get('last_update_date', '').strip()
    region = row.get('region_scope', '').strip()
    urgency = row.get('MigrationUrgency', '').strip()
    org = row.get('authors_or_organization', '').strip()
    industries = row.get('applicable_industries', '').strip()
    algo_family = row.get('AlgorithmFamily', '').strip()
    sec_levels = row.get('SecurityLevels', '').strip()
    protocol_impact = row.get('ProtocolOrToolImpact', '').strip()
    toolchain = row.get('ToolchainSupport', '').strip()
    short_desc = row.get('short_description', '').strip()
    deps = row.get('dependencies', '').strip()
    local_file = row.get('local_file', '').strip()

    # Clean extracted text
    intro = clean_text(extracted_text, max_words=300)

    # Build markdown with YAML frontmatter
    md = f"""---
reference_id: {ref_id}
document_type: {doc_type}
document_status: {doc_status}
date_published: {date_pub}
date_updated: {date_upd}
region: {region}
migration_urgency: {urgency}
local_file: {local_file}
"""

    if has_png:
        md += f"preview: {ref_id}.png\n"

    md += f"""---

# {title}

## Author & Organization
**Organization:** {org}

## Scope
**Industries:** {industries}
**Region:** {region}
**Document type:** {doc_type}

## How It Relates to PQC
{protocol_impact}

**Dependencies:** {deps}

## Risks Addressed
**Migration urgency:** {urgency}
**Security levels:** {sec_levels}

## PQC Key Types & Mechanisms
| Field | Value |
| --- | --- |
| Algorithm family | {algo_family} |
| Security levels | {sec_levels} |
| Protocol / tool impact | {protocol_impact} |
| Toolchain support | {toolchain} |

## Description
{short_desc}

---

*{intro}*
"""

    return md

# ──────────────────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────────────────

def main():
    print("📚  Library Summarizer + PNG Preview Generator\n")

    # Verify CSV exists
    if not CSV_PATH.exists():
        print(f"❌  CSV not found: {CSV_PATH}")
        sys.exit(1)

    # Verify library dir exists
    if not LIBRARY_DIR.exists():
        print(f"❌  Library dir not found: {LIBRARY_DIR}")
        sys.exit(1)

    # Load CSV → dict[local_file_stem → row]
    print(f"Reading: {CSV_PATH.relative_to(ROOT)}")
    csv_rows = {}
    with open(CSV_PATH, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            local_file = row.get('local_file', '').strip()
            if local_file:
                # Extract stem (e.g., "public/library/FIPS_203.pdf" → "FIPS_203")
                stem = Path(local_file).stem
                csv_rows[stem] = row

    print(f"Loaded {len(csv_rows)} entries from CSV\n")

    # Process all files in library dir
    pdf_files = sorted(LIBRARY_DIR.glob('*.pdf'))
    html_files = sorted(LIBRARY_DIR.glob('*.html'))
    all_files = pdf_files + html_files

    print(f"Processing {len(all_files)} files ({len(pdf_files)} PDFs, {len(html_files)} HTMLs)\n")

    md_count = 0
    png_count = 0
    errors = []

    for file_path in all_files:
        basename = file_path.stem

        # Find CSV row
        row = csv_rows.get(basename)
        if not row:
            print(f"⚠  {basename}: no CSV entry found")
            continue

        # Extract text
        if file_path.suffix == '.pdf':
            extracted = extract_text_from_pdf(file_path)
        else:
            extracted = extract_text_from_html(file_path)

        # Generate markdown
        is_pdf = file_path.suffix == '.pdf'
        md = generate_markdown(row, extracted, has_png=is_pdf)

        # Write markdown
        md_path = LIBRARY_DIR / f"{basename}.md"
        try:
            md_path.write_text(md, encoding='utf-8')
            print(f"✅  {basename}.md")
            md_count += 1
        except Exception as e:
            errors.append(f"{basename}.md: {e}")
            print(f"❌  {basename}.md: {e}")
            continue

        # Generate PNG (PDFs only)
        if is_pdf:
            if generate_png_from_pdf(file_path, LIBRARY_DIR):
                print(f"   ✓ {basename}.png")
                png_count += 1
            else:
                print(f"   ✗ {basename}.png")

    # Summary
    print("\n" + "─" * 50)
    print(f"✅  Markdown summaries: {md_count}")
    print(f"✅  PNG previews:       {png_count} (PDFs only)")
    if errors:
        print(f"❌  Errors:            {len(errors)}")
        for e in errors:
            print(f"   - {e}")
    else:
        print(f"❌  Errors:            0")

if __name__ == '__main__':
    main()
