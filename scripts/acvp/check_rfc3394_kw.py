#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-only
"""
Check src/data/acvp/aeskw_test.json against RFC 3394 section 4.6.

WHY. The file carries one AES Key Wrap case (256-bit key data, 256-bit KEK),
attributed to RFC 3394 section 4.6 and to an OpenSSL CLI re-verification, with no
pinned document. The manifest (documentStatus rfc) cites RFC 3394; this script is
the re-runnable proof that the values came from it.

SOURCE, pinned by hash: https://www.rfc-editor.org/rfc/rfc3394.txt, sha256 below.
Section "4.6 Wrap 256 bits of Key Data with a 256-bit KEK" is cut out of the text
and its Input "KEK:" / "Key Data:" values and its wrap Output "Ciphertext" (three
64-bit words on the first line, two on the next) are READ from it, never typed in.

SELECTION. The one example section 4.6 prints. The RFC prints upper-case hex; the
file uses lower case, so the document values are lower-cased before comparing.
The case is also recomputed with python-cryptography aes_key_wrap (and unwrapped).

  python3 scripts/acvp/check_rfc3394_kw.py           # fetch the pinned RFC, print its values
  python3 scripts/acvp/check_rfc3394_kw.py --check   # verify (what the automated review runs)
"""
from __future__ import annotations

import argparse
import json
import pathlib
import sys

from cryptography.hazmat.primitives.keywrap import aes_key_unwrap, aes_key_wrap

from pinned_doc import ROOT, Compare, fetch, hex_run, load, report

OUT = ROOT / "src/data/acvp/aeskw_test.json"
RFC_URL = "https://www.rfc-editor.org/rfc/rfc3394.txt"
RFC_SHA256 = "faa400c69c22e5f4a911222dc19c17091931a4b8c0658adc7011163e63b253ff"


def extract(raw: bytes) -> dict:
    text = raw.decode("ascii")
    start = text.rindex("\n4.6 Wrap 256 bits of Key Data with a 256-bit KEK")  # the body heading, not the contents line
    sec = text[start:text.index("\n5. Security Considerations", start)]
    lines = sec.split("\n")
    ex: dict = {}
    for i, ln in enumerate(lines):
        s = ln.strip()
        if s == "KEK:" and "kek" not in ex:
            ex["kek"] = hex_run(lines, i + 1)
        elif s == "Key Data:" and "keyData" not in ex:
            ex["keyData"] = hex_run(lines, i + 1)
        elif s.startswith("Ciphertext") and "wrapped" not in ex:
            ex["wrapped"] = hex_run(lines, i + 1, s[len("Ciphertext"):])
    if {len(ex.get(k, "")) for k in ("kek", "keyData")} != {64} or len(ex.get("wrapped", "")) != 80:
        sys.exit(f"section 4.6: read KEK/Key Data/Ciphertext of {[len(ex.get(k, ''))//2 for k in ('kek', 'keyData', 'wrapped')]} bytes, wanted 32/32/40")
    return ex


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--rfc", type=pathlib.Path, help="local rfc3394.txt; omitted = fetch the pinned text")
    ap.add_argument("--file", type=pathlib.Path, default=OUT, help="vector file to check (default: the committed one)")
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    doc = extract(fetch("rfc3394.txt", RFC_URL, RFC_SHA256, a.rfc))
    if not a.check:
        print(json.dumps(doc, indent=2))
        return 0
    f = load(a.file)
    c = Compare("aeskw_test")
    groups = f.get("testGroups", [])
    c.eq("file", "testGroups.length", len(groups), 1)
    g = groups[0] if groups else {}
    c.keys("testGroups[0]", g, {"keyLen", "tests"})
    tests = g.get("tests", [])
    c.eq("testGroups[0]", "tests.length", len(tests), 1)
    c.eq("testGroups[0]", "keyLen", g.get("keyLen"), len(doc["kek"]) * 4)
    for i, t in enumerate(tests[:1]):
        w = f"tests[{i}] (section 4.6)"
        c.keys(w, t, {"kek", "keyData", "wrapped"})
        for k in ("kek", "keyData", "wrapped"):
            c.hex(w, k, t.get(k), doc[k])
    kek, kd, wr = (bytes.fromhex(doc[k]) for k in ("kek", "keyData", "wrapped"))
    bad = []
    if aes_key_wrap(kek, kd) != wr:
        bad.append("section 4.6: aes_key_wrap(KEK, Key Data) does not give the RFC's ciphertext")
    elif aes_key_unwrap(kek, wr) != kd:
        bad.append("section 4.6: aes_key_unwrap(KEK, ciphertext) does not give the RFC's key data")
    indep = [f"python-cryptography aes_key_wrap/aes_key_unwrap reproduce the RFC's ciphertext and key data ({1 - len(bad)}/1)"]
    return report("aeskw_test.json", len(tests), "RFC 3394 section 4.6", c, indep, bad)


if __name__ == "__main__":
    sys.exit(main())
