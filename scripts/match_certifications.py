#!/usr/bin/env python3
"""
Cross-reference migrate software catalog with PQC certifications from compliance-data.json.

Reads:
  - public/data/compliance-data.json (scraped FIPS/ACVP/CC certifications)
  - src/data/quantum_safe_cryptographic_software_reference_*.csv (migrate catalog)

Writes:
  - src/data/migrate_certification_xref_MMDDYYYY.csv

Usage:
  python3 scripts/match_certifications.py
"""

import csv
import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
COMPLIANCE_JSON = ROOT / "public" / "data" / "compliance-data.json"
MIGRATE_DIR = ROOT / "src" / "data"
TODAY = datetime.now().strftime("%m%d%Y")
OUTPUT = MIGRATE_DIR / f"migrate_certification_xref_{TODAY}.csv"

# ── Manual matching rules ────────────────────────────────────────────────
# Each entry: (migrate software_name, match function on compliance record)
# Match function receives (vendor: str, productName: str) → bool

MATCH_RULES = [
    # Bouncy Castle
    (
        "Bouncy Castle Java",
        lambda v, p: "bouncy castle" in v.lower() and "java" in p.lower(),
    ),
    (
        "Bouncy Castle Java LTS",
        lambda v, p: "bouncy castle" in v.lower() and "java" in p.lower(),
    ),
    (
        "Bouncy Castle C# .NET",
        lambda v, p: "bouncy castle" in v.lower(),
    ),
    # AWS-LC
    (
        "AWS-LC",
        lambda v, p: "amazon" in v.lower() and "aws-lc" in p.lower(),
    ),
    # Thales Luna HSM (K7 series only)
    (
        "Thales Luna HSM",
        lambda v, p: "thales" in v.lower() and "luna" in p.lower() and "k7" in p.lower(),
    ),
    # Thales Luna T-Series HSM (T7 series only)
    (
        "Thales Luna T-Series HSM",
        lambda v, p: "thales" in v.lower() and "luna" in p.lower() and "t7" in p.lower(),
    ),
    # Apple PQ3 / CoreCrypto
    (
        "Apple PQ3 / CoreCrypto",
        lambda v, p: "apple" in v.lower() and "corecrypto" in p.lower(),
    ),
    # PQShield PQSDK
    (
        "PQShield PQSDK",
        lambda v, p: "pqshield" in v.lower(),
    ),
    # Check Point Quantum
    (
        "Check Point Quantum",
        lambda v, p: "check point" in v.lower() and "quantum" in p.lower(),
    ),
    # Entrust nShield
    (
        "Entrust nShield",
        lambda v, p: "entrust" in v.lower(),
    ),
    # Entrust KeyControl
    (
        "Entrust KeyControl",
        lambda v, p: "entrust" in v.lower(),
    ),
    # Utimaco ESKM
    (
        "Utimaco ESKM",
        lambda v, p: "utimaco" in v.lower(),
    ),
    # Utimaco SecurityServer
    (
        "Utimaco SecurityServer",
        lambda v, p: "utimaco" in v.lower(),
    ),
    # Samsung S3SSE2A eSE
    (
        "Samsung S3SSE2A eSE",
        lambda v, p: "samsung" in v.lower() and "s3sse2a" in p.lower(),
    ),
    # wolfSSL (FIPS validated)
    (
        "wolfSSL",
        lambda v, p: "wolfssl" in v.lower(),
    ),
    # NXP semiconductors (for potential matches)
    (
        "SEALSQ Quantum Shield",
        lambda v, p: False,  # No direct cert match — placeholder
    ),
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


def load_pqc_records(path: Path) -> list[dict]:
    """Load compliance-data.json and filter to PQC-relevant records only."""
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    pqc = []
    for r in data:
        cov = r.get("pqcCoverage")
        if cov and cov not in (False, "false", "No PQC Mechanisms Detected"):
            pqc.append(r)
    return pqc


def normalize_product_family(product_name: str) -> str:
    """Extract product family from full product name (strip build variants)."""
    # Remove parenthesized build suffixes like "(static build) (C_SHA)"
    base = re.sub(r"\s*\((?:static|dynamic)\s+build\).*", "", product_name)
    # Remove parenthesized variant suffixes like "(vng_hwassist)", "(c_ltc)"
    base = re.sub(r"\s*\([a-z_]+\)\s*$", "", base, flags=re.IGNORECASE)
    return base.strip()


def deduplicate_acvp(matches: list[dict]) -> list[dict]:
    """For ACVP certs with many build variants, keep most recent per product family + algorithm set."""
    acvp = [m for m in matches if m["cert_type"] == "ACVP"]
    non_acvp = [m for m in matches if m["cert_type"] != "ACVP"]

    # Group by (software_name, product_family, pqc_algorithms)
    groups: dict[tuple[str, str, str], list[dict]] = {}
    for m in acvp:
        family = normalize_product_family(m["cert_product"])
        key = (m["software_name"], family, m["pqc_algorithms"])
        groups.setdefault(key, []).append(m)

    deduped = []
    for _key, group in groups.items():
        # Sort by date descending, keep most recent
        group.sort(key=lambda x: x["cert_date"], reverse=True)
        deduped.append(group[0])

    return non_acvp + deduped


def main():
    if not COMPLIANCE_JSON.exists():
        print(f"ERROR: {COMPLIANCE_JSON} not found. Run npm run build first.", file=sys.stderr)
        sys.exit(1)

    # Load PQC certification records
    pqc_records = load_pqc_records(COMPLIANCE_JSON)
    print(f"Loaded {len(pqc_records)} PQC certification records from compliance-data.json")

    # Find latest migrate CSV
    migrate_csvs = sorted(MIGRATE_DIR.glob("quantum_safe_cryptographic_software_reference_*.csv"))
    if not migrate_csvs:
        print("ERROR: No migrate CSV found in src/data/", file=sys.stderr)
        sys.exit(1)

    latest_csv = migrate_csvs[-1]
    print(f"Using migrate catalog: {latest_csv.name}")

    # Read migrate product names for validation
    with open(latest_csv, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        migrate_products = {row["software_name"] for row in reader}

    print(f"Migrate catalog has {len(migrate_products)} products")

    # Match
    matches = []
    matched_products = set()

    for sw_name, match_fn in MATCH_RULES:
        if sw_name not in migrate_products:
            # Skip rules for products not in current catalog
            continue

        for rec in pqc_records:
            vendor = rec.get("vendor", "")
            product = rec.get("productName", "")

            if match_fn(vendor, product):
                pqc_algos = rec.get("pqcCoverage", "")
                if isinstance(pqc_algos, bool):
                    pqc_algos = ""

                matches.append(
                    {
                        "software_name": sw_name,
                        "cert_type": rec.get("type", ""),
                        "cert_id": rec.get("id", ""),
                        "cert_vendor": vendor,
                        "cert_product": product,
                        "pqc_algorithms": pqc_algos,
                        "certification_level": rec.get("certificationLevel", ""),
                        "status": rec.get("status", ""),
                        "cert_date": rec.get("date", ""),
                        "cert_link": rec.get("link", ""),
                    }
                )
                matched_products.add(sw_name)

    print(f"\nFound {len(matches)} raw matches for {len(matched_products)} products")

    # Deduplicate ACVP build variants
    matches = deduplicate_acvp(matches)
    print(f"After ACVP deduplication: {len(matches)} cross-reference entries")

    # Sort by software_name, then cert_type, then cert_date
    matches.sort(key=lambda m: (m["software_name"], m["cert_type"], m["cert_date"]))

    # Write CSV
    with open(OUTPUT, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=XREF_COLUMNS, lineterminator="\n")
        writer.writeheader()
        writer.writerows(matches)

    print(f"\nWrote {OUTPUT.name} with {len(matches)} rows")

    # Summary by product
    print("\n── Match Summary ──")
    for sw in sorted(matched_products):
        product_matches = [m for m in matches if m["software_name"] == sw]
        types = set(m["cert_type"] for m in product_matches)
        algos = set()
        for m in product_matches:
            if m["pqc_algorithms"]:
                algos.update(a.strip() for a in m["pqc_algorithms"].split(","))
        print(f"  {sw}: {len(product_matches)} certs ({', '.join(sorted(types))}) — {', '.join(sorted(algos))}")

    # Products with no matches
    unmatched = migrate_products - matched_products
    print(f"\n{len(unmatched)} products without PQC certification matches")


if __name__ == "__main__":
    main()
