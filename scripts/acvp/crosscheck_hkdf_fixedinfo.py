#!/usr/bin/env python3
"""Cross-check for src/data/acvp/hkdf_acvp_test.json's construction_note.

The file's `_provenance.construction_note` claims:

    "The local fixedInfo construction (partyId || ephemeralData for U then V, then L as a
     32-bit big-endian bit count) and IKM = Z || T were checked against all 1000
     single-expansion upstream cases with an independent HKDF (Python hashlib/hmac)
     before the subset was cut: 1000/1000 dispositions reproduced."

and `_provenance.local_operation` records what the hub actually asks PKCS#11 for:

    C_CreateObject(CKK_GENERIC_SECRET, CKA_DERIVE, CKA_VALUE = Z || T) then
    C_DeriveKey(CKM_HKDF_DERIVE, CK_HKDF_PARAMS{bExtract, bExpand,
    prfHashMechanism = the hmacAlg digest, CKF_HKDF_SALT_DATA = salt,
    pInfo = uPartyId || uEphemeralData || vPartyId || vEphemeralData || L
    (32-bit big-endian, bits)}) ... compared to dkm
    (AFT: must equal; VAL testPassed=false: must differ)

This script is that independent implementation. It writes RFC 5869 HKDF-Extract /
HKDF-Expand from the RFC over hmac + hashlib, builds fixedInfo exactly as the
`uPartyInfo||vPartyInfo||l` / `concatenation` pattern of SP 800-56Cr2 §4.1 with the party
fields in the order the local_operation records, and reproduces the DISPOSITION of every
single-expansion upstream case:

  * AFT                       -> the derived DKM must equal the upstream `dkm`
  * VAL with testPassed true   -> must equal
  * VAL with testPassed false  -> must NOT equal (the upstream case is a negative)

It reads NO hub source, so a hub bug in the fixedInfo layout cannot make this pass.

Usage
    python3 scripts/acvp/crosscheck_hkdf_fixedinfo.py
    python3 scripts/acvp/crosscheck_hkdf_fixedinfo.py --limit 50 --offline
"""

from __future__ import annotations

import argparse
import hashlib
import hmac
import sys
from collections import Counter

from acvp_upstream import UpstreamCache, UpstreamError, UpstreamFile, load_manifest, manifest_entry

VECTOR_ID = 'hkdf_acvp_test'

HASHES = {
    'SHA-1': hashlib.sha1,
    'SHA2-224': hashlib.sha224,
    'SHA2-256': hashlib.sha256,
    'SHA2-384': hashlib.sha384,
    'SHA2-512': hashlib.sha512,
    'SHA2-512/224': lambda d=b'': hashlib.new('sha512_224', d),
    'SHA2-512/256': lambda d=b'': hashlib.new('sha512_256', d),
    'SHA3-224': hashlib.sha3_224,
    'SHA3-256': hashlib.sha3_256,
    'SHA3-384': hashlib.sha3_384,
    'SHA3-512': hashlib.sha3_512,
}

SUPPORTED_PATTERN = 'uPartyInfo||vPartyInfo||l'
SUPPORTED_ENCODING = 'concatenation'


def hkdf_extract(salt: bytes, ikm: bytes, hash_ctor) -> bytes:
    """RFC 5869 §2.2."""
    return hmac.new(salt, ikm, hash_ctor).digest()


def hkdf_expand(prk: bytes, info: bytes, length: int, hash_ctor) -> bytes:
    """RFC 5869 §2.3."""
    hash_len = hash_ctor(b'').digest_size
    n = -(-length // hash_len)
    if n > 255:
        raise ValueError('HKDF-Expand: L too large for one expansion')
    out = b''
    t = b''
    for i in range(1, n + 1):
        t = hmac.new(prk, t + info + bytes([i]), hash_ctor).digest()
        out += t
    return out[:length]


def build_fixed_info(case: dict, l_bits: int) -> bytes:
    """uPartyInfo || vPartyInfo || l, concatenation encoding (SP 800-56Cr2 §5.8.2).

    uPartyInfo = uPartyId || uEphemeralData (the ephemeral part omitted when absent),
    vPartyInfo likewise, l = L as a 32-bit big-endian count of BITS.
    """
    out = b''
    for key in ('fixedInfoPartyU', 'fixedInfoPartyV'):
        party = case.get(key) or {}
        out += bytes.fromhex(party.get('partyId') or '')
        out += bytes.fromhex(party.get('ephemeralData') or '')
    return out + l_bits.to_bytes(4, 'big')


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--limit', type=int, help='stop after this many cases (smoke run)')
    ap.add_argument('--cache')
    ap.add_argument('--offline', action='store_true')
    args = ap.parse_args()

    entry = manifest_entry(VECTOR_ID, load_manifest())
    nist = entry['source']['nist']
    cache = UpstreamCache(cache_dir=args.cache, offline=args.offline)
    try:
        upstream = cache.json(
            UpstreamFile(nist['revision'], nist['upstreamPath'], nist['upstreamSha256'])
        )
    except UpstreamError as exc:
        print(f'cannot obtain the pinned upstream file: {exc}', file=sys.stderr)
        return 2

    print('\n== HKDF KDA (SP 800-56Cr2) fixedInfo / IKM cross-check ==')
    print(f'vector file      : {entry["path"]}')
    print(f'upstream         : {nist["upstreamPath"]} @ {nist["revision"][:12]}')
    print(f'claim under test : {VECTOR_ID} _provenance.construction_note (1000 dispositions)')

    total = passed = 0
    failures: list[str] = []
    skipped: Counter[str] = Counter()
    per_hash: Counter[str] = Counter()
    per_disposition: Counter[str] = Counter()

    for group in upstream['testGroups']:
        cfg = group.get('kdfConfiguration')
        if cfg is None or group.get('multiExpansion'):
            skipped['multi-expansion group (metadata only, notExecuted)'] += len(group['tests'])
            continue
        if cfg.get('fixedInfoPattern') != SUPPORTED_PATTERN or cfg.get('fixedInfoEncoding') != SUPPORTED_ENCODING:
            skipped[f'pattern {cfg.get("fixedInfoPattern")}/{cfg.get("fixedInfoEncoding")}'] += len(group['tests'])
            continue
        hash_name = cfg['hmacAlg']
        if hash_name not in HASHES:
            skipped[f'unknown hmacAlg {hash_name}'] += len(group['tests'])
            continue
        hash_ctor = HASHES[hash_name]
        l_bits = cfg['l']

        for case in group['tests']:
            if args.limit and total >= args.limit:
                break
            total += 1
            param = case['kdfParameter']
            salt = bytes.fromhex(param.get('salt') or '')
            ikm = bytes.fromhex(param['z']) + bytes.fromhex(param.get('t') or '')
            info = build_fixed_info(case, l_bits)
            try:
                prk = hkdf_extract(salt, ikm, hash_ctor)
                dkm = hkdf_expand(prk, info, l_bits // 8, hash_ctor)
            except Exception as exc:  # noqa: BLE001
                failures.append(f'tcId {case["tcId"]} ({hash_name}): {exc}')
                continue

            upstream_dkm = bytes.fromhex(case['dkm'])
            equal = dkm == upstream_dkm
            if group['testType'] == 'VAL' and case.get('testPassed') is False:
                want_equal, disposition = False, 'VAL negative (must differ)'
            elif group['testType'] == 'VAL':
                want_equal, disposition = True, 'VAL positive (must equal)'
            else:
                want_equal, disposition = True, 'AFT (must equal)'

            if equal == want_equal:
                passed += 1
                per_hash[hash_name] += 1
                per_disposition[disposition] += 1
            else:
                failures.append(
                    f'tcId {case["tcId"]} ({hash_name}, {disposition}): derived '
                    f'{dkm.hex().upper()[:40]} vs upstream {case["dkm"][:40]}'
                )

    print(f'\ncases cross-checked : {total}')
    print(f'dispositions reproduced : {passed}')
    print(f'failed              : {len(failures)}')
    print('skipped             : ' + ', '.join(f'{k} ({v})' for k, v in sorted(skipped.items())))
    print('\nper hmacAlg:')
    for k, v in sorted(per_hash.items()):
        print(f'  {k:<14} {v}')
    print('\nper disposition:')
    for k, v in sorted(per_disposition.items()):
        print(f'  {k:<28} {v}')
    for f in failures[:20]:
        print(f'  ! {f}')
    if len(failures) > 20:
        print(f'  ! ... {len(failures) - 20} more')
    print(f'\nresult: {passed}/{total} dispositions reproduced')
    return 1 if failures else 0


if __name__ == '__main__':
    sys.exit(main())
