#!/usr/bin/env python3
"""
scripts/verify-module-qa-haiku.py

Post-generation verification of module Q&A CSVs using Claude Haiku.
Checks each Q&A pair against LOCAL site resources only (rag-summary.md,
module components, library CSV, algorithm CSV, local docs).

Outputs:
  - Console report with PASS/FLAG/FAIL per Q&A
  - JSON report → src/data/module-qa/verification_MMDDYYYY.json

Usage:
  python3 scripts/verify-module-qa-haiku.py                    # verify all generated modules
  python3 scripts/verify-module-qa-haiku.py --module pqc-101   # single module
  python3 scripts/verify-module-qa-haiku.py --limit 5          # first N modules
  python3 scripts/verify-module-qa-haiku.py --verbose          # show Haiku responses

Requires:
  pip install anthropic
  ANTHROPIC_API_KEY environment variable (or Claude Code environment)
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
import sys
import time
from datetime import datetime
from pathlib import Path

try:
    import anthropic
except ImportError:
    print('Error: anthropic package not installed. Run: pip install anthropic')
    sys.exit(1)

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

ROOT = Path(__file__).parent.parent
DATA_DIR = ROOT / 'src' / 'data'
MODULES_DIR = ROOT / 'src' / 'components' / 'PKILearning' / 'modules'
QA_DIR = DATA_DIR / 'module-qa'
PUBLIC_DIR = ROOT / 'public'

# Module directory mapping (mirrors generate-module-qa-ollama.py)
MODULE_ID_TO_DIR = {
    'pqc-101': 'Module1-Introduction', 'quantum-threats': 'QuantumThreats',
    'hybrid-crypto': 'HybridCrypto', 'crypto-agility': 'CryptoAgility',
    'tls-basics': 'TLSBasics', 'vpn-ssh-pqc': 'VPNSSHModule',
    'email-signing': 'EmailSigning', 'pki-workshop': 'PKIWorkshop',
    'stateful-signatures': 'StatefulSignatures', 'digital-assets': 'DigitalAssets',
    '5g-security': 'FiveG', 'digital-id': 'DigitalID',
    'entropy-randomness': 'Entropy', 'merkle-tree-certs': 'MerkleTreeCerts',
    'qkd': 'QKD', 'api-security-jwt': 'APISecurityJWT',
    'code-signing': 'CodeSigning', 'iot-ot-pqc': 'IoTOT',
    'pqc-risk-management': 'PQCRiskManagement', 'pqc-business-case': 'PQCBusinessCase',
    'pqc-governance': 'PQCGovernance', 'compliance-strategy': 'ComplianceStrategy',
    'migration-program': 'MigrationProgram', 'vendor-risk': 'VendorRisk',
    'data-asset-sensitivity': 'DataAssetSensitivity', 'kms-pqc': 'KmsPqc',
    'hsm-pqc': 'HsmPqc', 'web-gateway-pqc': 'WebGatewayPQC',
    'exec-quantum-impact': 'ExecQuantumImpact', 'dev-quantum-impact': 'DevQuantumImpact',
    'arch-quantum-impact': 'ArchQuantumImpact', 'ops-quantum-impact': 'OpsQuantumImpact',
    'research-quantum-impact': 'ResearchQuantumImpact', 'ai-security-pqc': 'AISecurityPQC',
    'aerospace-pqc': 'AerospacePQC', 'automotive-pqc': 'AutomotivePQC',
    'confidential-computing': 'ConfidentialComputing', 'crypto-dev-apis': 'CryptoDevAPIs',
    'database-encryption-pqc': 'DatabaseEncryptionPQC', 'emv-payment-pqc': 'EMVPaymentPQC',
    'energy-utilities-pqc': 'EnergyUtilities', 'healthcare-pqc': 'HealthcarePQC',
    'iam-pqc': 'IAMPQC', 'network-security-pqc': 'NetworkSecurityPQC',
    'os-pqc': 'OSPQC', 'platform-eng-pqc': 'PlatformEngPQC',
    'secrets-management-pqc': 'SecretsManagementPQC', 'secure-boot-pqc': 'SecureBootPQC',
    'standards-bodies': 'StandardsBodies', 'pqc-testing-validation': 'PQCTestingValidation',
}

MODEL = 'claude-haiku-4-5-20251001'

# ---------------------------------------------------------------------------
# Local resource loading
# ---------------------------------------------------------------------------

def find_latest_csv(prefix: str) -> Path | None:
    """Find latest versioned CSV."""
    pattern = re.compile(rf'^{re.escape(prefix)}\d{{8}}(_r\d+)?\.csv$')
    files = [f for f in DATA_DIR.iterdir() if pattern.match(f.name)]
    if not files:
        return None
    def sort_key(f):
        m = re.search(rf'(\d{{2}})(\d{{2}})(\d{{4}})(_r(\d+))?\.csv$', f.name)
        if not m: return ('0', 0)
        return (f'{m.group(3)}-{m.group(1)}-{m.group(2)}', int(m.group(5) or 0))
    files.sort(key=sort_key, reverse=True)
    return files[0]


def load_module_sources(module_id: str) -> str:
    """Load all local source content for a module."""
    dir_name = MODULE_ID_TO_DIR.get(module_id)
    if not dir_name:
        return ''

    module_dir = MODULES_DIR / dir_name
    if not module_dir.exists():
        return ''

    parts = []

    # RAG summary
    rag = module_dir / 'rag-summary.md'
    if rag.exists():
        parts.append(f'=== rag-summary.md ===\n{rag.read_text(errors="ignore")[:6000]}')

    # Curious summary
    curious = module_dir / 'curious-summary.md'
    if curious.exists():
        parts.append(f'=== curious-summary.md ===\n{curious.read_text(errors="ignore")[:3000]}')

    # TSX/TS component files (extract string content)
    for f in sorted(module_dir.rglob('*.tsx')):
        if '.test.' in f.name:
            continue
        content = f.read_text(errors='ignore')
        # Extract JSX text and string literals
        texts = re.findall(r'>\s*([^<>{]+?)\s*<', content)
        strings = re.findall(r"'([^']{15,})'", content)
        combined = [t.strip() for t in texts if len(t.strip()) > 10] + \
                   [s for s in strings if not s.startswith(('import ', 'from ', '@/', 'http'))]
        if combined:
            parts.append(f'=== {f.relative_to(module_dir)} ===\n' + '\n'.join(combined[:50]))

    for f in sorted(module_dir.rglob('*.ts')):
        if '.test.' in f.name or f.suffix == '.tsx':
            continue
        content = f.read_text(errors='ignore')
        if len(content) > 100:
            parts.append(f'=== {f.relative_to(module_dir)} ===\n{content[:4000]}')

    return '\n\n'.join(parts)[:20000]


def load_reference_context(qa_rows: list[dict]) -> str:
    """Load relevant CSV rows for cross-referenced items."""
    parts = []

    # Collect all referenced IDs
    lib_refs = set()
    algo_refs = set()
    for row in qa_rows:
        for ref in row.get('library_refs', '').split(';'):
            if ref.strip():
                lib_refs.add(ref.strip())
        for ref in row.get('algorithm_refs', '').split(';'):
            if ref.strip():
                algo_refs.add(ref.strip())

    # Load matching library rows
    if lib_refs:
        lib_csv = find_latest_csv('library_')
        if lib_csv:
            with open(lib_csv, 'r', encoding='utf-8-sig', errors='ignore') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    rid = row.get('reference_id', '').strip()
                    if rid in lib_refs:
                        parts.append(
                            f'Library [{rid}]: {row.get("document_title", "")} | '
                            f'Published: {row.get("initial_publication_date", "")} | '
                            f'Type: {row.get("document_type", "")} | '
                            f'Desc: {row.get("short_description", "")[:200]}'
                        )

    # Load matching algorithm rows
    if algo_refs:
        algo_csv = find_latest_csv('pqc_complete_algorithm_reference_')
        if algo_csv:
            with open(algo_csv, 'r', encoding='utf-8-sig', errors='ignore') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    name = row.get('Algorithm', '').strip()
                    family = row.get('Algorithm Family', '').strip()
                    if name in algo_refs or family in algo_refs:
                        parts.append(
                            f'Algorithm [{name}]: Family={family} | '
                            f'Level={row.get("NIST Security Level", "")} | '
                            f'PubKey={row.get("Public Key (bytes)", "")}B | '
                            f'FIPS={row.get("FIPS Standard", "")}'
                        )

    return '\n'.join(parts)[:5000] if parts else '(no cross-referenced data found)'


# ---------------------------------------------------------------------------
# Haiku verification
# ---------------------------------------------------------------------------

VERIFY_PROMPT = """You are a fact-checker for PQC (Post-Quantum Cryptography) Q&A pairs.

RULES:
1. ONLY verify against the provided LOCAL SOURCE MATERIAL below. Do NOT use your own knowledge.
2. For each Q&A pair, check: dates, algorithm names, FIPS standard numbers, key sizes, security levels, protocol details, and any specific technical claims.
3. Output a JSON array where each element has:
   - "question_id": the ID
   - "status": "PASS" | "FLAG" | "FAIL"
   - "finding": null if PASS, otherwise a string explaining what's unsupported or wrong
   - "correction": null if PASS, otherwise the corrected text

STATUS GUIDE:
- PASS: All claims are directly supported by the local sources
- FLAG: A claim is plausible but not explicitly stated in the provided sources (may need manual review)
- FAIL: A claim directly contradicts the local sources

=== LOCAL SOURCE MATERIAL ===
{sources}

=== REFERENCE DATA (CSV rows for cross-referenced items) ===
{ref_context}

=== Q&A PAIRS TO VERIFY ===
{qa_pairs}

Output ONLY a JSON array, nothing else:"""


def verify_module(client: anthropic.Anthropic, module_id: str,
                  qa_rows: list[dict], verbose: bool = False) -> list[dict]:
    """Verify Q&A pairs for a single module using Haiku."""
    # Load local sources
    sources = load_module_sources(module_id)
    ref_context = load_reference_context(qa_rows)

    # Format Q&A pairs
    qa_text = []
    for row in qa_rows:
        qa_text.append(
            f'ID: {row["question_id"]}\n'
            f'Q: {row["question"]}\n'
            f'A: {row["answer"]}\n'
            f'Library refs: {row.get("library_refs", "")}\n'
            f'Algorithm refs: {row.get("algorithm_refs", "")}\n'
            f'Compliance refs: {row.get("compliance_refs", "")}\n'
        )

    prompt = VERIFY_PROMPT.format(
        sources=sources,
        ref_context=ref_context,
        qa_pairs='\n---\n'.join(qa_text),
    )

    # Call Haiku — batch up to 10 Q&A pairs per call
    batch_size = 10
    all_results = []

    for i in range(0, len(qa_rows), batch_size):
        batch = qa_rows[i:i + batch_size]
        batch_qa = qa_text[i:i + batch_size]

        batch_prompt = VERIFY_PROMPT.format(
            sources=sources,
            ref_context=ref_context,
            qa_pairs='\n---\n'.join(batch_qa),
        )

        try:
            response = client.messages.create(
                model=MODEL,
                max_tokens=4096,
                messages=[{'role': 'user', 'content': batch_prompt}],
            )
            text = response.content[0].text.strip()

            if verbose:
                print(f'    [Haiku response: {len(text)} chars]')

            # Parse JSON
            results = parse_verify_json(text)
            all_results.extend(results)

        except Exception as e:
            print(f'    Error calling Haiku: {e}')
            # Mark all as unknown
            for row in batch:
                all_results.append({
                    'question_id': row['question_id'],
                    'status': 'FLAG',
                    'finding': f'Verification failed: {e}',
                    'correction': None,
                })

    return all_results


def parse_verify_json(text: str) -> list[dict]:
    """Parse JSON verification results."""
    try:
        data = json.loads(text)
        if isinstance(data, list):
            return data
    except json.JSONDecodeError:
        pass

    # Try extracting from markdown
    m = re.search(r'```(?:json)?\s*(\[.*?\])\s*```', text, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(1))
        except json.JSONDecodeError:
            pass

    # Try first [ to last ]
    start = text.find('[')
    end = text.rfind(']')
    if start != -1 and end > start:
        try:
            return json.loads(text[start:end + 1])
        except json.JSONDecodeError:
            pass

    return []


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description='Verify module Q&A CSVs using Claude Haiku')
    parser.add_argument('--module', help='Verify a single module')
    parser.add_argument('--limit', type=int, default=0, help='Max modules to verify')
    parser.add_argument('--verbose', action='store_true', help='Show Haiku responses')
    args = parser.parse_args()

    # Initialize Anthropic client
    api_key = os.environ.get('ANTHROPIC_API_KEY', '')
    if not api_key:
        print('Error: ANTHROPIC_API_KEY not set.')
        print('Set it with: export ANTHROPIC_API_KEY="sk-ant-..."')
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)

    today = datetime.now().strftime('%m%d%Y')

    print('=' * 60)
    print('  Module Q&A Verifier (Claude Haiku)')
    print(f'  Model: {MODEL}')
    print('=' * 60)

    # Find per-module CSVs
    if not QA_DIR.exists():
        print('\nNo module-qa directory found.')
        sys.exit(1)

    csv_files = sorted(QA_DIR.glob('module_qa_*_*.csv'))
    csv_files = [f for f in csv_files if 'combined' not in f.name and 'lora' not in f.name]

    if args.module:
        csv_files = [f for f in csv_files if args.module in f.name]

    if args.limit > 0:
        csv_files = csv_files[:args.limit]

    if not csv_files:
        print('\nNo Q&A CSVs found to verify.')
        sys.exit(1)

    print(f'\n  Verifying {len(csv_files)} module(s)...\n')

    all_results = {}
    total_pass = 0
    total_flag = 0
    total_fail = 0

    for csv_file in csv_files:
        # Extract module_id from filename
        m = re.match(r'module_qa_(.+)_\d{8}\.csv$', csv_file.name)
        if not m:
            continue
        module_id = m.group(1)

        # Load Q&A rows
        with open(csv_file, 'r', encoding='utf-8') as f:
            rows = list(csv.DictReader(f))

        print(f'  [{module_id}] {len(rows)} Q&A pairs')

        # Verify with Haiku
        results = verify_module(client, module_id, rows, verbose=args.verbose)

        # Tally
        pass_count = sum(1 for r in results if r.get('status') == 'PASS')
        flag_count = sum(1 for r in results if r.get('status') == 'FLAG')
        fail_count = sum(1 for r in results if r.get('status') == 'FAIL')

        total_pass += pass_count
        total_flag += flag_count
        total_fail += fail_count

        print(f'    PASS: {pass_count}  FLAG: {flag_count}  FAIL: {fail_count}')

        # Show findings
        for r in results:
            if r.get('status') in ('FLAG', 'FAIL'):
                print(f'    {r["status"]} [{r["question_id"]}]: {r.get("finding", "")}')
                if r.get('correction'):
                    print(f'      Correction: {r["correction"][:200]}')

        all_results[module_id] = results

    # Write verification report
    report = {
        'timestamp': datetime.now().isoformat(),
        'model': MODEL,
        'summary': {
            'modules': len(csv_files),
            'total_qa': total_pass + total_flag + total_fail,
            'pass': total_pass,
            'flag': total_flag,
            'fail': total_fail,
        },
        'modules': all_results,
    }

    report_path = QA_DIR / f'verification_{today}.json'
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print(f'\n{"=" * 60}')
    print(f'  Summary: {total_pass} PASS / {total_flag} FLAG / {total_fail} FAIL')
    print(f'  Report: {report_path.name}')
    print(f'{"=" * 60}')


if __name__ == '__main__':
    main()
