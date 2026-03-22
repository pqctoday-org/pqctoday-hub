#!/usr/bin/env python3
"""
CSV Cross-Reference Integrity Audit
Checks all cross-references, file existence, and versioning rules.
Run from the project root: python3 scripts/audit-csv-crossrefs.py
"""
import csv
import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
DATA = ROOT / "src/data"
PUBLIC_LIB = ROOT / "public/library"
COMPLIANCE_JSON = ROOT / "public/data/compliance-data.json"

# ──────────────────────────────────────────────────────────────────────────────
# Authoritative module slugs (from moduleData.ts MODULE_CATALOG, confirmed manually)
# ──────────────────────────────────────────────────────────────────────────────
VALID_MODULE_SLUGS = {
    "pqc-101", "quantum-threats", "hybrid-crypto", "crypto-agility",
    "tls-basics", "vpn-ssh-pqc", "email-signing", "pki-workshop",
    "kms-pqc", "hsm-pqc", "stateful-signatures", "digital-assets",
    "5g-security", "digital-id", "entropy-randomness", "merkle-tree-certs",
    "qkd", "code-signing", "api-security-jwt", "crypto-dev-apis",
    "web-gateway-pqc", "iot-ot-pqc", "pqc-risk-management", "pqc-business-case",
    "pqc-governance", "vendor-risk", "migration-program", "compliance-strategy",
    "data-asset-sensitivity", "standards-bodies", "confidential-computing",
    "database-encryption-pqc", "energy-utilities-pqc", "emv-payment-pqc",
    "ai-security-pqc", "platform-eng-pqc", "healthcare-pqc", "aerospace-pqc",
    "automotive-pqc", "exec-quantum-impact", "dev-quantum-impact",
    "arch-quantum-impact", "ops-quantum-impact", "research-quantum-impact",
    "secrets-management-pqc", "network-security-pqc", "pqc-testing-validation",
    "iam-pqc", "secure-boot-pqc", "os-pqc",
    # Special (exempt from cross-ref checks but valid in module_ids context)
    "quiz", "assess",
}

issues = []
warnings = []

def issue(check, detail):
    issues.append(f"[{check}] {detail}")

def warn(check, detail):
    warnings.append(f"[{check}] {detail}")

# ──────────────────────────────────────────────────────────────────────────────
# Helpers: find latest CSV per prefix
# ──────────────────────────────────────────────────────────────────────────────
def find_latest_csv(prefix):
    """Return Path to latest CSV for the given prefix (date + revision aware)."""
    pattern = re.compile(
        rf'^{re.escape(prefix)}_(\d{{8}})(?:_r(\d+))?\.csv$'
    )
    candidates = []
    for f in DATA.glob(f"{prefix}_*.csv"):
        m = pattern.match(f.name)
        if m:
            date = int(m.group(1))
            rev = int(m.group(2)) if m.group(2) else 0
            candidates.append((date, rev, f))
    if not candidates:
        return None
    candidates.sort(key=lambda x: (x[0], x[1]), reverse=True)
    return candidates[0][2]

def parse_csv(path, id_col=None):
    """Parse CSV into list of dicts; optionally build a set of ID values."""
    rows = []
    ids = set()
    with open(path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
            if id_col and row.get(id_col):
                ids.add(row[id_col].strip())
    return rows, ids

# ──────────────────────────────────────────────────────────────────────────────
# Load all latest CSVs
# ──────────────────────────────────────────────────────────────────────────────
print("Loading CSVs…")

lib_path = find_latest_csv("library")
comp_path = find_latest_csv("compliance")
migrate_path = find_latest_csv("quantum_safe_cryptographic_software_reference")
threats_path = find_latest_csv("quantum_threats_hsm_industries")
timeline_path = find_latest_csv("timeline")
xref_path = find_latest_csv("migrate_certification_xref")

for name, path in [
    ("library", lib_path),
    ("compliance", comp_path),
    ("migrate", migrate_path),
    ("threats", threats_path),
    ("timeline", timeline_path),
    ("xref", xref_path),
]:
    if path is None:
        issue("LOAD", f"Cannot find latest CSV for prefix '{name}'")
    else:
        print(f"  {name}: {path.name}")

lib_rows, lib_ids = parse_csv(lib_path, "reference_id") if lib_path else ([], set())
comp_rows, _ = parse_csv(comp_path) if comp_path else ([], set())
migrate_rows, migrate_sw_names = parse_csv(migrate_path, "software_name") if migrate_path else ([], set())
threats_rows, _ = parse_csv(threats_path) if threats_path else ([], set())
timeline_rows, _ = parse_csv(timeline_path) if timeline_path else ([], set())
xref_rows, _ = parse_csv(xref_path) if xref_path else ([], set())

# Build timeline key set: "Country:OrgName"
timeline_keys = set()
for row in timeline_rows:
    country = row.get("Country", "").strip()
    org = row.get("OrgName", "").strip()
    if country and org:
        timeline_keys.add(f"{country}:{org}")

# Load compliance-data.json
comp_json_ids_fips = set()
comp_json_ids_cc = set()
if COMPLIANCE_JSON.exists():
    cj = json.loads(COMPLIANCE_JSON.read_text())
    for rec in cj:
        src = rec.get("source", "")
        rid = str(rec.get("id", "")).strip()
        if src == "NIST":
            comp_json_ids_fips.add(rid)
        elif src == "Common Criteria":
            comp_json_ids_cc.add(rid)
else:
    issue("LOAD", "public/data/compliance-data.json not found")

print(f"  compliance-data.json: {len(comp_json_ids_fips)} FIPS + {len(comp_json_ids_cc)} CC records")
print()

# ──────────────────────────────────────────────────────────────────────────────
# CHECK 1a: compliance.libraryRefs → library.referenceId
# ──────────────────────────────────────────────────────────────────────────────
print("CHECK 1a: compliance.libraryRefs → library.referenceId")
lib_ref_col = None
for col in (comp_rows[0].keys() if comp_rows else []):
    if "libraryrefs" in col.lower() or col.lower() == "library_refs":
        lib_ref_col = col
        break
# Try common names
for col in ["library_refs", "libraryRefs", "library_references"]:
    if comp_rows and col in comp_rows[0]:
        lib_ref_col = col
        break

c1a_bad = 0
for i, row in enumerate(comp_rows, 2):
    raw = row.get("library_refs", row.get("libraryRefs", "")).strip()
    if not raw:
        continue
    for ref_id in raw.split(";"):
        ref_id = ref_id.strip()
        if ref_id and ref_id not in lib_ids:
            issue("1a", f"compliance row {i} ({row.get('id','')}): libraryRefs '{ref_id}' not in library")
            c1a_bad += 1
print(f"  → {c1a_bad} dangling libraryRefs\n")

# ──────────────────────────────────────────────────────────────────────────────
# CHECK 1b: compliance.timelineRefs → timeline Country:OrgName
# ──────────────────────────────────────────────────────────────────────────────
print("CHECK 1b: compliance.timelineRefs → timeline Country:OrgName")
c1b_bad = 0
for i, row in enumerate(comp_rows, 2):
    raw = row.get("timeline_refs", row.get("timelineRefs", "")).strip()
    if not raw:
        continue
    for tref in raw.split(";"):
        tref = tref.strip()
        if tref and tref not in timeline_keys:
            issue("1b", f"compliance row {i} ({row.get('id','')}): timelineRef '{tref}' not in timeline")
            c1b_bad += 1
print(f"  → {c1b_bad} dangling timelineRefs\n")

# ──────────────────────────────────────────────────────────────────────────────
# CHECK 1c: library.dependencies → library.referenceId
# ──────────────────────────────────────────────────────────────────────────────
print("CHECK 1c: library.dependencies → library.referenceId")
c1c_bad = 0
for i, row in enumerate(lib_rows, 2):
    raw = row.get("dependencies", "").strip()
    if not raw:
        continue
    for dep in raw.split(";"):
        dep = dep.strip()
        if dep and dep not in lib_ids:
            issue("1c", f"library row {i} ({row.get('reference_id','')}): dep '{dep}' not in library")
            c1c_bad += 1
print(f"  → {c1c_bad} dangling dependencies\n")

# ──────────────────────────────────────────────────────────────────────────────
# CHECK 1d: library.module_ids → valid module slugs
# ──────────────────────────────────────────────────────────────────────────────
print("CHECK 1d: library.module_ids → valid module slugs")
c1d_bad = 0
for i, row in enumerate(lib_rows, 2):
    raw = row.get("module_ids", "").strip()
    if not raw:
        continue
    for slug in raw.split(";"):
        slug = slug.strip()
        if slug and slug not in VALID_MODULE_SLUGS:
            issue("1d", f"library row {i} ({row.get('reference_id','')}): module_id '{slug}' not a valid slug")
            c1d_bad += 1
print(f"  → {c1d_bad} invalid module_ids\n")

# ──────────────────────────────────────────────────────────────────────────────
# CHECK 1e: threats.related_modules → valid module slugs (pipe-delimited)
# ──────────────────────────────────────────────────────────────────────────────
print("CHECK 1e: threats.related_modules → valid module slugs")
c1e_bad = 0
for i, row in enumerate(threats_rows, 2):
    raw = row.get("related_modules", "").strip()
    if not raw:
        continue
    for slug in raw.split("|"):
        slug = slug.strip()
        if slug and slug not in VALID_MODULE_SLUGS:
            issue("1e", f"threats row {i} ({row.get('threat_id','')}): related_module '{slug}' not valid")
            c1e_bad += 1
print(f"  → {c1e_bad} invalid threats.related_modules\n")

# ──────────────────────────────────────────────────────────────────────────────
# CHECK 1f: migrate.learning_modules → valid module slugs (comma-delimited)
# ──────────────────────────────────────────────────────────────────────────────
print("CHECK 1f: migrate.learning_modules → valid module slugs")
c1f_bad = 0
for i, row in enumerate(migrate_rows, 2):
    raw = row.get("learning_modules", "").strip()
    if not raw:
        continue
    for slug in raw.split(";"):
        slug = slug.strip()
        if slug and slug not in VALID_MODULE_SLUGS:
            issue("1f", f"migrate row {i} ({row.get('software_name','')}): learning_module '{slug}' not valid")
            c1f_bad += 1
print(f"  → {c1f_bad} invalid migrate.learning_modules\n")

# ──────────────────────────────────────────────────────────────────────────────
# CHECK 1g: xref.software_name → migrate.software_name
# ──────────────────────────────────────────────────────────────────────────────
print("CHECK 1g: xref.software_name → migrate.software_name")
c1g_bad = 0
xref_sw_not_found = set()
for i, row in enumerate(xref_rows, 2):
    sw = row.get("software_name", "").strip()
    if sw and sw not in migrate_sw_names:
        if sw not in xref_sw_not_found:
            issue("1g", f"xref: software_name '{sw}' not in migrate catalog")
            xref_sw_not_found.add(sw)
            c1g_bad += 1
print(f"  → {c1g_bad} xref software names not in migrate catalog\n")

# ──────────────────────────────────────────────────────────────────────────────
# CHECK 1h: xref cert_ids → compliance-data.json (FIPS + CC only; ACVP skipped)
# ──────────────────────────────────────────────────────────────────────────────
print("CHECK 1h: xref cert_ids → compliance-data.json (FIPS/CC)")
c1h_bad = 0
acvp_count = 0
for i, row in enumerate(xref_rows, 2):
    ctype = row.get("cert_type", "").strip()
    cid = row.get("cert_id", "").strip()
    if ctype == "ACVP":
        acvp_count += 1
        continue  # ACVP not in compliance-data.json — skip
    elif ctype == "FIPS 140-3":
        if cid not in comp_json_ids_fips:
            issue("1h", f"xref row {i} ({row.get('software_name','')}): FIPS cert_id '{cid}' not in compliance-data.json")
            c1h_bad += 1
    elif ctype == "Common Criteria":
        if cid not in comp_json_ids_cc:
            issue("1h", f"xref row {i} ({row.get('software_name','')}): CC cert_id '{cid}' not in compliance-data.json")
            c1h_bad += 1
print(f"  → {c1h_bad} invalid FIPS/CC cert_ids; {acvp_count} ACVP rows skipped (not in compliance-data.json)\n")

# ──────────────────────────────────────────────────────────────────────────────
# CHECK 2a: library local_file existence
# ──────────────────────────────────────────────────────────────────────────────
print("CHECK 2a: library local_file → file on disk")
c2a_bad = 0
c2a_ok = 0
lib_local_files = set()
for i, row in enumerate(lib_rows, 2):
    downloadable = row.get("downloadable", "").strip().lower()
    local_file = row.get("local_file", "").strip()
    if not local_file:
        continue
    lib_local_files.add(local_file)
    file_path = ROOT / local_file
    if downloadable == "yes" and not file_path.exists():
        issue("2a", f"library row {i} ({row.get('reference_id','')}): local_file '{local_file}' not on disk (downloadable=yes)")
        c2a_bad += 1
    elif file_path.exists():
        c2a_ok += 1
print(f"  → {c2a_bad} missing files; {c2a_ok} present\n")

# ──────────────────────────────────────────────────────────────────────────────
# CHECK 2b: orphaned public/library/ files (no library record)
# ──────────────────────────────────────────────────────────────────────────────
print("CHECK 2b: public/library/ orphaned files (no library record)")
SKIP_FILES = {"manifest.json", "skip-list.json"}
lib_local_relative = {lf.replace("public/library/", "") for lf in lib_local_files if "library" in lf}
c2b_orphan = 0
orphaned_files = []
for f in PUBLIC_LIB.iterdir():
    if f.name in SKIP_FILES or not f.is_file():
        continue
    if f.name not in lib_local_relative:
        orphaned_files.append(f.name)
        c2b_orphan += 1
if orphaned_files:
    for fname in sorted(orphaned_files)[:20]:
        warn("2b", f"public/library/{fname} — no library record references it")
    if len(orphaned_files) > 20:
        warn("2b", f"… and {len(orphaned_files)-20} more orphaned files")
print(f"  → {c2b_orphan} orphaned files in public/library/\n")

# ──────────────────────────────────────────────────────────────────────────────
# CHECK 3: Versioning rule violations (>2 active versions per prefix in src/data/)
# ──────────────────────────────────────────────────────────────────────────────
print("CHECK 3: Versioning rule — max 2 active CSVs per prefix in src/data/")
date_pattern = re.compile(r'^(.+?)_(\d{8})(?:_r\d+)?\.csv$')
prefix_files: dict[str, list] = {}
for f in DATA.glob("*.csv"):
    m = date_pattern.match(f.name)
    if m:
        prefix = m.group(1)
        prefix_files.setdefault(prefix, []).append(f.name)

TODAY_MMDDYYYY = "03212026"

def mmddyyyy_to_ymd(s):
    """Convert MMDDYYYY → YYYYMMDD for chronological comparison."""
    return s[4:] + s[:2] + s[2:4]

TODAY_YMD = mmddyyyy_to_ymd(TODAY_MMDDYYYY)

for prefix, files in sorted(prefix_files.items()):
    if len(files) > 2:
        issue("3", f"Prefix '{prefix}' has {len(files)} active CSVs (max 2): {sorted(files)}")
    # Check for future-dated files
    for fname in files:
        m2 = date_pattern.match(fname)
        if m2:
            fdate_ymd = mmddyyyy_to_ymd(m2.group(2))
            if fdate_ymd > TODAY_YMD:
                issue("3", f"'{fname}' has a future date ({m2.group(2)} > today {TODAY_MMDDYYYY})")
print()

# CHECK 3b: Archive future-dated files
print("CHECK 3b: Archive — future-dated files")
ARCHIVE = DATA / "archive"
c3b = 0
for f in ARCHIVE.glob("*.csv"):
    m = date_pattern.match(f.name)
    if m:
        fdate_ymd = mmddyyyy_to_ymd(m.group(2))
        if fdate_ymd > TODAY_YMD:
            issue("3b", f"archive/{f.name} has future date ({m.group(2)} > today {TODAY_MMDDYYYY})")
            c3b += 1
print(f"  → {c3b} future-dated archive files\n")

# CHECK 3c: double-filed (same file in both src/data/ and archive/)
print("CHECK 3c: Double-filed (same name in src/data/ AND archive/)")
active_names = {f.name for f in DATA.glob("*.csv")}
archive_names = {f.name for f in ARCHIVE.glob("*.csv")}
double_filed = active_names & archive_names
for fname in sorted(double_filed):
    issue("3c", f"'{fname}' exists in BOTH src/data/ and src/data/archive/")
print(f"  → {len(double_filed)} double-filed\n")

# ──────────────────────────────────────────────────────────────────────────────
# CHECK 4: Stale last_verified_date in migrate catalog (before 2026-01-01)
# ──────────────────────────────────────────────────────────────────────────────
print("CHECK 4: migrate — stale last_verified_date (< 2026-01-01)")
stale_cutoff = "2026-01-01"
c4_stale = 0
stale_list = []
for row in migrate_rows:
    lvd = row.get("last_verified_date", "").strip()
    if lvd and lvd < stale_cutoff:
        c4_stale += 1
        stale_list.append((row.get("software_name","?"), lvd, row.get("pqc_migration_priority","?")))

# Report critical + high priority stale entries
critical_stale = [(n, d, p) for n, d, p in stale_list if p in ("Critical", "High")]
for name, lvd, pri in critical_stale[:20]:
    warn("4", f"migrate '{name}' last_verified={lvd} priority={pri}")
if len(critical_stale) > 20:
    warn("4", f"… and {len(critical_stale)-20} more Critical/High stale entries")
print(f"  → {c4_stale} total stale (< {stale_cutoff}); {len(critical_stale)} are Critical/High priority\n")

# ──────────────────────────────────────────────────────────────────────────────
# CHECK 5: library — blank required fields
# ──────────────────────────────────────────────────────────────────────────────
print("CHECK 5: library — blank required fields (reference_id, document_title, document_type)")
c5_bad = 0
for i, row in enumerate(lib_rows, 2):
    for field in ("reference_id", "document_title", "document_type"):
        if not row.get(field, "").strip():
            issue("5", f"library row {i}: blank required field '{field}'")
            c5_bad += 1
print(f"  → {c5_bad} blank required fields in library\n")

# ──────────────────────────────────────────────────────────────────────────────
# CHECK 6: quiz — true-false correct_answer must be 'true' or 'false'
# ──────────────────────────────────────────────────────────────────────────────
print("CHECK 6: pqcquiz — true-false correct_answer = 'true'/'false' only")
quiz_path = find_latest_csv("pqcquiz")
if quiz_path:
    quiz_rows, _ = parse_csv(quiz_path)
    print(f"  quiz file: {quiz_path.name}, {len(quiz_rows)} rows")
    c6_bad = 0
    for i, row in enumerate(quiz_rows, 2):
        if row.get("type", "").strip() == "true-false":
            ans = row.get("correct_answer", "").strip()
            if ans not in ("true", "false"):
                issue("6", f"quiz row {i} ({row.get('id','')}): true-false correct_answer='{ans}' (must be 'true'/'false')")
                c6_bad += 1
    print(f"  → {c6_bad} invalid true-false correct_answers\n")

# ──────────────────────────────────────────────────────────────────────────────
# SUMMARY
# ──────────────────────────────────────────────────────────────────────────────
print("=" * 70)
print(f"ISSUES ({len(issues)}):")
for iss in issues:
    print(f"  ✗ {iss}")

print()
print(f"WARNINGS ({len(warnings)}):")
for w in warnings[:40]:
    print(f"  ⚠ {w}")
if len(warnings) > 40:
    print(f"  … and {len(warnings)-40} more warnings")

print()
print(f"Total: {len(issues)} issues, {len(warnings)} warnings")
