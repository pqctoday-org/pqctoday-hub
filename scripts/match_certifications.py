#!/usr/bin/env python3
"""
Cross-reference migrate software catalog with certifications from compliance-data.json.

Reads:
  - public/data/compliance-data.json (scraped FIPS/ACVP/CC certifications)
  - src/data/quantum_safe_cryptographic_software_reference_*.csv (migrate catalog)

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
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
COMPLIANCE_JSON = ROOT / "public" / "data" / "compliance-data.json"
MIGRATE_DIR = ROOT / "src" / "data"
TODAY = datetime.now().strftime("%m%d%Y")
OUTPUT = MIGRATE_DIR / f"migrate_certification_xref_{TODAY}.csv"
VENDOR_COUNTS_OUTPUT = ROOT / "public" / "data" / "vendor-cert-counts.json"

# ── Product-to-cert matching rules ──────────────────────────────────────
#
# Each rule: (migrate_product_name, acvp_cc_match_fn, fips_product_keywords)
#
# acvp_cc_match_fn(vendor, productName) → bool
#   Used for ACVP and CC records (PQC algorithm-level validation, vendor-wide)
#
# fips_product_keywords: list[str]
#   Keywords that must appear in the FIPS cert's productName (case-insensitive).
#   ANY keyword matching = a hit. This ensures product-specific FIPS matching.
#   Empty list [] = no FIPS matching for this product.

def _v(keyword):
    """Shorthand: vendor-only match."""
    return lambda v, p: keyword in v.lower()

def _vp(vk, pk):
    """Shorthand: vendor + product keyword match."""
    return lambda v, p: vk in v.lower() and pk in p.lower()

MATCH_RULES = [
    # ── Bouncy Castle ────────────────────────────────────────────────────
    ("Bouncy Castle Java", _vp("bouncy castle", "java"), ["bouncy castle"]),
    ("Bouncy Castle Java LTS", _vp("bouncy castle", "java"), ["bouncy castle"]),
    ("Bouncy Castle C# .NET", _v("bouncy castle"), ["bouncy castle"]),
    # ── AWS (AWS-LC crypto module) ───────────────────────────────────────
    ("AWS-LC", _vp("amazon", "aws-lc"), ["aws-lc"]),
    ("AWS Application Load Balancer (ALB)", _vp("amazon", "aws-lc"), ["aws-lc"]),
    ("AWS CloudHSM", _vp("amazon", "aws-lc"), ["aws-lc", "key management"]),
    ("AWS Identity and Access Management (IAM)", _vp("amazon", "aws-lc"), ["aws-lc"]),
    ("AWS KMS", _vp("amazon", "aws-lc"), ["aws-lc", "key management"]),
    ("AWS KMS (Cloud Gateway)", _vp("amazon", "aws-lc"), ["aws-lc", "key management"]),
    ("AWS s2n-tls", _vp("amazon", "aws-lc"), ["aws-lc"]),
    # ── Google (BoringCrypto module) ─────────────────────────────────────
    ("Google Chrome", _v("google"), ["boringcrypto"]),
    ("Google Cloud HSM", _v("google"), ["boringcrypto"]),
    ("Google Cloud KMS", _v("google"), ["boringcrypto"]),
    ("Google Cloud KMS (Cloud Gateway)", _v("google"), ["boringcrypto"]),
    ("Google ALTS", _v("google"), ["boringcrypto"]),
    ("Google OpenTitan", _v("google"), ["boringcrypto", "opensk"]),
    ("Google Tink", _v("google"), ["boringcrypto"]),
    ("Google Workspace Identity", _v("google"), ["boringcrypto"]),
    ("Gmail / Google Workspace", _v("google"), ["boringcrypto"]),
    ("Android 16", _v("google"), ["boringcrypto"]),
    # ── Thales (product-specific FIPS modules) ───────────────────────────
    ("Thales Luna HSM", _vp("thales", "luna"), ["luna k7"]),
    ("Thales Luna T-Series HSM", _vp("thales", "luna"), ["luna"]),
    ("Thales Luna Cloud HSM (DPoD)", _v("thales"), ["luna g7", "luna"]),
    ("Thales CipherTrust Manager", _v("thales"), ["ciphertrust"]),
    ("Thales CipherTrust Cloud Key Manager", _v("thales"), ["ciphertrust"]),
    ("Thales CipherTrust Data Security Platform", _v("thales"), ["ciphertrust"]),
    ("Thales CipherTrust Data Discovery and Classification", _v("thales"), ["ciphertrust"]),
    ("Thales High Speed Encryptor (HSE)", _v("thales"), ["cn series", "encryptor"]),
    ("Thales MISTRAL Encryptor", _v("thales"), ["cn series", "encryptor", "ce crypto"]),
    ("Thales payShield 10K", _v("thales"), ["payshield"]),
    ("Thales 5G Quantum-Safe SIM", _v("thales"), ["idcore", "safeword"]),
    ("Thales MultiApp 5.2 Premium PQC", _v("thales"), ["idcore"]),
    # ── Apple (corecrypto module) ────────────────────────────────────────
    ("Apple PQ3 / CoreCrypto", _vp("apple", "corecrypto"), ["corecrypto"]),
    ("Apple Safari", _v("apple"), ["corecrypto"]),
    ("Apple codesign", _v("apple"), ["corecrypto"]),
    # ── Cisco (product-specific FIPS modules) ────────────────────────────
    ("Cisco ASA (Adaptive Security Appliance)", _v("cisco"), ["adaptive security"]),
    ("Cisco IOS XE PQC", _v("cisco"), ["fips provider", "ios"]),
    ("Cisco Meraki MX (Cloud-Managed Firewall)", _v("cisco"), ["fips provider"]),
    ("Cisco Secure Client (AnyConnect)", _v("cisco"), ["fips provider", "anyconnect", "secure client"]),
    # ── Oracle (Oracle Linux crypto modules) ─────────────────────────────
    ("Oracle AI Database 26ai", _v("oracle"), ["oracle linux", "oracle database"]),
    ("Oracle Key Vault", _v("oracle"), ["oracle linux"]),
    ("Oracle TDE", _v("oracle"), ["oracle linux"]),
    # ── IBM ──────────────────────────────────────────────────────────────
    ("IBM Guardium Key Lifecycle Manager", _v("ibm"), ["ibm"]),
    ("IBM Guardium Quantum Safe", _v("ibm"), ["ibm"]),
    ("IBM Quantum Safe Toolkit", _v("ibm"), ["ibm"]),
    ("IBM Security Guardium Data Protection", _v("ibm"), ["ibm"]),
    ("IBM Cloud HSM (Utimaco)", lambda v, p: "utimaco" in v.lower() or "ibm" in v.lower(), ["utimaco", "cryptoserver"]),
    # ── Entrust (nShield FIPS modules) ───────────────────────────────────
    ("Entrust nShield", _v("entrust"), ["nshield"]),
    ("Entrust KeyControl", _v("entrust"), ["nshield"]),
    ("Entrust PKI", _v("entrust"), ["nshield"]),
    ("Entrust Signing Automation", _v("entrust"), ["nshield"]),
    # ── Utimaco ──────────────────────────────────────────────────────────
    ("Utimaco ESKM", _v("utimaco"), ["cryptoserver"]),
    ("Utimaco SecurityServer", _v("utimaco"), ["cryptoserver"]),
    ("Utimaco Athos", _v("utimaco"), ["atalla", "cryptoserver"]),
    # ── Samsung ──────────────────────────────────────────────────────────
    ("Samsung S3SSE2A eSE", _vp("samsung", "s3sse2a"), []),
    ("Samsung Knox Quantum-Safe", _v("samsung"), ["boringcrypto android"]),
    ("Samsung Networks 5G Core", _v("samsung"), ["boringcrypto android"]),
    # ── Securosys ────────────────────────────────────────────────────────
    ("Securosys Primus HSM", _v("securosys"), ["securosys"]),
    ("Securosys CloudHSM", _v("securosys"), ["securosys"]),
    # ── Futurex ──────────────────────────────────────────────────────────
    ("Futurex Vectera Plus", _v("futurex"), ["futurex"]),
    ("Futurex CryptoHub", _v("futurex"), ["futurex"]),
    ("Futurex Cloud", _v("futurex"), ["futurex"]),
    # ── Intel ────────────────────────────────────────────────────────────
    ("Intel Platform Trust Technology (PTT)", _v("intel"), ["intel"]),
    ("Intel TDX (Trust Domain Extensions)", _v("intel"), ["intel"]),
    # ── Marvell (includes Azure Dedicated HSM) ───────────────────────────
    ("Marvell LiquidSecurity 2", _v("marvell"), ["marvell", "liquidsecurity", "nitrox"]),
    ("Azure Dedicated HSM (Marvell LiquidSecurity)", _v("marvell"), ["marvell", "liquidsecurity", "nitrox"]),
    # ── NXP ──────────────────────────────────────────────────────────────
    ("NXP JCOP 4.5 P71D600", _v("nxp"), ["jcop", "p71"]),
    ("NXP SE050 Secure Element", _v("nxp"), ["se05"]),
    # ── IDEMIA ───────────────────────────────────────────────────────────
    ("IDEMIA Digital Identity Platform", _v("idemia"), ["id-one", "rookyse"]),
    ("IDEMIA PQC Secure Element", _v("idemia"), ["id-one", "rookyse"]),
    # ── OpenSSL ──────────────────────────────────────────────────────────
    ("OpenSSL", _v("openssl"), ["openssl"]),
    ("OQS-OpenSSL Provider (liboqs-provider)", _v("openssl"), ["openssl"]),
    # ── Crypto4A ─────────────────────────────────────────────────────────
    ("Crypto4A QxHSM", _v("crypto4a"), ["crypto4a"]),
    # ── Fortanix ─────────────────────────────────────────────────────────
    ("Fortanix Data Security Manager", _v("fortanix"), ["fortanix"]),
    # ── STMicroelectronics ───────────────────────────────────────────────
    ("STMicroelectronics ST33G1M2 TPM", _v("stmicro"), ["stmicro"]),
    # ── SafeLogic ────────────────────────────────────────────────────────
    ("SafeLogic CryptoComply", _v("safelogic"), ["cryptocomply"]),
    # ── CryptoNext Security ──────────────────────────────────────────────
    ("CryptoNext COMPASS Network Probe", _v("cryptonext"), ["cryptonext"]),
    # ── Arista ───────────────────────────────────────────────────────────
    ("Arista EOS (Extensible Operating System)", _v("arista"), ["arista"]),
    # ── BlackBerry ───────────────────────────────────────────────────────
    ("BlackBerry QNX Neutrino RTOS", _v("blackberry"), ["blackberry"]),
    # ── Citrix ───────────────────────────────────────────────────────────
    ("Citrix Virtual Apps and Desktops", _v("citrix"), ["citrix"]),
    # ── Red Hat ──────────────────────────────────────────────────────────
    ("Red Hat Enterprise Linux 9", _v("red hat"), ["red hat enterprise linux 9"]),
    # ── PQShield ─────────────────────────────────────────────────────────
    ("PQShield PQSDK", _v("pqshield"), ["pqshield"]),
    # ── Check Point ──────────────────────────────────────────────────────
    ("Check Point Quantum", _vp("check point", "quantum"), ["check point"]),
    # ── wolfSSL ──────────────────────────────────────────────────────────
    ("wolfSSL", _v("wolfssl"), ["wolfssl", "wolfcrypt"]),
    # ── SEALSQ (placeholder — no cert match) ─────────────────────────────
    ("SEALSQ Quantum Shield", lambda v, p: False, []),
]

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


def load_all_records(path: Path) -> list[dict]:
    """Load all records from compliance-data.json."""
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def is_pqc_relevant(record: dict) -> bool:
    """Check if a record has PQC algorithm coverage."""
    cov = record.get("pqcCoverage")
    return bool(cov and cov not in (False, "false", "No PQC Mechanisms Detected"))


def normalize_product_family(product_name: str) -> str:
    """Extract product family from full product name (strip build variants)."""
    base = re.sub(r"\s*\((?:static|dynamic)\s+build\).*", "", product_name)
    base = re.sub(r"\s*\([a-z_]+\)\s*$", "", base, flags=re.IGNORECASE)
    return base.strip()


def fips_keyword_match(product_name: str, keywords: list[str]) -> bool:
    """Check if any FIPS keyword appears in the cert product name."""
    pn = product_name.lower()
    return any(kw in pn for kw in keywords)


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


def compute_vendor_counts(all_records: list[dict]) -> dict:
    """Compute cert counts per vendor, grouped by cert type."""
    # Normalize vendor names → canonical vendor key
    vendor_counts: dict[str, dict[str, int]] = {}
    for r in all_records:
        vendor = r.get("vendor", "Unknown")
        cert_type = r.get("type", "Unknown")

        if vendor not in vendor_counts:
            vendor_counts[vendor] = {"FIPS 140-3": 0, "ACVP": 0, "Common Criteria": 0}
        if cert_type in vendor_counts[vendor]:
            vendor_counts[vendor][cert_type] += 1

    # Filter to vendors with at least 1 cert, sort by total desc
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


def main():
    if not COMPLIANCE_JSON.exists():
        print(f"ERROR: {COMPLIANCE_JSON} not found. Run npm run build first.", file=sys.stderr)
        sys.exit(1)

    # Load ALL compliance records
    all_records = load_all_records(COMPLIANCE_JSON)
    print(f"Loaded {len(all_records)} total records from compliance-data.json")

    # Separate by type
    fips_records = [r for r in all_records if r.get("type") == "FIPS 140-3"]
    acvp_pqc = [r for r in all_records if r.get("type") == "ACVP" and is_pqc_relevant(r)]
    cc_pqc = [r for r in all_records if r.get("type") == "Common Criteria" and is_pqc_relevant(r)]

    print(f"  FIPS 140-3: {len(fips_records)} | ACVP (PQC): {len(acvp_pqc)} | CC (PQC): {len(cc_pqc)}")

    # Find latest migrate CSV
    migrate_csvs = sorted(MIGRATE_DIR.glob("quantum_safe_cryptographic_software_reference_*.csv"))
    if not migrate_csvs:
        print("ERROR: No migrate CSV found in src/data/", file=sys.stderr)
        sys.exit(1)

    latest_csv = migrate_csvs[-1]
    print(f"Using migrate catalog: {latest_csv.name}")

    with open(latest_csv, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        migrate_products = {row["software_name"] for row in reader}

    print(f"Migrate catalog has {len(migrate_products)} products")

    # ── Match: product-specific ──────────────────────────────────────────
    acvp_matches = []
    cc_matches = []
    fips_matches = []
    matched_products = set()

    for sw_name, acvp_cc_fn, fips_keywords in MATCH_RULES:
        if sw_name not in migrate_products:
            continue

        # ACVP: vendor-level match (PQC algorithm validation)
        for rec in acvp_pqc:
            vendor = rec.get("vendor", "")
            product = rec.get("productName", "")
            if acvp_cc_fn(vendor, product):
                acvp_matches.append(make_xref_entry(sw_name, rec))
                matched_products.add(sw_name)

        # CC: vendor-level match (PQC evaluations)
        for rec in cc_pqc:
            vendor = rec.get("vendor", "")
            product = rec.get("productName", "")
            if acvp_cc_fn(vendor, product):
                cc_matches.append(make_xref_entry(sw_name, rec))
                matched_products.add(sw_name)

        # FIPS: product-specific keyword match
        if fips_keywords:
            product_fips = []
            for rec in fips_records:
                vendor = rec.get("vendor", "")
                product = rec.get("productName", "")
                # Must match vendor AND product keywords
                if acvp_cc_fn(vendor, product) and fips_keyword_match(product, fips_keywords):
                    product_fips.append(make_xref_entry(sw_name, rec))

            if product_fips:
                # Keep only the most recent FIPS cert per product family
                families: dict[str, list[dict]] = {}
                for m in product_fips:
                    fam = normalize_product_family(m["cert_product"])
                    families.setdefault(fam, []).append(m)

                for _fam, group in families.items():
                    group.sort(key=lambda x: x["cert_date"], reverse=True)
                    fips_matches.append(group[0])

                matched_products.add(sw_name)

    # Deduplicate ACVP build variants
    acvp_deduped = deduplicate_acvp(acvp_matches)

    all_matches = acvp_deduped + cc_matches + fips_matches

    print(f"\nMatched {len(matched_products)} products:")
    print(f"  ACVP: {len(acvp_deduped)} | CC: {len(cc_matches)} | FIPS: {len(fips_matches)}")
    print(f"  Total xref entries: {len(all_matches)}")

    # Sort by software_name, then cert_type, then cert_date
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
