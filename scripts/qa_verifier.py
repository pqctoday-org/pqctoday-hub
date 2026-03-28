#!/usr/bin/env python3
"""
scripts/qa_verifier.py

Shared Q&A verification module used by:
  - generate-module-qa-ollama.py  (Phase 5.5 inline verification during generation)
  - verify-module-qa-haiku.py     (standalone post-generation verification)

Provides two verification strategies:
  1. Programmatic fact-check (offline, zero API cost) — uses fact_allowlists.json
  2. Claude Haiku semantic verification (requires ANTHROPIC_API_KEY) — checks against
     local source material (rag-summary.md, module components, CSV cross-references)

Public API:
  verify_programmatic(answer: str, allowlists: dict) -> list[VerificationFinding]
  verify_with_haiku(client, module_id: str, qa_rows: list[dict], verbose: bool = False)
      -> list[dict]  # [{question_id, status, finding, correction}]
  verify_module_batch(module_id: str, qa_rows: list[dict], verbose: bool = False,
                      use_haiku: bool = True) -> list[dict]
"""

from __future__ import annotations

import csv
import json
import re
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

ROOT = Path(__file__).parent.parent
DATA_DIR = ROOT / 'src' / 'data'
MODULES_DIR = ROOT / 'src' / 'components' / 'PKILearning' / 'modules'
ALLOWLISTS_FILE = ROOT / 'scripts' / 'fact_allowlists.json'

HAIKU_MODEL = 'claude-haiku-4-5-20251001'

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

# ---------------------------------------------------------------------------
# Data types
# ---------------------------------------------------------------------------

@dataclass
class VerificationFinding:
    """A single finding from programmatic fact-checking."""
    severity: str           # 'ERROR' | 'WARNING'
    check_id: str           # e.g. 'QA-F1', 'QA-F3'
    message: str
    question_id: str = ''


# ---------------------------------------------------------------------------
# Allowlist loading
# ---------------------------------------------------------------------------

_cached_allowlists: dict | None = None


def load_allowlists() -> dict:
    """Load fact_allowlists.json (cached after first call)."""
    global _cached_allowlists
    if _cached_allowlists is not None:
        return _cached_allowlists
    if not ALLOWLISTS_FILE.exists():
        _cached_allowlists = {}
        return _cached_allowlists
    with open(ALLOWLISTS_FILE, encoding='utf-8') as f:
        _cached_allowlists = json.load(f)
    return _cached_allowlists


# ---------------------------------------------------------------------------
# Programmatic fact-checking (T1.2)
# ---------------------------------------------------------------------------

# Patterns used across checks
_FIPS_RE = re.compile(r'\bFIPS\s+(\d{3})\b', re.IGNORECASE)
_YEAR_RE = re.compile(r'\b((?:19|20)\d{2})\b')
_RFC_LIKE_RE = re.compile(
    r'\b(?:RFC|FIPS|SP|NIST|ISO|IEEE|IETF|ITU|ETSI|CNSA|PKCS)\s*[\w\-.]+',
    re.IGNORECASE,
)
_LEVEL_RE = re.compile(r'(?<!SLSA\s)(?<!requiring\s)Level\s+([1-5])\b', re.IGNORECASE)
_SIZE_RE = re.compile(r'(?<![,\d])(\d{2,6})\s*bytes', re.IGNORECASE)

# Algorithms that use variable-length signatures (allow ±15% tolerance)
_VARIABLE_LEN_ALGOS = {'FN-DSA-512', 'FN-DSA-1024', 'FN-DSA'}

# Clauses that likely contain contrast language (safe to skip in QA-F6)
_CONTRAST_WORDS = re.compile(
    r'\b(unlike|however|but|whereas|contrast|does not|not a|classical|pre-pqc|'
    r'before pqc|non-pqc|traditional|legacy)\b',
    re.IGNORECASE,
)


def _collect_standard_tokens(text: str) -> set[str]:
    """Collect all RFC/FIPS/standard-like tokens to exclude from year matching."""
    tokens: set[str] = set()
    for m in _RFC_LIKE_RE.finditer(text):
        for num_m in re.finditer(r'\d{4,}', m.group()):
            tokens.add(num_m.group())
    return tokens


def _split_into_clauses(text: str) -> list[str]:
    """Split text into independent clauses for per-clause analysis."""
    return re.split(r'[.!?;]\s+|,\s+(?:while|whereas|and|but)\s+', text)


def verify_programmatic(answer: str, allowlists: dict,
                        question_id: str = '') -> list[VerificationFinding]:
    """
    Run all programmatic fact-checks against a single Q&A answer.

    Returns a list of VerificationFinding items (empty = all clear).
    Checks:
      QA-F1  FIPS → algorithm mapping (ERROR)
      QA-F2  Date plausibility (WARNING)
      QA-F3  Security level consistency (ERROR)
      QA-F4  Key/signature size accuracy (WARNING)
      QA-F6  Non-PQC standard misattribution (ERROR)
    """
    findings: list[VerificationFinding] = []

    fips_to_algo: dict[str, str] = allowlists.get('fips_to_algorithm', {})
    security_levels: dict[str, int | str] = allowlists.get('security_level_map', {})
    size_map: dict[str, dict[str, str]] = allowlists.get('size_map', {})
    non_pqc: dict[str, str] = allowlists.get('non_pqc_standards', {})
    canonical_names: list[str] = allowlists.get('canonical_algorithm_names', [])

    # ── QA-F1: FIPS → algorithm co-occurrence ────────────────────────────────
    for m in _FIPS_RE.finditer(answer):
        fips_num = m.group(1)
        expected_algo = fips_to_algo.get(fips_num)
        if not expected_algo:
            continue  # unknown FIPS — not our problem to flag here

        # Check that the expected algorithm appears near the FIPS mention
        window_start = max(0, m.start() - 200)
        window_end = min(len(answer), m.end() + 200)
        window = answer[window_start:window_end]

        # Other PQC algorithms that should NOT appear with this FIPS
        other_pqc = [a for a in fips_to_algo.values() if a != expected_algo]
        for wrong_algo in other_pqc:
            if re.search(rf'\b{re.escape(wrong_algo)}\b', window, re.IGNORECASE):
                findings.append(VerificationFinding(
                    severity='ERROR',
                    check_id='QA-F1',
                    message=(
                        f'FIPS {fips_num} co-occurs with {wrong_algo} '
                        f'(should be {expected_algo})'
                    ),
                    question_id=question_id,
                ))

    # ── QA-F2: Date plausibility ─────────────────────────────────────────────
    standard_tokens = _collect_standard_tokens(answer)
    for m in _YEAR_RE.finditer(answer):
        year_str = m.group(1)
        if year_str in standard_tokens:
            continue  # part of a standard number, not a standalone date
        year = int(year_str)
        if year < 2000 or year > 2045:
            findings.append(VerificationFinding(
                severity='WARNING',
                check_id='QA-F2',
                message=f'Implausible year {year} (expected 2000–2045)',
                question_id=question_id,
            ))

    # ── QA-F3: Security level consistency ────────────────────────────────────
    for clause in _split_into_clauses(answer):
        if re.search(r'\bSLSA\b', clause):
            continue  # SLSA levels, not NIST levels

        algo_hits = [
            name for name in canonical_names
            if re.search(rf'\b{re.escape(name)}\b', clause, re.IGNORECASE)
            and name in security_levels
        ]
        level_hits = [int(m.group(1)) for m in _LEVEL_RE.finditer(clause)]

        if len(algo_hits) != 1 or len(level_hits) != 1:
            continue  # ambiguous clause, skip

        algo = algo_hits[0]
        claimed_level = level_hits[0]
        expected_level = security_levels.get(algo)
        if expected_level is not None and int(expected_level) != claimed_level:
            findings.append(VerificationFinding(
                severity='ERROR',
                check_id='QA-F3',
                message=(
                    f'{algo} claimed at Level {claimed_level}, '
                    f'expected Level {expected_level}'
                ),
                question_id=question_id,
            ))

    # ── QA-F4: Key/signature size accuracy ───────────────────────────────────
    # Only check the first segment before comparison phrases
    comparison_split = re.split(
        r'\bcompared to\b|\bversus\b|\bwhile\b|\bwhereas\b', answer, maxsplit=1,
        flags=re.IGNORECASE,
    )
    check_segment = comparison_split[0]

    for algo_name, sizes in size_map.items():
        if algo_name not in canonical_names:
            continue
        if not re.search(rf'\b{re.escape(algo_name)}\b', check_segment, re.IGNORECASE):
            continue

        tolerance = 0.15 if algo_name in _VARIABLE_LEN_ALGOS else 0.0

        for col_label, expected_str in sizes.items():
            try:
                expected = int(expected_str)
            except ValueError:
                continue

            for size_m in _SIZE_RE.finditer(check_segment):
                claimed = int(size_m.group(1))
                if claimed == 0:
                    continue
                lo = int(expected * (1 - tolerance))
                hi = int(expected * (1 + tolerance))
                # Only flag if the size is clearly wrong (not within tolerance range)
                if not (lo <= claimed <= hi):
                    # Ignore very small sizes that are likely unrelated (< 100 bytes for large algos)
                    if expected > 1000 and claimed < 100:
                        continue
                    # Make sure this size is plausibly about this algorithm
                    # by checking it appears near the algorithm name
                    algo_pos = answer.lower().find(algo_name.lower())
                    size_pos = size_m.start()
                    if abs(size_pos - algo_pos) > 300:
                        continue
                    findings.append(VerificationFinding(
                        severity='WARNING',
                        check_id='QA-F4',
                        message=(
                            f'{algo_name} {col_label}: claimed {claimed}, '
                            f'expected {expected}'
                            + (f' (±{int(tolerance*100)}%)' if tolerance else '')
                        ),
                        question_id=question_id,
                    ))

    # ── QA-F6: Non-PQC standard misattribution ───────────────────────────────
    pqc_algo_names = list(fips_to_algo.values())  # ML-KEM, ML-DSA, SLH-DSA

    for std_name, std_desc in non_pqc.items():
        if std_name not in answer:
            continue
        # Find sentences containing this standard
        sentences = re.split(r'(?<=[.!?])\s+', answer)
        for sentence in sentences:
            if std_name not in sentence:
                continue
            if _CONTRAST_WORDS.search(sentence):
                continue  # contrast context — intentional juxtaposition
            for pqc_algo in pqc_algo_names:
                if re.search(rf'\b{re.escape(pqc_algo)}\b', sentence, re.IGNORECASE):
                    findings.append(VerificationFinding(
                        severity='ERROR',
                        check_id='QA-F6',
                        message=(
                            f'{pqc_algo} attributed to {std_name} '
                            f'({std_desc})'
                        ),
                        question_id=question_id,
                    ))
                    break  # one finding per standard+sentence

    return findings


# ---------------------------------------------------------------------------
# Local source loading for Haiku verification
# ---------------------------------------------------------------------------

def _find_latest_csv(prefix: str) -> Path | None:
    """Find latest versioned CSV in DATA_DIR."""
    pattern = re.compile(rf'^{re.escape(prefix)}\d{{8}}(_r\d+)?\.csv$')
    files = [f for f in DATA_DIR.iterdir() if pattern.match(f.name)]
    if not files:
        return None

    def sort_key(f: Path):
        m = re.search(r'(\d{2})(\d{2})(\d{4})(_r(\d+))?\.csv$', f.name)
        if not m:
            return ('0', 0)
        return (f'{m.group(3)}-{m.group(1)}-{m.group(2)}', int(m.group(5) or 0))

    files.sort(key=sort_key, reverse=True)
    return files[0]


def load_module_sources(module_id: str) -> str:
    """Load all local source content for a module (rag-summary, components)."""
    dir_name = MODULE_ID_TO_DIR.get(module_id)
    if not dir_name:
        return ''

    module_dir = MODULES_DIR / dir_name
    if not module_dir.exists():
        return ''

    parts = []

    rag = module_dir / 'rag-summary.md'
    if rag.exists():
        parts.append(f'=== rag-summary.md ===\n{rag.read_text(errors="ignore")[:6000]}')

    curious = module_dir / 'curious-summary.md'
    if curious.exists():
        parts.append(f'=== curious-summary.md ===\n{curious.read_text(errors="ignore")[:3000]}')

    for f in sorted(module_dir.rglob('*.tsx')):
        if '.test.' in f.name:
            continue
        content = f.read_text(errors='ignore')
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
    """Load relevant CSV rows for cross-referenced items in the Q&A rows."""
    parts = []

    lib_refs: set[str] = set()
    algo_refs: set[str] = set()
    for row in qa_rows:
        for ref in row.get('library_refs', '').split(';'):
            if ref.strip():
                lib_refs.add(ref.strip())
        for ref in row.get('algorithm_refs', '').split(';'):
            if ref.strip():
                algo_refs.add(ref.strip())

    if lib_refs:
        lib_csv = _find_latest_csv('library_')
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

    if algo_refs:
        algo_csv = _find_latest_csv('pqc_complete_algorithm_reference_')
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

_VERIFY_PROMPT = """You are a fact-checker for PQC (Post-Quantum Cryptography) Q&A pairs.

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


def _parse_verify_json(text: str) -> list[dict]:
    """Parse JSON verification results from Haiku response."""
    try:
        data = json.loads(text)
        if isinstance(data, list):
            return data
    except json.JSONDecodeError:
        pass

    m = re.search(r'```(?:json)?\s*(\[.*?\])\s*```', text, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(1))
        except json.JSONDecodeError:
            pass

    start = text.find('[')
    end = text.rfind(']')
    if start != -1 and end > start:
        try:
            return json.loads(text[start:end + 1])
        except json.JSONDecodeError:
            pass

    return []


def verify_with_haiku(client: object, module_id: str, qa_rows: list[dict],
                      verbose: bool = False) -> list[dict]:
    """
    Verify Q&A pairs for a single module using Claude Haiku.

    Returns list of dicts with keys: question_id, status, finding, correction.
    Status values: PASS | FLAG | FAIL
    """
    sources = load_module_sources(module_id)
    ref_context = load_reference_context(qa_rows)

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

    batch_size = 10
    all_results: list[dict] = []

    for i in range(0, len(qa_rows), batch_size):
        batch = qa_rows[i:i + batch_size]
        batch_qa = qa_text[i:i + batch_size]

        batch_prompt = _VERIFY_PROMPT.format(
            sources=sources,
            ref_context=ref_context,
            qa_pairs='\n---\n'.join(batch_qa),
        )

        try:
            response = client.messages.create(  # type: ignore[union-attr]
                model=HAIKU_MODEL,
                max_tokens=4096,
                messages=[{'role': 'user', 'content': batch_prompt}],
            )
            text = response.content[0].text.strip()

            if verbose:
                print(f'    [Haiku: {len(text)} chars for batch {i//batch_size + 1}]')

            results = _parse_verify_json(text)
            all_results.extend(results)

        except Exception as e:
            print(f'    Error calling Haiku: {e}')
            for row in batch:
                all_results.append({
                    'question_id': row['question_id'],
                    'status': 'FLAG',
                    'finding': f'Verification failed: {e}',
                    'correction': None,
                })

    return all_results


# ---------------------------------------------------------------------------
# Combined verification entry point
# ---------------------------------------------------------------------------

def verify_module_batch(module_id: str, qa_rows: list[dict],
                        verbose: bool = False,
                        use_haiku: bool = True) -> list[dict]:
    """
    Run both programmatic and (optionally) Haiku verification on a batch of Q&A rows.

    Strategy:
    1. Always run programmatic checks (instant, offline)
    2. Run Haiku if use_haiku=True AND ANTHROPIC_API_KEY is set

    Returns list of dicts: {question_id, status, finding, correction}
    Merges programmatic ERRORs as FAIL, WARNINGs as FLAG, passes as PASS.
    Haiku results take precedence for semantic FAIL/FLAG over programmatic PASS.
    """
    allowlists = load_allowlists()

    # Step 1: Programmatic fact-check
    programmatic: dict[str, dict] = {}
    for row in qa_rows:
        qid = row.get('question_id', '')
        answer = row.get('answer', '')
        findings = verify_programmatic(answer, allowlists, question_id=qid)

        errors = [f for f in findings if f.severity == 'ERROR']
        warnings = [f for f in findings if f.severity == 'WARNING']

        if errors:
            finding_text = '; '.join(f.message for f in errors)
            programmatic[qid] = {
                'question_id': qid,
                'status': 'FAIL',
                'finding': f'[Programmatic] {finding_text}',
                'correction': None,
            }
        elif warnings:
            finding_text = '; '.join(f.message for f in warnings)
            programmatic[qid] = {
                'question_id': qid,
                'status': 'FLAG',
                'finding': f'[Programmatic] {finding_text}',
                'correction': None,
            }
        else:
            programmatic[qid] = {
                'question_id': qid,
                'status': 'PASS',
                'finding': None,
                'correction': None,
            }

    # Step 2: Haiku verification (if available)
    haiku_results: dict[str, dict] = {}
    if use_haiku:
        api_key = os.environ.get('ANTHROPIC_API_KEY', '')
        if api_key:
            try:
                import anthropic  # type: ignore
                client = anthropic.Anthropic(api_key=api_key)
                haiku_list = verify_with_haiku(client, module_id, qa_rows, verbose=verbose)
                for r in haiku_list:
                    haiku_results[r.get('question_id', '')] = r
                if verbose:
                    pass_c = sum(1 for r in haiku_list if r.get('status') == 'PASS')
                    flag_c = sum(1 for r in haiku_list if r.get('status') == 'FLAG')
                    fail_c = sum(1 for r in haiku_list if r.get('status') == 'FAIL')
                    print(f'    Haiku: {pass_c} PASS / {flag_c} FLAG / {fail_c} FAIL')
            except ImportError:
                if verbose:
                    print('    Haiku unavailable: anthropic package not installed')
        elif verbose:
            print('    Haiku unavailable: ANTHROPIC_API_KEY not set — using programmatic only')

    # Step 3: Merge results (Haiku FAIL/FLAG overrides programmatic PASS; ERRORs union)
    merged: list[dict] = []
    for row in qa_rows:
        qid = row.get('question_id', '')
        prog = programmatic.get(qid, {'question_id': qid, 'status': 'PASS',
                                      'finding': None, 'correction': None})
        haiku = haiku_results.get(qid)

        if haiku and haiku.get('status') == 'FAIL':
            # Haiku FAIL is definitive — combine findings if programmatic also flagged
            combined_finding = haiku.get('finding') or ''
            if prog.get('status') in ('FAIL', 'FLAG') and prog.get('finding'):
                combined_finding = f'{combined_finding}; {prog["finding"]}'
            merged.append({
                'question_id': qid,
                'status': 'FAIL',
                'finding': combined_finding,
                'correction': haiku.get('correction'),
            })
        elif haiku and haiku.get('status') == 'FLAG' and prog.get('status') == 'FAIL':
            # Programmatic ERROR takes precedence
            merged.append(prog)
        elif haiku and haiku.get('status') == 'FLAG':
            combined_finding = haiku.get('finding') or ''
            if prog.get('status') == 'FLAG' and prog.get('finding'):
                combined_finding = f'{combined_finding}; {prog["finding"]}'
            merged.append({
                'question_id': qid,
                'status': 'FLAG',
                'finding': combined_finding,
                'correction': haiku.get('correction'),
            })
        else:
            # No haiku result or haiku PASS — use programmatic result
            merged.append(prog)

    return merged
