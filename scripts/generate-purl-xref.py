#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-only
"""
Generate PURL cross-reference for the PQC product catalog.

Detects package registry from repository_url and constructs Package URLs (PURL spec).
Verifies npm and PyPI packages via their public JSON APIs.

Reads:  src/data/pqc_product_catalog_*.csv  (latest by filename date sort)
Writes: src/data/migrate_purl_xref_MMDDYYYY.csv

Usage:
  python3 scripts/generate-purl-xref.py
  python3 scripts/generate-purl-xref.py --dry-run
  python3 scripts/generate-purl-xref.py --all   (include commercial products)
  python3 scripts/generate-purl-xref.py --limit 20
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
OUTPUT = DATA_DIR / f"migrate_purl_xref_{TODAY}.csv"

DELAY_MS = 650

XREF_COLUMNS = [
    "software_name",
    "purl",
    "purl_type",
    "purl_namespace",
    "purl_name",
    "match_confidence",
    "status",
    "registry_url",
    "last_verified_date",
]

# ── Manual PURL overrides ─────────────────────────────────────────────────────
# Products where URL detection is insufficient or registry differs from repo URL.
PURL_MANUAL_MAP: dict[str, dict] = {
    "Bouncy Castle Java": {
        "purl": "pkg:maven/org.bouncycastle/bcprov-jdk18on",
        "purl_type": "maven",
        "purl_namespace": "org.bouncycastle",
        "purl_name": "bcprov-jdk18on",
        "registry_url": "https://mvnrepository.com/artifact/org.bouncycastle/bcprov-jdk18on",
        "match_confidence": "manual",
        "status": "matched",
    },
    "Bouncy Castle Java LTS": {
        "purl": "pkg:maven/org.bouncycastle/bcprov-lts8on",
        "purl_type": "maven",
        "purl_namespace": "org.bouncycastle",
        "purl_name": "bcprov-lts8on",
        "registry_url": "https://mvnrepository.com/artifact/org.bouncycastle/bcprov-lts8on",
        "match_confidence": "manual",
        "status": "matched",
    },
    "Bouncy Castle C# .NET": {
        "purl": "pkg:nuget/BouncyCastle.Cryptography",
        "purl_type": "nuget",
        "purl_namespace": "",
        "purl_name": "BouncyCastle.Cryptography",
        "registry_url": "https://www.nuget.org/packages/BouncyCastle.Cryptography",
        "match_confidence": "manual",
        "status": "matched",
    },
    "Go stdlib crypto/mlkem": {
        "purl": "pkg:go/golang.org/x/crypto",
        "purl_type": "go",
        "purl_namespace": "golang.org/x",
        "purl_name": "crypto",
        "registry_url": "https://pkg.go.dev/golang.org/x/crypto",
        "match_confidence": "manual",
        "status": "matched",
    },
    "BoringSSL": {
        "purl": "pkg:github/google/boringssl",
        "purl_type": "github",
        "purl_namespace": "google",
        "purl_name": "boringssl",
        "registry_url": "https://github.com/google/boringssl",
        "match_confidence": "manual",
        "status": "matched",
    },
    "AWS-LC": {
        "purl": "pkg:github/aws/aws-lc",
        "purl_type": "github",
        "purl_namespace": "aws",
        "purl_name": "aws-lc",
        "registry_url": "https://github.com/aws/aws-lc",
        "match_confidence": "manual",
        "status": "matched",
    },
    "RustCrypto ml-kem": {
        "purl": "pkg:cargo/ml-kem",
        "purl_type": "cargo",
        "purl_namespace": "",
        "purl_name": "ml-kem",
        "registry_url": "https://crates.io/crates/ml-kem",
        "match_confidence": "exact",
        "status": "matched",
    },
    "RustCrypto ml-dsa": {
        "purl": "pkg:cargo/ml-dsa",
        "purl_type": "cargo",
        "purl_namespace": "",
        "purl_name": "ml-dsa",
        "registry_url": "https://crates.io/crates/ml-dsa",
        "match_confidence": "exact",
        "status": "matched",
    },
    "RustCrypto slh-dsa": {
        "purl": "pkg:cargo/slh-dsa",
        "purl_type": "cargo",
        "purl_namespace": "",
        "purl_name": "slh-dsa",
        "registry_url": "https://crates.io/crates/slh-dsa",
        "match_confidence": "exact",
        "status": "matched",
    },
    "pqcrypto": {
        "purl": "pkg:cargo/pqcrypto",
        "purl_type": "cargo",
        "purl_namespace": "",
        "purl_name": "pqcrypto",
        "registry_url": "https://crates.io/crates/pqcrypto",
        "match_confidence": "exact",
        "status": "matched",
    },
    "Python cryptography": {
        "purl": "pkg:pypi/cryptography",
        "purl_type": "pypi",
        "purl_namespace": "",
        "purl_name": "cryptography",
        "registry_url": "https://pypi.org/project/cryptography/",
        "match_confidence": "manual",
        "status": "matched",
    },
    "OpenSSL": {
        "purl": "pkg:github/openssl/openssl",
        "purl_type": "github",
        "purl_namespace": "openssl",
        "purl_name": "openssl",
        "registry_url": "https://github.com/openssl/openssl",
        "match_confidence": "manual",
        "status": "matched",
    },
    "liboqs": {
        "purl": "pkg:github/open-quantum-safe/liboqs",
        "purl_type": "github",
        "purl_namespace": "open-quantum-safe",
        "purl_name": "liboqs",
        "registry_url": "https://github.com/open-quantum-safe/liboqs",
        "match_confidence": "exact",
        "status": "matched",
    },
    "liboqs-rust (oqs crate)": {
        "purl": "pkg:cargo/oqs",
        "purl_type": "cargo",
        "purl_namespace": "",
        "purl_name": "oqs",
        "registry_url": "https://crates.io/crates/oqs",
        "match_confidence": "exact",
        "status": "matched",
    },
    "liboqs-python": {
        "purl": "pkg:pypi/liboqs",
        "purl_type": "pypi",
        "purl_namespace": "",
        "purl_name": "liboqs",
        "registry_url": "https://pypi.org/project/liboqs/",
        "match_confidence": "exact",
        "status": "matched",
    },
    "GnuTLS": {
        "purl": "pkg:github/nicowillis/gnutls",
        "purl_type": "github",
        "purl_namespace": "gnutls",
        "purl_name": "gnutls",
        "registry_url": "https://gitlab.com/gnutls/gnutls",
        "match_confidence": "manual",
        "status": "matched",
    },
    "LibreSSL": {
        "purl": "pkg:github/libressl/portable",
        "purl_type": "github",
        "purl_namespace": "libressl",
        "purl_name": "portable",
        "registry_url": "https://github.com/libressl/portable",
        "match_confidence": "manual",
        "status": "matched",
    },
}

# Registry domain patterns
_CRATES_RE = re.compile(r"crates\.io/crates/([^/?#\s]+)")
_PYPI_RE = re.compile(r"pypi\.org/project/([^/?#\s]+)")
_NPM_RE = re.compile(r"npmjs\.com/package/((?:@[^/]+/)?[^/?#\s]+)")
_GO_RE = re.compile(r"pkg\.go\.dev/([^?#\s]+)")
_GITHUB_RE = re.compile(r"github\.com/([^/\s]+)/([^/?#\s]+?)(?:\.git)?(?:[/?#]|$)")
_MAVEN_RE = re.compile(r"(mvnrepository\.com|maven\.apache\.org)")


def detect_registry(repo_url: str) -> dict | None:
    if not repo_url:
        return None

    m = _CRATES_RE.search(repo_url)
    if m:
        name = m.group(1)
        return {
            "purl_type": "cargo", "purl_namespace": "", "purl_name": name,
            "registry_url": f"https://crates.io/crates/{name}",
            "match_confidence": "exact", "status": "matched",
        }

    m = _PYPI_RE.search(repo_url)
    if m:
        name = m.group(1).rstrip("/")
        return {
            "purl_type": "pypi", "purl_namespace": "", "purl_name": name,
            "registry_url": f"https://pypi.org/project/{name}/",
            "match_confidence": "exact", "status": "matched",
        }

    m = _NPM_RE.search(repo_url)
    if m:
        full = m.group(1)
        if full.startswith("@"):
            parts = full.split("/", 1)
            ns, name = parts[0], parts[1] if len(parts) > 1 else ""
        else:
            ns, name = "", full
        return {
            "purl_type": "npm", "purl_namespace": ns, "purl_name": name,
            "registry_url": f"https://www.npmjs.com/package/{full}",
            "match_confidence": "exact", "status": "matched",
        }

    m = _GO_RE.search(repo_url)
    if m:
        path = m.group(1).rstrip("/")
        parts = path.split("/")
        ns = "/".join(parts[:-1]) if len(parts) > 1 else ""
        name = parts[-1]
        return {
            "purl_type": "go", "purl_namespace": ns, "purl_name": name,
            "registry_url": f"https://pkg.go.dev/{path}",
            "match_confidence": "exact", "status": "matched",
        }

    m = _GITHUB_RE.search(repo_url)
    if m:
        owner, repo = m.group(1), m.group(2)
        return {
            "purl_type": "github", "purl_namespace": owner, "purl_name": repo,
            "registry_url": f"https://github.com/{owner}/{repo}",
            "match_confidence": "exact", "status": "matched",
        }

    if _MAVEN_RE.search(repo_url):
        return {
            "purl_type": "maven", "purl_namespace": "", "purl_name": "",
            "registry_url": repo_url,
            "match_confidence": "partial", "status": "matched",
        }

    return None


def is_candidate(row: dict, include_all: bool) -> bool:
    if include_all:
        return True
    if row.get("license_type", "").strip().lower() == "open source":
        return True
    repo = row.get("repository_url", "")
    registries = ("github.com", "npmjs.com", "pypi.org", "crates.io", "pkg.go.dev", "mvnrepository.com")
    return any(r in repo for r in registries)


def verify_npm(name: str) -> bool:
    url = f"https://registry.npmjs.org/{urllib.parse.quote(name, safe='@/')}"
    try:
        with urllib.request.urlopen(url, timeout=10) as r:
            return r.status == 200
    except Exception:
        return False


def verify_pypi(name: str) -> bool:
    url = f"https://pypi.org/pypi/{urllib.parse.quote(name)}/json"
    try:
        with urllib.request.urlopen(url, timeout=10) as r:
            return r.status == 200
    except Exception:
        return False


def build_purl(purl_type: str, namespace: str, name: str) -> str:
    if namespace:
        return f"pkg:{purl_type}/{namespace}/{name}"
    return f"pkg:{purl_type}/{name}"


def find_latest_catalog() -> Path:
    files = sorted(DATA_DIR.glob("pqc_product_catalog_*.csv"))
    if not files:
        raise FileNotFoundError("No pqc_product_catalog_*.csv found in src/data/")
    return files[-1]


def make_not_found(sw_name: str) -> dict:
    return {
        "software_name": sw_name,
        "purl": "", "purl_type": "", "purl_namespace": "", "purl_name": "",
        "match_confidence": "", "status": "not_found",
        "registry_url": "", "last_verified_date": TODAY_ISO,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate PURL xref from package registries")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--all", dest="include_all", action="store_true")
    parser.add_argument("--limit", type=int, default=0)
    args = parser.parse_args()

    catalog_path = find_latest_catalog()
    print(f"Reading: {catalog_path.name}")

    with open(catalog_path, newline="", encoding="utf-8") as f:
        products = list(csv.DictReader(f))

    if args.limit:
        products = products[: args.limit]

    total = len(products)
    counts = {"matched": 0, "not_found": 0}
    rows: list[dict] = []
    api_calls = 0

    for i, product in enumerate(products, 1):
        sw_name = product["software_name"]
        prefix = f"[{i:>4}/{total}] {sw_name[:50]:<50}"

        # Manual override takes highest priority
        if sw_name in PURL_MANUAL_MAP:
            entry = PURL_MANUAL_MAP[sw_name].copy()
            entry["software_name"] = sw_name
            entry["last_verified_date"] = TODAY_ISO
            purl = build_purl(entry["purl_type"], entry["purl_namespace"], entry["purl_name"])
            entry["purl"] = purl
            rows.append(entry)
            counts["matched"] += 1
            print(f"{prefix} → manual: {purl}")
            continue

        if not is_candidate(product, args.include_all):
            rows.append(make_not_found(sw_name))
            counts["not_found"] += 1
            if args.dry_run:
                print(f"{prefix} → skip (commercial/no registry)")
            continue

        repo_url = product.get("repository_url", "").strip()
        detected = detect_registry(repo_url)

        if detected is None:
            rows.append(make_not_found(sw_name))
            counts["not_found"] += 1
            print(f"{prefix} → not_found (no registry in URL)")
            continue

        if args.dry_run:
            purl = build_purl(detected["purl_type"], detected["purl_namespace"], detected["purl_name"])
            print(f"{prefix} → {detected['purl_type']}: {purl}")
            rows.append(make_not_found(sw_name))
            continue

        # Verify npm/pypi packages exist
        if detected["purl_type"] == "npm" and detected["purl_name"]:
            pkg = (detected["purl_namespace"] + "/" if detected["purl_namespace"] else "") + detected["purl_name"]
            if not verify_npm(pkg):
                detected["status"] = "not_found"
                detected["match_confidence"] = ""
            api_calls += 1
            time.sleep(DELAY_MS / 1000)
        elif detected["purl_type"] == "pypi" and detected["purl_name"]:
            if not verify_pypi(detected["purl_name"]):
                detected["status"] = "not_found"
                detected["match_confidence"] = ""
            api_calls += 1
            time.sleep(DELAY_MS / 1000)

        if detected["status"] == "not_found":
            rows.append(make_not_found(sw_name))
            counts["not_found"] += 1
            print(f"{prefix} → not_found (registry verify failed)")
        else:
            purl = build_purl(detected["purl_type"], detected["purl_namespace"], detected["purl_name"])
            rows.append({
                "software_name": sw_name,
                "purl": purl,
                "purl_type": detected["purl_type"],
                "purl_namespace": detected["purl_namespace"],
                "purl_name": detected["purl_name"],
                "match_confidence": detected["match_confidence"],
                "status": detected["status"],
                "registry_url": detected["registry_url"],
                "last_verified_date": TODAY_ISO,
            })
            counts["matched"] += 1
            print(f"{prefix} → {detected['purl_type']}: {purl}")

    rows.sort(key=lambda r: r["software_name"].lower())

    with open(OUTPUT, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=XREF_COLUMNS, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)

    print(f"\nWrote: {OUTPUT}")
    print(f"Matched: {counts['matched']}  Not found: {counts['not_found']}  API calls: {api_calls}")


if __name__ == "__main__":
    main()
