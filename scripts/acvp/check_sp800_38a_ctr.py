#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-only
"""
Check src/data/acvp/aesctr_test.json against NIST SP 800-38A Appendix F.5.6.

WHY. The file carries one AES-256-CTR case, attributed to SP 800-38A F.5.6
(CTR-AES256.Decrypt) and to a Node/OpenSSL re-verification, with no pinned
document. The manifest (documentStatus nist-final-publication) cites SP 800-38A;
this script is the re-runnable proof that the values came from it.

SOURCE, pinned by hash: https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38a.pdf
(the PDF behind https://csrc.nist.gov/pubs/sp/800/38/a/final; sha256 below). The
text is extracted with pdftotext -layout and the F.5.6 block (Key, Init. Counter,
and the Ciphertext/Plaintext line of Blocks #1-#4) is READ from it, never typed in.

SELECTION. The one example F.5.6 prints. field mapping: key <- Key (two lines
joined); iv <- Init. Counter; ct/pt <- the four blocks' Ciphertext/Plaintext,
concatenated in block order. The document and the file both use lower-case hex.
The case is also recomputed with python-cryptography AES-CTR.

  python3 scripts/acvp/check_sp800_38a_ctr.py           # fetch the pinned PDF, print its values
  python3 scripts/acvp/check_sp800_38a_ctr.py --check   # verify (what the automated review runs)
"""
from __future__ import annotations

import argparse
import json
import pathlib
import re
import sys

from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

from pinned_doc import ROOT, Compare, fetch, hex_run, load, pdf_text, report

OUT = ROOT / "src/data/acvp/aesctr_test.json"
PDF_URL = "https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38a.pdf"
PDF_SHA256 = "66821162de1e7130c5fb5eedb22140d8d6d013ec51af4550bb095c2a9481a00e"
HEX = re.compile(r"^\s*(Key|Init\. Counter|Ciphertext|Plaintext)\s+([0-9a-f]+)\s*$")


def extract(raw: bytes) -> dict:
    text = pdf_text("nistspecialpublication800-38a.pdf", raw)
    heads = [m.start() for m in re.finditer(r"^F\.5\.6\s+CTR-AES256\.Decrypt\s*$", text, re.M)]
    if len(heads) != 1:
        sys.exit(f"found {len(heads)} F.5.6 CTR-AES256.Decrypt headings, wanted 1 (outside the table of contents)")
    body = text[heads[0]:].split("\n")[1:]
    ex: dict = {"blocks": []}
    for i, ln in enumerate(body):
        if re.match(r"^(F\.\d|APPENDIX|Appendix)", ln.strip()):
            break
        m = HEX.match(ln)
        if not m:
            if re.match(r"^\s*Block #(\d+)", ln):
                ex["blocks"].append({})
            continue
        field, val = m.group(1), m.group(2)
        if field == "Key":
            ex["key"] = hex_run(body, i + 1, val)
        elif field == "Init. Counter":
            ex["iv"] = val
        else:
            ex["blocks"][-1][field] = val
    if len(ex["blocks"]) != 4 or any(set(b) != {"Ciphertext", "Plaintext"} for b in ex["blocks"]):
        sys.exit(f"F.5.6: read {len(ex['blocks'])} blocks, wanted 4 with Ciphertext and Plaintext")
    ex["ct"] = "".join(b["Ciphertext"] for b in ex["blocks"])
    ex["pt"] = "".join(b["Plaintext"] for b in ex["blocks"])
    return ex


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--pdf", type=pathlib.Path, help="local SP 800-38A PDF; omitted = fetch the pinned PDF")
    ap.add_argument("--file", type=pathlib.Path, default=OUT, help="vector file to check (default: the committed one)")
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    doc = extract(fetch("nistspecialpublication800-38a.pdf", PDF_URL, PDF_SHA256, a.pdf))
    if not a.check:
        print(json.dumps({k: doc[k] for k in ("key", "iv", "pt", "ct")}, indent=2))
        return 0
    f = load(a.file)
    c = Compare("aesctr_test")
    groups = f.get("testGroups", [])
    c.eq("file", "testGroups.length", len(groups), 1)
    g = groups[0] if groups else {}
    c.keys("testGroups[0]", g, {"keyLen", "counterBits", "tests"})
    tests = g.get("tests", [])
    c.eq("testGroups[0]", "tests.length", len(tests), 1)
    c.eq("testGroups[0]", "keyLen", g.get("keyLen"), len(doc["key"]) * 4)
    c.eq("testGroups[0]", "counterBits", g.get("counterBits"), len(doc["iv"]) * 4)
    bad = []
    for i, t in enumerate(tests[:1]):
        w = f"tests[{i}] (F.5.6)"
        c.keys(w, t, {"key", "iv", "pt", "ct"})
        for k in ("key", "iv", "pt", "ct"):
            c.hex(w, k, t.get(k), doc[k])
    dec = Cipher(algorithms.AES(bytes.fromhex(doc["key"])), modes.CTR(bytes.fromhex(doc["iv"]))).decryptor()
    if (dec.update(bytes.fromhex(doc["ct"])) + dec.finalize()).hex() != doc["pt"]:
        bad.append("F.5.6: AES-256-CTR decryption of the document's ciphertext does not give its plaintext")
    indep = [f"python-cryptography AES-256-CTR decrypts the document's ciphertext to its plaintext ({1 - len(bad)}/1)"]
    return report("aesctr_test.json", len(tests), "NIST SP 800-38A Appendix F.5.6 (CTR-AES256.Decrypt)", c, indep, bad)


if __name__ == "__main__":
    sys.exit(main())
