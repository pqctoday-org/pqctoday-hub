#!/usr/bin/env python3
"""Cross-check for src/data/acvp/aescbc_mct_full_test.json's construction_note.

The file's `_provenance.construction_note` claims:

    "The AESAVS 6.4 outer loop (key XOR the last key-length bits of the last outputs,
     IV = last output, next input = second-to-last output) was reproduced for all 100
     outer iterations of the six upstream cases with an independent AES (Python
     cryptography) before the subset was cut."

This script is that reproduction. Starting only from `resultsArray[0]`'s key / iv / pt (or
ct, decrypting), it runs the AESAVS section 6.4 CBC Monte Carlo loops and compares EVERY
field of EVERY one of the 100 outer iterations against the upstream `resultsArray`:

  encrypt, per outer iteration i:
      j = 0     : CT[0] = E(K, PT[0] XOR IV);          next PT = IV
      j = 1..999: CT[j] = E(K, PT[j] XOR CT[j-1]);     next PT = CT[j-2]... i.e. PT[j+1] = CT[j-1]
      emit (K, IV, PT[0], CT[999])
      K      <- K XOR (the last keyLen bits of CT[998] || CT[999])
      IV     <- CT[999]
      PT[0]  <- CT[998]
  decrypt: the same with D in place of E, plaintext blocks driving the chain.

CBC is built here from the raw single-block AES permutation plus an explicit XOR, so the
chaining is this script's own, not a library's CBC mode and not the hub's. Nothing from
src/services or src/wasm is read, and no PKCS#11 call is made.

Usage
    python3 scripts/acvp/crosscheck_aescbc_mct.py
    python3 scripts/acvp/crosscheck_aescbc_mct.py --offline --iterations 5
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter

from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

from acvp_upstream import (
    REPO_ROOT,
    UpstreamCache,
    UpstreamError,
    UpstreamFile,
    declared_upstream,
    load_manifest,
    manifest_entry,
)

VECTOR_ID = 'aescbc_mct_full_test'
BLOCK = 16


def ecb_block(key: bytes, block: bytes, encrypt: bool) -> bytes:
    """One raw AES block operation — the primitive, no mode, no padding."""
    cipher = Cipher(algorithms.AES(key), modes.ECB())  # noqa: S305 — deliberate primitive
    op = cipher.encryptor() if encrypt else cipher.decryptor()
    return op.update(block) + op.finalize()


def xor(a: bytes, b: bytes) -> bytes:
    return bytes(x ^ y for x, y in zip(a, b))


def cbc_encrypt_block(key: bytes, prev: bytes, pt: bytes) -> bytes:
    return ecb_block(key, xor(pt, prev), encrypt=True)


def cbc_decrypt_block(key: bytes, prev: bytes, ct: bytes) -> bytes:
    return xor(ecb_block(key, ct, encrypt=False), prev)


def next_key(key: bytes, last_outputs: list[bytes]) -> bytes:
    """AESAVS 6.4: key XOR the last len(key) bytes of the concatenated last outputs."""
    tail = b''.join(last_outputs)[-len(key):]
    return xor(key, tail)


def run_mct(key: bytes, iv: bytes, first_input: bytes, encrypt: bool, outer: int) -> list[dict]:
    """Returns one dict per outer iteration, in the upstream resultsArray field shape.

    AESAVS 6.4, written out rather than delegated to a library CBC mode:

      encrypt  inner j: CT[j] = E(K, PT[j] XOR (IV if j==0 else CT[j-1]))
                        PT[j+1] = IV if j == 0 else CT[j-1]
      decrypt  inner j: PT[j] = D(K, CT[j]) XOR (IV if j==0 else CT[j-1])
                        CT[j+1] = IV if j == 0 else PT[j-1]

    The decrypt next-input rule is the exact mirror of the encrypt one (the output two
    steps back, IV on the first step), not PT[j]; the naive PT[j] variant reproduces
    nothing and is what this check exists to catch.
    """
    results = []
    for _ in range(outer):
        inputs: list[bytes] = [first_input]
        outputs: list[bytes] = []
        for j in range(1000):
            if encrypt:
                chain = iv if j == 0 else outputs[j - 1]
                outputs.append(cbc_encrypt_block(key, chain, inputs[j]))
                inputs.append(iv if j == 0 else outputs[j - 1])
            else:
                chain = iv if j == 0 else inputs[j - 1]
                outputs.append(cbc_decrypt_block(key, chain, inputs[j]))
                inputs.append(iv if j == 0 else outputs[j - 1])
        last, second_last = outputs[-1], outputs[-2]
        if encrypt:
            results.append({'key': key, 'iv': iv, 'pt': first_input, 'ct': last})
        else:
            results.append({'key': key, 'iv': iv, 'ct': first_input, 'pt': last})
        key = next_key(key, [second_last, last])
        iv = last
        first_input = second_last
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

    print('\n== AES-CBC Monte Carlo Test (AESAVS 6.4) outer-loop cross-check ==')
    print(f'vector file      : {entry["path"]}')
    print(f'upstream commit  : {commit[:12]}')
    print(f'claim under test : {VECTOR_ID} _provenance.construction_note '
          '(100 outer iterations, six upstream cases)')

    cases = 0
    fields_ok = 0
    fields_total = 0
    failures: list[str] = []
    per_shape: Counter[str] = Counter()

    for path in sorted(declared):
        try:
            doc = cache.json(UpstreamFile(commit, path, declared[path]))
        except UpstreamError as exc:
            print(f'cannot obtain {path}: {exc}', file=sys.stderr)
            return 2
        for group in doc.get('testGroups') or []:
            if group.get('testType') != 'MCT':
                continue
            encrypt = group['direction'] == 'encrypt'
            for case in group['tests']:
                expected = case['resultsArray']
                n = min(args.iterations, len(expected))
                first = expected[0]
                key = bytes.fromhex(first['key'])
                iv = bytes.fromhex(first['iv'])
                seed_in = bytes.fromhex(first['pt'] if encrypt else first['ct'])
                got = run_mct(key, iv, seed_in, encrypt, n)
                cases += 1
                shape = f'{group["direction"]} keyLen {group["keyLen"]}'
                bad = False
                for i in range(n):
                    for field in ('key', 'iv', 'pt', 'ct'):
                        if field not in expected[i]:
                            continue
                        fields_total += 1
                        want = bytes.fromhex(expected[i][field])
                        if got[i][field] == want:
                            fields_ok += 1
                            per_shape[shape] += 1
                        else:
                            failures.append(
                                f'{shape} tcId {case["tcId"]} outer {i} {field}: '
                                f'{got[i][field].hex().upper()} != {expected[i][field]}'
                            )
                            bad = True
                    if bad:
                        break

    print(f'\nupstream MCT cases     : {cases}')
    print(f'resultsArray fields    : {fields_total}')
    print(f'reproduced             : {fields_ok}')
    print(f'failed                 : {len(failures)}')
    print('\nper (direction, keyLen):')
    for k, v in sorted(per_shape.items()):
        print(f'  {k:<22} {v}')
    for f in failures[:20]:
        print(f'  ! {f}')
    print(
        f'\nresult: {fields_ok}/{fields_total} resultsArray fields reproduced across '
        f'{cases} upstream MCT cases'
    )
    return 1 if failures else 0


if __name__ == '__main__':
    sys.exit(main())
