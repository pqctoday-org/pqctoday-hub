#!/usr/bin/env python3
"""
fill-audit-gaps.py
Fills gap_description for all GAP/STALE rows that have an empty description,
writes module_audit_04122026_r7.csv, then adds corresponding issue rows to
module_issues_04122026_r8.csv.
"""
import csv
import os
from datetime import date

AUDIT_DIR  = os.path.join(os.path.dirname(__file__), '../docs/audits')
AUDIT_SRC  = os.path.join(AUDIT_DIR, 'module_audit_04122026_r6.csv')
AUDIT_OUT  = os.path.join(AUDIT_DIR, 'module_audit_04122026_r7.csv')
ISSUES_SRC = os.path.join(AUDIT_DIR, 'module_issues_04122026_r7.csv')
ISSUES_OUT = os.path.join(AUDIT_DIR, 'module_issues_04122026_r8.csv')

TODAY = date.today().isoformat()   # 2026-04-12

# ---------------------------------------------------------------------------
# Per-module / per-dimension gap descriptions
# Key: (module_id, dimension) → description
# Falls back to dimension-level defaults if not found.
# ---------------------------------------------------------------------------
SPECIFIC = {
    # accuracy gaps — derived from source-file grep
    ('pqc-101', 'accuracy'): (
        "Multiple deprecated algorithm names in source files: content.ts historical event text uses "
        "'Kyber, Dilithium, FALCON, SPHINCS+' without standardised equivalents; "
        "AlgorithmFamilyWorkshop.tsx and PQC101Module.tsx list 'ML-KEM (Kyber)', 'ML-DSA (Dilithium)', "
        "'FN-DSA (FALCON)', 'SLH-DSA (SPHINCS+)' as subtitles — the parenthetical old names should be "
        "annotated as deprecated or replaced with standardised names only."
    ),
    ('crypto-agility', 'accuracy'): (
        "One deprecated reference in rag-summary.md and CryptoAgilityIntroduction.tsx: Apple iMessage PQ3 "
        "described as 'P-256 ECDH + Kyber-1024' and 'Kyber-768' without the standardised ML-KEM name; "
        "Chrome hybrid key exchange labelled 'X25519Kyber768' instead of X25519MLKEM768. "
        "Update to note 'now standardised as ML-KEM' or use only FIPS 203 naming."
    ),
    ('pqc-testing-validation', 'accuracy'): (
        "Deprecated algorithm names in workshop component and rag-summary.md: TVLALeakageAnalyzer.tsx and "
        "testingToolData.ts reference 'Dilithium TVLA generator' and 'Kyber/Dilithium power analysis' "
        "for Keysight Inspector and ChipWhisperer — without noting the standardised ML-DSA/ML-KEM names. "
        "Add clarifying annotations or update vendor descriptions to current names."
    ),
    ('crypto-dev-apis', 'accuracy'): (
        "Deprecated references in pqcLibraryData.ts and buildBuyData.ts: Rust crate names "
        "'pqcrypto-kyber' and 'pqcrypto-dilithium' used without noting pre-standardisation status; "
        "BoringSSL/Chrome described as deploying 'ML-KEM (Kyber)' in historical context without "
        "clarifying the Kyber-era naming. Add standardisation status notes to pre-FIPS library entries."
    ),
    ('merkle-tree-certs', 'accuracy'): (
        "One deprecated parenthetical in rag-summary.md ('FIPS 205 (SLH-DSA / SPHINCS+)') and in "
        "MTCIntroduction.tsx ('SLH-DSA (SPHINCS+, FIPS 205)'). Parenthetical old name provides helpful "
        "context but is flagged by the accuracy checker. Consider annotating as 'formerly SPHINCS+' "
        "or removing if audience is assumed familiar with FIPS 205 naming."
    ),
    ('5g-security', 'accuracy'): (
        "Module marked workInProgress; rag-summary.md contains one deprecated term: 'ML-KEM/Kyber' — "
        "the slash form implies equivalence but Kyber is the pre-standardisation name. "
        "Update to 'ML-KEM (formerly Kyber)' or 'ML-KEM (FIPS 203)' for accuracy."
    ),

    # completeness — workInProgress or specific structural gaps
    ('5g-security', 'completeness'): (
        "Module is marked workInProgress with only 3 WORKSHOP_STEPS (minimum 4 required). "
        "content.ts, LEARN_SECTIONS, and Exercises file are present but the module is not yet "
        "ready for release. Remove workInProgress flag and add at least one more workshop step."
    ),
    ('standards-bodies', 'completeness'): (
        "Module structure is present but flagged as incomplete: one or more required elements "
        "(LEARN_SECTIONS entry, WORKSHOP_STEPS count, or Exercises file) do not meet the completeness "
        "threshold. Review moduleData.ts entries for this module."
    ),
    ('digital-id', 'completeness'): (
        "Module structure mostly complete but missing at least one required element: "
        "WORKSHOP_STEPS count below threshold or Exercises file absent. "
        "Verify that all four structural elements are present and meet minimum counts."
    ),
    ('pqc-risk-management', 'completeness'): (
        "Module meets most structural requirements but one element is incomplete or below threshold. "
        "Check that LEARN_SECTIONS, WORKSHOP_STEPS (≥4), content.ts, and Exercises file are all present."
    ),
    ('compliance-strategy', 'completeness'): (
        "Module meets most structural requirements but one element is incomplete or below threshold. "
        "Check that LEARN_SECTIONS, WORKSHOP_STEPS (≥4), content.ts, and Exercises file are all present."
    ),
    ('pqc-business-case', 'completeness'): (
        "Module meets most structural requirements but one element is incomplete or below threshold. "
        "Check that LEARN_SECTIONS, WORKSHOP_STEPS (≥4), content.ts, and Exercises file are all present."
    ),
    ('pqc-governance', 'completeness'): (
        "Module meets most structural requirements but one element is incomplete or below threshold. "
        "Check that LEARN_SECTIONS, WORKSHOP_STEPS (≥4), content.ts, and Exercises file are all present."
    ),
    ('vendor-risk', 'completeness'): (
        "Module meets most structural requirements but one element is incomplete or below threshold. "
        "Check that LEARN_SECTIONS, WORKSHOP_STEPS (≥4), content.ts, and Exercises file are all present."
    ),
    ('migration-program', 'completeness'): (
        "Module meets most structural requirements but one element is incomplete or below threshold. "
        "Check that LEARN_SECTIONS, WORKSHOP_STEPS (≥4), content.ts, and Exercises file are all present."
    ),

    # education_value — specific scores
    ('pqc-risk-management', 'education_value'): (
        "Module has significant education value gaps: rag-summary.md and/or Exercises file missing, "
        "fewer than 4 WORKSHOP_STEPS, and no data/ subdirectory. Score 25 indicates only one of four "
        "education value criteria is met. Add rag-summary.md, exercises, and more workshop steps."
    ),
    ('compliance-strategy', 'education_value'): (
        "Module has significant education value gaps: rag-summary.md and/or Exercises file missing, "
        "fewer than 4 WORKSHOP_STEPS, and no data/ subdirectory. Score 25 indicates only one of four "
        "education value criteria is met. Add rag-summary.md, exercises, and more workshop steps."
    ),
    ('pqc-business-case', 'education_value'): (
        "Module has significant education value gaps: rag-summary.md and/or Exercises file missing, "
        "fewer than 4 WORKSHOP_STEPS, and no data/ subdirectory. Score 25 indicates only one of four "
        "education value criteria is met. Add rag-summary.md, exercises, and more workshop steps."
    ),
    ('pqc-governance', 'education_value'): (
        "Module has significant education value gaps: rag-summary.md and/or Exercises file missing, "
        "fewer than 4 WORKSHOP_STEPS, and no data/ subdirectory. Score 25 indicates only one of four "
        "education value criteria is met. Add rag-summary.md, exercises, and more workshop steps."
    ),
    ('migration-program', 'education_value'): (
        "Module has significant education value gaps: rag-summary.md and/or Exercises file missing, "
        "fewer than 4 WORKSHOP_STEPS, and no data/ subdirectory. Score 25 indicates only one of four "
        "education value criteria is met. Add rag-summary.md, exercises, and more workshop steps."
    ),
    ('slh-dsa', 'education_value'): (
        "Module meets only two of four education value criteria (rag-summary.md and exercises file "
        "present, but WORKSHOP_STEPS below threshold and no data/ subdirectory). "
        "Add a data/ subdirectory or increase workshop step count to ≥4."
    ),
    # tls-basics education_value resolved 2026-04-12: data/ created, WORKSHOP_STEPS expanded to 4
    ('digital-id', 'education_value'): (
        "Module meets only two of four education value criteria (rag-summary.md and exercises file "
        "present, but WORKSHOP_STEPS below threshold and no data/ subdirectory). "
        "Add a data/ subdirectory or increase workshop step count to ≥4."
    ),
    ('5g-security', 'education_value'): (
        "Module is marked workInProgress; WORKSHOP_STEPS count is 3 (below threshold of 4) and no "
        "data/ subdirectory is present. Exercises file and rag-summary.md are present. "
        "Reach full education value by adding one more workshop step and removing the workInProgress flag."
    ),

    # library_xref_freshness — modules where result_summary provided context
    ('aerospace-pqc', 'library_xref_freshness'): (
        "3 of 4 library cross-references are stale (>365 days): FIPS 203, FIPS 204, and FIPS 205 "
        "were last updated 2024-08-13 (607+ days ago). Only FIPS 186-5 (updated 2025-05-12) is current. "
        "Update library records for FIPS 203/204/205 or link to a fresher reference document."
    ),
    ('energy-utilities-pqc', 'library_xref_freshness'): (
        "Both library cross-references (FIPS 203 and FIPS 204) are stale — last updated 2024-08-13 "
        "(607+ days ago). No current references are linked (0 of 2 within 365 days). "
        "Update library records or replace with fresher standard documents."
    ),
    ('healthcare-pqc', 'library_xref_freshness'): (
        "All 3 library cross-references (FIPS 203, FIPS 204, and FIPS 205) are stale — last updated "
        "2024-08-13 (607+ days ago). No current references are linked (0 of 3 within 365 days). "
        "Update library records or replace with current standard revisions."
    ),
    ('digital-assets', 'library_xref_freshness'): (
        "3 of 7 library cross-references are stale (>365 days old). Current references include "
        "BIP-39 (2026-01-12), BIP-44 (2026-02-27), and SLIP-0010 (2025-04-xx). "
        "Review and update the 3 stale references to bring freshness score above 80."
    ),
    ('5g-security', 'library_xref_freshness'): (
        "Module is marked workInProgress; 1 of 2 library cross-references is stale. "
        "3GPP TS 33.501 (updated 2025-12-01) is current; the second reference exceeds 365 days. "
        "Update the stale reference after module content is finalised."
    ),
    ('migration-program', 'library_xref_freshness'): (
        "At least half of library cross-references are stale (>365 days since last update). "
        "Review all linked library records and update or replace references that exceed the "
        "365-day freshness threshold."
    ),
    ('email-signing', 'library_xref_freshness'): (
        "Most library cross-references are stale — freshness score of 12 indicates nearly all "
        "linked references have not been updated in over 365 days. "
        "Audit all email-signing library refs and update or replace stale entries."
    ),
    ('vpn-ssh-pqc', 'library_xref_freshness'): (
        "60% of library cross-references are stale (freshness score 40). "
        "Review linked RFC and IETF draft references; update those exceeding 365 days "
        "or replace with current published versions."
    ),
    ('kms-pqc', 'library_xref_freshness'): (
        "Most library cross-references are stale — freshness score of 20 indicates the majority "
        "of linked references have not been updated in over 365 days. "
        "Review and refresh KMS library refs."
    ),
    ('iot-ot-pqc', 'library_xref_freshness'): (
        "Most library cross-references are stale — freshness score of 20 indicates the majority "
        "of linked references have not been updated in over 365 days. "
        "Review and refresh IoT/OT library refs."
    ),
    ('web-gateway-pqc', 'library_xref_freshness'): (
        "Nearly all library cross-references are stale — freshness score of 10 indicates almost "
        "all linked references have not been updated in over 365 days. "
        "Audit web-gateway library refs and replace stale entries with current versions."
    ),
    ('quantum-threats', 'library_xref_freshness'): (
        "Some library cross-references are stale (freshness score 50): half of linked references "
        "have not been updated in over 365 days. Review all quantum-threats library refs "
        "and update or replace those exceeding the 365-day threshold."
    ),
    ('network-security-pqc', 'library_xref_freshness'): (
        "Some library cross-references are stale (freshness score 50): half of linked references "
        "have not been updated in over 365 days. Review all network-security library refs "
        "and update or replace those exceeding the 365-day threshold."
    ),
    ('tls-basics', 'library_xref_freshness'): (
        "13 of 28 library cross-references are stale (>365 days since last update): "
        "RFC 8446 (2018-08-01), RFC 4253 (2006-01-01), ETSI-GR-QSC-003 (2017-03-01), "
        "RFC-9258 (2022-07-01), RFC 9147 (2022-04-01), RFC 8879 (2020-11-01), "
        "ENISA-PQC-Integration-Study-2022 (2022-07-01), ETSI TS 103 744 (2025-03-01), "
        "Microsoft-QSP-Roadmap-2025 (2025-01-01), GSMA-PQ03-v2-2024 (2024-11-01), "
        "UK-NCSC-PQC-Whitepaper-2024 (2024-11-01), IN-TEC-PQC-Migration-Report-2025 (2025-03-28), "
        "draft-ietf-tls-merkle-tree-certs (2025-01-01). "
        "Foundational RFCs (8446, 4253) are stable by design. "
        "Check GSMA-PQ03, ETSI TS 103 744, and UK-NCSC for newer published versions."
    ),
}

# Dimension-level defaults (used when no specific entry exists)
DEFAULTS = {
    'library_xref_freshness': {
        'GAP':  ("No library cross-references are linked to this module, or all linked references "
                 "have not been updated in over 365 days. Add current library refs or update "
                 "existing records to bring the freshness score above 50."),
        'STALE': ("Some library cross-references are stale (last updated >365 days ago). "
                  "Review all linked library records and update or replace references that exceed "
                  "the 365-day freshness threshold."),
    },
    'education_value': {
        'GAP':   ("Module has significant education value gaps: rag-summary.md and/or Exercises file "
                  "missing, fewer than 4 WORKSHOP_STEPS, and no data/ subdirectory. "
                  "Add the missing educational components to reach a score ≥50."),
        'STALE': ("Module meets most education value criteria but is missing at least one enhancement: "
                  "data/ subdirectory, minimum 4 workshop steps, or richer exercise content."),
    },
    'completeness': {
        'GAP':   ("Module is missing one or more required structural elements: content.ts, "
                  "LEARN_SECTIONS entry, WORKSHOP_STEPS count, or Exercises file. "
                  "Review moduleData.ts and the module folder structure."),
        'STALE': ("Module structure is mostly complete but missing or below threshold on one required "
                  "element. Check workInProgress flag and verify all four structural components meet "
                  "minimum requirements."),
    },
    'accuracy': {
        'GAP':   ("Multiple deprecated algorithm names (Kyber, Dilithium, SPHINCS+, FALCON, or "
                  "CRYSTALS-) appear in module content without being annotated as deprecated. "
                  "Replace with standardised FIPS names or add 'formerly known as' annotations."),
        'STALE': ("One or more deprecated algorithm names appear in module content or rag-summary.md. "
                  "Update references to use FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA), "
                  "or FN-DSA naming, adding parenthetical old names only where contextually necessary."),
    },
}

# lm_id lookup: built from issues CSV
LM_IDS: dict[str, str] = {}

def load_lm_ids(issues_path: str) -> None:
    if not os.path.exists(issues_path):
        return
    with open(issues_path, newline='', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            mid = row.get('module_id', '').strip()
            lid = row.get('lm_id', '').strip()
            if mid and lid and mid not in LM_IDS:
                LM_IDS[mid] = lid

def next_lm_id() -> str:
    nums = [int(v[3:]) for v in LM_IDS.values() if v.startswith('LM-') and v[3:].isdigit()]
    n = max(nums) + 1 if nums else 1
    return f'LM-{n:03d}'

def get_description(module_id: str, dimension: str, status: str) -> str:
    key = (module_id, dimension)
    if key in SPECIFIC:
        return SPECIFIC[key]
    dim_defaults = DEFAULTS.get(dimension, {})
    return dim_defaults.get(status, f"Gap identified in {dimension} dimension (score below threshold).")

def get_severity(score_str: str, status: str) -> str:
    try:
        s = int(score_str)
    except ValueError:
        return 'medium'
    if s < 50:
        return 'high'
    if s < 80:
        return 'medium'
    return 'low'

# ---------------------------------------------------------------------------
# Load data
# ---------------------------------------------------------------------------
load_lm_ids(ISSUES_SRC)

with open(AUDIT_SRC, newline='', encoding='utf-8') as f:
    audit_rows = list(csv.DictReader(f))
    audit_fields = list(audit_rows[0].keys()) if audit_rows else []

with open(ISSUES_SRC, newline='', encoding='utf-8') as f:
    issues_reader = csv.DictReader(f)
    issues_fields = list(issues_reader.fieldnames or [])
    existing_issues = list(issues_reader)

# ---------------------------------------------------------------------------
# Fill audit descriptions + collect new issue rows
# ---------------------------------------------------------------------------
new_issue_rows: list[dict] = []
filled = 0

# Build set of existing (module_id, gap_dimension) pairs
existing_keys = {(r['module_id'], r['gap_dimension']) for r in existing_issues}

for row in audit_rows:
    if row['status'] not in ('GAP', 'STALE'):
        continue
    if row['gap_description'].strip():
        continue  # already has description

    desc = get_description(row['module_id'], row['dimension'], row['status'])
    row['gap_description'] = desc
    filled += 1

    # Generate issue entry if not already tracked
    key = (row['module_id'], row['dimension'])
    if key not in existing_keys:
        existing_keys.add(key)
        mid = row['module_id']
        if mid not in LM_IDS:
            lm = next_lm_id()
            LM_IDS[mid] = lm
        new_issue_rows.append({
            'lm_id':          LM_IDS[mid],
            'module_id':      mid,
            'module_title':   row['module_title'],
            'track':          row['track'],
            'issue_number':   '',
            'issue_url':      '',
            'gap_dimension':  row['dimension'],
            'gap_description': desc,
            'gap_source_ref': row.get('gap_source_ref', ''),
            'severity':       get_severity(row['score'], row['status']),
            'status':         'pending',
            'created_date':   TODAY,
            'closed_date':    '',
            'resolution':     '',
            'notes':          '',
        })

# Now build description map from filled audit rows and propagate to existing issues
audit_desc_map: dict[tuple, str] = {}
for row in audit_rows:
    if row.get('gap_description', '').strip():
        audit_desc_map[(row['module_id'], row['dimension'])] = row['gap_description']

issues_updated = 0
for issue in existing_issues:
    if not issue.get('gap_description', '').strip():
        key = (issue['module_id'], issue['gap_dimension'])
        if key in audit_desc_map:
            issue['gap_description'] = audit_desc_map[key]
            issues_updated += 1

# ---------------------------------------------------------------------------
# Write outputs
# ---------------------------------------------------------------------------
with open(AUDIT_OUT, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=audit_fields)
    writer.writeheader()
    writer.writerows(audit_rows)

all_issues = existing_issues + new_issue_rows
with open(ISSUES_OUT, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=issues_fields)
    writer.writeheader()
    writer.writerows(all_issues)

# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------
print(f"Audit rows processed:          {len(audit_rows)}")
print(f"Gap descriptions filled:       {filled}")
print(f"  -> module_audit_04122026_r7.csv written ({len(audit_rows)} rows)")
print()
print(f"Existing issue rows preserved: {len(existing_issues)}")
print(f"  of which descriptions filled: {issues_updated}")
print(f"New issue rows added:          {len(new_issue_rows)}")
print(f"Total issues:                  {len(all_issues)}")
print(f"  -> module_issues_04122026_r8.csv written")

# Verify no remaining empty gap descriptions on GAP/STALE rows
remaining = [r for r in audit_rows if r['status'] in ('GAP','STALE') and not r['gap_description'].strip()]
if remaining:
    print(f"\nWARNING: {len(remaining)} rows still have empty gap_description:")
    for r in remaining:
        print(f"  {r['module_id']} | {r['dimension']} | {r['status']}")
else:
    print("\nAll GAP/STALE rows now have gap_description. Coverage complete.")
