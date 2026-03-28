#!/usr/bin/env python3
"""
scripts/audit-library-freshness.py

Checks each library CSV record for freshness by querying source APIs
(RFC Editor, IETF Datatracker, ETSI directory, GitHub, NIST CSRC)
and performs HTTP HEAD checks on remaining sources.

Outputs:
  - freshness-audit-MMDDYYYY.json  (structured results)
  - Console summary grouped by priority

Usage:
  python3 scripts/audit-library-freshness.py
  python3 scripts/audit-library-freshness.py --dry-run      # preview classification only
  python3 scripts/audit-library-freshness.py --category ietf # check only one category
  python3 scripts/audit-library-freshness.py --limit 10      # limit per category
"""

import csv
import json
import os
import re
import ssl
import sys
import time
from datetime import datetime
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

# ─── Constants ───────────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "src" / "data"
OUTPUT_DIR = ROOT / "scripts"
TODAY = datetime.now().strftime("%m%d%Y")

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)

# Rate limits per source (seconds between requests)
RATE_LIMITS = {
    "ietf_draft": 0.8,
    "rfc": 0.8,
    "nist": 2.0,
    "etsi": 1.0,
    "github": 1.0,
    "iso": 2.0,
    "other": 0.5,
}

# SSL context that doesn't verify (some gov sites have cert issues)
SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE


# ─── CSV Utilities ───────────────────────────────────────────────────────────
def find_latest_csv(prefix):
    """Find the latest CSV file matching prefix_MMDDYYYY*.csv pattern."""
    pattern = re.compile(rf"^{re.escape(prefix)}_(\d{{8}})(_r\d+)?\.csv$")
    candidates = []
    for f in DATA_DIR.iterdir():
        m = pattern.match(f.name)
        if m:
            date_str = m.group(1)
            rev = m.group(2) or ""
            candidates.append((date_str, rev, f))
    if not candidates:
        return None
    candidates.sort(key=lambda x: (x[0], x[1]))
    return candidates[-1][2]


def load_library_csv(path):
    """Load library CSV, return list of dicts."""
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return list(reader)


# ─── HTTP Helpers ────────────────────────────────────────────────────────────
def fetch_json(url, timeout=15):
    """Fetch URL and parse JSON response."""
    req = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    try:
        with urlopen(req, timeout=timeout, context=SSL_CTX) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as e:
        return {"_error": str(e)}


def fetch_text(url, timeout=15):
    """Fetch URL and return text content."""
    req = Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urlopen(req, timeout=timeout, context=SSL_CTX) as resp:
            return resp.read().decode("utf-8", errors="replace")
    except (HTTPError, URLError, TimeoutError) as e:
        return None


def http_head(url, timeout=10):
    """Perform HEAD request, return dict with status, content_length, last_modified, location."""
    req = Request(url, method="HEAD", headers={"User-Agent": USER_AGENT})
    try:
        with urlopen(req, timeout=timeout, context=SSL_CTX) as resp:
            return {
                "status": resp.status,
                "content_length": resp.headers.get("Content-Length"),
                "last_modified": resp.headers.get("Last-Modified"),
                "location": resp.headers.get("Location"),
            }
    except HTTPError as e:
        return {"status": e.code, "_error": str(e)}
    except (URLError, TimeoutError) as e:
        return {"status": 0, "_error": str(e)}


# ─── Record Classification ──────────────────────────────────────────────────
def classify_record(rec):
    """Classify a library record into a source category."""
    ref_id = rec["reference_id"]
    url = rec.get("download_url", "")
    domain = urlparse(url).netloc.lower() if url else ""

    # IETF Internet-Drafts
    if ref_id.lower().startswith("draft-"):
        return "ietf_draft"

    # RFCs (multiple naming patterns)
    if re.match(r"^(IETF\s+)?RFC[\s-]?\d+", ref_id, re.IGNORECASE):
        return "rfc"
    if ref_id == "IETF-MTC-Draft-09":
        return "ietf_draft"  # Merkle Tree Certs draft

    # NIST
    if any(d in domain for d in ["nist.gov", "csrc.nist.gov", "nccoe.nist.gov"]):
        return "nist"
    if ref_id.startswith(("FIPS ", "FIPS-", "NIST")):
        return "nist"

    # ETSI
    if "etsi.org" in domain or ref_id.startswith("ETSI"):
        return "etsi"

    # GitHub
    if "github.com" in domain:
        return "github"

    # ISO
    if "iso.org" in domain or ref_id.startswith("ISO"):
        return "iso"

    return "other"


# ─── RFC Checker ─────────────────────────────────────────────────────────────
def extract_rfc_number(ref_id):
    """Extract RFC number from various formats: 'RFC 9258', 'IETF RFC 9258', 'RFC-9258'."""
    m = re.search(r"RFC[\s-]?(\d+)", ref_id, re.IGNORECASE)
    return int(m.group(1)) if m else None


def check_rfc(rec):
    """Check a published RFC for obsolescence, updates, or status changes."""
    rfc_num = extract_rfc_number(rec["reference_id"])
    if not rfc_num:
        return {"status": "SKIP", "reason": "Cannot parse RFC number", "priority": "none"}

    data = fetch_json(f"https://www.rfc-editor.org/rfc/rfc{rfc_num}.json")
    if "_error" in data:
        return {"status": "CHECK_FAILED", "reason": data["_error"], "priority": "low"}

    result = {"rfc_number": rfc_num, "status": "CURRENT", "priority": "none", "details": {}}

    # Check obsoleted_by
    obs = data.get("obsoleted_by", [])
    if obs:
        result["status"] = "OBSOLETED"
        result["priority"] = "high"
        result["details"]["obsoleted_by"] = obs
        result["action"] = f"RFC {rfc_num} obsoleted by {', '.join(obs)}. Update document_status and add superseding RFC(s) to library."

    # Check updated_by
    upd = data.get("updated_by", [])
    if upd:
        if result["status"] != "OBSOLETED":
            result["status"] = "HAS_UPDATES"
            result["priority"] = "medium"
        result["details"]["updated_by"] = upd

    # Check status change
    api_status = data.get("current_status", "")
    our_status = rec.get("document_status", "")
    if api_status and api_status.lower() != our_status.lower():
        result["details"]["api_status"] = api_status
        result["details"]["our_status"] = our_status
        if result["status"] == "CURRENT":
            result["status"] = "STATUS_CHANGED"
            result["priority"] = "low"

    # Check errata
    errata = data.get("errata_url")
    if errata:
        result["details"]["errata_url"] = errata

    # Check publication date vs our date
    pub_date = data.get("pub_date", "")
    if pub_date:
        result["details"]["api_pub_date"] = pub_date

    return result


# ─── IETF Draft Checker ─────────────────────────────────────────────────────
def extract_draft_info(ref_id):
    """Extract base draft name and version from reference_id."""
    ref = ref_id.strip()
    # Match trailing version: -00, -01, ..., -17
    m = re.match(r"^(draft-.+?)-(\d{2})$", ref)
    if m:
        return m.group(1), int(m.group(2))
    # No version suffix (e.g., 'draft-ietf-ipsecme-ikev2-mlkem')
    return ref, None


def check_ietf_draft(rec):
    """Check an Internet-Draft for newer revisions or RFC publication."""
    base_name, our_rev = extract_draft_info(rec["reference_id"])

    # Try the Datatracker API
    data = fetch_json(f"https://datatracker.ietf.org/api/v1/doc/document/{base_name}/")
    if "_error" in data:
        # Try with trailing slash variants
        return {"status": "CHECK_FAILED", "reason": data["_error"], "priority": "low",
                "details": {"base_name": base_name}}

    result = {"base_name": base_name, "our_rev": our_rev, "status": "CURRENT",
              "priority": "none", "details": {}}

    # Check if published as RFC
    rfc = data.get("rfc")
    if rfc:
        # rfc field is a URL like "/api/v1/doc/document/rfcNNNN/"
        rfc_match = re.search(r"rfc(\d+)", str(rfc))
        rfc_num = rfc_match.group(1) if rfc_match else str(rfc)
        result["status"] = "PUBLISHED_AS_RFC"
        result["priority"] = "high"
        result["details"]["rfc_number"] = rfc_num
        result["action"] = (
            f"Draft {base_name} published as RFC {rfc_num}. "
            f"Update reference_id, download_url, document_status, document_title."
        )
        return result

    # Check latest revision
    api_rev = data.get("rev")
    if api_rev is not None:
        api_rev_int = int(api_rev)
        result["details"]["latest_rev"] = api_rev_int
        if our_rev is not None and api_rev_int > our_rev:
            result["status"] = "NEWER_REVISION"
            result["priority"] = "medium"
            result["details"]["rev_diff"] = api_rev_int - our_rev
            result["action"] = (
                f"Draft {base_name} has newer revision: -{api_rev_int:02d} (ours: -{our_rev:02d}). "
                f"Update reference_id suffix and re-download."
            )

    # Check if expired
    expires = data.get("expires")
    if expires:
        result["details"]["expires"] = expires
        try:
            exp_date = datetime.fromisoformat(expires.replace("Z", "+00:00"))
            if exp_date < datetime.now(exp_date.tzinfo):
                if result["status"] == "CURRENT":
                    result["status"] = "EXPIRED"
                    result["priority"] = "low"
        except (ValueError, TypeError):
            pass

    # Check std_level (if promoted to standard)
    std_level = data.get("std_level")
    if std_level:
        result["details"]["std_level"] = std_level

    return result


# ─── NIST Checker ────────────────────────────────────────────────────────────
def check_nist(rec):
    """Check NIST publication for updates or IPD→Final transitions."""
    ref_id = rec["reference_id"]
    url = rec.get("download_url", "")
    our_status = rec.get("document_status", "")

    result = {"status": "CURRENT", "priority": "none", "details": {}}

    # For IPDs, check if final version exists
    if "ipd" in url.lower() or "Initial Public Draft" in our_status or "Draft" in our_status:
        # Try constructing final URL from IPD URL
        final_url = url.replace("/ipd", "/final")
        if final_url != url:
            head = http_head(final_url)
            if head.get("status") == 200:
                result["status"] = "IPD_NOW_FINAL"
                result["priority"] = "high"
                result["details"]["final_url"] = final_url
                result["action"] = (
                    f"NIST {ref_id} IPD now published as final. "
                    f"Update download_url to {final_url}, document_status to 'Final'."
                )
                return result
            result["details"]["final_check"] = f"HTTP {head.get('status', 'error')} (still IPD)"

    # For CSRC pages, check the publication page for date updates
    if "csrc.nist.gov/pubs/" in url:
        page = fetch_text(url)
        if page:
            # Look for publication date in meta tags
            date_match = re.search(
                r'<meta\s+name="citation_publication_date"\s+content="([^"]+)"', page
            )
            if date_match:
                api_date = date_match.group(1)
                our_date = rec.get("last_update_date", "")
                result["details"]["api_date"] = api_date
                result["details"]["our_date"] = our_date
                if api_date > our_date:
                    result["status"] = "NEWER_DATE"
                    result["priority"] = "medium"
                    result["action"] = f"NIST {ref_id} has newer date: {api_date} (ours: {our_date})"

    # For nvlpubs PDFs, use GET with Range header (NIST rejects HEAD with 404)
    elif "nvlpubs.nist.gov" in url:
        req = Request(url, headers={"User-Agent": USER_AGENT, "Range": "bytes=0-0"})
        try:
            with urlopen(req, timeout=15, context=SSL_CTX) as resp:
                result["details"]["accessible"] = True
                lm = resp.headers.get("Last-Modified")
                if lm:
                    result["details"]["last_modified"] = lm
        except HTTPError as e:
            if e.code == 404:
                result["status"] = "URL_DEAD"
                result["priority"] = "high"
                result["details"]["http_status"] = 404
            elif e.code in (301, 302):
                result["status"] = "REDIRECTED"
                result["priority"] = "medium"
        except (URLError, TimeoutError):
            result["details"]["accessible"] = False

    return result


# ─── ETSI Checker ────────────────────────────────────────────────────────────
def parse_etsi_version(url):
    """Extract version tuple from ETSI URL. E.g., '01.02.01' -> (1, 2, 1)."""
    m = re.search(r"/(\d{2})\.(\d{2})\.(\d{2})_\d{2}/", url)
    if m:
        return (int(m.group(1)), int(m.group(2)), int(m.group(3)))
    return None


def get_etsi_parent_dir(url):
    """Get the parent directory URL for ETSI version checking."""
    # URL pattern: .../deliver/etsi_gs/QKD/001_099/004/02.01.01_60/...
    # Parent is everything up to and including the doc number dir
    m = re.match(r"(https://www\.etsi\.org/deliver/[^/]+/[^/]+/[^/]+/[^/]+/)", url)
    return m.group(1) if m else None


def check_etsi(rec):
    """Check ETSI document for newer versions via directory listing."""
    url = rec.get("download_url", "")
    ref_id = rec["reference_id"]

    result = {"status": "CURRENT", "priority": "none", "details": {}}

    our_version = parse_etsi_version(url)
    if not our_version:
        result["status"] = "SKIP"
        result["reason"] = "Cannot parse version from URL"
        return result

    parent_dir = get_etsi_parent_dir(url)
    if not parent_dir:
        result["status"] = "SKIP"
        result["reason"] = "Cannot determine parent directory"
        return result

    result["details"]["our_version"] = f"{our_version[0]:02d}.{our_version[1]:02d}.{our_version[2]:02d}"

    # Fetch directory listing
    html = fetch_text(parent_dir)
    if not html:
        result["status"] = "CHECK_FAILED"
        result["reason"] = "Cannot fetch ETSI directory listing"
        result["priority"] = "low"
        return result

    # Parse version directories
    versions = re.findall(r'href="(\d{2}\.\d{2}\.\d{2}_\d{2})/"', html)
    if not versions:
        # Also try without trailing slash
        versions = re.findall(r"(\d{2}\.\d{2}\.\d{2})_\d{2}", html)

    parsed_versions = []
    for v in versions:
        parts = re.match(r"(\d{2})\.(\d{2})\.(\d{2})", v)
        if parts:
            parsed_versions.append((int(parts.group(1)), int(parts.group(2)), int(parts.group(3))))

    if not parsed_versions:
        result["details"]["dir_listing"] = "No versions found in directory"
        return result

    latest = max(parsed_versions)
    result["details"]["latest_version"] = f"{latest[0]:02d}.{latest[1]:02d}.{latest[2]:02d}"
    result["details"]["all_versions"] = [
        f"{v[0]:02d}.{v[1]:02d}.{v[2]:02d}" for v in sorted(parsed_versions)
    ]

    if latest > our_version:
        result["status"] = "NEWER_VERSION"
        result["priority"] = "medium"
        # Construct new URL
        old_ver = f"{our_version[0]:02d}.{our_version[1]:02d}.{our_version[2]:02d}"
        new_ver = f"{latest[0]:02d}.{latest[1]:02d}.{latest[2]:02d}"
        new_url = url.replace(old_ver, new_ver)
        # Also update filename version in URL
        old_fname_ver = f"v{our_version[0]:02d}{our_version[1]:02d}{our_version[2]:02d}"
        new_fname_ver = f"v{latest[0]:02d}{latest[1]:02d}{latest[2]:02d}"
        new_url = new_url.replace(old_fname_ver, new_fname_ver)
        result["details"]["new_url"] = new_url
        result["action"] = (
            f"ETSI {ref_id} has newer version: {new_ver} (ours: {old_ver}). "
            f"Update download_url and re-download."
        )

    return result


# ─── GitHub Checker ──────────────────────────────────────────────────────────
def parse_github_url(url):
    """Parse GitHub URL into owner/repo and optional file path."""
    parsed = urlparse(url)
    parts = parsed.path.strip("/").split("/")
    if len(parts) < 2:
        return None, None, None
    owner, repo = parts[0], parts[1]
    # Check for blob/master/path pattern
    file_path = None
    if len(parts) > 4 and parts[2] == "blob":
        file_path = "/".join(parts[4:])  # skip blob/branch
    return owner, repo, file_path


def check_github(rec):
    """Check GitHub project for updates via API."""
    url = rec.get("download_url", "")
    ref_id = rec["reference_id"]
    owner, repo, file_path = parse_github_url(url)

    result = {"status": "CURRENT", "priority": "none", "details": {}}

    if not owner or not repo:
        result["status"] = "SKIP"
        result["reason"] = "Cannot parse GitHub URL"
        return result

    result["details"]["repo"] = f"{owner}/{repo}"

    if file_path:
        # File-based: check latest commit on that file
        api_url = f"https://api.github.com/repos/{owner}/{repo}/commits?path={file_path}&per_page=1"
        data = fetch_json(api_url)
        if isinstance(data, list) and len(data) > 0:
            commit_date = data[0].get("commit", {}).get("committer", {}).get("date", "")
            result["details"]["latest_commit_date"] = commit_date
            our_date = rec.get("last_update_date", "")
            if commit_date and our_date:
                # Compare YYYY-MM-DD
                api_date = commit_date[:10]
                if api_date > our_date:
                    result["status"] = "NEWER_COMMIT"
                    result["priority"] = "medium"
                    result["action"] = (
                        f"GitHub file {file_path} has newer commit: {api_date} (ours: {our_date})"
                    )
        elif isinstance(data, dict) and "_error" in data:
            result["status"] = "CHECK_FAILED"
            result["reason"] = data["_error"]
    else:
        # Repo-level: check latest release
        api_url = f"https://api.github.com/repos/{owner}/{repo}/releases/latest"
        data = fetch_json(api_url)
        if "_error" not in data:
            tag = data.get("tag_name", "")
            pub_date = data.get("published_at", "")[:10]
            result["details"]["latest_release"] = tag
            result["details"]["release_date"] = pub_date
            our_date = rec.get("last_update_date", "")
            if pub_date and our_date and pub_date > our_date:
                result["status"] = "NEWER_RELEASE"
                result["priority"] = "medium"
                result["action"] = (
                    f"GitHub {owner}/{repo} has newer release: {tag} ({pub_date}). "
                    f"Ours: {our_date}"
                )
        else:
            # No releases, check latest commit
            api_url = f"https://api.github.com/repos/{owner}/{repo}/commits?per_page=1"
            data = fetch_json(api_url)
            if isinstance(data, list) and len(data) > 0:
                commit_date = data[0].get("commit", {}).get("committer", {}).get("date", "")[:10]
                result["details"]["latest_commit_date"] = commit_date

    return result


# ─── ISO Checker ─────────────────────────────────────────────────────────────
def check_iso(rec):
    """Check ISO catalog page for revision or withdrawal status."""
    url = rec.get("download_url", "")
    ref_id = rec["reference_id"]

    result = {"status": "CURRENT", "priority": "none", "details": {}}

    head = http_head(url)
    status = head.get("status", 0)

    if status in (301, 302):
        result["status"] = "REDIRECTED"
        result["priority"] = "medium"
        result["details"]["redirect_to"] = head.get("location")
        result["action"] = f"ISO {ref_id} page redirects — may be superseded or renumbered"
    elif status == 404:
        result["status"] = "URL_DEAD"
        result["priority"] = "high"
        result["action"] = f"ISO {ref_id} URL returns 404 — may have been withdrawn"
    elif status == 200:
        # Try to fetch page and check for withdrawal/revision notices
        page = fetch_text(url)
        if page:
            if "This standard has been revised by" in page or "Revised by" in page:
                result["status"] = "REVISED"
                result["priority"] = "high"
                # Try to extract the superseding standard
                m = re.search(r"revised by.*?(ISO/IEC\s+\d[\w.:-]+)", page, re.IGNORECASE)
                if m:
                    result["details"]["revised_by"] = m.group(1)
                result["action"] = f"ISO {ref_id} has been revised"
            elif "Withdrawn" in page:
                result["status"] = "WITHDRAWN"
                result["priority"] = "high"
                result["action"] = f"ISO {ref_id} has been withdrawn"
            else:
                result["details"]["page_accessible"] = True

    return result


# ─── Other/Generic Checker ───────────────────────────────────────────────────
def check_other(rec):
    """HTTP HEAD check for generic sources — detect dead links, redirects, size changes."""
    url = rec.get("download_url", "")
    ref_id = rec["reference_id"]
    local_file = rec.get("local_file", "")

    result = {"status": "CURRENT", "priority": "none", "details": {}}

    if not url:
        result["status"] = "NO_URL"
        result["priority"] = "low"
        return result

    head = http_head(url)
    status = head.get("status", 0)
    result["details"]["http_status"] = status

    if status == 0:
        result["status"] = "UNREACHABLE"
        result["priority"] = "low"
        result["details"]["error"] = head.get("_error", "unknown")
    elif status in (301, 302):
        result["status"] = "REDIRECTED"
        result["priority"] = "low"
        result["details"]["redirect_to"] = head.get("location")
    elif status == 404:
        result["status"] = "URL_DEAD"
        result["priority"] = "medium"
        result["action"] = f"{ref_id} URL returns 404 — page may have moved"
    elif status in (401, 403):
        result["status"] = "ACCESS_DENIED"
        result["priority"] = "low"
    elif status == 200:
        # Compare content size with local file
        content_length = head.get("content_length")
        last_modified = head.get("last_modified")
        if last_modified:
            result["details"]["server_last_modified"] = last_modified
        if content_length and local_file:
            remote_size = int(content_length)
            if remote_size > 0:  # Skip when server returns 0 (no Content-Length)
                local_path = ROOT / local_file
                if local_path.exists():
                    local_size = local_path.stat().st_size
                    size_diff = abs(remote_size - local_size)
                    pct_diff = (size_diff / max(local_size, 1)) * 100
                    result["details"]["local_size"] = local_size
                    result["details"]["remote_size"] = remote_size
                    if size_diff > 5000 and pct_diff > 10:
                        result["status"] = "SIZE_CHANGED"
                        result["priority"] = "medium"
                        result["details"]["size_diff_bytes"] = size_diff
                        result["details"]["size_diff_pct"] = round(pct_diff, 1)
                        result["action"] = (
                            f"{ref_id} content size changed by {pct_diff:.0f}% "
                            f"({size_diff} bytes) — may have been updated"
                        )

    return result


# ─── Main Orchestrator ───────────────────────────────────────────────────────
CHECKERS = {
    "ietf_draft": check_ietf_draft,
    "rfc": check_rfc,
    "nist": check_nist,
    "etsi": check_etsi,
    "github": check_github,
    "iso": check_iso,
    "other": check_other,
}

CATEGORY_LABELS = {
    "ietf_draft": "IETF Internet-Drafts",
    "rfc": "Published RFCs",
    "nist": "NIST Publications",
    "etsi": "ETSI Standards",
    "github": "GitHub Projects",
    "iso": "ISO Standards",
    "other": "Other Sources",
}


def run_audit(csv_path, dry_run=False, category_filter=None, limit=None):
    """Run the freshness audit across all records."""
    records = load_library_csv(csv_path)
    print(f"Loaded {len(records)} records from {csv_path.name}")

    # Classify records
    classified = {}
    for rec in records:
        cat = classify_record(rec)
        classified.setdefault(cat, []).append(rec)

    print("\n── Record Classification ──")
    for cat in CHECKERS:
        count = len(classified.get(cat, []))
        label = CATEGORY_LABELS.get(cat, cat)
        marker = " ← FILTER" if category_filter and cat == category_filter else ""
        print(f"  {label:30s} {count:4d}{marker}")
    print()

    if dry_run:
        print("DRY RUN — no API calls made.")
        return

    # Run checks
    all_results = []
    categories_to_check = [category_filter] if category_filter else list(CHECKERS.keys())

    for cat in categories_to_check:
        recs = classified.get(cat, [])
        if not recs:
            continue

        if limit:
            recs = recs[:limit]

        checker = CHECKERS[cat]
        label = CATEGORY_LABELS.get(cat, cat)
        delay = RATE_LIMITS.get(cat, 1.0)

        print(f"── Checking {label} ({len(recs)} records, {delay}s delay) ──")

        for i, rec in enumerate(recs):
            ref_id = rec["reference_id"]
            sys.stdout.write(f"  [{i+1}/{len(recs)}] {ref_id[:60]}...")
            sys.stdout.flush()

            try:
                result = checker(rec)
            except Exception as e:
                result = {"status": "ERROR", "priority": "low", "reason": str(e)}

            result["reference_id"] = ref_id
            result["category"] = cat
            result["document_title"] = rec.get("document_title", "")
            result["download_url"] = rec.get("download_url", "")
            result["our_last_update"] = rec.get("last_update_date", "")
            result["our_status"] = rec.get("document_status", "")

            status_icon = {
                "CURRENT": "✓",
                "PUBLISHED_AS_RFC": "★",
                "NEWER_REVISION": "↑",
                "NEWER_VERSION": "↑",
                "NEWER_RELEASE": "↑",
                "NEWER_COMMIT": "↑",
                "NEWER_DATE": "↑",
                "IPD_NOW_FINAL": "★",
                "OBSOLETED": "✗",
                "HAS_UPDATES": "~",
                "STATUS_CHANGED": "~",
                "EXPIRED": "⌛",
                "REDIRECTED": "→",
                "URL_DEAD": "✗",
                "REVISED": "↑",
                "WITHDRAWN": "✗",
                "SIZE_CHANGED": "Δ",
            }.get(result["status"], "?")

            print(f" {status_icon} {result['status']}")
            all_results.append(result)

            if i < len(recs) - 1:
                time.sleep(delay)

        print()

    # ── Output ──
    # Separate stale from current
    stale = [r for r in all_results if r["status"] not in ("CURRENT", "SKIP", "CHECK_FAILED", "ERROR", "NO_URL", "ACCESS_DENIED", "UNREACHABLE")]
    current = [r for r in all_results if r["status"] == "CURRENT"]
    failed = [r for r in all_results if r["status"] in ("CHECK_FAILED", "ERROR", "UNREACHABLE")]

    # Summary
    summary = {
        "audit_date": datetime.now().isoformat(),
        "source_csv": csv_path.name,
        "total_checked": len(all_results),
        "stale": len(stale),
        "current": len(current),
        "check_failed": len(failed),
        "by_status": {},
        "by_priority": {"high": 0, "medium": 0, "low": 0, "none": 0},
    }

    for r in all_results:
        s = r["status"]
        summary["by_status"][s] = summary["by_status"].get(s, 0) + 1
        p = r.get("priority", "none")
        summary["by_priority"][p] = summary["by_priority"].get(p, 0) + 1

    # Write JSON report
    report = {"summary": summary, "results": all_results}
    output_path = OUTPUT_DIR / f"freshness-audit-{TODAY}.json"
    with open(output_path, "w") as f:
        json.dump(report, f, indent=2, default=str)
    print(f"Report written to {output_path}")

    # Console summary
    print("\n" + "=" * 70)
    print("FRESHNESS AUDIT SUMMARY")
    print("=" * 70)
    print(f"  Total checked:  {summary['total_checked']}")
    print(f"  Current:        {summary['current']}")
    print(f"  Stale/Updated:  {summary['stale']}")
    print(f"  Check failed:   {summary['check_failed']}")
    print()

    # Group stale by priority
    for priority in ("high", "medium", "low"):
        items = [r for r in stale if r.get("priority") == priority]
        if not items:
            continue
        print(f"── {priority.upper()} PRIORITY ({len(items)}) ──")
        for r in items:
            ref = r["reference_id"]
            status = r["status"]
            action = r.get("action", "Review needed")
            cat_label = CATEGORY_LABELS.get(r["category"], r["category"])
            print(f"  [{cat_label}] {ref}")
            print(f"    Status: {status}")
            print(f"    Action: {action}")
            details = r.get("details", {})
            for k, v in details.items():
                if k not in ("api_date", "our_date") and not k.startswith("_"):
                    print(f"    {k}: {v}")
            print()

    return report


# ─── CLI ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Audit library CSV for stale documents")
    parser.add_argument("--dry-run", action="store_true", help="Print classification only, no API calls")
    parser.add_argument("--category", choices=list(CHECKERS.keys()),
                        help="Check only one category")
    parser.add_argument("--limit", type=int, help="Limit records per category")
    args = parser.parse_args()

    csv_path = find_latest_csv("library")
    if not csv_path:
        print("ERROR: No library CSV found in src/data/")
        sys.exit(1)

    print(f"Using CSV: {csv_path}")
    run_audit(csv_path, dry_run=args.dry_run, category_filter=args.category, limit=args.limit)
