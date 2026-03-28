#!/usr/bin/env python3
"""
scripts/generate-module-qa-ollama.py

Generates comprehensive Q&A CSV files for each learning module using Ollama.
The Q&A pairs cover both educational (learn tab) and workshop content, with
cross-references to all data sources (library, threats, timeline, leaders,
algorithms, migrate, compliance).

Three outputs:
  - Per-module CSV  -> src/data/module-qa/module_qa_{module_id}_MMDDYYYY.csv
  - Combined CSV    -> src/data/module-qa/module_qa_combined_MMDDYYYY.csv
  - LoRA JSONL      -> src/data/module-qa/module_qa_lora_MMDDYYYY.jsonl

Usage:
  python3 scripts/generate-module-qa-ollama.py
  python3 scripts/generate-module-qa-ollama.py --module pqc-101
  python3 scripts/generate-module-qa-ollama.py --track "Protocols"
  python3 scripts/generate-module-qa-ollama.py --dry-run
  python3 scripts/generate-module-qa-ollama.py --skip-existing
  python3 scripts/generate-module-qa-ollama.py --limit 5
  python3 scripts/generate-module-qa-ollama.py --target-count 25
  python3 scripts/generate-module-qa-ollama.py --export-lora
  python3 scripts/generate-module-qa-ollama.py --verbose
  python3 scripts/generate-module-qa-ollama.py --no-verify   # skip Phase 5.5 (dev only)

Requires:
  Ollama running locally (http://localhost:11434)
  A pulled model: ollama pull qwen3.5:27b
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path

# qa_verifier: imported lazily so the script runs even without anthropic installed
try:
    from qa_verifier import verify_module_batch, load_allowlists
    _QA_VERIFIER_AVAILABLE = True
except ImportError:
    _QA_VERIFIER_AVAILABLE = False

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

ROOT = Path(__file__).parent.parent
DATA_DIR = ROOT / 'src' / 'data'
MODULES_DIR = ROOT / 'src' / 'components' / 'PKILearning' / 'modules'
MODULE_DATA_FILE = ROOT / 'src' / 'components' / 'PKILearning' / 'moduleData.ts'
OUTPUT_DIR = DATA_DIR / 'module-qa'

OLLAMA_BASE = 'http://localhost:11434'
DEFAULT_MODEL = 'qwen3.5:27b'

# ---------------------------------------------------------------------------
# CSV column order
# ---------------------------------------------------------------------------

CSV_COLUMNS = [
    'question_id', 'module_id', 'module_title', 'question', 'answer',
    'content_type', 'difficulty', 'applicable_roles', 'applicable_levels',
    'applicable_regions', 'applicable_industries', 'library_refs',
    'threat_refs', 'timeline_refs', 'leader_refs', 'algorithm_refs',
    'migrate_refs', 'compliance_refs', 'deep_links',
    'consistency_assertions', 'source_citations',
]

# ---------------------------------------------------------------------------
# Module directory -> route ID mapping (mirrors generate-rag-corpus.ts)
# ---------------------------------------------------------------------------

MODULE_DIR_TO_ID = {
    'Module1-Introduction': 'pqc-101',
    'QuantumThreats': 'quantum-threats',
    'HybridCrypto': 'hybrid-crypto',
    'CryptoAgility': 'crypto-agility',
    'TLSBasics': 'tls-basics',
    'VPNSSHModule': 'vpn-ssh-pqc',
    'EmailSigning': 'email-signing',
    'PKIWorkshop': 'pki-workshop',
    'StatefulSignatures': 'stateful-signatures',
    'DigitalAssets': 'digital-assets',
    'FiveG': '5g-security',
    'DigitalID': 'digital-id',
    'Entropy': 'entropy-randomness',
    'MerkleTreeCerts': 'merkle-tree-certs',
    'QKD': 'qkd',
    'APISecurityJWT': 'api-security-jwt',
    'CodeSigning': 'code-signing',
    'IoTOT': 'iot-ot-pqc',
    'PQCRiskManagement': 'pqc-risk-management',
    'PQCBusinessCase': 'pqc-business-case',
    'PQCGovernance': 'pqc-governance',
    'ComplianceStrategy': 'compliance-strategy',
    'MigrationProgram': 'migration-program',
    'VendorRisk': 'vendor-risk',
    'DataAssetSensitivity': 'data-asset-sensitivity',
    'KmsPqc': 'kms-pqc',
    'HsmPqc': 'hsm-pqc',
    'WebGatewayPQC': 'web-gateway-pqc',
    'ExecQuantumImpact': 'exec-quantum-impact',
    'DevQuantumImpact': 'dev-quantum-impact',
    'ArchQuantumImpact': 'arch-quantum-impact',
    'OpsQuantumImpact': 'ops-quantum-impact',
    'ResearchQuantumImpact': 'research-quantum-impact',
    'AISecurityPQC': 'ai-security-pqc',
    'AerospacePQC': 'aerospace-pqc',
    'AutomotivePQC': 'automotive-pqc',
    'ConfidentialComputing': 'confidential-computing',
    'CryptoDevAPIs': 'crypto-dev-apis',
    'DatabaseEncryptionPQC': 'database-encryption-pqc',
    'EMVPaymentPQC': 'emv-payment-pqc',
    'EnergyUtilities': 'energy-utilities-pqc',
    'HealthcarePQC': 'healthcare-pqc',
    'IAMPQC': 'iam-pqc',
    'NetworkSecurityPQC': 'network-security-pqc',
    'OSPQC': 'os-pqc',
    'PlatformEngPQC': 'platform-eng-pqc',
    'SecretsManagementPQC': 'secrets-management-pqc',
    'SecureBootPQC': 'secure-boot-pqc',
    'StandardsBodies': 'standards-bodies',
    'PQCTestingValidation': 'pqc-testing-validation',
}

# Reverse mapping: module_id -> directory name
MODULE_ID_TO_DIR = {v: k for k, v in MODULE_DIR_TO_ID.items()}

# ---------------------------------------------------------------------------
# Phase 1: Load all reference data sets
# ---------------------------------------------------------------------------

def find_latest_csv(prefix: str, directory: Path = DATA_DIR) -> Path | None:
    """Find latest versioned CSV matching prefix_MMDDYYYY[_rN].csv."""
    pattern = re.compile(
        rf'^{re.escape(prefix)}\d{{8}}(_r\d+)?\.csv$'
    )
    files = [f for f in directory.iterdir() if pattern.match(f.name)]
    if not files:
        return None

    def sort_key(f):
        m = re.search(
            rf'{re.escape(prefix)}(\d{{2}})(\d{{2}})(\d{{4}})(_r(\d+))?\.csv$',
            f.name
        )
        if not m:
            return ('0000-00-00', 0)
        date_str = f'{m.group(3)}-{m.group(1)}-{m.group(2)}'
        rev = int(m.group(5)) if m.group(5) else 0
        return (date_str, rev)

    files.sort(key=sort_key, reverse=True)
    return files[0]


def load_csv_rows(csv_path: Path) -> list[dict]:
    """Load CSV with DictReader."""
    rows = []
    with open(csv_path, 'r', encoding='utf-8-sig', errors='ignore') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    return rows


def load_reference_sets() -> dict:
    """Load all 7 data source reference sets for cross-referencing."""
    refs = {}

    # Library
    lib_csv = find_latest_csv('library_')
    if lib_csv:
        rows = load_csv_rows(lib_csv)
        refs['library'] = {r.get('reference_id', '').strip(): r.get('document_title', '') for r in rows if r.get('reference_id', '').strip()}
        print(f'  Library: {len(refs["library"])} refs from {lib_csv.name}')
    else:
        refs['library'] = {}
        print('  Library: NOT FOUND')

    # Threats
    threat_csv = find_latest_csv('quantum_threats_hsm_industries_')
    if threat_csv:
        rows = load_csv_rows(threat_csv)
        refs['threats'] = {r.get('threat_id', '').strip(): r.get('industry', '') for r in rows if r.get('threat_id', '').strip()}
        print(f'  Threats: {len(refs["threats"])} refs from {threat_csv.name}')
    else:
        refs['threats'] = {}
        print('  Threats: NOT FOUND')

    # Algorithms
    algo_csv = find_latest_csv('pqc_complete_algorithm_reference_')
    if algo_csv:
        rows = load_csv_rows(algo_csv)
        refs['algorithms'] = {r.get('Algorithm', '').strip() for r in rows if r.get('Algorithm', '').strip()}
        # Also add algorithm families
        for r in rows:
            fam = r.get('Algorithm Family', '').strip()
            if fam:
                refs['algorithms'].add(fam)
        print(f'  Algorithms: {len(refs["algorithms"])} refs from {algo_csv.name}')
    else:
        refs['algorithms'] = set()
        print('  Algorithms: NOT FOUND')

    # Migrate (software)
    migrate_csv = find_latest_csv('quantum_safe_cryptographic_software_reference_')
    if migrate_csv:
        rows = load_csv_rows(migrate_csv)
        refs['migrate'] = {r.get('software_name', '').strip(): r.get('category_id', '') for r in rows if r.get('software_name', '').strip()}
        print(f'  Migrate: {len(refs["migrate"])} refs from {migrate_csv.name}')
    else:
        refs['migrate'] = {}
        print('  Migrate: NOT FOUND')

    # Leaders
    leaders_csv = find_latest_csv('leaders_')
    if leaders_csv:
        rows = load_csv_rows(leaders_csv)
        refs['leaders'] = {r.get('Name', '').strip(): r.get('Country', '') for r in rows if r.get('Name', '').strip()}
        print(f'  Leaders: {len(refs["leaders"])} refs from {leaders_csv.name}')
    else:
        refs['leaders'] = {}
        print('  Leaders: NOT FOUND')

    # Compliance
    compliance_csv = find_latest_csv('compliance_')
    if compliance_csv:
        rows = load_csv_rows(compliance_csv)
        refs['compliance'] = {r.get('id', '').strip(): r.get('label', '') for r in rows if r.get('id', '').strip()}
        print(f'  Compliance: {len(refs["compliance"])} refs from {compliance_csv.name}')
    else:
        refs['compliance'] = {}
        print('  Compliance: NOT FOUND')

    # Timeline (countries + event titles)
    timeline_csv = find_latest_csv('timeline_')
    if timeline_csv:
        rows = load_csv_rows(timeline_csv)
        refs['timeline_countries'] = {r.get('Country', '').strip() for r in rows if r.get('Country', '').strip()}
        refs['timeline_titles'] = {r.get('Title', '').strip() for r in rows if r.get('Title', '').strip()}
        print(f'  Timeline: {len(refs["timeline_countries"])} countries, {len(refs["timeline_titles"])} events from {timeline_csv.name}')
    else:
        refs['timeline_countries'] = set()
        refs['timeline_titles'] = set()
        print('  Timeline: NOT FOUND')

    return refs


# ---------------------------------------------------------------------------
# Enrichment loading & matching
# ---------------------------------------------------------------------------

def parse_enrichment_md(file_path: Path) -> dict[str, dict[str, str]]:
    """Parse enrichment markdown files.
    Split by '## ' headings, extract '- **FieldName**: value' lines as fields.
    Returns {refId: {fieldName: fieldValue}}.
    """
    result: dict[str, dict[str, str]] = {}
    try:
        text = file_path.read_text(encoding='utf-8', errors='ignore')
    except Exception:
        return result

    # Split by ## headings
    sections = re.split(r'^## ', text, flags=re.MULTILINE)
    for section in sections:
        if not section.strip():
            continue
        lines = section.strip().split('\n')
        ref_id = lines[0].strip()
        if not ref_id:
            continue
        fields: dict[str, str] = {}
        for line in lines[1:]:
            m = re.match(r'^- \*\*(.+?)\*\*:\s*(.+)$', line.strip())
            if m:
                fields[m.group(1).strip()] = m.group(2).strip()
        if fields:
            result[ref_id] = fields

    return result


def load_enrichment_data() -> dict:
    """Load all enrichment sources for contextual grounding.

    Returns dict with keys:
      'library_fields'        — {refId: {field: value}} merged across all library enrichment files
      'timeline_fields'       — {refId: {field: value}} merged across all timeline enrichment files
      'product_extractions'   — {csc_prefix: [product_obj, ...]} latest file per CSC prefix
      'glossary'              — [{term, acronym, definition, relatedModule}, ...]
    """
    enrichments: dict = {
        'library_fields': {},
        'timeline_fields': {},
        'product_extractions': {},
        'glossary': [],
    }

    enrichment_dir = DATA_DIR / 'doc-enrichments'

    # 1. Library enrichments — merge across all files (latest wins via sorted order)
    lib_files = sorted(enrichment_dir.glob('library_doc_enrichments_*.md'))
    for f in lib_files:
        parsed = parse_enrichment_md(f)
        for ref_id, fields in parsed.items():
            if ref_id in enrichments['library_fields']:
                enrichments['library_fields'][ref_id].update(fields)
            else:
                enrichments['library_fields'][ref_id] = fields
    print(f'  Enrichments: {len(enrichments["library_fields"])} library entries from {len(lib_files)} files')

    # 2. Timeline enrichments — same merge pattern
    tl_files = sorted(enrichment_dir.glob('timeline_doc_enrichments_*.md'))
    for f in tl_files:
        parsed = parse_enrichment_md(f)
        for ref_id, fields in parsed.items():
            if ref_id in enrichments['timeline_fields']:
                enrichments['timeline_fields'][ref_id].update(fields)
            else:
                enrichments['timeline_fields'][ref_id] = fields
    print(f'  Enrichments: {len(enrichments["timeline_fields"])} timeline entries from {len(tl_files)} files')

    # 3. Product extractions — for each CSC prefix, pick latest file
    extraction_dir = DATA_DIR / 'product-extractions'
    if extraction_dir.exists():
        csc_files: dict[str, list[Path]] = {}
        for f in extraction_dir.glob('csc_*_extractions_*.json'):
            m = re.match(r'(csc_\d+)_extractions_(\d{8})\.json$', f.name)
            if m:
                prefix = m.group(1)
                csc_files.setdefault(prefix, []).append(f)

        for prefix, files in csc_files.items():
            # Sort by date in filename (MMDDYYYY) — pick latest
            def ext_sort_key(fp: Path):
                dm = re.search(r'_(\d{2})(\d{2})(\d{4})\.json$', fp.name)
                if dm:
                    return f'{dm.group(3)}-{dm.group(1)}-{dm.group(2)}'
                return '0000-00-00'
            files.sort(key=ext_sort_key, reverse=True)
            latest = files[0]
            try:
                data = json.loads(latest.read_text(encoding='utf-8', errors='ignore'))
                if isinstance(data, list):
                    enrichments['product_extractions'][prefix] = data
            except Exception:
                pass

        total_products = sum(len(v) for v in enrichments['product_extractions'].values())
        print(f'  Enrichments: {total_products} product extractions from {len(enrichments["product_extractions"])} CSC categories')

    # 4. Glossary from glossaryData.ts
    glossary_path = DATA_DIR / 'glossaryData.ts'
    if glossary_path.exists():
        try:
            glossary_text = glossary_path.read_text(encoding='utf-8', errors='ignore')
            # Regex parse: { term: '...', acronym: '...', definition: '...', relatedModule: '...' }
            term_blocks = re.findall(
                r'\{\s*'
                r"term\s*:\s*['\"](.+?)['\"]"
                r'.*?'
                r"definition\s*:\s*['\"](.+?)['\"]",
                glossary_text, re.DOTALL
            )
            for term, definition in term_blocks:
                entry: dict[str, str] = {'term': term, 'definition': definition}
                # Try to find acronym and relatedModule in nearby context
                # Search for the block containing this term
                block_m = re.search(
                    r'\{[^}]*term\s*:\s*[\'"]' + re.escape(term) + r'[\'"][^}]*\}',
                    glossary_text, re.DOTALL
                )
                if block_m:
                    block = block_m.group(0)
                    acr_m = re.search(r"acronym\s*:\s*['\"](.+?)['\"]", block)
                    if acr_m:
                        entry['acronym'] = acr_m.group(1)
                    rel_m = re.search(r"relatedModule\s*:\s*['\"](.+?)['\"]", block)
                    if rel_m:
                        entry['relatedModule'] = rel_m.group(1)
                enrichments['glossary'].append(entry)
            print(f'  Enrichments: {len(enrichments["glossary"])} glossary terms')
        except Exception:
            print('  Enrichments: glossary parse error')

    return enrichments


def match_enrichments_for_module(module_id: str, rag_summary: str,
                                  enrichments: dict, refs: dict) -> str:
    """Find relevant enrichment entries for a module and format as compact text.
    Returns a string capped at 3000 chars.

    Matching strategy:
      - Library: check enrichment's 'Relevant PQC Today Features' field for module_id;
        also check library CSV rows' module_ids column.
      - Timeline: same 'Relevant PQC Today Features' matching.
      - Products: use migrate CSV learning_modules → category_ids → product extractions.
      - Glossary: match via relatedModule field.
    Priority order: library, timeline, products, glossary.
    """
    parts: list[str] = []
    char_budget = 3000

    # --- Library enrichments ---
    # Also load library CSV rows for module_ids column matching
    lib_csv = find_latest_csv('library_')
    lib_module_map: dict[str, str] = {}  # refId -> module_ids from CSV
    if lib_csv:
        for row in load_csv_rows(lib_csv):
            ref_id = row.get('reference_id', '').strip()
            mod_ids = row.get('module_ids', '').strip()
            if ref_id and mod_ids:
                lib_module_map[ref_id] = mod_ids

    for ref_id, fields in enrichments.get('library_fields', {}).items():
        if len('\n'.join(parts)) >= char_budget:
            break
        features = fields.get('Relevant PQC Today Features', '')
        csv_modules = lib_module_map.get(ref_id, '')
        # Check if module_id appears in enrichment features or CSV module_ids
        match = False
        if module_id in [f.strip() for f in features.split(',')]:
            match = True
        if not match and module_id in [m.strip() for m in csv_modules.split(';')]:
            match = True
        if match:
            algos = fields.get('PQC Algorithms Covered', 'N/A')[:120]
            comp = fields.get('Compliance Frameworks Referenced', 'N/A')[:120]
            takeaway = fields.get('Key Takeaways', 'N/A')[:100]
            parts.append(f'[Library: {ref_id}] PQC Algorithms: {algos} | Compliance: {comp} | Key Takeaway: {takeaway}')

    # --- Timeline enrichments ---
    for ref_id, fields in enrichments.get('timeline_fields', {}).items():
        if len('\n'.join(parts)) >= char_budget:
            break
        features = fields.get('Relevant PQC Today Features', '')
        if module_id in [f.strip() for f in features.split(',')]:
            mandate = fields.get('Regulatory Mandate Level', 'N/A')
            urgency = fields.get('Migration Urgency & Priority', 'N/A')
            parts.append(f'[Timeline: {ref_id}] Regulatory: {mandate} | Migration Urgency: {urgency}')

    # --- Product extractions ---
    # Map module_id -> category_ids via migrate CSV learning_modules column
    migrate_csv = find_latest_csv('quantum_safe_cryptographic_software_reference_')
    module_category_ids: set[str] = set()
    if migrate_csv:
        for row in load_csv_rows(migrate_csv):
            learning_mods = row.get('learning_modules', '').strip()
            cat_id = row.get('category_id', '').strip()
            if learning_mods and cat_id:
                mod_list = [m.strip() for m in learning_mods.split(';')]
                if module_id in mod_list:
                    module_category_ids.add(cat_id)

    for csc_prefix, products in enrichments.get('product_extractions', {}).items():
        if len('\n'.join(parts)) >= char_budget:
            break
        # csc_prefix is like 'csc_001' — extract the numeric part to compare with category_ids like 'CSC-001'
        num_m = re.match(r'csc_(\d+)', csc_prefix)
        if not num_m:
            continue
        cat_id_normalized = f'CSC-{num_m.group(1).lstrip("0").zfill(3)}'
        if cat_id_normalized not in module_category_ids:
            continue
        for prod in products[:3]:  # Cap at 3 products per category
            if len('\n'.join(parts)) >= char_budget:
                break
            pname = prod.get('platform_name', 'Unknown')
            pqc = prod.get('pqc_support', 'N/A')[:80]
            crypto = prod.get('crypto_primitives', 'N/A')[:80]
            parts.append(f'[Product: {pname}] PQC: {pqc} | Crypto: {crypto}')

    # --- Glossary ---
    for entry in enrichments.get('glossary', []):
        if len('\n'.join(parts)) >= char_budget:
            break
        related = entry.get('relatedModule', '')
        # Strip /learn/ prefix for comparison
        related_id = related.replace('/learn/', '').strip()
        if related_id == module_id:
            term = entry.get('term', '')
            defn = entry.get('definition', '')[:80]
            parts.append(f'[Glossary: {term}] {defn}')

    result = '\n'.join(parts)
    return result[:char_budget]


def check_rag_summary_vs_enrichments(module_id: str, rag_summary: str,
                                      enrichment_context: str) -> list[str]:
    """Compare rag-summary content against matched enrichments.
    Returns list of warning strings for mismatches.
    """
    warnings: list[str] = []
    if not rag_summary or not enrichment_context:
        return warnings

    # Extract standard IDs from rag-summary
    std_pattern = re.compile(
        r'\b(FIPS\s+\d{3}|RFC\s+\d{4}|CIP-\d{3}|CNSA\s+\d\.\d|IEC\s+\d{4,5}|NIST\s+(?:SP|IR)\s+[\d-]+)\b'
    )
    found_standards = set(std_pattern.findall(rag_summary))

    if not found_standards:
        return warnings

    for std in sorted(found_standards):
        # Normalize whitespace for matching
        std_normalized = re.sub(r'\s+', ' ', std)
        if std_normalized not in enrichment_context:
            # Check with collapsed whitespace too
            std_compact = std_normalized.replace(' ', '')
            context_compact = enrichment_context.replace(' ', '')
            if std_compact not in context_compact:
                warnings.append(
                    f'[{module_id}] WARNING: Standard "{std_normalized}" found in rag-summary '
                    f'but not mentioned in any matched enrichment source'
                )

    return warnings


def extract_structured_data(module_dir: Path, max_chars: int = 4000) -> str:
    """Extract structured data from module data files.
    Reads {module_dir}/data/*.ts plus root-level *Data.ts/*Constants.ts files.
    Returns raw TypeScript content (stripped of imports and empty lines).
    """
    data_files: list[Path] = []

    # Check data/ subdirectory
    data_subdir = module_dir / 'data'
    if data_subdir.exists():
        data_files.extend(sorted(data_subdir.glob('*.ts')))

    # Check root-level *Data.ts and *Constants.ts
    for f in sorted(module_dir.glob('*Data.ts')):
        if f not in data_files and not f.name.endswith('.test.ts'):
            data_files.append(f)
    for f in sorted(module_dir.glob('*Constants.ts')):
        if f not in data_files and not f.name.endswith('.test.ts'):
            data_files.append(f)

    if not data_files:
        return ''

    chunks: list[str] = []
    for f in data_files:
        try:
            content = f.read_text(encoding='utf-8', errors='ignore')
        except Exception:
            continue
        # Strip import lines and empty lines
        lines = [
            line for line in content.split('\n')
            if line.strip() and not re.match(r'^\s*import\s+', line)
        ]
        if lines:
            chunks.append(f'[{f.name}]\n' + '\n'.join(lines))

    combined = '\n\n'.join(chunks)
    return combined[:max_chars]


# ---------------------------------------------------------------------------
# Phase 2: Module content assembly
# ---------------------------------------------------------------------------

def parse_module_catalog(ts_content: str) -> dict:
    """Parse MODULE_CATALOG from moduleData.ts to get title, description, difficulty per module."""
    catalog = {}

    # Find the MODULE_CATALOG block
    cat_match = re.search(r'export\s+const\s+MODULE_CATALOG\b[^=]+=\s*', ts_content)
    if not cat_match:
        return catalog

    # Use a line-based approach: find each module key, then extract fields from its block
    # Module keys can be 'module-id': { or module_id: {
    key_pattern = re.compile(r"""(?:'([a-z0-9-]+)'|([a-z0-9-]+))\s*:\s*\{""")
    catalog_start = cat_match.end()

    # Find the end of MODULE_CATALOG (next export const)
    next_export = re.search(r'\nexport\s+const\s+', ts_content[catalog_start:])
    catalog_end = catalog_start + next_export.start() if next_export else len(ts_content)
    catalog_block = ts_content[catalog_start:catalog_end]

    for key_m in key_pattern.finditer(catalog_block):
        module_id = key_m.group(1) or key_m.group(2)
        # Skip non-module keys (e.g., 'id', 'title' which are field names)
        if module_id in ('id', 'title', 'description', 'duration', 'difficulty'):
            continue

        # Extract the block content by brace counting
        brace_start = key_m.end()
        depth = 1
        pos = brace_start
        while pos < len(catalog_block) and depth > 0:
            if catalog_block[pos] == '{':
                depth += 1
            elif catalog_block[pos] == '}':
                depth -= 1
            pos += 1
        entry_text = catalog_block[brace_start:pos - 1]

        # Extract title (single or double quoted)
        title_m = re.search(r"""title\s*:\s*(?:'([^']*)'|"([^"]*)")""", entry_text)
        title = (title_m.group(1) or title_m.group(2)) if title_m else module_id

        # Extract description (may be multi-line, single or double quoted)
        desc_m = re.search(r"""description\s*:\s*(?:'([^']*)'|"([^"]*)")""", entry_text, re.DOTALL)
        description = ''
        if desc_m:
            description = (desc_m.group(1) or desc_m.group(2) or '').replace('\n', ' ').strip()

        # Extract duration
        dur_m = re.search(r"""duration\s*:\s*'([^']*)'""", entry_text)
        duration = dur_m.group(1) if dur_m else ''

        # Extract difficulty
        diff_m = re.search(r"""difficulty\s*:\s*'([^']*)'""", entry_text)
        difficulty = diff_m.group(1) if diff_m else 'intermediate'

        catalog[module_id] = {
            'title': title,
            'description': description,
            'duration': duration,
            'difficulty': difficulty,
        }

    return catalog


def parse_section_labels(ts_content: str, block_name: str) -> dict[str, list[str]]:
    """Parse LEARN_SECTIONS or WORKSHOP_STEPS from moduleData.ts.
    Returns {module_id: [label1, label2, ...]}."""
    result = {}

    # Find the block: export const BLOCK_NAME: <type> = {
    # Use [^=]+= to skip the type annotation which may contain { }
    start_match = re.search(rf'export\s+const\s+{block_name}\b[^=]+=\s*\{{', ts_content)
    if not start_match:
        return result

    # Extract the block content by brace-counting
    start = start_match.end()
    depth = 1
    pos = start
    while pos < len(ts_content) and depth > 0:
        ch = ts_content[pos]
        if ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
        pos += 1
    block_text = ts_content[start:pos - 1]

    # Parse module entries by finding each module key and its bracket-delimited array
    # Handle both quoted ('module-id') and unquoted (qkd) keys
    key_pattern = re.compile(r"(?:'([a-z0-9-]+)'|([a-z0-9-]+))\s*:\s*\[")
    for key_match in key_pattern.finditer(block_text):
        module_id = key_match.group(1) or key_match.group(2)
        # Find matching ] by bracket counting from the [ position
        arr_start = key_match.end()
        bracket_depth = 1
        arr_pos = arr_start
        while arr_pos < len(block_text) and bracket_depth > 0:
            if block_text[arr_pos] == '[':
                bracket_depth += 1
            elif block_text[arr_pos] == ']':
                bracket_depth -= 1
            arr_pos += 1
        array_text = block_text[arr_start:arr_pos - 1]
        # Extract labels — handle both single-quoted and double-quoted strings
        labels = re.findall(r"""label\s*:\s*(?:'([^']*)'|"([^"]*)")""", array_text)
        # Each match returns (single_quoted, double_quoted) — take whichever is non-empty
        flat_labels = [s or d for s, d in labels]
        if flat_labels:
            result[module_id] = flat_labels

    return result


def parse_module_tracks(ts_content: str) -> dict[str, str]:
    """Parse MODULE_TRACKS array to get module_id -> track name mapping.
    MODULE_TO_TRACK is programmatically derived, so we parse MODULE_TRACKS directly."""
    tracks = {}

    # Find MODULE_TRACKS: { track: string; modules: ModuleItem[] }[] = [
    mt_match = re.search(r'export\s+const\s+MODULE_TRACKS\b[^=]*=\s*\[', ts_content)
    if not mt_match:
        return tracks

    # Extract the full array by bracket counting
    start = mt_match.end()
    depth = 1
    pos = start
    while pos < len(ts_content) and depth > 0:
        if ts_content[pos] == '[':
            depth += 1
        elif ts_content[pos] == ']':
            depth -= 1
        pos += 1
    block = ts_content[start:pos - 1]

    # Parse each track entry: { track: 'TrackName', modules: [ MODULE_CATALOG['id'], ... ] }
    # Find track names and then bracket-count to extract their modules arrays
    track_name_pattern = re.compile(r"track\s*:\s*'([^']*)'")
    modules_start_pattern = re.compile(r"modules\s*:\s*\[")
    for tn_match in track_name_pattern.finditer(block):
        track_name = tn_match.group(1)
        # Find the modules: [ that follows this track name
        ms_match = modules_start_pattern.search(block, tn_match.end())
        if not ms_match:
            continue
        # Bracket-count to find matching ]
        arr_start = ms_match.end()
        bracket_depth = 1
        arr_pos = arr_start
        while arr_pos < len(block) and bracket_depth > 0:
            if block[arr_pos] == '[':
                bracket_depth += 1
            elif block[arr_pos] == ']':
                bracket_depth -= 1
            arr_pos += 1
        modules_text = block[arr_start:arr_pos - 1]
        # Extract module IDs from MODULE_CATALOG['module-id'] references
        module_ids = re.findall(r"MODULE_CATALOG\['([a-z0-9-]+)'\]", modules_text)
        for mid in module_ids:
            tracks[mid] = track_name

    return tracks


def read_module_markdown(module_dir: Path, filename: str) -> str:
    """Read a markdown file from a module directory."""
    md_path = module_dir / filename
    if md_path.exists():
        try:
            return md_path.read_text(encoding='utf-8', errors='ignore').strip()
        except Exception:
            pass
    return ''


def extract_text_from_tsx(file_path: Path, max_chars: int = 8000) -> str:
    """Extract visible text content from TSX/TS files.
    Pulls string literals, JSX text, and constant definitions."""
    try:
        content = file_path.read_text(encoding='utf-8', errors='ignore')
    except Exception:
        return ''

    texts = []

    # Extract JSX text content (text between > and <)
    jsx_text = re.findall(r'>\s*([^<>{]+?)\s*<', content)
    for t in jsx_text:
        t = t.strip()
        if len(t) > 10 and not t.startswith('{') and not re.match(r'^[/\s]*$', t):
            texts.append(t)

    # Extract string literals from const declarations and arrays
    string_lits = re.findall(r"'([^']{15,})'", content)
    for s in string_lits:
        if not s.startswith(('import ', 'from ', '@/', 'src/', 'http', 'data:')) and not re.match(r'^[a-z-]+$', s):
            texts.append(s)

    # Extract template literals
    template_lits = re.findall(r'`([^`]{20,})`', content)
    for t in template_lits:
        if '${' not in t[:20]:  # Skip heavily interpolated strings
            texts.append(t)

    combined = '\n'.join(texts)
    return combined[:max_chars]


def assemble_module_content(module_id: str, catalog: dict, learn_sections: dict,
                            workshop_steps: dict, tracks: dict) -> dict | None:
    """Assemble all content for a single module."""
    dir_name = MODULE_ID_TO_DIR.get(module_id)
    if not dir_name:
        return None

    module_dir = MODULES_DIR / dir_name
    if not module_dir.exists():
        return None

    meta = catalog.get(module_id, {})
    if not meta:
        return None

    # Read markdown summaries
    rag_summary = read_module_markdown(module_dir, 'rag-summary.md')
    curious_summary = read_module_markdown(module_dir, 'curious-summary.md')

    # Get section labels
    learn_labels = learn_sections.get(module_id, [])
    workshop_labels = workshop_steps.get(module_id, [])

    # Extract text from TSX/TS files in the module directory
    component_texts = []
    for pattern in ['*.tsx', '*.ts']:
        for f in module_dir.rglob(pattern):
            if f.name.endswith('.test.tsx') or f.name.endswith('.test.ts'):
                continue
            text = extract_text_from_tsx(f)
            if text:
                component_texts.append(f'[{f.name}]\n{text}')

    return {
        'module_id': module_id,
        'title': meta.get('title', module_id),
        'description': meta.get('description', ''),
        'duration': meta.get('duration', ''),
        'difficulty': meta.get('difficulty', 'intermediate'),
        'track': tracks.get(module_id, 'Unknown'),
        'rag_summary': rag_summary,
        'curious_summary': curious_summary,
        'learn_sections': learn_labels,
        'workshop_steps': workshop_labels,
        'component_text': '\n\n'.join(component_texts)[:12000],
        'structured_data': extract_structured_data(module_dir),
        'enrichment_context': '',  # Filled in later with match_enrichments_for_module
    }


# ---------------------------------------------------------------------------
# Phase 3: Ollama Q&A generation
# ---------------------------------------------------------------------------

_BASE_SYSTEM_MESSAGE = """You are a PQC (Post-Quantum Cryptography) education Q&A generator.
You generate high-quality question-answer pairs from provided learning module content.

STRICT RULES:
1. ONLY use facts from the provided content. NEVER fabricate standards, dates, or algorithm names.
2. Generate EXACTLY the requested number of Q&A pairs.
3. Answers must be self-contained — a reader should understand without seeing the module.
4. Cite specific standards (FIPS 203, RFC 8446, CNSA 2.0, etc.) where the content mentions them.
5. Each answer should be 2-5 sentences, factual, and technically precise.
6. Vary the difficulty levels as requested.
7. Output valid JSON only — no markdown, no explanation, just the JSON array.
8. When authoritative source context is provided, use it as ground truth. If the module content and authoritative sources conflict on specific facts (algorithm names, standard versions, dates, compliance requirements), prefer the authoritative source.
{fact_constraints}"""


def build_fact_constraints() -> str:
    """Build a FACT CONSTRAINTS block from fact_allowlists.json for prompt grounding.

    Returns a formatted string to inject into the system message, or empty string if
    the allowlists file is not available.
    """
    allowlists_path = ROOT / 'scripts' / 'fact_allowlists.json'
    if not allowlists_path.exists():
        return ''

    try:
        with open(allowlists_path, encoding='utf-8') as f:
            allowlists = json.load(f)
    except (json.JSONDecodeError, OSError):
        return ''

    fips_to_algo = allowlists.get('fips_to_algorithm', {})
    security_levels = allowlists.get('security_level_map', {})
    key_dates = allowlists.get('key_dates', {})
    non_pqc = allowlists.get('non_pqc_standards', {})

    lines = [
        '',
        '=== FACT CONSTRAINTS (violations cause automatic rejection) ===',
        'The following are GROUND TRUTH. Any Q&A pair contradicting them will be rejected:',
    ]

    # FIPS → algorithm mappings
    for fips_num in sorted(fips_to_algo.keys(), key=int):
        algo = fips_to_algo[fips_num]
        lines.append(f'- FIPS {fips_num} = {algo}')

    # Key dates
    for event, date in key_dates.items():
        lines.append(f'- {event}: {date}')

    # Selected security levels (most commonly referenced)
    level_examples = ['ML-KEM-512', 'ML-KEM-768', 'ML-KEM-1024',
                      'ML-DSA-44', 'ML-DSA-65', 'ML-DSA-87']
    for algo in level_examples:
        if algo in security_levels:
            lines.append(f'- {algo} = NIST Security Level {security_levels[algo]}')

    # Non-PQC standards that must NOT be attributed PQC algorithms
    for std, desc in non_pqc.items():
        lines.append(f'- {std}: {desc}')

    return '\n'.join(lines)


# Build system message with fact constraints at import time
_fact_constraints_block = build_fact_constraints()
SYSTEM_MESSAGE = _BASE_SYSTEM_MESSAGE.format(
    fact_constraints=_fact_constraints_block
)

PROMPT_TEMPLATE = """Module: {title} (ID: {module_id})
Track: {track} | Level: {difficulty} | Duration: {duration}

=== Module Description ===
{description}

=== RAG Summary ===
{rag_summary}

=== Curious Summary ===
{curious_summary}

=== Learn Sections ===
{learn_sections}

=== Workshop Steps ===
{workshop_steps}

=== Module Content (extracted) ===
{component_text}

=== Component Data (structured) ===
{structured_data}

=== Authoritative Source Context ===
The following facts come from authoritative source documents. Use these as ground truth — if they conflict with other content, prefer this authoritative context.

{enrichment_context}

---

Generate exactly {target_count} Q&A pairs as a JSON array. Mix of difficulty levels:
- {recall_count} "recall" questions (basic fact retrieval)
- {comp_count} "comprehension" questions (understanding relationships)
- {app_count} "application" questions (applying knowledge to scenarios)
- {synth_count} "synthesis" questions (cross-domain reasoning)

Each object must have these exact fields:
{{
  "question": "...",
  "answer": "...",
  "content_type": "learn" | "workshop" | "both",
  "difficulty": "recall" | "comprehension" | "application" | "synthesis",
  "roles": "semicolon-delimited from: executive;developer;architect;ops;researcher;curious",
  "levels": "semicolon-delimited from: beginner;intermediate;advanced",
  "regions": "semicolon-delimited from: USA;EU;APAC;Global (use Global if not region-specific)",
  "industries": "semicolon-delimited industries or General if broadly applicable",
  "source_citations": "where in the module this info comes from"
}}

Output ONLY the JSON array, nothing else:"""


def compute_target_counts(learn_count: int, workshop_count: int, override: int = 0) -> dict:
    """Compute target Q&A count and difficulty distribution."""
    if override > 0:
        total = override
    else:
        total = max(15, min(30, learn_count * 3 + workshop_count * 2))

    recall = max(3, total // 4)
    comp = max(3, total // 4)
    app = max(2, total // 4)
    synth = total - recall - comp - app

    return {
        'total': total,
        'recall': recall,
        'comprehension': comp,
        'application': app,
        'synthesis': max(2, synth),
    }


def call_ollama(model: str, module_content: dict, target_counts: dict,
                retries: int = 2, timeout: int = 1800,
                verbose: bool = False) -> list[dict]:
    """Call Ollama to generate Q&A pairs. Returns parsed JSON array."""
    learn_str = '\n'.join(f'  {i+1}. {l}' for i, l in enumerate(module_content['learn_sections'])) or '  (none)'
    workshop_str = '\n'.join(f'  {i+1}. {w}' for i, w in enumerate(module_content['workshop_steps'])) or '  (none)'

    user_content = PROMPT_TEMPLATE.format(
        title=module_content['title'],
        module_id=module_content['module_id'],
        track=module_content['track'],
        difficulty=module_content['difficulty'],
        duration=module_content['duration'],
        description=module_content['description'],
        rag_summary=module_content['rag_summary'][:4000] or '(not available)',
        curious_summary=module_content.get('curious_summary', '')[:2000] or '(not available)',
        learn_sections=learn_str,
        workshop_steps=workshop_str,
        component_text=module_content['component_text'][:6000] or '(not available)',
        structured_data=module_content.get('structured_data', '')[:4000] or '(not available)',
        enrichment_context=module_content.get('enrichment_context', '') or '(not available)',
        target_count=target_counts['total'],
        recall_count=target_counts['recall'],
        comp_count=target_counts['comprehension'],
        app_count=target_counts['application'],
        synth_count=target_counts['synthesis'],
    )

    payload = json.dumps({
        'model': model,
        'messages': [
            {'role': 'system', 'content': SYSTEM_MESSAGE},
            {'role': 'user', 'content': '/no_think\n' + user_content},
        ],
        'stream': False,
        'options': {
            'num_predict': 16384,
            'temperature': 0.0,
        },
        'think': False,
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
                response_text = data.get('message', {}).get('content', '').strip()

                if verbose:
                    print(f'    [raw response: {len(response_text)} chars]')
                    preview = response_text[:500].replace('\n', '\n    | ')
                    print(f'    | {preview}')

                # Strip <think>...</think> blocks
                cleaned = re.sub(
                    r'<think>.*?</think>', '', response_text, flags=re.DOTALL
                ).strip()

                # Extract JSON array from response
                return parse_qa_json(cleaned)

        except urllib.error.URLError as e:
            if attempt < retries - 1:
                print(f'    Warning: Connection error (attempt {attempt + 1}/{retries}): {e}')
                time.sleep(3)
            else:
                print(f'    FAILED after {retries} attempts: {e}')
                return []
        except Exception as e:
            if attempt < retries - 1:
                print(f'    Warning: Error (attempt {attempt + 1}/{retries}): {e}')
                time.sleep(3)
            else:
                print(f'    FAILED after {retries} attempts: {e}')
                return []

    return []


def parse_qa_json(text: str) -> list[dict]:
    """Parse JSON array from Ollama response, handling common formatting issues."""
    # Try direct parse
    try:
        data = json.loads(text)
        if isinstance(data, list):
            return data
    except json.JSONDecodeError:
        pass

    # Try extracting JSON array from markdown code block
    m = re.search(r'```(?:json)?\s*(\[.*?\])\s*```', text, re.DOTALL)
    if m:
        try:
            data = json.loads(m.group(1))
            if isinstance(data, list):
                return data
        except json.JSONDecodeError:
            pass

    # Try finding the first [ to last ]
    start = text.find('[')
    end = text.rfind(']')
    if start != -1 and end != -1 and end > start:
        try:
            data = json.loads(text[start:end + 1])
            if isinstance(data, list):
                return data
        except json.JSONDecodeError:
            pass

    print(f'    Warning: Could not parse JSON response ({len(text)} chars)')
    return []


# ---------------------------------------------------------------------------
# Phase 4: Cross-reference enrichment
# ---------------------------------------------------------------------------

def build_matchers(refs: dict) -> dict:
    """Build compiled regex matchers for each reference set."""
    matchers = {}

    # Library refs: match exact reference IDs (word-boundary)
    if refs.get('library'):
        # Sort by length descending to match longer IDs first
        ids = sorted(refs['library'].keys(), key=len, reverse=True)
        # Escape special regex chars and build alternation
        escaped = [re.escape(rid) for rid in ids]
        if escaped:
            matchers['library'] = re.compile(r'\b(' + '|'.join(escaped) + r')\b')

    # Algorithms: match algorithm names
    if refs.get('algorithms'):
        algos = sorted(refs['algorithms'], key=len, reverse=True)
        escaped = [re.escape(a) for a in algos]
        if escaped:
            matchers['algorithms'] = re.compile(r'\b(' + '|'.join(escaped) + r')\b')

    # Threats: match threat IDs
    if refs.get('threats'):
        tids = sorted(refs['threats'].keys(), key=len, reverse=True)
        escaped = [re.escape(t) for t in tids]
        if escaped:
            matchers['threats'] = re.compile(r'\b(' + '|'.join(escaped) + r')\b')

    # Migrate: match software names (use word boundary, case-sensitive)
    if refs.get('migrate'):
        names = sorted(refs['migrate'].keys(), key=len, reverse=True)
        # Filter very short names that would cause false positives
        names = [n for n in names if len(n) >= 3]
        escaped = [re.escape(n) for n in names]
        if escaped:
            matchers['migrate'] = re.compile(r'\b(' + '|'.join(escaped) + r')\b')

    # Leaders: match leader names (must be at least 5 chars to avoid false positives)
    if refs.get('leaders'):
        names = sorted(refs['leaders'].keys(), key=len, reverse=True)
        names = [n for n in names if len(n) >= 5]
        escaped = [re.escape(n) for n in names]
        if escaped:
            matchers['leaders'] = re.compile(r'(' + '|'.join(escaped) + r')')

    # Compliance: match compliance framework IDs
    if refs.get('compliance'):
        cids = sorted(refs['compliance'].keys(), key=len, reverse=True)
        escaped = [re.escape(c) for c in cids]
        if escaped:
            matchers['compliance'] = re.compile(r'\b(' + '|'.join(escaped) + r')\b')

    # Timeline: match country names
    if refs.get('timeline_countries'):
        countries = sorted(refs['timeline_countries'], key=len, reverse=True)
        countries = [c for c in countries if len(c) >= 3]
        escaped = [re.escape(c) for c in countries]
        if escaped:
            matchers['timeline'] = re.compile(r'\b(' + '|'.join(escaped) + r')\b')

    return matchers


def enrich_with_crossrefs(qa_row: dict, refs: dict, matchers: dict) -> None:
    """Scan answer text and populate cross-reference columns."""
    text = qa_row.get('answer', '') + ' ' + qa_row.get('question', '')

    # Library refs
    if 'library' in matchers:
        found = set(matchers['library'].findall(text))
        qa_row['library_refs'] = ';'.join(sorted(found))
    else:
        qa_row['library_refs'] = ''

    # Algorithm refs
    if 'algorithms' in matchers:
        found = set(matchers['algorithms'].findall(text))
        qa_row['algorithm_refs'] = ';'.join(sorted(found))
    else:
        qa_row['algorithm_refs'] = ''

    # Threat refs
    if 'threats' in matchers:
        found = set(matchers['threats'].findall(text))
        qa_row['threat_refs'] = ';'.join(sorted(found))
    else:
        qa_row['threat_refs'] = ''

    # Migrate refs
    if 'migrate' in matchers:
        found = set(matchers['migrate'].findall(text))
        qa_row['migrate_refs'] = ';'.join(sorted(found))
    else:
        qa_row['migrate_refs'] = ''

    # Leader refs
    if 'leaders' in matchers:
        found = set(matchers['leaders'].findall(text))
        qa_row['leader_refs'] = ';'.join(sorted(found))
    else:
        qa_row['leader_refs'] = ''

    # Compliance refs
    if 'compliance' in matchers:
        found = set(matchers['compliance'].findall(text))
        qa_row['compliance_refs'] = ';'.join(sorted(found))
    else:
        qa_row['compliance_refs'] = ''

    # Timeline refs (countries)
    if 'timeline' in matchers:
        found = set(matchers['timeline'].findall(text))
        qa_row['timeline_refs'] = ';'.join(sorted(found))
    else:
        qa_row['timeline_refs'] = ''

    # Build deep links
    links = []
    for lib_id in qa_row['library_refs'].split(';'):
        if lib_id:
            links.append(f'/library?ref={urllib.parse.quote(lib_id)}')
    for algo in qa_row['algorithm_refs'].split(';'):
        if algo:
            links.append(f'/algorithms?highlight={urllib.parse.quote(algo)}')
    for tid in qa_row['threat_refs'].split(';'):
        if tid:
            links.append(f'/threats?id={urllib.parse.quote(tid)}')
    for leader in qa_row['leader_refs'].split(';'):
        if leader:
            links.append(f'/leaders?leader={urllib.parse.quote(leader)}')
    for sw in qa_row['migrate_refs'].split(';'):
        if sw:
            links.append(f'/migrate?q={urllib.parse.quote(sw)}')
    for country in qa_row['timeline_refs'].split(';'):
        if country:
            links.append(f'/timeline?country={urllib.parse.quote(country)}')
    # Always add the module deep link
    links.append(f'/learn/{qa_row["module_id"]}')
    qa_row['deep_links'] = ';'.join(links)


# ---------------------------------------------------------------------------
# Phase 5: Assertion generation
# ---------------------------------------------------------------------------

_FIPS_ASSERTION_RE = re.compile(r'\bFIPS\s+(\d{3})\b', re.IGNORECASE)
_LEVEL_ASSERTION_RE = re.compile(r'\b(ML-KEM-\d+|ML-DSA-\d+|FN-DSA-\d+)\b.*?Level\s+([1-5])\b',
                                  re.IGNORECASE)
_YEAR_ASSERTION_RE = re.compile(r'\b(FIPS[-\s]\d{3}|RFC\s*\d{4,})\b.*?\b(20\d{2})\b',
                                 re.IGNORECASE)
# Allowlist for known FIPS → algo mappings (mirrors fact_allowlists.json)
_FIPS_TO_ALGO = {'203': 'ML-KEM', '204': 'ML-DSA', '205': 'SLH-DSA'}


def generate_assertions(qa_row: dict) -> str:
    """Generate pipe-delimited consistency assertions from cross-references.

    In addition to EXISTS/IN reference checks, emits semantic assertions:
      fips:NNN MAPS_TO ALGO      — FIPS → algorithm mapping (cross-checked by QA-D1)
      algo_level:ALGO MATCHES N  — algorithm security level claim
    """
    assertions = []

    for lib_id in qa_row.get('library_refs', '').split(';'):
        if lib_id:
            assertions.append(f'library_ref:{lib_id} EXISTS')

    for algo in qa_row.get('algorithm_refs', '').split(';'):
        if algo:
            assertions.append(f'algorithm:{algo} IN algorithms_csv')

    for tid in qa_row.get('threat_refs', '').split(';'):
        if tid:
            assertions.append(f'threat_ref:{tid} EXISTS')

    for sw in qa_row.get('migrate_refs', '').split(';'):
        if sw:
            assertions.append(f'migrate_ref:{sw} EXISTS')

    for leader in qa_row.get('leader_refs', '').split(';'):
        if leader:
            assertions.append(f'leader_ref:{leader} EXISTS')

    for cid in qa_row.get('compliance_refs', '').split(';'):
        if cid:
            assertions.append(f'compliance_ref:{cid} EXISTS')

    # ── Semantic assertions derived from answer text ──────────────────────────
    answer = qa_row.get('answer', '')

    # FIPS_MAPS_TO: emit when the answer explicitly names a FIPS standard
    seen_fips: set[str] = set()
    for m in _FIPS_ASSERTION_RE.finditer(answer):
        fips_num = m.group(1)
        if fips_num in _FIPS_TO_ALGO and fips_num not in seen_fips:
            assertions.append(f'fips:{fips_num} MAPS_TO {_FIPS_TO_ALGO[fips_num]}')
            seen_fips.add(fips_num)

    # LEVEL_MATCHES: emit when the answer mentions a specific algorithm at a specific level
    seen_level_algos: set[str] = set()
    for m in _LEVEL_ASSERTION_RE.finditer(answer):
        algo = m.group(1).upper()
        level = m.group(2)
        if algo not in seen_level_algos:
            assertions.append(f'algo_level:{algo} MATCHES {level}')
            seen_level_algos.add(algo)

    return '|'.join(assertions)


# ---------------------------------------------------------------------------
# Phase 6: Output
# ---------------------------------------------------------------------------

def write_module_csv(module_id: str, rows: list[dict], today: str) -> Path:
    """Write per-module CSV file."""
    out_path = OUTPUT_DIR / f'module_qa_{module_id}_{today}.csv'
    with open(out_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(rows)
    return out_path


def write_combined_csv(all_rows: list[dict], today: str) -> Path:
    """Write combined CSV file with all modules."""
    out_path = OUTPUT_DIR / f'module_qa_combined_{today}.csv'
    with open(out_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(all_rows)
    return out_path


def write_lora_jsonl(all_rows: list[dict], tracks: dict, today: str) -> Path:
    """Write LoRA fine-tuning JSONL file."""
    out_path = OUTPUT_DIR / f'module_qa_lora_{today}.jsonl'
    system_prompt = (
        'You are a post-quantum cryptography expert providing educational answers '
        'about PQC migration, standards, and implementation. Cite specific NIST standards '
        '(FIPS 203, FIPS 204, FIPS 205), RFCs, and compliance frameworks. '
        'Provide technically precise, self-contained answers.'
    )

    with open(out_path, 'w', encoding='utf-8') as f:
        for row in all_rows:
            track = tracks.get(row.get('module_id', ''), 'Unknown')
            entry = {
                'system': system_prompt,
                'instruction': row['question'],
                'input': (
                    f"Context: {row.get('module_title', '')} module. "
                    f"Track: {track}. "
                    f"Difficulty: {row.get('difficulty', '')}. "
                    f"Audience: {row.get('applicable_roles', '')}. "
                    f"Regions: {row.get('applicable_regions', '')}. "
                    f"Industries: {row.get('applicable_industries', '')}."
                ),
                'output': row['answer'],
            }
            f.write(json.dumps(entry, ensure_ascii=False) + '\n')

    return out_path


def load_existing_modules() -> set[str]:
    """Load module IDs that already have Q&A CSVs."""
    existing = set()
    if OUTPUT_DIR.exists():
        for f in OUTPUT_DIR.iterdir():
            m = re.match(r'module_qa_([a-z0-9-]+)_\d{8}\.csv$', f.name)
            if m:
                existing.add(m.group(1))
    return existing


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description='Generate Q&A CSVs for PQC learning modules using Ollama'
    )
    parser.add_argument('--module', help='Process a single module by ID')
    parser.add_argument('--track', help='Process modules in a specific track')
    parser.add_argument('--dry-run', action='store_true', help='Preview content assembly only')
    parser.add_argument('--skip-existing', action='store_true', help='Skip modules with existing CSVs')
    parser.add_argument('--limit', type=int, default=0, help='Max modules to process')
    parser.add_argument('--target-count', type=int, default=0, help='Override Q&A count per module')
    parser.add_argument('--export-lora', action='store_true', help='Also generate LoRA JSONL')
    parser.add_argument('--verbose', action='store_true', help='Show raw Ollama output')
    parser.add_argument('--check-only', action='store_true', help='Run enrichment check only, no Q&A generation')
    parser.add_argument('--model', default=DEFAULT_MODEL, help=argparse.SUPPRESS)  # Hidden: always use default
    parser.add_argument('--verify', action='store_true', default=True,
                        help='Run Phase 5.5 verification after generation (default: on)')
    parser.add_argument('--no-verify', action='store_true',
                        help='Skip Phase 5.5 verification (development only)')
    args = parser.parse_args()

    # Force correct model
    model = DEFAULT_MODEL

    today = datetime.now().strftime('%m%d%Y')

    print('=' * 70)
    print('  Module Q&A Generator (Ollama)')
    print(f'  Model: {model}')
    print(f'  Date: {today}')
    print('=' * 70)

    # Ensure output directory exists
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Phase 1: Load reference sets
    print('\nPhase 1: Loading reference data sets...')
    refs = load_reference_sets()

    # Build matchers for cross-referencing
    matchers = build_matchers(refs)
    print(f'  Built {len(matchers)} cross-reference matchers')

    # Load enrichment data (library/timeline enrichments, product extractions, glossary)
    print('\n  Loading enrichment data...')
    enrichments = load_enrichment_data()

    # Phase 2: Parse module metadata from moduleData.ts
    print('\nPhase 2: Parsing module metadata...')
    ts_content = MODULE_DATA_FILE.read_text(encoding='utf-8')
    catalog = parse_module_catalog(ts_content)
    learn_sections = parse_section_labels(ts_content, 'LEARN_SECTIONS')
    workshop_steps = parse_section_labels(ts_content, 'WORKSHOP_STEPS')
    tracks = parse_module_tracks(ts_content)
    print(f'  Catalog: {len(catalog)} modules')
    print(f'  Learn sections: {len(learn_sections)} modules')
    print(f'  Workshop steps: {len(workshop_steps)} modules')
    print(f'  Tracks: {len(tracks)} modules')

    # Determine which modules to process
    module_ids = sorted(MODULE_ID_TO_DIR.keys())

    if args.module:
        if args.module not in module_ids:
            print(f'\nError: Module "{args.module}" not found. Available: {", ".join(module_ids[:5])}...')
            sys.exit(1)
        module_ids = [args.module]

    if args.track:
        module_ids = [mid for mid in module_ids if tracks.get(mid, '') == args.track]
        if not module_ids:
            available_tracks = sorted(set(tracks.values()))
            print(f'\nError: Track "{args.track}" not found. Available: {", ".join(available_tracks)}')
            sys.exit(1)

    if args.skip_existing:
        existing = load_existing_modules()
        before = len(module_ids)
        module_ids = [mid for mid in module_ids if mid not in existing]
        print(f'\n  Skipping {before - len(module_ids)} existing modules')

    if args.limit > 0:
        module_ids = module_ids[:args.limit]

    print(f'\n  Processing {len(module_ids)} modules')

    # Phase 3-5: Generate, enrich, and output
    all_rows = []
    for idx, module_id in enumerate(module_ids, 1):
        print(f'\n[{idx}/{len(module_ids)}] {module_id}')

        # Assemble content
        content = assemble_module_content(module_id, catalog, learn_sections, workshop_steps, tracks)
        if not content:
            print(f'  SKIPPED: Could not assemble content')
            continue

        learn_count = len(content['learn_sections'])
        workshop_count = len(content['workshop_steps'])
        target = compute_target_counts(learn_count, workshop_count, args.target_count)

        print(f'  Title: {content["title"]}')
        print(f'  Track: {content["track"]} | Difficulty: {content["difficulty"]}')
        print(f'  Learn sections: {learn_count} | Workshop steps: {workshop_count}')
        print(f'  RAG summary: {len(content["rag_summary"])} chars')
        print(f'  Component text: {len(content["component_text"])} chars')
        print(f'  Structured data: {len(content.get("structured_data", ""))} chars')

        # Match enrichments for this module
        enrichment_ctx = match_enrichments_for_module(
            module_id, content['rag_summary'], enrichments, refs
        )
        content['enrichment_context'] = enrichment_ctx
        if enrichment_ctx:
            print(f'  Enrichment context: {len(enrichment_ctx)} chars')

        # Run enrichment vs rag-summary consistency check
        if args.verbose or args.check_only:
            warnings = check_rag_summary_vs_enrichments(
                module_id, content['rag_summary'], enrichment_ctx
            )
            for w in warnings:
                print(f'  {w}')

        print(f'  Target Q&A: {target["total"]} (R:{target["recall"]} C:{target["comprehension"]} A:{target["application"]} S:{target["synthesis"]})')

        if args.check_only or args.dry_run:
            if args.check_only:
                print(f'  CHECK ONLY: enrichment matching complete')
            else:
                print(f'  DRY RUN: would call Ollama for {target["total"]} Q&A pairs')
            continue

        # Call Ollama
        qa_pairs = call_ollama(model, content, target, verbose=args.verbose)
        if not qa_pairs:
            print(f'  FAILED: No Q&A pairs generated')
            continue

        print(f'  Generated {len(qa_pairs)} Q&A pairs')

        # Convert to CSV rows with cross-references
        module_rows = []
        for i, qa in enumerate(qa_pairs):
            content_type = qa.get('content_type', 'both')
            if content_type not in ('learn', 'workshop', 'both'):
                content_type = 'both'

            difficulty = qa.get('difficulty', 'comprehension')
            if difficulty not in ('recall', 'comprehension', 'application', 'synthesis'):
                difficulty = 'comprehension'

            row = {
                'question_id': f'{module_id}-{content_type}-{i+1:03d}',
                'module_id': module_id,
                'module_title': content['title'],
                'question': qa.get('question', ''),
                'answer': qa.get('answer', ''),
                'content_type': content_type,
                'difficulty': difficulty,
                'applicable_roles': qa.get('roles', 'developer;architect'),
                'applicable_levels': qa.get('levels', content['difficulty']),
                'applicable_regions': qa.get('regions', 'Global'),
                'applicable_industries': qa.get('industries', 'General'),
                'source_citations': qa.get('source_citations', 'rag-summary.md'),
            }

            # Phase 4: Cross-reference enrichment
            enrich_with_crossrefs(row, refs, matchers)

            # Phase 5: Generate consistency assertions
            row['consistency_assertions'] = generate_assertions(row)

            module_rows.append(row)

        # Phase 5.5: Verify Q&A accuracy (programmatic + optional Haiku)
        run_verify = _QA_VERIFIER_AVAILABLE and not args.no_verify
        if run_verify and module_rows:
            print(f'  Phase 5.5: Verifying {len(module_rows)} Q&A pairs...')
            use_haiku = args.verify and not args.no_verify
            verify_results = verify_module_batch(
                module_id, module_rows, verbose=args.verbose, use_haiku=use_haiku
            )
            # Index results by question_id
            verify_by_id = {r['question_id']: r for r in verify_results}

            kept_rows = []
            excluded = 0
            flagged = 0
            for row in module_rows:
                qid = row['question_id']
                result = verify_by_id.get(qid, {'status': 'PASS', 'finding': None})
                status = result.get('status', 'PASS')

                if status == 'FAIL':
                    # Exclude from output — hallucination detected
                    finding = result.get('finding', 'Unknown error')
                    print(f'    EXCLUDED [{qid}]: {finding}')
                    excluded += 1
                elif status == 'FLAG':
                    # Keep but annotate source_citations
                    finding = result.get('finding', 'Needs review')
                    existing = row.get('source_citations', 'rag-summary.md')
                    row['source_citations'] = f'{existing} [FLAGGED: {finding}]'
                    kept_rows.append(row)
                    flagged += 1
                else:
                    kept_rows.append(row)

            if excluded or flagged:
                print(f'    Verification: {len(kept_rows)} kept, {excluded} excluded, {flagged} flagged')
            else:
                print(f'    Verification: all {len(kept_rows)} pairs passed')
            module_rows = kept_rows
        elif not _QA_VERIFIER_AVAILABLE:
            print(f'  Phase 5.5: Skipped (qa_verifier.py not importable)')

        # Write per-module CSV
        csv_path = write_module_csv(module_id, module_rows, today)
        print(f'  Wrote {len(module_rows)} rows to {csv_path.name}')

        all_rows.extend(module_rows)

    if args.check_only:
        print(f'\n{"=" * 70}')
        print(f'  CHECK ONLY complete. {len(module_ids)} modules checked.')
        print(f'{"=" * 70}')
        return

    if args.dry_run:
        print(f'\n{"=" * 70}')
        print(f'  DRY RUN complete. {len(module_ids)} modules previewed.')
        print(f'{"=" * 70}')
        return

    if not all_rows:
        print('\nNo Q&A pairs generated. Nothing to write.')
        return

    # Phase 6: Combined outputs
    print(f'\n{"=" * 70}')
    print(f'  Phase 6: Writing combined outputs...')

    combined_path = write_combined_csv(all_rows, today)
    print(f'  Combined CSV: {combined_path.name} ({len(all_rows)} rows)')

    if args.export_lora:
        lora_path = write_lora_jsonl(all_rows, tracks, today)
        print(f'  LoRA JSONL: {lora_path.name} ({len(all_rows)} entries)')

    # Summary
    print(f'\n  Summary:')
    print(f'    Modules processed: {len(module_ids)}')
    print(f'    Total Q&A pairs: {len(all_rows)}')

    # Cross-ref stats
    lib_count = sum(1 for r in all_rows if r.get('library_refs'))
    algo_count = sum(1 for r in all_rows if r.get('algorithm_refs'))
    threat_count = sum(1 for r in all_rows if r.get('threat_refs'))
    migrate_count = sum(1 for r in all_rows if r.get('migrate_refs'))
    leader_count = sum(1 for r in all_rows if r.get('leader_refs'))
    compliance_count = sum(1 for r in all_rows if r.get('compliance_refs'))
    timeline_count = sum(1 for r in all_rows if r.get('timeline_refs'))

    print(f'    Rows with library refs: {lib_count}')
    print(f'    Rows with algorithm refs: {algo_count}')
    print(f'    Rows with threat refs: {threat_count}')
    print(f'    Rows with migrate refs: {migrate_count}')
    print(f'    Rows with leader refs: {leader_count}')
    print(f'    Rows with compliance refs: {compliance_count}')
    print(f'    Rows with timeline refs: {timeline_count}')

    assertion_count = sum(len(r.get('consistency_assertions', '').split('|')) for r in all_rows if r.get('consistency_assertions'))
    print(f'    Total consistency assertions: {assertion_count}')

    print(f'\n{"=" * 70}')
    print(f'  Done.')
    print(f'{"=" * 70}')


if __name__ == '__main__':
    main()
