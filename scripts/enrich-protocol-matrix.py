#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-only
"""
scripts/enrich-protocol-matrix.py

Maintenance script for the PQC Protocol Support Matrix
(src/data/pqcProtocolMatrix.ts).

Deterministic refresh (no LLM — safe to run in CI):
    For every `draft-*` and `RFC ####` already referenced in the matrix,
    hits the IETF datatracker JSON API to fetch the current document
    state, maps it to a `DraftStage` (0-7), and emits a diff vs the
    `stage` / `stageNote` encoded in the TypeScript file. Also
    cross-references every matrix ref against the latest library CSV.

LLM-assisted discovery of NEW candidate refs is a separate,
maintainer-side process and intentionally NOT part of this script:
CI has no LLM access, and matrix additions require SME review anyway.

The script NEVER writes pqcProtocolMatrix.ts directly. It writes:
    reports/protocol-matrix-updates.json    — machine-readable diff
    reports/protocol-matrix-changes.md      — SME-friendly review doc

To apply curated updates back into the matrix, run
    npx tsx scripts/apply-protocol-matrix-updates.ts --apply

Usage:
    # Deterministic refresh (always safe, fast, CI-friendly):
    python3 scripts/enrich-protocol-matrix.py

    # Just sanity-check ref shapes vs library CSV cross-references:
    python3 scripts/enrich-protocol-matrix.py --xref-only

Exit codes:
    0 — clean (no proposed changes)
    1 — proposed changes written to reports/
    2 — fatal error (matrix file missing, parse error)
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parent.parent
MATRIX_FILE = REPO_ROOT / "src" / "data" / "pqcProtocolMatrix.ts"
LIBRARY_DIR = REPO_ROOT / "src" / "data"
REPORTS_DIR = REPO_ROOT / "reports"
DATATRACKER_BASE = "https://datatracker.ietf.org/api/v1/doc/document/"

# ---------------------------------------------------------------------------
# Stage mapping: datatracker state slug -> our DraftStage label (and 0-7 level)
# ---------------------------------------------------------------------------
# Datatracker `states` are arrays of {state_type, name, slug}. For docs of
# type 'draft' the relevant state_types are 'draft-iesg' (IESG) and
# 'draft-stream-ietf' (WG track).
DATATRACKER_TO_STAGE: dict[str, tuple[str, int]] = {
    "pub": ("rfc-published", 7),
    "rfcqueue": ("rfc-editor-queue", 6),
    "ann": ("rfc-editor-queue", 6),
    "approved": ("rfc-editor-queue", 6),
    "iesg-eva": ("iesg-submitted", 5),
    "lc": ("ietf-last-call", 6),
    "watching": ("iesg-submitted", 5),
    "writeupw": ("iesg-submitted", 5),
    "pub-req": ("iesg-submitted", 5),
    "ad-eval": ("iesg-submitted", 5),
    "wglc": ("wg-last-call", 4),
    "wg-doc": ("wg-document", 4),
    "wg-cand": ("individual-draft", 3),
    "c-adopt": ("individual-draft", 3),
    "active": ("individual-draft", 3),
    "expired": ("experimental", 2),
    "dead": ("experimental", 2),
    "repl": ("experimental", 2),
}


@dataclass
class MatrixRef:
    """A ref pulled from the matrix file."""

    row_id: str
    dimension: str  # pureKem / hybridKem / pureSig / hybridSig
    ref_id: str  # 'RFC 9935' or 'draft-ietf-tls-mlkem'
    encoded_stage: str | None  # value of `stage` field, if set
    encoded_stage_note: str | None


@dataclass
class StageDelta:
    row_id: str
    dimension: str
    ref_id: str
    encoded_stage: str | None
    current_stage: str | None
    current_state_slug: str | None
    last_updated: str | None
    notes: list[str] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Matrix parsing — light-touch regex over the TypeScript source. Good enough
# because the file is hand-edited following a stable shape.
# ---------------------------------------------------------------------------
ROW_RE = re.compile(r"id:\s*'([a-z0-9-]+)'", re.IGNORECASE)
DIM_BLOCK_RE = re.compile(
    r"(pureKem|hybridKem|pureSig|hybridSig)\s*:\s*\{",
)
STAGE_RE = re.compile(r"stage:\s*'([a-z-]+)'")
STAGE_NOTE_RE = re.compile(r"stageNote:\s*'([^']+)'")
REF_ID_RE = re.compile(r"id:\s*'((?:RFC\s\d+|draft-[a-z0-9-]+|TCG [^']+|3GPP T[RS] [^']+|UEFI [^']+|IEEE [^']+))'")


def parse_matrix(path: Path) -> list[MatrixRef]:
    """Walk the TS file and return one MatrixRef per refs[].id entry.

    Uses leading-whitespace depth to distinguish row-level `id:` fields
    (indent 4) from nested ProtocolDoc / DimensionRef `id:` fields
    (indent 8+). The file is consistently 2-space indented.
    """
    rows: list[MatrixRef] = []
    current_row: str | None = None
    current_dim: str | None = None
    current_stage: str | None = None
    current_stage_note: str | None = None
    in_refs = False
    text = path.read_text()
    for raw in text.splitlines():
        indent = len(raw) - len(raw.lstrip(" "))
        line = raw.strip()
        # Row-level id is at exactly 4-space indent.
        if indent == 4 and line.startswith("id:"):
            m = ROW_RE.search(line)
            if m:
                current_row = m.group(1)
                current_dim = None
                current_stage = None
                current_stage_note = None
                in_refs = False
            continue
        # Dimension blocks are at 6-space indent: `      pureKem: {`
        if indent == 6:
            m = DIM_BLOCK_RE.match(line)
            if m and current_row:
                current_dim = m.group(1)
                current_stage = None
                current_stage_note = None
                in_refs = False
                continue
            # Closing `},` of a dimension block at indent 6 ends it.
            if line in {"},", "}"} and current_dim:
                current_dim = None
                current_stage = None
                current_stage_note = None
                in_refs = False
                continue
        # Inside a dimension block: stage, stageNote, refs entries.
        if current_dim:
            sm = STAGE_RE.search(line)
            if sm:
                current_stage = sm.group(1)
            snm = STAGE_NOTE_RE.search(line)
            if snm:
                current_stage_note = snm.group(1)
            if "refs:" in line and "[" in line:
                in_refs = True
                continue
            if in_refs:
                rm = REF_ID_RE.search(line)
                if rm and current_row:
                    rows.append(
                        MatrixRef(
                            row_id=current_row,
                            dimension=current_dim,
                            ref_id=rm.group(1),
                            encoded_stage=current_stage,
                            encoded_stage_note=current_stage_note,
                        )
                    )
                if line.startswith("],"):
                    in_refs = False
    return rows


# ---------------------------------------------------------------------------
# Datatracker fetcher
# ---------------------------------------------------------------------------
def datatracker_name(ref_id: str) -> str | None:
    """Map an encoded ref id to a datatracker document name."""
    rfc = re.match(r"RFC\s+(\d+)", ref_id)
    if rfc:
        return f"rfc{rfc.group(1)}"
    if ref_id.startswith("draft-"):
        # datatracker accepts the un-versioned slug
        return re.sub(r"-\d+$", "", ref_id)
    return None


def fetch_datatracker(name: str, *, timeout: float = 15.0) -> dict[str, Any] | None:
    url = f"{DATATRACKER_BASE}?name={name}&format=json"
    try:
        with urllib.request.urlopen(url, timeout=timeout) as resp:  # nosec - public API
            data = json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        return {"error": str(exc)}
    objects = data.get("objects") or []
    if not objects:
        return None
    return objects[0]


# The document endpoint returns `states` as resource URIs
# ("/api/v1/doc/state/81/") rather than expanded objects. Resolve each
# unique URI once (the state vocabulary is small) and cache it.
_STATE_CACHE: dict[str, dict[str, Any] | None] = {}


def resolve_state(uri: str, *, timeout: float = 15.0) -> dict[str, Any] | None:
    if uri in _STATE_CACHE:
        return _STATE_CACHE[uri]
    url = f"https://datatracker.ietf.org{uri}?format=json"
    try:
        with urllib.request.urlopen(url, timeout=timeout) as resp:  # nosec - public API
            data: dict[str, Any] | None = json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
        data = None
    _STATE_CACHE[uri] = data
    return data


def state_to_stage(doc: dict[str, Any]) -> tuple[str | None, str | None]:
    """Pick the most informative state and map to DraftStage."""
    if doc.get("type", "").startswith("/api/v1/doc/doctypename/rfc"):
        return "rfc-published", "rfc"
    # the 'states' field is an array of dicts OR resource-URI strings
    states = doc.get("states") or []
    # prefer iesg state, then stream
    by_type: dict[str, str] = {}
    for s in states:
        if isinstance(s, str):
            s = resolve_state(s)
        if not isinstance(s, dict):
            continue
        st_type = (s.get("type") or "").split("/")[-2] if isinstance(s.get("type"), str) else ""
        slug = s.get("slug") or ""
        if st_type and slug:
            by_type[st_type] = slug
    # ordering of importance
    for key in ("draft-iesg", "draft-stream-ietf", "draft-stream-irtf", "draft"):
        slug = by_type.get(key)
        if not slug:
            continue
        stage, _ = DATATRACKER_TO_STAGE.get(slug, (None, 0))
        if stage:
            return stage, slug
    return None, None


def deterministic_refresh(refs: list[MatrixRef]) -> list[StageDelta]:
    deltas: list[StageDelta] = []
    seen: dict[str, dict[str, Any] | None] = {}
    for r in refs:
        dt_name = datatracker_name(r.ref_id)
        if not dt_name:
            continue
        if dt_name not in seen:
            seen[dt_name] = fetch_datatracker(dt_name)
            time.sleep(0.25)  # be nice to datatracker
        doc = seen[dt_name]
        if doc is None:
            deltas.append(
                StageDelta(
                    row_id=r.row_id,
                    dimension=r.dimension,
                    ref_id=r.ref_id,
                    encoded_stage=r.encoded_stage,
                    current_stage=None,
                    current_state_slug=None,
                    last_updated=None,
                    notes=[f"NOT FOUND on datatracker (queried name={dt_name})"],
                )
            )
            continue
        if "error" in doc:
            deltas.append(
                StageDelta(
                    row_id=r.row_id,
                    dimension=r.dimension,
                    ref_id=r.ref_id,
                    encoded_stage=r.encoded_stage,
                    current_stage=None,
                    current_state_slug=None,
                    last_updated=None,
                    notes=[f"network/parse error: {doc['error']}"],
                )
            )
            continue
        cur_stage, slug = state_to_stage(doc)
        last_updated = doc.get("time", "")[:10] or None
        if cur_stage and cur_stage != r.encoded_stage:
            deltas.append(
                StageDelta(
                    row_id=r.row_id,
                    dimension=r.dimension,
                    ref_id=r.ref_id,
                    encoded_stage=r.encoded_stage,
                    current_stage=cur_stage,
                    current_state_slug=slug,
                    last_updated=last_updated,
                    notes=[
                        f"matrix encodes stage='{r.encoded_stage}' but datatracker reports '{cur_stage}' (slug={slug})"
                    ],
                )
            )
    return deltas


# ---------------------------------------------------------------------------
# Library CSV cross-reference (sanity check that every refs[].id is also a
# known library row — useful for the trust-engine audit trail).
# ---------------------------------------------------------------------------
def latest_library_csv() -> Path | None:
    candidates = sorted(LIBRARY_DIR.glob("library_*.csv"))
    return candidates[-1] if candidates else None


def load_library_ref_ids(csv_path: Path) -> set[str]:
    """Return library reference_id values normalized to un-versioned slugs.

    Library entries store versioned slugs (`draft-ietf-tls-mlkem-07`); the
    matrix carries un-versioned slugs (`draft-ietf-tls-mlkem`). We strip
    trailing `-NN` so the cross-reference is canonical.
    """
    ids: set[str] = set()
    with csv_path.open() as f:
        reader = csv.DictReader(f)
        for row in reader:
            v = (row.get("reference_id") or row.get("referenceId") or "").strip()
            if not v:
                continue
            ids.add(v)
            if v.startswith("draft-"):
                ids.add(re.sub(r"-\d+$", "", v))
    return ids


def normalize_for_library(ref_id: str) -> str:
    rfc = re.match(r"RFC[\s-]+(\d+)$", ref_id)
    if rfc:
        return f"RFC-{rfc.group(1)}"
    if ref_id.startswith("draft-"):
        return re.sub(r"-\d+$", "", ref_id)
    return ref_id


# Some matrix refs use a short slug while the library row uses an expanded
# form (e.g. matrix `RFC 7030` ↔ library `IETF-RFC-7030-EST`). Keep this map
# tight — only add an alias when the canonical library slug is non-derivable.
REF_ID_ALIASES = {
    "RFC-7030": "IETF-RFC-7030-EST",
}


def cross_reference(refs: list[MatrixRef]) -> list[dict[str, str]]:
    csv_path = latest_library_csv()
    if not csv_path:
        return [{"row_id": "*", "ref_id": "*", "issue": "no library_*.csv found"}]
    known = load_library_ref_ids(csv_path)
    # Vendor / SDO specs that won't appear in the library CSV — exempt.
    EXEMPT_PREFIXES = ("TCG ", "3GPP ", "UEFI ", "IEEE ")
    out: list[dict[str, str]] = []
    seen: set[tuple[str, str]] = set()
    for r in refs:
        if r.ref_id.startswith(EXEMPT_PREFIXES):
            continue
        candidate = normalize_for_library(r.ref_id)
        # Library rows are inconsistent: some use "RFC-9909", some "RFC 9941".
        # Try both forms before flagging as missing.
        rfc_alt = None
        if candidate.startswith("RFC-"):
            rfc_alt = candidate.replace("RFC-", "RFC ", 1)
        elif candidate.startswith("RFC "):
            rfc_alt = candidate.replace("RFC ", "RFC-", 1)
        if candidate in known or (rfc_alt and rfc_alt in known):
            continue
        aliased = REF_ID_ALIASES.get(candidate)
        if aliased and aliased in known:
            continue
        key = (r.row_id, r.ref_id)
        if key in seen:
            continue
        seen.add(key)
        out.append(
            {
                "row_id": r.row_id,
                "dimension": r.dimension,
                "ref_id": r.ref_id,
                "issue": f"not in {csv_path.name} — add row or verify slug",
            }
        )
    return out


# ---------------------------------------------------------------------------
# Report rendering
# ---------------------------------------------------------------------------
def render_markdown(
    deltas: list[StageDelta],
    xref_issues: list[dict[str, str]],
) -> str:
    lines: list[str] = []
    lines.append("# Protocol Matrix — Enrichment Report")
    lines.append("")
    lines.append(f"Generated: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append("")
    lines.append("## Stage refresh (deterministic, IETF datatracker)")
    lines.append("")
    if not deltas:
        lines.append("No stage drift detected. All refs match datatracker.")
    else:
        lines.append("| Row | Dim | Ref | Encoded stage | Current stage | Slug | Last update |")
        lines.append("| --- | --- | --- | --- | --- | --- | --- |")
        for d in deltas:
            lines.append(
                f"| {d.row_id} | {d.dimension} | `{d.ref_id}` | "
                f"`{d.encoded_stage or '—'}` | `{d.current_stage or '—'}` | "
                f"`{d.current_state_slug or '—'}` | {d.last_updated or '—'} |"
            )
    lines.append("")
    lines.append("## Cross-reference vs library CSV")
    lines.append("")
    if not xref_issues:
        lines.append("Every refs[].id appears in the latest library CSV.")
    else:
        lines.append("| Row | Dim | Ref | Issue |")
        lines.append("| --- | --- | --- | --- |")
        for x in xref_issues:
            lines.append(
                f"| {x.get('row_id', '')} | {x.get('dimension', '')} | "
                f"`{x.get('ref_id', '')}` | {x.get('issue', '')} |"
            )
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append(
        "**Next step**: review `reports/protocol-matrix-updates.json`, then apply curated "
        "changes via `npx tsx scripts/apply-protocol-matrix-updates.ts --apply`. This script "
        "NEVER writes pqcProtocolMatrix.ts directly. Discovery of NEW candidate refs is a "
        "separate maintainer-side review process (not run in CI)."
    )
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    parser.add_argument(
        "--xref-only",
        action="store_true",
        help="Skip datatracker fetch; only run the library CSV cross-reference.",
    )
    parser.add_argument(
        "--matrix",
        type=Path,
        default=MATRIX_FILE,
        help="Path to pqcProtocolMatrix.ts",
    )
    parser.add_argument(
        "--reports-dir",
        type=Path,
        default=REPORTS_DIR,
        help="Directory to write JSON + markdown reports",
    )
    args = parser.parse_args()

    if not args.matrix.exists():
        print(f"ERROR: matrix file not found: {args.matrix}", file=sys.stderr)
        return 2

    refs = parse_matrix(args.matrix)
    print(f"Parsed {len(refs)} ref entries from {args.matrix.name}", file=sys.stderr)

    deltas: list[StageDelta] = []
    if not args.xref_only:
        deltas = deterministic_refresh(refs)

    xref_issues = cross_reference(refs)

    args.reports_dir.mkdir(parents=True, exist_ok=True)
    json_path = args.reports_dir / "protocol-matrix-updates.json"
    md_path = args.reports_dir / "protocol-matrix-changes.md"
    with json_path.open("w") as f:
        json.dump(
            {
                "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "deltas": [d.__dict__ for d in deltas],
                "xref_issues": xref_issues,
                # Kept for report-shape compatibility with the applier;
                # LLM-assisted discovery is a maintainer-side process, not CI.
                "llm_proposals": [],
            },
            f,
            indent=2,
        )
        f.write("\n")
    md_path.write_text(render_markdown(deltas, xref_issues))

    print(f"Wrote {json_path.relative_to(REPO_ROOT)}", file=sys.stderr)
    print(f"Wrote {md_path.relative_to(REPO_ROOT)}", file=sys.stderr)

    if deltas or xref_issues:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
