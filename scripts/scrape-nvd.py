#!/usr/bin/env python3
"""
scripts/scrape-nvd.py

Builds a static CVE snapshot keyed by CPE for the Crypto Vulnerability Watch
Command Center tool. Reads the latest migrate_cpe_xref CSV, queries the NIST
NVD CVE 2.0 API for each matched/partial CPE, and writes a slim JSON to
public/data/cve-snapshot.json.

Severity filter: only MEDIUM, HIGH, CRITICAL records are retained (Low/None
are pure noise for this educational tool) — except a small curated set of
classic teaching CVEs (Heartbleed, POODLE, FREAK, Logjam, DROWN, BEAST),
pinned into the OpenSSL CPE bucket at the end of the run even though several
score LOW under modern CVSS v3. Without this, the per-CPE MEDIUM+ floor and
20-cap silently drop them (see git history: 77aa5d60, e936f1be) — pinning is
folded into this script, not a separate manual step, so every scheduled CI
run produces a complete snapshot unattended.

Pacing: 6 s between requests stays under NVD's 5 req / 30 s public-key-less
limit. Total runtime for ~97 CPEs at ~3 paginated requests each is ~30 min.

Usage:
  python3 scripts/scrape-nvd.py
  python3 scripts/scrape-nvd.py --limit 5            # subset for local smoke test
  python3 scripts/scrape-nvd.py --output /tmp/x.json
  python3 scripts/scrape-nvd.py --csv src/data/migrate_cpe_xref_04012026.csv
  python3 scripts/scrape-nvd.py --no-pin             # skip the educational-CVE pin step
"""
import argparse
import csv
import glob
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).parent.parent
DEFAULT_OUTPUT = ROOT / "public" / "data" / "cve-snapshot.json"
NVD_API = "https://services.nvd.nist.gov/rest/json/cves/2.0"
NVD_REF_BASE = "https://nvd.nist.gov/vuln/detail/"
# Reduced from 2000 → 500. NVD allows up to 2000 per page but the largest CPEs
# (Safari, Firefox, Chrome) return responses > 8 MB and the connection times
# out / IncompleteRead before the body finishes. 500 is well under the buffer
# pressure point and still keeps total request count reasonable.
RESULTS_PER_PAGE = 500
# Pacing: 6 s without an NVD API key (5 req / 30 s public ceiling); 0.65 s
# with a key (50 req / 30 s + safety buffer). Resolved at runtime in main().
PACE_PUBLIC = 6.0
PACE_KEYED = 0.65
RETRY_BACKOFF = [12.0, 30.0]  # backoff after 503 / network error
RETAINED_SEVERITIES = {"MEDIUM", "HIGH", "CRITICAL"}
SUMMARY_MAX_CHARS = 1000
# Per-CPE wall-clock budget. Browsers (Safari, Firefox, Chrome) sometimes return
# pathologically slow streams — without a budget they wedge the whole run. If
# we exceed this, we keep what we got and move on. CPE will be partial, not
# missing.
CPE_TIMEOUT_SECONDS = 90.0
PAGE_TIMEOUT_SECONDS = 30.0
# Educational cap: keep at most this many CVEs per CPE in the snapshot.
# After severity-then-date sort, this means: all Critical/High up to 20,
# then most-recent Medium to fill. Famous historical CVEs (Heartbleed,
# POODLE, BEAST) are pinned in separately (see pin_educational_cves below)
# so they survive this cap regardless of rank.
MAX_CVES_PER_CPE = 20

# The six classic teaching CVEs, pinned into the OpenSSL CPE bucket even when
# they don't survive MEDIUM+/rank filtering on their own. All six affect
# OpenSSL/SSL/TLS, and the migrate catalog maps the "openssl" product to
# exactly this CPE, so pinned entries surface in the Crypto Vulnerability
# Watch tool. Values below are the canonical NVD-published fallback used when
# a live re-fetch (attempted first, to pick up a fresher lastModified) fails.
OPENSSL_CPE = "cpe:2.3:a:openssl:openssl:-:*:*:*:*:*:*:*"
EDUCATIONAL_CVES: list[dict] = [
    {
        "cveId": "CVE-2014-0160",
        "summary": (
            "The (1) TLS and (2) DTLS implementations in OpenSSL 1.0.1 before 1.0.1g do not "
            "properly handle Heartbeat Extension packets, which allows remote attackers to "
            "obtain sensitive information from process memory via crafted packets that trigger "
            "a buffer over-read, as demonstrated by reading private keys, related to d1_both.c "
            "and t1_lib.c, aka the Heartbleed bug."
        ),
        "severity": "HIGH",
        "cvssScore": 7.5,
        "published": "2014-04-07",
        "lastModified": "2014-04-07",
    },
    {
        "cveId": "CVE-2014-3566",
        "summary": (
            "The SSL protocol 3.0, as used in OpenSSL through 1.0.1i and other products, uses "
            "nondeterministic CBC padding, which makes it easier for man-in-the-middle attackers "
            "to obtain cleartext data via a padding-oracle attack, aka the \"POODLE\" issue."
        ),
        "severity": "LOW",
        "cvssScore": 3.4,
        "published": "2014-10-15",
        "lastModified": "2014-10-15",
    },
    {
        "cveId": "CVE-2015-0204",
        "summary": (
            "The ssl3_get_key_exchange function in s3_clnt.c in OpenSSL before 0.9.8zd, 1.0.0 "
            "before 1.0.0p, and 1.0.1 before 1.0.1k allows remote SSL servers to conduct "
            "RSA-to-EXPORT_RSA downgrade attacks and facilitate brute-force decryption by "
            "offering a weak ephemeral RSA key in a noncompliant role, related to the \"FREAK\" issue."
        ),
        "severity": "LOW",
        "cvssScore": 3.7,
        "published": "2015-01-09",
        "lastModified": "2015-01-09",
    },
    {
        "cveId": "CVE-2015-4000",
        "summary": (
            "The TLS protocol 1.2 and earlier, when a DHE_EXPORT ciphersuite is enabled on a "
            "server but not on a client, does not properly convey a DHE_EXPORT choice, which "
            "allows man-in-the-middle attackers to conduct cipher-downgrade attacks by rewriting "
            "a ClientHello with DHE replaced by DHE_EXPORT and then rewriting a ServerHello with "
            "DHE_EXPORT replaced by DHE, aka the \"Logjam\" issue."
        ),
        "severity": "LOW",
        "cvssScore": 3.7,
        "published": "2015-05-21",
        "lastModified": "2015-05-21",
    },
    {
        "cveId": "CVE-2016-0800",
        "summary": (
            "The SSLv2 protocol, as used in OpenSSL before 1.0.1s and 1.0.2 before 1.0.2g and "
            "other products, requires a server to send a ServerVerify message before establishing "
            "that a client possesses certain plaintext RSA data, which makes it easier for remote "
            "attackers to decrypt TLS ciphertext data by leveraging a Bleichenbacher RSA padding "
            "oracle, aka the \"DROWN\" attack."
        ),
        "severity": "MEDIUM",
        "cvssScore": 5.9,
        "published": "2016-03-01",
        "lastModified": "2016-03-01",
    },
    {
        "cveId": "CVE-2011-3389",
        "summary": (
            "The SSL protocol, as used in certain configurations in Microsoft Windows and "
            "Microsoft Internet Explorer, Mozilla Firefox, Google Chrome, Opera, and other "
            "products, encrypts data by using CBC mode with chained initialization vectors, which "
            "allows man-in-the-middle attackers to obtain plaintext HTTP headers via a blockwise "
            "chosen-boundary attack (BCBA) on an HTTPS session, in conjunction with JavaScript "
            "code that uses (1) the HTML5 WebSocket API, (2) the Java URLConnection API, or (3) "
            "the Silverlight WebClient API, aka a \"BEAST\" attack."
        ),
        "severity": "MEDIUM",
        "cvssScore": 4.3,
        "published": "2011-09-06",
        "lastModified": "2011-09-06",
    },
]

# Resolved once in main(); module-level so helpers can reach them without
# threading kwargs through every call.
NVD_API_KEY: str | None = None
PACE_SECONDS: float = PACE_PUBLIC


def find_latest_csv() -> Path:
    pattern = str(ROOT / "src" / "data" / "migrate_cpe_xref_*.csv")
    matches = sorted(glob.glob(pattern))
    if not matches:
        sys.exit(f"No migrate_cpe_xref_*.csv found in src/data/")
    return Path(matches[-1])


def load_cpes(csv_path: Path) -> list[dict]:
    rows: list[dict] = []
    with csv_path.open(newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            cpe = (row.get("cpe_uri") or "").strip()
            status = (row.get("status") or "").strip()
            if not cpe or status not in {"matched", "partial"}:
                continue
            rows.append(
                {
                    "softwareName": (row.get("software_name") or "").strip(),
                    "cpeUri": cpe,
                    "vendor": (row.get("cpe_vendor") or "").strip(),
                    "product": (row.get("cpe_product") or "").strip(),
                }
            )
    # Dedupe on cpeUri (multiple products can share a CPE).
    seen: set[str] = set()
    unique: list[dict] = []
    for r in rows:
        if r["cpeUri"] in seen:
            continue
        seen.add(r["cpeUri"])
        unique.append(r)
    return unique


def extract_severity(cve: dict) -> tuple[str | None, float | None]:
    """Extract baseSeverity + baseScore. Prefer CVSS v3.1 → v3.0 → v2.
    Returns (severity, score) or (None, None) if no metric is present."""
    metrics = cve.get("metrics") or {}
    for key in ("cvssMetricV31", "cvssMetricV30"):
        items = metrics.get(key) or []
        if items:
            data = items[0].get("cvssData") or {}
            sev = (data.get("baseSeverity") or "").upper() or None
            score = data.get("baseScore")
            if sev:
                return sev, score
    items = metrics.get("cvssMetricV2") or []
    if items:
        data = items[0].get("cvssData") or {}
        score = data.get("baseScore")
        if score is None:
            return None, None
        if score >= 9.0:
            return "CRITICAL", score
        if score >= 7.0:
            return "HIGH", score
        if score >= 4.0:
            return "MEDIUM", score
        return "LOW", score
    return None, None


def slim_record(item: dict) -> dict | None:
    """Slim a single NVD vulnerability record. Returns None if dropped
    (no CVSS metric, or severity below MEDIUM)."""
    cve = item.get("cve") or {}
    cve_id = cve.get("id")
    if not cve_id:
        return None
    severity, score = extract_severity(cve)
    if severity not in RETAINED_SEVERITIES:
        return None
    descriptions = cve.get("descriptions") or []
    summary = ""
    for d in descriptions:
        if d.get("lang") == "en":
            summary = (d.get("value") or "").strip()
            break
    if len(summary) > SUMMARY_MAX_CHARS:
        summary = summary[: SUMMARY_MAX_CHARS - 1].rstrip() + "…"
    published = (cve.get("published") or "")[:10]
    last_modified = (cve.get("lastModified") or "")[:10]
    return {
        "cveId": cve_id,
        "summary": summary,
        "severity": severity,
        "cvssScore": score,
        "published": published,
        "lastModified": last_modified,
        "refUrl": NVD_REF_BASE + cve_id,
    }


def fetch_page(cpe_uri: str, start_index: int) -> dict:
    """One NVD API call. Returns parsed JSON. Raises on terminal failure."""
    params = {
        "cpeName": cpe_uri,
        "resultsPerPage": RESULTS_PER_PAGE,
        "startIndex": start_index,
    }
    url = f"{NVD_API}?{urllib.parse.urlencode(params)}"
    last_error: Exception | None = None
    for attempt, backoff in enumerate([0.0] + RETRY_BACKOFF):
        if backoff:
            time.sleep(backoff)
        try:
            headers = {"User-Agent": "pqctoday-hub/cve-snapshot-scraper"}
            if NVD_API_KEY:
                headers["apiKey"] = NVD_API_KEY
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=PAGE_TIMEOUT_SECONDS) as resp:  # noqa: S310 (NVD URL is constant)
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code in (403, 503, 429):
                last_error = RuntimeError(f"NVD {e.code} on {cpe_uri}")
                continue
            raise
        except (urllib.error.URLError, TimeoutError, ConnectionError) as e:
            last_error = e
            continue
    raise RuntimeError(f"NVD failed after retries: {last_error}")


def fetch_all_for_cpe(cpe_uri: str) -> tuple[list[dict], bool, int]:
    """Walk all pages for one CPE. Returns (slimmed records, partial_flag, nvd_total).

    nvd_total is the raw NVD totalResults from the first page (all severities,
    before our MEDIUM+ filter and the 20-cap). Stored in the snapshot so the UI
    can show "top 20 of X total CVEs in NVD" for educational context."""
    out: list[dict] = []
    start = 0
    page = 0
    started = time.time()
    partial = False
    nvd_total = 0  # totalResults reported by NVD (all severities)
    while True:
        if page > 0 or start > 0:
            time.sleep(PACE_SECONDS)
        if time.time() - started > CPE_TIMEOUT_SECONDS:
            partial = True
            break
        data = fetch_page(cpe_uri, start)
        vulns = data.get("vulnerabilities") or []
        total = int(data.get("totalResults") or 0)
        if page == 0:
            nvd_total = total  # capture once from the first page
        for item in vulns:
            slim = slim_record(item)
            if slim is not None:
                out.append(slim)
        start += len(vulns)
        page += 1
        if start >= total or not vulns:
            break
    # Sort by rank: severity (Critical → High → Medium), then CVSS score
    # (highest first), then publish date (most recent first). Truncate to
    # MAX_CVES_PER_CPE — keeps the highest-impact CVEs per product.
    sev_rank = {"CRITICAL": 3, "HIGH": 2, "MEDIUM": 1}
    out.sort(
        key=lambda r: (
            sev_rank.get(r["severity"], 0),
            r["cvssScore"] if r["cvssScore"] is not None else 0.0,
            r["published"],
        ),
        reverse=True,
    )
    return out[:MAX_CVES_PER_CPE], partial, nvd_total


def fetch_cve_by_id(cve_id: str, tries: int = 4) -> dict | None:
    """Best-effort live re-fetch of a single CVE by ID (used for the pinned
    educational set, to pick up a fresher lastModified). Returns None on any
    failure so the caller can fall back to the canonical record."""
    url = f"{NVD_API}?{urllib.parse.urlencode({'cveId': cve_id})}"
    headers = {"User-Agent": "pqctoday-hub/cve-snapshot-scraper"}
    if NVD_API_KEY:
        headers["apiKey"] = NVD_API_KEY
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=PAGE_TIMEOUT_SECONDS) as resp:  # noqa: S310
                data = json.loads(resp.read().decode("utf-8"))
            vulns = data.get("vulnerabilities") or []
            if not vulns:
                return None
            cve = vulns[0]["cve"]
            severity, score = extract_severity(cve)
            if severity is None:
                return None
            descriptions = cve.get("descriptions") or []
            summary = next((d["value"] for d in descriptions if d.get("lang") == "en"), "")
            return {
                "cveId": cve_id,
                "summary": summary,
                "severity": severity,
                "cvssScore": score,
                "published": (cve.get("published") or "")[:10],
                "lastModified": (cve.get("lastModified") or "")[:10],
                "refUrl": NVD_REF_BASE + cve_id,
                "pinned": True,
            }
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, ConnectionError):
            time.sleep(2.0 * (attempt + 1))
    return None


def pin_educational_cves(by_cpe: dict[str, list[dict]]) -> int:
    """Pin the six classic teaching CVEs into the OpenSSL CPE bucket, live
    re-fetch first then canonical fallback. No-op if the OpenSSL CPE wasn't
    part of this run's CPE set. Returns the count of pins applied.

    Pins are placed first (the teaching highlights), then the highest-ranked
    scraped CVEs that aren't already a pin, capped at
    max(MAX_CVES_PER_CPE, pin count) so the per-CPE size invariant holds."""
    bucket = by_cpe.get(OPENSSL_CPE)
    if bucket is None:
        return 0
    pins: list[dict] = []
    for entry in EDUCATIONAL_CVES:
        time.sleep(PACE_SECONDS)
        rec = fetch_cve_by_id(entry["cveId"])
        if rec is None:
            rec = {**entry, "refUrl": NVD_REF_BASE + entry["cveId"], "pinned": True}
        pins.append(rec)
    pin_ids = {p["cveId"] for p in pins}
    non_pin = [c for c in bucket if c["cveId"] not in pin_ids]
    by_cpe[OPENSSL_CPE] = (pins + non_pin)[: max(MAX_CVES_PER_CPE, len(pins))]
    return len(pins)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--csv", help="Override input CSV path")
    parser.add_argument("--output", help="Override output JSON path", default=str(DEFAULT_OUTPUT))
    parser.add_argument("--limit", type=int, default=0, help="Process only first N CPEs (for testing)")
    parser.add_argument("--no-pin", action="store_true", help="Skip the educational-CVE pin step")
    parser.add_argument("--verbose", "-v", action="store_true")
    args = parser.parse_args()

    # Resolve NVD key + pacing from env. No CLI flag — env-only per OWASP rule.
    global NVD_API_KEY, PACE_SECONDS
    NVD_API_KEY = (os.environ.get("NVD_API_KEY") or "").strip() or None
    PACE_SECONDS = PACE_KEYED if NVD_API_KEY else PACE_PUBLIC

    csv_path = Path(args.csv) if args.csv else find_latest_csv()
    output_path = Path(args.output)

    cpes = load_cpes(csv_path)
    if args.limit > 0:
        cpes = cpes[: args.limit]

    print(f"Source CSV : {csv_path.relative_to(ROOT) if csv_path.is_relative_to(ROOT) else csv_path}")
    print(f"Output     : {output_path}")
    print(f"CPEs queued: {len(cpes)}")
    print(f"NVD key    : {'present (50 req/30s)' if NVD_API_KEY else 'absent (5 req/30s)'}")
    print(f"Pace       : {PACE_SECONDS} s between requests")
    print(f"Severity   : MEDIUM | HIGH | CRITICAL only")
    print(f"Per-CPE cap: top {MAX_CVES_PER_CPE} by rank (severity → score → date)")
    print()

    by_cpe: dict[str, list[dict]] = {}
    total_by_cpe: dict[str, int] = {}
    skipped: list[tuple[str, str]] = []
    started = time.time()

    partial_count = 0
    for i, row in enumerate(cpes, 1):
        cpe = row["cpeUri"]
        if i > 1:
            time.sleep(PACE_SECONDS)
        try:
            records, partial, nvd_total = fetch_all_for_cpe(cpe)
            by_cpe[cpe] = records
            total_by_cpe[cpe] = nvd_total
            tag = " (partial — timeout)" if partial else ""
            if partial:
                partial_count += 1
            print(
                f"[{i:>3}/{len(cpes)}] {cpe[:70]:<70} → {len(records):>4} CVEs{tag}",
                flush=True,
            )
        except Exception as e:  # noqa: BLE001
            skipped.append((cpe, str(e)))
            print(f"[{i:>3}/{len(cpes)}] {cpe[:70]:<70} → SKIPPED: {e}", flush=True)

    pinned_count = 0
    if not args.no_pin:
        pinned_count = pin_educational_cves(by_cpe)
        if pinned_count:
            print(f"\nPinned {pinned_count} educational classics into {OPENSSL_CPE}")

    snapshot = {
        "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "sourceCsv": csv_path.name,
        "byCpe": by_cpe,
        "totalByCpe": total_by_cpe,
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as fh:
        json.dump(snapshot, fh, ensure_ascii=False, indent=0, separators=(",", ":"))

    elapsed = time.time() - started
    total_cves = sum(len(v) for v in by_cpe.values())
    size_mb = output_path.stat().st_size / 1_048_576
    print()
    print(f"Done. {len(by_cpe)} CPEs, {total_cves} CVEs, {size_mb:.1f} MB in {elapsed:.0f} s")
    if partial_count:
        print(f"Partial (timeout): {partial_count} — top-{MAX_CVES_PER_CPE} kept from what was fetched")
    if skipped:
        print(f"Skipped: {len(skipped)}")
        for cpe, err in skipped:
            print(f"  {cpe} :: {err}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
