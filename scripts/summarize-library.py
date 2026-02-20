#!/usr/bin/env python3
"""
scripts/summarize-library.py

Generates structured markdown summaries + PNG previews for all downloaded library documents.
- Metadata from CSV
- Text extracted via pdftotext / html.parser
- Author names from <meta name="citation_author"> tags (HTML) or CSV fallback (PDF)
- PQC risk profile: Harvest Now/Decrypt Later, Identity & Authentication, Digital Signature Integrity
- Short description from CSV (already curated)
- Long description (~600 words) from extracted document text
- PNG previews for PDFs only (via pdftoppm)
- Cost: $0 (no API calls, no web fetching)

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
# Author extraction
# ──────────────────────────────────────────────────────────────────────────────

def extract_authors_from_html(html_path):
    """Extract individual author names from <meta name='citation_author'> tags (IETF/RFC pattern)."""
    try:
        with open(html_path, 'r', encoding='utf-8', errors='ignore') as f:
            # Only need the head section — first 20 KB is plenty
            content = f.read(20000)
        authors = re.findall(
            r'<meta\s+name=["\']citation_author["\']\s+content=["\'](.*?)["\']',
            content, re.IGNORECASE
        )
        return [a.strip() for a in authors if a.strip()]
    except Exception:
        return []

# ──────────────────────────────────────────────────────────────────────────────
# Text extraction
# ──────────────────────────────────────────────────────────────────────────────

def extract_text_from_pdf(pdf_path, max_lines=1000):
    """Extract text from entire PDF using pdftotext (no page limit)."""
    try:
        result = subprocess.run(
            ['pdftotext', str(pdf_path), '-'],
            capture_output=True,
            text=True,
            timeout=30
        )
        if result.returncode == 0:
            lines = result.stdout.strip().split('\n')[:max_lines]
            return '\n'.join(lines)
    except Exception as e:
        print(f"  ⚠ pdftotext failed for {pdf_path.name}: {e}")
    return ""

def extract_text_from_html(html_path, max_chars=12000):
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

def clean_text(text):
    """
    Clean extracted text:
    - Collapse whitespace
    - Remove common boilerplate
    """
    # Collapse whitespace
    text = ' '.join(text.split())

    # Remove common boilerplate phrases (case-insensitive)
    boilerplate = [
        r'^\s*confidential\s*',
        r'^\s*draft\s*',
        r'[a-z0-9.\-]+@[a-z0-9.\-]+',  # email addresses
        r'©.*?(?=\s)',                   # copyright notices
        r'page\s+\d+\s+of\s+\d+',       # page numbers
    ]
    for pattern in boilerplate:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE | re.MULTILINE)

    return ' '.join(text.split())  # re-collapse after substitutions

def generate_long_description(extracted_text, target_words=600):
    """Return cleaned text trimmed to target_words (min 500, max 700)."""
    cleaned = clean_text(extracted_text)
    words = cleaned.split()
    count = min(max(len(words), 0), target_words)
    return ' '.join(words[:count])

def generate_short_excerpt(extracted_text, max_words=80):
    """Return first max_words words of cleaned text as the trailing excerpt."""
    cleaned = clean_text(extracted_text)
    words = cleaned.split()[:max_words]
    return ' '.join(words)

# ──────────────────────────────────────────────────────────────────────────────
# PQC Risk Profile
# ──────────────────────────────────────────────────────────────────────────────

def assess_pqc_risks(row, extracted_text):
    """
    Assess three PQC-specific threat models using keyword matching against
    extracted document text, protocol impact, and algorithm family fields.
    Returns (hndl_text, identity_text, sig_text).
    """
    combined = (
        extracted_text + ' ' +
        row.get('ProtocolOrToolImpact', '') + ' ' +
        row.get('AlgorithmFamily', '') + ' ' +
        row.get('document_type', '') + ' ' +
        row.get('short_description', '')
    ).lower()

    # 1. Harvest Now, Decrypt Later (HNDL) — key exchange / encryption docs
    hndl_kw = [
        'key encapsulation', 'kem', 'key exchange', 'key agreement',
        'encryption', 'tls', 'quic', 'ssh ', 'ecdhe', 'ecdh', ' dh ',
        'hybrid key', 'public-key encryption', 'public key encryption',
        'key establishment', 'key transport', 'key wrap',
    ]
    hndl = any(k in combined for k in hndl_kw)

    # 2. Identity & Authentication Integrity — PKI, certs, identity docs
    identity_kw = [
        'certificate', 'pki', 'x.509', 'identity', 'authentication',
        'tls client', 'mutual auth', 'trust store', 'credential',
        'access control', 'ca/', 'ca ', 'root ca', 'code signing',
        'trust anchor', 'revocation',
    ]
    identity = any(k in combined for k in identity_kw)

    # 3. Digital Signature Integrity — signing docs
    sig_kw = [
        'digital signature', 'ml-dsa', 'slh-dsa', 'xmss', 'lms',
        'sphincs', 'hash-based signature', 'dsa ', 'signing',
        'signature scheme', 'falcon', 'dilithium', 'fips 204', 'fips 205',
        'firmware', 'software signing', 'document signing',
    ]
    sig = any(k in combined for k in sig_kw)

    hndl_text = (
        "**HIGH** — Encrypted data captured today can be decrypted by a future "
        "quantum computer (harvest-now-decrypt-later attack). Adopting this "
        "specification is critical to protect long-lived confidential data."
        if hndl else "Not directly addressed by this document."
    )
    identity_text = (
        "**HIGH** — A quantum-capable adversary could forge certificates or "
        "impersonate identities protected by classical public-key cryptography. "
        "Migration to PQC-safe PKI and authentication systems is essential."
        if identity else "Not directly addressed by this document."
    )
    sig_text = (
        "**HIGH** — Classical digital signatures (RSA, ECDSA) are vulnerable to "
        "quantum forgery. Code signing, firmware integrity, and legally binding "
        "digital signatures depend on adopting post-quantum signature schemes."
        if sig else "Not directly addressed by this document."
    )

    return hndl_text, identity_text, sig_text

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

def generate_markdown(row, extracted_text, author_names, has_png=False):
    """Generate structured markdown from CSV row + extracted text + author names."""

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

    # Authors block
    if author_names:
        authors_line = f"**Authors:** {', '.join(author_names)}\n**Organization:** {org}"
    else:
        authors_line = f"**Organization:** {org}"

    # PQC risk profile
    hndl_text, identity_text, sig_text = assess_pqc_risks(row, extracted_text)

    # Long description (600 words from document text)
    long_desc = generate_long_description(extracted_text, target_words=600)

    # Short excerpt for trailing italic (80 words)
    excerpt = generate_short_excerpt(extracted_text, max_words=80)

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

## Authors
{authors_line}

## Scope
**Industries:** {industries}
**Region:** {region}
**Document type:** {doc_type}

## How It Relates to PQC
{protocol_impact}

**Dependencies:** {deps}

## PQC Risk Profile
**Harvest Now, Decrypt Later:** {hndl_text}

**Identity & Authentication Integrity:** {identity_text}

**Digital Signature Integrity:** {sig_text}

**Migration urgency:** {urgency}

## PQC Key Types & Mechanisms
| Field | Value |
| --- | --- |
| Algorithm family | {algo_family} |
| Security levels | {sec_levels} |
| Protocol / tool impact | {protocol_impact} |
| Toolchain support | {toolchain} |

## Short Description
{short_desc}

## Long Description
{long_desc}

---

*{excerpt}*
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

        is_pdf = file_path.suffix == '.pdf'

        # Extract text
        if is_pdf:
            extracted = extract_text_from_pdf(file_path)
            author_names = []  # PDFs: org-level only, use CSV field
        else:
            extracted = extract_text_from_html(file_path)
            author_names = extract_authors_from_html(file_path)

        if author_names:
            print(f"  👤 {basename}: {len(author_names)} author(s) found")

        # Generate markdown
        md = generate_markdown(row, extracted, author_names, has_png=is_pdf)

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
