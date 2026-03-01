#!/usr/bin/env python3
"""
scripts/enrich-timeline-haiku.py

Re-enriches timeline documents using Claude Haiku for high-quality extraction of
11 semantic dimensions — matching the quality of library_doc_enrichments_*.md.

The regex fallback (enrich-public-docs.py) produced poor results for timeline entries
(~70% "None detected"). Haiku understands context and extracts richer information.

Source documents: public/timeline/ (already downloaded)
Output: src/data/doc-enrichments/timeline_doc_enrichments_MMDDYYYY.md

Usage:
  python3 scripts/enrich-timeline-haiku.py
  python3 scripts/enrich-timeline-haiku.py --dry-run
  python3 scripts/enrich-timeline-haiku.py --limit 5
  python3 scripts/enrich-timeline-haiku.py --skip-existing
  python3 scripts/enrich-timeline-haiku.py --output path/to/output.md

Requires:
  ANTHROPIC_API_KEY environment variable
  pip install anthropic
"""

import argparse
import csv
import json
import os
import re
import subprocess
import sys
import time
from datetime import datetime
from html.parser import HTMLParser
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

ROOT = Path(__file__).parent.parent
DATA_DIR = ROOT / 'src' / 'data'
PUBLIC_DIR = ROOT / 'public'
OUTPUT_DIR = DATA_DIR / 'doc-enrichments'
MANIFEST_PATH = PUBLIC_DIR / 'timeline' / 'manifest.json'

# ---------------------------------------------------------------------------
# HTML text extractor (reused from enrich-public-docs.py)
# ---------------------------------------------------------------------------

class HTMLTextExtractor(HTMLParser):
    _VOID_ELEMENTS = frozenset({
        'area', 'base', 'br', 'col', 'embed', 'hr', 'img',
        'input', 'link', 'meta', 'param', 'source', 'track', 'wbr',
    })

    def __init__(self):
        super().__init__()
        self.text = []
        self.skip_tags = {'script', 'style', 'noscript', 'head'}
        self._skip_depth = 0

    def handle_starttag(self, tag, attrs):
        if tag in self.skip_tags and tag not in self._VOID_ELEMENTS:
            self._skip_depth += 1

    def handle_endtag(self, tag):
        if tag in self.skip_tags and self._skip_depth > 0:
            self._skip_depth -= 1

    def handle_data(self, data):
        if self._skip_depth == 0:
            stripped = data.strip()
            if stripped:
                self.text.append(stripped)

    def get_text(self):
        return ' '.join(self.text)


def extract_text_from_html(html_path: Path, max_chars: int = 15000) -> str:
    try:
        with open(html_path, 'r', encoding='utf-8', errors='ignore') as f:
            parser = HTMLTextExtractor()
            parser.feed(f.read())
            text = parser.get_text()
            return text[:max_chars]
    except Exception as e:
        print(f'  ⚠  HTML parse failed {html_path.name}: {e}')
    return ''


def extract_text_from_pdf(pdf_path: Path, max_lines: int = 500) -> str:
    try:
        result = subprocess.run(
            ['pdftotext', '-l', '20', str(pdf_path), '-'],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode == 0:
            lines = result.stdout.strip().split('\n')[:max_lines]
            return '\n'.join(lines)[:15000]
    except FileNotFoundError:
        pass  # pdftotext not installed
    except Exception as e:
        print(f'  ⚠  pdftotext failed {pdf_path.name}: {e}')
    return ''


def extract_text(file_path: Path) -> str:
    if not file_path.exists():
        return ''
    suffix = file_path.suffix.lower()
    if suffix == '.html' or suffix == '.htm':
        return extract_text_from_html(file_path)
    elif suffix == '.pdf':
        return extract_text_from_pdf(file_path)
    return ''


# ---------------------------------------------------------------------------
# CSV utilities (reused pattern from enrich-public-docs.py)
# ---------------------------------------------------------------------------

def find_latest_csv(prefix: str) -> Path | None:
    files = list(DATA_DIR.glob(f'{prefix}*.csv'))
    if not files:
        return None

    def date_key(f: Path) -> int:
        m = re.search(r'(\d{2})(\d{2})(\d{4})\.csv$', f.name)
        if not m:
            return 0
        mm, dd, yyyy = m.groups()
        return int(yyyy + mm + dd)

    return max(files, key=date_key)


def load_timeline_csv() -> dict[str, dict]:
    """Load timeline CSV, keyed by '{Country}:{OrgName} — {Title}'."""
    csv_path = find_latest_csv('timeline_')
    if not csv_path:
        print('⚠  No timeline CSV found')
        return {}

    lookup: dict[str, dict] = {}
    try:
        with open(csv_path, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                country = row.get('Country', '').strip()
                org = row.get('OrgName', '').strip()
                title = row.get('Title', '').strip()
                if country and org and title:
                    key = f'{country}:{org} — {title}'
                    # Keep first occurrence if duplicates
                    if key not in lookup:
                        lookup[key] = row
    except Exception as e:
        print(f'⚠  CSV load failed: {e}')
    return lookup


# ---------------------------------------------------------------------------
# Existing enrichment loader (for --skip-existing)
# ---------------------------------------------------------------------------

def load_existing_enriched_labels() -> set[str]:
    """
    Returns labels that already have substantive enrichment data
    (at least one field that isn't 'None detected' or 'See document for details').
    """
    files = list(OUTPUT_DIR.glob('timeline_doc_enrichments_*.md'))
    if not files:
        return set()

    def date_key(f: Path) -> int:
        m = re.search(r'(\d{2})(\d{2})(\d{4})\.md$', f.name)
        if not m:
            return 0
        mm, dd, yyyy = m.groups()
        return int(yyyy + mm + dd)

    latest = max(files, key=date_key)
    enriched: set[str] = set()

    try:
        with open(latest, 'r', encoding='utf-8') as f:
            raw = f.read()

        sections = [s for s in raw.split('\n## ') if s.strip()]
        for section in sections:
            lines = section.strip().split('\n')
            label = lines[0].strip().lstrip('#').strip()
            if not label or label == '---':
                continue
            # Check if any dimension has real content
            has_content = False
            for line in lines[1:]:
                m = re.match(r'^-\s+\*\*([^*]+)\*\*:\s*(.+)$', line)
                if m:
                    field = m.group(1).strip()
                    value = m.group(2).strip()
                    skip_fields = {
                        'Reference ID', 'Title', 'Authors',
                        'Publication Date', 'Last Updated', 'Document Status'
                    }
                    if field not in skip_fields:
                        if value not in ('None detected', 'See document for details.',
                                         'Not specified', 'See document'):
                            has_content = True
                            break
            if has_content:
                enriched.add(label)
    except Exception as e:
        print(f'⚠  Could not load existing enrichments: {e}')

    return enriched


# ---------------------------------------------------------------------------
# Claude Haiku enrichment
# ---------------------------------------------------------------------------

PROMPT_TEMPLATE = """You are analyzing a PQC (Post-Quantum Cryptography) policy or industry document.
Extract the following dimensions from the document text. Respond ONLY with the bullet list below — no preamble, no explanation.

Use exactly these field names and formats:
- **Main Topic**: One sentence ≤250 chars describing what this document is about.
- **PQC Algorithms Covered**: Comma-separated algorithm names (ML-KEM, ML-DSA, SLH-DSA, FN-DSA, Falcon, CRYSTALS-Kyber, CRYSTALS-Dilithium, FrodoKEM, Classic McEliece, BIKE, HQC, XMSS, LMS, FIPS 203, FIPS 204, FIPS 205, etc.) or "None detected"
- **Quantum Threats Addressed**: Comma-separated threat names (CRQC, HNDL, HNFL, Shor's Algorithm, Grover's Algorithm, Harvest Now Decrypt Later, Quantum Advantage, Quantum Computer, Post-Quantum, etc.) or "None detected"
- **Migration Timeline Info**: "Milestones: phrase1 | phrase2 | phrase3" where each phrase ≤120 chars includes a year AND context (e.g. "2030: RSA/ECC use prohibited in classified systems" or "By 2025: agencies must complete cryptographic inventory"). Or "None detected".
- **Applicable Regions / Bodies**: "Regions: X, Y; Bodies: A, B" (comma-separated within each group) or "None detected"
- **Leaders Contributions Mentioned**: Comma-separated full names of named individuals or "None detected"
- **PQC Products Mentioned**: Comma-separated product/tool/library names (OpenSSL, liboqs, AWS-LC, BoringSSL, Bouncy Castle, etc.) or "None detected"
- **Protocols Covered**: Comma-separated protocol names (TLS 1.3, TLS, SSH, IPsec, IKEv2, HTTPS, QUIC, S/MIME, X.509, PKCS#11, JOSE, JWT, DNSSEC, etc.) or "None detected"
- **Infrastructure Layers**: Comma-separated layers (PKI, HSM, TPM, Cloud, IoT, VPN, Key Management, Firmware, Code Signing, 5G, OT/ICS/SCADA, Blockchain, etc.) or "None detected"
- **Standardization Bodies**: Comma-separated org names (NIST, ETSI, IETF, ISO/IEC, ITU-T, IEEE, 3GPP, ENISA, BSI, ANSSI, NCSC, CCCS, MAS, CRYPTREC, etc.) or "None detected"
- **Compliance Frameworks Referenced**: Comma-separated framework names (FIPS 140-3, Common Criteria, CNSA 2.0, NSM-8, FedRAMP, GDPR, eIDAS 2.0, NIS2, DORA, HIPAA, PCI-DSS, ISO 27001, SP 800-57, etc.) or "None detected"

Document title: {title}
Document description: {description}

Document text (may be truncated):
{text}"""


def call_haiku(client, title: str, description: str, text: str, retries: int = 3) -> dict[str, str]:
    """Call Claude Haiku and parse the response into a field dict."""
    prompt = PROMPT_TEMPLATE.format(
        title=title,
        description=description[:500] if description else 'Not available',
        text=text if text else 'No text extracted from source document.'
    )

    for attempt in range(retries):
        try:
            message = client.messages.create(
                model='claude-haiku-4-5-20251001',
                max_tokens=1024,
                messages=[{'role': 'user', 'content': prompt}]
            )
            response = message.content[0].text.strip()
            return parse_haiku_response(response)
        except Exception as e:
            err_str = str(e)
            if '429' in err_str or 'rate' in err_str.lower():
                wait = (attempt + 1) * 30
                print(f'  ⏳ Rate limited — waiting {wait}s (attempt {attempt + 1}/{retries})')
                time.sleep(wait)
            elif attempt < retries - 1:
                print(f'  ⚠  API error (attempt {attempt + 1}/{retries}): {e}')
                time.sleep(5)
            else:
                print(f'  ✗  API failed after {retries} attempts: {e}')
                return {}

    return {}


def parse_haiku_response(response: str) -> dict[str, str]:
    """Parse Haiku bullet-list response into field name → value dict."""
    fields: dict[str, str] = {}
    for line in response.split('\n'):
        m = re.match(r'^-\s+\*\*([^*]+)\*\*:\s*(.+)$', line.strip())
        if m:
            fields[m.group(1).strip()] = m.group(2).strip()
    return fields


# ---------------------------------------------------------------------------
# Output formatting
# ---------------------------------------------------------------------------

FALLBACK = 'None detected'


def format_entry(label: str, csv_row: dict, fields: dict[str, str]) -> str:
    """Format one enrichment entry in the expected markdown format."""
    title = csv_row.get('Title', label).strip()
    org = csv_row.get('OrgFullName', csv_row.get('OrgName', 'See document')).strip()
    source_date = csv_row.get('SourceDate', 'Not specified').strip() or 'Not specified'
    status = csv_row.get('Status', 'Not specified').strip() or 'Not specified'

    def get(field: str) -> str:
        return fields.get(field, FALLBACK).strip() or FALLBACK

    lines = [
        f'## {label}',
        '',
        f'- **Reference ID**: {label}',
        f'- **Title**: {title}',
        f'- **Authors**: {org}',
        f'- **Publication Date**: {source_date}',
        f'- **Last Updated**: Not specified',
        f'- **Document Status**: {status}',
        f'- **Main Topic**: {get("Main Topic")}',
        f'- **PQC Algorithms Covered**: {get("PQC Algorithms Covered")}',
        f'- **Quantum Threats Addressed**: {get("Quantum Threats Addressed")}',
        f'- **Migration Timeline Info**: {get("Migration Timeline Info")}',
        f'- **Applicable Regions / Bodies**: {get("Applicable Regions / Bodies")}',
        f'- **Leaders Contributions Mentioned**: {get("Leaders Contributions Mentioned")}',
        f'- **PQC Products Mentioned**: {get("PQC Products Mentioned")}',
        f'- **Protocols Covered**: {get("Protocols Covered")}',
        f'- **Infrastructure Layers**: {get("Infrastructure Layers")}',
        f'- **Standardization Bodies**: {get("Standardization Bodies")}',
        f'- **Compliance Frameworks Referenced**: {get("Compliance Frameworks Referenced")}',
        '',
        '---',
        '',
    ]
    return '\n'.join(lines)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description='Re-enrich timeline documents using Claude Haiku'
    )
    parser.add_argument('--dry-run', action='store_true',
                        help='List documents to process without calling API')
    parser.add_argument('--limit', type=int, default=0,
                        help='Process only N documents (0 = all)')
    parser.add_argument('--skip-existing', action='store_true',
                        help='Skip entries already well-enriched in the latest enrichment file')
    parser.add_argument('--output', type=str, default='',
                        help='Override output file path')
    args = parser.parse_args()

    # Verify API key early (unless dry-run)
    api_key = os.environ.get('ANTHROPIC_API_KEY', '')
    if not args.dry_run and not api_key:
        print('✗  ANTHROPIC_API_KEY environment variable not set.')
        print('   Export it first: export ANTHROPIC_API_KEY=sk-ant-...')
        sys.exit(1)

    # Load manifest
    if not MANIFEST_PATH.exists():
        print(f'✗  Manifest not found: {MANIFEST_PATH}')
        sys.exit(1)

    with open(MANIFEST_PATH, 'r', encoding='utf-8') as f:
        manifest = json.load(f)

    entries = manifest.get('entries', [])
    print(f'📋 Manifest: {len(entries)} entries')

    # Filter to entries that have a downloaded file
    processable = [
        e for e in entries
        if e.get('file') and e.get('label')
        and Path(ROOT / e['file']).exists()
    ]
    print(f'📁 Entries with downloaded files: {len(processable)}')

    # Load CSV metadata
    csv_lookup = load_timeline_csv()
    print(f'📊 CSV rows loaded: {len(csv_lookup)}')

    # Optionally skip already-enriched
    skip_labels: set[str] = set()
    if args.skip_existing:
        skip_labels = load_existing_enriched_labels()
        print(f'⏭  Will skip {len(skip_labels)} already-enriched entries')

    # Apply skip filter
    to_process = [e for e in processable if e['label'] not in skip_labels]
    print(f'🎯 To process: {len(to_process)} entries')

    # Apply limit
    if args.limit > 0:
        to_process = to_process[:args.limit]
        print(f'🔢 Limited to: {len(to_process)} entries')

    if args.dry_run:
        print('\n--- DRY RUN — documents that would be processed ---')
        for i, entry in enumerate(to_process, 1):
            label = entry['label']
            file_path = ROOT / entry['file']
            in_csv = '✓' if label in csv_lookup else '✗ (no CSV match)'
            print(f'  {i:3}. {label}')
            print(f'       file: {file_path.name} ({in_csv})')
        print(f'\nTotal: {len(to_process)} documents would be processed')
        return

    # Output file
    today = datetime.now().strftime('%m%d%Y')
    output_path = Path(args.output) if args.output else OUTPUT_DIR / f'timeline_doc_enrichments_{today}.md'
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Init Anthropic client
    import anthropic
    client = anthropic.Anthropic(api_key=api_key)

    # Write output
    processed = 0
    skipped = 0
    failed = 0

    with open(output_path, 'w', encoding='utf-8') as out:
        # Write frontmatter header
        out.write('---\n')
        out.write(f'generated: {datetime.now().strftime("%Y-%m-%d")}\n')
        out.write('collection: timeline\n')
        out.write(f'documents_processed: {len(to_process)}\n')
        out.write('enrichment_method: claude-haiku\n')
        out.write('---\n\n')

        for i, entry in enumerate(to_process, 1):
            label = entry['label']
            file_path = ROOT / entry['file']

            print(f'\n[{i}/{len(to_process)}] {label}')
            print(f'  file: {file_path.name}')

            # Extract text
            text = extract_text(file_path)
            if not text:
                print(f'  ⚠  No text extracted — using description only')

            # Get CSV metadata
            csv_row = csv_lookup.get(label, {})
            if not csv_row:
                print(f'  ⚠  No CSV match for label — using label as title')
                # Parse label: "{Country}:{Org} — {Title}"
                m = re.match(r'^[^:]+:[^—]+—\s*(.+)$', label)
                csv_row = {
                    'Title': m.group(1).strip() if m else label,
                    'OrgName': '',
                    'OrgFullName': 'See document',
                    'SourceDate': 'Not specified',
                    'Status': 'Not specified',
                    'Description': '',
                }

            title = csv_row.get('Title', label)
            description = csv_row.get('Description', '')

            # Call Haiku
            print(f'  🤖 Calling Haiku...')
            fields = call_haiku(client, title, description, text)

            if not fields:
                print(f'  ✗  No fields extracted — writing empty entry')
                failed += 1
                out.write(format_entry(label, csv_row, {}))
                continue

            # Count non-empty dimensions
            dim_fields = [
                'PQC Algorithms Covered', 'Quantum Threats Addressed',
                'Migration Timeline Info', 'Applicable Regions / Bodies',
                'Leaders Contributions Mentioned', 'PQC Products Mentioned',
                'Protocols Covered', 'Infrastructure Layers',
                'Standardization Bodies', 'Compliance Frameworks Referenced',
            ]
            filled = sum(
                1 for f in dim_fields
                if fields.get(f, FALLBACK) not in (FALLBACK, '', 'None detected')
            )
            print(f'  ✓  {filled}/10 dimensions filled')

            out.write(format_entry(label, csv_row, fields))
            out.flush()
            processed += 1

            # Rate limit courtesy delay
            if i < len(to_process):
                time.sleep(1)

    print(f'\n{"=" * 60}')
    print(f'✅ Done — output: {output_path}')
    print(f'   Processed: {processed}')
    print(f'   Failed:    {failed}')
    print(f'   Skipped:   {skipped}')
    print()
    print('Next steps:')
    print('  1. Inspect the output file for quality')
    print('  2. Restart the dev server (import.meta.glob resolves at startup)')
    print('  3. Run: npm run generate-corpus  (update RAG index)')


if __name__ == '__main__':
    main()
