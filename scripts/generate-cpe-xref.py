#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-only
"""
Generate CPE cross-reference for the PQC product catalog against NIST NVD CPE 2.3 API.

Reads:  src/data/pqc_product_catalog_*.csv  (latest by filename date sort)
Writes: src/data/migrate_cpe_xref_MMDDYYYY.csv

Usage:
  python3 scripts/generate-cpe-xref.py
  python3 scripts/generate-cpe-xref.py --nvd-api-key YOUR_KEY
  python3 scripts/generate-cpe-xref.py --dry-run
  python3 scripts/generate-cpe-xref.py --limit 20
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
OUTPUT = DATA_DIR / f"migrate_cpe_xref_{TODAY}.csv"

NVD_API_BASE = "https://services.nvd.nist.gov/rest/json/cpes/2.0"

# Without API key: 5 requests per 30 seconds → be conservative
DELAY_NO_KEY_MS = 6200
# With API key: 50 requests per 30 seconds
DELAY_WITH_KEY_MS = 650

XREF_COLUMNS = [
    "software_name",
    "cpe_uri",
    "cpe_vendor",
    "cpe_product",
    "match_confidence",
    "status",
    "nvd_url",
    "last_verified_date",
]

# ── Vendor normalization ─────────────────────────────────────────────────────

_STRIP_SUFFIXES = re.compile(
    r",?\s*\b(?:inc\.?|llc\.?|ltd\.?|limited|corporation|corp\.?|gmbh|se|ag|co\.?|plc|"
    r"pty|nv|sa|s\.?a\.?|the|a\s+division\s+of\s+\w+)\b\.?",
    re.IGNORECASE,
)

def normalize(name: str) -> str:
    name = _STRIP_SUFFIXES.sub("", name)
    return re.sub(r"\s+", " ", name).strip().lower()


# ── Manual CPE overrides ──────────────────────────────────────────────────────
# Maps software_name → (cpe_vendor, cpe_product) for known products where
# NVD keyword search is reliable.
CPE_MANUAL_MAP: dict[str, tuple[str, str]] = {
    "OpenSSL": ("openssl", "openssl"),
    "wolfSSL": ("wolfssl", "wolfssl"),
    "wolfBoot": ("wolfssl", "wolfboot"),
    "wolfCrypt": ("wolfssl", "wolfssl"),
    "BoringSSL": ("google", "chrome"),
    "liboqs": ("openquantumsafe", "liboqs"),
    "AWS-LC": ("amazon", "aws-lc"),
    "GnuTLS": ("gnu", "gnutls"),
    "LibreSSL": ("openbsd", "libressl"),
    "strongSwan": ("strongswan", "strongswan"),
    "OpenSSH": ("openbsd", "openssh"),
    "OpenVPN": ("openvpn", "openvpn"),
    "WireGuard": ("wireguard", "wireguard"),
    "Nginx": ("nginx", "nginx"),
    "Apache HTTP Server": ("apache", "http_server"),
    "HAProxy": ("haproxy", "haproxy"),
    "Let's Encrypt": ("letsencrypt", "certbot"),
    "Certbot": ("eff", "certbot"),
    "HashiCorp Vault": ("hashicorp", "vault"),
    "Kubernetes": ("kubernetes", "kubernetes"),
    "containerd": ("linuxfoundation", "containerd"),
    "Docker": ("docker", "docker"),
    "Python cryptography": ("cryptography.io", "cryptography"),
    "Node.js": ("nodejs", "node.js"),
    "Go": ("golang", "go"),
    "Rust": ("rust-lang", "rust"),
}


def extract_search_terms(software_name: str, row: dict) -> tuple[str, str]:
    """Return (vendor_term, product_term) for NVD keyword search."""
    if software_name in CPE_MANUAL_MAP:
        return CPE_MANUAL_MAP[software_name]

    # Use first word of software name as vendor hint, rest as product
    parts = software_name.split()
    vendor_term = normalize(parts[0]) if parts else normalize(software_name)
    product_term = normalize(" ".join(parts[1:]) if len(parts) > 1 else software_name)
    return vendor_term, product_term


# ── Scoring ─────────────────────────────────────────────────────────────────

def score_cpe(cpe_name: str, vendor_term: str, product_term: str) -> tuple[str, str]:
    """
    Returns (match_confidence, status).
    CPE 2.3 format: cpe:2.3:a:{vendor}:{product}:{version}:...
    """
    parts = cpe_name.split(":")
    if len(parts) < 5:
        return ("", "not_found")
    cpe_v = parts[3].lower().replace("_", " ").replace("-", " ")
    cpe_p = parts[4].lower().replace("_", " ").replace("-", " ")
    v_norm = vendor_term.replace("_", " ").replace("-", " ")
    p_norm = product_term.replace("_", " ").replace("-", " ")

    vendor_match = v_norm in cpe_v or cpe_v in v_norm
    product_match = p_norm in cpe_p or cpe_p in p_norm

    if vendor_match and product_match:
        return ("exact", "matched")
    if vendor_match:
        return ("partial", "partial")
    return ("", "not_found")


def parse_cpe_components(cpe_uri: str) -> tuple[str, str]:
    parts = cpe_uri.split(":")
    if len(parts) >= 5:
        return parts[3], parts[4]
    return "", ""


def build_nvd_url(vendor: str, product: str) -> str:
    kw = urllib.parse.quote(f"{vendor} {product}")
    return f"https://nvd.nist.gov/products/cpe/search#results?namingFormat=2.3&keyword={kw}"


# ── NVD API ─────────────────────────────────────────────────────────────────

def query_nvd(vendor: str, product: str, api_key: str | None) -> list[dict]:
    keyword = f"{vendor} {product}".strip()
    params = urllib.parse.urlencode({"keywordSearch": keyword, "resultsPerPage": 5})
    url = f"{NVD_API_BASE}?{params}"
    req = urllib.request.Request(url)
    if api_key:
        req.add_header("apiKey", api_key)
    req.add_header("Accept", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read())
            return data.get("products", [])
    except Exception as exc:
        print(f"  WARN: NVD request failed: {exc}", file=sys.stderr)
        return []


# ── CSV loading ──────────────────────────────────────────────────────────────

def find_latest_catalog() -> Path:
    files = sorted(DATA_DIR.glob("pqc_product_catalog_*.csv"))
    if not files:
        raise FileNotFoundError("No pqc_product_catalog_*.csv found in src/data/")
    return files[-1]


def make_not_found(sw_name: str) -> dict:
    return {
        "software_name": sw_name,
        "cpe_uri": "",
        "cpe_vendor": "",
        "cpe_product": "",
        "match_confidence": "",
        "status": "not_found",
        "nvd_url": "",
        "last_verified_date": TODAY_ISO,
    }


# ── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="Generate CPE xref from NVD")
    parser.add_argument("--nvd-api-key", dest="api_key", default=None)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--limit", type=int, default=0)
    args = parser.parse_args()

    delay_s = (DELAY_WITH_KEY_MS if args.api_key else DELAY_NO_KEY_MS) / 1000

    catalog_path = find_latest_catalog()
    print(f"Reading: {catalog_path.name}")

    with open(catalog_path, newline="", encoding="utf-8") as f:
        products = list(csv.DictReader(f))

    if args.limit:
        products = products[: args.limit]

    total = len(products)
    counts = {"matched": 0, "partial": 0, "not_found": 0}
    rows: list[dict] = []

    for i, product in enumerate(products, 1):
        sw_name = product["software_name"]
        vendor_term, product_term = extract_search_terms(sw_name, product)
        prefix = f"[{i:>4}/{total}] {sw_name[:50]:<50}"

        if args.dry_run:
            print(f"{prefix} → search: '{vendor_term} {product_term}'")
            rows.append(make_not_found(sw_name))
            continue

        cpe_items = query_nvd(vendor_term, product_term, args.api_key)

        best_uri = ""
        best_confidence = ""
        best_status = "not_found"

        for p in cpe_items:
            cpe = p.get("cpe", {})
            uri = cpe.get("cpeName", "")
            confidence, status = score_cpe(uri, vendor_term, product_term)
            if status in ("matched", "partial"):
                if best_status == "not_found" or confidence == "exact":
                    best_uri = uri
                    best_confidence = confidence
                    best_status = status
                if confidence == "exact":
                    break

        counts[best_status] += 1

        if best_uri:
            cpe_vendor, cpe_product = parse_cpe_components(best_uri)
            rows.append({
                "software_name": sw_name,
                "cpe_uri": best_uri,
                "cpe_vendor": cpe_vendor,
                "cpe_product": cpe_product,
                "match_confidence": best_confidence,
                "status": best_status,
                "nvd_url": build_nvd_url(vendor_term, product_term),
                "last_verified_date": TODAY_ISO,
            })
            print(f"{prefix} → {best_status} ({best_confidence}): {cpe_vendor}/{cpe_product}")
        else:
            rows.append(make_not_found(sw_name))
            print(f"{prefix} → not_found")

        time.sleep(delay_s)

    rows.sort(key=lambda r: r["software_name"].lower())

    with open(OUTPUT, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=XREF_COLUMNS, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)

    print(f"\nWrote: {OUTPUT}")
    print(f"Matched: {counts['matched']}  Partial: {counts['partial']}  Not found: {counts['not_found']}")


if __name__ == "__main__":
    main()
