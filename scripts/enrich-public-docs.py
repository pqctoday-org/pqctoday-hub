#!/usr/bin/env python3
"""
scripts/enrich-public-docs.py

Extracts 11 structured dimensions from downloaded HTML/PDF documents in
public/library/, public/timeline/, and public/threats/.

Writes date-stamped enrichment markdown files to src/data/doc-enrichments/:
  - library_doc_enrichments_MMDDYYYY.md
  - timeline_doc_enrichments_MMDDYYYY.md
  - threats_doc_enrichments_MMDDYYYY.md

These are picked up by processDocumentEnrichments() in
scripts/generate-rag-corpus.ts and added to the RAG corpus.

Usage:
  python3 scripts/enrich-public-docs.py
  python3 scripts/enrich-public-docs.py --dry-run
  python3 scripts/enrich-public-docs.py --collection library
"""

import csv
import json
import re
import subprocess
import sys
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

# ---------------------------------------------------------------------------
# HTML text extractor (same as summarize-library.py)
# ---------------------------------------------------------------------------

class HTMLTextExtractor(HTMLParser):
    # Void HTML elements that never have closing tags — must NOT
    # increment skip depth or the counter gets stuck permanently.
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


def extract_text_from_html(html_path: Path, max_chars: int = 20000) -> str:
    try:
        with open(html_path, 'r', encoding='utf-8', errors='ignore') as f:
            parser = HTMLTextExtractor()
            parser.feed(f.read())
            text = parser.get_text()
            return text[:max_chars]
    except Exception as e:
        print(f'  ⚠  HTML parse failed {html_path.name}: {e}')
    return ''


def extract_text_from_pdf(pdf_path: Path, max_lines: int = 1000) -> str:
    try:
        result = subprocess.run(
            ['pdftotext', str(pdf_path), '-'],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode == 0:
            lines = result.stdout.strip().split('\n')[:max_lines]
            return '\n'.join(lines)
    except FileNotFoundError:
        pass  # pdftotext not installed — silent skip
    except Exception as e:
        print(f'  ⚠  pdftotext failed {pdf_path.name}: {e}')
    return ''


def extract_authors_from_html(html_path: Path) -> list[str]:
    try:
        with open(html_path, 'r', encoding='utf-8', errors='ignore') as f:
            head = f.read(20000)
        return [
            a.strip()
            for a in re.findall(
                r'<meta\s+name=["\']citation_author["\']\s+content=["\'](.*?)["\']',
                head, re.IGNORECASE
            )
            if a.strip()
        ]
    except Exception:
        return []


# ---------------------------------------------------------------------------
# CSV utilities
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


def load_csv_by_id(csv_path: Path, id_col: str) -> dict[str, dict]:
    """Load CSV as dict keyed by id_col value."""
    result: dict[str, dict] = {}
    try:
        with open(csv_path, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                key = row.get(id_col, '').strip()
                if key:
                    result[key] = row
    except Exception as e:
        print(f'  ⚠  CSV load failed {csv_path.name}: {e}')
    return result


def load_leader_names() -> list[str]:
    """Load full names from leaders CSV, stripping honorific prefixes."""
    csv_path = find_latest_csv('leaders_')
    if not csv_path:
        return []
    names: list[str] = []
    title_prefixes = re.compile(
        r'^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.|Sir |Lord |Dame |General |Admiral )',
        re.IGNORECASE
    )
    try:
        with open(csv_path, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                name = row.get('Name', '').strip()
                name = title_prefixes.sub('', name).strip()
                # Keep only names with at least first + last (2 parts)
                parts = name.split()
                if len(parts) >= 2:
                    names.append(name)
    except Exception as e:
        print(f'  ⚠  Leaders CSV load failed: {e}')
    return names


def load_software_names() -> list[str]:
    """Load software_name values from migrate catalog CSV."""
    csv_path = find_latest_csv('quantum_safe_cryptographic_software_reference_')
    if not csv_path:
        return []
    names: list[str] = []
    try:
        with open(csv_path, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                name = row.get('software_name', '').strip()
                # Skip very short names to avoid false positives
                if name and len(name) >= 5:
                    names.append(name)
    except Exception as e:
        print(f'  ⚠  Software CSV load failed: {e}')
    return names


# ---------------------------------------------------------------------------
# Dimension 3 — PQC algorithms
# ---------------------------------------------------------------------------

_ALGO_PATTERNS = [
    (re.compile(r'\bML-KEM(?:-512|-768|-1024)?\b', re.I), 'ML-KEM'),
    (re.compile(r'\bML-DSA(?:-44|-65|-87)?\b', re.I), 'ML-DSA'),
    (re.compile(r'\bSLH-DSA\b', re.I), 'SLH-DSA'),
    (re.compile(r'\bFN-DSA(?:-512|-1024)?\b', re.I), 'FN-DSA'),
    (re.compile(r'\bFalcon(?:-512|-1024)?\b', re.I), 'Falcon'),
    (re.compile(r'\bSPHINCS\+?\b'), 'SPHINCS+'),
    (re.compile(r'\bCRYSTALS[-\s]Kyber\b', re.I), 'CRYSTALS-Kyber'),
    (re.compile(r'\bCRYSTALS[-\s]Dilithium\b', re.I), 'CRYSTALS-Dilithium'),
    (re.compile(r'\bFrodoKEM\b', re.I), 'FrodoKEM'),
    (re.compile(r'\bClassic McEliece\b', re.I), 'Classic McEliece'),
    (re.compile(r'\bBIKE\b'), 'BIKE'),
    (re.compile(r'\bHQC\b'), 'HQC'),
    (re.compile(r'\bXMSS\b'), 'XMSS'),
    (re.compile(r'\bLMS\b'), 'LMS'),
    (re.compile(r'\bHSS\b'), 'HSS'),
    (re.compile(r'\bFIPS\s*203\b', re.I), 'FIPS 203 (ML-KEM)'),
    (re.compile(r'\bFIPS\s*204\b', re.I), 'FIPS 204 (ML-DSA)'),
    (re.compile(r'\bFIPS\s*205\b', re.I), 'FIPS 205 (SLH-DSA)'),
    (re.compile(r'\bFIPS\s*206\b', re.I), 'FIPS 206 (FN-DSA)'),
    (re.compile(r'\bSP\s*800-208\b', re.I), 'SP 800-208 (LMS/XMSS)'),
]


def extract_algorithms(text: str) -> list[str]:
    seen: set[str] = set()
    results: list[str] = []
    for pattern, label in _ALGO_PATTERNS:
        if pattern.search(text) and label not in seen:
            seen.add(label)
            results.append(label)
    return results


# ---------------------------------------------------------------------------
# Dimension 4 — Quantum threats
# ---------------------------------------------------------------------------

_THREAT_PATTERNS = [
    (re.compile(r'\bCRQC\b'), 'CRQC (Cryptographically Relevant Quantum Computer)'),
    (re.compile(r'harvest[\s\-]now[\s\-]decrypt[\s\-]later', re.I), 'Harvest Now Decrypt Later (HNDL)'),
    (re.compile(r'\bHNDL\b'), 'HNDL'),
    (re.compile(r'\bHNFL\b'), 'HNFL (Harvest Now Forge Later)'),
    (re.compile(r"shor'?s algorithm", re.I), "Shor's Algorithm"),
    (re.compile(r"grover'?s algorithm", re.I), "Grover's Algorithm"),
    (re.compile(r'\bquantum advantage\b', re.I), 'Quantum Advantage'),
    (re.compile(r'\bquantum supremacy\b', re.I), 'Quantum Supremacy'),
    (re.compile(r'\bcryptographically relevant quantum\b', re.I), 'Cryptographically Relevant Quantum'),
    (re.compile(r'\bquantum computer', re.I), 'Quantum Computer'),
    (re.compile(r'\bpost.quantum\b', re.I), 'Post-Quantum'),
]


def extract_threats(text: str) -> list[str]:
    seen: set[str] = set()
    results: list[str] = []
    for pattern, label in _THREAT_PATTERNS:
        if pattern.search(text) and label not in seen:
            seen.add(label)
            results.append(label)
    return results


# ---------------------------------------------------------------------------
# Dimension 5 — Migration timeline + regions/countries
# ---------------------------------------------------------------------------

_MIGRATION_KW = [
    'deadline', 'migrate by', 'transition by', 'deprecat', 'phase out',
    'cnsa 2.0', 'sunset', 'compliance deadline', 'mandate', 'required by',
    'must migrate', 'migration deadline', 'exclusive use', 'preferred use',
    'shall use', 'retire', 'disallow', 'prohibited',
]

# (display_name, list_of_lowercase_substrings_to_match)
_REGION_KEYWORDS: list[tuple[str, list[str]]] = [
    ('United States', ['united states', 'u.s.', ' usa ', 'nist', ' nsa ', 'cisa', 'cnsa 2.0', 'federal register', 'nsm-8', 'nsm-10', 'dod ', 'department of defense', 'omb ']),
    ('European Union', ['european union', ' eu ', 'enisa', 'eidas', ' dora ', 'nis2', 'ec recommendation', 'eu regulation', 'eu directive', 'eu mandate', 'european commission']),
    ('United Kingdom', ['united kingdom', ' uk ', 'ncsc uk', 'gchq', 'cesg', 'uk government']),
    ('Germany',        ['germany', 'german ', 'bsi tr-', 'bundesamt für sicherheit', 'bsi cryptographic']),
    ('France',         ['france', 'french ', 'anssi', 'agence nationale de la sécurité']),
    ('Canada',         ['canada', 'canadian', 'cccs', ' cse ', 'communications security establishment']),
    ('Australia',      ['australia', 'australian', 'acsc', ' asd ', 'ism control', 'australian signals']),
    ('Japan',          ['japan', 'japanese', 'cryptrec', ' meti ', 'nisc japan', 'nippon']),
    ('South Korea',    ['south korea', 'republic of korea', 'korean ', 'kcmvp', 'kpqc', 'kisa']),
    ('Singapore',      ['singapore', 'monetary authority of singapore', ' mas ']),
    ('India',          ['india', 'indian ', 'deity', 'nciipc', 'cert-in']),
    ('NATO',           ['nato ', 'north atlantic treaty']),
    ('Five Eyes',      ['five eyes', 'fvey']),
    ('International',  ['iso/iec', 'iso 27001', 'itu-t', 'ietf ', 'etsi ', 'international standard']),
]

# Regulatory body abbreviations (must appear in text for attribution)
_REG_BODIES: list[tuple[str, list[str]]] = [
    ('NIST', ['nist']),
    ('NSA', [' nsa ', 'nsa/css', 'national security agency']),
    ('CISA', ['cisa']),
    ('ENISA', ['enisa']),
    ('BSI', ['bsi tr', 'bundesamt für sicherheit']),
    ('ANSSI', ['anssi']),
    ('NCSC', ['ncsc']),
    ('ACSC/ASD', ['acsc', ' asd ']),
    ('CCCS', ['cccs']),
    ('MAS', ['monetary authority of singapore']),
    ('CRYPTREC', ['cryptrec']),
    ('KCMVP', ['kcmvp']),
]


def _extract_milestone_phrases(text: str) -> list[str]:
    """Extract concise contextual phrases where a migration keyword appears
    near a year (within ~120 chars).  Returns deduplicated, cleaned phrases
    capped at 120 characters each, max 10 results."""
    lower = text.lower()
    seen: set[str] = set()
    results: list[str] = []

    # Build regex for any migration keyword
    kw_pattern = '|'.join(re.escape(kw) for kw in _MIGRATION_KW)

    # Find all year mentions (2020–2039)
    for m in re.finditer(r'\b(20[23][0-9])\b', text):
        year = m.group(1)
        # Grab a window around the year: 80 chars before, 80 after
        start = max(0, m.start() - 80)
        end = min(len(text), m.end() + 80)
        window = text[start:end]
        window_lower = window.lower()

        # Check if any migration keyword appears in this window
        kw_match = re.search(kw_pattern, window_lower)
        if not kw_match:
            continue

        # Extract the sentence or clause containing both
        # Try to find sentence boundaries (. ! ? or newline)
        # within the window, then trim to just that sentence
        sentences = re.split(r'[.!?\n]', window)
        best = None
        for sent in sentences:
            sent_lower = sent.lower()
            if year in sent and re.search(kw_pattern, sent_lower):
                best = sent.strip()
                break

        if not best:
            best = window.strip()

        # Clean up: collapse whitespace, cap length
        best = re.sub(r'\s+', ' ', best).strip(' ,;:')
        if len(best) > 120:
            best = best[:117] + '...'

        # Deduplicate by (year, keyword)
        dedup_key = f'{year}:{kw_match.group()}'
        if dedup_key not in seen and best:
            seen.add(dedup_key)
            results.append(best)

        if len(results) >= 10:
            break

    return results


def extract_migration_timeline(text: str) -> tuple[list[str], list[str], list[str], list[str]]:
    """Return (dates_found, keywords_found, regions_and_bodies, milestone_phrases).

    Regions and bodies are listed independently to avoid false cross-attribution.
    milestone_phrases are contextual excerpts where a year + migration keyword
    appear together.
    """
    lower = text.lower()

    # Dates in migration range (2020–2039)
    dates = sorted(set(re.findall(r'\b20[23][0-9]\b', text)))

    # Migration keywords
    kw_found = [kw for kw in _MIGRATION_KW if kw in lower]

    # Contextual milestone phrases (year + keyword in context)
    milestones = _extract_milestone_phrases(text)

    # Regions/countries mentioned — independent of body detection
    regions: list[str] = [
        region
        for region, patterns in _REGION_KEYWORDS
        if any(p in lower for p in patterns)
    ]

    # Regulatory bodies mentioned — independent of region detection
    bodies: list[str] = [
        body
        for body, body_patterns in _REG_BODIES
        if any(p in lower for p in body_patterns)
    ]

    regions_and_bodies: list[str] = []
    if regions:
        regions_and_bodies.append(f'Regions: {", ".join(regions)}')
    if bodies:
        regions_and_bodies.append(f'Bodies: {", ".join(bodies)}')

    return dates, kw_found, regions_and_bodies, milestones


# ---------------------------------------------------------------------------
# Dimension 6 — Leaders mentioned
# ---------------------------------------------------------------------------

def extract_leaders(text: str, leader_names: list[str]) -> list[str]:
    found: list[str] = []
    for name in leader_names:
        if name in text:
            found.append(name)
    return found


# ---------------------------------------------------------------------------
# Dimension 7 — PQC products mentioned
# ---------------------------------------------------------------------------

def extract_products(text: str, software_names: list[str]) -> list[str]:
    found: list[str] = []
    for name in software_names:
        # Case-insensitive match; require word boundary on simple names
        if re.search(re.escape(name), text, re.IGNORECASE):
            found.append(name)
    return found[:15]  # cap to avoid noise for broad matches


# ---------------------------------------------------------------------------
# Dimension 8 — Protocols covered
# ---------------------------------------------------------------------------

_PROTOCOL_PATTERNS = [
    (re.compile(r'\bTLS\s*1\.3\b', re.I), 'TLS 1.3'),
    (re.compile(r'\bTLS\b', re.I), 'TLS'),
    (re.compile(r'\bDTLS\b', re.I), 'DTLS'),
    (re.compile(r'\bSSH\b'), 'SSH'),
    (re.compile(r'\bIPsec\b', re.I), 'IPsec'),
    (re.compile(r'\bIKEv2\b', re.I), 'IKEv2'),
    (re.compile(r'\bHTTPS\b'), 'HTTPS'),
    (re.compile(r'\bQUIC\b'), 'QUIC'),
    (re.compile(r'\bS/MIME\b', re.I), 'S/MIME'),
    (re.compile(r'\bPGP\b'), 'PGP'),
    (re.compile(r'\bX\.509\b'), 'X.509'),
    (re.compile(r'\bPKCS#?11\b', re.I), 'PKCS#11'),
    (re.compile(r'\bPKCS#?7\b', re.I), 'PKCS#7 / CMS'),
    (re.compile(r'\bCMS\b'), 'CMS'),
    (re.compile(r'\bJOSE\b'), 'JOSE'),
    (re.compile(r'\bJWT\b'), 'JWT'),
    (re.compile(r'\bDNSSEC\b', re.I), 'DNSSEC'),
    (re.compile(r'\bOCSP\b'), 'OCSP'),
    (re.compile(r'\bCMP\b'), 'CMP'),
    (re.compile(r'\bCMC\b'), 'CMC'),
    (re.compile(r'\bACME\b'), 'ACME'),
    (re.compile(r'\bWireGuard\b', re.I), 'WireGuard'),
    (re.compile(r'\bOpenVPN\b', re.I), 'OpenVPN'),
    (re.compile(r'\bSCEP\b'), 'SCEP'),
    (re.compile(r'\bEAP(?:-TLS)?\b'), 'EAP'),
    (re.compile(r'\bRadiuS\b', re.I), 'RADIUS'),
]


def extract_protocols(text: str) -> list[str]:
    seen: set[str] = set()
    results: list[str] = []
    for pattern, label in _PROTOCOL_PATTERNS:
        if pattern.search(text) and label not in seen:
            seen.add(label)
            results.append(label)
    return results


# ---------------------------------------------------------------------------
# Dimension 10 — Standardization bodies
# ---------------------------------------------------------------------------

_STD_BODY_PATTERNS = [
    (re.compile(r'\bNIST\b'), 'NIST'),
    (re.compile(r'\bISO/IEC\b'), 'ISO/IEC'),
    (re.compile(r'\b\bISO\b'), 'ISO'),
    (re.compile(r'\bIEC\b'), 'IEC'),
    (re.compile(r'\bIETF\b'), 'IETF'),
    (re.compile(r'\bETSI\b'), 'ETSI'),
    (re.compile(r'\bITU-T\b'), 'ITU-T'),
    (re.compile(r'\bIEEE\b'), 'IEEE'),
    (re.compile(r'\b3GPP\b'), '3GPP'),
    (re.compile(r'\bTCG\b|\bTrusted Computing Group\b', re.I), 'TCG'),
    (re.compile(r'\bOASIS\b'), 'OASIS'),
    (re.compile(r'\bW3C\b'), 'W3C'),
    (re.compile(r'\bANSSI\b'), 'ANSSI'),
    (re.compile(r'\bBSI\b'), 'BSI'),
    (re.compile(r'\bNCSC\b'), 'NCSC'),
    (re.compile(r'\bENISA\b'), 'ENISA'),
    (re.compile(r'\bCRYPTREC\b'), 'CRYPTREC'),
    (re.compile(r'\bKCMVP\b'), 'KCMVP'),
    (re.compile(r'\bCMVP\b'), 'CMVP (NIST)'),
    (re.compile(r'\bACVP\b'), 'ACVP (NIST)'),
    (re.compile(r'\bCAB Forum\b|\bCA/Browser Forum\b', re.I), 'CA/Browser Forum'),
    (re.compile(r'\bCCSDS\b'), 'CCSDS'),
    (re.compile(r'\bNATO\b'), 'NATO'),
    (re.compile(r'\bPQCA\b|\bPost-Quantum Cryptography Alliance\b', re.I), 'PQCA'),
    (re.compile(r'\bLINF\b|\bLAMPS\b|\bPQUIP\b', re.I), 'IETF WG (LAMPS/PQUIP)'),
]


def extract_standardization_bodies(text: str) -> list[str]:
    seen: set[str] = set()
    results: list[str] = []
    for pattern, label in _STD_BODY_PATTERNS:
        if pattern.search(text) and label not in seen:
            seen.add(label)
            results.append(label)
    return results


# ---------------------------------------------------------------------------
# Dimension 11 — Compliance frameworks referenced
# ---------------------------------------------------------------------------

_COMPLIANCE_PATTERNS = [
    (re.compile(r'\bFIPS\s*140-3\b', re.I), 'FIPS 140-3'),
    (re.compile(r'\bFIPS\s*140-2\b', re.I), 'FIPS 140-2'),
    (re.compile(r'\bFIPS\s*186\b', re.I), 'FIPS 186 (DSS)'),
    (re.compile(r'\bCommon Criteria\b', re.I), 'Common Criteria'),
    (re.compile(r'\bISO/IEC\s*15408\b', re.I), 'ISO/IEC 15408 (CC)'),
    (re.compile(r'\bCNSA\s*2\.0\b', re.I), 'CNSA 2.0'),
    (re.compile(r'\bNSM-8\b|\bNSM-10\b', re.I), 'NSM-8/NSM-10'),
    (re.compile(r'\bFedRAMP\b', re.I), 'FedRAMP'),
    (re.compile(r'\bGDPR\b'), 'GDPR'),
    (re.compile(r'\beIDAS\b', re.I), 'eIDAS 2.0'),
    (re.compile(r'\bDORA\b'), 'DORA'),
    (re.compile(r'\bNIS2\b', re.I), 'NIS2'),
    (re.compile(r'\bHIPAA\b'), 'HIPAA'),
    (re.compile(r'\bPCI.?DSS\b', re.I), 'PCI-DSS'),
    (re.compile(r'\bSOC\s*2\b', re.I), 'SOC 2'),
    (re.compile(r'\bISO\s*27001\b', re.I), 'ISO 27001'),
    (re.compile(r'\bNIST\s*SP\s*800-57\b', re.I), 'SP 800-57 (Key Mgmt)'),
    (re.compile(r'\bNIST\s*SP\s*800-175\b', re.I), 'SP 800-175 (Crypto Guidance)'),
    (re.compile(r'\bNIST\s*IR\s*8547\b', re.I), 'NIST IR 8547 (Transition)'),
    (re.compile(r'\bNIST\s*IR\s*8413\b', re.I), 'NIST IR 8413 (FIPS 203/204/205 Background)'),
    (re.compile(r'\bSP\s*800-208\b', re.I), 'SP 800-208 (LMS/XMSS)'),
    (re.compile(r'\bCCCS\b|\bITSM\.40\.001\b', re.I), 'CCCS ITSM.40.001'),
    (re.compile(r'\bBSI\s*TR-02102\b', re.I), 'BSI TR-02102'),
    (re.compile(r'\bNCSC\s*guidance\b', re.I), 'NCSC Guidance'),
    (re.compile(r'\bASD\s*ISM\b|\bISM control\b', re.I), 'ASD ISM'),
    (re.compile(r'\bNZISM\b'), 'NZISM'),
    (re.compile(r'\bNERC.?CIP\b', re.I), 'NERC-CIP'),
    (re.compile(r'\bIEC\s*62443\b', re.I), 'IEC 62443 (OT/ICS)'),
    (re.compile(r'\bDO-326A\b', re.I), 'DO-326A (Aviation)'),
    (re.compile(r'\bISO/SAE\s*21434\b', re.I), 'ISO/SAE 21434 (Automotive)'),
    (re.compile(r'\bGSMA\b'), 'GSMA NG.116'),
]


def extract_compliance_frameworks(text: str) -> list[str]:
    seen: set[str] = set()
    results: list[str] = []
    for pattern, label in _COMPLIANCE_PATTERNS:
        if pattern.search(text) and label not in seen:
            seen.add(label)
            results.append(label)
    return results


# ---------------------------------------------------------------------------
# Dimension 9 — Infrastructure layers
# ---------------------------------------------------------------------------

_INFRA_PATTERNS = [
    (re.compile(r'\bHSM\b'), 'HSM'),
    (re.compile(r'\bTPM\b'), 'TPM'),
    (re.compile(r'\bTEE\b'), 'TEE'),
    (re.compile(r'\bPKI\b'), 'PKI'),
    (re.compile(r'\bcertificate authority\b', re.I), 'Certificate Authority (CA)'),
    (re.compile(r'\broot CA\b', re.I), 'Root CA'),
    (re.compile(r'\bsecure boot\b', re.I), 'Secure Boot'),
    (re.compile(r'\bcode sign', re.I), 'Code Signing'),
    (re.compile(r'\bfirmware\b', re.I), 'Firmware'),
    (re.compile(r'\bkey management\b', re.I), 'Key Management'),
    (re.compile(r'\bkey store\b', re.I), 'Key Store'),
    (re.compile(r'\bIoT\b'), 'IoT'),
    (re.compile(r'\bcloud\b', re.I), 'Cloud'),
    (re.compile(r'\bVPN\b'), 'VPN'),
    (re.compile(r'\bweb PKI\b', re.I), 'Web PKI'),
    (re.compile(r'\bDNSSEC\b', re.I), 'DNSSEC'),
    (re.compile(r'\bemail\b', re.I), 'Email'),
    (re.compile(r'\bsmart card\b', re.I), 'Smart Card'),
    (re.compile(r'\bpassport\b', re.I), 'Electronic Passport'),
    (re.compile(r'\bblockchain\b', re.I), 'Blockchain'),
    (re.compile(r'\bsatellite\b', re.I), 'Satellite'),
    (re.compile(r'\b5G\b'), '5G'),
    (re.compile(r'\bOT\b|\bSCADA\b|\bICS\b'), 'OT/ICS/SCADA'),
    (re.compile(r'\bdatabase encrypt', re.I), 'Database Encryption'),
    (re.compile(r'\bdisk encrypt', re.I), 'Disk Encryption'),
]


def extract_infra(text: str) -> list[str]:
    seen: set[str] = set()
    results: list[str] = []
    for pattern, label in _INFRA_PATTERNS:
        if pattern.search(text) and label not in seen:
            seen.add(label)
            results.append(label)
    return results


# ---------------------------------------------------------------------------
# Main topic extraction
# ---------------------------------------------------------------------------

def extract_main_topic(text: str, csv_desc: str = '') -> str:
    """Return a concise main topic sentence."""
    if csv_desc:
        # Trim CSV description to first sentence or 250 chars
        first_sentence = re.split(r'(?<=[.!?])\s+', csv_desc.strip())[0]
        return first_sentence[:250]
    # Fall back to first clean sentence from extracted text
    clean = ' '.join(text.split())
    first_sentence = re.split(r'(?<=[.!?])\s+', clean)[0]
    return first_sentence[:250] if first_sentence else 'See document for details.'


# ---------------------------------------------------------------------------
# Markdown section builder
# ---------------------------------------------------------------------------

def build_section(
    ref_id: str,
    title: str,
    authors: str,
    pub_date: str,
    update_date: str,
    doc_status: str,
    main_topic: str,
    algorithms: list[str],
    threats: list[str],
    dates: list[str],
    migration_kw: list[str],
    regions: list[str],
    leaders: list[str],
    products: list[str],
    protocols: list[str],
    infra: list[str],
    std_bodies: list[str],
    compliance_frameworks: list[str],
    milestones: list[str] | None = None,
) -> str:
    def fmt(items: list[str]) -> str:
        return ', '.join(items) if items else 'None detected'

    # Migration timeline info — prefer contextual milestones, fall back to dates+keywords
    if milestones:
        migration_info = 'Milestones: ' + ' | '.join(milestones)
    else:
        migration_parts: list[str] = []
        if dates:
            migration_parts.append(f'Years mentioned: {", ".join(dates)}')
        if migration_kw:
            migration_parts.append(f'Keywords: {", ".join(set(migration_kw))}')
        migration_info = '; '.join(migration_parts) if migration_parts else 'None detected'

    applicable_regions = fmt(regions)

    return f"""## {ref_id}

- **Reference ID**: {ref_id}
- **Title**: {title}
- **Authors**: {authors}
- **Publication Date**: {pub_date or 'Not specified'}
- **Last Updated**: {update_date or 'Not specified'}
- **Document Status**: {doc_status or 'Not specified'}
- **Main Topic**: {main_topic}
- **PQC Algorithms Covered**: {fmt(algorithms)}
- **Quantum Threats Addressed**: {fmt(threats)}
- **Migration Timeline Info**: {migration_info}
- **Applicable Regions / Bodies**: {applicable_regions}
- **Leaders Contributions Mentioned**: {fmt(leaders)}
- **PQC Products Mentioned**: {fmt(products)}
- **Protocols Covered**: {fmt(protocols)}
- **Infrastructure Layers**: {fmt(infra)}
- **Standardization Bodies**: {fmt(std_bodies)}
- **Compliance Frameworks Referenced**: {fmt(compliance_frameworks)}

---
"""


# ---------------------------------------------------------------------------
# Process one collection
# ---------------------------------------------------------------------------

def process_collection(
    collection: str,
    public_subdir: Path,
    csv_prefix: str,
    csv_id_col: str | None,
    csv_title_col: str,
    csv_desc_col: str,
    csv_authors_col: str,
    csv_pub_date_col: str,
    csv_update_date_col: str,
    csv_status_col: str,
    manifest_id_field: str,
    manifest_title_field: str,
    manifest_file_field: str,
    file_path_is_relative: bool,
    include_skipped_reasons: list[str],
    leader_names: list[str],
    software_names: list[str],
    dry_run: bool,
) -> int:
    manifest_path = public_subdir / 'manifest.json'
    if not manifest_path.exists():
        print(f'  ⚠  No manifest found: {manifest_path}')
        return 0

    with open(manifest_path, encoding='utf-8') as f:
        manifest = json.load(f)

    # Load supplementary CSV if available
    csv_rows: dict[str, dict] = {}
    if csv_prefix and csv_id_col:
        csv_path = find_latest_csv(csv_prefix)
        if csv_path:
            csv_rows = load_csv_by_id(csv_path, csv_id_col)
            print(f'  📄 CSV loaded: {csv_path.name} ({len(csv_rows)} rows)')

    # Include downloaded entries + skipped entries where the file is known to exist
    entries = [
        e for e in manifest.get('entries', [])
        if e.get('status') == 'downloaded'
        or (e.get('status') == 'skipped' and e.get('reason', '') in include_skipped_reasons)
    ]

    # For library collection: also include CSV records with local_file that
    # aren't tracked in the manifest (e.g. files from prior download runs).
    if csv_rows and csv_id_col:
        manifest_ref_ids = {e.get(manifest_id_field, '').strip() for e in entries}
        for ref_id, row in csv_rows.items():
            if ref_id in manifest_ref_ids:
                continue
            local_file = row.get('local_file', '').strip()
            if not local_file:
                continue
            file_path = ROOT / local_file
            if not file_path.exists():
                continue
            # Synthesize a manifest-like entry for this CSV record
            entries.append({
                manifest_id_field: ref_id,
                manifest_title_field: row.get(csv_title_col, '').strip() or ref_id,
                manifest_file_field: str(file_path),
                '_from_csv': True,  # marker for path resolution below
            })

    print(f'  📁 {collection}: {len(entries)} documents to process')

    sections: list[str] = []
    processed = 0

    for entry in entries:
        ref_id = entry.get(manifest_id_field, '').strip()
        manifest_title = entry.get(manifest_title_field, '').strip()
        file_value = entry.get(manifest_file_field, '').strip()
        if not file_value:
            continue

        # Resolve file path: entries from CSV have absolute paths, others use
        # ROOT-relative or public_subdir-relative resolution.
        if entry.get('_from_csv'):
            doc_path = Path(file_value)
        elif file_path_is_relative:
            doc_path = ROOT / file_value
        else:
            doc_path = public_subdir / file_value
        if not doc_path.exists():
            print(f'  ⚠  File not found: {file_value}')
            continue

        # Extract text
        if doc_path.suffix.lower() == '.pdf':
            text = extract_text_from_pdf(doc_path)
            html_authors: list[str] = []
        else:
            text = extract_text_from_html(doc_path)
            html_authors = extract_authors_from_html(doc_path)

        # Supplementary CSV data
        csv_row = csv_rows.get(ref_id, {})
        csv_title = csv_row.get(csv_title_col, '').strip()
        csv_desc = csv_row.get(csv_desc_col, '').strip()
        csv_authors = csv_row.get(csv_authors_col, '').strip()
        pub_date = csv_row.get(csv_pub_date_col, '').strip() if csv_pub_date_col else ''
        update_date = csv_row.get(csv_update_date_col, '').strip() if csv_update_date_col else ''
        doc_status = csv_row.get(csv_status_col, '').strip() if csv_status_col else ''

        title = csv_title or manifest_title or ref_id
        authors_list = html_authors or ([csv_authors] if csv_authors else [])
        authors_str = '; '.join(authors_list) if authors_list else csv_authors or 'See document'

        # Run all 11 dimension extractors
        algorithms = extract_algorithms(text)
        threats = extract_threats(text)
        dates, migration_kw, regions, milestones = extract_migration_timeline(text)
        leaders = extract_leaders(text, leader_names)
        products = extract_products(text, software_names)
        protocols = extract_protocols(text)
        infra = extract_infra(text)
        std_bodies = extract_standardization_bodies(text)
        compliance = extract_compliance_frameworks(text)
        main_topic = extract_main_topic(text, csv_desc)

        section = build_section(
            ref_id=ref_id,
            title=title,
            authors=authors_str,
            pub_date=pub_date,
            update_date=update_date,
            doc_status=doc_status,
            main_topic=main_topic,
            algorithms=algorithms,
            threats=threats,
            dates=dates,
            migration_kw=migration_kw,
            regions=regions,
            leaders=leaders,
            products=products,
            protocols=protocols,
            infra=infra,
            std_bodies=std_bodies,
            compliance_frameworks=compliance,
            milestones=milestones,
        )
        sections.append(section)
        processed += 1
        print(f'  ✅ {ref_id} — algos:{len(algorithms)} threats:{len(threats)} std_bodies:{len(std_bodies)} compliance:{len(compliance)}')

    if dry_run:
        print(f'\n  [dry-run] Would write {processed} sections for {collection}')
        return processed

    if not sections:
        print(f'  ℹ  No sections to write for {collection}')
        return 0

    # Write output file
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    today = datetime.now().strftime('%m%d%Y')
    out_path = OUTPUT_DIR / f'{collection}_doc_enrichments_{today}.md'

    header = f"""---
generated: {datetime.now().strftime('%Y-%m-%d')}
collection: {collection}
documents_processed: {processed}
---

"""
    out_path.write_text(header + '\n'.join(sections), encoding='utf-8')
    print(f'\n  📝 Written: {out_path.relative_to(ROOT)} ({processed} docs)')
    return processed


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

COLLECTIONS_CONFIG: dict[str, dict] = {
    'library': {
        'public_subdir': PUBLIC_DIR / 'library',
        'csv_prefix': 'library_',
        'csv_id_col': 'reference_id',
        'csv_title_col': 'document_title',
        'csv_desc_col': 'short_description',
        'csv_authors_col': 'authors_or_organization',
        'csv_pub_date_col': 'initial_publication_date',
        'csv_update_date_col': 'last_update_date',
        'csv_status_col': 'document_status',
        # Manifest field names for this collection
        'manifest_id_field': 'refId',       # entry field for the document ref ID
        'manifest_title_field': 'title',    # entry field for the document title
        'manifest_file_field': 'filename',  # entry field for the file name/path
        'file_path_is_relative': False,     # True = 'file' is ROOT-relative path; False = filename in public_subdir
        'include_skipped_reasons': [],      # skip-reason values to treat as "exists on disk"
    },
    'timeline': {
        'public_subdir': PUBLIC_DIR / 'timeline',
        'csv_prefix': 'timeline_',
        'csv_id_col': None,  # composite labels don't map cleanly to CSV
        'csv_title_col': 'title',
        'csv_desc_col': 'description',
        'csv_authors_col': 'organization',
        'csv_pub_date_col': 'SourceDate',
        'csv_update_date_col': '',
        'csv_status_col': 'Status',
        'manifest_id_field': 'label',
        'manifest_title_field': 'label',
        'manifest_file_field': 'file',
        'file_path_is_relative': True,   # 'file' = "public/timeline/Foo.html" from ROOT
        'include_skipped_reasons': ['already-exists'],  # files that are on disk but counted as skipped
    },
    'threats': {
        'public_subdir': PUBLIC_DIR / 'threats',
        'csv_prefix': 'quantum_threats_hsm_industries_',
        'csv_id_col': 'threat_id',
        'csv_title_col': 'industry',
        'csv_desc_col': 'threat_description',
        'csv_authors_col': 'main_source',
        'csv_pub_date_col': '',
        'csv_update_date_col': '',
        'csv_status_col': '',
        'manifest_id_field': 'threatId',
        'manifest_title_field': 'title',
        'manifest_file_field': 'file',
        'file_path_is_relative': True,   # 'file' = "public/threats/FIN-001.html" from ROOT
        'include_skipped_reasons': [],
    },
}


def main():
    args = sys.argv[1:]
    dry_run = '--dry-run' in args
    collection_filter: str | None = None
    if '--collection' in args:
        idx = args.index('--collection')
        if idx + 1 < len(args):
            collection_filter = args[idx + 1]

    print('🔍 Document Enrichment for RAG Corpus\n')
    if dry_run:
        print('  [DRY RUN — no files will be written]\n')

    # Load shared reference lists once
    print('Loading leader names...')
    leader_names = load_leader_names()
    print(f'  → {len(leader_names)} leader names loaded')

    print('Loading software names...')
    software_names = load_software_names()
    print(f'  → {len(software_names)} software names loaded\n')

    total = 0
    collections_to_run = (
        [collection_filter]
        if collection_filter and collection_filter in COLLECTIONS_CONFIG
        else list(COLLECTIONS_CONFIG.keys())
    )

    for collection in collections_to_run:
        cfg = COLLECTIONS_CONFIG[collection]
        print(f'─── {collection.upper()} ───')
        count = process_collection(
            collection=collection,
            public_subdir=cfg['public_subdir'],
            csv_prefix=cfg['csv_prefix'],
            csv_id_col=cfg['csv_id_col'],
            csv_title_col=cfg['csv_title_col'],
            csv_desc_col=cfg['csv_desc_col'],
            csv_authors_col=cfg['csv_authors_col'],
            csv_pub_date_col=cfg['csv_pub_date_col'],
            csv_update_date_col=cfg['csv_update_date_col'],
            csv_status_col=cfg['csv_status_col'],
            manifest_id_field=cfg['manifest_id_field'],
            manifest_title_field=cfg['manifest_title_field'],
            manifest_file_field=cfg['manifest_file_field'],
            file_path_is_relative=cfg['file_path_is_relative'],
            include_skipped_reasons=cfg['include_skipped_reasons'],
            leader_names=leader_names,
            software_names=software_names,
            dry_run=dry_run,
        )
        total += count
        print()

    print(f'✅ Done — {total} documents enriched across {len(collections_to_run)} collection(s)')
    if not dry_run:
        print(f'   Output: {OUTPUT_DIR.relative_to(ROOT)}/')
        print('   Next: npm run generate-corpus')


if __name__ == '__main__':
    main()
