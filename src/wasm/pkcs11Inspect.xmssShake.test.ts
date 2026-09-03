// SPDX-License-Identifier: GPL-3.0-only
//
// Regression test for Commit 7 of the v3.2 audit-remediation plan: the 6
// missing XMSS-SHAKE parameter sets (CKP_XMSS 0x7-0xc). These ordinals are
// not literal PKCS#11 spec constants — the spec only typedefs
// CK_XMSS_PARAMETER_SET_TYPE as an opaque CK_ULONG — they come from RFC
// 8391's registered OID table, cross-checked against softhsm's own C++
// reference implementation (xmss-reference/params.c) AND the Rust engine's
// constants.rs, which independently agree on these 6 values.
//
// Live browser verification of this exact path was not possible: the
// Learn module's only live SHAKE-128 XMSS demo sends parameter-set 0x11
// (per softhsm/constants.ts's own migration comment), which is a genuinely
// different, unrelated parameter set on the real engine — a separate,
// pre-existing bug reported alongside this commit, out of scope to fix
// here. This test drives the real dispatch function directly instead.
import { describe, it, expect } from 'vitest'
import { describeParameterSetByKeyType } from './pkcs11Inspect'

const CKK_XMSS = 0x47

describe('CKP_XMSS SHAKE parameter-set names (Commit 7)', () => {
  const cases: Array<[number, string]> = [
    [0x7, 'CKP_XMSS_SHAKE_10_256'],
    [0x8, 'CKP_XMSS_SHAKE_16_256'],
    [0x9, 'CKP_XMSS_SHAKE_20_256'],
    [0xa, 'CKP_XMSS_SHAKE_10_512'],
    [0xb, 'CKP_XMSS_SHAKE_16_512'],
    [0xc, 'CKP_XMSS_SHAKE_20_512'],
  ]

  it.each(cases)('0x%s resolves to %s, not raw hex', (paramSet, expectedName) => {
    const entry = describeParameterSetByKeyType(CKK_XMSS, paramSet)
    expect(entry?.name).toBe(expectedName)
  })
})
