#!/usr/bin/env python3
"""
scripts/extract-product-info-ollama.py

Extracts structured product information from downloaded HTML/PDF/MD documents
for all products in the PQC Migrate catalog using a local Ollama LLM.

CSV-driven: reads products from the latest migrate CSV and discovers downloaded
documents in public/products/. Layer-aware prompts tailor extraction guidance
per infrastructure layer (Hardware, OS, Security Stack, etc.).

Outputs:
  - JSON file → src/data/product-extractions/{category_slug}_extractions_MMDDYYYY.json
  - Markdown file → src/data/product-extractions/{category_slug}_extractions_MMDDYYYY.md

Usage:
  python3 scripts/extract-product-info-ollama.py
  python3 scripts/extract-product-info-ollama.py --dry-run
  python3 scripts/extract-product-info-ollama.py --layer Hardware
  python3 scripts/extract-product-info-ollama.py --category CSC-002
  python3 scripts/extract-product-info-ollama.py --limit 5
  python3 scripts/extract-product-info-ollama.py --skip-existing --append
  python3 scripts/extract-product-info-ollama.py --model qwen3:14b
  python3 scripts/extract-product-info-ollama.py --verbose

  # Legacy mode: process only custody/blockchain with hardcoded doc mappings
  python3 scripts/extract-product-info-ollama.py --legacy --collection custody

Requires:
  Ollama running locally (http://localhost:11434)
  A pulled model (e.g. ollama pull qwen3.5:27b)
"""

import argparse
import csv
import glob
import json
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime
from html.parser import HTMLParser
from pathlib import Path
import subprocess

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

ROOT = Path(__file__).parent.parent
PUBLIC_DIR = ROOT / 'public'
DATA_DIR = ROOT / 'src' / 'data'
PRODUCTS_DIR = PUBLIC_DIR / 'products'
OUTPUT_DIR = DATA_DIR / 'product-extractions'

OLLAMA_BASE = 'http://localhost:11434'
DEFAULT_MODEL = 'qwen3.5:27b'

# ---------------------------------------------------------------------------
# HTML text extractor (same pattern as enrich-docs-ollama.py)
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
        print(f'  Warning: HTML parse failed {html_path.name}: {e}')
    return ''


_pdftotext_warned = False


def extract_text_from_pdf(pdf_path: Path, max_lines: int = 500) -> str:
    global _pdftotext_warned
    try:
        result = subprocess.run(
            ['pdftotext', '-l', '20', str(pdf_path), '-'],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode == 0:
            lines = result.stdout.strip().split('\n')[:max_lines]
            return '\n'.join(lines)[:15000]
    except FileNotFoundError:
        if not _pdftotext_warned:
            print('  Warning: pdftotext not found — PDF files will be skipped. Install: brew install poppler')
            _pdftotext_warned = True
    except Exception as e:
        print(f'  Warning: PDF extraction failed {pdf_path.name}: {e}')
    return ''


def extract_text_from_markdown(md_path: Path, max_chars: int = 15000) -> str:
    """Read markdown file directly (already text)."""
    try:
        text = md_path.read_text(encoding='utf-8', errors='ignore')
        return text[:max_chars]
    except Exception as e:
        print(f'  Warning: Markdown read failed {md_path.name}: {e}')
    return ''


def extract_text(doc_path: Path, max_chars: int = 15000) -> str:
    """Extract text from any supported document type."""
    suffix = doc_path.suffix.lower()
    if suffix == '.pdf':
        return extract_text_from_pdf(doc_path)
    elif suffix == '.md':
        return extract_text_from_markdown(doc_path, max_chars)
    else:
        return extract_text_from_html(doc_path, max_chars)


# ---------------------------------------------------------------------------
# Layer-aware prompt context
# ---------------------------------------------------------------------------

LAYER_PROMPTS = {
    'Hardware': """CONTEXT: This is a hardware security product (HSM, smart card, secure element, QRNG, QKD, or semiconductor).
Focus on: hardware security certifications (FIPS 140-2/3 level, CC EAL), tamper resistance, key storage architecture,
PKCS#11/JCE/CAPI interfaces, physical security features, supported crypto algorithms in hardware.
For "Key Management Model": describe hardware key storage, secure key generation, key injection methods.
For "Architecture Type": describe hardware form factor, deployment model (on-prem appliance, PCIe card, USB token, network-attached).""",

    'OS': """CONTEXT: This is an operating system or OS-level encryption component.
Focus on: kernel-level crypto support, TLS/DTLS stack, disk/file encryption, certificate stores, crypto provider APIs.
For "Key Management Model": describe OS keychain, TPM integration, certificate store architecture.
For "Architecture Type": describe kernel vs userspace crypto, provider/plugin model.""",

    'Security Stack': """CONTEXT: This is a security infrastructure product (KMS, PKI, IAM, certificate lifecycle, secrets management, data protection, or crypto discovery).
Focus on: key lifecycle management, certificate issuance/renewal/revocation, access control models, secrets rotation, crypto inventory/discovery capabilities.
For "Key Management Model": describe key hierarchy, root key protection, key escrow, rotation policies.
For "Architecture Type": describe centralized vs distributed, SaaS vs on-prem, agent-based vs agentless.""",

    'Database': """CONTEXT: This is a database encryption product.
Focus on: encryption model (TDE, column-level, application-level, client-side), key rotation support, performance impact, query capabilities on encrypted data.
For "Key Management Model": describe master key management, data encryption key hierarchy, external KMS integration.
For "Architecture Type": describe transparent vs application-level encryption, proxy-based vs native.""",

    'Application': """CONTEXT: This is an application-layer crypto product (library, TLS implementation, browser, email client, code signing tool, blockchain protocol, or API security).
Focus on: supported algorithms and protocols (TLS 1.3, SSH, S/MIME, JWT, JWS), API surface, language bindings, algorithm negotiation, hybrid mode support.
For "Key Management Model": describe programmatic key management, key formats, PKCS#8/PKCS#12 support.
For "Signature Schemes": list all supported signature algorithms including any PQC schemes.
For "Consensus Mechanism": only relevant for blockchain/DLT products — write "Not applicable" for non-blockchain products.
For "Supported Blockchains": only relevant for blockchain/DLT or custody products — write "Not applicable" for others.""",

    'Network': """CONTEXT: This is a network security product (VPN, IPsec gateway, network encryptor, firewall, or protocol analyzer).
Focus on: network protocols (IPsec IKEv2, MACsec, WireGuard, TLS), throughput/performance, deployment model (inline, gateway, virtual appliance), crypto offload.
For "Key Management Model": describe IKE key exchange, pre-shared keys, certificate-based auth, quantum key distribution integration.
For "Architecture Type": describe inline encryptor, VPN concentrator, proxy, virtual appliance, or cloud-native.""",

    'Cloud': """CONTEXT: This is a cloud security product (Cloud KMS, Cloud HSM, encryption gateway, crypto agility platform).
Focus on: cloud provider support (AWS, Azure, GCP, multi-cloud), key sovereignty, BYOK/HYOK, envelope encryption, cloud HSM integration.
For "Key Management Model": describe cloud key hierarchy, customer-managed vs provider-managed keys, cross-region replication.
For "Architecture Type": describe SaaS, managed service, or customer-deployed; single-cloud vs multi-cloud.""",
}


# ---------------------------------------------------------------------------
# Prompt template — product-specific extraction
# ---------------------------------------------------------------------------

SYSTEM_MESSAGE = """You are a precise product information extractor for a PQC (Post-Quantum Cryptography) software migration database.

STRICT RULES:
1. ONLY extract information EXPLICITLY STATED in the document text.
2. NEVER infer, guess, or fabricate product capabilities, versions, or features.
3. If a field is not clearly stated, write "Unknown" or "Not stated".
4. Use EXACT product and organization names as they appear in the text.
5. For PQC status, be precise: distinguish between "production", "testnet", "planned", "research", and "no mention".
6. Crypto primitives must use standard names: ECDSA, Ed25519, secp256k1, BLS, MPC, RSA, etc.
7. Output format: one bullet per field, using "- **Field Name**: value" format.
8. Do NOT add outside knowledge — extract ONLY from the provided text."""

PROMPT_TEMPLATE = """Platform: {platform_name}
Category: {category}
Infrastructure Layer: {layer}

{layer_context}

Document text (extract ONLY from this text):
{text}

---

Extract the following product information as a bullet list. Write "Unknown" or "Not stated" if not found in the document:

- **Product Name**: Official product/platform name
- **Product Brief**: One-sentence product description (max 150 chars)
- **PQC Support**: One of: Yes (with details), Partial (with scope), Planned (with timeline), No, Unknown
- **PQC Capability Description**: Detailed PQC implementation status, algorithms used, maturity level (max 500 chars)
- **PQC Migration Priority**: One of: Critical, High, Medium, Low — based on asset value at risk and adoption breadth
- **Crypto Primitives**: Current cryptographic algorithms used (e.g., ECDSA secp256k1, Ed25519, MPC-CMP, BLS)
- **Key Management Model**: Architecture type (e.g., MPC threshold, multi-sig, HSM-backed, cold storage, hybrid)
- **Supported Blockchains**: List of blockchain networks supported (if applicable)
- **Architecture Type**: e.g., MPC-based, HSM-based, hardware multi-sig, hybrid MPC+HSM
- **Infrastructure Layer**: One or more of: Application, Security Stack, Cloud, Hardware, Network
- **License Type**: One of: Commercial, Open Source, Proprietary, Open Source/Commercial
- **License**: Specific license (e.g., Apache-2.0, Commercial, Proprietary)
- **Latest Version**: Most recent version mentioned
- **Release Date**: Most recent release date mentioned (YYYY-MM-DD format)
- **FIPS Validated**: FIPS 140-2/140-3 status with details, or "No"
- **Primary Platforms**: Operating systems, cloud platforms, or deployment targets
- **Target Industries**: e.g., Cryptocurrency, Finance, Enterprise, Government, DeFi
- **Regulatory Status**: Licenses, charters, registrations mentioned (e.g., OCC charter, MAS MPI, FCA)
- **PQC Roadmap Details**: Specific plans, timelines, algorithm choices for PQC migration
- **Consensus Mechanism**: e.g., PoW, PoS, BFT, PBFT, Tendermint (for blockchain protocols)
- **Signature Schemes**: Current and planned signature algorithms
- **Authoritative Source URL**: Primary URL for the product/platform
- **Implementation Attack Surface**: Known side-channel vulnerabilities (power analysis, timing, EM leakage), fault injection risks, nonce reuse susceptibility, memory safety. Write "Unknown" if not discussed.
- **Cryptographic Discovery & Inventory**: Crypto-agility scanning capabilities, CBOM support, algorithm enumeration, deprecated cipher detection. Write "Unknown" if not discussed.
- **Testing & Validation Methods**: KAT vector support, ACVP/CAVP conformance, interoperability testing, fuzzing, formal verification, test suite coverage. Write "Unknown" if not discussed.
- **QKD Protocols & Quantum Networking**: QKD protocol support (BB84, E91, CV-QKD), key rates, trusted node architecture, ETSI QKD compliance. Write "Unknown" if not applicable.
- **QRNG & Entropy Sources**: Quantum entropy source type, NIST SP 800-90B compliance, min-entropy, randomness extraction, DRBG seeding. Write "Unknown" if not applicable.
- **Constrained Device & IoT Suitability**: Embedded system viability, smartcard support, ARM Cortex-M compatibility, power/memory constraints, lightweight PQC variant availability. Write "Unknown" if not discussed.
- **Supply Chain & Vendor Risk**: Dependency chain depth, SBOM/CBOM availability, vendor PQC roadmap maturity, open-source vs proprietary, third-party library trust. Write "Unknown" if not discussed.
- **Deployment & Migration Complexity**: Migration phase support (assess/plan/test/migrate/launch), breaking change severity, backward compatibility, rollback procedures, estimated effort. Write "Unknown" if not discussed.
- **Financial & Business Impact**: Licensing costs, TCO comparison, compliance penalty exposure, ROI projections, budget requirements for adoption. Write "Unknown" if not discussed.
- **Organizational Readiness**: Governance prerequisites, team expertise needed, training requirements, change management scope, planning horizon. Write "Unknown" if not discussed.

Now extract values from the document above:"""


# ---------------------------------------------------------------------------
# Canonical fields for output
# ---------------------------------------------------------------------------

CANONICAL_FIELDS = [
    'Product Name',
    'Product Brief',
    'PQC Support',
    'PQC Capability Description',
    'PQC Migration Priority',
    'Crypto Primitives',
    'Key Management Model',
    'Supported Blockchains',
    'Architecture Type',
    'Infrastructure Layer',
    'License Type',
    'License',
    'Latest Version',
    'Release Date',
    'FIPS Validated',
    'Primary Platforms',
    'Target Industries',
    'Regulatory Status',
    'PQC Roadmap Details',
    'Consensus Mechanism',
    'Signature Schemes',
    'Authoritative Source URL',
    # v3 dimensions (aligned with enrich-docs-ollama.py)
    'Implementation Attack Surface',
    'Cryptographic Discovery & Inventory',
    'Testing & Validation Methods',
    'QKD Protocols & Quantum Networking',
    'QRNG & Entropy Sources',
    'Constrained Device & IoT Suitability',
    'Supply Chain & Vendor Risk',
    'Deployment & Migration Complexity',
    # v4 executive dimensions
    'Financial & Business Impact',
    'Organizational Readiness',
]

FALLBACK = 'Unknown'


def _normalize_field(name: str) -> str:
    """Map field name to canonical form. Exact match first, then substring."""
    lower = name.lower().strip()
    # Pass 1: exact match (prevents "License" matching "License Type")
    for canonical in CANONICAL_FIELDS:
        if canonical.lower() == lower:
            return canonical
    # Pass 2: substring match
    for canonical in CANONICAL_FIELDS:
        if canonical.lower() in lower or lower in canonical.lower():
            return canonical
    return name


def parse_response(response: str) -> dict[str, str]:
    """Parse bullet-list response into field name -> value dict."""
    # Try JSON first
    try:
        data = json.loads(response)
        if isinstance(data, dict):
            fields = {}
            for key, val in data.items():
                if isinstance(val, list):
                    val = ', '.join(str(v) for v in val)
                elif not isinstance(val, str):
                    val = str(val) if val else ''
                canonical = _normalize_field(key)
                fields[canonical] = val.strip() if val else FALLBACK
            return fields
    except (json.JSONDecodeError, ValueError):
        pass

    # Bullet-list: "- **Key**: value"
    fields = {}
    for line in response.split('\n'):
        m = re.match(r'^-\s+\*\*([^*]+)\*\*:\s*(.+)$', line.strip())
        if m:
            raw_name = m.group(1).strip()
            canonical = _normalize_field(raw_name)
            value = m.group(2).strip()
            if value.startswith('[') and value.endswith(']'):
                value = value[1:-1].strip()
            fields[canonical] = value
    if fields:
        return fields

    # Fallback: "**Key:** value"
    lines = response.split('\n')
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        m = re.match(r'^\*\*([^*]+)\*\*:\s*(.+)$', line)
        if m:
            raw_name = m.group(1).strip().rstrip(':')
            canonical = _normalize_field(raw_name)
            fields[canonical] = m.group(2).strip()
            i += 1
            continue
        m = re.match(r'^\*\*([^*]+)\*\*:\s*$', line)
        if m and i + 1 < len(lines):
            raw_name = m.group(1).strip().rstrip(':')
            canonical = _normalize_field(raw_name)
            next_line = lines[i + 1].strip()
            if next_line and not next_line.startswith('**'):
                fields[canonical] = next_line
                i += 2
                continue
        i += 1
    return fields


# ---------------------------------------------------------------------------
# Ollama API call
# ---------------------------------------------------------------------------

def call_ollama(model: str, platform_name: str, category: str,
                layer: str, text: str,
                retries: int = 2, timeout: int = 360,
                verbose: bool = False) -> dict[str, str]:
    """Call Ollama and parse the response into a field dict."""
    layer_context = LAYER_PROMPTS.get(layer, '')
    user_content = PROMPT_TEMPLATE.format(
        platform_name=platform_name,
        category=category,
        layer=layer,
        layer_context=layer_context,
        text=text if text else 'No text extracted from source document.'
    )

    payload = json.dumps({
        'model': model,
        'messages': [
            {'role': 'system', 'content': SYSTEM_MESSAGE},
            {'role': 'user', 'content': '/no_think\n' + user_content},
        ],
        'stream': False,
        'options': {
            'num_predict': 3072,
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
                return parse_response(cleaned)
        except urllib.error.URLError as e:
            if attempt < retries - 1:
                print(f'  Warning: Connection error (attempt {attempt + 1}/{retries}): {e}')
                time.sleep(3)
            else:
                print(f'  FAILED after {retries} attempts: {e}')
                return {}
        except Exception as e:
            if attempt < retries - 1:
                print(f'  Warning: Error (attempt {attempt + 1}/{retries}): {e}')
                time.sleep(3)
            else:
                print(f'  FAILED after {retries} attempts: {e}')
                return {}
    return {}


# ---------------------------------------------------------------------------
# Output formatting
# ---------------------------------------------------------------------------

def format_json_entry(platform_name: str, category: str, fields: dict[str, str]) -> dict:
    """Format a single platform's extracted data as a JSON-friendly dict."""
    entry = {'platform_name': platform_name, 'category': category}
    for field in CANONICAL_FIELDS:
        key = field.lower().replace(' ', '_').replace('/', '_')
        entry[key] = fields.get(field, FALLBACK)
    return entry


def format_md_entry(platform_name: str, category: str, fields: dict[str, str]) -> str:
    """Format a single platform's extracted data as markdown."""
    lines = [
        f'## {platform_name}',
        '',
        f'- **Category**: {category}',
    ]
    for field in CANONICAL_FIELDS:
        val = fields.get(field, FALLBACK)
        lines.append(f'- **{field}**: {val}')
    lines.append('')
    lines.append('---')
    lines.append('')
    return '\n'.join(lines)


# ---------------------------------------------------------------------------
# Skip-existing logic
# ---------------------------------------------------------------------------

def load_all_existing_extractions() -> set[str]:
    """Load platform names from ALL prior extraction JSON files."""
    existing = set()
    for json_file in OUTPUT_DIR.glob('*_extractions_*.json'):
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                for entry in data:
                    name = entry.get('platform_name', '')
                    if name:
                        existing.add(name)
        except Exception:
            pass
    return existing


def load_existing_extractions(collection: str) -> set[str]:
    """Load platform names already extracted in prior runs for a specific collection."""
    existing = set()
    pattern = f'{collection}_extractions_*.json'
    for json_file in OUTPUT_DIR.glob(pattern):
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                for entry in data:
                    name = entry.get('platform_name', '')
                    if name:
                        existing.add(name)
        except Exception:
            pass
    return existing


# ---------------------------------------------------------------------------
# CSV-driven product discovery
# ---------------------------------------------------------------------------

def safe_filename(name: str) -> str:
    """Sanitize product name for filesystem — matches download-products.js."""
    return re.sub(r'[^a-zA-Z0-9_\-.]', '_', name)


def find_latest_migrate_csv() -> Path:
    """Find the latest pqc_product_catalog_*.csv (or legacy quantum_safe_*)."""
    prefixes = ['pqc_product_catalog_', 'quantum_safe_cryptographic_software_reference_']
    for prefix in prefixes:
        pattern = re.compile(rf'^{prefix}\d{{8}}(_r\d+)?\.csv$')
        files = [f for f in DATA_DIR.iterdir() if pattern.match(f.name)]
        if files:
            def sort_key(f, pfx=prefix):
                m = re.search(rf'{pfx}(\d{{2}})(\d{{2}})(\d{{4}})(_r(\d+))?\.csv$', f.name)
                date_str = f'{m.group(3)}-{m.group(1)}-{m.group(2)}'
                rev = int(m.group(5)) if m.group(5) else 0
                return (date_str, rev)
            files.sort(key=sort_key, reverse=True)
            return files[0]
    raise FileNotFoundError(f'No product catalog CSV found in {DATA_DIR}')


def load_products_from_csv(csv_path: Path) -> list[dict]:
    """Load all products from the migrate CSV."""
    products = []
    with open(csv_path, 'r', encoding='utf-8-sig', errors='ignore') as f:
        reader = csv.DictReader(f)
        for row in reader:
            products.append(row)
    return products


_KNOWN_SUFFIXES = ('', '_repo', '_npm', '_doc1', '_doc2', '_doc3')
_KNOWN_EXTS = ('.html', '.pdf', '.md', '.txt')


def find_product_docs(software_name: str) -> list[Path]:
    """Find downloaded documents for a product in public/products/.

    Uses exact stem matching with known suffixes to avoid prefix collisions
    (e.g., 'AWS_KMS' must not match 'AWS_KMS__Cloud_Gateway_.html').
    Also checks public/library/ for legacy custody/blockchain docs.
    """
    docs = []
    safe_name = safe_filename(software_name)

    # Check public/products/ (new download location) — exact stem matching
    if PRODUCTS_DIR.exists():
        for sfx in _KNOWN_SUFFIXES:
            stem = safe_name + sfx
            for ext in _KNOWN_EXTS:
                candidate = PRODUCTS_DIR / f'{stem}{ext}'
                if candidate.exists():
                    docs.append(candidate)

    # Also check public/library/ for legacy hardcoded docs
    library_dir = PUBLIC_DIR / 'library'
    if library_dir.exists() and not docs:
        for sfx in _KNOWN_SUFFIXES:
            stem = safe_name + sfx
            for ext in _KNOWN_EXTS:
                candidate = library_dir / f'{stem}{ext}'
                if candidate.exists():
                    docs.append(candidate)

    return docs


# ---------------------------------------------------------------------------
# Legacy hardcoded doc mappings (for backward compatibility)
# ---------------------------------------------------------------------------

LEGACY_CUSTODY_DOCS = {
    'Fireblocks': ['Fireblocks_MPC_CMP.html', 'Fireblocks_MPC_CMP_Whitepaper.html', 'Fireblocks_Open_Source_MPC.html'],
    'DFNS': ['DFNS_HSM_Integration.html', 'DFNS_Key_Orchestration.html'],
    'Taurus SA': ['Taurus_SA_Product.html'],
    'Galileo FT': ['Galileo_FT_Platform.html'],
    'BitGo': ['BitGo_TSS.html', 'BitGo_Multisig_vs_MPC.html'],
    'Anchorage Digital': ['Anchorage_Custody_Platform.html', 'Anchorage_Porto_Self_Custody.html'],
    'Coinbase Custody': ['Coinbase_Prime_Custody.html', 'Coinbase_Institutional.html'],
    'Copper.co': ['Copper_Digital_Asset_Custody.html'],
    'Ledger Enterprise': ['Ledger_Enterprise_MPC_Readiness.html'],
    'Metaco (Ripple)': ['Metaco_Harmonize.html'],
    'Hex Trust': ['Hex_Trust_Custody.html'],
    'Zodia Custody': ['Zodia_Custody.html'],
    'Komainu': ['Komainu_Custody.html'],
}

LEGACY_BLOCKCHAIN_DOCS = {
    'Bitcoin Core': ['Bitcoin_BIP360_P2QRH.html'],
    'Ethereum (Geth)': ['Ethereum_PQC_Roadmap_2026.html'],
    'Solana': ['Solana_PQC_Helius.html'],
    'Hyperledger Fabric': ['Hyperledger_Fabric_Architecture.html', 'Hyperledger_Fabric_Crypto.html'],
    'Hyperledger Besu': ['Hyperledger_Besu_Overview.html'],
    'R3 Corda': ['R3_Corda_BPQS_Paper.html'],
    'QRL': ['QRL_Quantum_Resistant_Ledger.html'],
    'Algorand': ['Algorand_PQC_Technical_Brief.html', 'Algorand_PQC_Technology.html'],
    'Cardano': ['Cardano_PQC_Research.html'],
    'IOTA': ['IOTA_Tangle_Signatures.html'],
    'Polkadot/Substrate': ['Polkadot_Substrate_Crypto.html'],
    'Cosmos/Tendermint': ['Cosmos_PQC_DoraFactory.html'],
    'Aptos': ['Aptos_AIP137_SLH_DSA.html'],
    'Avalanche': ['Avalanche_AIP_QR_001.html'],
    'Sui': ['Sui_PQC_Blog.html'],
}


# ---------------------------------------------------------------------------
# Process a collection of products
# ---------------------------------------------------------------------------

def process_collection(collection: str, products: list[dict], model: str,
                       limit: int = 0, dry_run: bool = False,
                       skip_existing: bool = False, append: bool = False,
                       verbose: bool = False, doc_dir: Path = PRODUCTS_DIR):
    """Process a collection of products — CSV-driven with auto-discovery."""
    today = datetime.now().strftime('%m%d%Y')
    json_path = OUTPUT_DIR / f'{collection}_extractions_{today}.json'
    md_path = OUTPUT_DIR / f'{collection}_extractions_{today}.md'

    # Load existing extractions for skip logic
    skip_names: set[str] = set()
    if skip_existing:
        # Check ALL extraction files, not just this collection
        skip_names = load_all_existing_extractions()
        if skip_names:
            print(f'  Skipping {len(skip_names)} already-extracted platforms (global)')

    # Filter products
    items = list(products)
    if skip_names:
        items = [p for p in items if p.get('software_name', '') not in skip_names]
    if limit > 0:
        items = items[:limit]

    if not items:
        print(f'  No products to process for {collection}')
        return

    category_label = items[0].get('category_name', collection) if items else collection
    print(f'\n  Processing {len(items)} products for {collection} ({category_label})...\n')

    # Load existing JSON if appending
    json_entries = []
    if append and json_path.exists():
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                json_entries = json.load(f)
            print(f'  Loaded {len(json_entries)} existing entries from {json_path.name}')
        except Exception:
            pass

    md_entries = []
    if append and md_path.exists():
        try:
            with open(md_path, 'r', encoding='utf-8') as f:
                content = f.read()
                if '---' in content:
                    parts = content.split('---', 2)
                    if len(parts) >= 3:
                        md_entries.append(parts[2].strip())
        except Exception:
            pass

    for i, product in enumerate(items, 1):
        platform_name = product.get('software_name', '')
        layer = product.get('infrastructure_layer', '')
        cat_name = product.get('category_name', category_label)
        print(f'  [{i}/{len(items)}] {platform_name}  ({layer})')

        # Find documents
        doc_files = find_product_docs(platform_name)

        if dry_run:
            if doc_files:
                print(f'    DRY RUN: would process {len(doc_files)} doc(s): {[f.name for f in doc_files]}')
            else:
                print(f'    DRY RUN: no documents found for {safe_filename(platform_name)}*')
            continue

        if not doc_files:
            print(f'    SKIPPED: No documents found in {doc_dir.name}/')
            continue

        # Concatenate text from all docs
        all_text = []
        for doc_path in doc_files:
            text = extract_text(doc_path)
            if text:
                all_text.append(f'[Source: {doc_path.name}]\n{text}')
                print(f'    Extracted {len(text)} chars from {doc_path.name}')
            else:
                print(f'    Warning: No text from {doc_path.name}')

        combined_text = '\n\n'.join(all_text)
        if not combined_text:
            print(f'    SKIPPED: No text extracted from any document')
            continue

        # Truncate to reasonable size for LLM context
        combined_text = combined_text[:20000]

        # Call Ollama with layer-aware prompt
        fields = call_ollama(
            model=model,
            platform_name=platform_name,
            category=cat_name,
            layer=layer,
            text=combined_text,
            verbose=verbose,
        )

        if not fields:
            print(f'    FAILED: No response from Ollama')
            continue

        field_count = sum(1 for v in fields.values() if v and v != FALLBACK)
        print(f'    Extracted {field_count}/{len(CANONICAL_FIELDS)} fields')

        json_entries.append(format_json_entry(platform_name, cat_name, fields))
        md_entries.append(format_md_entry(platform_name, cat_name, fields))

        # Brief pause between calls
        time.sleep(0.5)

    if dry_run:
        return

    # Write JSON output
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(json_entries, f, indent=2, ensure_ascii=False)
    print(f'\n  JSON: {json_path} ({len(json_entries)} entries)')

    # Write Markdown output
    header = f"""---
generated: {datetime.now().strftime('%Y-%m-%d')}
collection: {collection}
documents_processed: {len(json_entries)}
enrichment_method: ollama-{model}
---

"""
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(header)
        f.write('\n'.join(md_entries))
    print(f'  Markdown: {md_path}')


def process_legacy_collection(collection: str, docs_map: dict[str, list[str]],
                              category_label: str, model: str,
                              limit: int = 0, dry_run: bool = False,
                              skip_existing: bool = False, append: bool = False,
                              verbose: bool = False):
    """Process a legacy hardcoded collection (custody/blockchain) from public/library/."""
    today = datetime.now().strftime('%m%d%Y')
    json_path = OUTPUT_DIR / f'{collection}_extractions_{today}.json'
    md_path = OUTPUT_DIR / f'{collection}_extractions_{today}.md'

    skip_names: set[str] = set()
    if skip_existing:
        skip_names = load_existing_extractions(collection)
        if skip_names:
            print(f'  Skipping {len(skip_names)} already-extracted platforms')

    platforms = list(docs_map.items())
    if skip_names:
        platforms = [(name, files) for name, files in platforms if name not in skip_names]
    if limit > 0:
        platforms = platforms[:limit]

    if not platforms:
        print(f'  No platforms to process for {collection}')
        return

    print(f'\n  Processing {len(platforms)} platforms for {collection}...\n')

    json_entries = []
    if append and json_path.exists():
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                json_entries = json.load(f)
            print(f'  Loaded {len(json_entries)} existing entries from {json_path.name}')
        except Exception:
            pass

    md_entries = []
    if append and md_path.exists():
        try:
            with open(md_path, 'r', encoding='utf-8') as f:
                content = f.read()
                if '---' in content:
                    parts = content.split('---', 2)
                    if len(parts) >= 3:
                        md_entries.append(parts[2].strip())
        except Exception:
            pass

    for i, (platform_name, doc_files) in enumerate(platforms, 1):
        print(f'  [{i}/{len(platforms)}] {platform_name}')

        if dry_run:
            print(f'    DRY RUN: would process {len(doc_files)} doc(s)')
            continue

        all_text = []
        for doc_file in doc_files:
            doc_path = PUBLIC_DIR / 'library' / doc_file
            if not doc_path.exists():
                print(f'    Warning: {doc_file} not found')
                continue
            text = extract_text(doc_path)
            if text:
                all_text.append(f'[Source: {doc_file}]\n{text}')
                print(f'    Extracted {len(text)} chars from {doc_file}')
            else:
                print(f'    Warning: No text from {doc_file}')

        combined_text = '\n\n'.join(all_text)
        if not combined_text:
            print(f'    SKIPPED: No text extracted from any document')
            continue
        combined_text = combined_text[:20000]

        # Use Application layer prompt for custody/blockchain
        fields = call_ollama(
            model=model,
            platform_name=platform_name,
            category=category_label,
            layer='Application',
            text=combined_text,
            verbose=verbose,
        )

        if not fields:
            print(f'    FAILED: No response from Ollama')
            continue

        field_count = sum(1 for v in fields.values() if v and v != FALLBACK)
        print(f'    Extracted {field_count}/{len(CANONICAL_FIELDS)} fields')

        json_entries.append(format_json_entry(platform_name, category_label, fields))
        md_entries.append(format_md_entry(platform_name, category_label, fields))
        time.sleep(0.5)

    if dry_run:
        return

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(json_entries, f, indent=2, ensure_ascii=False)
    print(f'\n  JSON: {json_path} ({len(json_entries)} entries)')

    header = f"""---
generated: {datetime.now().strftime('%Y-%m-%d')}
collection: {collection}
documents_processed: {len(json_entries)}
enrichment_method: ollama-{model}
---

"""
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(header)
        f.write('\n'.join(md_entries))
    print(f'  Markdown: {md_path}')


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description='Extract product info from downloaded docs using Ollama'
    )
    parser.add_argument(
        '--layer', type=str, default=None,
        help='Filter by infrastructure layer (e.g. Hardware, "Security Stack", Cloud)'
    )
    parser.add_argument(
        '--category', type=str, default=None,
        help='Filter by category_id (e.g. CSC-002)'
    )
    parser.add_argument(
        '--model', default=DEFAULT_MODEL,
        help=f'Ollama model name (default: {DEFAULT_MODEL})'
    )
    parser.add_argument(
        '--limit', type=int, default=0,
        help='Max products to process per category (0 = all)'
    )
    parser.add_argument(
        '--dry-run', action='store_true',
        help='Show what would be processed without calling Ollama'
    )
    parser.add_argument(
        '--skip-existing', action='store_true',
        help='Skip platforms already in prior extraction files'
    )
    parser.add_argument(
        '--append', action='store_true',
        help='Append to existing output file instead of overwriting'
    )
    parser.add_argument(
        '--verbose', action='store_true',
        help='Show raw Ollama responses'
    )
    # Legacy mode for backward compatibility
    parser.add_argument(
        '--legacy', action='store_true',
        help='Use legacy hardcoded doc mappings (custody/blockchain only)'
    )
    parser.add_argument(
        '--collection', choices=['custody', 'blockchain', 'all'],
        default='all', help='(Legacy mode) Which collection to process'
    )
    args = parser.parse_args()

    print(f'Product Info Extractor — model: {args.model}')
    print(f'Output dir: {OUTPUT_DIR}')

    # ─── Legacy mode ──────────────────────────────────────────────────
    if args.legacy:
        print('\n[Legacy mode — hardcoded doc mappings]\n')
        if args.collection in ('custody', 'all'):
            print('=== CSC-057: Digital Asset Custody ===')
            process_legacy_collection(
                collection='custody',
                docs_map=LEGACY_CUSTODY_DOCS,
                category_label='Digital Asset Custody',
                model=args.model,
                limit=args.limit,
                dry_run=args.dry_run,
                skip_existing=args.skip_existing,
                append=args.append,
                verbose=args.verbose,
            )
        if args.collection in ('blockchain', 'all'):
            print('\n=== CSC-058: Blockchain & DLT Protocols ===')
            process_legacy_collection(
                collection='blockchain',
                docs_map=LEGACY_BLOCKCHAIN_DOCS,
                category_label='Blockchain & DLT Protocols',
                model=args.model,
                limit=args.limit,
                dry_run=args.dry_run,
                skip_existing=args.skip_existing,
                append=args.append,
                verbose=args.verbose,
            )
        print('\nDone.')
        return

    # ─── CSV-driven mode (default) ────────────────────────────────────
    csv_path = find_latest_migrate_csv()
    print(f'Source CSV: {csv_path.name}')
    all_products = load_products_from_csv(csv_path)
    print(f'Total products in CSV: {len(all_products)}')

    # Apply layer filter
    if args.layer:
        all_products = [p for p in all_products
                        if p.get('infrastructure_layer', '').lower() == args.layer.lower()]
        print(f'After layer filter ({args.layer}): {len(all_products)} products')

    # Apply category filter
    if args.category:
        all_products = [p for p in all_products
                        if p.get('category_id', '').upper() == args.category.upper()]
        print(f'After category filter ({args.category}): {len(all_products)} products')

    if not all_products:
        print('No products match the given filters.')
        return

    # Group by category_id
    categories: dict[str, list[dict]] = {}
    for p in all_products:
        cat_id = p.get('category_id', 'unknown')
        if cat_id not in categories:
            categories[cat_id] = []
        categories[cat_id].append(p)

    print(f'\nCategories to process: {len(categories)}')
    for cat_id, prods in sorted(categories.items()):
        cat_name = prods[0].get('category_name', cat_id) if prods else cat_id
        print(f'  {cat_id}: {cat_name} ({len(prods)} products)')

    # Process each category
    for cat_id, prods in sorted(categories.items()):
        cat_name = prods[0].get('category_name', cat_id) if prods else cat_id
        # Normalize: CSC-002 → csc_002
        collection_slug = cat_id.lower().replace('-', '_')
        print(f'\n{"="*60}')
        print(f'=== {cat_id}: {cat_name} ===')
        print(f'{"="*60}')

        process_collection(
            collection=collection_slug,
            products=prods,
            model=args.model,
            limit=args.limit,
            dry_run=args.dry_run,
            skip_existing=args.skip_existing,
            append=args.append,
            verbose=args.verbose,
        )

    print('\nDone.')


if __name__ == '__main__':
    main()
