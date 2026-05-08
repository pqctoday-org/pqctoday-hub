#!/usr/bin/env python3
"""
scripts/enrich-ir8477-xwalk.py

Extracts candidate IR 8477 semantic relationships from library source documents
using a local Ollama LLM (qwen3.6:27b). Outputs a dated candidate CSV for SME
review before merging into the production concept_xwalks_MMDDYYYY.csv.

IR 8477 relationship types (closed set):
  subset_of       — from_concept's scope is a subset of to_concept's scope
  superset_of     — from_concept's scope is a superset of to_concept's scope
  equivalent      — from_concept and to_concept define the same requirements
  intersects_with — from_concept and to_concept overlap but neither contains the other
  not_related     — explicitly documented as unrelated (rare; omit unless stated)

Rationale types:
  technical_dependency    — from_concept technically requires or builds on to_concept
  policy_reference        — from_concept cites to_concept as a policy/regulatory anchor
  implementation_guidance — from_concept provides implementation guidance for to_concept
  equivalence             — from_concept and to_concept define equivalent requirements
  specialization          — from_concept is a specialization/profile of to_concept
  timeline_anchor         — from_concept's publication is anchored to a timeline event

Output:
  src/data/concept_xwalk_candidates_MMDDYYYY.csv
  (one row per extracted relationship, review_status=candidate)

Workflow:
  1. Run this script to generate candidates
  2. Open the candidate CSV, review each row, set review_status=accepted or rejected
  3. Copy accepted rows (with new xwalk_id) into concept_xwalks_MMDDYYYY.csv

Usage:
  python3 scripts/enrich-ir8477-xwalk.py
  python3 scripts/enrich-ir8477-xwalk.py --dry-run
  python3 scripts/enrich-ir8477-xwalk.py --limit 20
  python3 scripts/enrich-ir8477-xwalk.py --skip-existing
  python3 scripts/enrich-ir8477-xwalk.py --limit 20 --skip-existing --append
  python3 scripts/enrich-ir8477-xwalk.py --from-id NIST-CSWP-39,FIPS-203
  python3 scripts/enrich-ir8477-xwalk.py --verbose

Requires:
  Ollama running locally (http://localhost:11434)
  Model pulled: ollama pull qwen3.6:27b
"""

from __future__ import annotations
import argparse
import csv
import json
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime
from html.parser import HTMLParser
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

ROOT = Path(__file__).parent.parent
DATA_DIR = ROOT / 'src' / 'data'
PUBLIC_DIR = ROOT / 'public'
OUTPUT_DIR = DATA_DIR

OLLAMA_BASE = 'http://localhost:11434'
DEFAULT_MODEL = 'qwen3.6:27b'

TODAY = datetime.now().strftime('%m%d%Y')

# ---------------------------------------------------------------------------
# IR 8477 constants
# ---------------------------------------------------------------------------

VALID_RELATIONSHIP_TYPES = {'subset_of', 'superset_of', 'equivalent', 'intersects_with', 'not_related'}
VALID_RATIONALE_TYPES = {
    'technical_dependency', 'policy_reference', 'implementation_guidance',
    'equivalence', 'specialization', 'timeline_anchor',
}
VALID_CONFIDENCE = {'high', 'medium', 'low'}

# Mapping from relationship_type → likely rationale_types (used as hint + fallback)
RELATIONSHIP_TO_RATIONALE: dict[str, str] = {
    'subset_of': 'specialization',
    'superset_of': 'policy_reference',
    'equivalent': 'equivalence',
    'intersects_with': 'technical_dependency',
    'not_related': 'policy_reference',
}

# ---------------------------------------------------------------------------
# HTML text extractor (same as enrich-docs-ollama.py)
# ---------------------------------------------------------------------------

class HTMLTextExtractor(HTMLParser):
    _VOID_ELEMENTS = frozenset({
        'area', 'base', 'br', 'col', 'embed', 'hr', 'img',
        'input', 'link', 'meta', 'param', 'source', 'track', 'wbr',
    })
    _SKIP_ELEMENTS = frozenset({'script', 'style', 'noscript', 'head'})

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self._parts: list[str] = []
        self._skip_depth = 0

    def handle_starttag(self, tag, attrs):
        if tag in self._SKIP_ELEMENTS:
            self._skip_depth += 1
        if tag == 'br' and self._skip_depth == 0:
            self._parts.append('\n')

    def handle_endtag(self, tag):
        if tag in self._SKIP_ELEMENTS:
            self._skip_depth = max(0, self._skip_depth - 1)
        if tag in ('p', 'div', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                   'section', 'article', 'tr') and self._skip_depth == 0:
            self._parts.append('\n')

    def handle_data(self, data):
        if self._skip_depth == 0:
            self._parts.append(data)

    def get_text(self) -> str:
        raw = ''.join(self._parts)
        lines = [ln.strip() for ln in raw.splitlines()]
        lines = [ln for ln in lines if ln]
        return '\n'.join(lines)


def extract_text_from_html(html_path: Path, max_chars: int = 12000) -> str:
    try:
        with open(html_path, 'r', encoding='utf-8', errors='ignore') as f:
            parser = HTMLTextExtractor()
            parser.feed(f.read())
            return parser.get_text()[:max_chars]
    except Exception as e:
        print(f'  ⚠  HTML parse failed {html_path.name}: {e}')
    return ''


def extract_text_from_pdf(pdf_path: Path, max_lines: int = 400) -> str:
    import shutil
    cmd = shutil.which('pdftotext') or '/opt/homebrew/bin/pdftotext'
    try:
        result = subprocess.run(
            [cmd, '-l', '15', str(pdf_path), '-'],
            capture_output=True, text=True, timeout=30,
        )
        if result.returncode == 0:
            lines = result.stdout.strip().split('\n')[:max_lines]
            return '\n'.join(lines)[:12000]
    except FileNotFoundError:
        pass
    except Exception as e:
        print(f'  ⚠  pdftotext failed {pdf_path.name}: {e}')
    return ''


def extract_text(file_path: Path | None) -> str:
    if file_path is None or not file_path.exists():
        return ''
    suffix = file_path.suffix.lower()
    if suffix in ('.html', '.htm'):
        return extract_text_from_html(file_path)
    elif suffix == '.pdf':
        return extract_text_from_pdf(file_path)
    return ''


def validate_extracted_text(text: str, file_path: Path) -> str | None:
    text_len = len(text)
    file_size = file_path.stat().st_size if file_path.exists() else 0
    if text_len < 100:
        return f'Text too short ({text_len} chars)'
    first_500 = text[:500].lower()
    for sentinel in ('page not found', '404 not found', 'access denied', 'forbidden',
                     'please enable javascript', 'under maintenance'):
        if sentinel in first_500:
            return f'Error page: "{sentinel}" in first 500 chars'
    non_ws = sum(1 for c in text if not c.isspace())
    if non_ws / text_len < 0.3:
        return f'Low content density ({non_ws / text_len:.1%} non-whitespace)'
    if file_size < 5120 and text_len < 50:
        return f'JS stub ({file_size}B file, {text_len} chars extracted)'
    return None

# ---------------------------------------------------------------------------
# CSV utilities
# ---------------------------------------------------------------------------

def find_latest_csv(prefix: str) -> Path | None:
    files = [f for f in DATA_DIR.glob(f'{prefix}*.csv') if 'archive' not in str(f)]
    if not files:
        return None

    def date_key(f: Path) -> tuple[int, int]:
        m = re.search(r'(\d{2})(\d{2})(\d{4})(_r(\d+))?\.csv$', f.name)
        if not m:
            return (0, 0)
        mm, dd, yyyy = m.group(1), m.group(2), m.group(3)
        rev = int(m.group(5)) if m.group(5) else 0
        return (int(yyyy + mm + dd), rev)

    return max(files, key=date_key)


def load_library_records() -> list[dict]:
    path = find_latest_csv('library_')
    if not path:
        print('ERROR: No library CSV found', file=sys.stderr)
        sys.exit(1)
    print(f'Loading library: {path.name}')
    with open(path, newline='', encoding='utf-8') as f:
        return list(csv.DictReader(f))


def load_existing_xwalk_pairs() -> set[tuple[str, str]]:
    """Return all (from_concept, to_concept) pairs in the current xwalk CSV."""
    pairs: set[tuple[str, str]] = set()
    path = find_latest_csv('concept_xwalks_')
    if not path:
        return pairs
    with open(path, newline='', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            fc = row.get('from_concept', '').strip()
            tc = row.get('to_concept', '').strip()
            if fc and tc:
                pairs.add((fc, tc))
                pairs.add((tc, fc))  # treat as undirected for skip purposes
    print(f'Loaded {len(pairs) // 2} existing xwalk edges from {path.name}')
    return pairs


def load_candidate_pairs(candidate_path: Path) -> set[tuple[str, str]]:
    """Return pairs already in the candidate output file (for --skip-existing)."""
    pairs: set[tuple[str, str]] = set()
    if not candidate_path.exists():
        return pairs
    with open(candidate_path, newline='', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            fc = row.get('from_concept', '').strip()
            tc = row.get('to_concept', '').strip()
            if fc and tc:
                pairs.add((fc, tc))
                pairs.add((tc, fc))
    return pairs


def load_processed_sources(candidate_path: Path) -> set[str]:
    """Return from_concept values already processed (for resume logic)."""
    processed: set[str] = set()
    if not candidate_path.exists():
        return processed
    with open(candidate_path, newline='', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            fc = row.get('from_concept', '').strip()
            if fc:
                processed.add(fc)
    return processed


# ---------------------------------------------------------------------------
# LLM prompts
# ---------------------------------------------------------------------------

SYSTEM_MESSAGE = (
    'You are an expert in post-quantum cryptography standards and NIST IR 8477 '
    '("Cataloging PQC Standards, Algorithms, and Security Requirements Relationships"). '
    'You extract precise semantic relationships between cryptographic standards. '
    'You always ground your answers in direct evidence from the source text. '
    'You never hallucinate standard names or relationship types. '
    'If a relationship is ambiguous or not clearly supported by the text, you omit it.'
)

EXTRACTION_PROMPT = '''Analyze the following PQC standards document and extract all explicit or strongly implied semantic relationships between "{from_id}" and OTHER PQC standards, algorithms, or guidance documents.

Document: {title}
Description: {description}

SOURCE TEXT (first ~12,000 chars):
---
{text}
---

KNOWN STANDARDS CATALOG (use these exact IDs for to_concept):
{known_ids_sample}

TASK: For each relationship you find between "{from_id}" and another standard/document, output EXACTLY this format (one block per relationship, separated by "---"):

RELATIONSHIP:
- to_concept: <exact reference_id from catalog above, or best matching standard name>
- relationship_type: <one of: subset_of | superset_of | equivalent | intersects_with | not_related>
- rationale_type: <one of: technical_dependency | policy_reference | implementation_guidance | equivalence | specialization | timeline_anchor>
- evidence: <exact quote or paraphrase from the text, max 300 chars, that proves this relationship>
- confidence: <high | medium | low>
- notes: <optional: why you chose this type, or any caveats>

RULES:
1. Only output relationships clearly supported by the source text
2. "subset_of" = {from_id} is a narrower/more-specific version of to_concept
3. "superset_of" = {from_id} is broader/more-general than to_concept
4. "equivalent" = {from_id} and to_concept define the same requirements for the same scope
5. "intersects_with" = both standards overlap but neither contains the other (most common)
6. Use "not_related" ONLY if the text explicitly states they are unrelated
7. "evidence" MUST be a direct quote or close paraphrase from the text, not your own words
8. Omit any relationship where confidence would be low unless it is strongly implied
9. Maximum 10 relationships per document
10. If no clear relationships exist, output: NO_RELATIONSHIPS_FOUND

Output the relationships now:'''


# ---------------------------------------------------------------------------
# Ollama call + response parser
# ---------------------------------------------------------------------------

def call_ollama(model: str, prompt: str, verbose: bool = False) -> str:
    payload = json.dumps({
        'model': model,
        'messages': [
            {'role': 'system', 'content': SYSTEM_MESSAGE},
            {'role': 'user', 'content': prompt},
        ],
        'stream': False,
        'options': {
            'num_predict': 2048,
            'temperature': 0.0,
        },
        'think': False,
    }).encode()

    for attempt in range(3):
        try:
            req = urllib.request.Request(
                f'{OLLAMA_BASE}/api/chat',
                data=payload,
                headers={'Content-Type': 'application/json'},
                method='POST',
            )
            with urllib.request.urlopen(req, timeout=300) as resp:
                data = json.loads(resp.read().decode())
                raw = data.get('message', {}).get('content', '').strip()
                # Strip <think> blocks from Qwen3
                cleaned = re.sub(r'<think>.*?</think>', '', raw, flags=re.DOTALL).strip()
                if verbose:
                    print(f'    [response: {len(cleaned)} chars]')
                    print('    | ' + cleaned[:600].replace('\n', '\n    | '))
                return cleaned
        except urllib.error.URLError as e:
            if attempt < 2:
                print(f'  ⚠  Ollama connection error (attempt {attempt + 1}/3): {e}')
                time.sleep(5)
            else:
                print(f'  ✗  Ollama failed: {e}')
                return ''
        except Exception as e:
            print(f'  ✗  Unexpected error: {e}')
            return ''
    return ''


def parse_relationships(raw: str, from_id: str, valid_to_ids: set[str]) -> list[dict]:
    """Parse LLM output into a list of relationship dicts."""
    if not raw or 'NO_RELATIONSHIPS_FOUND' in raw:
        return []

    relationships = []
    # Split on RELATIONSHIP: blocks
    blocks = re.split(r'(?:^|\n)RELATIONSHIP:\s*\n', raw, flags=re.MULTILINE)

    for block in blocks:
        if not block.strip():
            continue
        # Extract fields using regex
        def field(name: str) -> str:
            m = re.search(rf'^-\s+{re.escape(name)}:\s*(.+)$', block, re.MULTILINE)
            return m.group(1).strip() if m else ''

        to_concept = field('to_concept')
        relationship_type = field('relationship_type').lower().replace(' ', '_')
        rationale_type = field('rationale_type').lower().replace(' ', '_')
        evidence = field('evidence')
        confidence = field('confidence').lower()
        notes = field('notes')

        # Skip if missing required fields
        if not to_concept or not relationship_type or not evidence:
            continue

        # Skip self-references
        if to_concept.strip() == from_id.strip():
            continue

        # Validate relationship_type
        if relationship_type not in VALID_RELATIONSHIP_TYPES:
            # Try fuzzy fix
            for vt in VALID_RELATIONSHIP_TYPES:
                if vt.replace('_', '') in relationship_type.replace('_', ''):
                    relationship_type = vt
                    break
            else:
                continue  # Skip invalid

        # Validate rationale_type with fallback
        if rationale_type not in VALID_RATIONALE_TYPES:
            rationale_type = RELATIONSHIP_TO_RATIONALE.get(relationship_type, 'technical_dependency')

        # Validate confidence with fallback
        if confidence not in VALID_CONFIDENCE:
            confidence = 'medium'

        # Normalize to_concept: prefer exact match in known IDs
        to_concept_normalized = to_concept
        to_lower = to_concept.lower()
        for known_id in valid_to_ids:
            if known_id.lower() == to_lower or known_id.lower().replace('-', ' ') == to_lower:
                to_concept_normalized = known_id
                break

        relationships.append({
            'to_concept': to_concept_normalized,
            'relationship_type': relationship_type,
            'rationale_type': rationale_type,
            'evidence': evidence[:400],  # cap evidence length
            'confidence': confidence,
            'notes': notes[:200] if notes else '',
        })

    # Deduplicate by to_concept (keep first occurrence)
    seen: set[str] = set()
    deduped = []
    for r in relationships:
        key = r['to_concept'].lower()
        if key not in seen:
            seen.add(key)
            deduped.append(r)

    return deduped[:10]  # max 10 per document


# ---------------------------------------------------------------------------
# Output CSV writer
# ---------------------------------------------------------------------------

CANDIDATE_FIELDNAMES = [
    'from_concept',
    'to_concept',
    'relationship_type',
    'rationale_type',
    'evidence',
    'confidence',
    'notes',
    'extraction_source',   # which local_file was used
    'extracted_at',        # ISO timestamp
    'review_status',       # 'candidate' → reviewer sets 'accepted' or 'rejected'
    'reviewed_by',         # filled in by reviewer
    'reviewed_date',       # filled in by reviewer
]


def write_candidates(
    out_path: Path,
    rows: list[dict],
    append: bool = False,
) -> None:
    mode = 'a' if append and out_path.exists() else 'w'
    with open(out_path, mode, newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=CANDIDATE_FIELDNAMES, extrasaction='ignore')
        if mode == 'w':
            writer.writeheader()
        writer.writerows(rows)


# ---------------------------------------------------------------------------
# Main extraction loop
# ---------------------------------------------------------------------------

def build_known_ids_sample(library_records: list[dict], limit: int = 200) -> str:
    """Build a compact list of known standard IDs for the prompt context."""
    ids = [r['reference_id'] for r in library_records if r.get('reference_id')]
    # Prioritise well-known standards (short IDs, no URL-like patterns)
    short = [i for i in ids if len(i) < 40]
    rest = [i for i in ids if len(i) >= 40]
    sample = (short + rest)[:limit]
    return '\n'.join(f'  - {i}' for i in sorted(sample))


def run_extraction(args: argparse.Namespace) -> None:
    library_records = load_library_records()
    existing_pairs = load_existing_xwalk_pairs()

    out_path = OUTPUT_DIR / f'concept_xwalk_candidates_{TODAY}.csv'
    if args.append and out_path.exists():
        print(f'Appending to existing candidate file: {out_path.name}')
    else:
        print(f'Writing candidates to: {out_path.name}')

    candidate_pairs = load_candidate_pairs(out_path) if args.skip_existing else set()
    processed_sources = load_processed_sources(out_path) if args.skip_existing else set()

    known_ids = {r['reference_id'] for r in library_records if r.get('reference_id')}
    known_ids_sample = build_known_ids_sample(library_records)

    # Filter to records with local files (have source text to analyze)
    eligible = [
        r for r in library_records
        if r.get('local_file') and r.get('reference_id')
    ]

    # Filter by --from-id if specified
    if args.from_id:
        target_ids = {i.strip() for i in args.from_id.split(',')}
        eligible = [r for r in eligible if r['reference_id'] in target_ids]
        print(f'Filtered to {len(eligible)} records matching --from-id')

    # Apply --skip-existing: skip from_concepts already processed
    if args.skip_existing and processed_sources:
        before = len(eligible)
        eligible = [r for r in eligible if r['reference_id'] not in processed_sources]
        print(f'Skipped {before - len(eligible)} already-processed sources')

    # Apply --limit
    if args.limit > 0:
        eligible = eligible[:args.limit]

    print(f'\nProcessing {len(eligible)} library records...\n')

    total_candidates = 0
    for i, record in enumerate(eligible, 1):
        ref_id = record['reference_id']
        title = record.get('document_title', ref_id)
        description = record.get('short_description', '')
        local_file = record.get('local_file', '').strip()

        print(f'[{i}/{len(eligible)}] {ref_id}')
        if args.dry_run:
            print(f'  → DRY RUN: would process {local_file}')
            continue

        # Resolve local file path
        file_path: Path | None = None
        if local_file:
            candidate_path = ROOT / local_file
            if candidate_path.exists():
                file_path = candidate_path
            else:
                # Try public/ prefix
                candidate_path2 = PUBLIC_DIR / local_file.replace('public/', '')
                if candidate_path2.exists():
                    file_path = candidate_path2

        if file_path is None:
            print(f'  ⚠  Local file not found: {local_file}')
            # Still attempt extraction with description only if verbose
            text = ''
        else:
            text = extract_text(file_path)

        if text:
            quality_err = validate_extracted_text(text, file_path)
            if quality_err:
                print(f'  ⚠  Quality gate failed: {quality_err}')
                text = ''

        if not text and not description:
            print(f'  ✗  No usable text — skipping')
            continue

        if not text:
            print(f'  ℹ  Using description only (no source text)')

        # Build prompt
        prompt = EXTRACTION_PROMPT.format(
            from_id=ref_id,
            title=title,
            description=description[:400],
            text=text if text else '(No source text available — use description above)',
            known_ids_sample=known_ids_sample,
        )

        # Call LLM
        t0 = time.time()
        raw_response = call_ollama(args.model, prompt, verbose=args.verbose)
        elapsed = time.time() - t0

        if not raw_response:
            print(f'  ✗  No response from Ollama')
            continue

        # Parse relationships
        rels = parse_relationships(raw_response, ref_id, known_ids)
        print(f'  → {len(rels)} relationships found ({elapsed:.1f}s)')

        # Filter out already-existing pairs
        new_rels = []
        for rel in rels:
            pair = (ref_id, rel['to_concept'])
            rev_pair = (rel['to_concept'], ref_id)
            if pair in existing_pairs or rev_pair in existing_pairs:
                print(f'    ↳ skip (already in xwalk): {rel["to_concept"]}')
                continue
            if args.skip_existing and (pair in candidate_pairs or rev_pair in candidate_pairs):
                print(f'    ↳ skip (already candidate): {rel["to_concept"]}')
                continue
            new_rels.append(rel)

        if new_rels:
            ts = datetime.utcnow().isoformat() + 'Z'
            out_rows = [
                {
                    'from_concept': ref_id,
                    'to_concept': r['to_concept'],
                    'relationship_type': r['relationship_type'],
                    'rationale_type': r['rationale_type'],
                    'evidence': r['evidence'],
                    'confidence': r['confidence'],
                    'notes': r['notes'],
                    'extraction_source': local_file,
                    'extracted_at': ts,
                    'review_status': 'candidate',
                    'reviewed_by': '',
                    'reviewed_date': '',
                }
                for r in new_rels
            ]
            write_candidates(out_path, out_rows, append=(i > 1 or (args.append and out_path.exists())))
            total_candidates += len(out_rows)

            for r in new_rels:
                rt = r['relationship_type']
                tc = r['to_concept']
                conf = r['confidence']
                print(f'    ✓ [{rt}] → {tc} ({conf})')

            # Update candidate_pairs so subsequent docs don't re-extract same pair
            for r in new_rels:
                candidate_pairs.add((ref_id, r['to_concept']))
                candidate_pairs.add((r['to_concept'], ref_id))
        elif rels:
            print(f'  ↳ all {len(rels)} already exist — nothing new')

    print(f'\n{"=" * 60}')
    print(f'Done. {total_candidates} new candidate edges written to:')
    print(f'  {out_path}')
    print()
    print('Next steps:')
    print('  1. Open the candidate CSV')
    print('  2. Set review_status = "accepted" or "rejected" for each row')
    print('  3. Set reviewed_by = your name, reviewed_date = today')
    print('  4. Run: python3 scripts/merge-xwalk-candidates.py (merges accepted rows)')


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description='Extract IR 8477 candidate relationships from library source documents',
    )
    parser.add_argument('--dry-run', action='store_true',
                        help='List documents without calling Ollama')
    parser.add_argument('--limit', type=int, default=0,
                        help='Max documents to process (0 = all)')
    parser.add_argument('--skip-existing', action='store_true',
                        help='Skip from_concepts already in today\'s candidate file')
    parser.add_argument('--append', action='store_true',
                        help='Append to existing candidate file instead of overwriting')
    parser.add_argument('--from-id', type=str, default='',
                        help='Comma-separated reference_ids to process (bypass limit)')
    parser.add_argument('--model', type=str, default=DEFAULT_MODEL,
                        help=f'Ollama model (default: {DEFAULT_MODEL})')
    parser.add_argument('--verbose', action='store_true',
                        help='Print raw LLM responses')
    args = parser.parse_args()

    print(f'IR 8477 Xwalk Enrichment — {TODAY}')
    print(f'Model: {args.model}')
    print()

    run_extraction(args)


if __name__ == '__main__':
    main()
