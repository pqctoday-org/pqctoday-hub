#!/usr/bin/env python3
"""Cross-check for src/data/acvp/sha_mct_full_test.json's construction_note.

The file's `_provenance.construction_note` claims:

    "Both MCT versions were reproduced for all 100 outer iterations of all 10 upstream
     cases with Python hashlib before the subset was cut (alternate: A||B||C
     truncated/zero-padded to the initial seed length)."

This script is that reproduction. It runs the ACVP hash Monte Carlo outer/inner loops from
the specification over `hashlib` alone and compares EVERY one of the 100 outer results of
every upstream MCT case, for all three loop shapes the ten pinned samples register:

  SHA-2 standard  : A=B=C=seed; 1000x { MD = H(A||B||C); A,B,C = B,C,MD }; emit MD; seed=MD
  SHA-2 alternate : same, but the message is A||B||C truncated or zero-padded (on the
                    right) to the INITIAL seed length before hashing
  SHA-3 (2.0)     : MD = seed; 1000x { MD = H(MD) }; emit MD; seed = MD

It reads NO hub source and computes no PKCS#11 call: only hashlib and the loop from the
spec. If the hub's MCT loop were wrong, the digests here would still match upstream and
the hub's own run would not — which is exactly the independence the claim needs.

Usage
    python3 scripts/acvp/crosscheck_sha_mct.py
    python3 scripts/acvp/crosscheck_sha_mct.py --offline --iterations 5
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from collections import Counter

from acvp_upstream import (
    REPO_ROOT,
    UpstreamCache,
    UpstreamError,
    UpstreamFile,
    declared_upstream,
    load_manifest,
    manifest_entry,
)

VECTOR_ID = 'sha_mct_full_test'

HASHES = {
    'SHA-1': 'sha1',
    'SHA2-224': 'sha224',
    'SHA2-256': 'sha256',
    'SHA2-384': 'sha384',
    'SHA2-512': 'sha512',
    'SHA2-512/224': 'sha512_224',
    'SHA2-512/256': 'sha512_256',
    'SHA3-224': 'sha3_224',
    'SHA3-256': 'sha3_256',
    'SHA3-384': 'sha3_384',
    'SHA3-512': 'sha3_512',
}


def digest(alg: str, data: bytes) -> bytes:
    return hashlib.new(HASHES[alg], data).digest()


def fit(data: bytes, length: int) -> bytes:
    """Truncate or right-zero-pad to `length` bytes (the alternate MCT message rule)."""
    return data[:length] if len(data) >= length else data + bytes(length - len(data))


def mct_sha2(alg: str, seed: bytes, outer: int, alternate: bool) -> list[bytes]:
    seed_len = len(seed)
    results = []
    for _ in range(outer):
        a = b = c = seed
        md = seed
        for _ in range(1000):
            msg = a + b + c
            if alternate:
                msg = fit(msg, seed_len)
            md = digest(alg, msg)
            a, b, c = b, c, md
        results.append(md)
        seed = md
    return results


def mct_sha3(alg: str, seed: bytes, outer: int) -> list[bytes]:
    results = []
    md = seed
    for _ in range(outer):
        for _ in range(1000):
            md = digest(alg, md)
        results.append(md)
    return results


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--iterations', type=int, default=100, help='outer iterations (default 100)')
    ap.add_argument('--cache')
    ap.add_argument('--offline', action='store_true')
    args = ap.parse_args()

    entry = manifest_entry(VECTOR_ID, load_manifest())
    local = json.loads((REPO_ROOT / entry['path']).read_text())
    commit, declared = declared_upstream(entry, local)
    cache = UpstreamCache(cache_dir=args.cache, offline=args.offline)

    print('\n== SHA Monte Carlo Test outer-loop cross-check ==')
    print(f'vector file      : {entry["path"]}')
    print(f'upstream commit  : {commit[:12]}   upstream files: {len(declared)}')
    print(f'claim under test : {VECTOR_ID} _provenance.construction_note '
          f'(both MCT versions, 100 outer iterations, 10 cases)')

    cases = 0
    outer_ok = 0
    outer_total = 0
    failures: list[str] = []
    per_version: Counter[str] = Counter()

    for path in sorted(declared):
        try:
            doc = cache.json(UpstreamFile(commit, path, declared[path]))
        except UpstreamError as exc:
            print(f'cannot obtain {path}: {exc}', file=sys.stderr)
            return 2
        for group in doc.get('testGroups') or []:
            if group.get('testType') != 'MCT':
                continue
            alg = group.get('hashAlg') or doc.get('algorithm')
            if alg not in HASHES:
                failures.append(f'{path} tgId {group.get("tgId")}: unknown hashAlg {alg!r}')
                continue
            version = group.get('mctVersion') or ('n/a' if alg.startswith('SHA3') else 'standard')
            for case in group['tests']:
                seed = bytes.fromhex(case['msg'])
                expected = [bytes.fromhex(r['md']) for r in case['resultsArray']]
                n = min(args.iterations, len(expected))
                if alg.startswith('SHA3'):
                    got = mct_sha3(alg, seed, n)
                    shape = f'SHA-3 ({version})'
                else:
                    got = mct_sha2(alg, seed, n, alternate=(version == 'alternate'))
                    shape = f'SHA-2 {version}'
                cases += 1
                for i in range(n):
                    outer_total += 1
                    if got[i] == expected[i]:
                        outer_ok += 1
                        per_version[shape] += 1
                    else:
                        failures.append(
                            f'{path} tcId {case["tcId"]} ({alg}, {shape}) outer {i}: '
                            f'{got[i].hex().upper()[:40]} != {expected[i].hex().upper()[:40]}'
                        )
                        break

    print(f'\nupstream MCT cases   : {cases}')
    print(f'outer results checked: {outer_total}')
    print(f'reproduced           : {outer_ok}')
    print(f'failed               : {len(failures)}')
    print('\nper MCT shape:')
    for k, v in sorted(per_version.items()):
        print(f'  {k:<22} {v}')
    for f in failures[:20]:
        print(f'  ! {f}')
    print(f'\nresult: {outer_ok}/{outer_total} outer iterations reproduced across {cases} upstream MCT cases')
    return 1 if failures else 0


if __name__ == '__main__':
    sys.exit(main())
