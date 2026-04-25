#!/usr/bin/env python3
"""
scripts/_enrichment_common.py

Shared helpers for CSWP.39 governance-requirements enrichment scripts
(enrich-tech-standards-ollama.py, enrich-cert-schemes-ollama.py,
enrich-compliance-fwks-ollama.py, enrich-std-bodies-ollama.py).

Factored out of enrich-docs-ollama.py to avoid duplication:
  - HTML / PDF text extraction
  - Extracted-text quality gate (sentinel checks)
  - Ollama HTTP client (JSON-response variant for the 5x4 maturity grid)
  - Latest-CSV discovery + library-ref FK index
  - CSV append (header-on-first-write)
  - Existing ref_id scan (for --skip-existing)
  - CSWP.39 vocabulary constants pinned to maturityModel.ts

Vocabulary comes from:
  src/components/PKILearning/modules/CryptoMgmtModernization/data/maturityModel.ts
"""

from __future__ import annotations

import csv
import json
import re
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import date
from html.parser import HTMLParser
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# Paths & defaults
# ---------------------------------------------------------------------------

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / 'src' / 'data'
PUBLIC_DIR = ROOT / 'public'
ENRICHMENT_DIR = DATA_DIR / 'doc-enrichments'

OLLAMA_BASE = 'http://localhost:11434'
DEFAULT_MODEL = 'qwen3.5:27b'

# ---------------------------------------------------------------------------
# CSWP.39 vocabulary (pinned to maturityModel.ts)
# ---------------------------------------------------------------------------

PILLAR_IDS: set[str] = {'inventory', 'governance', 'lifecycle', 'observability', 'assurance'}
MATURITY_LEVELS: set[int] = {1, 2, 3, 4}
ASSET_CLASSES: set[str] = {'certificates', 'libraries', 'software', 'keys', 'all'}
CATEGORIES: set[str] = {
    'Standardization Bodies',
    'Technical Standards',
    'Certification Schemes',
    'Compliance Frameworks',
}
CONFIDENCE_LEVELS: set[str] = {'high', 'medium', 'low'}

MATURITY_LEVEL_LABELS: dict[int, str] = {
    1: 'Partial',
    2: 'Risk-Informed',
    3: 'Repeatable',
    4: 'Adaptive',
}

PILLAR_LABELS: dict[str, str] = {
    'inventory': 'Inventory',
    'governance': 'Governance',
    'lifecycle': 'Lifecycle / CLM',
    'observability': 'Observability',
    'assurance': 'Assurance / FIPS',
}

CSV_COLUMNS: list[str] = [
    'ref_id',
    'source_name',
    'category',
    'source_type',
    'pillar',
    'maturity_level',
    'asset_class',
    'requirement',
    'evidence_quote',
    'evidence_location',
    'source_url',
    'confidence',
    'extraction_model',
    'extraction_date',
]

MAX_REQUIREMENT_CHARS = 240
MAX_EVIDENCE_CHARS = 400

# ---------------------------------------------------------------------------
# HTML / PDF text extraction (copied verbatim from enrich-docs-ollama.py)
# ---------------------------------------------------------------------------

class HTMLTextExtractor(HTMLParser):
    _VOID_ELEMENTS = frozenset({
        'area', 'base', 'br', 'col', 'embed', 'hr', 'img',
        'input', 'link', 'meta', 'param', 'source', 'track', 'wbr',
    })

    def __init__(self) -> None:
        super().__init__()
        self.text: list[str] = []
        self.skip_tags = {'script', 'style', 'noscript', 'head'}
        self._skip_depth = 0

    def handle_starttag(self, tag: str, attrs: list[Any]) -> None:
        if tag in self.skip_tags and tag not in self._VOID_ELEMENTS:
            self._skip_depth += 1

    def handle_endtag(self, tag: str) -> None:
        if tag in self.skip_tags and self._skip_depth > 0:
            self._skip_depth -= 1

    def handle_data(self, data: str) -> None:
        if self._skip_depth == 0:
            stripped = data.strip()
            if stripped:
                self.text.append(stripped)

    def get_text(self) -> str:
        return ' '.join(self.text)


def extract_text_from_html(html_path: Path, max_chars: int = 15000) -> str:
    try:
        with open(html_path, 'r', encoding='utf-8', errors='ignore') as f:
            parser = HTMLTextExtractor()
            parser.feed(f.read())
            return parser.get_text()[:max_chars]
    except Exception as e:
        print(f'  ⚠  HTML parse failed {html_path.name}: {e}')
    return ''


def extract_text_from_pdf(pdf_path: Path, max_pages: int = 20, max_chars: int = 15000) -> str:
    cmd = shutil.which('pdftotext') or '/opt/homebrew/bin/pdftotext'
    try:
        result = subprocess.run(
            [cmd, '-l', str(max_pages), str(pdf_path), '-'],
            capture_output=True, text=True, timeout=45
        )
        if result.returncode == 0:
            return result.stdout.strip()[:max_chars]
    except FileNotFoundError:
        print('  ⚠  pdftotext not installed (brew install poppler)')
    except Exception as e:
        print(f'  ⚠  pdftotext failed {pdf_path.name}: {e}')
    return ''


def extract_text(file_path: Path | None, *, max_chars: int = 15000, max_pages: int = 20) -> str:
    if file_path is None or not file_path.exists():
        return ''
    suffix = file_path.suffix.lower()
    if suffix in ('.html', '.htm'):
        return extract_text_from_html(file_path, max_chars=max_chars)
    if suffix == '.pdf':
        return extract_text_from_pdf(file_path, max_pages=max_pages, max_chars=max_chars)
    return ''


# ---------------------------------------------------------------------------
# Extracted-text quality gate (copied from enrich-docs-ollama.py)
# ---------------------------------------------------------------------------

_SENTINEL_STRINGS = [
    'page not found', '404 not found', '404 error',
    'this page does not exist', 'access denied', 'forbidden',
    'under maintenance', 'maintenance mode', 'site is currently unavailable',
    'please enable javascript', 'you need to enable javascript',
    # Anti-scraping / request-access stubs (ecfr.gov, federalregister.gov, etc.)
    'aggressive automated scraping', 'programmatic access to these sites',
    'request access', 'you have been blocked',
    # HTML maintenance pages served in place of PDFs
    '@import url(',  # catches base64 CSS embedded in stub HTML
]


def validate_extracted_text(text: str, file_path: Path) -> str | None:
    """Return None if text looks substantive; else an error description string."""
    text_len = len(text)
    file_size = file_path.stat().st_size if file_path.exists() else 0

    if text_len < 100:
        return f'Extracted text too short ({text_len} chars) — likely empty or corrupt source'

    first_500_lower = text[:500].lower()
    for sentinel in _SENTINEL_STRINGS:
        if sentinel in first_500_lower:
            return f'Error page detected: "{sentinel}" found in first 500 chars'

    non_ws = sum(1 for c in text if not c.isspace())
    ratio = non_ws / text_len if text_len > 0 else 0
    if ratio < 0.3:
        return f'Low content density ({ratio:.1%} non-whitespace) — likely style/script-only HTML'

    if file_size < 5120 and text_len < 50:
        return f'JS-rendered stub ({file_size} bytes file, {text_len} chars extracted)'

    if file_size > 1_048_576 and text_len < 100:
        return f'Word-export HTML ({file_size:,} bytes file, only {text_len} chars extracted)'

    return None


# ---------------------------------------------------------------------------
# CSV discovery + FK index
# ---------------------------------------------------------------------------

_DATE_RE = re.compile(r'(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$')


def find_latest_csv(prefix: str, data_dir: Path = DATA_DIR) -> Path | None:
    files = [f for f in data_dir.glob(f'{prefix}*.csv') if 'archive' not in str(f)]
    if not files:
        return None

    def date_key(f: Path) -> tuple[int, int]:
        m = _DATE_RE.search(f.name)
        if not m:
            return (0, 0)
        mm, dd, yyyy, rev = m.group(1), m.group(2), m.group(3), m.group(4)
        return (int(yyyy + mm + dd), int(rev) if rev else 0)

    return max(files, key=date_key)


def load_csv_rows(csv_path: Path) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    with open(csv_path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append({k: (v or '').strip() for k, v in row.items()})
    return rows


def load_library_ref_index() -> dict[str, dict[str, str]]:
    """Map reference_id → full library row (latest library_*.csv)."""
    latest = find_latest_csv('library_')
    if latest is None:
        print('  ✗  No library_*.csv found in src/data/')
        return {}
    print(f'  library index: {latest.name}')
    idx: dict[str, dict[str, str]] = {}
    for row in load_csv_rows(latest):
        ref = row.get('reference_id', '').strip()
        if ref:
            idx[ref] = row
    return idx


# ---------------------------------------------------------------------------
# Output CSV — append-per-day, header on first write
# ---------------------------------------------------------------------------

def output_csv_path(out_date: str | None = None) -> Path:
    """Return `src/data/pqc_maturity_governance_requirements_MMDDYYYY.csv`.
    If out_date is provided (YYYYMMDD), use it for replay; else today."""
    if out_date:
        if len(out_date) != 8 or not out_date.isdigit():
            raise ValueError(f'--out-date must be YYYYMMDD, got {out_date!r}')
        yyyy, mm, dd = out_date[0:4], out_date[4:6], out_date[6:8]
    else:
        today = date.today()
        yyyy = f'{today.year:04d}'
        mm = f'{today.month:02d}'
        dd = f'{today.day:02d}'
    filename = f'pqc_maturity_governance_requirements_{mm}{dd}{yyyy}.csv'
    return DATA_DIR / filename


def append_requirement_rows(csv_path: Path, rows: list[dict[str, Any]]) -> None:
    """Append rows; write header only if file does not exist or is empty."""
    if not rows:
        return
    write_header = not csv_path.exists() or csv_path.stat().st_size == 0
    with open(csv_path, 'a', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS, quoting=csv.QUOTE_MINIMAL)
        if write_header:
            writer.writeheader()
        for row in rows:
            writer.writerow({k: row.get(k, '') for k in CSV_COLUMNS})


def load_existing_ref_ids(csv_path: Path) -> set[str]:
    """Return the set of ref_ids already present in the output CSV (for --skip-existing)."""
    if not csv_path.exists():
        return set()
    ids: set[str] = set()
    with open(csv_path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            ref = (row.get('ref_id') or '').strip()
            if ref:
                ids.add(ref)
    return ids


# ---------------------------------------------------------------------------
# Ollama client — JSON-response variant
# ---------------------------------------------------------------------------

def call_ollama_json(
    model: str,
    system_prompt: str,
    user_prompt: str,
    *,
    num_predict: int = 6144,
    temperature: float = 0.0,
    retries: int = 2,
    timeout: int = 900,
    verbose: bool = False,
) -> dict[str, Any] | None:
    """POST to /api/chat, strip <think>…</think> leaks, parse a JSON object from the reply.

    Returns the parsed dict or None on failure. The caller is responsible for
    validating the shape of the returned JSON against its expected schema.
    """
    payload = json.dumps({
        'model': model,
        'messages': [
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': user_prompt},
        ],
        'stream': False,
        'options': {
            'num_predict': num_predict,
            'temperature': temperature,
        },
        'think': False,
        'format': 'json',
        'keep_alive': '30m',
    }).encode()

    for attempt in range(retries):
        try:
            req = urllib.request.Request(
                f'{OLLAMA_BASE}/api/chat',
                data=payload,
                headers={'Content-Type': 'application/json'},
                method='POST',
            )
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                data = json.loads(resp.read().decode())
                raw = data.get('message', {}).get('content', '').strip()
                if verbose:
                    print(f'    [raw {len(raw)} chars] {raw[:300].replace(chr(10)," ")}')
                cleaned = re.sub(r'<think>.*?</think>', '', raw, flags=re.DOTALL).strip()
                # The /api/chat `format: json` flag makes Ollama emit strict JSON,
                # but some models still wrap in ```json fences; strip them.
                cleaned = re.sub(r'^```(?:json)?\s*|\s*```$', '', cleaned, flags=re.MULTILINE).strip()
                if not cleaned:
                    return None
                return json.loads(cleaned)
        except (urllib.error.URLError, TimeoutError) as e:
            if attempt < retries - 1:
                print(f'  ⚠  Ollama connection error (attempt {attempt + 1}/{retries}): {e}')
                time.sleep(3)
            else:
                print(f'  ✗  Ollama failed after {retries} attempts: {e}')
        except json.JSONDecodeError as e:
            print(f'  ✗  JSON parse failed: {e}')
            if verbose:
                print(f'       raw tail: {raw[-300:]!r}')
            return None
        except Exception as e:
            if attempt < retries - 1:
                print(f'  ⚠  Error (attempt {attempt + 1}/{retries}): {e}')
                time.sleep(3)
            else:
                print(f'  ✗  Failed after {retries} attempts: {e}')

    return None


# ---------------------------------------------------------------------------
# Row validation
# ---------------------------------------------------------------------------

class ValidationError(Exception):
    pass


def validate_requirement(entry: dict[str, Any]) -> tuple[bool, str]:
    """Check a single LLM-emitted requirement dict. Returns (ok, reason)."""
    pillar = str(entry.get('pillar', '')).strip().lower()
    if pillar not in PILLAR_IDS:
        return False, f'pillar={pillar!r} not in PillarId enum'

    raw_level = entry.get('maturity_level', entry.get('tier'))
    try:
        level = int(raw_level)
    except (TypeError, ValueError):
        return False, f'maturity_level={raw_level!r} not coercible to int'
    if level not in MATURITY_LEVELS:
        return False, f'maturity_level={level} not in {{1,2,3,4}}'

    asset = str(entry.get('asset_class', 'all')).strip().lower()
    if asset not in ASSET_CLASSES:
        return False, f'asset_class={asset!r} not in {sorted(ASSET_CLASSES)}'

    req = str(entry.get('requirement', '')).strip()
    if not req:
        return False, 'requirement is empty'
    if len(req) > MAX_REQUIREMENT_CHARS * 2:
        return False, f'requirement too long ({len(req)} chars)'

    conf = str(entry.get('confidence', 'medium')).strip().lower()
    if conf not in CONFIDENCE_LEVELS:
        return False, f'confidence={conf!r} not in {sorted(CONFIDENCE_LEVELS)}'

    return True, ''


def truncate(text: str, limit: int) -> str:
    if len(text) <= limit:
        return text
    return text[: max(0, limit - 1)].rstrip() + '…'


def normalize_requirement_row(
    entry: dict[str, Any],
    *,
    ref_id: str,
    source_name: str,
    category: str,
    source_type: str,
    source_url: str,
    extraction_model: str,
    extraction_date: str,
) -> dict[str, Any]:
    """Turn a validated LLM entry into a CSV-ready row dict."""
    raw_level = entry.get('maturity_level', entry.get('tier'))
    return {
        'ref_id': ref_id,
        'source_name': source_name,
        'category': category,
        'source_type': source_type,
        'pillar': str(entry['pillar']).strip().lower(),
        'maturity_level': int(raw_level),
        'asset_class': str(entry.get('asset_class', 'all')).strip().lower(),
        'requirement': truncate(str(entry['requirement']).strip(), MAX_REQUIREMENT_CHARS),
        'evidence_quote': truncate(str(entry.get('evidence_quote', '')).strip(), MAX_EVIDENCE_CHARS),
        'evidence_location': str(entry.get('evidence_location', '')).strip(),
        'source_url': source_url,
        'confidence': str(entry.get('confidence', 'medium')).strip().lower(),
        'extraction_model': extraction_model,
        'extraction_date': extraction_date,
    }


# ---------------------------------------------------------------------------
# Shared prompt fragments
# ---------------------------------------------------------------------------

SYSTEM_MESSAGE = (
    'You extract CSWP.39 cryptographic-management governance requirements from '
    'authoritative documents. Output STRICT JSON only — no prose, no markdown fences. '
    'Every entry must tie to a specific paragraph or section of the source document. '
    'When the document does not address a pillar or maturity level, emit no entry for '
    'that cell — never invent requirements.'
)


CSWP39_MODEL_BLOCK = """The CSWP.39 maturity model has:
  5 pillars (ID | label | central question)
    inventory     | Inventory           | How completely do you know your crypto estate?
    governance    | Governance          | Do you have documented policy and ownership?
    lifecycle     | Lifecycle / CLM     | Can you renew/rotate/retire without manual toil?
    observability | Observability       | Can you detect policy drift the same day?
    assurance     | Assurance / FIPS    | Can you prove every module is currently validated?
  4 maturity levels
    1 Partial         — no policy / case-by-case / manual
    2 Risk-Informed   — policy exists / management-approved / RACI defined
    3 Repeatable      — enforced policy / automation / tested processes
    4 Adaptive        — policy-as-code / continuous / board-level attestation
  4 asset classes (asset_class may also be "all" when the doc speaks generically)
    certificates | libraries | software | keys
"""


JSON_CONTRACT = """Return strict JSON with this shape and nothing else:
{
  "requirements": [
    {
      "pillar": "governance",
      "maturity_level": 3,
      "asset_class": "all",
      "requirement": "paraphrase, <=240 chars, imperative voice",
      "evidence_quote": "verbatim quote from the source, <=400 chars",
      "evidence_location": "section/page anchor if identifiable, else empty",
      "confidence": "high|medium|low"
    }
  ]
}
Omit any cell the document does not address. If the document contains no
governance requirements at all, return {"requirements": []}.
"""


def build_user_prompt(
    *,
    category: str,
    category_framing: str,
    doc_metadata: dict[str, str],
    doc_text: str,
) -> str:
    meta_lines = [f'- {k}: {v}' for k, v in doc_metadata.items() if v]
    meta_block = '\n'.join(meta_lines) if meta_lines else '(no additional metadata)'
    return (
        f'Category: {category}\n'
        f'{category_framing}\n\n'
        f'Document metadata:\n{meta_block}\n\n'
        f'{CSWP39_MODEL_BLOCK}\n'
        f'Document text (may be truncated to ~15,000 chars):\n'
        f'-----8<-----\n{doc_text}\n-----8<-----\n\n'
        f'{JSON_CONTRACT}'
    )


# ---------------------------------------------------------------------------
# Markdown sidecar writer (for RAG pickup via generate-rag-corpus.ts)
# ---------------------------------------------------------------------------

def write_markdown_sidecar(
    md_path: Path,
    category: str,
    rows_by_ref: dict[str, list[dict[str, Any]]],
) -> None:
    """Write a RAG-compatible markdown summary grouped by ref_id."""
    md_path.parent.mkdir(parents=True, exist_ok=True)
    today = date.today().isoformat()
    lines: list[str] = [
        '---',
        f'generated: {today}',
        f'category: {category}',
        f'document_count: {len(rows_by_ref)}',
        f'requirement_count: {sum(len(v) for v in rows_by_ref.values())}',
        '---',
        '',
    ]
    for ref_id in sorted(rows_by_ref):
        rows = rows_by_ref[ref_id]
        if not rows:
            continue
        name = rows[0].get('source_name', ref_id)
        url = rows[0].get('source_url', '')
        lines.append(f'## {ref_id}')
        lines.append(f'- **Source**: {name}')
        if url:
            lines.append(f'- **URL**: {url}')
        lines.append(f'- **Requirement count**: {len(rows)}')
        # Group requirements by pillar → level
        by_pillar: dict[str, list[dict[str, Any]]] = {}
        for r in rows:
            by_pillar.setdefault(r['pillar'], []).append(r)
        for pillar in sorted(by_pillar):
            lines.append(f'- **{PILLAR_LABELS.get(pillar, pillar)}**:')
            for r in sorted(by_pillar[pillar], key=lambda x: (x['maturity_level'], x['asset_class'])):
                tag = f'T{r["maturity_level"]} {MATURITY_LEVEL_LABELS[r["maturity_level"]]} · {r["asset_class"]}'
                lines.append(f'    - _{tag}_: {r["requirement"]}')
        lines.append('')
    md_path.write_text('\n'.join(lines), encoding='utf-8')


# ---------------------------------------------------------------------------
# Tiny self-test (run: python3 scripts/_enrichment_common.py)
# ---------------------------------------------------------------------------

if __name__ == '__main__':
    print('CSV columns:', CSV_COLUMNS)
    print('Pillars:', sorted(PILLAR_IDS))
    print('Levels:', sorted(MATURITY_LEVELS))
    print('Asset classes:', sorted(ASSET_CLASSES))
    print('Today output CSV:', output_csv_path())
    lib = load_library_ref_index()
    print(f'Library index: {len(lib)} rows')
    sample = ['FIPS-203', 'RFC-9881']
    for ref in sample:
        print(f'  {ref}: {"FOUND" if ref in lib else "MISSING"}')
    sys.exit(0)
