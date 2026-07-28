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
#
# AUDITED 2026-07-27 against the live authoritative slug lists (found while
# verifying Work-queue findings by hand — one sampled item, tls-1-3:pureKem,
# was reported as a stage DOWNGRADE that turned out to be entirely wrong):
#   curl 'https://datatracker.ietf.org/api/v1/doc/state/?type=draft-iesg&format=json'
#   curl 'https://datatracker.ietf.org/api/v1/doc/state/?type=draft-stream-ietf&format=json'
#   curl 'https://datatracker.ietf.org/api/v1/doc/state/?type=draft&format=json'
# Two real bug classes found, both silent — a missing/mistyped key never
# raises, `state_to_stage()`'s `.get(slug, (None, 0))` just falls through to
# a WEAKER state from a lower-priority state_type, silently understating
# real progress:
#   1. TYPO: this table had "wglc" — the real slug is "wg-lc" (hyphenated).
#      Every WG-Last-Call document fell through past 'draft-iesg' (idexists,
#      correctly unmapped so it doesn't shadow) all the way to the generic
#      'draft' type's "active", reporting individual-draft instead of
#      wg-last-call. Confirmed live: draft-ietf-tls-mlkem is really "In WG
#      Last Call" (verified against https://datatracker.ietf.org/doc/
#      draft-ietf-tls-mlkem/), not "individual-draft" as this bug reported —
#      it affected every row citing this ref: tls-1-3, dtls-1-3, fido-2,
#      macsec pureKem, plus mls's own wg-lc state and eap-radius's.
#   2. GAPS: adopt-wg / info / parked / waiting-for-implementation /
#      held-by-wg / chair-w / lc-req / review-e / goaheadw / defer / sub-pub
#      / rfc / auth-rm / ietf-rm were entirely absent — same silent
#      fall-through-to-"active" failure mode, just not yet caught by a
#      hand-verified sample. NOT added: idexists (would shadow the more
#      specific draft-stream-ietf state — draft-iesg is checked FIRST in
#      state_to_stage()'s loop, so mapping it breaks the exact fallthrough
#      this fix relies on) and nopubadw/nopubanw (Do-Not-Publish track has
#      no sane place on a forward-progress ladder — better to report
#      nothing than guess).
DATATRACKER_TO_STAGE: dict[str, tuple[str, int]] = {
    "pub": ("rfc-published", 7),
    "rfc": ("rfc-published", 7),           # generic 'draft' type, added 07-27
    "rfcqueue": ("rfc-editor-queue", 6),
    "ann": ("rfc-editor-queue", 6),
    "approved": ("rfc-editor-queue", 6),
    "sub-pub": ("iesg-submitted", 5),      # added 07-27 (draft-stream-ietf's own "submitted" slug)
    "iesg-eva": ("iesg-submitted", 5),
    "lc": ("ietf-last-call", 6),
    "lc-req": ("iesg-submitted", 5),       # added 07-27
    "review-e": ("iesg-submitted", 5),     # added 07-27
    "goaheadw": ("iesg-submitted", 5),     # added 07-27
    "defer": ("iesg-submitted", 5),        # added 07-27
    "watching": ("iesg-submitted", 5),
    "writeupw": ("iesg-submitted", 5),
    "pub-req": ("iesg-submitted", 5),
    "ad-eval": ("iesg-submitted", 5),
    "wg-lc": ("wg-last-call", 4),          # FIXED 07-27 — was "wglc" (typo'd, never matched)
    "waiting-for-implementation": ("wg-last-call", 4),  # added 07-27
    "chair-w": ("wg-last-call", 4),        # added 07-27
    "wg-doc": ("wg-document", 4),
    "adopt-wg": ("wg-document", 4),        # added 07-27
    "info": ("wg-document", 4),            # added 07-27
    "parked": ("wg-document", 4),          # added 07-27
    "held-by-wg": ("wg-document", 4),      # added 07-27
    "wg-cand": ("individual-draft", 3),
    "c-adopt": ("individual-draft", 3),
    "active": ("individual-draft", 3),
    "expired": ("experimental", 2),
    "dead": ("experimental", 2),
    "auth-rm": ("experimental", 2),        # added 07-27
    "ietf-rm": ("experimental", 2),        # added 07-27
    "repl": ("experimental", 2),           # superseded by deterministic_refresh's
                                            # own repl-chain-resolution special case
                                            # below — this entry is never actually
                                            # reached, kept as documentation only.
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


RELATED_DOCUMENT_BASE = "https://datatracker.ietf.org/api/v1/doc/relateddocument/"


def resolve_replacement(name: str, *, timeout: float = 15.0) -> str | None:
    """Given a draft name in datatracker state 'repl' (replaced), find the
    document name that replaced it.

    FIXED 2026-07-27 (real bug found while verifying Work-queue findings by
    hand: draft-miller-sshm-mldsa44-ed25519-composite-sigs is 'repl', and
    DATATRACKER_TO_STAGE used to map that straight to ('experimental', 2) —
    but 'repl' means the document was renamed/superseded, not that the work
    regressed to experimental. That draft is genuinely dead; the *work*
    continued under draft-miller-sshm-composite-sigs. Verified by hand
    against https://datatracker.ietf.org/doc/<name>/, then confirmed the
    real API shape: /api/v1/doc/relateddocument/?target__name=<name> returns
    the 'replaces' edge with the NEW document as `source`.

    Queries the live edge rather than guessing a naming pattern — replacement
    names are unrelated slugs as often as not (composite-sigs replacing
    mldsa44-ed25519-composite-sigs here is the friendly case).
    """
    url = f"{RELATED_DOCUMENT_BASE}?target__name={name}&format=json"
    try:
        with urllib.request.urlopen(url, timeout=timeout) as resp:  # nosec - public API
            data = json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
        return None
    for obj in data.get("objects") or []:
        if (obj.get("relationship") or "").rstrip("/").endswith("/replaces"):
            source = obj.get("source") or ""
            # "/api/v1/doc/document/draft-miller-sshm-composite-sigs/" -> name
            parts = [p for p in source.split("/") if p]
            if parts:
                return parts[-1]
    return None


def resolve_replaced_chain(name: str, *, max_hops: int = 3) -> tuple[str, list[str]]:
    """Follow a 'replaces' chain forward to the live document.

    Returns (final_name, chain) where chain lists every hop taken (empty if
    `name` itself wasn't replaced). Bounded at max_hops — a chain longer than
    that is almost certainly a cycle or datatracker data issue, not something
    to trust blindly.
    """
    chain: list[str] = []
    current = name
    for _ in range(max_hops):
        nxt = resolve_replacement(current)
        time.sleep(0.25)  # be nice to datatracker
        if not nxt or nxt == current:
            break
        chain.append(nxt)
        current = nxt
    return current, chain


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


# Ported from src/data/pqcProtocolMatrix.ts's own DRAFT_STAGE_LEVEL —
# ADDED 2026-07-27 for the multi-ref sibling-suppression fix below. NOT the
# same numbers as DATATRACKER_TO_STAGE's own (unused, dead-code) level
# column — those were never consumed by anything and are demonstrably
# inconsistent (wg-document/wg-last-call both '4', wg-last-call/iesg-
# submitted collide in places) precisely because nothing ever depended on
# them being right. This table is now load-bearing, so it's copied
# verbatim from the one place in the codebase whose numbers are actually
# used and tested (test_protocol_matrix_stage_level_matches_ts_source on
# the priv side keeps validators.py's own copy in sync with this same TS
# constant — same discipline applies here).
STAGE_LEVEL: dict[str, int] = {
    "none": 0, "na": 0, "identified": 1, "experimental": 2,
    "individual-draft": 3, "wg-document": 4, "wg-last-call": 4,
    "ietf-last-call": 5, "iesg-submitted": 6, "rfc-editor-queue": 6,
    "rfc-published": 7,
}


def _suppress_covered_downgrades(
    deltas: list["StageDelta"], resolved: dict[tuple[str, str, str], str]
) -> list["StageDelta"]:
    """CONSERVATIVE multi-ref fix (2026-07-27, per user decision — suppress
    only, never auto-generate a new proposed value from a sibling). Cell
    context: `resolved` holds EVERY ref's live stage that was successfully
    determined this run, keyed by (row_id, dimension, ref_id) — including
    refs that never produced a delta because their live stage already
    matched what's encoded. If a delta represents a DOWNGRADE (encoded
    level > proposed level) and some OTHER ref in the same (row_id,
    dimension) cell has a resolved live stage whose level already covers
    the encoded value, that downgrade is very likely the same false-
    positive class found live 3 times earlier this session (ssh:hybridKem,
    cose:pureKem/hybridKem/pureSig, jose:hybridKem) — suppress it rather
    than propose a regression a stronger sibling ref already contradicts.

    Deliberately does NOT do the reverse (never turns a sibling's higher
    stage into a new forward-moving proposal) — that generalization was
    considered and explicitly rejected: it's only validated against 2
    observed cell shapes, and a cell where two refs are genuinely a
    conjunction (both must land before the capability is real) would make
    that direction actively wrong. This function only ever REMOVES a
    delta, never adds one."""
    out: list["StageDelta"] = []
    for d in deltas:
        enc_level = STAGE_LEVEL.get(d.encoded_stage or "")
        cur_level = STAGE_LEVEL.get(d.current_stage or "")
        is_downgrade = enc_level is not None and cur_level is not None and cur_level < enc_level
        if is_downgrade:
            covered_by = None
            for (row_id, dim, ref_id), stage in resolved.items():
                if row_id != d.row_id or dim != d.dimension or ref_id == d.ref_id:
                    continue
                lvl = STAGE_LEVEL.get(stage or "")
                if lvl is not None and lvl >= enc_level:
                    covered_by = (ref_id, stage)
                    break
            if covered_by:
                print(
                    f"  note: {d.row_id}:{d.dimension} downgrade via {d.ref_id} "
                    f"({d.encoded_stage!r} -> {d.current_stage!r}) SUPPRESSED — sibling ref "
                    f"{covered_by[0]} already resolves to {covered_by[1]!r}, which covers the "
                    f"encoded value. Not a real regression."
                )
                continue
        out.append(d)
    return out


def deterministic_refresh(refs: list[MatrixRef]) -> list[StageDelta]:
    deltas: list[StageDelta] = []
    # ADDED 2026-07-27: every ref's successfully-resolved live stage, not
    # just the ones that produced a delta — _suppress_covered_downgrades
    # needs a MATCHING sibling's stage too, and a ref whose live stage
    # equals the encoded one never gets a StageDelta today.
    resolved_stage_by_ref: dict[tuple[str, str, str], str] = {}
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
        # Capture every non-repl ref's resolved stage for the sibling-
        # suppression pass below — repl refs are captured separately, after
        # their chain is resolved, since the naive cur_stage='experimental'
        # here would be exactly the misleading value that fix exists to
        # avoid propagating anywhere else.
        if cur_stage and slug != "repl":
            resolved_stage_by_ref[(r.row_id, r.dimension, r.ref_id)] = cur_stage
        # FIXED 2026-07-27: 'repl' (replaced) used to fall straight through
        # DATATRACKER_TO_STAGE to ('experimental', 2) — misleading, since
        # 'replaced' means a NEW document continues the work under a
        # different name, not that the work regressed. Resolve the real
        # successor and report ITS actual stage instead of guessing.
        if slug == "repl":
            final_name, chain = resolve_replaced_chain(dt_name)
            repl_stage = repl_slug = None
            if chain:
                replacement_doc = fetch_datatracker(final_name)
                repl_stage, repl_slug = (
                    state_to_stage(replacement_doc) if replacement_doc else (None, None)
                )
            if repl_stage:
                resolved_stage_by_ref[(r.row_id, r.dimension, r.ref_id)] = repl_stage
            if chain and repl_stage and repl_stage != r.encoded_stage:
                # Real, resolved successor with a real, different stage —
                # this is the only shape worth proposing as a correction.
                deltas.append(
                    StageDelta(
                        row_id=r.row_id,
                        dimension=r.dimension,
                        ref_id=r.ref_id,
                        encoded_stage=r.encoded_stage,
                        current_stage=repl_stage,
                        current_state_slug=repl_slug,
                        last_updated=last_updated,
                        notes=[
                            f"REF STALE: {dt_name} was replaced by {' -> '.join(chain)}, which reports "
                            f"stage='{repl_stage}' (slug={repl_slug}). Update the matrix's ref_id to "
                            f"'{final_name}' — not just the stage — so future runs track the live "
                            f"document directly."
                        ],
                    )
                )
            elif chain:
                # Resolved a successor but its stage matches what's already
                # encoded, or its own stage couldn't be determined — nothing
                # to PROPOSE (no false "PROPOSED: None"/no-op stage-correction
                # UI card), but the stale ref_id is still worth a line in the
                # log so it doesn't just vanish.
                print(
                    f"  note: {dt_name} was replaced by {' -> '.join(chain)} "
                    f"(no stage delta to propose — ref_id should still be updated)"
                )
            else:
                print(
                    f"  note: {dt_name} is 'repl' (replaced) but no successor could be resolved — "
                    f"verify by hand at https://datatracker.ietf.org/doc/{dt_name}/"
                )
            continue
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
    return _suppress_covered_downgrades(deltas, resolved_stage_by_ref)


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
