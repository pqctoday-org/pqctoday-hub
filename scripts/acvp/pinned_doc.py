#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-only
"""
Shared helpers for the per-file standards-document checkers (check_*.py).

Each checker proves that the expected values in one src/data/acvp vector file are
the values printed in a published standard or RFC. The document is fetched from
its official URL into the gitignored tmp/acvp-upstream-cache/docs, and its SHA-256
must equal the value pinned in the checker; anything else is refused. PDFs are
turned into text with poppler's pdftotext (-layout), so the values are read out of
the pinned bytes, never typed into the checker.

Nothing here reads hub code. The comparison is exact string equality after one
declared normalization per field: the document's hex is lower- or upper-cased to
the case the committed JSON uses (the JSON must then match that case exactly, so
mixed case still fails).
"""
from __future__ import annotations

import hashlib
import json
import pathlib
import re
import shutil
import subprocess
import sys
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[2]
CACHE = ROOT / "tmp/acvp-upstream-cache/docs"
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")


def fetch(name: str, url: str, sha256: str, local: pathlib.Path | None = None) -> bytes:
    """Return the pinned document's bytes (local copy, cache, or a fresh download); refuse any other hash."""
    if local is None:
        CACHE.mkdir(parents=True, exist_ok=True)
        local = CACHE / name
        if not local.exists() or hashlib.sha256(local.read_bytes()).hexdigest() != sha256:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            local.write_bytes(urllib.request.urlopen(req, timeout=120).read())
    raw = local.read_bytes()
    got = hashlib.sha256(raw).hexdigest()
    if got != sha256:
        sys.exit(f"{name} sha256 {got} != pinned {sha256} (refusing an unpinned document)")
    return raw


def pdf_text(name: str, raw: bytes) -> str:
    """pdftotext -layout of the pinned PDF bytes (poppler required)."""
    if not shutil.which("pdftotext"):
        sys.exit("pdftotext (poppler) not found; install poppler to read the pinned PDF")
    CACHE.mkdir(parents=True, exist_ok=True)
    src = CACHE / name
    if not src.exists() or src.read_bytes() != raw:
        src.write_bytes(raw)
    r = subprocess.run(["pdftotext", "-layout", str(src), "-"], capture_output=True, check=True)
    return r.stdout.decode("utf-8", "replace")


def hex_run(lines: list[str], start: int, first: str = "") -> str:
    """Join a hex value that starts with `first` and continues on following hex-only lines."""
    parts = [first]
    for ln in lines[start:]:
        s = ln.strip()
        if re.fullmatch(r"[0-9A-Fa-f]{2}[0-9A-Fa-f ]*", s):
            parts.append(s)
        else:
            break
    return re.sub(r"\s+", "", "".join(parts))


def cased(doc_hex: str, json_val: str) -> str:
    """The document value in the case the JSON uses (the one declared normalization)."""
    if json_val == json_val.upper() and json_val != json_val.lower():
        return doc_hex.upper()
    return doc_hex.lower()


def load(path: pathlib.Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def report(fname: str, cases: int, doc_label: str, cmp: "Compare", independent: list[str], indep_fail: list[str]) -> int:
    """Print the verdict in the OK/FAIL form record-source-checks.ts parses; 0 only on a full match."""
    if cmp.errors:
        print(f"FAIL {fname} differs from {doc_label}:", file=sys.stderr)
        for e in cmp.errors:
            print(f"     {e}", file=sys.stderr)
        return 1
    if indep_fail:
        print(f"FAIL {fname} matches {doc_label}, but the independent recomputation disagrees:", file=sys.stderr)
        for e in indep_fail:
            print(f"     {e}", file=sys.stderr)
        return 1
    norm = f"; hex case-normalized for {', '.join(sorted(cmp.normalized))}" if cmp.normalized else ""
    print(f"OK   {fname}  {cases} cases match {doc_label}  ({cmp.values} values compared{norm})")
    for line in independent:
        print(f"     independent: {line}")
    return 0


class Compare:
    """Collect field-by-field comparisons; any mismatch fails the check."""

    def __init__(self, label: str):
        self.label = label
        self.values = 0
        self.errors: list[str] = []
        self.normalized: set[str] = set()

    def hex(self, where: str, field: str, json_val, doc_hex: str) -> None:
        self.values += 1
        if not isinstance(json_val, str):
            self.errors.append(f"{where}.{field}: not a string ({json_val!r})")
            return
        want = cased(doc_hex, json_val)
        if want != doc_hex:
            self.normalized.add(field)
        if json_val != want:
            self.errors.append(f"{where}.{field}: file {json_val!r} != document {doc_hex!r}")

    def eq(self, where: str, field: str, json_val, doc_val) -> None:
        self.values += 1
        if json_val != doc_val:
            self.errors.append(f"{where}.{field}: file {json_val!r} != document {doc_val!r}")

    def keys(self, where: str, obj: dict, allowed: set[str]) -> None:
        extra = set(obj) - allowed
        if extra:
            self.errors.append(f"{where}: carries fields the document check does not cover: {sorted(extra)}")
