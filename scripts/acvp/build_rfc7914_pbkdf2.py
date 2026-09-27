#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-only
"""
Build src/data/acvp/pbkdf2_rfc7914_test.json from RFC 7914 section 11.

WHY. pbkdf2_test.json's PBKDF2-HMAC-SHA-256 cases were generated with Node/OpenSSL.
Maintainer decision 2026-09-26: replace generated vectors with trusted ones where
they exist. NIST's pinned ACVP PBKDF sample registers HMAC-SHA2-224 only, so NIST
has no SHA-256 case. RFC 7914 section 11 ("Test Vectors for PBKDF2 with
HMAC-SHA-256") publishes two, and a consensus RFC is admitted as
published-standard-kat (evidenceClasses.ts, boundary settled 2026-09-26).
PBKDF2-HMAC-SHA-512 has no published vectors in any standard, so those cases
stay in pbkdf2_test.json, labelled as generated.

SOURCE, pinned by hash: https://www.rfc-editor.org/rfc/rfc7914.txt, sha256 below.
Values are READ from the RFC text (the hex blocks under each
"PBKDF2-HMAC-SHA-256 (P=..., S=..., c=..., dkLen=...) =" heading), never typed
in, and each is recomputed with Python's hashlib.pbkdf2_hmac before writing.

  python3 scripts/acvp/build_rfc7914_pbkdf2.py           # fetch the pinned RFC and write
  python3 scripts/acvp/build_rfc7914_pbkdf2.py --check   # verify (what the automated review runs)
"""
from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "src/data/acvp/pbkdf2_rfc7914_test.json"
RFC_URL = "https://www.rfc-editor.org/rfc/rfc7914.txt"
RFC_SHA256 = "df55932f8b6a5d271f36a634d91a25903724e189ba6c120bf7257cd47f10b197"
CACHE = ROOT / "tmp/acvp-upstream-cache/docs"
HEAD = re.compile(r'PBKDF2-HMAC-SHA-256 \(P="([^"]*)", S="([^"]*)",\s*c=(\d+), dkLen=(\d+)\) =', re.S)


def fetch_rfc() -> pathlib.Path:
    """Download the RFC text into the gitignored cache (hash checked in extract)."""
    import urllib.request
    CACHE.mkdir(parents=True, exist_ok=True)
    out = CACHE / "rfc7914.txt"
    if not out.exists() or hashlib.sha256(out.read_bytes()).hexdigest() != RFC_SHA256:
        req = urllib.request.Request(RFC_URL, headers={"User-Agent": "Mozilla/5.0"})
        out.write_bytes(urllib.request.urlopen(req, timeout=60).read())
    return out


def extract(rfc: pathlib.Path) -> list[dict]:
    raw = rfc.read_bytes()
    got = hashlib.sha256(raw).hexdigest()
    if got != RFC_SHA256:
        sys.exit(f"rfc7914.txt sha256 {got} != pinned {RFC_SHA256}")
    text = raw.decode("ascii")
    sec = text[text.index("11.  Test Vectors for PBKDF2 with HMAC-SHA-256"):text.index("12.  Test Vectors for scrypt")]
    out = []
    for m in HEAD.finditer(sec):
        p, s, c, dklen = m.group(1), m.group(2), int(m.group(3)), int(m.group(4))
        rest = sec[m.end():]
        hexlines = []
        for ln in rest.split("\n")[1:]:
            if re.fullmatch(r"\s*([0-9a-f]{2}( [0-9a-f]{2})*)\s*", ln):
                hexlines.append(ln.strip())
            elif hexlines:
                break
        dk = "".join(hexlines).replace(" ", "")
        if len(dk) != 2 * dklen:
            sys.exit(f"P={p!r}: read {len(dk)//2} bytes, dkLen says {dklen}")
        if hashlib.pbkdf2_hmac("sha256", p.encode(), s.encode(), c, dklen).hex() != dk:
            sys.exit(f"P={p!r}: hashlib does not reproduce the RFC's value")
        out.append({"password": p.encode().hex(), "salt": s.encode().hex(), "iterations": c, "dkLen": dklen,
                     "dk": dk, "passwordText": p, "saltText": s})
    if len(out) != 2:
        sys.exit(f"found {len(out)} vectors in section 11, wanted 2")
    return out


def build(rfc: pathlib.Path) -> dict:
    tests = [{"tcId": i + 1, **v} for i, v in enumerate(extract(rfc))]
    return {
        "algorithm": "PBKDF2",
        "source": "RFC 7914 section 11, Test Vectors for PBKDF2 with HMAC-SHA-256",
        "_provenance": {
            "producer": "IETF RFC 7914 (The scrypt Password-Based Key Derivation Function), section 11",
            "source_url": RFC_URL,
            "source_sha256": RFC_SHA256,
            "retrieved": "2026-09-26",
            "generator": "python3 scripts/acvp/build_rfc7914_pbkdf2.py (re-verify with --check)",
            "selection": "Both vectors the section prints. tcId 1 (c = 1) is below the Rust engine's 1000-iteration floor, which it refuses by policy (open gap pbkdf2-min-iterations-divergence); readers default to tcId 2 (c = 80000).",
            "field_mapping": "password/salt are the RFC's ASCII strings hex-encoded (the text also kept as passwordText/saltText); iterations <- c; dkLen <- dkLen; dk <- the hex block, whitespace removed.",
            "independent_check": "Both recomputed with Python hashlib.pbkdf2_hmac('sha256'); both reproduce the RFC's value.",
            "correction": "REPLACES pbkdf2_test.json's three Node/OpenSSL-generated PBKDF2-HMAC-SHA-256 cases.",
        },
        "testGroups": [{"prf": "HMAC-SHA256", "keyLen": 512, "tests": tests}],
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--rfc", type=pathlib.Path, help="local rfc7914.txt; omitted = fetch the pinned text")
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    doc = build(a.rfc or fetch_rfc())
    if a.check:
        if json.loads(OUT.read_text(encoding="utf-8")) != doc:
            print("FAIL pbkdf2_rfc7914_test.json differs from RFC 7914 section 11", file=sys.stderr)
            return 1
        print("OK   pbkdf2_rfc7914_test.json  2 cases match RFC 7914 section 11")
        return 0
    OUT.write_text(json.dumps(doc, indent=2) + "\n", encoding="utf-8")
    print(f"WROTE {OUT.relative_to(ROOT)}  2 cases from RFC 7914 section 11")
    return 0


if __name__ == "__main__":
    sys.exit(main())
