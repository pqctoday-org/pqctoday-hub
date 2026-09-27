#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-only
"""
Build src/data/acvp/rsa_oaep_test.json from the NIST ACVP-Server KTS-IFC sample.

WHY. The file used to hold one RSA-OAEP case generated with Node/OpenSSL, and its
_provenance said "RSA-OAEP has no NIST ACVP algorithm registration". That was
wrong: ACVP tests RSA-OAEP under KTS-IFC (SP 800-56B rev 2 key transport), not
under a directory named for OAEP. Maintainer decision 2026-09-26: replace
self-generated vectors with NIST ones where NIST has them.

WHAT. From gen-val/json-files/KTS-IFC-Sp800-56Br2/internalProjection.json at the
pinned commit (digest-checked before use), the two groups whose OAEP label is
empty (ktsConfiguration.associatedDataPattern == "" and encoding == "none"):
tgId 1 (SHA2-512) and tgId 3 (SHA-1), 10 cases each. Groups 2 and 4 carry a
non-empty label, which neither engine accepts by design (pSourceData must be
NULL), so they are not claimed. The same selection, mapping and independent
check the hsm harness uses (pqctoday-hsm tests/acvp/rsa_oaep_test.json).

In KTS-OAEP without a KDF the transported key IS the OAEP payload: iutC, the
initiator's ciphertext, decrypts under the server's private key to iutK. So:
  n/e/d/p/q  <- serverN/serverE/serverD/serverP/serverQ   (renamed, bytes verbatim)
  ct         <- iutC,  pt <- iutK                          (renamed, bytes verbatim)
  dp/dq/qi   computed from (d, p, q): ACVP does not publish the CRT triple
Every value copied is copied byte for byte (NIST's upper-case hex kept). Before
writing, every case is decrypted with python-cryptography (OAEP, MGF1 with the
same hash, no label) and must reproduce pt exactly; the script refuses otherwise.

  python3 scripts/acvp/build_kts_oaep_subset.py          # write
  python3 scripts/acvp/build_kts_oaep_subset.py --check  # verify the committed file
"""
from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import sys

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding, rsa

ROOT = pathlib.Path(__file__).resolve().parents[2]
REV = "975de31eb83d87039ec88934fdc47d8c312b892d"
UP_PATH = "gen-val/json-files/KTS-IFC-Sp800-56Br2/internalProjection.json"
UP_SHA256 = "f4afecd5fdd49dab985ae142285dfeb73326818c992417134ea75a09345fcab3"
UP_URL = f"https://raw.githubusercontent.com/usnistgov/ACVP-Server/{REV}/{UP_PATH}"
CACHE = ROOT / "tmp/acvp-upstream-cache" / f"{REV[:12]}__{UP_PATH.replace('/', '__')}"
OUT = ROOT / "src/data/acvp/rsa_oaep_test.json"
GROUPS = (1, 3)
HASHES = {"SHA-1": hashes.SHA1, "SHA2-512": hashes.SHA512}
RENAMES = {"serverN": "n", "serverE": "e", "serverD": "d", "serverP": "p", "serverQ": "q",
           "iutC": "ct", "iutK": "pt"}


def load_upstream() -> tuple[dict, str]:
    raw = CACHE.read_bytes() if CACHE.exists() else None
    if raw is None:
        import urllib.request
        req = urllib.request.Request(UP_URL, headers={"User-Agent": "Mozilla/5.0"})
        raw = urllib.request.urlopen(req, timeout=60).read()
        CACHE.parent.mkdir(parents=True, exist_ok=True)
        CACHE.write_bytes(raw)
    got = hashlib.sha256(raw).hexdigest()
    if got != UP_SHA256:
        sys.exit(f"upstream sha256 {got} != pinned {UP_SHA256}")
    return json.loads(raw), got


def hx(v: str) -> int:
    return int(v, 16)


def to_hex(i: int, like: str) -> str:
    """Upper-case hex, the upstream's own convention, even-length."""
    h = format(i, "X")
    return h if len(h) % 2 == 0 else "0" + h


def build() -> dict:
    up, sha = load_upstream()
    groups = []
    for g in up["testGroups"]:
        if g["tgId"] not in GROUPS:
            continue
        kc = g["ktsConfiguration"]
        assert kc["associatedDataPattern"] == "" and kc["encoding"] == "none", g["tgId"]
        halg = kc["hashAlg"]
        tests = []
        for t in g["tests"]:
            if not t.get("testPassed", True):
                continue
            case = {"tcId": t["tcId"]}
            for up_key, local in RENAMES.items():
                case[local] = t[up_key]
            n, e, d, p, q = (hx(case[k]) for k in ("n", "e", "d", "p", "q"))
            assert p * q == n, t["tcId"]
            case["dp"] = to_hex(d % (p - 1), case["d"])
            case["dq"] = to_hex(d % (q - 1), case["d"])
            case["qi"] = to_hex(pow(q, -1, p), case["d"])
            case["testPassed"] = t["testPassed"]
            # Independent check: python-cryptography must recover pt from ct.
            key = rsa.RSAPrivateNumbers(
                p, q, d, d % (p - 1), d % (q - 1), pow(q, -1, p), rsa.RSAPublicNumbers(e, n)
            ).private_key()
            h = HASHES[halg]()
            got = key.decrypt(bytes.fromhex(case["ct"]),
                              padding.OAEP(mgf=padding.MGF1(HASHES[halg]()), algorithm=h, label=None))
            if got != bytes.fromhex(case["pt"]):
                sys.exit(f"tcId {t['tcId']}: independent OAEP decrypt does not reproduce iutK")
            tests.append(case)
        groups.append({
            "tgId": g["tgId"],
            "testType": g["testType"],
            "scheme": g["scheme"],
            "kasRole": g["kasRole"],
            "modulo": g["modulo"],
            "ktsConfiguration": kc,
            "hashAlg": halg,
            "tests": tests,
        })
    return {
        "_provenance": {
            "producer": "NIST ACVP-Server (reference/generator-validated sample vectors)",
            "source_repo": "https://github.com/usnistgov/ACVP-Server",
            "source_commit": REV,
            "source_path": UP_PATH,
            "source_url": UP_URL,
            "source_sha256": sha,
            "retrieved": "2026-09-26",
            "generator": "python3 scripts/acvp/build_kts_oaep_subset.py (re-verify with --check)",
            "selection": "tgId 1 (OAEP SHA2-512) and tgId 3 (OAEP SHA-1): the two groups with an empty OAEP label (associatedDataPattern '' and encoding 'none'); every testPassed case, 20 in all. tgId 2 and 4 carry a non-empty label, which neither engine accepts by design, so they are not claimed.",
            "field_mapping": "n/e/d/p/q <- serverN/serverE/serverD/serverP/serverQ; ct <- iutC; pt <- iutK (in KTS-OAEP without a KDF the transported key is the OAEP payload); dp/dq/qi computed from (d, p, q) because ACVP does not publish the CRT triple. Group hashAlg copies ktsConfiguration.hashAlg; MGF1 uses the same hash.",
            "independent_check": "Every case decrypted with python-cryptography 49 (OAEP, MGF1 with the same hash, no label) before writing; 20/20 reproduce pt byte for byte.",
            "correction": "REPLACES a single Node/OpenSSL-generated case whose provenance said RSA-OAEP has no NIST ACVP registration. It has one: ACVP tests RSA-OAEP under KTS-IFC (SP 800-56B rev 2).",
            "known_divergence": "18 of the 20 keys have public exponents of 34-56 bits. The C++ engine (OpenSSL) accepts them; the Rust engine refuses any public exponent >= 2^33 by design (open gap rust-rsa-private-import-requires-cka-value, item 2). FIPS 186-5 allows them.",
        },
        "algorithm": "KTS-IFC",
        "revision": "Sp800-56Br2",
        "mode": "OAEP",
        "testGroups": groups,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    doc = build()
    if args.check:
        have = json.loads(OUT.read_text(encoding="utf-8"))
        if have != doc:
            print("FAIL rsa_oaep_test.json differs from a fresh build from the pinned upstream", file=sys.stderr)
            return 1
        print(f"OK   rsa_oaep_test.json  {sum(len(g['tests']) for g in doc['testGroups'])} cases match a fresh build")
        return 0
    OUT.write_text(json.dumps(doc, indent=2) + "\n", encoding="utf-8")
    print(f"WROTE {OUT.relative_to(ROOT)}  {sum(len(g['tests']) for g in doc['testGroups'])} cases, all independently decrypted")
    return 0


if __name__ == "__main__":
    sys.exit(main())
