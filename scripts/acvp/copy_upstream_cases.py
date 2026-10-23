#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-only
"""Byte-copy NIST ACVP-Server cases into a committed vector file, and record them.

A vector file under src/data/acvp carries a subset of a pinned upstream file. Cases
it could not run when it was cut are listed under `notExecuted` with a reason. When
the reason goes away (for example an engine gains the mechanism), this script copies
those cases from the SAME pinned upstream file into the vector file, so they run:

  * the upstream file is fetched at the pinned commit and its SHA-256 checked
    (acvp_upstream.UpstreamCache), exactly as subset_reproduce.py does;
  * each case is copied into the local testGroup with the same tgId, or into a new
    group carrying the upstream group fields when the file has no such group;
  * only the fields the file already carries are copied (the file's declared
    field-drops stay dropped), in upstream order, with upstream values unchanged;
  * the case leaves `notExecuted`;
  * vector-manifest.json gains one case record per copied case (cloned from a
    sibling record, with pointer, upstream ids and parameters rewritten), the
    lineage records name the new cases, a new group becomes a declared case
    container, a committed file that already embeds a copied case's values is
    named in the copy declaration, and the file's sha256 is updated.

Afterwards `subset_reproduce.py --id <file> --strict` must still report every case
byte-equal to upstream; this script runs it unless --no-verify is given.

Nothing here reads or trusts any hub implementation; it only moves bytes.

Usage:
  python3 scripts/acvp/copy_upstream_cases.py --id mldsa_sigver_depth_test \\
      --why no-pkcs11-hash-ml-dsa-mechanism
  python3 scripts/acvp/copy_upstream_cases.py --id slhdsa_sigver_sha2_test --tcids 16,23
  python3 scripts/acvp/copy_upstream_cases.py --id X --dry-run
"""
from __future__ import annotations

import argparse
import copy
import json
import subprocess
import sys
from datetime import date
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from acvp_upstream import (  # noqa: E402
    MANIFEST_PATH,
    REPO_ROOT,
    UpstreamCache,
    UpstreamError,
    UpstreamFile,
    declared_upstream,
    index_upstream_cases,
    sha256_bytes,
)

VECTOR_ROOT = REPO_ROOT / 'src/data/acvp'


def dumps(doc: dict) -> str:
    """The vector files' own serialization (2-space JSON, UTF-8, trailing newline)."""
    return json.dumps(doc, indent=2, ensure_ascii=False) + '\n'


def select_targets(vector: dict, whys: set[str], tcids: set[int] | None) -> list[dict]:
    """notExecuted rows to copy: by explicit tcId, else by reason."""
    rows = vector.get('notExecuted') or []
    if tcids:
        return [r for r in rows if r.get('tcId') in tcids]
    return [r for r in rows if r.get('why') in whys and r.get('tcId') is not None]


def case_fields(vector: dict, group: dict | None) -> list[str]:
    """Field names a copied case carries: the file's own convention for cases."""
    for g in ([group] if group else []) + (vector.get('testGroups') or []):
        for c in (g or {}).get('tests') or []:
            return list(c.keys())
    raise UpstreamError('the vector file has no case to take its field convention from')


def group_fields(vector: dict) -> list[str]:
    for g in vector.get('testGroups') or []:
        return [k for k in g.keys() if k != 'tests']
    raise UpstreamError('the vector file has no group to take its field convention from')


def project(src: dict, keys: list[str], what: str) -> dict:
    """src restricted to keys, in src's order; a key the file carries must exist upstream."""
    missing = [k for k in keys if k not in src]
    if missing:
        raise UpstreamError(f'{what}: upstream lacks field(s) the file carries: {missing}')
    return {k: v for k, v in src.items() if k in keys}


def copy_cases(entry: dict, vector: dict, upstream: dict[str, dict], targets: list[dict]) -> list[dict]:
    """Copy targets into vector in place. Returns one record per copied case:
    {pointer, tgId, tcId, group (local), case (local), new_group}."""
    index = {path: index_upstream_cases(doc) for path, doc in upstream.items()}
    groups = vector.setdefault('testGroups', [])
    copied: list[dict] = []
    for row in targets:
        tcid, tgid = row['tcId'], row.get('tgId')
        hits = [
            (p, idx[tcid]) for p, idx in index.items()
            if tcid in idx and (tgid is None or idx[tcid][0].get('tgId') == tgid)
        ]
        if len(hits) != 1:
            raise UpstreamError(f'tcId {tcid} (tgId {tgid}) found in {len(hits)} declared upstream files')
        _, (ug, uc) = hits[0]
        gi = next((i for i, g in enumerate(groups) if g.get('tgId') == ug.get('tgId')), None)
        new_group = gi is None
        if new_group:
            g = project(ug, group_fields(vector), f'tgId {ug.get("tgId")}')
            g['tests'] = []
            groups.append(g)
            gi = len(groups) - 1
        local = groups[gi]
        if any(c.get('tcId') == tcid for c in local.get('tests') or []):
            raise UpstreamError(f'tcId {tcid} is already in tgId {ug.get("tgId")}')
        case = project(uc, case_fields(vector, local if local.get('tests') else None), f'tcId {tcid}')
        local['tests'].append(case)
        copied.append({
            'pointer': f'/testGroups/{gi}/tests/{len(local["tests"]) - 1}',
            'tgId': ug.get('tgId'), 'tcId': tcid, 'group': local, 'case': case,
            'new_group': new_group,
        })
    done = {(c['tgId'], c['tcId']) for c in copied}
    vector['notExecuted'] = [
        r for r in vector.get('notExecuted') or [] if (r.get('tgId'), r.get('tcId')) not in done
    ]
    return copied


def _param(name: str, group: dict, case: dict, old):
    if name == 'messageBytes':
        return len(case.get('message') or '') // 2
    if name == 'contextBytes':
        return len(case.get('context') or '') // 2
    if name in case:
        return case[name]
    if name in group:
        return group[name]
    return old


def record_cases(entry: dict, copied: list[dict], when: str) -> None:
    """Append manifest case records and name them in the lineage."""
    cases = entry.setdefault('cases', [])
    lineage = {L['id']: L for L in entry.setdefault('lineage', [])}
    vid = entry['id']
    for c in copied:
        gi = int(c['pointer'].split('/')[2])
        sibling = next(
            (r for r in cases if r.get('pointer', '').startswith(f'/testGroups/{gi}/')),
            None,
        )
        template = sibling or (cases[0] if cases else None)
        if template is None:
            raise UpstreamError(f'{vid}: no manifest case record to clone')
        rec = copy.deepcopy(template)
        rec['caseId'] = f'{vid}#{c["pointer"]}'
        rec['pointer'] = c['pointer']
        rec['upstream'] = {'tgId': c['tgId'], 'tcId': c['tcId']}
        params = rec.get('parameters') or {}
        for k in list(params):
            params[k] = _param(k, c['group'], c['case'], params[k])
        if 'expectation' in rec and 'testPassed' in c['case']:
            rec['expectation'] = 'positive' if c['case']['testPassed'] else 'negative'
        if sibling is None:
            # a new group gets its own lineage record, cloned from the template's
            base_ids = template.get('lineage') or []
            new_ids = []
            for lid in base_ids:
                nid = f'{lid}-tg{c["tgId"]}'
                if nid not in lineage:
                    L = copy.deepcopy(lineage[lid])
                    L['id'] = nid
                    L['appliesTo'] = []
                    L['transformations'] = [
                        t for t in L.get('transformations') or [] if t.get('type') != 'subset'
                    ]
                    entry['lineage'].append(L)
                    lineage[nid] = L
                new_ids.append(nid)
            rec['lineage'] = new_ids
        for lid in rec.get('lineage') or []:
            L = lineage[lid]
            L.setdefault('appliesTo', []).append(rec['caseId'])
            L.setdefault('transformations', []).append({
                'type': 'subset',
                'detail': (
                    f'upstream tcId {c["tcId"]} (tgId {c["tgId"]}) byte-copied {when} by '
                    'scripts/acvp/copy_upstream_cases.py from the same pinned upstream file.'
                ),
            })
        cases.append(rec)
        # a new group is a new case container
        containers = entry.setdefault('caseContainers', [])
        cpointer = c['pointer'].rsplit('/', 1)[0]
        if not any(k.get('pointer') == cpointer for k in containers):
            containers.append({'pointer': cpointer, 'kind': 'array'})


def _fingerprint(v) -> bool:
    """The audit's notion of a value specific enough to identify a case
    (scripts/audit-validation-manifest.ts isFingerprint)."""
    return (isinstance(v, str) and len(v) >= 32 and all(ch.isalnum() or ch in '_.-' for ch in v)
            and len(set(v.lower())) >= 10)


def declare_copies(entry: dict, copied: list[dict], repo_root: Path = REPO_ROOT) -> None:
    """A copied case whose values another committed file already embeds (for example
    the full upstream prompt kept as a fixture) is named in that copy declaration."""
    for decl in entry.get('copies') or []:
        if decl.get('kind') != 'embedded-values':
            continue
        target = repo_root / decl['path']
        if not target.is_file():
            continue
        text = target.read_text(encoding='utf-8', errors='replace').lower()
        listed = decl.setdefault('cases', [])
        for c in copied:
            cid = f'{entry["id"]}#{c["pointer"]}'
            vals = [c['case'].get(f) for f in decl.get('fields') or []]
            if cid not in listed and any(_fingerprint(v) and v.lower() in text for v in vals):
                listed.append(cid)


def annotate_policy(vector: dict, copied: list[dict], when: str, note: str) -> None:
    """Append an 'Update <date>' sentence to _provenance.subset_policy, the file's own
    account of what it carries and why (the convention earlier updates used)."""
    prov = vector.setdefault('_provenance', {})
    ids = ', '.join(f'tg{c["tgId"]}/tc{c["tcId"]}' for c in copied)
    text = (f'Update {when}: the {len(copied)} upstream case(s) {ids} formerly listed in '
            f'notExecuted are byte-copied into this file by scripts/acvp/copy_upstream_cases.py.')
    if note:
        text += f' {note}'
    prov['subset_policy'] = f'{prov.get("subset_policy", "")} {text}'.strip()


def prettier(paths: list[Path]) -> None:
    """Format as the commit hook will (the vector files are not prettier-ignored), so
    the sha256 recorded below is the sha256 of the committed bytes."""
    subprocess.run(['npx', '--no-install', 'prettier', '--write', '--log-level', 'warn',
                    *map(str, paths)], cwd=REPO_ROOT, check=True)


def run(vid: str, whys: set[str], tcids: set[int] | None, cache: UpstreamCache,
        dry_run: bool, manifest_path: Path = MANIFEST_PATH, vector_root: Path = VECTOR_ROOT,
        when: str | None = None, fmt=prettier, note: str | None = None,
        repo_root: Path = REPO_ROOT) -> list[dict]:
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    entry = next((e for e in manifest.get('files') or [] if e.get('id') == vid), None)
    if entry is None:
        raise UpstreamError(f'no manifest entry {vid!r}')
    path = vector_root / Path(entry['path']).name
    vector = json.loads(path.read_text(encoding='utf-8'))
    commit, declared = declared_upstream(entry, vector)
    upstream = {p: cache.json(UpstreamFile(commit, p, d)) for p, d in declared.items()}
    targets = select_targets(vector, whys, tcids)
    copied = copy_cases(entry, vector, upstream, targets)
    if not copied or dry_run:
        return copied
    when = when or date.today().isoformat()
    record_cases(entry, copied, when)
    declare_copies(entry, copied, repo_root)
    if note is not None:
        annotate_policy(vector, copied, when, note)
    path.write_text(dumps(vector), encoding='utf-8')
    if fmt:
        fmt([path])
    entry['sha256'] = sha256_bytes(path.read_bytes())
    manifest_path.write_text(dumps(manifest), encoding='utf-8')
    if fmt:
        fmt([manifest_path])
    return copied


def main() -> int:
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    ap.add_argument('--id', action='append', default=[], required=True,
                    help='manifest entry id (repeatable)')
    ap.add_argument('--why', action='append', default=[],
                    help='copy the notExecuted rows with this reason (repeatable)')
    ap.add_argument('--tcids', help='comma-separated tcIds to copy instead of --why')
    ap.add_argument('--cache', help='upstream cache directory (default tmp/acvp-upstream-cache)')
    ap.add_argument('--offline', action='store_true', help='fail instead of fetching')
    ap.add_argument('--dry-run', action='store_true', help='report what would be copied')
    ap.add_argument('--no-verify', action='store_true', help='skip subset_reproduce afterwards')
    ap.add_argument('--note', help='appended to the Update sentence in _provenance.subset_policy '
                    '(why the cases can run now)')
    args = ap.parse_args()
    if not args.why and not args.tcids:
        ap.error('give --why or --tcids')
    tcids = {int(x) for x in args.tcids.split(',')} if args.tcids else None
    cache = UpstreamCache(Path(args.cache) if args.cache else None, offline=args.offline, quiet=True)
    status = 0
    for vid in args.id:
        try:
            copied = run(vid, set(args.why), tcids, cache, args.dry_run, note=args.note or '')
        except UpstreamError as exc:
            print(f'{vid}: ERROR {exc}', file=sys.stderr)
            status = 1
            continue
        verb = 'would copy' if args.dry_run else 'copied'
        ids = ', '.join(f'tg{c["tgId"]}/tc{c["tcId"]}' for c in copied) or 'nothing'
        print(f'{vid}: {verb} {len(copied)} case(s): {ids}')
    if status == 0 and not args.dry_run and not args.no_verify:
        cmd = [sys.executable, str(HERE / 'subset_reproduce.py'), '--strict', '--quiet-fetch']
        for vid in args.id:
            cmd += ['--id', vid]
        if args.cache:
            cmd += ['--cache', args.cache]
        status = subprocess.call(cmd)
    return status


if __name__ == '__main__':
    raise SystemExit(main())
