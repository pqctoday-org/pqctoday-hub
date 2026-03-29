#!/usr/bin/env python3
"""
scripts/apply-freshness-updates.py

Applies freshness audit findings to the library CSV.
Creates a new dated CSV file (never edits in place per CSVmaintenance.md).

Usage:
  python3 scripts/apply-freshness-updates.py
  python3 scripts/apply-freshness-updates.py --dry-run
"""

import csv
import os
import re
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "src" / "data"
TODAY = datetime.now().strftime("%m%d%Y")
TODAY_ISO = datetime.now().strftime("%Y-%m-%d")

DRY_RUN = "--dry-run" in sys.argv


# ─── Find latest library CSV ────────────────────────────────────────────────
def find_latest_csv():
    pattern = re.compile(r"^library_(\d{8})(_r\d+)?\.csv$")
    candidates = []
    for f in DATA_DIR.iterdir():
        m = pattern.match(f.name)
        if m:
            candidates.append((m.group(1), m.group(2) or "", f))
    candidates.sort(key=lambda x: (x[0], x[1]))
    return candidates[-1][2] if candidates else None


# ─── CSV I/O ─────────────────────────────────────────────────────────────────
def load_csv(path):
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)
    return fieldnames, rows


def save_csv(path, fieldnames, rows):
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, quoting=csv.QUOTE_MINIMAL)
        writer.writeheader()
        writer.writerows(rows)


# ─── Update definitions ─────────────────────────────────────────────────────
# Each update is: (reference_id, dict of field changes)
UPDATES = [
    # ── HIGH: RFC 9936 published (was draft-ietf-lamps-cms-kyber-13) ──
    ("draft-ietf-lamps-cms-kyber-13", {
        "document_status": "Published (RFC 9936)",
        "last_update_date": "2026-03-01",
        "change_status": "Updated",
        "misc_info": lambda old: _append(old, "Published as RFC 9936 March 2026"),
    }),

    # ── HIGH: Obsoleted RFCs ──
    ("RFC 6962", {
        "document_status": "Obsoleted by RFC 9162",
        "change_status": "Updated",
        "misc_info": lambda old: _append(old, "Obsoleted by RFC 9162 (CT v2)"),
    }),
    ("IETF RFC 4880", {
        "document_status": "Obsoleted by RFC 9580",
        "change_status": "Updated",
        "misc_info": lambda old: _append(old, "Obsoleted by RFC 9580 (Crypto Refresh)"),
    }),

    # ── MEDIUM: IETF drafts with newer revisions ──
    ("draft-ietf-pquip-hybrid-signature-spectrums-06", {
        "reference_id": "draft-ietf-pquip-hybrid-signature-spectrums-07",
        "download_url": "https://datatracker.ietf.org/doc/draft-ietf-pquip-hybrid-signature-spectrums/07/",
        "last_update_date": TODAY_ISO,
        "change_status": "Updated",
        "downloadable": "",
        "local_file": "",
    }),
    ("draft-ietf-uta-pqc-app-00", {
        "reference_id": "draft-ietf-uta-pqc-app-01",
        "download_url": "https://datatracker.ietf.org/doc/draft-ietf-uta-pqc-app/01/",
        "last_update_date": TODAY_ISO,
        "change_status": "Updated",
        "downloadable": "",
        "local_file": "",
    }),
    ("draft-wang-ipsecme-kem-auth-ikev2-01", {
        "reference_id": "draft-wang-ipsecme-kem-auth-ikev2-03",
        "download_url": "https://datatracker.ietf.org/doc/draft-wang-ipsecme-kem-auth-ikev2/03/",
        "last_update_date": TODAY_ISO,
        "change_status": "Updated",
        "downloadable": "",
        "local_file": "",
    }),
    ("draft-ietf-cose-falcon-03", {
        "reference_id": "draft-ietf-cose-falcon-04",
        "download_url": "https://datatracker.ietf.org/doc/draft-ietf-cose-falcon/04/",
        "last_update_date": TODAY_ISO,
        "change_status": "Updated",
        "downloadable": "",
        "local_file": "",
    }),
    ("draft-sfluhrer-ipsecme-ikev2-mldsa-00", {
        "reference_id": "draft-sfluhrer-ipsecme-ikev2-mldsa-01",
        "download_url": "https://datatracker.ietf.org/doc/draft-sfluhrer-ipsecme-ikev2-mldsa/01/",
        "last_update_date": TODAY_ISO,
        "change_status": "Updated",
        "downloadable": "",
        "local_file": "",
    }),
    ("draft-ietf-tls-mldsa-01", {
        "reference_id": "draft-ietf-tls-mldsa-02",
        "download_url": "https://datatracker.ietf.org/doc/draft-ietf-tls-mldsa/02/",
        "last_update_date": TODAY_ISO,
        "change_status": "Updated",
        "downloadable": "",
        "local_file": "",
    }),

    # ── MEDIUM: ETSI newer version ──
    ("ETSI-GR-QKD-007", {
        "download_url": "https://www.etsi.org/deliver/etsi_gr/QKD/001_099/007/01.02.01_60/gr_qkd007v010201p.pdf",
        "last_update_date": TODAY_ISO,
        "change_status": "Updated",
        "downloadable": "",
        "local_file": "",
        "misc_info": lambda old: _append(old, "Updated from v01.01.01 to v01.02.01"),
    }),

    # ── MEDIUM: GitHub projects with newer dates ──
    ("EUDI-Wallet-ARF", {
        "last_update_date": "2026-02-02",
        "change_status": "Updated",
        "misc_info": lambda old: _append(old, "v2.8.0 released 2026-02-02"),
        "downloadable": "",
        "local_file": "",
    }),
    ("BIP-32", {
        "last_update_date": "2026-03-05",
        "change_status": "Updated",
    }),
    ("BIP-39", {
        "last_update_date": "2026-01-12",
        "change_status": "Updated",
    }),
    ("BIP-44", {
        "last_update_date": "2026-02-27",
        "change_status": "Updated",
    }),
    ("SLIP-0010", {
        "last_update_date": "2025-04-15",
        "change_status": "Updated",
    }),
    ("BIP-141", {
        "last_update_date": "2026-01-12",
        "change_status": "Updated",
    }),
    ("BIP-340", {
        "last_update_date": "2026-01-12",
        "change_status": "Updated",
    }),
    ("BIP-341", {
        "last_update_date": "2026-01-12",
        "change_status": "Updated",
    }),
    ("Bitcoin-BIP360-P2QRH", {
        "last_update_date": "2026-02-11",
        "change_status": "Updated",
    }),

    # ── MEDIUM: Dead URLs — mark downloadable status ──
    ("UK NCSC PQC Guidance", {
        "downloadable": "no-http-404",
        "change_status": "Updated",
        "misc_info": lambda old: _append(old, "URL dead as of 2026-03-25"),
    }),
    ("ENISA-EUDI-Wallet-Security", {
        "downloadable": "no-http-404",
        "change_status": "Updated",
        "misc_info": lambda old: _append(old, "URL dead as of 2026-03-25"),
    }),
    ("Czech-NUKIB-Crypto-Rec-2023", {
        "downloadable": "no-http-404",
        "change_status": "Updated",
        "misc_info": lambda old: _append(old, "URL dead as of 2026-03-25"),
    }),
    ("ISO/IEC NP 29192-8", {
        "downloadable": "no-http-404",
        "change_status": "Updated",
        "misc_info": lambda old: _append(old, "ISO URL dead as of 2026-03-25"),
    }),
    ("ISO-IEC-23837-2", {
        "downloadable": "no-http-404",
        "change_status": "Updated",
        "misc_info": lambda old: _append(old, "ISO URL dead as of 2026-03-25"),
    }),

    # ── LOW: Expired drafts — update document_status with expiry note ──
    ("draft-ietf-tls-hybrid-design-16", {
        "document_status": "Internet-Draft (Expired 2026-03-11)",
        "change_status": "Updated",
    }),
    ("draft-ietf-lamps-kyber-certificates-11", {
        "document_status": "Internet-Draft (Expired, AUTH48 pending)",
        "change_status": "Updated",
    }),
    ("draft-ietf-pquip-pqc-engineers-14", {
        "document_status": "Internet-Draft (Expired 2026-02-27)",
        "change_status": "Updated",
    }),
    ("draft-kwiatkowski-pquip-pqc-migration-00", {
        "document_status": "Internet-Draft (Expired 2026-01-21)",
        "change_status": "Updated",
    }),
    ("draft-kampanakis-curdle-ssh-pq-ke", {
        "document_status": "Internet-Draft (Expired 2025-06-08)",
        "change_status": "Updated",
    }),
    ("draft-josefsson-ntruprime-ssh", {
        "document_status": "Internet-Draft (Expired 2025-02-18)",
        "change_status": "Updated",
    }),
    ("draft-ietf-lamps-cert-binding-for-multi-auth", {
        "document_status": "Internet-Draft (Expired 2025-06-13)",
        "change_status": "Updated",
    }),
    ("draft-sfluhrer-ipsecme-ikev2-mldsa", {
        "document_status": "Internet-Draft (Expired 2026-01-29)",
        "change_status": "Updated",
    }),
]


def _append(old, new_text):
    """Append text to a semicolon-separated field, avoiding duplicates."""
    if not old or not old.strip():
        return new_text
    parts = [p.strip() for p in old.split(";")]
    if new_text not in parts:
        parts.append(new_text)
    return ";".join(parts)


def apply_updates(fieldnames, rows):
    """Apply all updates to rows. Returns (updated_rows, change_log)."""
    # Index by reference_id for fast lookup
    index = {}
    for i, row in enumerate(rows):
        index[row["reference_id"]] = i

    log = []
    for ref_id, changes in UPDATES:
        idx = index.get(ref_id)
        if idx is None:
            log.append(f"  SKIP: {ref_id} — not found in CSV")
            continue

        row = rows[idx]
        changed_fields = []

        for field, value in changes.items():
            if callable(value):
                # Lambda: compute from old value
                old_val = row.get(field, "")
                new_val = value(old_val)
            else:
                new_val = value
                old_val = row.get(field, "")

            if old_val != new_val:
                row[field] = new_val
                changed_fields.append(f"{field}: {old_val!r} → {new_val!r}")

            # If reference_id changed, update the index
            if field == "reference_id" and old_val != new_val:
                del index[old_val]
                index[new_val] = idx

        if changed_fields:
            log.append(f"  UPDATE: {ref_id}")
            for cf in changed_fields:
                log.append(f"    {cf}")
        else:
            log.append(f"  NO-OP: {ref_id} — already up to date")

    return rows, log


# ─── Main ────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    src_csv = find_latest_csv()
    if not src_csv:
        print("ERROR: No library CSV found")
        sys.exit(1)

    dst_csv = DATA_DIR / f"library_{TODAY}.csv"
    print(f"Source: {src_csv.name}")
    print(f"Target: {dst_csv.name}")
    print(f"Updates: {len(UPDATES)}")
    print()

    fieldnames, rows = load_csv(src_csv)
    rows, log = apply_updates(fieldnames, rows)

    print("── Change Log ──")
    for line in log:
        print(line)

    if DRY_RUN:
        print("\nDRY RUN — no files written.")
    else:
        save_csv(dst_csv, fieldnames, rows)
        print(f"\nWritten: {dst_csv}")
        print(f"Records: {len(rows)}")

        # Archive the second-oldest CSV (keep 2 versions per CSVmaintenance rules)
        csvs = sorted(DATA_DIR.glob("library_*.csv"), key=lambda p: p.name)
        if len(csvs) > 2:
            archive_dir = DATA_DIR / "archive"
            oldest = csvs[0]
            dest = archive_dir / oldest.name
            print(f"Archiving: {oldest.name} → archive/")
            oldest.rename(dest)
