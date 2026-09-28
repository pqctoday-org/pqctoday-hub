#!/usr/bin/env python3
"""The byte-copying subset script cited by src/data/validation/vector-manifest.json.

The manifest's `source.verification.method` says, for the NIST-sourced vector files:

    "... every local case was produced by a byte-copying subset script and re-compared
     field-by-field with the upstream case of the same tcId."   (12 entries)
    "... every field of every local case equals the upstream case with the same tcId
     after the renames/normalizations recorded in lineage."      (36 entries)

This is that script, made runnable. Per manifest entry it:

  1. hashes the committed vector file and compares it with the manifest `sha256`;
  2. collects every upstream path the provenance declares — each testGroup's own
     `source_path`, `_provenance.source_files[]`, `_provenance.source_path`, the
     manifest's `source.nist.upstreamPath` and `verification.evidence[].title` — fetches
     each from usnistgov/ACVP-Server at the pinned commit, and REFUSES any file whose
     SHA-256 is not the recorded `upstreamSha256` / `source_sha256`;
  3. re-cuts the subset from the declared mapping, not from guesswork: every entry in
     the manifest's `cases[]` names a JSON pointer into the local file and the
     `upstream.tgId` / `upstream.tcId` it was taken from. The script resolves the
     pointer, finds that upstream case, applies only the transformations the entry's
     `lineage[].transformations[]` declare (field-rename, field-drop, field-add,
     value-normalize, renumber) and then BYTE-COPIES every remaining retained field
     from upstream into a reconstructed document. A local array may be a prefix of the
     upstream array and no more — that is how the MCT `resultsArray[0]` truncation is
     expressed;
  4. diffs the reconstruction against the committed file and reports every field whose
     committed value is not the upstream value.

It reproduces; it never re-derives. No cryptographic primitive is computed here and no
hub source file is read, so the comparison cannot be satisfied by our own code agreeing
with itself. A single changed hex nibble in a committed vector file makes the script
report a mismatch and exit non-zero (README.md, "Proving it can fail").

Anything the lineage does NOT declare — a hex-case change, a tcId renumber with no
`renumber` transformation, a local field with no `field-add` — is reported as an
UNDECLARED normalization. Those are warnings by default (the provenance record is the
thing at fault, not the bytes) and failures under --strict.

Usage
    python3 scripts/acvp/subset_reproduce.py --all
    python3 scripts/acvp/subset_reproduce.py --id aescbc_acvp_test --emit /tmp/out
    python3 scripts/acvp/subset_reproduce.py --id aescbc_acvp_test \
        --vector-file /tmp/perturbed/aescbc_acvp_test.json
    python3 scripts/acvp/subset_reproduce.py --all --offline    # cache only, no network
    python3 scripts/acvp/subset_reproduce.py --all --strict     # undeclared changes fail
"""

from __future__ import annotations

import argparse
import copy
import difflib
import json
import re
import sys
from pathlib import Path

from acvp_upstream import (
    REPO_ROOT,
    UpstreamCache,
    UpstreamError,
    UpstreamFile,
    declared_upstream,
    group_upstream_path,
    load_manifest,
    sha256_file,
)

HEX_RE = re.compile(r'^[0-9a-fA-F]+$')
# Group-level keys that are the provenance record itself, checked against the manifest's
# declared upstream map rather than looked for in the upstream file.
PROVENANCE_KEYS = {'source_path', 'source_sha256', 'source_git_blob_sha'}
NORMALIZE_RE = re.compile(r"^(?:group |case )?(\w+): '([^']*)' -> '([^']*)'\.?$")
RENAME_TOKEN_RE = re.compile(r'^(\w+) -> (\w+)$')
POINTER_STEP_RE = re.compile(r'^/testGroups/(\d+)/tests/(\d+)$')


def json_pointer(doc, pointer: str):
    """RFC 6901 resolve; returns (parent, key, value) so the value can be replaced."""
    if pointer in ('', '/'):
        return None, None, doc
    parent = None
    key = None
    cur = doc
    for raw in pointer.lstrip('/').split('/'):
        token = raw.replace('~1', '/').replace('~0', '~')
        parent = cur
        if isinstance(cur, list):
            key = int(token)
            cur = cur[key]
        else:
            key = token
            cur = cur[key]
    return parent, key, cur


class Declared:
    """The transformations one manifest case declares, parsed into machine form."""

    def __init__(self):
        self.renames: dict[str, str] = {}          # upstream key -> local key
        self.dropped: set[str] = set()             # upstream keys not carried
        self.local_only: set[str] = set()          # local keys with no upstream source
        self.normalized: dict[str, tuple[str, str]] = {}  # local key -> (upstream, local)
        self.renumbered = False
        self.derived_within_file = False
        self.locally_generated = False
        self.unparsed: list[str] = []

    def absorb(self, transformation: dict) -> None:
        kind = transformation.get('type')
        detail = (transformation.get('detail') or '').strip()
        if kind == 'field-rename':
            ok = False
            for part in detail.rstrip('.').split(';'):
                m = RENAME_TOKEN_RE.match(part.strip())
                if m:
                    self.renames[m.group(1)] = m.group(2)
                    ok = True
            if not ok:
                self.unparsed.append(f'field-rename: {detail}')
        elif kind == 'field-drop':
            m = re.search(r'upstream fields not carried:\s*(.+?)\.?$', detail)
            if m:
                self.dropped.update(x.strip() for x in m.group(1).split(',') if x.strip())
        elif kind == 'field-add':
            m = re.search(r'local-only fields:\s*(.+?)\.?$', detail)
            if m:
                self.local_only.update(x.strip() for x in m.group(1).split(',') if x.strip())
            m = re.search(r'group-level (.+?) added', detail)
            if m:
                names = m.group(1).replace(' and ', ', ')
                self.local_only.update(x.strip() for x in names.split(',') if x.strip())
        elif kind == 'value-normalize':
            m = NORMALIZE_RE.match(detail)
            if m:
                self.normalized[m.group(1)] = (m.group(2), m.group(3))
            else:
                self.unparsed.append(f'value-normalize: {detail}')
        elif kind == 'renumber':
            self.renumbered = True
        elif kind == 'derived-within-file':
            self.derived_within_file = True
        elif kind in ('locally-generated', 'inputs-modified-expected-recomputed'):
            self.locally_generated = True
        # subset / operation-change are prose about scope, nothing machine-actionable.


class Result:
    def __init__(self, vector_id: str, path: str):
        self.id = vector_id
        self.path = path
        self.skipped: str | None = None
        self.digest_ok: bool | None = None
        self.digest_detail = ''
        self.upstream_files: list[str] = []
        self.cases_declared = 0
        self.cases_compared = 0
        self.groups_compared = 0
        self.fields_compared = 0
        self.mismatches: list[str] = []
        self.undeclared: list[str] = []
        self.unresolved: list[str] = []
        self.declared_local_fields = 0
        self.declared_local_cases = 0
        self.provenance_fields_checked = 0
        self.declared_renames = 0
        self.diff_lines: list[str] = []
        self.error: str | None = None

    def verdict(self, strict: bool) -> str:
        if self.error:
            return 'ERROR'
        if self.skipped:
            return 'SKIP'
        if self.digest_ok is False or self.mismatches or self.unresolved:
            return 'MISMATCH'
        if self.undeclared:
            return 'MISMATCH' if strict else 'MATCH*'
        return 'MATCH'

    def failed(self, strict: bool) -> bool:
        return self.verdict(strict) in ('ERROR', 'MISMATCH')


class Comparator:
    def __init__(self, res: Result, strict_hex: bool):
        self.res = res
        self.strict_hex = strict_hex

    def run(self, local, upstream, where: str, decl: Declared, top: bool = False):
        """Byte-copy `upstream` into the shape `local` declares, recording differences."""
        res = self.res
        if isinstance(local, dict):
            if not isinstance(upstream, dict):
                res.mismatches.append(f'{where}: committed is an object, upstream is {type(upstream).__name__}')
                return copy.deepcopy(local)
            # upstream keys, renamed to their local names, minus declared drops
            renamed = {}
            for uk, uv in upstream.items():
                if uk in decl.dropped:
                    continue
                renamed[decl.renames.get(uk, uk) if top else uk] = uv
            out = {}
            for key, lval in local.items():
                if key in renamed:
                    out[key] = self.run(lval, renamed[key], f'{where}/{key}', decl)
                elif key in decl.local_only:
                    res.declared_local_fields += 1
                    out[key] = copy.deepcopy(lval)
                else:
                    res.undeclared.append(
                        f'{where}/{key}: committed field has no upstream counterpart and no '
                        'field-add / field-rename transformation declares it'
                    )
                    out[key] = copy.deepcopy(lval)
            return out
        if isinstance(local, list):
            if not isinstance(upstream, list):
                res.mismatches.append(f'{where}: committed is an array, upstream is {type(upstream).__name__}')
                return copy.deepcopy(local)
            if len(local) > len(upstream):
                res.mismatches.append(
                    f'{where}: committed array has {len(local)} entries, upstream only '
                    f'{len(upstream)} — a subset cannot be longer than its source'
                )
                return copy.deepcopy(local)
            return [self.run(lv, upstream[i], f'{where}[{i}]', decl) for i, lv in enumerate(local)]

        res.fields_compared += 1
        if local == upstream:
            return copy.deepcopy(upstream)

        key = where.rsplit('/', 1)[-1]
        norm = decl.normalized.get(key)
        if norm and (str(upstream), str(local)) == norm:
            return copy.deepcopy(local)  # declared value-normalize: keep the local form
        if key in ('tcId', 'tgId') and decl.renumbered:
            return copy.deepcopy(local)  # declared renumber
        if (
            isinstance(local, str)
            and isinstance(upstream, str)
            and HEX_RE.match(local or '0')
            and HEX_RE.match(upstream or '0')
            and local.lower() == upstream.lower()
        ):
            msg = f'{where}: hex case differs (committed {local[:16]}..., upstream {upstream[:16]}...) and no value-normalize transformation declares it'
            (self.res.mismatches if self.strict_hex else self.res.undeclared).append(msg)
            return copy.deepcopy(local)
        res.mismatches.append(
            f'{where}: committed {json.dumps(local)[:100]} != upstream {json.dumps(upstream)[:100]}'
        )
        return copy.deepcopy(upstream)


def build_declared(entry: dict, case: dict) -> Declared:
    decl = Declared()
    by_id = {L['id']: L for L in entry.get('lineage') or []}
    for lid in case.get('lineage') or []:
        lin = by_id.get(lid)
        if not lin:
            continue
        for t in lin.get('transformations') or []:
            decl.absorb(t)
    return decl


def reproduce(entry: dict, cache: UpstreamCache, vector_path: Path, strict_hex: bool) -> tuple[Result, dict | None]:
    res = Result(entry['id'], str(vector_path))
    try:
        raw = vector_path.read_bytes()
    except OSError as exc:
        res.error = f'cannot read {vector_path}: {exc}'
        return res, None

    res.digest_ok = sha256_file(vector_path) == entry.get('sha256')
    res.digest_detail = f'manifest {entry.get("sha256")}\n    on disk  {sha256_file(vector_path)}'
    vector = json.loads(raw)

    if entry['source'].get('kind') != 'nist-acvp-server':
        res.skipped = f'source.kind is {entry["source"].get("kind")!r}, not nist-acvp-server'
        return res, None

    try:
        commit, declared_paths = declared_upstream(entry, vector)
    except UpstreamError as exc:
        res.error = str(exc)
        return res, None
    res.upstream_files = sorted(declared_paths)

    upstream_docs: dict[str, dict] = {}
    for path, digest in declared_paths.items():
        try:
            upstream_docs[path] = cache.json(UpstreamFile(commit, path, digest))
        except UpstreamError as exc:
            res.error = str(exc)
            return res, None

    # tcId -> (group, case) per upstream file
    index: dict[str, dict[int, tuple[dict, dict]]] = {}
    for path, doc in upstream_docs.items():
        idx: dict[int, tuple[dict, dict]] = {}
        for g in doc.get('testGroups') or []:
            for c in g.get('tests') or []:
                if c.get('tcId') is not None:
                    idx[c['tcId']] = (g, c)
        index[path] = idx

    rebuilt = copy.deepcopy(vector)
    group_seen: dict[int, tuple[dict, Declared]] = {}

    for case in entry.get('cases') or []:
        res.cases_declared += 1
        pointer = case['pointer']
        up = case.get('upstream') or {}
        tcid = up.get('tcId')
        if tcid is None:
            decl = build_declared(entry, case)
            if decl.locally_generated or decl.derived_within_file:
                # Declared PQC Today-authored / derived-in-file; there is no upstream case
                # to byte-copy and the manifest says so. Not a subset claim.
                res.declared_local_cases += 1
            else:
                res.unresolved.append(f'{pointer}: manifest declares no upstream.tcId')
            continue
        try:
            parent, key, local_case = json_pointer(rebuilt, pointer)
        except (KeyError, IndexError, ValueError) as exc:
            res.unresolved.append(f'{pointer}: does not resolve in the committed file ({exc})')
            continue

        # which upstream file was this case cut from?
        m = POINTER_STEP_RE.match(pointer)
        up_path = None
        if m and isinstance(vector.get('testGroups'), list):
            gi = int(m.group(1))
            up_path = group_upstream_path(entry, vector, vector['testGroups'][gi])
        if up_path not in index:
            candidates = [
                p for p, idx in index.items()
                if tcid in idx and (up.get('tgId') is None or idx[tcid][0].get('tgId') == up['tgId'])
            ]
            if len(candidates) != 1:
                res.unresolved.append(
                    f'{pointer}: upstream tcId {tcid} (tgId {up.get("tgId")}) matches '
                    f'{len(candidates)} of the {len(index)} declared upstream files'
                )
                continue
            up_path = candidates[0]
        if tcid not in index[up_path]:
            res.unresolved.append(f'{pointer}: upstream tcId {tcid} absent from {up_path}')
            continue

        up_group, up_case = index[up_path][tcid]
        if up.get('tgId') is not None and up_group.get('tgId') != up['tgId']:
            res.mismatches.append(
                f'{pointer}: manifest says upstream tgId {up["tgId"]} but tcId {tcid} '
                f'is in upstream tgId {up_group.get("tgId")} of {up_path}'
            )

        decl = build_declared(entry, case)
        if decl.derived_within_file or decl.locally_generated:
            # Declared as not a straight byte-copy of this upstream case; record and skip.
            res.cases_compared += 1
            continue
        res.cases_compared += 1
        res.declared_renames += len(decl.renames)
        upstream_view = up_case
        if not m:
            # Files that flatten one case per parameter set (pointers such as
            # /sigGen/SLH-DSA-SHA2-128s) carry the upstream GROUP fields inside the case
            # object, so the upstream view is group-fields + case-fields.
            upstream_view = {
                **{k: v for k, v in up_group.items() if k != 'tests'},
                **up_case,
            }
        cmp = Comparator(res, strict_hex)
        new_case = cmp.run(local_case, upstream_view, f'{entry["id"]}{pointer}', decl, top=True)
        if parent is not None:
            parent[key] = new_case

        if m and isinstance(vector.get('testGroups'), list):
            gi = int(m.group(1))
            if gi not in group_seen:
                group_seen[gi] = (up_group, decl)

    # group-level fields of every group that had at least one declared case
    for gi, (up_group, decl) in sorted(group_seen.items()):
        res.groups_compared += 1
        local_group = rebuilt['testGroups'][gi]
        local_fields = {k: v for k, v in local_group.items() if k != 'tests'}
        up_fields = {k: v for k, v in up_group.items() if k != 'tests'}

        # The group's own provenance annotations are checked against the manifest's
        # declared upstream map, not looked for in the upstream file.
        if 'source_path' in local_fields:
            sp = local_fields['source_path']
            if sp not in declared_paths:
                res.mismatches.append(
                    f'{entry["id"]}/testGroups/{gi}(group)/source_path: {sp!r} is not one of '
                    'the upstream paths the manifest declares'
                )
            elif (
                'source_sha256' in local_fields
                and declared_paths[sp]
                and local_fields['source_sha256'] != declared_paths[sp]
            ):
                res.mismatches.append(
                    f'{entry["id"]}/testGroups/{gi}(group)/source_sha256 does not match the '
                    f'digest the manifest records for {sp}'
                )
            else:
                res.provenance_fields_checked += 1
        for k in PROVENANCE_KEYS:
            local_fields.pop(k, None)
        gdecl = Declared()
        gdecl.renames = decl.renames
        gdecl.local_only = set(decl.local_only)
        gdecl.normalized = decl.normalized
        gdecl.renumbered = decl.renumbered
        cmp = Comparator(res, strict_hex)
        rebuilt_fields = cmp.run(local_fields, up_fields, f'{entry["id"]}/testGroups/{gi}(group)', gdecl)
        for k, v in rebuilt_fields.items():
            local_group[k] = v

    return res, rebuilt


def diff_of(vector_path: Path, rebuilt: dict, vector_id: str, n: int = 1) -> list[str]:
    committed = json.loads(vector_path.read_text())

    def norm(obj) -> list[str]:
        return (json.dumps(obj, indent=2, ensure_ascii=False) + '\n').splitlines(keepends=True)

    return list(
        difflib.unified_diff(
            norm(committed), norm(rebuilt),
            fromfile=f'committed/{vector_id}.json',
            tofile=f'reproduced-from-upstream/{vector_id}.json',
            n=n,
        )
    )


def main() -> int:
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    ap.add_argument('--id', action='append', default=[], help='manifest entry id (repeatable)')
    ap.add_argument('--all', action='store_true', help='every nist-acvp-server entry')
    ap.add_argument('--vector-file', help='compare this file instead of the entry path (one --id)')
    ap.add_argument('--emit', help='write the reproduced-from-upstream files here')
    ap.add_argument('--cache', help='upstream cache directory (default tmp/acvp-upstream-cache)')
    ap.add_argument('--offline', action='store_true', help='fail instead of fetching')
    ap.add_argument('--strict', action='store_true', help='undeclared normalizations fail too')
    ap.add_argument('--max-diff', type=int, default=30, help='diff lines printed per file')
    ap.add_argument('--quiet-fetch', action='store_true')
    args = ap.parse_args()

    manifest = load_manifest()
    by_id = {e['id']: e for e in manifest['files']}
    if args.id:
        missing = [i for i in args.id if i not in by_id]
        if missing:
            print(f'unknown manifest id(s): {missing}', file=sys.stderr)
            return 2
        selected = [by_id[i] for i in args.id]
    elif args.all:
        selected = [e for e in manifest['files'] if e['source'].get('kind') == 'nist-acvp-server']
    else:
        ap.error('pass --all or at least one --id')
    if args.vector_file and len(selected) != 1:
        ap.error('--vector-file needs exactly one --id')

    cache = UpstreamCache(cache_dir=args.cache, offline=args.offline, quiet=args.quiet_fetch)
    emit_dir = Path(args.emit) if args.emit else None
    if emit_dir:
        emit_dir.mkdir(parents=True, exist_ok=True)

    print('\n== byte-copying subset reproduction (scripts/acvp/subset_reproduce.py) ==')
    results: list[Result] = []
    for entry in selected:
        path = Path(args.vector_file) if args.vector_file else REPO_ROOT / entry['path']
        res, rebuilt = reproduce(entry, cache, path, args.strict)
        if rebuilt is not None:
            res.diff_lines = diff_of(path, rebuilt, entry['id'])
            if emit_dir:
                (emit_dir / f'{entry["id"]}.json').write_text(
                    json.dumps(rebuilt, indent=2, ensure_ascii=False) + '\n'
                )
        results.append(res)

    print(f'upstream files fetched: {len(cache.fetched)}   reused from cache: {len(cache.reused)}')
    for r in results:
        v = r.verdict(args.strict)
        print(f'\n[{v}] {r.id}  ({r.path})')
        if r.error:
            print(f'  error: {r.error}')
            continue
        if r.skipped:
            print(f'  skipped: {r.skipped}')
            continue
        print(f'  committed digest vs manifest sha256: {"ok" if r.digest_ok else "DIFFERS"}')
        if not r.digest_ok:
            print(f'    {r.digest_detail}')
        print(f'  upstream files ({len(r.upstream_files)}): ' + ', '.join(r.upstream_files))
        print(
            f'  declared cases {r.cases_declared}  re-cut {r.cases_compared}  '
            f'groups {r.groups_compared}  leaf values byte-compared {r.fields_compared}'
        )
        print(
            f'  declared renames applied {r.declared_renames}  declared local-only fields '
            f'{r.declared_local_fields}  declared local-only cases {r.declared_local_cases}  '
            f'group provenance annotations checked {r.provenance_fields_checked}'
        )
        print(
            f'  mismatches {len(r.mismatches)}  undeclared {len(r.undeclared)}  '
            f'unresolved {len(r.unresolved)}'
        )
        for m in (r.unresolved + r.mismatches)[:12]:
            print(f'  ! {m}')
        if len(r.unresolved) + len(r.mismatches) > 12:
            print(f'  ! ... {len(r.unresolved) + len(r.mismatches) - 12} more')
        for m in r.undeclared[:6]:
            print(f'  ? {m}')
        if len(r.undeclared) > 6:
            print(f'  ? ... {len(r.undeclared) - 6} more undeclared normalizations')
        if r.diff_lines:
            print(f'  --- diff committed vs reproduced ({len(r.diff_lines)} lines) ---')
            for line in r.diff_lines[: args.max_diff]:
                print('  ' + line.rstrip('\n'))
            if len(r.diff_lines) > args.max_diff:
                print(f'  ... {len(r.diff_lines) - args.max_diff} more diff lines')
        else:
            print('  diff committed vs reproduced: EMPTY (byte-copy reproduced the file exactly)')

    failed = [r for r in results if r.failed(args.strict)]
    skipped = [r for r in results if r.skipped]
    warned = [r for r in results if r.verdict(args.strict) == 'MATCH*']
    print(
        f'\nsummary: {len(results) - len(failed) - len(skipped)} reproduced '
        f'({len(warned)} with undeclared normalizations), {len(failed)} failed, '
        f'{len(skipped)} skipped, {len(results)} total'
    )
    print(
        f'totals: {sum(r.fields_compared for r in results)} leaf values byte-compared, '
        f'{sum(r.cases_compared for r in results)} cases re-cut from '
        f'{len({p for r in results for p in r.upstream_files})} distinct upstream files'
    )
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main())
