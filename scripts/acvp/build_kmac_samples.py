#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-only
"""
Build src/data/acvp/kmac_test.json from NIST's CSRC KMAC example PDF.

WHY. The file's KMAC256 case (Sample #4) carried a 63-byte mac although macLen is
512 bits; it equalled NIST's output only up to ...3F4F2487 and then diverged
(file tail ...1071145F460000, NIST tail ...1024D9C27773A8DD), so the case was
quarantined. Its _provenance also cited SP 800-185, which prints no KMAC outputs:
the values come from the CSRC example set that SP 800-185 points to. Maintainer
decision 2026-09-26: replace hand-carried vectors with values read from the
trusted document.

SOURCE, pinned by hash: https://csrc.nist.gov/CSRC/media/Projects/Cryptographic-Standards-and-Guidelines/documents/examples/KMAC_samples.pdf
(sha256 below). The text is extracted with pdftotext -layout and each sample's
"Security Strength", "Key is", "Data is", "Requested output length", "S (as a
character string) is" and "Outval is" are READ from it, never typed in.

SELECTION. Sample #4 (KMAC256, S = "My Tagged Application", 512-bit output) as
testGroups[0] and Sample #1 (KMAC128, S empty -- printed "(null)", 256-bit output)
as testGroups[1], the layout readers already index (useAcvpSuite reads
testGroups[1] as KMAC128). field mapping: key <- Key; msg <- Data; customization
<- S, ASCII bytes hex-encoded; mac <- Outval (upper case, as the PDF prints it);
macLen <- requested output length. Both are recomputed with pycryptodome
KMAC128/KMAC256; the script refuses to write unless NIST's Outval reproduces.

  python3 scripts/acvp/build_kmac_samples.py           # fetch the pinned PDF and write
  python3 scripts/acvp/build_kmac_samples.py --check   # verify (what the automated review runs)
"""
from __future__ import annotations

import argparse
import json
import pathlib
import re
import sys

from Crypto.Hash import KMAC128, KMAC256

from pinned_doc import ROOT, fetch, hex_run, pdf_text

OUT = ROOT / "src/data/acvp/kmac_test.json"
PDF_URL = ("https://csrc.nist.gov/CSRC/media/Projects/Cryptographic-Standards-and-Guidelines/"
           "documents/examples/KMAC_samples.pdf")
PDF_SHA256 = "445ee87689670da2bee611e88b765f22a43b4155295fd7f1cddea0ac671b24e1"
RETRIEVED = "2026-09-27"
SELECT = (4, 1)  # sample numbers carried as testGroups[0], testGroups[1]


def extract(raw: bytes) -> dict[int, dict]:
    text = pdf_text("KMAC_samples.pdf", raw)
    out: dict[int, dict] = {}
    for m in re.finditer(r"Sample #(\d+)(.*?)(?=Sample #\d+|\Z)", text, re.S):
        n, lines = int(m.group(1)), m.group(2).split("\n")
        if n not in SELECT:
            continue
        s: dict = {}
        for i, ln in enumerate(lines):
            t = ln.strip()
            if mm := re.fullmatch(r"Security Strength: (\d+)-bits", t):
                s["strength"] = int(mm.group(1))
            elif mm := re.fullmatch(r"Length of Key is (\d+)-bits", t):
                s["keyBits"] = int(mm.group(1))
            elif t == "Key is":
                s["key"] = hex_run(lines, i + 1).lower()
            elif mm := re.fullmatch(r"Length of data is (\d+)-bits", t):
                s["dataBits"] = int(mm.group(1))
            elif t == "Data is":
                s["msg"] = hex_run(lines, i + 1).lower()
            elif mm := re.fullmatch(r"Requested output length is (\d+)-bits", t):
                s["macLen"] = int(mm.group(1))
            elif t == "S (as a character string) is":
                q = re.fullmatch(r'"(.*)"', lines[i + 1].strip())
                if not q:
                    sys.exit(f"Sample #{n}: cannot read S from {lines[i + 1]!r}")
                s["S"] = "" if q.group(1) == "(null)" else q.group(1)
            elif t == "Outval is":
                s["mac"] = hex_run(lines, i + 1).upper()
        want = {"strength", "keyBits", "key", "dataBits", "msg", "macLen", "S", "mac"}
        if set(s) != want:
            sys.exit(f"Sample #{n}: read {sorted(s)}, missing {sorted(want - set(s))}")
        if (len(s["key"]) * 4, len(s["msg"]) * 4, len(s["mac"]) * 4) != (s["keyBits"], s["dataBits"], s["macLen"]):
            sys.exit(f"Sample #{n}: key/data/output lengths do not match the lengths the PDF states")
        out[n] = s
    if sorted(out) != sorted(SELECT):
        sys.exit(f"found samples {sorted(out)}, wanted {sorted(SELECT)}")
    return out


def build(raw: bytes) -> dict:
    samples = extract(raw)
    groups = []
    for n in SELECT:
        s = samples[n]
        variant = {128: "KMAC128", 256: "KMAC256"}[s["strength"]]
        kmac = {128: KMAC128, 256: KMAC256}[s["strength"]]
        got = kmac.new(key=bytes.fromhex(s["key"]), data=bytes.fromhex(s["msg"]),
                       mac_len=s["macLen"] // 8, custom=s["S"].encode("ascii")).hexdigest().upper()
        if got != s["mac"]:
            sys.exit(f"Sample #{n}: pycryptodome {variant} does not reproduce NIST's Outval")
        groups.append({"variant": variant, "macLen": s["macLen"], "tests": [{
            "tcId": 1, "key": s["key"], "msg": s["msg"],
            "customization": s["S"].encode("ascii").hex(), "mac": s["mac"]}]})
    return {
        "algorithm": "KMAC",
        "_provenance": {
            "producer": "NIST CSRC Cryptographic Standards and Guidelines examples, KMAC_samples.pdf (the SP 800-185 example set; SP 800-185 itself prints no KMAC outputs)",
            "source_url": PDF_URL,
            "source_sha256": PDF_SHA256,
            "retrieved": RETRIEVED,
            "generator": "python3 scripts/acvp/build_kmac_samples.py (re-verify with --check)",
            "selection": "Sample #4 (KMAC256, S = \"My Tagged Application\", 512-bit output) as testGroups[0]; Sample #1 (KMAC128, S empty, 256-bit output) as testGroups[1], the index readers use.",
            "field_mapping": "key <- Key; msg <- Data; customization <- S as ASCII bytes, hex-encoded (Sample #1 prints \"(null)\": empty); mac <- Outval, upper case as printed; macLen <- requested output length.",
            "independent_check": "Both recomputed with pycryptodome KMAC128/KMAC256; both reproduce NIST's Outval.",
            "correction": "REPLACES a KMAC256 mac that was 63 bytes although macLen is 512 bits and diverged from NIST's Sample #4 after ...3F4F2487 (file tail ...1071145F460000, NIST tail ...1024D9C27773A8DD); that case had been quarantined. The previous _provenance cited SP 800-185 as the source of the values.",
        },
        "source": "NIST CSRC KMAC_samples.pdf, Samples #4 (KMAC256) and #1 (KMAC128)",
        "testGroups": groups,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--pdf", type=pathlib.Path, help="local KMAC_samples.pdf; omitted = fetch the pinned PDF")
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    doc = build(fetch("KMAC_samples.pdf", PDF_URL, PDF_SHA256, a.pdf))
    if a.check:
        if json.loads(OUT.read_text(encoding="utf-8")) != doc:
            print("FAIL kmac_test.json differs from NIST KMAC_samples.pdf Samples #4 and #1", file=sys.stderr)
            return 1
        print("OK   kmac_test.json  2 cases match NIST KMAC_samples.pdf Samples #4 (KMAC256) and #1 (KMAC128)")
        print("     independent: pycryptodome KMAC256/KMAC128 reproduce NIST's Outval for 2/2 samples")
        return 0
    OUT.write_text(json.dumps(doc, indent=2) + "\n", encoding="utf-8")
    print(f"WROTE {OUT.relative_to(ROOT)}  2 cases from NIST KMAC_samples.pdf Samples #4 and #1")
    return 0


if __name__ == "__main__":
    sys.exit(main())
