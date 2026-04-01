#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-only
"""
Generate GLEIF LEI data for the PQC vendor catalog.

Always stores the ULTIMATE PARENT LEI (top of corporate hierarchy) to collapse
subsidiaries under a single canonical company identifier. For example,
"Amazon Web Services Inc." resolves to Amazon.com Inc.'s LEI.

Reads:  src/data/vendors_*.csv  (latest by filename date sort)
Writes: src/data/vendors_MMDDYYYY.csv  (with lei_* columns populated)

Usage:
  python3 scripts/generate-lei-xref.py
  python3 scripts/generate-lei-xref.py --dry-run
  python3 scripts/generate-lei-xref.py --limit 20
"""

import argparse
import csv
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "src" / "data"
TODAY = datetime.now().strftime("%m%d%Y")
TODAY_ISO = datetime.now().strftime("%Y-%m-%d")
OUTPUT = DATA_DIR / f"vendors_{TODAY}.csv"

GLEIF_API = "https://api.gleif.org/api/v1"
# GLEIF public API: 60 req/min → 1100ms to be safe
DELAY_MS = 1100

# Entity categories to skip (no LEI expected)
SKIP_CATEGORIES = {
    "Open Source Community",
    "Open Source Foundation",
    "Government / Standards Body",
    "Research Project",
    "Blockchain Protocol",
}

VENDOR_CSV_COLUMNS = [
    "vendor_id", "vendor_name", "vendor_display_name", "website",
    "vendor_type", "entity_category", "hq_country", "pqc_commitment",
    "last_verified_date",
    "lei_code", "lei_legal_name", "lei_entity_status", "gleif_url", "lei_last_verified_date",
]

# ── Vendor normalization ─────────────────────────────────────────────────────

_STRIP_SUFFIXES = re.compile(
    r",?\s*\b(?:inc\.?|llc\.?|ltd\.?|limited|corporation|corp\.?|gmbh|se|ag|co\.?|plc|"
    r"pty|nv|sa|s\.?a\.?|the)\b\.?",
    re.IGNORECASE,
)

def normalize_vendor(name: str) -> str:
    name = _STRIP_SUFFIXES.sub("", name)
    return re.sub(r"\s+", " ", name).strip().lower()


# ── Manual LEI overrides ──────────────────────────────────────────────────────
# Maps vendor_id → known ultimate-parent LEI for vendors where name search
# is ambiguous (large conglomerates, subsidiaries, rebranded companies).
LEI_MANUAL_MAP: dict[str, str] = {
    # IBM Corporation — GLEIF name search returns subsidiary "IBM World Trade Corporation";
    # correct ultimate parent is International Business Machines Corporation (US-NY)
    "VND-019": "VGRQXHF3J8VDLUA7XE92",
    # Siemens AG — GLEIF name search returns pension fund "Siemens Pensionsfonds AG";
    # correct ultimate parent is Siemens Aktiengesellschaft (DE)
    "VND-126": "W38RGI023J3WT1HWRP32",
    # Zodia Custody Ltd. — GLEIF search returns Singapore entity;
    # correct UK parent is Zodia Custody Limited (GB)
    "VND-111": "549300GW5G8DI3A6KT57",
    # R3 Ltd. (blockchain/Corda) — GLEIF search returns unrelated Golub Capital fund;
    # R3 LLC is a private US company not registered in GLEIF → force not_found
    "VND-101": "",
    # Hitachi Ltd. — Japanese parent (日立製作所) not indexed in GLEIF under English name;
    # GLEIF match is a US financial subsidiary → force not_found
    "VND-135": "",
    # Toshiba Corporation — Japanese parent not indexed in GLEIF under English name;
    # GLEIF match is an Australian subsidiary → force not_found
    "VND-158": "",
    # NEC Corporation — Japanese parent (日本電気) not indexed in GLEIF under English name;
    # GLEIF match is an unrelated Indian packaging company → force not_found
    "VND-177": "",
}


# ── GLEIF API ────────────────────────────────────────────────────────────────

def search_lei(vendor_name: str) -> list[dict]:
    """Search GLEIF by legal name. Returns list of lei-record items."""
    params = urllib.parse.urlencode({
        "filter[entity.legalName]": vendor_name,
        "page[size]": 5,
    })
    url = f"{GLEIF_API}/lei-records?{params}"
    req = urllib.request.Request(url)
    req.add_header("Accept", "application/vnd.api+json")
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read())
            return data.get("data", [])
    except Exception as exc:
        print(f"  WARN: GLEIF search failed: {exc}", file=sys.stderr)
        return []


def get_ultimate_parent(lei: str) -> dict | None:
    """
    Walk up the corporate hierarchy to the ultimate accounting consolidation parent.
    Returns the parent record or None if already at the top.
    """
    url = f"{GLEIF_API}/lei-records/{lei}/ultimate-accounting-consolidation-parent"
    req = urllib.request.Request(url)
    req.add_header("Accept", "application/vnd.api+json")
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            if resp.status == 200:
                data = json.loads(resp.read())
                records = data.get("data", [])
                if records:
                    return records[0]
        return None
    except Exception:
        return None


def resolve_ultimate_parent(lei: str) -> dict | None:
    """
    Starting from the given LEI, walk up to the ultimate parent.
    Returns the ultimate parent record (or the current record if already at top).
    Makes at most 5 hops to avoid infinite loops.
    """
    current_lei = lei
    for _ in range(5):
        parent = get_ultimate_parent(current_lei)
        if parent is None:
            break
        parent_attrs = parent.get("attributes", {})
        parent_reg = parent_attrs.get("registration", {})
        if parent_reg.get("status") != "ISSUED":
            break
        current_lei = parent.get("id", current_lei)
        time.sleep(DELAY_MS / 1000)
    return current_lei if current_lei != lei else None


def fetch_lei_record(lei: str) -> dict | None:
    """Fetch a specific LEI record by code."""
    url = f"{GLEIF_API}/lei-records/{lei}"
    req = urllib.request.Request(url)
    req.add_header("Accept", "application/vnd.api+json")
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read())
            records = data.get("data", [])
            return records[0] if records else None
    except Exception:
        return None


# ── Scoring ─────────────────────────────────────────────────────────────────

def score_match(candidate_name: str, search_name: str) -> str:
    """Returns 'exact', 'partial', or ''."""
    cn = normalize_vendor(candidate_name)
    sn = normalize_vendor(search_name)
    if cn == sn:
        return "exact"
    if cn in sn or sn in cn:
        return "partial"
    return ""


# ── CSV loading ──────────────────────────────────────────────────────────────

def find_latest_vendor_csv() -> Path:
    files = sorted(DATA_DIR.glob("vendors_*.csv"))
    if not files:
        raise FileNotFoundError("No vendors_*.csv found in src/data/")
    return files[-1]


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate GLEIF LEI data for vendor catalog")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--limit", type=int, default=0)
    args = parser.parse_args()

    vendor_path = find_latest_vendor_csv()
    print(f"Reading: {vendor_path.name}")

    with open(vendor_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        vendors = list(reader)
        src_fields = list(reader.fieldnames or [])

    if args.limit:
        vendors = vendors[: args.limit]

    total = len(vendors)
    counts = {"matched": 0, "partial": 0, "not_found": 0, "skipped": 0}
    rows: list[dict] = []

    for i, vendor in enumerate(vendors, 1):
        vid = vendor.get("vendor_id", "")
        vname = vendor.get("vendor_name", "")
        category = vendor.get("entity_category", "")
        prefix = f"[{i:>4}/{total}] {vid} {vname[:40]:<40}"

        # Initialize LEI fields from existing CSV (preserve manual entries)
        lei_code = vendor.get("lei_code", "").strip()
        lei_legal_name = vendor.get("lei_legal_name", "").strip()
        lei_entity_status = vendor.get("lei_entity_status", "").strip()
        gleif_url = vendor.get("gleif_url", "").strip()
        lei_last_verified = vendor.get("lei_last_verified_date", "").strip()

        # Skip non-commercial entities
        if category in SKIP_CATEGORIES or vid == "VND-000":
            out_row = dict(vendor)
            out_row.update({
                "lei_code": lei_code,
                "lei_legal_name": lei_legal_name,
                "lei_entity_status": lei_entity_status,
                "gleif_url": gleif_url,
                "lei_last_verified_date": lei_last_verified,
            })
            rows.append(out_row)
            counts["skipped"] += 1
            if args.dry_run:
                print(f"{prefix} → skip ({category})")
            continue

        # Manual override (empty string = force not_found; non-empty = known correct LEI)
        if vid in LEI_MANUAL_MAP:
            forced_lei = LEI_MANUAL_MAP[vid]
            if not forced_lei:
                # Forced not_found — GLEIF has no valid record for this entity
                out_row = dict(vendor)
                out_row.update({"lei_code": "", "lei_legal_name": "", "lei_entity_status": "",
                                "gleif_url": "", "lei_last_verified_date": TODAY_ISO})
                rows.append(out_row)
                counts["not_found"] += 1
                print(f"{prefix} → not_found (forced)")
                continue
            lei_code = forced_lei
            if args.dry_run:
                print(f"{prefix} → manual: {lei_code}")
                out_row = dict(vendor)
                out_row.update({"lei_code": lei_code, "lei_legal_name": "", "lei_entity_status": "",
                                "gleif_url": f"https://search.gleif.org/#/record/{lei_code}",
                                "lei_last_verified_date": TODAY_ISO})
                rows.append(out_row)
                counts["matched"] += 1
                continue

        if args.dry_run:
            print(f"{prefix} → search: '{vname}'")
            out_row = dict(vendor)
            out_row.update({"lei_code": lei_code, "lei_legal_name": lei_legal_name,
                            "lei_entity_status": lei_entity_status, "gleif_url": gleif_url,
                            "lei_last_verified_date": lei_last_verified})
            rows.append(out_row)
            continue

        # Search GLEIF
        candidates = search_lei(vname)
        time.sleep(DELAY_MS / 1000)

        best_lei = ""
        best_name = ""
        best_entity_status = ""
        best_confidence = ""

        for record in candidates:
            attrs = record.get("attributes", {})
            entity = attrs.get("entity", {})
            reg = attrs.get("registration", {})
            candidate_name = entity.get("legalName", {}).get("name", "")
            confidence = score_match(candidate_name, vname)
            if confidence and reg.get("status") == "ISSUED":
                best_lei = record.get("id", "")
                best_name = candidate_name
                best_entity_status = entity.get("status", "")
                best_confidence = confidence
                if confidence == "exact":
                    break

        if best_lei:
            # Walk up to ultimate parent
            print(f"{prefix} → found ({best_confidence}): {best_lei} — resolving ultimate parent…")
            ultimate_lei = resolve_ultimate_parent(best_lei)

            if ultimate_lei and ultimate_lei != best_lei:
                # Fetch the ultimate parent record for its name
                parent_record = fetch_lei_record(ultimate_lei)
                time.sleep(DELAY_MS / 1000)
                if parent_record:
                    parent_attrs = parent_record.get("attributes", {})
                    parent_entity = parent_attrs.get("entity", {})
                    best_lei = ultimate_lei
                    best_name = parent_entity.get("legalName", {}).get("name", best_name)
                    best_entity_status = parent_entity.get("status", best_entity_status)
                    print(f"        → ultimate parent: {best_lei} ({best_name})")

            lei_code = best_lei
            lei_legal_name = best_name
            lei_entity_status = best_entity_status
            gleif_url = f"https://search.gleif.org/#/record/{best_lei}"
            lei_last_verified = TODAY_ISO
            counts["matched" if best_confidence == "exact" else "partial"] += 1
            print(f"{prefix} → {best_confidence}: {best_lei}")
        else:
            counts["not_found"] += 1
            print(f"{prefix} → not_found")

        out_row = dict(vendor)
        out_row.update({
            "lei_code": lei_code,
            "lei_legal_name": lei_legal_name,
            "lei_entity_status": lei_entity_status,
            "gleif_url": gleif_url,
            "lei_last_verified_date": lei_last_verified,
        })
        rows.append(out_row)

    # Determine output columns (preserve existing + add LEI if missing)
    out_fields = list(src_fields)
    for col in ["lei_code", "lei_legal_name", "lei_entity_status", "gleif_url", "lei_last_verified_date"]:
        if col not in out_fields:
            out_fields.append(col)

    with open(OUTPUT, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=out_fields, lineterminator="\n", extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)

    print(f"\nWrote: {OUTPUT}")
    print(
        f"Matched: {counts['matched']}  Partial: {counts['partial']}  "
        f"Not found: {counts['not_found']}  Skipped: {counts['skipped']}"
    )


if __name__ == "__main__":
    main()
