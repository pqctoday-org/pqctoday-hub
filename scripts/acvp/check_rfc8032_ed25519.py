#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-only
"""
Check src/data/acvp/eddsa_test.json against RFC 8032 section 7.1.

WHY. The file carries two Ed25519 signatures used as positive SigVer tuples,
attributed to RFC 8032 section 7.1 (TEST 2, then TEST 1) and to a Node/OpenSSL
re-verification, with no pinned document. The manifest (documentStatus rfc) cites
RFC 8032; this script is the re-runnable proof that the values came from it.

SOURCE, pinned by hash: https://www.rfc-editor.org/rfc/rfc8032.txt, sha256 below.
Section "7.1.  Test Vectors for Ed25519" is cut out of the text and each
"-----TEST n" block's SECRET KEY, PUBLIC KEY, MESSAGE (length stated) and
SIGNATURE hex blocks are READ from it (page breaks skipped), never typed in.

SELECTION. TEST 2 (1-byte message) as tests[0] and TEST 1 (empty message) as
tests[1], the order the file's `source` field records. field mapping: pk <- PUBLIC
KEY; msg <- MESSAGE; signature <- SIGNATURE; SECRET KEY is not carried. The RFC
and the file both use lower-case hex. Independently, python-cryptography Ed25519
derives each public key from the SECRET KEY, re-signs the message (Ed25519 is
deterministic, so the signature must be the RFC's byte for byte) and verifies it.

  python3 scripts/acvp/check_rfc8032_ed25519.py           # fetch the pinned RFC, print its values
  python3 scripts/acvp/check_rfc8032_ed25519.py --check   # verify (what the automated review runs)
"""
from __future__ import annotations

import argparse
import json
import pathlib
import re
import sys

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat

from pinned_doc import ROOT, Compare, fetch, load, report

OUT = ROOT / "src/data/acvp/eddsa_test.json"
RFC_URL = "https://www.rfc-editor.org/rfc/rfc8032.txt"
RFC_SHA256 = "ed63657ff389301282b169b0abde9b5dd2c7e4d524fdfa5da6ff3094fc93c4c3"
SELECT = ("2", "1")  # RFC TEST names carried as tests[0], tests[1]
PAGE_BREAK = re.compile(r"^(Josefsson & Liusvaara\s+Informational\s+\[Page \d+\]|RFC 8032\s+EdDSA: Ed25519 and Ed448\s+January 2017|\f)\s*$")
FIELDS = {"SECRET KEY:": "sk", "PUBLIC KEY:": "pk", "SIGNATURE:": "sig"}


def block(lines: list[str], i: int) -> str:
    """Hex lines following line i, up to the first line that is not hex (lengths are checked by the caller)."""
    out = []
    for ln in lines[i + 1:]:
        s = ln.strip()
        if not re.fullmatch(r"[0-9a-f]+", s):
            break
        out.append(s)
    return "".join(out)


def extract(raw: bytes) -> dict[str, dict]:
    text = raw.decode("ascii")
    start = text.rindex("\n7.1.  Test Vectors for Ed25519")  # the body heading, not the contents line
    sec = text[start:text.index("\n7.2.  Test Vectors for Ed25519ctx", start)]
    lines = [ln for ln in sec.split("\n") if not PAGE_BREAK.match(ln)]
    out: dict[str, dict] = {}
    cur: dict | None = None
    for i, ln in enumerate(lines):
        s = ln.strip()
        m = re.fullmatch(r"-----TEST (.+)", s)
        if m:
            cur = out.setdefault(m.group(1), {})
        elif cur is not None and s in FIELDS:
            cur[FIELDS[s]] = block(lines, i)
        elif cur is not None and (mm := re.fullmatch(r"MESSAGE \(length (\d+) bytes?\):", s)):
            cur["msgLen"] = int(mm.group(1))
            cur["msg"] = block(lines, i)
        elif cur is not None and s.startswith("ALGORITHM:"):
            cur["alg"] = next(x.strip() for x in lines[i + 1:] if x.strip())
    for n in SELECT:
        t = out.get(n, {})
        if set(t) != {"alg", "sk", "pk", "msg", "msgLen", "sig"} or t["alg"] != "Ed25519":
            sys.exit(f"TEST {n}: read {sorted(t)} (algorithm {t.get('alg')!r}), wanted an Ed25519 test with every field")
        if len(t["msg"]) != 2 * t["msgLen"] or len(t["pk"]) != 64 or len(t["sig"]) != 128:
            sys.exit(f"TEST {n}: field lengths do not match the RFC's stated sizes")
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--rfc", type=pathlib.Path, help="local rfc8032.txt; omitted = fetch the pinned text")
    ap.add_argument("--file", type=pathlib.Path, default=OUT, help="vector file to check (default: the committed one)")
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    doc = extract(fetch("rfc8032.txt", RFC_URL, RFC_SHA256, a.rfc))
    if not a.check:
        print(json.dumps({n: doc[n] for n in SELECT}, indent=2))
        return 0
    f = load(a.file)
    c = Compare("eddsa_test")
    c.eq("file", "mode", f.get("mode"), "sigVer")
    groups = f.get("testGroups", [])
    c.eq("file", "testGroups.length", len(groups), 1)
    g = groups[0] if groups else {}
    c.keys("testGroups[0]", g, {"curve", "tests"})
    c.eq("testGroups[0]", "curve", g.get("curve"), "Ed25519")
    tests = g.get("tests", [])
    c.eq("testGroups[0]", "tests.length", len(tests), len(SELECT))
    for i, (t, n) in enumerate(zip(tests, SELECT)):
        w, ex = f"tests[{i}] (TEST {n})", doc[n]
        c.keys(w, t, {"pk", "msg", "signature", "testPassed"})
        c.hex(w, "pk", t.get("pk"), ex["pk"])
        c.hex(w, "msg", t.get("msg"), ex["msg"])
        c.hex(w, "signature", t.get("signature"), ex["sig"])
        c.eq(w, "testPassed", t.get("testPassed"), True)
    bad = []
    for n in SELECT:
        ex = doc[n]
        sk = Ed25519PrivateKey.from_private_bytes(bytes.fromhex(ex["sk"]))
        pk = sk.public_key()
        msg = bytes.fromhex(ex["msg"])
        if pk.public_bytes(Encoding.Raw, PublicFormat.Raw).hex() != ex["pk"]:
            bad.append(f"TEST {n}: the public key derived from SECRET KEY is not the RFC's PUBLIC KEY")
        elif sk.sign(msg).hex() != ex["sig"]:
            bad.append(f"TEST {n}: re-signing the message does not give the RFC's SIGNATURE")
        else:
            pk.verify(bytes.fromhex(ex["sig"]), msg)
    indep = [f"python-cryptography Ed25519: public key derived, signature re-signed byte-identically and verified "
             f"for {len(SELECT) - len(bad)}/{len(SELECT)} tests"]
    return report("eddsa_test.json", len(tests), "RFC 8032 section 7.1 TEST 2 and TEST 1", c, indep, bad)


if __name__ == "__main__":
    sys.exit(main())
