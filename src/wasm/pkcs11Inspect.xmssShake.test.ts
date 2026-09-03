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
// The RFC 8391 "_512" sets (0x04-0x06, 0x0a-0x0c) were deliberately removed
// on 2026-09-03: SP 800-208 footnote 5 does not approve them, the default
// Rust engine does not implement them, and nothing in the hub generated them.
//
// When this test was written the Learn module's SHAKE-128 demo still sent
// parameter-set 0x11 — a different set entirely — so the path could not be
// verified live. That bug is now fixed: the demo sends 0x07 and the engine
// reports 1,023 remaining signatures (height 10), matching its label. This
// test remains as the fast unit-level guard on the dispatch function; the
// cross-file ordinal check lives in ckpConstantAgreement.test.ts.
import { describe, it, expect } from 'vitest'
import { describeParameterSetByKeyType } from './pkcs11Inspect'

const CKK_XMSS = 0x47

describe('CKP_XMSS SHAKE parameter-set names (Commit 7)', () => {
  const cases: Array<[number, string]> = [
    [0x7, 'CKP_XMSS_SHAKE_10_256'],
    [0x8, 'CKP_XMSS_SHAKE_16_256'],
    [0x9, 'CKP_XMSS_SHAKE_20_256'],
  ]

  it.each(cases)('0x%s resolves to %s, not raw hex', (paramSet, expectedName) => {
    const entry = describeParameterSetByKeyType(CKK_XMSS, paramSet)
    expect(entry?.name).toBe(expectedName)
  })
})
