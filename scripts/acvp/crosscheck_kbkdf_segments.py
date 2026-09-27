#!/usr/bin/env python3
"""Cross-check for src/data/acvp/kbkdf_acvp_test.json's construction_note.

The file's `_provenance.construction_note` claims:

    "The data-parameter layouts were checked with an independent SP 800-108
     implementation (Python hmac/cryptography CMAC) against every byte-aligned upstream
     case of the executed macModes (4680 cases, all reproduced; double pipeline
     A(0) = fixedData) before the subset was cut."

and `_provenance.local_operation` records the PKCS#11 `CK_PRF_DATA_PARAM` segment layout
the hub builds per `counterLocation`:

    ITERATION_VARIABLE (counter mode: CK_SP800_108_COUNTER_FORMAT big-endian,
    counterLength bits; feedback / double pipeline: NULL, the K(i-1) / A(i) chaining
    value), COUNTER where the upstream places it, BYTE_ARRAY = fixedData (split at
    breakLocation for "middle")

This script is that independent implementation. It writes SP 800-108r1 §4.1 (counter),
§4.2 (feedback) and §4.3 (double pipeline) from the standard, laying the PRF input out in
exactly the order the CK_PRF_DATA_PARAM segment list above produces for each
`counterLocation`, and compares the derived keyOut with the upstream `keyOut` for every
byte-aligned upstream case of the macModes the hub executes.

It reads NO hub source: the PRF is hmac/hashlib for the HMAC modes and
cryptography's CMAC for the AES-CMAC modes, and the loop structure comes from the
publication, not from src/services or src/wasm. If the hub's segment layout were wrong,
the reproduced keyOut would not match the upstream value.

Usage
    python3 scripts/acvp/crosscheck_kbkdf_segments.py
    python3 scripts/acvp/crosscheck_kbkdf_segments.py --limit 500 --offline
"""

from __future__ import annotations

import argparse
import hashlib
import hmac
import sys
from collections import Counter

from acvp_upstream import UpstreamCache, UpstreamError, UpstreamFile, load_manifest, manifest_entry

VECTOR_ID = 'kbkdf_acvp_test'

# PKCS#11 v3.2 Table 196 PRFs — the macModes the hub can actually execute. CMAC-TDES,
# HMAC-SHA2-512/224 and HMAC-SHA2-512/256 have no PKCS#11 PRF type and are not carried
# (kbkdf_acvp_test.json _provenance.subset_policy, "Not used:").
HMAC_HASHES = {
    'HMAC-SHA-1': hashlib.sha1,
    'HMAC-SHA2-224': hashlib.sha224,
    'HMAC-SHA2-256': hashlib.sha256,
    'HMAC-SHA2-384': hashlib.sha384,
    'HMAC-SHA2-512': hashlib.sha512,
    'HMAC-SHA3-224': hashlib.sha3_224,
    'HMAC-SHA3-256': hashlib.sha3_256,
    'HMAC-SHA3-384': hashlib.sha3_384,
    'HMAC-SHA3-512': hashlib.sha3_512,
}
CMAC_KEY_BYTES = {'CMAC-AES128': 16, 'CMAC-AES192': 24, 'CMAC-AES256': 32}
EXECUTED_MAC_MODES = set(HMAC_HASHES) | set(CMAC_KEY_BYTES)


def prf(mac_mode: str, key: bytes, data: bytes) -> bytes:
    if mac_mode in HMAC_HASHES:
        return hmac.new(key, data, HMAC_HASHES[mac_mode]).digest()
    from cryptography.hazmat.primitives.ciphers import algorithms
    from cryptography.hazmat.primitives.cmac import CMAC

    want = CMAC_KEY_BYTES[mac_mode]
    if len(key) != want:
        raise ValueError(f'{mac_mode} needs a {want}-byte key, got {len(key)}')
    c = CMAC(algorithms.AES(key))
    c.update(data)
    return c.finalize()


def counter_bytes(i: int, counter_length_bits: int) -> bytes:
    """CK_SP800_108_COUNTER_FORMAT: big-endian, counterLength bits wide."""
    if counter_length_bits == 0:
        return b''
    return i.to_bytes(counter_length_bits // 8, 'big')


def lay_out(location: str, counter: bytes, chaining: bytes, fixed: bytes, break_bytes: int) -> bytes:
    """The CK_PRF_DATA_PARAM segment order for one counterLocation.

    `chaining` is the ITERATION_VARIABLE payload: empty in counter mode (where the
    iteration variable IS the counter), K(i-1) in feedback mode, A(i) in double pipeline.
    """
    if location == 'before iterator':
        return counter + chaining + fixed
    if location == 'before fixed data':
        return chaining + counter + fixed
    if location == 'after fixed data':
        return chaining + fixed + counter
    if location == 'middle fixed data':
        return chaining + fixed[:break_bytes] + counter + fixed[break_bytes:]
    if location == 'none':
        return chaining + fixed
    raise ValueError(f'unhandled counterLocation {location!r}')


def derive(group: dict, case: dict) -> bytes:
    mac_mode = group['macMode']
    location = group['counterLocation']
    ctr_bits = group.get('counterLength') or 0
    out_bits = group['keyOutLength']
    key_in = bytes.fromhex(case['keyIn'])
    fixed = bytes.fromhex(case['fixedData'])
    iv = bytes.fromhex(case.get('iv') or '')
    break_bytes = (case.get('breakLocation') or 0) // 8

    h = len(prf(mac_mode, key_in, b'')) * 8
    n = -(-out_bits // h)
    out = b''

    if group['kdfMode'] == 'counter':
        for i in range(1, n + 1):
            data = lay_out(location, counter_bytes(i, ctr_bits), b'', fixed, break_bytes)
            out += prf(mac_mode, key_in, data)
    elif group['kdfMode'] == 'feedback':
        k = iv
        for i in range(1, n + 1):
            data = lay_out(location, counter_bytes(i, ctr_bits), k, fixed, break_bytes)
            k = prf(mac_mode, key_in, data)
            out += k
    elif group['kdfMode'] == 'double pipeline iteration':
        a = fixed  # A(0) = fixedData (this file's construction_note)
        for i in range(1, n + 1):
            a = prf(mac_mode, key_in, a)
            data = lay_out(location, counter_bytes(i, ctr_bits), a, fixed, break_bytes)
            out += prf(mac_mode, key_in, data)
    else:
        raise ValueError(f'unhandled kdfMode {group["kdfMode"]!r}')

    return out[: out_bits // 8]


def byte_aligned(group: dict, case: dict) -> bool:
    if group['keyOutLength'] % 8:
        return False
    if (group.get('counterLength') or 0) % 8:
        return False
    if group['counterLocation'] == 'middle fixed data' and (case.get('breakLocation') or 0) % 8:
        return False
    return True


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--limit', type=int, help='stop after this many cases (smoke run)')
    ap.add_argument('--cache')
    ap.add_argument('--offline', action='store_true')
    args = ap.parse_args()

    manifest = load_manifest()
    entry = manifest_entry(VECTOR_ID, manifest)
    nist = entry['source']['nist']
    cache = UpstreamCache(cache_dir=args.cache, offline=args.offline)
    try:
        upstream = cache.json(
            UpstreamFile(nist['revision'], nist['upstreamPath'], nist['upstreamSha256'])
        )
    except UpstreamError as exc:
        print(f'cannot obtain the pinned upstream file: {exc}', file=sys.stderr)
        return 2

    print('\n== KBKDF (SP 800-108r1) CK_PRF_DATA_PARAM layout cross-check ==')
    print(f'vector file      : {entry["path"]}')
    print(f'upstream         : {nist["upstreamPath"]} @ {nist["revision"][:12]}')
    print(f'claim under test : {VECTOR_ID} _provenance.construction_note (4680 cases)')

    total = passed = 0
    failures: list[str] = []
    skipped: Counter[str] = Counter()
    per_mode: Counter[str] = Counter()
    per_shape: Counter[tuple[str, str]] = Counter()

    for group in upstream['testGroups']:
        if group['macMode'] not in EXECUTED_MAC_MODES:
            skipped[f'macMode not executed: {group["macMode"]}'] += len(group['tests'])
            continue
        for case in group['tests']:
            if not byte_aligned(group, case):
                skipped['not byte-aligned'] += 1
                continue
            if args.limit and total >= args.limit:
                break
            total += 1
            try:
                got = derive(group, case)
            except Exception as exc:  # noqa: BLE001 — report, do not mask
                failures.append(f'tcId {case["tcId"]} ({group["kdfMode"]}/{group["macMode"]}): {exc}')
                continue
            want = bytes.fromhex(case['keyOut'])
            if got == want:
                passed += 1
                per_mode[group['macMode']] += 1
                per_shape[(group['kdfMode'], group['counterLocation'])] += 1
            else:
                failures.append(
                    f'tcId {case["tcId"]} ({group["kdfMode"]}/{group["macMode"]}/'
                    f'{group["counterLocation"]}/ctr{group["counterLength"]}): '
                    f'derived {got.hex().upper()[:48]} != upstream {case["keyOut"][:48]}'
                )

    print(f'\ncases cross-checked : {total}')
    print(f'reproduced          : {passed}')
    print(f'failed              : {len(failures)}')
    print('skipped             : ' + ', '.join(f'{k} ({v})' for k, v in sorted(skipped.items())))
    print('\nper macMode:')
    for k, v in sorted(per_mode.items()):
        print(f'  {k:<16} {v}')
    print('\nper (kdfMode, counterLocation):')
    for (m, loc), v in sorted(per_shape.items()):
        print(f'  {m:<28} {loc:<20} {v}')
    for f in failures[:20]:
        print(f'  ! {f}')
    if len(failures) > 20:
        print(f'  ! ... {len(failures) - 20} more')
    print(f'\nresult: {passed}/{total} reproduced')
    return 1 if failures else 0


if __name__ == '__main__':
    sys.exit(main())
