#!/usr/bin/env python3
"""
Reconcile library orphan files: update existing CSV records and generate new ones.
Usage: python3 scripts/reconcile-library-orphans.py
"""

import csv
import os
import re
import sys
from html.parser import HTMLParser
from urllib.parse import unquote

CSV_IN = "src/data/library_04062026.csv"
CSV_OUT = "src/data/library_04062026.csv"  # overwrite in place (it's the new copy)

# ── HTML title extractor ──────────────────────────────────────────────────────

class TitleExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self._in_title = False
        self.title = ""

    def handle_starttag(self, tag, attrs):
        if tag.lower() == "title":
            self._in_title = True

    def handle_endtag(self, tag):
        if tag.lower() == "title":
            self._in_title = False

    def handle_data(self, data):
        if self._in_title:
            self.title += data


def extract_html_title(path):
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read(50000)  # first 50KB is enough for <title>
        parser = TitleExtractor()
        parser.feed(content)
        title = parser.title.strip()
        # Clean up common suffixes
        for suffix in [" - GitHub", " | GitHub", " — GitHub", " · GitHub"]:
            if title.endswith(suffix):
                title = title[: -len(suffix)].strip()
        return title if title else None
    except Exception:
        return None


# ── Reference ID generator ────────────────────────────────────────────────────

def filename_to_ref_id(filename):
    """Derive a reference_id from a filename."""
    stem = os.path.splitext(filename)[0]
    stem = unquote(stem)  # URL-decode
    # Replace underscores and spaces with dashes
    ref = re.sub(r"[_\s]+", "-", stem)
    # Remove problematic chars
    ref = re.sub(r"[^a-zA-Z0-9\-.]", "", ref)
    # Collapse multiple dashes
    ref = re.sub(r"-{2,}", "-", ref)
    # Strip leading/trailing dashes
    ref = ref.strip("-")
    return ref


# ── Classify by filename patterns ─────────────────────────────────────────────

BLOCKCHAIN_KEYWORDS = [
    "Algorand", "Aptos", "Avalanche", "BitGo", "Bitcoin", "Cardano", "Corda",
    "Coinbase", "Copper", "Cosmos", "DFNS", "Ethereum", "Fireblocks", "Galileo",
    "Hex-Trust", "Hyperledger", "IOTA", "Komainu", "Ledger", "Polkadot", "QRL",
    "Solana", "Sui", "Taurus", "Zodia", "Anchorage",
]


def classify_file(ref_id, filename):
    """Return (manual_category, applicable_industries, document_type, module_ids)."""
    fn_lower = filename.lower()
    ref_lower = ref_id.lower()

    # Blockchain / DeFi
    for kw in BLOCKCHAIN_KEYWORDS:
        if kw.lower() in ref_lower or kw.lower() in fn_lower:
            is_custody = any(w in fn_lower for w in ["custody", "mpc", "tss", "key-orchestration", "hsm"])
            doc_type = "Industry White Paper" if "whitepaper" in fn_lower else "Technical Documentation"
            return (
                "Industry & Research",
                "Cryptocurrency; Finance & Banking; DeFi",
                doc_type,
                "digital-assets",
            )

    # IETF
    if ref_lower.startswith("ietf") or ref_lower.startswith("draft-"):
        return ("Protocols", "Software Development; Telecommunications", "Internet Draft", "tls-basics")

    # ANSSI / BSI
    if "anssi" in ref_lower or "bsi" in ref_lower:
        return ("International Frameworks", "Government; Defense", "Regulatory Guidance", "")

    # HKMA / MAS / financial
    if any(kw in ref_lower for kw in ["hkma", "mas", "financial"]):
        return ("International Frameworks", "Finance & Banking", "Regulatory Guidance", "")

    # NIST / US government
    if any(kw in ref_lower for kw in ["nist", "cisa", "nsm", "omb"]):
        return ("NIST Standards", "Government; Software Development", "Government Guidance", "")

    # CBOM / SBOM
    if any(kw in ref_lower for kw in ["sbom", "cbom", "bom"]):
        return ("Industry & Research", "Software Development", "Technical Guidelines", "crypto-agility")

    # Default
    return ("Industry & Research", "Software Development", "Technical Documentation", "")


def derive_org(ref_id, filename):
    """Derive authors_or_organization from filename."""
    fn = unquote(filename)
    # Direct mappings
    org_map = {
        "ANSSI": "ANSSI", "BSI": "BSI", "HKMA": "HKMA", "NIST": "NIST",
        "CISA": "CISA", "DigiCert": "DigiCert", "GSMA": "GSMA",
    }
    for kw, org in org_map.items():
        if kw in fn or kw in ref_id:
            return org

    # Blockchain: first word of filename
    for kw in BLOCKCHAIN_KEYWORDS:
        if kw in fn:
            return kw

    # Extract first component before underscore/dash
    parts = re.split(r"[_\-]", fn)
    if parts:
        return parts[0]
    return ""


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    # Read existing CSV
    rows = []
    with open(CSV_IN, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for row in reader:
            rows.append(row)

    existing_refs = {r["reference_id"] for r in rows}
    existing_local = {r["local_file"].strip() for r in rows if r.get("local_file", "").strip()}

    # Phase 3: Update records with empty local_file
    updates = {
        "NSA CNSA 2.0": ("public/library/CSA_CNSA_2.0_ALGORITHMS.pdf", "yes"),
        "NSA CNSA 2.0 FAQ": ("public/library/CSI_CNSA_2.0_FAQ_.pdf", "yes"),
    }

    update_count = 0
    for row in rows:
        ref = row["reference_id"]
        if ref in updates:
            new_lf, new_dl = updates[ref]
            row["local_file"] = new_lf
            row["downloadable"] = new_dl
            row["change_status"] = "Updated"
            update_count += 1
            print(f"UPDATED: {ref} → local_file={new_lf}")

    # Phase 4: Generate new records for remaining orphans
    skip_names = {"manifest.json", "skip-list.json", ".DS_Store"}
    all_lib_files = set()
    for fname in os.listdir("public/library"):
        if fname not in skip_names:
            all_lib_files.add(fname)

    # Orphans = files not in CSV (excluding PNGs)
    orphan_files = []
    for fname in sorted(all_lib_files):
        full_path = f"public/library/{fname}"
        if full_path not in existing_local and full_path not in updates.values() and not fname.endswith(".png"):
            # Also skip the two files we just linked above
            if full_path not in [v[0] for v in updates.values()]:
                orphan_files.append(fname)

    print(f"\nOrphan files needing new records: {len(orphan_files)}")

    new_rows = []
    for fname in orphan_files:
        full_path = f"public/library/{fname}"

        # Generate reference_id
        ref_id = filename_to_ref_id(fname)

        # Ensure uniqueness
        base_ref = ref_id
        counter = 1
        while ref_id in existing_refs:
            ref_id = f"{base_ref}-{counter}"
            counter += 1

        # Extract title from HTML
        title = None
        if fname.endswith(".html"):
            title = extract_html_title(full_path)
        if not title:
            # Derive from filename
            stem = os.path.splitext(unquote(fname))[0]
            title = stem.replace("_", " ").replace("-", " ").strip()
            # Title case
            title = " ".join(w.capitalize() if w.islower() and len(w) > 3 else w for w in title.split())

        # Classify
        category, industries, doc_type, module_ids = classify_file(ref_id, fname)
        org = derive_org(ref_id, fname)

        # Determine document_status
        status = "Published"
        if "draft" in fname.lower() or "Draft" in fname:
            status = "Draft"

        new_row = {
            "reference_id": ref_id,
            "document_title": title[:200],
            "download_url": "",
            "initial_publication_date": "",
            "last_update_date": "",
            "document_status": status,
            "short_description": "",
            "document_type": doc_type,
            "applicable_industries": industries,
            "authors_or_organization": org,
            "dependencies": "",
            "region_scope": "Global",
            "AlgorithmFamily": "",
            "SecurityLevels": "",
            "ProtocolOrToolImpact": "",
            "ToolchainSupport": "",
            "MigrationUrgency": "Medium",
            "change_status": "New",
            "manual_category": category,
            "downloadable": "yes",
            "local_file": full_path,
            "module_ids": module_ids,
            "misc_info": "",
            "trusted_source_id": "",
            "peer_reviewed": "no",
            "vetting_body": "",
        }

        new_rows.append(new_row)
        existing_refs.add(ref_id)
        print(f"  NEW: {ref_id} | {title[:60]} | {category}")

    # Write output
    all_rows = rows + new_rows
    with open(CSV_OUT, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in all_rows:
            writer.writerow(row)

    print(f"\nDone: {update_count} updated, {len(new_rows)} new records added")
    print(f"Total records: {len(all_rows)}")
    print(f"Output: {CSV_OUT}")


if __name__ == "__main__":
    main()
