#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-only
"""
Check src/data/acvp/hkdf_test.json against RFC 5869 Appendix A.1-A.3.

WHY. The file carries HKDF-SHA-256 Test Cases 1-3 with no _provenance block. The
manifest (documentStatus rfc) cites RFC 5869; this script is the re-runnable
proof that the values came from it.

SOURCE, pinned by hash: https://www.rfc-editor.org/rfc/rfc5869.txt, sha256 below.
Appendix A is cut out of the text and each "A.n.  Test Case n" block's Hash, IKM,
salt, info, L and OKM are READ from it ("0x..." values joined across continuation
lines, "(0 octets)" read as empty, the stated octet count checked), never typed in.

SELECTION. Test Cases 1-3 (the SHA-256 ones) as tcId 1-3; Test Cases 4-7 (SHA-1)
are not carried, as the manifest lineage records. field mapping: ikm <- IKM;
salt <- salt; info <- info; okmLen <- L; okm <- OKM; PRK is not carried. The RFC
prints lower-case hex; the file's ikm/salt/info are lower case and its okm upper
case, so each document value is compared in the case the file uses (declared, per
field). Every case is also recomputed with an HKDF written over Python hmac/hashlib.

  python3 scripts/acvp/check_rfc5869_hkdf.py           # fetch the pinned RFC, print its values
  python3 scripts/acvp/check_rfc5869_hkdf.py --check   # verify (what the automated review runs)
"""
from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import pathlib
import re
import sys

from pinned_doc import ROOT, Compare, fetch, load, report

OUT = ROOT / "src/data/acvp/hkdf_test.json"
RFC_URL = "https://www.rfc-editor.org/rfc/rfc5869.txt"
RFC_SHA256 = "7a40eb3835b35fc947eb12a2ed614db079d43b26e50dbc537c31fba16397089c"
SELECT = (1, 2, 3)
FIELD = re.compile(r"^\s*(Hash|IKM|salt|info|L|PRK|OKM)\s*=\s*(.*)$")


def hkdf(hash_name: str, ikm: bytes, salt: bytes, info: bytes, length: int) -> bytes:
    """RFC 5869 section 2.2/2.3 over hmac + hashlib (independent of the document's values)."""
    h = getattr(hashlib, hash_name)
    prk = hmac.new(salt or b"\x00" * h().digest_size, ikm, h).digest()
    okm, t, i = b"", b"", 1
    while len(okm) < length:
        t = hmac.new(prk, t + info + bytes([i]), h).digest()
        okm, i = okm + t, i + 1
    return okm[:length]


def extract(raw: bytes) -> dict[int, dict]:
    text = raw.decode("ascii")
    start = text.rindex("\nAppendix A.  Test Vectors")  # the body heading, not the contents line
    out: dict[int, dict] = {}
    for m in re.finditer(r"\nA\.(\d)\.  Test Case (\d)\n(.*?)(?=\nA\.\d\.  Test Case|\Z)", text[start:], re.S):
        if m.group(1) != m.group(2):
            sys.exit(f"heading A.{m.group(1)} names Test Case {m.group(2)}")
        n, lines, tc = int(m.group(2)), m.group(3).split("\n"), {}
        if n not in SELECT:
            continue  # SHA-1 cases (one with an unprinted default salt) are not carried
        for i, ln in enumerate(lines):
            f = FIELD.match(ln)
            if not f:
                continue
            name, val = f.group(1), f.group(2).strip()
            if name in ("Hash", "L"):
                tc[name] = val
                continue
            parts = [val]
            for nxt in lines[i + 1:]:
                if re.fullmatch(r"\s+[0-9a-f]+( \(\d+ octets\))?\s*", nxt):
                    parts.append(nxt.strip())
                else:
                    break
            joined = " ".join(parts)
            v = re.fullmatch(r"(?:0x([0-9a-f ]+?))?\s*\((\d+) octets\)", joined)
            if not v:
                sys.exit(f"Test Case {n}: cannot read {name} from {joined!r}")
            hx = (v.group(1) or "").replace(" ", "")
            if len(hx) != 2 * int(v.group(2)):
                sys.exit(f"Test Case {n}: {name} is {len(hx)//2} octets, the RFC says {v.group(2)}")
            tc[name] = hx
        out[n] = tc
    for n in SELECT:
        if set(out.get(n, {})) != {"Hash", "IKM", "salt", "info", "L", "PRK", "OKM"}:
            sys.exit(f"Test Case {n}: read {sorted(out.get(n, {}))}")
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--rfc", type=pathlib.Path, help="local rfc5869.txt; omitted = fetch the pinned text")
    ap.add_argument("--file", type=pathlib.Path, default=OUT, help="vector file to check (default: the committed one)")
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    doc = extract(fetch("rfc5869.txt", RFC_URL, RFC_SHA256, a.rfc))
    if not a.check:
        print(json.dumps({n: doc[n] for n in SELECT}, indent=2))
        return 0
    f = load(a.file)
    c = Compare("hkdf_test")
    groups = f.get("testGroups", [])
    c.eq("file", "testGroups.length", len(groups), 1)
    g = groups[0] if groups else {}
    c.keys("testGroups[0]", g, {"hashAlg", "tests"})
    tests = g.get("tests", [])
    c.eq("testGroups[0]", "tests.length", len(tests), len(SELECT))
    bad = []
    for i, (t, n) in enumerate(zip(tests, SELECT)):
        w, tc = f"tests[{i}] (Test Case {n})", doc[n]
        c.eq(w, "hashAlg", g.get("hashAlg"), tc["Hash"])
        c.keys(w, t, {"tcId", "ikm", "salt", "info", "okmLen", "okm"})
        c.eq(w, "tcId", t.get("tcId"), n)
        c.hex(w, "ikm", t.get("ikm"), tc["IKM"])
        c.hex(w, "salt", t.get("salt"), tc["salt"])
        c.hex(w, "info", t.get("info"), tc["info"])
        c.eq(w, "okmLen", t.get("okmLen"), int(tc["L"]))
        c.hex(w, "okm", t.get("okm"), tc["OKM"])
        got = hkdf(tc["Hash"].replace("-", "").lower(), *(bytes.fromhex(tc[k]) for k in ("IKM", "salt", "info")), int(tc["L"]))
        if got.hex() != tc["OKM"]:
            bad.append(f"Test Case {n}: HKDF over hmac/hashlib does not reproduce the RFC's OKM")
    indep = [f"HKDF (RFC 5869 section 2) over Python hmac/hashlib reproduces the RFC's OKM for {len(SELECT) - len(bad)}/{len(SELECT)} test cases"]
    return report("hkdf_test.json", len(tests), "RFC 5869 Appendix A.1-A.3", c, indep, bad)


if __name__ == "__main__":
    sys.exit(main())
