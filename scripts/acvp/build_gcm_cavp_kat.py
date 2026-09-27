#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-only
"""
Build src/data/acvp/aesgcm_test.json from NIST's CAVP GCM test vectors.

WHY. The file held three AES-256-GCM cases generated with Node/OpenSSL (one reused
the GCM paper's Test Case 16 inputs without its AAD, so its tag matched nothing
published). Maintainer decision 2026-09-26: replace generated vectors with
trusted ones where they exist. NIST's pinned ACVP AES-GCM sample has AES-128
groups only; NIST's CAVP GCM response files have AES-256.

SOURCE, pinned by hash. gcmtestvectors.zip from
https://csrc.nist.gov/CSRC/media/Projects/Cryptographic-Algorithm-Validation-Program/documents/mac/gcmtestvectors.zip
(CAVS 14.0, generated 2012-08-31). Member gcmDecrypt256.rsp must hash to the
pinned value below; the script refuses anything else.

SELECTION. Every reader consumes AES-256, a 96-bit IV, a 128-bit tag and no AAD.
From gcmDecrypt256.rsp, the sections [Keylen = 256] [IVlen = 96] [AADlen = 0]
[Taglen = 128] with PTlen 128, 256 and 408 bits: the first case in each that
decrypts (not FAIL). Three non-empty plaintexts of 16, 32 and 51 bytes, the last
not a whole number of blocks. Each value is copied verbatim from the file, and
each case is recomputed with python-cryptography AESGCM; the script refuses to
write unless NIST's CT||Tag reproduces.

  python3 scripts/acvp/build_gcm_cavp_kat.py --rsp <gcmDecrypt256.rsp>          # write
  python3 scripts/acvp/build_gcm_cavp_kat.py --rsp <gcmDecrypt256.rsp> --check  # verify
"""
from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import sys

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "src/data/acvp/aesgcm_test.json"
ZIP_URL = ("https://csrc.nist.gov/CSRC/media/Projects/Cryptographic-Algorithm-Validation-Program/"
           "documents/mac/gcmtestvectors.zip")
RSP_SHA256 = "ed318735a517d5a85c82d2846c23dcf56e57a352fb0f0a163d9e7617a7bd12ad"
PT_LENS = (128, 256, 408)


def sections(text: str):
    """Yield (params, cases) for each bracketed parameter block of a CAVP .rsp file."""
    params: dict[str, int] = {}
    cases: list[dict[str, str]] = []
    cur: dict[str, str] | None = None
    in_header = False
    for raw in text.splitlines():
        ln = raw.strip()
        if ln.startswith("["):
            if not in_header and cases:
                yield dict(params), cases
                cases = []
            in_header = True
            k, v = ln.strip("[]").split("=")
            params[k.strip()] = int(v)
            continue
        in_header = False
        if ln.startswith("Count ="):
            cur = {"Count": ln.split("=", 1)[1].strip()}
            cases.append(cur)
        elif cur is not None and ln == "FAIL":
            cur["FAIL"] = "1"
        elif cur is not None and "=" in ln:
            k, v = ln.split("=", 1)
            cur[k.strip()] = v.strip()
    if cases:
        yield dict(params), cases


def build(rsp: pathlib.Path) -> dict:
    raw = rsp.read_bytes()
    got = hashlib.sha256(raw).hexdigest()
    if got != RSP_SHA256:
        sys.exit(f"gcmDecrypt256.rsp sha256 {got} != pinned {RSP_SHA256}")
    picked = []
    for params, cases in sections(raw.decode("ascii")):
        if (params.get("Keylen"), params.get("IVlen"), params.get("AADlen"), params.get("Taglen")) != (256, 96, 0, 128):
            continue
        if params.get("PTlen") not in PT_LENS:
            continue
        c = next(c for c in cases if "FAIL" not in c)
        key, iv, ct, tag, pt = (bytes.fromhex(c[k]) for k in ("Key", "IV", "CT", "Tag", "PT"))
        if AESGCM(key).encrypt(iv, pt, None) != ct + tag:
            sys.exit(f"PTlen {params['PTlen']} Count {c['Count']}: independent AES-GCM does not reproduce NIST's CT||Tag")
        picked.append({"ptLen": params["PTlen"], "count": int(c["Count"]),
                       "key": c["Key"], "iv": c["IV"], "pt": c["PT"], "ct": c["CT"], "tag": c["Tag"]})
    picked.sort(key=lambda t: t["ptLen"])
    if [t["ptLen"] for t in picked] != list(PT_LENS):
        sys.exit(f"found PTlen {[t['ptLen'] for t in picked]}, wanted {list(PT_LENS)}")
    return {
        "algorithm": "AES-GCM",
        "source": "NIST CAVP GCM test vectors (CAVS 14.0), gcmDecrypt256.rsp",
        "_provenance": {
            "producer": "NIST Cryptographic Algorithm Validation Program (CAVP) GCM test vectors, CAVS 14.0, generated 2012-08-31",
            "source_url": ZIP_URL,
            "source_member": "gcmDecrypt256.rsp",
            "source_sha256": RSP_SHA256,
            "retrieved": "2026-09-26",
            "generator": "python3 scripts/acvp/build_gcm_cavp_kat.py --rsp <gcmDecrypt256.rsp> (re-verify with --check)",
            "selection": "Sections [Keylen = 256] [IVlen = 96] [AADlen = 0] [Taglen = 128] with PTlen 128, 256 and 408: the first case in each that decrypts (not FAIL). The shape every reader consumes; plaintexts of 16, 32 and 51 bytes.",
            "field_mapping": "key <- Key; iv <- IV; pt <- PT; ct <- CT; tag <- Tag, verbatim. ptLen and count identify the source section and case.",
            "independent_check": "Every case recomputed with python-cryptography AESGCM; NIST's CT||Tag reproduces for all three.",
            "correction": "REPLACES three Node/OpenSSL-generated cases, one of which reused the GCM paper's Test Case 16 inputs without its AAD (so its tag matched nothing published).",
        },
        "testGroups": [{"keyLen": 256, "ivLen": 96, "tagLen": 128, "aadLen": 0, "direction": "decrypt", "tests": picked}],
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--rsp", required=True, type=pathlib.Path)
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    doc = build(a.rsp)
    if a.check:
        if json.loads(OUT.read_text(encoding="utf-8")) != doc:
            print("FAIL aesgcm_test.json differs from NIST's CAVP values", file=sys.stderr)
            return 1
        print("OK   aesgcm_test.json  3 cases match NIST CAVP gcmDecrypt256.rsp")
        return 0
    OUT.write_text(json.dumps(doc, indent=2) + "\n", encoding="utf-8")
    print(f"WROTE {OUT.relative_to(ROOT)}  3 cases from NIST CAVP gcmDecrypt256.rsp")
    return 0


if __name__ == "__main__":
    sys.exit(main())
