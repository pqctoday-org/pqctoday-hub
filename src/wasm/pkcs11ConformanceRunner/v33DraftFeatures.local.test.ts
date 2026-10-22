// SPDX-License-Identifier: AGPL-3.0-only
//
// The "v3.3 draft features" group against the REAL Rust wasm engine the hub
// ships. Two kinds of assertion:
//
//  1. Always: the group never reports a failure for a mechanism the engine
//     does not advertise ("not in this engine yet"), the features the shipped
//     engine already has (external µ, CKA_KEYS_REMAINING on HSS, the µ error
//     paths) pass, and the summary is separate from any v3.2 count.
//
//  2. ENGINE-UPDATE-GATED (marked "[after engine update]"): composite
//     round trips, the 30 LAMPS known-answer checks and the composite error
//     paths. These detect support at run time; on an engine without
//     CKM_COMP_KEM / CKM_COMP_SIG they call `skip()` (visible as skipped,
//     never as passed), and they run real crypto once the updated engine
//     bundle is copied in.
//
// Venue: `*.local.test.ts` (real wasm), run by `npm run gate:pkcs11` and
// `npm run test:local`.
import { describe, it, expect, beforeAll } from 'vitest'
import {
  getSoftHSMRustModule,
  hsm_initialize,
  hsm_getFirstSlot,
  hsm_initToken,
  hsm_openUserSession,
  type SoftHSMModule,
} from '@/wasm/softhsm'
import {
  hsm_detectV33Support,
  COMPOSITE_KEM_SETS,
  COMPOSITE_SIG_SETS,
  isBrainpoolSet,
  type V33Support,
} from '@/wasm/softhsm/v33'
import {
  runV33DraftFeatures,
  runExternalMuChecks,
  runKeysRemainingChecks,
  runV33ErrorPaths,
  runV33Kats,
  loadV33Vectors,
  summarizeV33,
  V33_DRAFT_GROUP_LABEL,
  type V33CheckRow,
} from './v33DraftFeatures'

describe('v3.3 draft features group (real Rust engine)', () => {
  let M: SoftHSMModule
  let hSession: number
  let support: V33Support

  beforeAll(async () => {
    M = (await getSoftHSMRustModule()) as SoftHSMModule
    hsm_initialize(M)
    const slot = hsm_initToken(M, hsm_getFirstSlot(M), '12345678', 'V33Test')
    hSession = hsm_openUserSession(M, slot, '12345678', 'user1234')
    support = hsm_detectV33Support(M, slot)
    console.info(
      `[v3.3] Cryptoki ${support.cryptokiVersion}; composite KEM ${support.compKem}, composite signatures ${support.compSig}, external mu ${support.externalMu}`
    )
  }, 60_000)

  const ctx = () => ({ M, hSession, support })

  it('the label is plan D1 verbatim', () => {
    expect(V33_DRAFT_GROUP_LABEL).toBe(
      'No OASIS v3.3 profile or test case exists yet. These checks test this engine against the v3.3 working draft and the IETF composite drafts.'
    )
  })

  it('the engine still reports Cryptoki 3.2 (v3.3 is a draft)', () => {
    expect(support.cryptokiVersion).toBe('3.2')
  })

  it('external µ: generated from a key and from TR, signed, verified with plain ML-DSA', () => {
    const rows = runExternalMuChecks(ctx())
    if (!support.externalMu) {
      expect(rows.every((r) => r.status === 'not-in-engine')).toBe(true)
      return
    }
    for (const r of rows) expect(r.status, `${r.title}: ${r.observed}`).toBe('pass')
  })

  it('CKA_KEYS_REMAINING (0x61c) counts down on HSS; XMSS is pass or not-in-engine, never fail', () => {
    const rows = runKeysRemainingChecks(ctx(), ['hss', 'xmss'])
    const hss = rows.find((r) => r.id.endsWith('.hss'))!
    expect(hss.status, hss.observed).toBe('pass')
    const xmss = rows.find((r) => r.id.endsWith('.xmss'))!
    expect(['pass', 'not-in-engine'], xmss.observed).toContain(xmss.status)
  }, 120_000)

  it('µ error paths return CKR_ARGUMENTS_BAD; composite ones are not-in-engine or pending until the update', async () => {
    const rows = runV33ErrorPaths(ctx(), await loadV33Vectors())
    for (const r of rows.filter((x) => x.id.includes('mu-gen'))) {
      if (support.externalMu) expect(r.status, r.observed).toBe('pass')
    }
    for (const r of rows) expect(r.status, `${r.title}: ${r.observed}`).not.toBe('fail')
  })

  it('no row ever fails for a mechanism the engine lacks; the summary is its own', async () => {
    const rows: V33CheckRow[] = await runV33DraftFeatures(ctx(), {
      kemSets: [COMPOSITE_KEM_SETS[3].ckp],
      sigSets: [COMPOSITE_SIG_SETS[8].ckp],
      keysRemainingFamilies: ['hss'],
    })
    for (const r of rows) {
      if (r.status === 'fail') {
        // A failure is only allowed where the engine advertises the mechanism.
        expect(support.compKem || support.compSig, `${r.title}: ${r.observed}`).toBe(true)
      }
    }
    const s = summarizeV33(rows)
    expect(s.pass + s.fail + s.notInEngine + s.notSupported + s.pendingEngine).toBe(rows.length)
  }, 120_000)

  // ── [after engine update] — real composite crypto ──────────────────────────

  it('[after engine update] 30 LAMPS known-answer checks: every non-brainpool set passes', async (t) => {
    if (!support.compKem || !support.compSig) return t.skip()
    const rows = runV33Kats(ctx(), await loadV33Vectors())
    expect(rows.length).toBe(30)
    for (const r of rows) {
      const set = [...COMPOSITE_KEM_SETS, ...COMPOSITE_SIG_SETS].find(
        (s) => s.ckpName === r.ckpName
      )!
      if (isBrainpoolSet(set)) expect(['pass', 'not-supported']).toContain(r.status)
      else expect(r.status, `${r.title}: ${r.observed}`).toBe('pass')
    }
  }, 300_000)

  it('[after engine update] composite round trips for all 30 sets', async (t) => {
    if (!support.compKem || !support.compSig) return t.skip()
    const rows = await runV33DraftFeatures(ctx(), { keysRemainingFamilies: ['hss'] })
    for (const r of rows.filter((x) => x.section === 'coverage' && x.ckpName)) {
      expect(['pass', 'not-supported'], `${r.title}: ${r.observed}`).toContain(r.status)
    }
  }, 600_000)

  it('[after engine update] confirmed composite error paths return the cited codes', async (t) => {
    if (!support.compKem) return t.skip()
    const rows = runV33ErrorPaths(ctx(), await loadV33Vectors())
    for (const r of rows) expect(r.status, `${r.title}: ${r.observed}`).not.toBe('fail')
    expect(rows.some((r) => r.status === 'pass' && r.id.includes('comp-kem'))).toBe(true)
  }, 120_000)
})
