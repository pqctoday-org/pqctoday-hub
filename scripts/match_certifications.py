#!/usr/bin/env python3
"""
Cross-reference migrate software catalog with certifications from compliance-data.json.

Uses category-aware matching: FIPS cert products are classified into CSC categories,
then matched to migrate products by (normalized_vendor, category) alignment.

Reads:
  - public/data/compliance-data.json (scraped FIPS/ACVP/CC certifications)
  - src/data/pqc_product_catalog_*.csv (migrate catalog, latest by date)

Writes:
  - src/data/migrate_certification_xref_MMDDYYYY.csv (product → cert links)
  - public/data/vendor-cert-counts.json (vendor consolidation counts)

Usage:
  python3 scripts/match_certifications.py
"""

import csv
import json
import re
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
COMPLIANCE_JSON = ROOT / "public" / "data" / "compliance-data.json"
MIGRATE_DIR = ROOT / "src" / "data"
TODAY = datetime.now().strftime("%m%d%Y")
OUTPUT = MIGRATE_DIR / f"migrate_certification_xref_{TODAY}.csv"
VENDOR_COUNTS_OUTPUT = ROOT / "public" / "data" / "vendor-cert-counts.json"

XREF_COLUMNS = [
    "software_name",
    "cert_type",
    "cert_id",
    "cert_vendor",
    "cert_product",
    "pqc_algorithms",
    "certification_level",
    "status",
    "cert_date",
    "cert_link",
]

# ── CSC Category Classifier ─────────────────────────────────────────────
#
# Classifies FIPS cert products into CSC categories based on product name.
# Order matters: first match wins. More specific patterns come first.

CSC_CLASSIFY_RULES: list[tuple[str, list[str]]] = [
    # HSM hardware (CSC-002) — must precede generic crypto lib patterns
    ("CSC-002", [
        "hsm", "luna", "nshield", "cryptoserver", "liquidsecurity", "nitrox",
        "primus", "yubihsm", "protectserver", "payshield", "qxhsm",
        "pkcs#11 hsm", "pkcs #11 hsm", "hardware security module",
        "coprocessor security", "marvell ls2",
    ]),
    # Key management (CSC-003)
    ("CSC-003", [
        "key management", "key vault", "ciphertrust manager",
        "guardium key", "key lifecycle", "eskm",
    ]),
    # Network encryptors (CSC-048)
    ("CSC-048", ["cn series encryptor", "cn6000 series", "ce crypto module"]),
    # Network security / firewalls (CSC-033)
    ("CSC-033", [
        "firewall", "fortigate", "pan-os", "adaptive security", "srx",
        "big-ip", "threat defense", "firepower", "sonicwall", "nsa ",
        "security gateway", "network security platform",
    ]),
    # VPN / IPsec (CSC-010)
    ("CSC-010", [
        "vpn", "ipsec", "globalprotect", "anyconnect", "secure client",
        "libreswan", "strongswan", "sd-wan",
    ]),
    # Router / switch / network OS (CSC-032)
    ("CSC-032", [
        "router", "switch", "junos", "ios common crypto", "ic2m",
        "catalyst", "aironet", "wireless controller", "access point",
        "macsec", "arista eos",
    ]),
    # Disk / file encryption (CSC-006)
    ("CSC-006", ["bitlocker", "dump filter", "transparent encryption",
                  "self-encrypting drive", "sed", "inline storage encryption",
                  "inline crypto engine", "nvme", "flashcore", "ufs"]),
    # Code signing / integrity (CSC-017)
    ("CSC-017", ["code integrity", "secure kernel code", "boot manager",
                  "os loader", "tcb launcher"]),
    # Secure boot / firmware (CSC-026)
    ("CSC-026", ["secure boot", "firmware", "bootloader"]),
    # TPM / hardware security (CSC-034)
    ("CSC-034", [
        "tpm", "trusted platform", "secure element", "se05", "jcop",
        "tensor", "titan", "pluton", "crypto engine core",
        "asp cryptographic coprocessor", "inline crypto engine",
    ]),
    # Smart cards / SIM (CSC-054)
    ("CSC-054", [
        "sim", "safeword", "etoken", "idcore", "rooky", "fido",
        "piv", "id-one", "smart card",
    ]),
    # SSH (CSC-014)
    ("CSC-014", ["openssh"]),
    # OS kernel crypto (CSC-031)
    ("CSC-031", [
        "kernel crypto", "kernel cryptographic", "linux kernel",
        "kfom", "unbreakable enterprise kernel",
    ]),
    # Network appliances / SBC (CSC-032) — before generic crypto catch-all
    ("CSC-032", [
        "acme packet", "networking adapter kernel",
    ]),
    # Boot / resume (CSC-026) — before generic crypto catch-all
    ("CSC-026", [
        "windows resume",
    ]),
    # Crypto libraries (CSC-001) — broad catch for known crypto modules
    ("CSC-001", [
        "boringcrypto", "aws-lc", "corecrypto", "cryptographic primitives",
        "openssl", "wolfcrypt", "wolfssl", "bc-fja", "bc-fna",
        "bouncy castle", "crypto for c", "fips provider", "fips object module",
        "nss crypto", "pqcryptolib", "pqmicrolib", "cryptocomply",
        "commoncryptolib", "cryptomodule", "crypto module",
        "cryptographic module", "cryptographic library", "crypto library",
        "gnutls", "libgcrypt", "nss ", "symcrypt",
        "mocana", "safelogic", "datapower fips",
        "ciscossl", "cisco fips provider", "cisco fips object",
        "juniper fips provider", "juniper openssl",
        "oracle openssl", "oracle cloud infrastructure",
        "fortios", "forticlient crypto",
        "wind river fips", "sap commoncryptolib",
        "suse linux enterprise", "red hat enterprise linux",
        "ubuntu", "amazon linux", "almalinux", "rocky linux",
        "ibm cos linux",
        "virtual tpm",
        "cr50", "opensk",
        "samsung boringcrypto",
    ]),
]


def classify_fips_product(product_name: str, vendor: str = "") -> str:
    """Classify a FIPS cert product into a CSC category."""
    pn = product_name.lower()
    for csc_cat, keywords in CSC_CLASSIFY_RULES:
        for kw in keywords:
            if kw in pn:
                return csc_cat
    return "CSC-001"  # fallback: generic crypto module


# ── Vendor Normalization ─────────────────────────────────────────────────

_VENDOR_STRIP_SUFFIXES = re.compile(
    r",?\s*\b(?:inc\.?|llc\.?|ltd\.?|limited|corporation|corp\.?|"
    r"gmbh|se|ag|co\.?|plc|pty|nv|sa|s\.?a\.?|"
    r"the|a division of \w+)\b\.?",
    re.IGNORECASE,
)
_VENDOR_STRIP_PARENS = re.compile(r"\s*\([^)]*\)")
_VENDOR_COLLAPSE_WS = re.compile(r"\s+")


def normalize_vendor(name: str) -> str:
    """Normalize a vendor name for fuzzy matching."""
    n = name.strip().lower()
    n = _VENDOR_STRIP_PARENS.sub("", n)
    n = _VENDOR_STRIP_SUFFIXES.sub("", n)
    n = n.replace(",", " ").replace(".", " ").replace("®", "").replace("™", "")
    n = _VENDOR_COLLAPSE_WS.sub(" ", n).strip()
    return n


# ── Product → Vendor mapping ────────────────────────────────────────────
#
# Maps migrate product software_name to a normalized vendor key that will
# match against normalized FIPS cert vendor names.
# Only needed for products where the vendor can't be inferred from the name.

PRODUCT_VENDOR_MAP: dict[str, str] = {
    # AWS products
    "AWS-LC": "amazon web services",
    "AWS Application Load Balancer (ALB)": "amazon web services",
    "AWS CloudHSM": "amazon web services",
    "AWS Identity and Access Management (IAM)": "amazon web services",
    "AWS KMS": "amazon web services",
    "AWS KMS (Cloud Gateway)": "amazon web services",
    "AWS s2n-tls": "amazon web services",
    # Google products
    "Android 16": "google",
    "BoringSSL": "google",
    "ChromeOS": "google",
    "Gmail / Google Workspace": "google",
    "Go stdlib crypto/mlkem": "google",
    # Apple products
    "Apple PQ3 / CoreCrypto": "apple",
    "Apple Safari": "apple",
    "Apple codesign": "apple",
    "FileVault (macOS)": "apple",
    "iOS 26 / macOS 26": "apple",
    # Microsoft products
    ".NET System.Security.Cryptography": "microsoft",
    "Azure Dedicated HSM (Marvell LiquidSecurity)": "marvell",
    "Azure DevOps": "microsoft",
    "Azure Key Vault": "microsoft",
    "BitLocker (Windows)": "microsoft",
    "Microsoft AD CS": "microsoft",
    "Microsoft Entra ID": "microsoft",
    "Microsoft Entra Verified ID": "microsoft",
    "Microsoft Entra External ID": "microsoft",
    "Microsoft SignTool": "microsoft",
    "Microsoft SymCrypt": "microsoft",
    "SQL Server TDE/Always Encrypted": "microsoft",
    "Windows 11": "microsoft",
    "Windows Server 2025": "microsoft",
    # IBM products
    "IBM Cloud HSM (Utimaco)": "utimaco",
    "IBM Guardium Key Lifecycle Manager": "ibm",
    "IBM Guardium Quantum Safe": "ibm",
    "IBM Quantum Safe Toolkit": "ibm",
    "IBM Security Guardium Data Protection": "ibm",
    "IBM z/OS Cryptographic Services (ICSF)": "ibm",
    # Thales products
    "Thales Luna HSM": "thales",
    "Thales Luna T-Series HSM": "thales tct",
    "Thales Luna Cloud HSM (DPoD)": "thales",
    "Thales CipherTrust Manager": "thales",
    "Thales CipherTrust Cloud Key Manager": "thales",
    "Thales CipherTrust Data Security Platform": "thales",
    "Thales High Speed Encryptor (HSE)": "thales",
    "Thales MISTRAL Encryptor": "thales",
    "Thales payShield 10K": "thales",
    "Thales 5G Quantum-Safe SIM": "thales",
    "Thales MultiApp 5.2 Premium PQC": "thales",
    # Entrust products
    "Entrust nShield": "entrust",
    "Entrust KeyControl": "entrust",
    "Entrust PKI": "entrust",
    # Cisco products
    "Cisco ASA (Adaptive Security Appliance)": "cisco",
    "Cisco IOS XE PQC": "cisco",
    "Cisco Meraki MX (Cloud-Managed Firewall)": "cisco",
    "Cisco Secure Client (AnyConnect)": "cisco",
    # Oracle products
    "Oracle AI Database 26ai": "oracle",
    "Oracle Key Vault": "oracle",
    # Samsung products
    "Samsung Knox Quantum-Safe": "samsung",
    "Samsung Networks 5G Core": "samsung",
    "Samsung S3SSE2A eSE": "samsung",
    # Fortinet products
    "Fortinet FortiOS": "fortinet",
    "Fortinet FortiGate (FortiOS)": "fortinet",
    # Palo Alto products
    "Palo Alto PAN-OS": "palo alto",
    "Palo Alto GlobalProtect": "palo alto",
    # Juniper products
    "Juniper Junos OS": "juniper",
    "Juniper SRX Series Firewalls": "juniper",
    # Others where vendor != product name prefix
    "NXP JCOP 4.5 P71D600": "nxp",
    "NXP SE051 Secure Element": "nxp",
    "Red Hat Enterprise Linux 9": "red hat",
    "SUSE Linux Enterprise Server (SLES)": "suse",
    "Ubuntu 24.04 LTS": "canonical",
    "wolfBoot": "wolfssl",
    "wolfSSL": "wolfssl",
    "PQCryptoLib-Core": "pqshield",
    "PQMicroLib-Core": "pqshield",
    "Check Point Quantum": "check point",
    "Senetas CN7000 Series": "senetas",
    # Dell BSAFE — vendor prefix "Dell" matches but BSAFE is the product line
    "Dell BSAFE Crypto Module for C": "dell",
    "Dell BSAFE Crypto-J": "dell",
    # STMicro
    "STMicroelectronics ST33KTPM": "stmicro",
    # Secure-IC
    "Secure-IC Securyzr": "secure-ic",
    # Xiphera
    "Xiphera PQC IP Cores": "xiphera",
    "Xiphera XIP6110B": "xiphera",
    # CryptoNext
    "CryptoNext Quantum-Safe Library": "cryptonext",
    # evolutionQ (vendor = Quantum Bridge Technologies)
    "evolutionQ BasejumpQDN": "quantum bridge",
    "evolutionQ BasejumpSKI": "quantum bridge",
    # Best PQC
    "Best PQC Intelligent Cybersecurity Suite": "best pqc",
}


def extract_vendor_from_product(software_name: str) -> str:
    """Extract normalized vendor key from a product's software_name."""
    # Check explicit mapping first
    if software_name in PRODUCT_VENDOR_MAP:
        return PRODUCT_VENDOR_MAP[software_name]

    # Heuristic: first word(s) of product name, normalized
    name = software_name.lower()
    # Common multi-word vendor prefixes
    multi_word = [
        "amazon web services", "bouncy castle", "palo alto", "check point",
        "red hat", "wind river", "f5 ", "id quantique", "st micro",
    ]
    for prefix in multi_word:
        if name.startswith(prefix):
            return prefix.strip()

    # Single-word prefix
    first_word = name.split()[0] if name else ""
    # Strip trailing punctuation
    first_word = first_word.rstrip(",.:;")
    return first_word


# ── Vendor alias mapping ────────────────────────────────────────────────
#
# Maps normalized cert vendor names to canonical vendor keys used in
# PRODUCT_VENDOR_MAP / extract_vendor_from_product.

VENDOR_ALIASES: dict[str, str] = {
    "amazon web services": "amazon web services",
    "google": "google",
    "apple": "apple",
    "microsoft": "microsoft",
    "ibm": "ibm",
    "thales": "thales",
    "thales trusted cyber technologies": "thales tct",
    "thales trusted cyber": "thales tct",
    "thales dis france": "thales",
    "thales dis": "thales",
    "thales norway": "thales",
    "thales norway as": "thales",
    "thales alenia": "thales",
    "thales group": "thales",
    "entrust": "entrust",
    "cisco systems": "cisco",
    "cisco": "cisco",
    "oracle": "oracle",
    "oracle communications": "oracle",
    "samsung electronics": "samsung",
    "samsung": "samsung",
    "fortinet": "fortinet",
    "fortinet technologies": "fortinet",
    "palo alto networks": "palo alto",
    "palo alto": "palo alto",
    "juniper networks": "juniper",
    "juniper": "juniper",
    "f5": "f5",
    "marvell": "marvell",
    "marvell semiconductor": "marvell",
    "nxp semiconductors": "nxp",
    "nxp": "nxp",
    "idemia": "idemia",
    "intel": "intel",
    "utimaco is": "utimaco",
    "utimaco": "utimaco",
    "securosys": "securosys",
    "futurex": "futurex",
    "crypto4a": "crypto4a",
    "fortanix": "fortanix",
    "stmicroelectronics": "stmicro",
    "safelogic": "safelogic",
    "cryptonext": "cryptonext",
    "arista networks": "arista",
    "arista": "arista",
    "blackberry": "blackberry",
    "citrix": "citrix",
    "red hat": "red hat",
    "pqshield": "pqshield",
    "check point software technologies": "check point",
    "check point": "check point",
    "wolfssl": "wolfssl",
    "digicert": "digicert",
    "yubico": "yubico",
    "wind river": "wind river",
    "sap": "sap",
    "suse": "suse",
    "senetas": "senetas",
    "okta": "okta",
    "canonical": "canonical",
    "openssl": "openssl",
    "bouncy castle": "bouncy castle",
    "legion of bouncy castle": "bouncy castle",
    "legion of the bouncy castle": "bouncy castle",
    "dell": "dell",
    "dell australia": "dell",
    "dell australia pty limited": "dell",
    "stmicroelectronics": "stmicro",
    "secure ic": "secure-ic",
    "secure ic sa": "secure-ic",
    "xiphera": "xiphera",
    "xiphera ltd": "xiphera",
    "cryptonext security": "cryptonext",
    "quantum bridge technologies": "quantum bridge",
    "best pqc intelligent cybersecurity": "best pqc",
    "broadcom": "broadcom",
    "vmware": "vmware",
    "advanced micro devices": "amd",
    "amd": "amd",
    "qualcomm technologies": "qualcomm",
    "qualcomm": "qualcomm",
    "infineon technologies": "infineon",
    "infineon": "infineon",
    "nokia": "nokia",
    "nokia xhaul": "nokia",
    "nokia of america": "nokia",
    "hewlett packard enterprise": "hpe",
    "hpe aruba networking": "hpe",
    "aruba": "hpe",
    "netapp": "netapp",
    "dell": "dell",
    "dell australia": "dell",
    "motorola solutions": "motorola",
    "honeywell international": "honeywell",
    "honeywell": "honeywell",
    "zscaler": "zscaler",
    "trellix": "trellix",
    "splunk": "splunk",
    "nutanix": "nutanix",
    "unisys": "unisys",
    "sonicwall": "sonicwall",
    "ctrl iq": "rocky",  # Rocky Linux
    "cloudlinux": "almalinux",
    "rambus": "rambus",
    "hp": "hp",
    "hitachi": "hitachi",
    "huawei technologies": "huawei",
    "huawei": "huawei",
}


def resolve_cert_vendor(raw_vendor: str) -> str:
    """Normalize a cert vendor name and resolve to canonical key."""
    norm = normalize_vendor(raw_vendor)
    # Try exact match first
    if norm in VENDOR_ALIASES:
        return VENDOR_ALIASES[norm]
    # Try prefix matching (e.g., "cisco systems" matches "cisco")
    for alias, canonical in VENDOR_ALIASES.items():
        if norm.startswith(alias) or alias.startswith(norm):
            return canonical
    return norm


# ── Category compatibility ───────────────────────────────────────────────
#
# Defines which cert CSC categories are compatible with each migrate CSC category.
# A migrate product in CSC-046 (Cloud HSM) can match certs classified as CSC-002 (HSM)
# or CSC-001 (Crypto Libraries, since cloud HSMs use underlying crypto modules).

CATEGORY_COMPAT: dict[str, set[str]] = {
    # ── Products with specific cert categories: match OWN category only ──
    # These vendors have product-specific FIPS certs — don't pull in generic
    # crypto lib certs which would cause over-matching for big vendors.

    # HSM products match HSM certs + crypto lib certs (underlying module)
    "CSC-002": {"CSC-002", "CSC-001"},
    "CSC-046": {"CSC-002", "CSC-001"},
    # KMS products match KMS certs + HSM certs + crypto lib certs
    "CSC-003": {"CSC-003", "CSC-002", "CSC-001"},
    "CSC-045": {"CSC-003", "CSC-002", "CSC-001"},
    # Network security / firewalls match firewall certs + crypto libs
    "CSC-033": {"CSC-033", "CSC-001"},
    # Network OS match router/switch certs + crypto libs
    "CSC-032": {"CSC-032", "CSC-001"},
    # VPN match VPN certs + crypto libs (VPN uses underlying FIPS provider)
    "CSC-010": {"CSC-010", "CSC-001"},
    # Network encryptors match encryptor certs + crypto libs
    "CSC-048": {"CSC-048", "CSC-001"},
    # Hardware security / semiconductors match TPM/HW + crypto libs
    "CSC-034": {"CSC-034", "CSC-001"},
    # Smart cards / secure elements match smart card + HW certs
    "CSC-054": {"CSC-054", "CSC-034"},
    # Code signing match code integrity + crypto libs (uses underlying module)
    "CSC-017": {"CSC-017", "CSC-001"},
    # Disk encryption match disk encryption + crypto libs
    "CSC-006": {"CSC-006", "CSC-001"},

    # ── Products WITHOUT specific cert categories: match CSC-001 (crypto libs) ──
    # These are software products that use underlying crypto modules.

    # Crypto libraries match crypto lib certs
    "CSC-001": {"CSC-001"},
    "CSC-016": {"CSC-001"},
    "CSC-047": {"CSC-001"},
    # TLS/SSL match crypto lib certs
    "CSC-005": {"CSC-001"},
    # OS products match OS kernel + crypto lib certs
    "CSC-031": {"CSC-031", "CSC-001"},
    "CSC-019": {"CSC-031", "CSC-001"},
    # Database encryption match crypto lib certs
    "CSC-007": {"CSC-001"},
    # Email encryption match crypto lib certs
    "CSC-008": {"CSC-001"},
    # Digital signature match crypto lib certs
    "CSC-009": {"CSC-001"},
    # PKI match crypto lib certs (HSM backend is handled via override rules)
    "CSC-004": {"CSC-001"},
    "CSC-013": {"CSC-001"},
    # Certificate lifecycle match crypto lib certs
    "CSC-041": {"CSC-001"},
    # SSH match crypto lib certs
    "CSC-014": {"CSC-001"},
    # IAM match crypto lib certs
    "CSC-042": {"CSC-001"},
    # CIAM match crypto lib certs
    "CSC-044": {"CSC-001"},
    # Cloud encryption gateways match crypto lib certs
    "CSC-028": {"CSC-001"},
    # Data security match crypto lib certs
    "CSC-043": {"CSC-001"},
    # Remote access / VDI match crypto lib certs
    "CSC-036": {"CSC-001"},
    # Web browsers match crypto lib certs
    "CSC-037": {"CSC-001"},
    # Application servers match crypto lib certs
    "CSC-038": {"CSC-001"},
    # 5G / telecom match crypto lib certs + smart cards
    "CSC-050": {"CSC-001", "CSC-054"},
    # Cryptographic discovery match crypto lib certs
    "CSC-049": {"CSC-001"},
    # Secrets management match crypto lib certs
    "CSC-053": {"CSC-001"},
    # Payment crypto match HSM certs (payment HSMs)
    "CSC-029": {"CSC-002"},
    # Real-time OS match crypto lib certs
    "CSC-056": {"CSC-001"},
    # Secure boot / firmware match crypto lib certs
    "CSC-026": {"CSC-001"},
    # Secure messaging match crypto lib certs
    "CSC-011": {"CSC-001"},
    # API security / JWT match crypto lib certs
    "CSC-015": {"CSC-001"},
    # Cryptographic agility match crypto lib certs
    "CSC-025": {"CSC-001"},
    # IoT security match crypto lib certs
    "CSC-039": {"CSC-001"},
    # CI/CD match crypto lib certs
    "CSC-040": {"CSC-001"},
    # Container / service mesh match crypto lib certs
    "CSC-055": {"CSC-001"},
    # Digital identity match crypto lib certs + smart cards
    "CSC-051": {"CSC-001", "CSC-054"},
    # Confidential computing match crypto lib certs
    "CSC-052": {"CSC-001"},
    # Digital asset custody match crypto lib certs
    "CSC-057": {"CSC-001"},
    # Blockchain / DLT match crypto lib certs
    "CSC-058": {"CSC-001"},
    # ICS / OT security match crypto lib certs
    "CSC-059": {"CSC-001"},
    # AI/ML security match crypto lib certs
    "CSC-060": {"CSC-001"},
    # Network testing match crypto lib certs
    "CSC-061": {"CSC-001"},
}


# ── Override rules ───────────────────────────────────────────────────────
#
# For products that use a DIFFERENT vendor's crypto module, or need
# special cross-vendor matching. Format:
#   product_name → [(cert_vendor_key, cert_csc_categories)]
#
# These are ADDITIONAL matches on top of automatic vendor+category matching.

OVERRIDE_RULES: dict[str, list[tuple[str, set[str]]]] = {
    # IBM Cloud HSM uses Utimaco hardware
    "IBM Cloud HSM (Utimaco)": [("utimaco", {"CSC-002", "CSC-001"})],
    # Azure Dedicated HSM uses Marvell LiquidSecurity
    "Azure Dedicated HSM (Marvell LiquidSecurity)": [("marvell", {"CSC-002"})],
    # Google Cloud HSM uses Marvell hardware internally
    "Google Cloud HSM": [("marvell", {"CSC-002"})],
    # Entrust KeyControl uses nShield HSM backend
    "Entrust KeyControl": [("entrust", {"CSC-002", "CSC-001"})],
    # Entrust PKI uses nShield HSM backend
    "Entrust PKI": [("entrust", {"CSC-002", "CSC-001"})],
    # Senetas uses Thales CE Crypto Module
    "Senetas CN7000 Series": [("thales", {"CSC-048", "CSC-001"})],
    # Thales MISTRAL uses Thales Alenia Space modules
    "Thales MISTRAL Encryptor": [("thales alenia space", {"CSC-001"})],
}

# ── Products to SKIP for FIPS matching ───────────────────────────────────
# Products that claim FIPS but through partners/platforms, not own certs
SKIP_FIPS: set[str] = {
    "Hitachi DoMobile",       # Implements FIPS 203 algorithm, no CMVP validation
    "Keysight Inspector",     # Validates other modules, not itself validated
    "Libreswan",              # FIPS mode via NSS/OpenSSL, not own cert
    "leancrypto",             # CAVP only, no CMVP
}


# ── FIPS product-relevance filter ───────────────────────────────────────
#
# Prevents over-matching: a vendor's OS-level crypto subsystem certs should
# NOT be linked to that vendor's application products.  E.g., "Oracle Linux 9
# NSS Cryptographic Module" is irrelevant to "Oracle AI Database 26ai".
#
# Two-layer filter:
#   1. OS subsystem keywords — certs for secondary crypto subsystems (NSS,
#      GnuTLS, libgcrypt, OpenSSH, libreswan, kernel crypto) are blocked for
#      non-OS products.  These are infrastructure, not application crypto.
#   2. OS distribution markers — certs named after a specific OS distribution
#      (e.g., "Oracle Linux", "Azure Linux") only match products that ARE
#      that OS, preventing cross-platform false associations.

_OS_SUBSYSTEM_KEYWORDS: list[str] = [
    "nss cryptographic",
    " nss ",
    "gnutls cryptographic",
    "gnutls module",
    "libgcrypt",
    "openssh server",
    "openssh client",
    "libreswan",
    "kernel crypto api",
    "kernel cryptographic",
    "unbreakable enterprise kernel",
]

# (pattern_in_cert_product, required_substring_in_migrate_product)
# If a cert product contains the first pattern, the migrate product MUST
# contain the second pattern to be considered relevant.
_OS_DISTRO_MARKERS: list[tuple[str, str]] = [
    ("oracle linux", "oracle linux"),
    ("oracle solaris", "oracle solaris"),
    ("oracle cloud infrastructure", "oracle cloud infrastructure"),
    ("red hat enterprise linux", "red hat enterprise linux"),
    ("amazon linux", "amazon linux"),
    ("azure linux", "azure linux"),
    ("rocky linux", "rocky linux"),
    ("almalinux", "almalinux"),
    ("ubuntu", "ubuntu"),
    ("suse linux", "suse linux"),
    ("ibm cos linux", "ibm cos"),
    ("wind river linux", "wind river"),
]

_OS_CATEGORIES: set[str] = {"CSC-031"}


def _is_relevant_fips_cert(sw_name: str, product_cat: str, cert_product: str) -> bool:
    """Check if a FIPS cert is relevant to a migrate product.

    Returns False for:
    - OS subsystem certs (NSS, GnuTLS, etc.) matched to non-OS products
    - OS-distribution-specific certs matched to products that aren't that OS
    """
    cert_lower = cert_product.lower()
    sw_lower = sw_name.lower()

    # Rule 1: Block OS subsystem certs for non-OS products
    if product_cat not in _OS_CATEGORIES:
        if any(kw in cert_lower for kw in _OS_SUBSYSTEM_KEYWORDS):
            return False

    # Rule 2: Block OS-distro-specific certs unless product IS that OS
    for cert_pattern, product_pattern in _OS_DISTRO_MARKERS:
        if cert_pattern in cert_lower and product_pattern not in sw_lower:
            return False

    return True


def normalize_product_family(product_name: str) -> str:
    """Extract product family from full product name (strip build variants)."""
    base = re.sub(r"\s*\((?:static|dynamic)\s+build\).*", "", product_name)
    base = re.sub(r"\s*\([a-z_]+\)\s*$", "", base, flags=re.IGNORECASE)
    return base.strip()


def is_pqc_relevant(record: dict) -> bool:
    """Check if a record has PQC algorithm coverage."""
    cov = record.get("pqcCoverage")
    return bool(cov and cov not in (False, "false", "No PQC Mechanisms Detected"))


def make_xref_entry(sw_name: str, rec: dict) -> dict:
    """Create an xref entry from a compliance record."""
    pqc_algos = rec.get("pqcCoverage", "")
    if isinstance(pqc_algos, bool):
        pqc_algos = ""
    return {
        "software_name": sw_name,
        "cert_type": rec.get("type", ""),
        "cert_id": rec.get("id", ""),
        "cert_vendor": rec.get("vendor", ""),
        "cert_product": rec.get("productName", ""),
        "pqc_algorithms": pqc_algos,
        "certification_level": rec.get("certificationLevel", ""),
        "status": rec.get("status", ""),
        "cert_date": rec.get("date", ""),
        "cert_link": rec.get("link", ""),
    }


def deduplicate_by_family(matches: list[dict], keep_per_family: int = 1) -> list[dict]:
    """Deduplicate cert matches: keep most recent per product family."""
    groups: dict[tuple[str, str], list[dict]] = {}
    for m in matches:
        family = normalize_product_family(m["cert_product"])
        key = (m["software_name"], family)
        groups.setdefault(key, []).append(m)

    deduped = []
    for _key, group in groups.items():
        group.sort(key=lambda x: x["cert_date"], reverse=True)
        deduped.extend(group[:keep_per_family])
    return deduped


def deduplicate_acvp(matches: list[dict]) -> list[dict]:
    """Deduplicate ACVP build variants: keep most recent per product family + algo."""
    groups: dict[tuple[str, str, str], list[dict]] = {}
    for m in matches:
        family = normalize_product_family(m["cert_product"])
        key = (m["software_name"], family, m["pqc_algorithms"])
        groups.setdefault(key, []).append(m)

    deduped = []
    for _key, group in groups.items():
        group.sort(key=lambda x: x["cert_date"], reverse=True)
        deduped.append(group[0])
    return deduped


def compute_vendor_counts(all_records: list[dict]) -> list[dict]:
    """Compute cert counts per vendor, grouped by cert type."""
    vendor_counts: dict[str, dict[str, int]] = {}
    for r in all_records:
        vendor = r.get("vendor", "Unknown")
        cert_type = r.get("type", "Unknown")

        if vendor not in vendor_counts:
            vendor_counts[vendor] = {"FIPS 140-3": 0, "ACVP": 0, "Common Criteria": 0}
        if cert_type in vendor_counts[vendor]:
            vendor_counts[vendor][cert_type] += 1

    result = []
    for vendor, counts in sorted(vendor_counts.items(), key=lambda x: sum(x[1].values()), reverse=True):
        total = sum(counts.values())
        if total > 0:
            result.append({
                "vendor": vendor,
                "fips": counts["FIPS 140-3"],
                "acvp": counts["ACVP"],
                "cc": counts["Common Criteria"],
                "total": total,
            })
    return result


# ── ACVP test labs — never link to products ──────────────────────────────
# These vendors submit certs on behalf of clients; they are not product vendors.
ACVP_TEST_LABS: set[str] = {
    "atsec",
    "keypair consulting",
    "center for development of telematics",
    "ncc group",
    "gossamer security",
    "lightship security",
}


# ── ACVP vendor → allowed catalog category_ids ───────────────────────────
#
# Maps canonical vendor key (from resolve_cert_vendor / extract_vendor_from_product)
# to the set of catalog category_ids where that vendor's ACVP certs should be linked.
# Prevents false positives: a Google ACVP cert won't link to a non-Google product
# even if "google" appears in the product name by coincidence.
#
# Categories are restricted to where that vendor actually has catalog products.
# Derived from current xref linkages + new vendors discovered in compliance-data.json.

VENDOR_CATEGORY_RULES: dict[str, set[str]] = {
    "bouncy castle":        {"CSC-001"},
    "amazon web services":  {"CSC-001", "CSC-005", "CSC-028", "CSC-042", "CSC-045", "CSC-046"},
    "google":               {"CSC-001", "CSC-002", "CSC-005", "CSC-008", "CSC-028", "CSC-031",
                             "CSC-034", "CSC-037", "CSC-045"},
    "thales":               {"CSC-002", "CSC-003", "CSC-028", "CSC-029", "CSC-043", "CSC-046",
                             "CSC-048", "CSC-050", "CSC-054"},
    "apple":                {"CSC-006", "CSC-011", "CSC-017", "CSC-031", "CSC-037"},
    "cisco":                {"CSC-010", "CSC-032", "CSC-033"},
    "oracle":               {"CSC-003", "CSC-007"},
    "ibm":                  {"CSC-002", "CSC-003", "CSC-007", "CSC-028"},
    "entrust":              {"CSC-002", "CSC-003", "CSC-004"},
    "utimaco":              {"CSC-002", "CSC-003", "CSC-046"},
    "samsung":              {"CSC-031", "CSC-034", "CSC-050"},
    "securosys":            {"CSC-002", "CSC-046"},
    "futurex":              {"CSC-002", "CSC-028", "CSC-029"},
    "intel":                {"CSC-034", "CSC-052"},
    "marvell":              {"CSC-002", "CSC-046"},
    "openssl":              {"CSC-001", "CSC-005"},
    "crypto4a":             {"CSC-002"},
    "fortanix":             {"CSC-028"},
    "safelogic":            {"CSC-001"},
    "pqshield":             {"CSC-001", "CSC-016"},
    "check point":          {"CSC-010", "CSC-033"},
    "wolfssl":              {"CSC-001", "CSC-005", "CSC-026"},
    "microsoft":            {"CSC-001", "CSC-003", "CSC-006", "CSC-007", "CSC-017",
                             "CSC-031", "CSC-041", "CSC-045"},
    "fortinet":             {"CSC-032", "CSC-033"},
    "palo alto":            {"CSC-010", "CSC-033"},
    "juniper":              {"CSC-032", "CSC-033"},
    "f5":                   {"CSC-028", "CSC-033"},
    "digicert":             {"CSC-004", "CSC-017", "CSC-041"},
    "yubico":               {"CSC-002"},
    "wind river":           {"CSC-019", "CSC-031", "CSC-060"},
    "sap":                  {"CSC-001", "CSC-007"},
    "suse":                 {"CSC-031"},
    "senetas":              {"CSC-048"},
    "okta":                 {"CSC-042"},
    "canonical":            {"CSC-031"},
    "arista":               {"CSC-032"},
    "red hat":              {"CSC-031"},
    "idemia":               {"CSC-050", "CSC-051"},
    "citrix":               {"CSC-036"},
    # New vendors — added from compliance-data.json analysis
    "dell":                 {"CSC-001"},
    "stmicro":              {"CSC-002", "CSC-034"},
    "secure-ic":            {"CSC-002", "CSC-034"},
    "xiphera":              {"CSC-002", "CSC-034"},
    "cryptonext":           {"CSC-001", "CSC-016"},
    "quantum bridge":       {"CSC-030"},
    "best pqc":             {"CSC-034", "CSC-052"},
    "thales tct":           {"CSC-002"},  # Thales Trusted Cyber Technologies — Luna T-Series (US gov)
}


# ── Legacy ACVP/CC matching rules ────────────────────────────────────────
#
# CC matching uses vendor-level rules (kept for backward compatibility).
# ACVP matching now uses VENDOR_CATEGORY_RULES above.

def _v(keyword):
    """Shorthand: vendor-only match."""
    return lambda v, p: keyword in v.lower()

def _vp(vk, pk):
    """Shorthand: vendor + product keyword match."""
    return lambda v, p: vk in v.lower() and pk in p.lower()

ACVP_CC_RULES: list[tuple[str, object]] = [
    # Bouncy Castle
    ("Bouncy Castle Java", _vp("bouncy castle", "java")),
    ("Bouncy Castle Java LTS", _vp("bouncy castle", "java")),
    ("Bouncy Castle C# .NET", _v("bouncy castle")),
    # AWS
    ("AWS-LC", _vp("amazon", "aws-lc")),
    ("AWS Application Load Balancer (ALB)", _vp("amazon", "aws-lc")),
    ("AWS CloudHSM", _vp("amazon", "aws-lc")),
    ("AWS Identity and Access Management (IAM)", _vp("amazon", "aws-lc")),
    ("AWS KMS", _vp("amazon", "aws-lc")),
    ("AWS KMS (Cloud Gateway)", _vp("amazon", "aws-lc")),
    ("AWS s2n-tls", _vp("amazon", "aws-lc")),
    # Google
    ("Google Chrome", _v("google")),
    ("Google Cloud HSM", _v("google")),
    ("Google Cloud KMS", _v("google")),
    ("Google Cloud KMS (Cloud Gateway)", _v("google")),
    ("Google ALTS", _v("google")),
    ("Google OpenTitan", _v("google")),
    ("Google Tink", _v("google")),
    ("Gmail / Google Workspace", _v("google")),
    ("Android 16", _v("google")),
    ("BoringSSL", _v("google")),
    ("Go stdlib crypto/mlkem", _v("google")),
    # Thales — product-specific CC matching (avoid over-broad vendor-only rule)
    ("Thales Luna HSM", _vp("thales", "luna")),
    ("Thales Luna T-Series HSM", _vp("thales", "luna")),
    ("Thales MultiApp 5.2 Premium PQC", lambda v, p: "thales" in v.lower() and "multiapp" in p.lower()),
    ("Thales 5G Quantum-Safe SIM", lambda v, p: "thales" in v.lower() and ("quantum ias" in p.lower() or "moc server" in p.lower())),
    ("Thales High Speed Encryptor (HSE)", lambda v, p: "thales" in v.lower() and ("trusted security filter" in p.lower() or " tsf " in p.lower())),
    # Apple
    ("Apple PQ3 / CoreCrypto", _vp("apple", "corecrypto")),
    ("Apple Safari", _v("apple")),
    ("Apple codesign", _v("apple")),
    ("iOS 26 / macOS 26", _v("apple")),
    ("FileVault (macOS)", _v("apple")),
    # Cisco
    ("Cisco ASA (Adaptive Security Appliance)", _v("cisco")),
    ("Cisco IOS XE PQC", _v("cisco")),
    ("Cisco Meraki MX (Cloud-Managed Firewall)", _v("cisco")),
    ("Cisco Secure Client (AnyConnect)", _v("cisco")),
    # Oracle
    ("Oracle AI Database 26ai", _v("oracle")),
    ("Oracle Key Vault", _v("oracle")),
    # IBM
    ("IBM Guardium Key Lifecycle Manager", _v("ibm")),
    ("IBM Guardium Quantum Safe", _v("ibm")),
    ("IBM Quantum Safe Toolkit", _v("ibm")),
    ("IBM Security Guardium Data Protection", _v("ibm")),
    ("IBM Cloud HSM (Utimaco)", lambda v, p: "utimaco" in v.lower() or "ibm" in v.lower()),
    # Entrust
    ("Entrust nShield", _v("entrust")),
    ("Entrust KeyControl", _v("entrust")),
    ("Entrust PKI", _v("entrust")),
    # Utimaco
    ("Utimaco ESKM", _v("utimaco")),
    ("Utimaco SecurityServer", _v("utimaco")),
    # Samsung
    ("Samsung S3SSE2A eSE", _vp("samsung", "s3sse2a")),
    ("Samsung Knox Quantum-Safe", _v("samsung")),
    ("Samsung Networks 5G Core", _v("samsung")),
    # Securosys
    ("Securosys Primus HSM", _v("securosys")),
    ("Securosys CloudHSM", _v("securosys")),
    # Futurex
    ("Futurex Vectera Plus", _v("futurex")),
    ("Futurex CryptoHub", _v("futurex")),
    ("Futurex Cloud", _v("futurex")),
    # Intel
    ("Intel Platform Trust Technology (PTT)", _v("intel")),
    ("Intel TDX (Trust Domain Extensions)", _v("intel")),
    # Marvell
    ("Marvell LiquidSecurity 2", _v("marvell")),
    ("Azure Dedicated HSM (Marvell LiquidSecurity)", _v("marvell")),
    # NXP
    ("NXP JCOP 4.5 P71D600", _v("nxp")),
    ("NXP SE051 Secure Element", _v("nxp")),
    # STMicroelectronics — TPM and cryptographic library CC certs
    ("STMicroelectronics ST33KTPM", lambda v, p: "stmicro" in resolve_cert_vendor(v) and
        any(k in p.lower() for k in ("st33", "stsafe", "neslib"))),
    # I4P — Trident HSM CC certs
    ("I4P Trident HSM", lambda v, p: "i4p" in v.lower() and "trident" in p.lower()),
    # IDEMIA
    ("IDEMIA Digital Identity Platform", _v("idemia")),
    ("IDEMIA PQC Secure Element", _v("idemia")),
    # OpenSSL
    ("OpenSSL", _v("openssl")),
    # Crypto4A
    ("Crypto4A QxHSM", _v("crypto4a")),
    # Fortanix
    ("Fortanix Data Security Manager", _v("fortanix")),
    # SafeLogic
    ("SafeLogic CryptoComply", _v("safelogic")),
    # PQShield
    ("PQShield PQSDK", _v("pqshield")),
    ("PQCryptoLib-Core", _vp("pqshield", "pqcryptolib")),
    ("PQMicroLib-Core", _vp("pqshield", "pqmicrolib")),
    # Check Point
    ("Check Point Quantum", _vp("check point", "quantum")),
    # wolfSSL
    ("wolfSSL", _v("wolfssl")),
    ("wolfBoot", _v("wolfssl")),
    # Microsoft
    ("Microsoft SymCrypt", _v("microsoft")),
    ("Microsoft AD CS", _v("microsoft")),
    ("Microsoft Entra ID", _v("microsoft")),
    ("Microsoft Entra Verified ID", _v("microsoft")),
    ("Microsoft SignTool", _v("microsoft")),
    (".NET System.Security.Cryptography", _v("microsoft")),
    ("Windows Server 2025", _v("microsoft")),
    ("BitLocker (Windows)", _v("microsoft")),
    ("SQL Server TDE/Always Encrypted", _v("microsoft")),
    ("Azure Key Vault", _v("microsoft")),
    ("Azure DevOps", _v("microsoft")),
    # Fortinet
    ("Fortinet FortiOS", _v("fortinet")),
    ("Fortinet FortiGate (FortiOS)", _v("fortinet")),
    # Palo Alto
    ("Palo Alto PAN-OS", _v("palo alto")),
    ("Palo Alto GlobalProtect", _v("palo alto")),
    # Juniper
    ("Juniper Junos OS", _v("juniper")),
    ("Juniper SRX Series Firewalls", _v("juniper")),
    # F5
    ("F5 BIG-IP", _v("f5")),
    # DigiCert
    ("DigiCert SigningHub", _v("digicert")),
    ("DigiCert Software Trust Manager", _v("digicert")),
    ("DigiCert Trust Lifecycle Manager", _v("digicert")),
    # Yubico
    ("Yubico YubiHSM 2", _v("yubico")),
    # Wind River
    ("Wind River VxWorks", _v("wind river")),
    # SAP
    ("SAP Cryptographic Library", _v("sap")),
    # SUSE
    ("SUSE Linux Enterprise Server (SLES)", _v("suse")),
    # Senetas
    ("Senetas CN7000 Series", _v("senetas")),
    # Okta
    ("Okta Workforce Identity", _v("okta")),
    ("Okta Integration Network", _v("okta")),
    # Canonical
    ("Ubuntu 24.04 LTS", _v("canonical")),
    # Arista
    ("Arista EOS (Extensible Operating System)", _v("arista")),
    # Red Hat
    ("Red Hat Enterprise Linux 9", _v("red hat")),
    # IDEMIA
    ("IDEMIA PQC Secure Element", _v("idemia")),
    # Citrix
    ("Citrix Virtual Apps and Desktops", _v("citrix")),
]


def main():
    if not COMPLIANCE_JSON.exists():
        print(f"ERROR: {COMPLIANCE_JSON} not found. Run npm run build first.", file=sys.stderr)
        sys.exit(1)

    # Load ALL compliance records
    all_records = json.loads(COMPLIANCE_JSON.read_text(encoding="utf-8"))
    print(f"Loaded {len(all_records)} total records from compliance-data.json")

    # Separate by type
    fips_records = [r for r in all_records if r.get("type") == "FIPS 140-3"]
    acvp_pqc = [r for r in all_records if r.get("type") == "ACVP" and is_pqc_relevant(r)]
    cc_pqc = [r for r in all_records if r.get("type") == "Common Criteria" and is_pqc_relevant(r)]

    print(f"  FIPS 140-3: {len(fips_records)} | ACVP (PQC): {len(acvp_pqc)} | CC (PQC): {len(cc_pqc)}")

    # ── Classify FIPS certs ──────────────────────────────────────────────
    for rec in fips_records:
        rec["_csc"] = classify_fips_product(rec.get("productName", ""), rec.get("vendor", ""))
        rec["_vendor_norm"] = resolve_cert_vendor(rec.get("vendor", ""))

    # Build index: (vendor_norm, csc_category) → [records]
    fips_index: dict[tuple[str, str], list[dict]] = defaultdict(list)
    cert_csc_lookup: dict[str, str] = {}  # cert_id → csc_category
    for rec in fips_records:
        fips_index[(rec["_vendor_norm"], rec["_csc"])].append(rec)
        cert_csc_lookup[str(rec.get("id", ""))] = rec["_csc"]

    # Print classification summary
    csc_counts: dict[str, int] = defaultdict(int)
    for rec in fips_records:
        csc_counts[rec["_csc"]] += 1
    print("\n── FIPS Cert Classification ──")
    for csc, count in sorted(csc_counts.items()):
        print(f"  {csc}: {count}")

    # ── Load migrate catalog ─────────────────────────────────────────────
    migrate_csvs = sorted(MIGRATE_DIR.glob("pqc_product_catalog_*.csv"))
    if not migrate_csvs:
        # Fallback to old naming
        migrate_csvs = sorted(MIGRATE_DIR.glob("quantum_safe_cryptographic_software_reference_*.csv"))
    if not migrate_csvs:
        print("ERROR: No migrate CSV found in src/data/", file=sys.stderr)
        sys.exit(1)

    latest_csv = migrate_csvs[-1]
    print(f"\nUsing migrate catalog: {latest_csv.name}")

    catalog: dict[str, dict] = {}
    with open(latest_csv, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            catalog[row["software_name"]] = row

    migrate_products = set(catalog.keys())
    print(f"Migrate catalog has {len(migrate_products)} products")

    # ── FIPS matching: category-aware ────────────────────────────────────
    fips_matches: list[dict] = []
    fips_matched_products: set[str] = set()

    for sw_name, row in catalog.items():
        if sw_name in SKIP_FIPS:
            continue

        product_cat = row.get("category_id", "").strip()
        if not product_cat:
            continue

        product_vendor = extract_vendor_from_product(sw_name)

        # Determine compatible cert categories
        compat_cats = CATEGORY_COMPAT.get(product_cat, {"CSC-001"})

        # Find matching FIPS certs: vendor + category + relevance filter
        product_fips: list[dict] = []
        for cert_cat in compat_cats:
            key = (product_vendor, cert_cat)
            for rec in fips_index.get(key, []):
                cert_product = rec.get("productName", "")
                if not _is_relevant_fips_cert(sw_name, product_cat, cert_product):
                    continue
                product_fips.append(make_xref_entry(sw_name, rec))

        # Also check override rules
        if sw_name in OVERRIDE_RULES:
            for override_vendor, override_cats in OVERRIDE_RULES[sw_name]:
                override_vendor_norm = resolve_cert_vendor(override_vendor) if override_vendor != resolve_cert_vendor(override_vendor) else override_vendor
                for cert_cat in override_cats:
                    key = (override_vendor_norm, cert_cat)
                    for rec in fips_index.get(key, []):
                        entry = make_xref_entry(sw_name, rec)
                        # Avoid duplicates
                        if not any(e["cert_id"] == entry["cert_id"] for e in product_fips):
                            product_fips.append(entry)

        if product_fips:
            # Deduplicate: keep most recent per product family
            deduped = deduplicate_by_family(product_fips)

            # Cap: limit total FIPS certs per product to avoid over-matching
            # for big vendors with many distinct crypto modules.
            # Products with their own specific cert category get higher cap.
            has_specific = compat_cats - {"CSC-001"}
            max_certs = 5 if has_specific else 3
            if len(deduped) > max_certs:
                # Prefer category-specific certs over generic CSC-001.
                specific_cats = compat_cats - {"CSC-001"}

                def _cap_sort_key(e):
                    csc = cert_csc_lookup.get(str(e["cert_id"]), "CSC-001")
                    priority = 0 if csc in specific_cats else 1
                    # Negate date for descending: "2026-01-01" → invert chars
                    date = e.get("cert_date", "")
                    return (priority, [-ord(c) for c in date])

                deduped.sort(key=_cap_sort_key)
                deduped = deduped[:max_certs]

            fips_matches.extend(deduped)
            fips_matched_products.add(sw_name)

    # ── ACVP matching: vendor + category aware ───────────────────────────
    # Build index: canonical_vendor_key → [acvp_records]
    acvp_by_vendor: dict[str, list[dict]] = defaultdict(list)
    for rec in acvp_pqc:
        raw_vendor = rec.get("vendor", "")
        # Skip test labs
        norm = normalize_vendor(raw_vendor)
        if any(lab in norm for lab in ACVP_TEST_LABS):
            continue
        canonical = resolve_cert_vendor(raw_vendor)
        acvp_by_vendor[canonical].append(rec)

    acvp_matches: list[dict] = []
    acvp_cc_matched: set[str] = set()

    for sw_name, row in catalog.items():
        product_cat = row.get("category_id", "").strip()
        if not product_cat:
            continue
        product_vendor = extract_vendor_from_product(sw_name)
        allowed_cats = VENDOR_CATEGORY_RULES.get(product_vendor)
        if not allowed_cats or product_cat not in allowed_cats:
            continue
        for rec in acvp_by_vendor.get(product_vendor, []):
            acvp_matches.append(make_xref_entry(sw_name, rec))
            acvp_cc_matched.add(sw_name)

    # ── CC matching: vendor-level (unchanged) ────────────────────────────
    cc_matches: list[dict] = []
    cc_rules_dict = {name: fn for name, fn in ACVP_CC_RULES}

    for sw_name, match_fn in ACVP_CC_RULES:
        if sw_name not in migrate_products:
            continue
        for rec in cc_pqc:
            vendor = rec.get("vendor", "")
            product = rec.get("productName", "")
            if match_fn(vendor, product):
                cc_matches.append(make_xref_entry(sw_name, rec))
                acvp_cc_matched.add(sw_name)

    # Deduplicate ACVP build variants
    acvp_deduped = deduplicate_acvp(acvp_matches)

    all_matches = acvp_deduped + cc_matches + fips_matches
    matched_products = fips_matched_products | acvp_cc_matched

    print(f"\nMatched {len(matched_products)} products:")
    print(f"  ACVP: {len(acvp_deduped)} | CC: {len(cc_matches)} | FIPS: {len(fips_matches)}")
    print(f"  Total xref entries: {len(all_matches)}")

    # Sort
    all_matches.sort(key=lambda m: (m["software_name"], m["cert_type"], m["cert_date"]))

    # Write xref CSV
    with open(OUTPUT, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=XREF_COLUMNS, lineterminator="\n")
        writer.writeheader()
        writer.writerows(all_matches)

    print(f"\nWrote {OUTPUT.name} with {len(all_matches)} rows")

    # ── Product summary ──────────────────────────────────────────────────
    print("\n── Product Certification Summary ──")
    for sw in sorted(matched_products):
        product_matches = [m for m in all_matches if m["software_name"] == sw]
        by_type = {}
        for m in product_matches:
            by_type.setdefault(m["cert_type"], []).append(m)

        parts = []
        for ct in ["FIPS 140-3", "ACVP", "Common Criteria"]:
            if ct in by_type:
                parts.append(f"{len(by_type[ct])} {ct}")
        pqc_algos = set()
        for m in product_matches:
            if m["pqc_algorithms"] and m["pqc_algorithms"] != "No PQC Mechanisms Detected":
                pqc_algos.update(a.strip() for a in m["pqc_algorithms"].split(","))
        algos_str = f" — PQC: {', '.join(sorted(pqc_algos))}" if pqc_algos else ""
        print(f"  {sw}: {' | '.join(parts)}{algos_str}")

    # ── FIPS category alignment report ───────────────────────────────────
    print("\n── FIPS Category Alignment ──")
    fips_by_product: dict[str, list[dict]] = defaultdict(list)
    for m in fips_matches:
        fips_by_product[m["software_name"]].append(m)

    for sw in sorted(fips_by_product.keys()):
        cat_id = catalog.get(sw, {}).get("category_id", "?")
        cat_name = catalog.get(sw, {}).get("category_name", "?")
        certs = fips_by_product[sw]
        cert_products = [c["cert_product"][:50] for c in certs]
        print(f"  {sw:50s} | {cat_id} {cat_name[:30]:30s} | {len(certs)} certs: {'; '.join(cert_products[:3])}")
        if len(cert_products) > 3:
            print(f"  {'':50s} | {'':38s} | ... and {len(cert_products)-3} more")

    # ── Vendor consolidation ─────────────────────────────────────────────
    vendor_counts = compute_vendor_counts(all_records)

    with open(VENDOR_COUNTS_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(vendor_counts, f, indent=2)

    print(f"\n── Vendor Consolidation ({len(vendor_counts)} vendors) ──")
    for vc in vendor_counts[:20]:
        print(f"  {vc['vendor'][:45]:45s}  FIPS: {vc['fips']:3d}  ACVP: {vc['acvp']:3d}  CC: {vc['cc']:3d}  Total: {vc['total']:3d}")
    if len(vendor_counts) > 20:
        print(f"  ... and {len(vendor_counts) - 20} more vendors")

    print(f"\nWrote vendor-cert-counts.json with {len(vendor_counts)} vendors")

    # Products with no matches
    unmatched = migrate_products - matched_products
    print(f"\n{len(unmatched)} products without certification matches")


if __name__ == "__main__":
    main()
