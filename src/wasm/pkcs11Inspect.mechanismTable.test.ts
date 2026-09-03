// SPDX-License-Identifier: GPL-3.0-only
//
// Regression test for the mechanism-table consolidation (v3.2 audit
// remediation, Commit 2): pkcs11Inspect.ts used to hold its own private
// ~82-entry CKM_TABLE for the Log panel's decode drawer, separate from the
// comprehensive, drift-guarded MECH_TABLE (mechanismTable.ts) that feeds
// "Mechanism Discovery". The private copy drifted — missing most vendor
// mechanisms and mislabeling two standard ones (CKM_XMSS as
// CKM_XMSSMT_KEY_PAIR_GEN, CKM_AES_KEY_WRAP_KWP as CKM_AES_KEY_WRAP_PAD).
//
// pkcs11Inspect.ts now imports MECH_TABLE directly instead of keeping a
// second copy, so there is nothing left to drift. This test drives the
// actual public entry point (buildInspect) the Log panel calls, through
// the two mechanisms that were wrong under the old table, to lock in the
// fix at the real call site rather than just the table.
import { describe, it, expect } from 'vitest'
import { buildInspect } from './pkcs11Inspect'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'

const dummyModule = {} as SoftHSMModule

describe('pkcs11Inspect mechanism decoding (post mechanism-table consolidation)', () => {
  it('C_GetMechanismInfo decodes CKM_XMSS (0x4036) correctly, not the old CKM_XMSSMT_KEY_PAIR_GEN mislabel', () => {
    const result = buildInspect(dummyModule, 'C_GetMechanismInfo', [1, 0x4036], 0)
    const typeArg = result?.inputs[0]?.primitives?.find((p) => p.name === 'type')
    expect(typeArg?.value).toContain('CKM_XMSS (')
  })

  it('C_GetMechanismInfo decodes CKM_XMSSMT (0x4037) correctly', () => {
    const result = buildInspect(dummyModule, 'C_GetMechanismInfo', [1, 0x4037], 0)
    const typeArg = result?.inputs[0]?.primitives?.find((p) => p.name === 'type')
    expect(typeArg?.value).toContain('CKM_XMSSMT (')
  })

  it('C_GetMechanismInfo decodes CKM_AES_KEY_WRAP_KWP (0x210b) correctly, not the old 0x210a mislabel', () => {
    const result = buildInspect(dummyModule, 'C_GetMechanismInfo', [1, 0x210b], 0)
    const typeArg = result?.inputs[0]?.primitives?.find((p) => p.name === 'type')
    expect(typeArg?.value).toContain('CKM_AES_KEY_WRAP_KWP (')
  })

  it('C_GetMechanismInfo decodes the two vendor KEM key-gen mechanisms the old private table was missing', () => {
    // BIP32 derive — the single most-exercised vendor mechanism in the hub
    // (every HD Wallet demo run), absent from the old private CKM_TABLE.
    const bip32 = buildInspect(dummyModule, 'C_GetMechanismInfo', [1, 0x8000105b], 0)
    const bip32Type = bip32?.inputs[0]?.primitives?.find((p) => p.name === 'type')
    expect(bip32Type?.value).not.toMatch(/^0x/)
  })
})
