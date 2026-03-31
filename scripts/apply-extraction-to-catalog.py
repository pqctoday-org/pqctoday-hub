#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-only
"""
Apply product extraction results to pqc_product_catalog CSV.

Reads all csc_*_extractions_*.json files, finds the latest per category,
and updates catalog rows where pqc_support == 'Unknown' with extraction data.

Usage:
    python3 scripts/apply-extraction-to-catalog.py
    python3 scripts/apply-extraction-to-catalog.py --dry-run
    python3 scripts/apply-extraction-to-catalog.py --all   # update even non-Unknown rows
"""

import argparse
import csv
import io
import json
import os
import re
import sys
from collections import defaultdict
from pathlib import Path

TODAY = "2026-03-31"
DATA_DIR = Path("src/data")
EXTRACT_DIR = DATA_DIR / "product-extractions"


def find_latest_catalog() -> Path:
    """Find the most recent pqc_product_catalog_*.csv."""
    prefixes = ["pqc_product_catalog_", "quantum_safe_cryptographic_software_reference_"]
    candidates: list[tuple] = []
    for prefix in prefixes:
        pattern = re.compile(rf"^{prefix}(\d{{2}})(\d{{2}})(\d{{4}})(_r(\d+))?\.csv$")
        for f in DATA_DIR.iterdir():
            m = pattern.match(f.name)
            if m:
                mm, dd, yyyy = m.group(1), m.group(2), m.group(3)
                rev = int(m.group(5) or 0)
                candidates.append((f"{yyyy}{mm}{dd}", rev, f))
    if not candidates:
        raise FileNotFoundError("No catalog CSV found in src/data/")
    candidates.sort(key=lambda x: (x[0], x[1]))
    return candidates[-1][2]


def next_catalog_path(src: Path) -> Path:
    """Given src catalog path, return the next revision path."""
    m = re.search(r"(\d{2})(\d{2})(\d{4})(_r(\d+))?\.csv$", src.name)
    if not m:
        raise ValueError(f"Cannot parse catalog filename: {src.name}")
    mm, dd, yyyy = m.group(1), m.group(2), m.group(3)
    rev = int(m.group(5) or 0)
    base = re.sub(r"_r\d+\.csv$", ".csv", src.name)
    base = re.sub(r"\.csv$", "", base)
    date_str = f"{mm}{dd}{yyyy}"
    # If today's date matches, increment revision
    if f"{mm}{dd}{yyyy}" == TODAY.replace("-", "")[4:] + TODAY.replace("-", "")[:4]:
        pass
    # Always increment revision
    new_name = re.sub(r"(_r\d+)?\.csv$", f"_r{rev + 1}.csv", src.name)
    return DATA_DIR / new_name


def load_all_extractions() -> dict[str, dict]:
    """
    Load all extraction JSON files. Returns dict mapping platform_name → extraction data.
    For duplicates (same product in multiple dated files), uses the most recent.
    """
    # Collect (date, file) pairs per category
    category_files: dict[str, list[tuple[str, Path]]] = defaultdict(list)
    for f in EXTRACT_DIR.iterdir():
        if not f.name.endswith(".json"):
            continue
        m = re.match(r"^(.+)_extractions_(\d{8})(_r\d+)?\.json$", f.name)
        if m:
            cat = m.group(1)
            date = m.group(2)
            category_files[cat].append((date, f))

    # For each category, pick the latest file
    extractions: dict[str, dict] = {}
    for cat, files in category_files.items():
        files.sort(key=lambda x: x[0])
        # Process all files, later dates override earlier
        for date, fpath in files:
            try:
                data = json.loads(fpath.read_text(encoding="utf-8"))
                for entry in data:
                    name = entry.get("platform_name", "").strip()
                    if name:
                        # Later file overwrites earlier
                        extractions[name] = entry
            except Exception as e:
                print(f"  Warning: could not read {fpath.name}: {e}", file=sys.stderr)

    return extractions


def normalize_pqc_support(raw: str) -> str:
    """Normalize pqc_support value from extraction to catalog-compatible format."""
    if not raw:
        return "Unknown"
    raw = raw.strip()

    # Pass through ACVP-sourced values unchanged
    if "ACVP:" in raw:
        return raw

    # Normalize Yes variants
    if raw.startswith("Yes"):
        return raw  # keep the detail

    # Normalize Partial variants
    if raw.startswith("Partial"):
        return raw

    # Normalize Planned variants
    if raw.startswith("Planned"):
        return raw

    # Normalize No
    if raw in ("No", "no", "No (no PQC support)", "No PQC support", "None",
               "No mention", "No mention of PQC", "Not mentioned", "Not found",
               "Not applicable", "No PQC"):
        return "No"

    # Unknown
    return "Unknown"


def should_update(catalog_row: dict, extraction: dict, update_all: bool) -> bool:
    """Determine if a catalog row should be updated from extraction data."""
    current_support = catalog_row.get("pqc_support", "").strip()

    # If update_all, update any row that has extraction data
    if update_all:
        return True

    # Only update Unknown rows
    if current_support == "Unknown":
        return True

    return False


def apply_extraction(row: dict, extraction: dict) -> dict:
    """Apply extraction data to a catalog row. Returns updated row."""
    updated = dict(row)

    pqc_support = normalize_pqc_support(extraction.get("pqc_support", ""))
    if pqc_support and pqc_support != "Unknown":
        updated["pqc_support"] = pqc_support

    # Update pqc_capability_description if better than current
    desc = extraction.get("pqc_capability_description", "").strip()
    if desc and desc.lower() not in ("not stated", "unknown", "not found"):
        current_desc = updated.get("pqc_capability_description", "").strip()
        if not current_desc or current_desc == "Unknown":
            updated["pqc_capability_description"] = desc

    # Update product_brief if missing
    brief = extraction.get("product_brief", "").strip()
    if brief and brief.lower() not in ("not stated", "unknown"):
        current_brief = updated.get("product_brief", "").strip()
        if not current_brief or current_brief == "Unknown":
            updated["product_brief"] = brief

    # Update latest_version if missing
    version = extraction.get("latest_version", "").strip()
    if version and version.lower() not in ("not stated", "unknown"):
        current_version = updated.get("latest_version", "").strip()
        if not current_version or current_version == "Unknown":
            updated["latest_version"] = version

    # Update evidence_flags
    existing_flags = updated.get("evidence_flags", "").strip()
    flags = set(f.strip() for f in existing_flags.split(";") if f.strip()) if existing_flags else set()
    # Remove pqc-no-positive-extraction flag if we now have PQC data
    if pqc_support.startswith("Yes") or pqc_support.startswith("Partial") or pqc_support.startswith("Planned"):
        flags.discard("pqc-no-positive-extraction")
        flags.add("doc-extraction")
    updated["evidence_flags"] = "; ".join(sorted(flags)) if flags else ""

    # Update verification status
    updated["verification_status"] = "Verified"
    updated["last_verified_date"] = TODAY

    return updated


def main():
    parser = argparse.ArgumentParser(description="Apply extraction results to product catalog")
    parser.add_argument("--dry-run", action="store_true", help="Print changes without writing")
    parser.add_argument("--all", action="store_true", help="Update even non-Unknown rows")
    args = parser.parse_args()

    catalog_path = find_latest_catalog()
    print(f"Catalog: {catalog_path.name}")

    # Load catalog
    with open(catalog_path, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    print(f"  {len(rows)} products loaded")

    # Load extractions
    extractions = load_all_extractions()
    print(f"  {len(extractions)} extraction records loaded")

    # Apply updates
    updated_count = 0
    skipped_count = 0
    no_match_count = 0
    changes = []

    for row in rows:
        name = row.get("software_name", "").strip()
        if not name:
            continue

        # Find matching extraction
        extraction = extractions.get(name)
        if not extraction:
            # Try fuzzy match: strip version suffixes
            for ename in extractions:
                if ename.lower() == name.lower():
                    extraction = extractions[ename]
                    break
            if not extraction:
                if row.get("pqc_support", "") == "Unknown":
                    no_match_count += 1
                continue

        if should_update(row, extraction, args.all):
            old_support = row.get("pqc_support", "")
            updated_row = apply_extraction(row, extraction)
            new_support = updated_row.get("pqc_support", "")

            if old_support != new_support:
                changes.append({
                    "name": name,
                    "old": old_support,
                    "new": new_support,
                    "cat": row.get("category_id", ""),
                })
                updated_count += 1

            # Apply row update
            row.update(updated_row)
        else:
            skipped_count += 1

    # Report
    print(f"\nChanges ({updated_count} updates):")
    for c in sorted(changes, key=lambda x: x["cat"]):
        print(f"  [{c['cat']}] {c['name'][:50]:<50}  {c['old']} → {c['new']}")

    print(f"\nSummary:")
    print(f"  Updated: {updated_count}")
    print(f"  Skipped (already have data): {skipped_count}")
    print(f"  No extraction match: {no_match_count}")

    if args.dry_run:
        print("\n[DRY RUN] No file written.")
        return

    # Write new CSV
    dst = next_catalog_path(catalog_path)
    print(f"\nWriting {dst.name}...")
    with open(dst, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Done: {dst.name} ({len(rows)} rows)")

    # Print new breakdown
    from collections import Counter
    pqc_counts = Counter(r.get("pqc_support", "").split("(")[0].strip() for r in rows)
    print("\nPQC support breakdown:")
    for k, v in sorted(pqc_counts.items(), key=lambda x: -x[1]):
        print(f"  {k:<20} {v}")


if __name__ == "__main__":
    main()
