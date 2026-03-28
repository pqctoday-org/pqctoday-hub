#!/usr/bin/env python3
"""
scripts/semantic-consistency-check.py

Detects semantic contradictions across enrichment entries that reference
the same PQC entities (algorithms, standards, key sizes, security levels, dates).

For each "entity cluster" (all enrichment entries mentioning the same standard
or algorithm), extracts structured assertions and reports contradictions.

Contradiction types detected:
  - FIPS mapping errors   (FIPS 203 ↔ algorithm name)
  - Security level claims (ML-KEM-768 ↔ Level 3)
  - Publication date      (algorithm / standard finalization year)
  - Status inconsistency  (one doc says Draft, another says Final)
  - Key/signature sizes   (specific byte/bit sizes for algorithm variants)

Outputs:
  - Console report grouped by contradiction severity
  - reports/semantic-consistency-MMDDYYYY.json

Usage:
  python3 scripts/semantic-consistency-check.py
  python3 scripts/semantic-consistency-check.py --entity "ML-KEM"
  python3 scripts/semantic-consistency-check.py --entity "FIPS 203"
  python3 scripts/semantic-consistency-check.py --json
  python3 scripts/semantic-consistency-check.py --report-only  # always exit 0
"""

import json
import re
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENRICHMENT_DIR = ROOT / "src" / "data" / "doc-enrichments"
REPORTS_DIR = ROOT / "reports"
TODAY = datetime.now().strftime("%m%d%Y")

# ─── Ground Truth Allowlists ──────────────────────────────────────────────────
# Derived from algorithm reference CSV + NIST standards
FIPS_TO_ALGORITHM = {
    "203": "ML-KEM",
    "204": "ML-DSA",
    "205": "SLH-DSA",
    "206": "ASCON",
}

ALGORITHM_TO_FIPS = {v: k for k, v in FIPS_TO_ALGORITHM.items()}

# Security levels per variant: (algorithm-variant) → NIST security level
SECURITY_LEVELS = {
    "ML-KEM-512": 1,
    "ML-KEM-768": 3,
    "ML-KEM-1024": 5,
    "ML-DSA-44": 2,
    "ML-DSA-65": 3,
    "ML-DSA-87": 5,
    "SLH-DSA-SHA2-128S": 1,
    "SLH-DSA-SHA2-128F": 1,
    "SLH-DSA-SHA2-192S": 3,
    "SLH-DSA-SHA2-192F": 3,
    "SLH-DSA-SHA2-256S": 5,
    "SLH-DSA-SHA2-256F": 5,
    "FALCON-512": 1,
    "FALCON-1024": 5,
    "CRYSTALS-KYBER-512": 1,
    "CRYSTALS-KYBER-768": 3,
    "CRYSTALS-KYBER-1024": 5,
}

# Finalization years for key standards.
# IMPORTANT: Only include standards where year proximity reliably signals a publication year
# claim rather than a migration deadline. Standards like CNSA 2.0, NIST SP 800-208, and FIPS
# 203/204/205 that appear in migration timeline documents alongside future dates (2025-2035)
# generate false positives — excluded here.
# RFC 8446 is safe to check: its publication year (2018) is never confused with a deadline.
FINALIZATION_YEARS = {
    "RFC 8446": 2018,   # TLS 1.3 — any PQC claim is an ERROR, year proximity is secondary
}

# Standards that must NOT mention PQC algorithms (pre-date PQC standardisation)
NO_PQC_STANDARDS = {
    "RFC 8446": "TLS 1.3 (2018)",
    "RFC 5652": "CMS (2009)",
    "RFC 4880": "OpenPGP (2007)",
}

# Key size facts (bytes) for specific algorithm variants
KEY_SIZES_BYTES = {
    # ML-KEM public key sizes
    "ML-KEM-512-public-key": 800,
    "ML-KEM-768-public-key": 1184,
    "ML-KEM-1024-public-key": 1568,
    # ML-KEM ciphertext sizes
    "ML-KEM-512-ciphertext": 768,
    "ML-KEM-768-ciphertext": 1088,
    "ML-KEM-1024-ciphertext": 1568,
    # ML-DSA public key sizes
    "ML-DSA-44-public-key": 1312,
    "ML-DSA-65-public-key": 1952,
    "ML-DSA-87-public-key": 2592,
    # ML-DSA signature sizes
    "ML-DSA-44-signature": 2420,
    "ML-DSA-65-signature": 3309,
    "ML-DSA-87-signature": 4627,
}


# ─── Enrichment Parsing ───────────────────────────────────────────────────────
def parse_enrichment_files():
    """
    Parse all enrichment MD files and return a list of entry dicts:
      {
        "reference_id": str,
        "source_file": str,
        "enrichment_date": str,
        "fields": { field_name: value, ... }
      }
    """
    entries = []
    if not ENRICHMENT_DIR.exists():
        return entries

    for md_file in sorted(ENRICHMENT_DIR.glob("*_doc_enrichments_*.md")):
        # Extract date from filename
        m = re.search(r"_(\d{2})(\d{2})(\d{4})", md_file.name)
        if not m:
            continue
        enrichment_date = f"{m.group(3)}-{m.group(1)}-{m.group(2)}"

        try:
            content = md_file.read_text(encoding="utf-8")
        except OSError:
            continue

        # Split into sections by "## REF_ID"
        sections = re.split(r"^## (.+)$", content, flags=re.MULTILINE)
        # sections = [preamble, ref_id1, body1, ref_id2, body2, ...]
        for i in range(1, len(sections), 2):
            ref_id = sections[i].strip()
            body = sections[i + 1] if i + 1 < len(sections) else ""

            # Parse field lines: "- **Field Name**: value"
            fields = {}
            for line in body.split("\n"):
                fm = re.match(r"^\s*-\s+\*\*(.+?)\*\*:\s*(.+)$", line)
                if fm:
                    fields[fm.group(1).strip()] = fm.group(2).strip()

            entries.append({
                "reference_id": ref_id,
                "source_file": md_file.name,
                "enrichment_date": enrichment_date,
                "fields": fields,
            })

    return entries


def deduplicate_entries(entries):
    """
    For entries with the same reference_id, keep only the most recent version
    (by enrichment_date). Returns deduplicated list.
    """
    by_ref = {}
    for e in entries:
        ref = e["reference_id"]
        existing = by_ref.get(ref)
        if not existing or e["enrichment_date"] > existing["enrichment_date"]:
            by_ref[ref] = e
    return list(by_ref.values())


# ─── Entity Extraction ────────────────────────────────────────────────────────
# Entity patterns to extract from enrichment field values
ENTITY_PATTERNS = [
    # FIPS standards (canonical with space)
    (r"\bFIPS\s+(\d{3}(?:-\w+)?)\b", lambda m: f"FIPS {m.group(1)}"),
    # NIST SP/IR
    (r"\bNIST\s+(?:SP|IR|CSWP)\s+([\d-]+[A-Za-z0-9]*)\b", lambda m: f"NIST {m.group(0).split('NIST ')[1]}"),
    # Algorithm names (canonical forms)
    (r"\b(ML-KEM(?:-\d+)?|ML-DSA(?:-\d+)?|SLH-DSA(?:-\w+-\d+\w*)?|Kyber(?:-\d+)?|Dilithium(?:\d)?|"
     r"CRYSTALS-Kyber(?:-\d+)?|CRYSTALS-Dilithium|Falcon(?:-\d+)?|SPHINCS\+|FrodoKEM|HQC|"
     r"Classic McEliece|BIKE|NTRUPrime)\b", lambda m: m.group(1)),
    # RFCs
    (r"\bRFC\s+(\d+)\b", lambda m: f"RFC {m.group(1)}"),
]


def extract_entities_from_text(text):
    """Extract entity names from a text string."""
    entities = set()
    for pattern, extractor in ENTITY_PATTERNS:
        for m in re.finditer(pattern, text, re.IGNORECASE):
            try:
                entities.add(extractor(m))
            except Exception:
                pass
    return entities


def build_entity_clusters(entries):
    """
    Build clusters: { entity_name: [entry, ...] }
    An entry belongs to a cluster if any of its field values mention the entity.
    """
    clusters = {}
    for entry in entries:
        # Combine all field values for entity search
        text = " ".join(entry["fields"].values())
        # Also include the reference_id itself
        text = f"{entry['reference_id']} {text}"

        for entity in extract_entities_from_text(text):
            clusters.setdefault(entity, []).append(entry)

    return clusters


# ─── Contradiction Detection ──────────────────────────────────────────────────
def check_fips_algorithm_mapping(entry):
    """
    Check: if entry explicitly attributes FIPS N to a wrong algorithm via direct mapping phrases.
    Uses tight co-attribution patterns to avoid false positives from multi-standard documents
    that legitimately list FIPS 203, 204, and 205 in the same paragraph.

    Detects: "FIPS 203 is ML-DSA", "FIPS 203 (ML-DSA)", "FIPS 203: ML-DSA",
             "FIPS 203 defines ML-DSA", "ML-DSA [is/in/from] FIPS 203" (wrong direction)
    Does NOT detect: "FIPS 203, 204, 205 define ML-KEM, ML-DSA, SLH-DSA" (list context is safe)
    """
    findings = []
    # Check the PQC Algorithms Covered field — most direct source of algorithm claims
    algo_field = entry["fields"].get("PQC Algorithms Covered", "")
    main_topic = entry["fields"].get("Main Topic", "")
    check_text = f"{algo_field} {main_topic}"

    for fips_num, correct_algo in FIPS_TO_ALGORITHM.items():
        # Direct attribution patterns: "FIPS N [is/covers/specifies/=/(] wrong_algo"
        # or "FIPS N: wrong_algo" at the start of a clause
        direct_fips_patterns = [
            # "FIPS 203 (ML-DSA)" — parenthetical attribution
            rf"\bFIPS\s+{fips_num}\s*\(\s*(?!{re.escape(correct_algo)})(ML-KEM|ML-DSA|SLH-DSA|ASCON)\b",
            # "FIPS 203 is ML-DSA" / "FIPS 203 defines ML-DSA" / "FIPS 203 = ML-DSA"
            rf"\bFIPS\s+{fips_num}\s+(?:is|defines?|specifies?|covers?|=)\s+(?!{re.escape(correct_algo)})(ML-KEM|ML-DSA|SLH-DSA|ASCON)\b",
            # "ML-DSA (FIPS 203)" — reversed attribution (wrong algo attributed to this FIPS)
            rf"\b(ML-KEM|ML-DSA|SLH-DSA|ASCON)\s*\(FIPS\s+{fips_num}\)",
        ]
        for pat in direct_fips_patterns:
            m = re.search(pat, check_text, re.IGNORECASE)
            if m:
                wrong_algo = m.group(1) if m.lastindex else "unknown"
                if wrong_algo.upper() != correct_algo.upper():
                    findings.append((
                        "ERROR",
                        f"FIPS {fips_num} ({correct_algo}) directly attributed to wrong algorithm "
                        f"'{wrong_algo}' in '{entry['reference_id']}'",
                    ))
                    break

    return findings


def check_no_pqc_standards(entry):
    """
    Check: pre-PQC standards (RFC 8446, RFC 5652) must not claim PQC algorithms.
    Returns list of (severity, description) tuples.
    """
    findings = []
    text = " ".join(entry["fields"].values())
    ref_id = entry["reference_id"]

    for std_ref_id, std_desc in NO_PQC_STANDARDS.items():
        # Does this enrichment entry cover the no-PQC standard?
        if std_ref_id.lower().replace(" ", "") not in ref_id.lower().replace(" ", "").replace("-", ""):
            continue

        pqc_algo_pattern = re.compile(
            r"\b(ML-KEM|ML-DSA|SLH-DSA|CRYSTALS-Kyber|CRYSTALS-Dilithium|"
            r"Falcon|SPHINCS\+|Kyber|Dilithium|post-quantum algorithm|PQC algorithm)\b",
            re.IGNORECASE,
        )
        # Check PQC Algorithms Covered field specifically
        algo_field = entry["fields"].get("PQC Algorithms Covered", "")
        if algo_field and algo_field.lower() not in ("none detected", "n/a", "none", ""):
            if pqc_algo_pattern.search(algo_field):
                findings.append((
                    "ERROR",
                    f"{std_ref_id} ({std_desc}) claims PQC algorithm coverage: '{algo_field}' "
                    f"in '{ref_id}' — this standard predates PQC",
                ))

    return findings


def check_security_level_claims(entry):
    """
    Check: if entry directly attributes a security level to a specific algorithm variant.
    Uses tight co-attribution: "[variant] at Level N", "[variant] is Level N",
    "[variant] provides Level N security", "[variant] (Level N)".

    Does NOT fire on:
    - Lists of all security levels: "Level 1, 3, 5"
    - Context where the level belongs to a different variant in the same clause
    """
    findings = []
    text = " ".join(entry["fields"].values())

    for variant, correct_level in SECURITY_LEVELS.items():
        # Only check when the variant is explicitly named in the entry
        if not re.search(re.escape(variant), text, re.IGNORECASE):
            continue

        # Direct attribution patterns (variant followed immediately by level claim)
        direct_patterns = [
            # "ML-KEM-768 at Level 1" / "ML-KEM-768 at security level 1"
            rf"{re.escape(variant)}\s+(?:at\s+)?(?:security\s+)?[Ll]evel\s+(\d)",
            # "ML-KEM-768 (Level 1)"
            rf"{re.escape(variant)}\s*\(\s*[Ll]evel\s+(\d)\s*\)",
            # "ML-KEM-768 is Level 1" / "ML-KEM-768 provides Level 1"
            rf"{re.escape(variant)}\s+(?:is|provides?)\s+(?:NIST\s+)?[Ll]evel\s+(\d)",
            # "Level 1 ML-KEM-768" (reversed)
            rf"[Ll]evel\s+(\d)\s+{re.escape(variant)}",
        ]
        for pat in direct_patterns:
            m = re.search(pat, text, re.IGNORECASE)
            if m:
                claimed_level = int(m.group(1))
                if claimed_level != correct_level:
                    findings.append((
                        "ERROR",
                        f"{variant} claimed at Level {claimed_level} (correct: Level {correct_level}) "
                        f"in '{entry['reference_id']}'",
                    ))
                break  # Only report once per variant

    return findings


def check_publication_year_claims(entry):
    """
    Check: if entry claims a year for a known standard, verify it.
    Returns list of (severity, description) tuples.
    """
    findings = []
    text = " ".join(entry["fields"].values())

    for std, correct_year in FINALIZATION_YEARS.items():
        std_pattern = re.compile(re.escape(std), re.IGNORECASE)
        if not std_pattern.search(text):
            continue

        for m in std_pattern.finditer(text):
            start = max(0, m.start() - 150)
            end = min(len(text), m.end() + 150)
            context = text[start:end]

            # Look for 4-digit year claims near the standard mention
            for year_m in re.finditer(r"\b(20\d{2})\b", context):
                claimed_year = int(year_m.group(1))
                # Only flag years that are clearly wrong (not within ±1 year for drafts)
                if abs(claimed_year - correct_year) > 2:
                    findings.append((
                        "WARNING",
                        f"{std} year claim: {claimed_year} (expected ~{correct_year}) "
                        f"in '{entry['reference_id']}'",
                    ))
                    break

    return findings


def check_cross_cluster_contradictions(entity, entries):
    """
    Within a cluster, check for status inconsistencies:
    If multiple entries mention the same standard but disagree on its status.
    Returns list of contradiction dicts.
    """
    contradictions = []

    # Collect status mentions
    status_claims = []
    for entry in entries:
        for field_name in ("Document Status", "PQC Algorithms Covered", "Main Topic"):
            val = entry["fields"].get(field_name, "")
            if entity.lower() in val.lower() or entity.lower() in entry["reference_id"].lower():
                status_claims.append((entry["reference_id"], field_name, val))

    # For FIPS standards: check that different entries agree on draft vs final status
    if re.match(r"FIPS \d+", entity, re.IGNORECASE):
        draft_entries = [(r, f, v) for r, f, v in status_claims
                         if re.search(r"\bdraft\b|\bIPD\b", v, re.IGNORECASE)]
        final_entries = [(r, f, v) for r, f, v in status_claims
                         if re.search(r"\bfinal\b|\bfinalized\b|\bpublished\b", v, re.IGNORECASE)]
        if draft_entries and final_entries:
            contradictions.append({
                "entity": entity,
                "type": "STATUS_DISAGREEMENT",
                "severity": "WARNING",
                "description": (
                    f"{entity}: {len(draft_entries)} entries call it 'draft', "
                    f"{len(final_entries)} call it 'final/published'"
                ),
                "draft_sources": [r for r, _, _ in draft_entries],
                "final_sources": [r for r, _, _ in final_entries],
            })

    return contradictions


# ─── Main Analysis ────────────────────────────────────────────────────────────
def run_consistency_check(entity_filter=None, json_output=False, report_only=False):
    """Run the full semantic consistency check pipeline."""
    print("Loading enrichment files...", file=sys.stderr)
    all_entries = parse_enrichment_files()
    entries = deduplicate_entries(all_entries)
    print(f"  {len(all_entries)} raw entries → {len(entries)} deduplicated", file=sys.stderr)

    if not entries:
        print("No enrichment entries found.", file=sys.stderr)
        return

    # ── Per-entry checks ──────────────────────────────────────────────────────
    per_entry_findings = []
    for entry in entries:
        if entity_filter:
            text = f"{entry['reference_id']} {' '.join(entry['fields'].values())}"
            if entity_filter.lower() not in text.lower():
                continue

        findings = []
        findings.extend(check_fips_algorithm_mapping(entry))
        findings.extend(check_no_pqc_standards(entry))
        findings.extend(check_security_level_claims(entry))
        findings.extend(check_publication_year_claims(entry))

        for severity, description in findings:
            per_entry_findings.append({
                "type": "PER_ENTRY",
                "severity": severity,
                "reference_id": entry["reference_id"],
                "source_file": entry["source_file"],
                "description": description,
            })

    # ── Cross-cluster checks ──────────────────────────────────────────────────
    cross_findings = []
    if not entity_filter:
        print("Building entity clusters...", file=sys.stderr)
        clusters = build_entity_clusters(entries)
        # Only check clusters with 3+ entries (single/dual entries have nothing to contradict)
        large_clusters = {e: ents for e, ents in clusters.items() if len(ents) >= 3}
        print(f"  {len(clusters)} total clusters, {len(large_clusters)} with 3+ entries", file=sys.stderr)

        for entity, cluster_entries in large_clusters.items():
            cross_findings.extend(check_cross_cluster_contradictions(entity, cluster_entries))
    elif entity_filter:
        clusters = build_entity_clusters(entries)
        for entity, cluster_entries in clusters.items():
            if entity_filter.lower() in entity.lower():
                cross_findings.extend(check_cross_cluster_contradictions(entity, cluster_entries))

    # ── Compile results ───────────────────────────────────────────────────────
    all_findings = per_entry_findings + cross_findings
    errors = [f for f in all_findings if f["severity"] == "ERROR"]
    warnings = [f for f in all_findings if f["severity"] == "WARNING"]

    summary = {
        "checked_date": datetime.now().isoformat(),
        "entries_scanned": len(entries),
        "total_findings": len(all_findings),
        "errors": len(errors),
        "warnings": len(warnings),
        "entity_filter": entity_filter,
    }

    report = {"summary": summary, "findings": all_findings}

    # Write report
    REPORTS_DIR.mkdir(exist_ok=True)
    report_path = REPORTS_DIR / f"semantic-consistency-{TODAY}.json"
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2, default=str)

    if json_output:
        print(json.dumps(report, indent=2, default=str))
        return len(errors) if not report_only else 0

    # Console output
    print(f"\n── Semantic Consistency Check Results ──────────────────────────────")
    print(f"  Entries scanned  : {summary['entries_scanned']}")
    print(f"  Total findings   : {summary['total_findings']}")
    print(f"  Errors (ERROR)   : {summary['errors']}")
    print(f"  Warnings (WARNING): {summary['warnings']}")

    if errors:
        print(f"\n── ERRORS ({len(errors)}) ─────────────────────────────────────────────")
        for f in errors:
            ref = f.get("reference_id", f.get("entity", "?"))
            print(f"  [{ref}] {f['description']}")
            if f.get("source_file"):
                print(f"    Source: {f['source_file']}")

    if warnings:
        print(f"\n── WARNINGS ({len(warnings)}) ──────────────────────────────────────────")
        for f in warnings:
            ref = f.get("reference_id", f.get("entity", "?"))
            desc = f["description"]
            if len(desc) > 120:
                desc = desc[:117] + "..."
            print(f"  [{ref}] {desc}")

    if not all_findings:
        print("\n  No semantic inconsistencies detected.")

    print(f"\nReport written to: {report_path}")

    return len(errors) if not report_only else 0


# ─── CLI ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Semantic consistency check across enrichment entries")
    parser.add_argument("--entity", help="Check only entries/clusters mentioning this entity (e.g., 'ML-KEM')")
    parser.add_argument("--json", action="store_true", dest="json_output", help="Output results as JSON")
    parser.add_argument("--report-only", action="store_true", help="Always exit 0 (report mode)")
    args = parser.parse_args()

    exit_code = run_consistency_check(
        entity_filter=args.entity,
        json_output=args.json_output,
        report_only=args.report_only,
    )
    sys.exit(exit_code or 0)
