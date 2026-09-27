#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-only
"""
Check src/data/acvp/aescmac_test.json against NIST's CSRC AES-CMAC example PDF.

WHY. The file carries three CMAC-AES256 cases with no _provenance block, and its
own `source` string cites "SP 800-38B Section D.2", which is wrong: the current
SP 800-38B (updates as of 2016-10-06) Appendix D prints no examples and points to
the CSRC examples page. The manifest (documentStatus nist-example-set) cites the
right document; this script is the re-runnable proof that the values came from it.

SOURCE, pinned by hash: https://csrc.nist.gov/CSRC/media/Projects/Cryptographic-Standards-and-Guidelines/documents/examples/AES_CMAC.pdf
(sha256 below). The text is extracted with pdftotext -layout and the CMAC-AES256
section's "Key is", "Mlen=", "PT is" and "Tag is" blocks are READ from it, never
typed in.

SELECTION. tcId 1/2/3 are Examples #1, #2 and #4 (Mlen 0, 16, 64); Example #3
(Mlen=20) is not carried, as the manifest lineage records. The PDF prints hex in
upper case; the file's key/msg are lower case and its mac upper case, so each
document value is compared in the case the file uses (declared, per field).
Every case is also recomputed with python-cryptography CMAC(AES).

  python3 scripts/acvp/check_cmac_aes256_examples.py           # fetch the pinned PDF, print its values
  python3 scripts/acvp/check_cmac_aes256_examples.py --check   # verify (what the automated review runs)
"""
from __future__ import annotations

import argparse
import json
import pathlib
import re
import sys

from cryptography.hazmat.primitives.ciphers import algorithms
from cryptography.hazmat.primitives.cmac import CMAC

from pinned_doc import ROOT, Compare, fetch, hex_run, load, pdf_text, report

OUT = ROOT / "src/data/acvp/aescmac_test.json"
PDF_URL = ("https://csrc.nist.gov/CSRC/media/Projects/Cryptographic-Standards-and-Guidelines/"
           "documents/examples/AES_CMAC.pdf")
PDF_SHA256 = "0019ce0469d13ba9fb18f4149e419fc389d068d68cf038a540dd6a7840ac9e64"
SELECT = (1, 2, 4)  # document example numbers carried as tcId 1, 2, 3


def extract(raw: bytes) -> dict[int, dict]:
    text = pdf_text("AES_CMAC.pdf", raw)
    sec = text[text.index("CMAC-AES256"):]
    out: dict[int, dict] = {}
    for m in re.finditer(r"Example #(\d+)(.*?)(?=Example #\d+|\Z)", sec, re.S):
        n, body = int(m.group(1)), m.group(2).split("\n")
        ex: dict = {}
        for i, ln in enumerate(body):
            s = ln.strip()
            if s == "Key is":
                ex["key"] = hex_run(body, i + 1)
            elif s.startswith("Mlen="):
                ex["mlen"] = int(s.split("=")[1])
            elif s == "PT is":
                ex["msg"] = "" if body[i + 1].strip() == "<empty>" else hex_run(body, i + 1)
            elif s == "Tag is":
                ex["tag"] = hex_run(body, i + 1)
        if len(ex.get("msg", "x")) != 2 * ex.get("mlen", -1):
            sys.exit(f"Example #{n}: read {len(ex.get('msg', ''))//2} message bytes, Mlen says {ex.get('mlen')}")
        out[n] = ex
    if sorted(out) != [1, 2, 3, 4]:
        sys.exit(f"found CMAC-AES256 examples {sorted(out)}, wanted 1-4")
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--pdf", type=pathlib.Path, help="local AES_CMAC.pdf; omitted = fetch the pinned PDF")
    ap.add_argument("--file", type=pathlib.Path, default=OUT, help="vector file to check (default: the committed one)")
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    doc = extract(fetch("AES_CMAC.pdf", PDF_URL, PDF_SHA256, a.pdf))
    if not a.check:
        print(json.dumps({n: doc[n] for n in SELECT}, indent=2))
        return 0
    f = load(a.file)
    c = Compare("aescmac_test")
    groups = f.get("testGroups", [])
    c.eq("file", "testGroups.length", len(groups), 1)
    g = groups[0] if groups else {}
    c.keys("testGroups[0]", g, {"keyLen", "macLen", "tests"})
    tests = g.get("tests", [])
    c.eq("testGroups[0]", "tests.length", len(tests), len(SELECT))
    indep, bad = [], []
    for i, (t, n) in enumerate(zip(tests, SELECT)):
        ex, w = doc[n], f"tests[{i}] (Example #{n})"
        c.keys(w, t, {"tcId", "key", "msg", "mac"})
        c.eq(w, "tcId", t.get("tcId"), i + 1)
        c.eq(w, "keyLen", g.get("keyLen"), len(ex["key"]) * 4)
        c.eq(w, "macLen", g.get("macLen"), len(ex["tag"]) * 4)
        c.hex(w, "key", t.get("key"), ex["key"])
        c.hex(w, "msg", t.get("msg"), ex["msg"])
        c.hex(w, "mac", t.get("mac"), ex["tag"])
        mac = CMAC(algorithms.AES(bytes.fromhex(ex["key"])))
        mac.update(bytes.fromhex(ex["msg"]))
        if mac.finalize().hex() != ex["tag"].lower():
            bad.append(f"Example #{n}: CMAC(AES-256) does not reproduce the document's tag")
    indep.append(f"python-cryptography CMAC(AES-256) reproduces the document's tag for {len(SELECT) - len(bad)}/{len(SELECT)} examples")
    return report("aescmac_test.json", len(tests), "NIST CSRC AES_CMAC.pdf CMAC-AES256 Examples #1, #2, #4", c, indep, bad)


if __name__ == "__main__":
    sys.exit(main())
