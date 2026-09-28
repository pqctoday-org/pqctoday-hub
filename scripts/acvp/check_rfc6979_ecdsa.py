#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-only
"""
Check src/data/acvp/ecdsa_test.json (P-256) or ecdsa_p384_test.json (P-384)
against RFC 6979 Appendix A.2.5 / A.2.6.

WHY. Each file carries one deterministic-ECDSA signature used as a positive SigVer
tuple, attributed to RFC 6979 Appendix A.2 and to a Node/OpenSSL re-verification,
with no pinned document. The manifest (documentStatus rfc) cites RFC 6979; this
script is the re-runnable proof that the values came from it.

SOURCE, pinned by hash: https://www.rfc-editor.org/rfc/rfc6979.txt, sha256 below.
The appendix section for the curve is cut out of the text and its "Ux =", "Uy ="
and "x =" values and the r/s under 'With SHA-<n>, message = "sample":' are READ
from it (continuation lines joined, page breaks skipped), never typed in.

SELECTION. One signature per file: the SHA-256 / "sample" one of A.2.5 for P-256,
the SHA-384 / "sample" one of A.2.6 for P-384 (1 of the 10 each section prints).
field mapping: qx <- Ux; qy <- Uy; msg <- the quoted message (ASCII text, as the
file stores it); r, s <- r, s. x and k are not carried. The RFC prints upper-case
hex; the files use lower case, so document values are lower-cased before comparing.
Independently, python-cryptography derives the public key from the RFC's x (must
equal Ux, Uy) and verifies (r, s) over the message with that key.

  python3 scripts/acvp/check_rfc6979_ecdsa.py --id ecdsa_test           # print the RFC values
  python3 scripts/acvp/check_rfc6979_ecdsa.py --id ecdsa_p384_test --check   # verify (what the automated review runs)
"""
from __future__ import annotations

import argparse
import json
import pathlib
import re
import sys

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.asymmetric.utils import encode_dss_signature
from cryptography.exceptions import InvalidSignature

from pinned_doc import ROOT, Compare, fetch, load, report

RFC_URL = "https://www.rfc-editor.org/rfc/rfc6979.txt"
RFC_SHA256 = "456e8f17558fdbd206f968b96fc6f1b4a71ea331ab30ad17f711ab3adaa7d701"
TARGETS = {
    # id: (section heading, next heading, curve label, hash, cryptography curve/hash)
    "ecdsa_test": ("A.2.5.  ECDSA, 256 Bits (Prime Field)", "A.2.6.", "P-256", "SHA-256",
                   ec.SECP256R1(), hashes.SHA256()),
    "ecdsa_p384_test": ("A.2.6.  ECDSA, 384 Bits (Prime Field)", "A.2.7.", "P-384", "SHA-384",
                        ec.SECP384R1(), hashes.SHA384()),
}
MESSAGE = "sample"
PAGE_BREAK = re.compile(r"^(Pornin\s+Informational\s+\[Page \d+\]|RFC 6979\s+Deterministic DSA and ECDSA\s+August 2013|\f)\s*$")


def value(lines: list[str], i: int, name: str) -> str:
    """Hex after '<name> =' on line i, plus the continuation lines that follow it."""
    parts = [lines[i].split("=", 1)[1].strip()]
    for ln in lines[i + 1:]:
        s = ln.strip()
        if re.fullmatch(r"[0-9A-F]+", s):
            parts.append(s)
        else:
            break
    return "".join(parts)


def extract(raw: bytes, target: str) -> dict:
    head, nxt, curve, hname, *_ = TARGETS[target]
    text = raw.decode("ascii")
    start = text.rindex("\n" + head)  # the body heading, not the contents line
    sec = text[start:text.index("\n" + nxt, start)]
    lines = [ln for ln in sec.split("\n") if not PAGE_BREAK.match(ln) and ln.strip()]
    if f"curve: NIST {curve}" not in sec:
        sys.exit(f"{head}: does not name curve NIST {curve}")
    ex: dict = {}
    for i, ln in enumerate(lines):
        s = ln.strip()
        for name, key in (("Ux =", "Ux"), ("Uy =", "Uy"), ("x =", "x")):
            if s.startswith(name) and key not in ex:
                ex[key] = value(lines, i, key)
        if s == f'With {hname}, message = "{MESSAGE}":':
            sig = {}
            for j in range(i + 1, len(lines)):
                m = re.match(r"^\s*([a-z]+) = ", lines[j])
                if m:
                    sig[m.group(1)] = value(lines, j, m.group(1))
                elif not re.fullmatch(r"\s*[0-9A-F]+\s*", lines[j]):
                    break  # the next 'With ...' heading ends this signature
            if set(sig) != {"k", "r", "s"}:
                sys.exit(f'{head}: With {hname}, message = "{MESSAGE}" has fields {sorted(sig)}, wanted k, r, s')
            ex["r"], ex["s"] = sig["r"], sig["s"]
    if set(ex) != {"Ux", "Uy", "x", "r", "s"}:
        sys.exit(f"{head}: read {sorted(ex)}, wanted Ux, Uy, x, r, s")
    return ex


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--id", required=True, choices=sorted(TARGETS))
    ap.add_argument("--rfc", type=pathlib.Path, help="local rfc6979.txt; omitted = fetch the pinned text")
    ap.add_argument("--file", type=pathlib.Path, help="vector file to check (default: the committed one)")
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    head, _, curve, hname, ec_curve, ec_hash = TARGETS[a.id]
    doc = extract(fetch("rfc6979.txt", RFC_URL, RFC_SHA256, a.rfc), a.id)
    if not a.check:
        print(json.dumps(doc, indent=2))
        return 0
    fname = f"{a.id}.json"
    f = load(a.file or ROOT / "src/data/acvp" / fname)
    c = Compare(a.id)
    c.eq("file", "mode", f.get("mode"), "sigVer")
    groups = f.get("testGroups", [])
    c.eq("file", "testGroups.length", len(groups), 1)
    g = groups[0] if groups else {}
    c.keys("testGroups[0]", g, {"curve", "hashAlg", "tests"})
    c.eq("testGroups[0]", "curve", g.get("curve"), curve)
    c.eq("testGroups[0]", "hashAlg", g.get("hashAlg"), hname)
    tests = g.get("tests", [])
    c.eq("testGroups[0]", "tests.length", len(tests), 1)
    for i, t in enumerate(tests[:1]):
        w = f'tests[{i}] ({head.split()[0].rstrip('.')} {hname}, "{MESSAGE}")'
        c.keys(w, t, {"qx", "qy", "msg", "r", "s", "testPassed"})
        c.hex(w, "qx", t.get("qx"), doc["Ux"])
        c.hex(w, "qy", t.get("qy"), doc["Uy"])
        c.eq(w, "msg", t.get("msg"), MESSAGE)
        c.hex(w, "r", t.get("r"), doc["r"])
        c.hex(w, "s", t.get("s"), doc["s"])
        c.eq(w, "testPassed", t.get("testPassed"), True)
    bad = []
    pub = ec.derive_private_key(int(doc["x"], 16), ec_curve).public_key().public_numbers()
    if (pub.x, pub.y) != (int(doc["Ux"], 16), int(doc["Uy"], 16)):
        bad.append(f"{head}: x*G does not equal the RFC's (Ux, Uy)")
    try:
        ec.EllipticCurvePublicNumbers(int(doc["Ux"], 16), int(doc["Uy"], 16), ec_curve).public_key().verify(
            encode_dss_signature(int(doc["r"], 16), int(doc["s"], 16)), MESSAGE.encode(), ec.ECDSA(ec_hash))
    except InvalidSignature:
        bad.append(f'{head}: (r, s) does not verify over "{MESSAGE}" with {hname}')
    indep = [f"python-cryptography: x*G equals (Ux, Uy) and (r, s) verifies over \"{MESSAGE}\" with {hname} "
             f"({'1/1' if not bad else '0/1'})"]
    return report(fname, len(tests), f'RFC 6979 {head.split()[0].rstrip('.')} ({curve}), {hname}, message "{MESSAGE}"', c, indep, bad)


if __name__ == "__main__":
    sys.exit(main())
